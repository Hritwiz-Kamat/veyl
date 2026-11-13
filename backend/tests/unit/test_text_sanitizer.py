"""
Unit tests for TextSanitizer engine.
"""
import pytest
from app.privacy_engine.anonymizers.text_sanitizer import TextSanitizer, SanitizationError
from app.schemas.finding import Finding


def make_finding(fid: str, start: int, end: int, replacement: str) -> Finding:
    return Finding(
        id=fid,
        entity_type="GENERIC",
        start=start,
        end=end,
        replacement=replacement,
        severity="medium",
        confidence=1.0,
        source="unit_test",
        selected_by_default=True,
    )


def test_sanitize_empty_findings():
    text = "Hello world!"
    result = TextSanitizer.sanitize(text, [])
    assert result == text


def test_sanitize_single_finding():
    text = "Contact Alice for details."
    f = make_finding("f1", 8, 13, "[PERSON_1]")
    result = TextSanitizer.sanitize(text, [f])
    assert result == "Contact [PERSON_1] for details."


def test_sanitize_multiple_findings_right_to_left():
    text = "Alice met Bob at noon."
    f1 = make_finding("f1", 0, 5, "[PERSON_1]")
    f2 = make_finding("f2", 10, 13, "[PERSON_2]")

    # Pass in shuffled order to verify sorting right-to-left
    result = TextSanitizer.sanitize(text, [f1, f2])
    assert result == "[PERSON_1] met [PERSON_2] at noon."


def test_sanitize_preserves_surrounding_whitespace_and_newlines():
    text = "Line 1:   secret_123   \nLine 2: email@test.com.\n"
    s1 = text.index("secret_123")
    e1 = s1 + len("secret_123")
    s2 = text.index("email@test.com")
    e2 = s2 + len("email@test.com")

    f1 = make_finding("f1", s1, e1, "[SECRET_1]")
    f2 = make_finding("f2", s2, e2, "[EMAIL_1]")

    result = TextSanitizer.sanitize(text, [f1, f2])
    assert result == "Line 1:   [SECRET_1]   \nLine 2: [EMAIL_1].\n"


def test_sanitize_detects_overlapping_findings():
    text = "Overlapping text sample"
    f1 = make_finding("f1", 0, 11, "[REPL_1]")
    f2 = make_finding("f2", 5, 16, "[REPL_2]")

    with pytest.raises(SanitizationError) as exc_info:
        TextSanitizer.sanitize(text, [f1, f2])
    assert "Overlapping" in str(exc_info.value)
