"""
Unit tests for PdfSanitizer.
Verifies true redaction, output verification, unrecoverability, and error handling.
"""
import os
import tempfile
import pymupdf
import pytest

from app.schemas.finding import Finding, BoundingBox
from app.privacy_engine.anonymizers.pdf_sanitizer import (
    PdfSanitizer,
    PdfSanitizationError,
    PdfVerificationError,
)


def create_test_pdf_file(text: str, directory: str) -> str:
    path = os.path.join(directory, "test_input.pdf")
    doc = pymupdf.open()
    page = doc.new_page(width=800, height=400)
    page.insert_text((50, 50), text, fontsize=11)
    doc.save(path)
    doc.close()
    return path


def test_true_redaction_removes_text_stream():
    with tempfile.TemporaryDirectory() as tmpdir:
        original_text = "The user secret key is sk-secret1234567890abcdefghijklmnopqrstuv and email is test@example.com."
        pdf_path = create_test_pdf_file(original_text, tmpdir)

        # Locate rect for the secret key
        doc = pymupdf.open(pdf_path)
        rects = doc[0].search_for("sk-secret1234567890abcdefghijklmnopqrstuv")
        doc.close()

        boxes = [
            BoundingBox(
                x=int(r.x0),
                y=int(r.y0),
                width=int(r.width),
                height=int(r.height),
            )
            for r in rects
        ]

        finding = Finding(
            id="f1",
            entity_type="OPENAI_KEY",
            start=original_text.index("sk-secret1234567890abcdefghijklmnopqrstuv"),
            end=original_text.index("sk-secret1234567890abcdefghijklmnopqrstuv") + len("sk-secret1234567890abcdefghijklmnopqrstuv"),
            replacement="[SECRET_KEY_1]",
            severity="critical",
            confidence=0.95,
            source="secret",
            selected_by_default=True,
            bounding_boxes=boxes,
            page_number=1,
        )

        artifact_id, out_path = PdfSanitizer.redact_pdf(
            input_pdf_path=pdf_path,
            original_text=original_text,
            approved_findings=[finding],
            output_directory=tmpdir,
            session_id="test_sess",
        )

        assert os.path.exists(out_path)
        assert artifact_id is not None

        # Reopen output PDF and verify text is physically eliminated
        verify_doc = pymupdf.open(out_path)
        extracted = verify_doc[0].get_text("text")
        verify_doc.close()

        # The approved secret must NOT exist anywhere in extracted text
        assert "sk-secret1234567890abcdefghijklmnopqrstuv" not in extracted
        # The unredacted email must still be present
        assert "test@example.com" in extracted


def test_verification_failure_raises_error():
    with tempfile.TemporaryDirectory() as tmpdir:
        original_text = "Alice went to Paris."
        pdf_path = create_test_pdf_file(original_text, tmpdir)

        # Finding with bogus/empty bounding boxes pointing away from the text
        finding = Finding(
            id="f_fail",
            entity_type="PERSON",
            start=0,
            end=5,
            replacement="[PERSON_1]",
            severity="medium",
            confidence=0.9,
            source="presidio",
            selected_by_default=True,
            bounding_boxes=[BoundingBox(x=350, y=350, width=10, height=10)],  # Far away from text
            page_number=1,
        )

        # Calling verify_redacted_pdf directly on original unredacted file should detect the leak and raise error
        with pytest.raises(PdfVerificationError) as exc_info:
            PdfSanitizer.verify_redacted_pdf(
                redacted_pdf_path=pdf_path,
                original_text=original_text,
                approved_findings=[finding],
            )

        assert "verification failed" in str(exc_info.value).lower()
        assert "Alice" in str(exc_info.value)
