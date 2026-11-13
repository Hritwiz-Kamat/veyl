"""
Unit tests for overlap resolution in DetectorRegistry.
"""
from app.privacy_engine.registry import DetectorRegistry
from app.privacy_engine.detectors.secret_detector import RawDetection


def test_overlap_resolution_precedence():
    registry = DetectorRegistry()

    # Suppose candidate 1 is a SECRET (critical) and candidate 2 is a generic URL/EMAIL (medium/low)
    # overlapping the same span
    det_secret = RawDetection(
        entity_type="OPENAI_KEY",
        start=10,
        end=35,
        confidence=0.95,
        source="secret",
    )
    det_url = RawDetection(
        entity_type="URL",
        start=15,
        end=30,
        confidence=0.6,
        source="presidio",
    )

    resolved = registry._resolve_overlaps([det_url, det_secret])
    assert len(resolved) == 1
    assert resolved[0].entity_type == "OPENAI_KEY"
    assert resolved[0].start == 10
    assert resolved[0].end == 35


def test_non_overlapping_spans_preserved():
    registry = DetectorRegistry()

    det1 = RawDetection(entity_type="PERSON", start=0, end=10, confidence=0.9, source="presidio")
    det2 = RawDetection(entity_type="EMAIL_ADDRESS", start=15, end=30, confidence=0.9, source="presidio")

    resolved = registry._resolve_overlaps([det1, det2])
    assert len(resolved) == 2


def test_deduplicate_identical_spans():
    registry = DetectorRegistry()

    det1 = RawDetection(entity_type="PERSON", start=5, end=15, confidence=0.8, source="presidio")
    det2 = RawDetection(entity_type="PERSON", start=5, end=15, confidence=0.8, source="presidio")

    unique = registry._deduplicate([det1, det2])
    assert len(unique) == 1

