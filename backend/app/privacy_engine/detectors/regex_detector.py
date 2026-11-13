"""
Custom Regex Detector.
Detects structured identifiers: SSN, Credit Cards (with Luhn check), IPv4/IPv6, MAC addresses, UUIDs.
"""
import re
from typing import List, Dict, Any
from app.privacy_engine.detectors.secret_detector import RawDetection


def luhn_checksum(card_number: str) -> bool:
    """Verifies Luhn algorithm checksum for credit card numbers."""
    digits = [int(c) for c in card_number if c.isdigit()]
    if len(digits) < 13 or len(digits) > 19:
        return False
    checksum = 0
    reverse_digits = digits[::-1]
    for i, d in enumerate(reverse_digits):
        if i % 2 == 1:
            doubled = d * 2
            checksum += doubled if doubled < 10 else (doubled - 9)
        else:
            checksum += d
    return checksum % 10 == 0


class RegexDetector:
    """Regex recognizer for structured network and identity tokens."""

    PATTERNS: List[Dict[str, Any]] = [
        {
            "name": "US_SSN",
            "regex": re.compile(r"\b(?!000|666|9\d{2})\d{3}-(?!00)\d{2}-(?!0000)\d{4}\b"),
            "confidence": 0.85,
        },
        {
            "name": "IP_ADDRESS",
            "regex": re.compile(
                r"\b(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])\b"
            ),
            "confidence": 0.80,
        },
        {
            "name": "MAC_ADDRESS",
            "regex": re.compile(r"\b(?:[0-9A-Fa-f]{2}[:-]){5}(?:[0-9A-Fa-f]{2})\b"),
            "confidence": 0.85,
        },
        {
            "name": "UUID",
            "regex": re.compile(r"\b[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}\b"),
            "confidence": 0.75,
        },
    ]

    # Credit card pattern for preliminary scan
    CC_REGEX = re.compile(r"\b(?:\d[ -]*?){13,19}\b")

    def analyze(self, text: str) -> List[RawDetection]:
        findings: List[RawDetection] = []
        if not text:
            return findings

        # Standard regex patterns
        for item in self.PATTERNS:
            pattern = item["regex"]
            name = item["name"]
            confidence = item["confidence"]

            for match in pattern.finditer(text):
                start, end = match.span()
                matched_str = text[start:end]

                # Filter out obvious false positive IPs like 0.0.0.0 or versions
                if name == "IP_ADDRESS":
                    # skip if followed by dot-number (like version 1.2.3.4.5)
                    if end < len(text) and text[end] == ".":
                        continue

                findings.append(
                    RawDetection(
                        entity_type=name,
                        start=start,
                        end=end,
                        confidence=confidence,
                        source="regex",
                    )
                )

        # Credit card detection with Luhn check
        for match in self.CC_REGEX.finditer(text):
            raw_match = match.group()
            digits_only = re.sub(r"\D", "", raw_match)
            if 13 <= len(digits_only) <= 19 and luhn_checksum(digits_only):
                findings.append(
                    RawDetection(
                        entity_type="CREDIT_CARD",
                        start=match.start(),
                        end=match.end(),
                        confidence=0.90,
                        source="regex",
                    )
                )

        return findings

