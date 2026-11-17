"""
Unit tests for PdfProcessor.
Tests selectable text extraction, page referencing, scanned page OCR fallback, and error handling.
"""
import io
import pymupdf
from PIL import Image

from app.processors.pdf_processor import PdfProcessor
from app.privacy_engine.registry import DetectorRegistry


def create_selectable_pdf(pages_text: list[str]) -> bytes:
    """Helper to generate a multi-page PDF with selectable text."""
    doc = pymupdf.open()
    for text in pages_text:
        page = doc.new_page(width=400, height=400)
        page.insert_text((50, 50), text, fontsize=12)
    pdf_bytes = doc.tobytes()
    doc.close()
    return pdf_bytes


def create_scanned_pdf(image_size: tuple = (200, 200)) -> bytes:
    """Helper to generate a PDF containing only a raster image (no selectable text)."""
    doc = pymupdf.open()
    page = doc.new_page(width=300, height=300)

    # Insert a blank image into the page
    img = Image.new("RGB", image_size, color="white")
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    page.insert_image(page.rect, stream=buf.getvalue())

    pdf_bytes = doc.tobytes()
    doc.close()
    return pdf_bytes


def test_validate_pdf_valid():
    pdf_bytes = create_selectable_pdf(["Hello world"])
    result = PdfProcessor.validate_pdf(pdf_bytes)
    assert result.is_valid is True
    assert result.page_count == 1
    assert result.error_message is None


def test_validate_pdf_invalid_bytes():
    result = PdfProcessor.validate_pdf(b"NOT A REAL PDF FILE")
    assert result.is_valid is False
    assert "Invalid PDF" in (result.error_message or "")


def test_validate_pdf_empty():
    result = PdfProcessor.validate_pdf(b"")
    assert result.is_valid is False
    assert "Empty file" in (result.error_message or "")


def test_extract_selectable_text_multi_page():
    page1 = "Contact Alice Smith at alice@example.com for assistance."
    page2 = "Server backup key is sk-test1234567890abcdefghijklmnopqrstuvwxyz."
    pdf_bytes = create_selectable_pdf([page1, page2])

    registry = DetectorRegistry()
    result = PdfProcessor.extract_and_analyze(pdf_bytes, registry)

    assert result.page_count == 2
    assert "Alice Smith" in result.extracted_text
    assert "--- Page 1 ---" in result.extracted_text
    assert "--- Page 2 ---" in result.extracted_text

    # Verify findings contain page numbers
    assert len(result.findings) >= 2
    p1_findings = [f for f in result.findings if f.page_number == 1]
    p2_findings = [f for f in result.findings if f.page_number == 2]

    assert len(p1_findings) >= 1
    assert any(f.entity_type in {"PERSON", "EMAIL_ADDRESS"} for f in p1_findings)

    assert len(p2_findings) >= 1
    assert any(f.entity_type == "OPENAI_KEY" for f in p2_findings)

    # Verify bounding boxes were computed for selectable text
    for f in result.findings:
        if f.bounding_boxes:
            for b in f.bounding_boxes:
                assert b.width > 0
                assert b.height > 0


def test_extract_scanned_page_pdf():
    # A PDF with an image and no selectable text
    pdf_bytes = create_scanned_pdf()
    registry = DetectorRegistry()
    result = PdfProcessor.extract_and_analyze(pdf_bytes, registry)

    assert result.page_count == 1
    assert result.extracted_text != ""

