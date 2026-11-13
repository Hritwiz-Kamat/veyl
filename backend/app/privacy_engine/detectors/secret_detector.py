"""
Secret and Credential Detector.
Detects API keys, tokens, private keys, passwords, and secrets using regex and entropy heuristics.
"""
import re
from typing import List, Dict, Any, NamedTuple


class RawDetection(NamedTuple):
    entity_type: str
    start: int
    end: int
    confidence: float
    source: str


class SecretDetector:
    """Detects credentials, API keys, private keys, and high-entropy secrets."""

    PATTERNS: List[Dict[str, Any]] = [
        {
            "name": "PRIVATE_KEY",
            "regex": re.compile(
                r"-----BEGIN (?:RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----[\s\S]*?-----END (?:RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----",
                re.MULTILINE,
            ),
            "confidence": 1.0,
        },
        {
            "name": "OPENAI_KEY",
            "regex": re.compile(r"\bsk-[a-zA-Z0-9_-]{20,}\b"),
            "confidence": 0.95,
        },
        {
            "name": "AWS_KEY",
            "regex": re.compile(r"\b(?:AKIA|ABIA|ACCA|ASIA)[0-9A-Z]{16}\b"),
            "confidence": 0.95,
        },
        {
            "name": "GITHUB_TOKEN",
            "regex": re.compile(r"\b(?:ghp|gho|ghu|ghs|ghr)_[a-zA-Z0-9]{36,40}\b|\bgithub_pat_[a-zA-Z0-9_]{82}\b"),
            "confidence": 0.95,
        },
        {
            "name": "SLACK_TOKEN",
            "regex": re.compile(r"\bxox[baprs]-[0-9a-zA-Z]{10,48}\b"),
            "confidence": 0.95,
        },
        {
            "name": "STRIPE_KEY",
            "regex": re.compile(r"\b(?:sk|pk)_(?:test|live)_[0-9a-zA-Z]{24,99}\b"),
            "confidence": 0.95,
        },
        {
            "name": "GOOGLE_KEY",
            "regex": re.compile(r"\bAIza[0-9A-Za-z-_]{35}\b"),
            "confidence": 0.95,
        },
        {
            "name": "JWT",
            "regex": re.compile(r"\beyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_\-+/=]{10,}\b"),
            "confidence": 0.90,
        },
        {
            "name": "BEARER_TOKEN",
            "regex": re.compile(r"(?i)\bbearer\s+(?P<value>[a-zA-Z0-9_\-\.=:_+/]{20,})\b"),
            "confidence": 0.85,
        },
        {
            "name": "PASSWORD",
            "regex": re.compile(
                r"""(?i)\b(?:password|passwd|pwd|secret|api_secret|auth_token)\s*[:=]\s*['"](?P<value>[^'"]{6,})['"]"""
            ),
            "confidence": 0.85,
        },
    ]

    def analyze(self, text: str) -> List[RawDetection]:
        findings: List[RawDetection] = []
        if not text:
            return findings

        for item in self.PATTERNS:
            pattern = item["regex"]
            name = item["name"]
            confidence = item["confidence"]

            for match in pattern.finditer(text):
                # If named group 'value' exists, use its span
                if "value" in pattern.groupindex:
                    start, end = match.span("value")
                else:
                    start, end = match.span()

                if end > start:
                    findings.append(
                        RawDetection(
                            entity_type=name,
                            start=start,
                            end=end,
                            confidence=confidence,
                            source="secret",
                        )
                    )

        return findings
