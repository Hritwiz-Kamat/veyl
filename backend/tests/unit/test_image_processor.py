"""
Unit tests for ImageProcessor.
"""
from io import BytesIO
from PIL import Image

from app.processors.image_processor import ImageProcessor, OCRWord
from app.schemas.finding import Finding


def create_test_image(format_name: str = "PNG", size: tuple = (100, 100)) -> bytes:
    buf = BytesIO()
    img = Image.new("RGB", size, color="white")
    img.save(buf, format=format_name)
    return buf.getvalue()


def test_validate_image_valid_formats():
    png_bytes = create_test_image("PNG")
    res_png = ImageProcessor.validate_image(png_bytes)
    assert res_png.is_valid is True
    assert res_png.format_name == "PNG"
    assert res_png.width == 100
    assert res_png.height == 100

    jpg_bytes = create_test_image("JPEG")
    res_jpg = ImageProcessor.validate_image(jpg_bytes)
    assert res_jpg.is_valid is True
    assert res_jpg.format_name == "JPEG"


def test_validate_image_invalid_content():
    corrupted = b"NOT_AN_IMAGE_FILE_JUST_RANDOM_BYTES"
    res = ImageProcessor.validate_image(corrupted)
    assert res.is_valid is False
    assert "Invalid image" in (res.error_message or "")


def test_map_findings_to_boxes():
    # Simulate OCR words:
    # "Contact" (0-7), "Alice" (8-13), "Smith" (14-19)
    words = [
        OCRWord("Contact", x=10, y=10, width=50, height=15, conf=90.0, start_char=0, end_char=7),
        OCRWord("Alice", x=65, y=10, width=40, height=15, conf=95.0, start_char=8, end_char=13),
        OCRWord("Smith", x=110, y=10, width=45, height=15, conf=95.0, start_char=14, end_char=19),
    ]

    # Finding spanning "Alice Smith" (8 to 19)
    finding = Finding(
        id="f1",
        entity_type="PERSON",
        start=8,
        end=19,
        replacement="[PERSON_1]",
        severity="medium",
        confidence=0.95,
        source="presidio",
        selected_by_default=True,
    )

    mapped = ImageProcessor.map_findings_to_boxes([finding], words)
    assert len(mapped) == 1
    boxes = mapped[0].bounding_boxes
    assert boxes is not None
    assert len(boxes) == 2

    # First box is Alice
    assert boxes[0].x == 65
    assert boxes[0].y == 10
    # Second box is Smith
    assert boxes[1].x == 110
    assert boxes[1].y == 10
