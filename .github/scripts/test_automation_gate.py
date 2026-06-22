#!/usr/bin/env python3
"""Offline dry-run tests for the automation gate."""

from __future__ import annotations

import unittest

import automation_gate


HEAD = "6b83a066cd0bdc4edf00a38f70666d758e811dfa"


def evidence(body: str, head_sha: str = HEAD) -> automation_gate.PullRequestEvidence:
    return automation_gate.PullRequestEvidence(head_sha=head_sha, text=body)


def unresolved_thread() -> dict:
    return {
        "comments": {
            "nodes": [
                {
                    "url": "https://github.com/example/repo/pull/1#discussion_r1",
                    "author": {"login": "reviewer"},
                }
            ]
        }
    }


class AutomationGateDryRunTest(unittest.TestCase):
    def assert_gate_passes(self, body: str) -> None:
        result = automation_gate.validate_evidence(evidence(body), "success", [])
        self.assertTrue(result.ok, result.errors)

    def assert_gate_fails(self, body: str, expected: str, unresolved: list[dict] | None = None) -> None:
        result = automation_gate.validate_evidence(evidence(body), "success", unresolved or [])
        self.assertFalse(result.ok)
        self.assertTrue(any(expected in error for error in result.errors), result.errors)

    def test_merge_ready_gate_passes(self) -> None:
        self.assert_gate_passes(
            """
            PM ASSIGNMENT

            DEV COMPLETE
            Commit SHA: 6b83a066cd0bdc4edf00a38f70666d758e811dfa

            QA RESULT: PASS
            Commit SHA: 6b83a066
            """
        )

    def test_review_needed_proposal_without_assignment_fails(self) -> None:
        result = automation_gate.validate_evidence(
            evidence(
                """
                [Proposal] Add shareable URLs
                Labels: status: review needed
                """
            ),
            "success",
            [],
        )
        self.assertFalse(result.ok)
        self.assertIn("Missing required automation marker: PM ASSIGNMENT", result.errors)
        self.assertFalse(any("Missing commit SHA evidence" in error for error in result.errors))

    def test_stale_dev_complete_sha_fails(self) -> None:
        self.assert_gate_fails(
            """
            PM ASSIGNMENT

            DEV COMPLETE
            Commit SHA: 1111111

            QA RESULT: PASS
            Commit SHA: 6b83a066
            """,
            "DEV COMPLETE SHA evidence does not match PR head",
        )

    def test_stale_qa_pass_sha_fails(self) -> None:
        self.assert_gate_fails(
            """
            PM ASSIGNMENT

            DEV COMPLETE
            Commit SHA: 6b83a066

            QA RESULT: PASS
            Commit SHA: 1111111
            """,
            "QA RESULT: PASS SHA evidence does not match PR head",
        )

    def test_later_unrelated_sha_does_not_satisfy_stale_marker(self) -> None:
        result = automation_gate.validate_evidence(
            evidence(
                automation_gate.EVIDENCE_BOUNDARY.join(
                    [
                        """
                        PM ASSIGNMENT

                        DEV COMPLETE
                        Commit SHA: 6b83a066

                        QA RESULT: PASS
                        Commit SHA: 1111111
                        """,
                        """
                        Bot review mentions current head 6b83a066cd0bdc4edf00a38f70666d758e811dfa.
                        """,
                    ]
                )
            ),
            "success",
            [],
        )
        self.assertFalse(result.ok)
        self.assertTrue(
            any("QA RESULT: PASS SHA evidence does not match PR head" in error for error in result.errors),
            result.errors,
        )

    def test_long_marker_block_uses_full_comment_section(self) -> None:
        result = automation_gate.validate_evidence(
            evidence(
                f"""
                PM ASSIGNMENT

                DEV COMPLETE
                {"details " * 700}
                Commit SHA: 6b83a066

                QA RESULT: PASS
                Commit SHA: 6b83a066
                """
            ),
            "success",
            [],
        )
        self.assertTrue(result.ok, result.errors)

    def test_unresolved_review_thread_fails(self) -> None:
        result = automation_gate.validate_evidence(
            evidence(
                """
                PM ASSIGNMENT

                DEV COMPLETE
                Commit SHA: 6b83a066

                QA RESULT: PASS
                Commit SHA: 6b83a066
                """
            ),
            "success",
            [unresolved_thread()],
        )
        self.assertFalse(result.ok)
        self.assertIn("Unresolved review thread from reviewer", result.errors[0])

    def test_failed_validation_result_fails(self) -> None:
        result = automation_gate.validate_evidence(
            evidence(
                """
                PM ASSIGNMENT

                DEV COMPLETE
                Commit SHA: 6b83a066

                QA RESULT: PASS
                Commit SHA: 6b83a066
                """
            ),
            "failure",
            [],
        )
        self.assertFalse(result.ok)
        self.assertTrue(
            any("PR Validation result is failure" in error for error in result.errors),
            result.errors,
        )


if __name__ == "__main__":
    unittest.main()
