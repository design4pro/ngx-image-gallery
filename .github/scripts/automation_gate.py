#!/usr/bin/env python3
"""Validate stage-gated automation evidence on pull requests."""

from __future__ import annotations

import json
import os
import re
import ssl
import sys
import urllib.error
import urllib.request
from dataclasses import dataclass
from pathlib import Path
from typing import Any

try:
    import certifi  # type: ignore[import-not-found]
except ImportError:  # pragma: no cover - GitHub-hosted runners use system trust.
    certifi = None


REQUIRED_MARKERS = ("PM ASSIGNMENT", "DEV COMPLETE", "QA RESULT: PASS")
SHA_MARKERS = ("DEV COMPLETE", "QA RESULT: PASS")
SHA_RE = r"\b[0-9a-fA-F]{7,40}\b"
EVIDENCE_BOUNDARY = "\n\n--- ceo-orchestrator-evidence-boundary ---\n\n"
SSL_CONTEXT: ssl.SSLContext | None = None


@dataclass
class GateResult:
    ok: bool
    errors: list[str]
    warnings: list[str]


@dataclass
class PullRequestEvidence:
    head_sha: str
    text: str


def request_json(url: str, token: str, payload: dict | None = None) -> Any:
    global SSL_CONTEXT
    if SSL_CONTEXT is None:
        SSL_CONTEXT = ssl.create_default_context(cafile=certifi.where() if certifi else None)

    data = None if payload is None else json.dumps(payload).encode()
    request = urllib.request.Request(
        url,
        data=data,
        headers={
            "Accept": "application/vnd.github+json",
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
            "X-GitHub-Api-Version": "2022-11-28",
        },
    )
    try:
        with urllib.request.urlopen(request, timeout=30, context=SSL_CONTEXT) as response:
            return json.loads(response.read().decode() or "{}")
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode(errors="replace")
        raise RuntimeError(f"GitHub API request failed: {exc.code} {detail}") from exc


def request_json_items(url: str, token: str) -> list[dict]:
    items: list[dict] = []
    page = 1
    separator = "&" if "?" in url else "?"

    while True:
        batch = request_json(f"{url}{separator}per_page=100&page={page}", token)
        if not isinstance(batch, list):
            raise RuntimeError(f"Expected a JSON list from {url}.")
        items.extend(batch)
        if len(batch) < 100:
            return items
        page += 1


def load_event(path: Path) -> dict:
    return json.loads(path.read_text())


def resolve_pr_number(event: dict) -> int:
    pull_request = event.get("pull_request")
    if pull_request and pull_request.get("number"):
        return int(pull_request["number"])

    issue = event.get("issue") or {}
    if issue.get("pull_request") and issue.get("number"):
        return int(issue["number"])

    env_value = os.environ.get("PR_NUMBER")
    if env_value:
        return int(env_value)

    raise RuntimeError("Unable to resolve pull request number from event or PR_NUMBER.")


def collect_pr_evidence(repository: str, pr_number: int, token: str) -> PullRequestEvidence:
    api_base = f"https://api.github.com/repos/{repository}"
    pr = request_json(f"{api_base}/pulls/{pr_number}", token)
    comments = request_json_items(f"{api_base}/issues/{pr_number}/comments", token)
    reviews = request_json_items(f"{api_base}/pulls/{pr_number}/reviews", token)
    chunks = [pr.get("body") or ""]
    chunks.extend(comment.get("body") or "" for comment in comments)
    chunks.extend(review.get("body") or "" for review in reviews)
    return PullRequestEvidence(head_sha=pr.get("head", {}).get("sha") or "", text=EVIDENCE_BOUNDARY.join(chunks))


def unresolved_review_threads(repository: str, pr_number: int, token: str) -> list[dict]:
    owner, repo = repository.split("/", 1)
    query = """
    query($owner: String!, $repo: String!, $number: Int!, $cursor: String) {
      repository(owner: $owner, name: $repo) {
        pullRequest(number: $number) {
          reviewThreads(first: 100, after: $cursor) {
            nodes {
              id
              isResolved
              isOutdated
              path
              line
              comments(first: 1) {
                nodes {
                  url
                  body
                  author {
                    login
                  }
                }
              }
            }
            pageInfo {
              hasNextPage
              endCursor
            }
          }
        }
      }
    }
    """
    unresolved: list[dict] = []
    cursor = None

    while True:
        payload = request_json(
            "https://api.github.com/graphql",
            token,
            {
                "query": query,
                "variables": {"owner": owner, "repo": repo, "number": pr_number, "cursor": cursor},
            },
        )
        graphql_errors = payload.get("errors")
        if graphql_errors:
            raise RuntimeError(f"GitHub GraphQL returned errors: {json.dumps(graphql_errors)}")

        review_threads = (
            payload.get("data", {})
            .get("repository", {})
            .get("pullRequest", {})
            .get("reviewThreads", {})
        )
        nodes = review_threads.get("nodes", [])
        unresolved.extend(
            node for node in nodes if not node.get("isResolved") and not node.get("isOutdated")
        )
        page_info = review_threads.get("pageInfo") or {}
        if not page_info.get("hasNextPage"):
            return unresolved
        cursor = page_info.get("endCursor")


def extract_marker_shas(text: str, marker: str) -> list[str]:
    shas: list[str] = []
    marker_start = 0
    while True:
        marker_index = text.find(marker, marker_start)
        if marker_index == -1:
            return shas
        next_marker_indexes = [
            text.find(next_marker, marker_index + len(marker))
            for next_marker in REQUIRED_MARKERS
            if next_marker != marker
        ]
        next_marker_indexes = [index for index in next_marker_indexes if index != -1]
        boundary_index = text.find(EVIDENCE_BOUNDARY, marker_index + len(marker))
        block_end_candidates = [*next_marker_indexes]
        if boundary_index != -1:
            block_end_candidates.append(boundary_index)
        block_end = min(block_end_candidates) if block_end_candidates else len(text)
        block = text[marker_index:block_end]
        shas.extend(match.group(0).lower() for match in re.finditer(SHA_RE, block))
        marker_start = marker_index + len(marker)


def sha_matches_head(candidate: str, head_sha: str) -> bool:
    candidate = candidate.lower()
    head_sha = head_sha.lower()
    return head_sha.startswith(candidate) or candidate.startswith(head_sha)


def validate_evidence(
    evidence: PullRequestEvidence,
    validation_result: str | None,
    unresolved: list[dict],
) -> GateResult:
    errors: list[str] = []
    warnings: list[str] = []

    if validation_result and validation_result != "success":
        errors.append(f"PR Validation result is {validation_result}, expected success.")

    present_markers = {marker for marker in REQUIRED_MARKERS if marker in evidence.text}
    for marker in REQUIRED_MARKERS:
        if marker not in present_markers:
            errors.append(f"Missing required automation marker: {marker}")

    if not evidence.head_sha:
        errors.append("Unable to resolve pull request head SHA.")
    else:
        for marker in SHA_MARKERS:
            if marker not in present_markers:
                continue
            marker_shas = extract_marker_shas(evidence.text, marker)
            if not marker_shas:
                errors.append(f"Missing commit SHA evidence for marker: {marker}")
            elif not any(sha_matches_head(sha, evidence.head_sha) for sha in marker_shas):
                errors.append(
                    f"{marker} SHA evidence does not match PR head {evidence.head_sha}: "
                    f"{', '.join(sorted(set(marker_shas)))}"
                )

    for thread in unresolved:
        comment = (thread.get("comments", {}).get("nodes") or [{}])[0]
        url = comment.get("url") or thread.get("id")
        author = (comment.get("author") or {}).get("login") or "unknown"
        errors.append(f"Unresolved review thread from {author}: {url}")

    if not unresolved:
        warnings.append("No unresolved review threads found.")

    return GateResult(ok=not errors, errors=errors, warnings=warnings)


def validate(repository: str, pr_number: int, validation_result: str | None, token: str) -> GateResult:
    evidence = collect_pr_evidence(repository, pr_number, token)
    unresolved = unresolved_review_threads(repository, pr_number, token)
    return validate_evidence(evidence, validation_result, unresolved)


def main() -> int:
    repository = os.environ["GITHUB_REPOSITORY"]
    event_path = Path(os.environ["GITHUB_EVENT_PATH"])
    validation_result = os.environ.get("VALIDATION_RESULT")
    token = os.environ.get("GH_TOKEN") or os.environ.get("GITHUB_TOKEN")
    if not token:
        raise RuntimeError("GH_TOKEN or GITHUB_TOKEN is required.")

    event = load_event(event_path)
    pr_number = resolve_pr_number(event)
    result = validate(repository, pr_number, validation_result, token)

    print(json.dumps({"ok": result.ok, "errors": result.errors, "warnings": result.warnings}, indent=2))
    return 0 if result.ok else 1


if __name__ == "__main__":
    raise SystemExit(main())
