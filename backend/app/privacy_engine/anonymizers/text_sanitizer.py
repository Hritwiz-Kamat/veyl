"""
Text Sanitizer Engine.
Applies approved finding replacements to original text using right-to-left substitution.
Preserves all punctuation, whitespace, newlines, and unrelated text.
"""
from typing import List
from app.schemas.finding import Finding


class SanitizationError(Exception):
    """Raised when finding spans are invalid or overlap."""
    pass


class TextSanitizer:
    @staticmethod
    def sanitize(original_text: str, approved_findings: List[Finding]) -> str:
        """
        Substitutes approved finding placeholders into original text.
        Executes right-to-left by start offset descending.
        """
        if not approved_findings or not original_text:
            return original_text

        # Sort findings descending by start offset (right-to-left)
        sorted_findings = sorted(approved_findings, key=lambda f: f.start, reverse=True)

        # Validate non-overlapping and bounds
        for i in range(len(sorted_findings)):
            curr = sorted_findings[i]
            if curr.start < 0 or curr.end > len(original_text) or curr.start >= curr.end:
                raise SanitizationError(f"Invalid span offsets [{curr.start}:{curr.end}] for finding {curr.id}")

            if i + 1 < len(sorted_findings):
                next_finding = sorted_findings[i + 1]  # starts before or at curr
                if next_finding.end > curr.start:
                    raise SanitizationError(
                        f"Overlapping approved findings: {next_finding.id} and {curr.id}"
                    )

        # Apply right-to-left replacement
        sanitized = original_text
        for f in sorted_findings:
            sanitized = sanitized[:f.start] + f.replacement + sanitized[f.end:]

        return sanitized

