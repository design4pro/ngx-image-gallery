#!/usr/bin/env python3
"""Validate stage-gated automation evidence on pull requests."""

from __future__ import annotations

import json
import os
import ssl
import sys
import urllib.error
import urllib.request
from dataclasses import dataclass
from pathlib import Path

try:
    import certifi  # type: ignore[import-not-found]
except ImportError:  # pragma: no cover - GitHub-hosted runners use system trust.
    certifi = None


REQUIRED_MARKERS = ("PM ASSIGNMENT", "DEV COMPLETE", "QA RESULT: PASS")
SSL_CONTEXT = ssl.create_default_context(cafile=certifi.where() if certifi else None)


@dataclass
class GateResult:
    ok: bool
    errors: list[str]
    warnings: list[str]


def request_json(url: str, token: str, payload: dict | None = None) -> dict:
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


def collect_text(repository: str, pr_number: int, token: str) -> str:
    api_base = f"https://api.github.com/repos/{repository}"
    pr = request_json(f"{api_base}/pulls/{pr_number}", token)
    comments = request_json(f"{api_base}/issues/{pr_number}/comments?per_page=100", token)
    reviews = request_json(f"{api_base}/pulls/{pr_number}/reviews?per_page=100", token)
    chunks = [pr.get("body") or ""]
    chunks.extend(comment.get("body") or "" for comment in comments)
    chunks.extend(review.get("body") or "" for review in reviews)
    return "\n\n".join(chunks)


def unresolved_review_threads(repository: str, pr_number: int, token: str) -> list[dict]:
    owner, repo = repository.split("/", 1)
    query = """
    query($owner: String!, $repo: String!, $number: Int!) {
      repository(owner: $owner, name: $repo) {
        pullRequest(number: $number) {
          reviewThreads(first: 100) {
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
          }
        }
      }
    }
    """
    payload = request_json(
        "https://api.github.com/graphql",
        token,
        {"query": query, "variables": {"owner": owner, "repo": repo, "number": pr_number}},
    )
    nodes = (
        payload.get("data", {})
        .get("repository", {})
        .get("pullRequest", {})
        .get("reviewThreads", {})
        .get("nodes", [])
    )
    return [node for node in nodes if not node.get("isResolved") and not node.get("isOutdated")]


def validate(repository: str, pr_number: int, validation_result: str | None, token: str) -> GateResult:
    errors: list[str] = []
    warnings: list[str] = []

    if validation_result and validation_result != "success":
        errors.append(f"PR Validation result is {validation_result}, expected success.")

    text = collect_text(repository, pr_number, token)
    for marker in REQUIRED_MARKERS:
        if marker not in text:
            errors.append(f"Missing required automation marker: {marker}")

    unresolved = unresolved_review_threads(repository, pr_number, token)
    for thread in unresolved:
        comment = (thread.get("comments", {}).get("nodes") or [{}])[0]
        url = comment.get("url") or thread.get("id")
        author = (comment.get("author") or {}).get("login") or "unknown"
        errors.append(f"Unresolved review thread from {author}: {url}")

    if not unresolved:
        warnings.append("No unresolved review threads found.")

    return GateResult(ok=not errors, errors=errors, warnings=warnings)


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
