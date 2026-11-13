"""
Detector Registry.
Coordinates Presidio, custom regex, and secret detectors.
Handles normalization, deduplication, overlap resolution, and placeholder assignment.
"""
import uuid
from typing import List, Optional

from app.schemas.finding import Finding
from app.privacy_engine.detectors.secret_detector import SecretDetector, RawDetection
from app.privacy_engine.detectors.regex_detector import RegexDetector
from app.privacy_engine.detectors.presidio_detector import PresidioDetector
from app.privacy_engine.policies.severity import get_severity_for_entity, SEVERITY_ORDER
from app.privacy_engine.policies.replacement import ReplacementPolicy


class DetectorRegistry:
    """Combines all detectors, normalizes results, resolves span overlaps, and assigns IDs."""

    def __init__(
        self,
        presidio_detector: Optional[PresidioDetector] = None,
        regex_detector: Optional[RegexDetector] = None,
        secret_detector: Optional[SecretDetector] = None,
    ) -> None:
        self.presidio = presidio_detector or PresidioDetector.get_instance()
        self.regex = regex_detector or RegexDetector()
        self.secret = secret_detector or SecretDetector()

    def analyze(self, text: str) -> List[Finding]:
        """
        Runs all detectors, resolves overlaps, deduplicates, and produces
        normalized findings with consistent placeholders.
        """
        if not text:
            return []

        # 1. Collect raw detections from all sources
        raw_detections: List[RawDetection] = []
        raw_detections.extend(self.secret.analyze(text))
        raw_detections.extend(self.regex.analyze(text))
        raw_detections.extend(self.presidio.analyze(text))

        if not raw_detections:
            return []

        # 2. Filter invalid spans (e.g. out of bounds or empty)
        valid_detections = [
            d for d in raw_detections if 0 <= d.start < d.end <= len(text)
        ]

        # 3. Deduplicate exact same span + entity
        unique_detections = self._deduplicate(valid_detections)

        # 4. Resolve overlapping spans
        resolved = self._resolve_overlaps(unique_detections)

        # 5. Sort by start offset ascending
        resolved.sort(key=lambda d: (d.start, d.end))

        # 6. Assign consistent replacements and generate final Finding objects
        replacement_policy = ReplacementPolicy()
        findings: List[Finding] = []

        for det in resolved:
            snippet = text[det.start:det.end]
            severity = get_severity_for_entity(det.entity_type)
            placeholder = replacement_policy.get_replacement(det.entity_type, snippet)

            finding = Finding(
                id=uuid.uuid4().hex,
                entity_type=det.entity_type,
                start=det.start,
                end=det.end,
                replacement=placeholder,
                severity=severity,
                confidence=det.confidence,
                source=det.source,
                selected_by_default=True,
            )
            findings.append(finding)

        return findings

    def _deduplicate(self, detections: List[RawDetection]) -> List[RawDetection]:
        """Removes exact duplicate detections (same start, end, entity_type)."""
        seen = set()
        unique: List[RawDetection] = []
        for d in detections:
            key = (d.start, d.end, d.entity_type)
            if key not in seen:
                seen.add(key)
                unique.append(d)
        return unique

    def _resolve_overlaps(self, detections: List[RawDetection]) -> List[RawDetection]:
        """
        Resolves conflicts between overlapping spans.
        Precedence rules:
          1. Higher severity rank (critical > high > medium > low)
          2. Higher confidence score
          3. Longer span length
          4. Earlier start position
        """
        if len(detections) <= 1:
            return detections

        def score_detection(d: RawDetection) -> tuple:
            sev_rank = SEVERITY_ORDER.get(get_severity_for_entity(d.entity_type), 0)
            conf = d.confidence if d.confidence is not None else 0.0
            span_len = d.end - d.start
            return (sev_rank, conf, span_len, -d.start)

        # Sort all detections by precedence descending
        sorted_by_priority = sorted(detections, key=score_detection, reverse=True)

        accepted: List[RawDetection] = []

        for candidate in sorted_by_priority:
            # Check if candidate overlaps with any already accepted finding
            overlaps = False
            for existing in accepted:
                # Two spans overlap if max(start1, start2) < min(end1, end2)
                if max(candidate.start, existing.start) < min(candidate.end, existing.end):
                    overlaps = True
                    break
            if not overlaps:
                accepted.append(candidate)

        return accepted

