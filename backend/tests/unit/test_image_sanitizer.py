"""
Unit tests for ImageSanitizer pixel redaction.
"""
import os
import tempfile
from PIL import Image

from app.privacy_engine.anonymizers.image_sanitizer import ImageSanitizer
from app.schemas.finding import Finding, BoundingBox


def test_redact_image_actual_pixels_changed():
    with tempfile.TemporaryDirectory() as tmp_dir:
        src_path = os.path.join(tmp_dir, "input.png")
        out_dir = os.path.join(tmp_dir, "sanitized")

        # Create a pure white 200x200 image
        white_img = Image.new("RGB", (200, 200), color=(255, 255, 255))
        white_img.save(src_path, format="PNG")

        # Target box to redact: (50, 50) to (100, 80)
        box = BoundingBox(x=50, y=50, width=50, height=30)
        finding = Finding(
            id="f1",
            entity_type="CREDENTIAL",
            start=0,
            end=10,
            replacement="[CRED_1]",
            severity="critical",
            confidence=1.0,
            source="secret",
            selected_by_default=True,
            bounding_boxes=[box],
        )

        artifact_id, out_path = ImageSanitizer.redact_image(
            input_image_path=src_path,
            approved_findings=[finding],
            output_directory=out_dir,
            session_id="test_sess",
            padding_px=0,
        )

        assert os.path.exists(out_path)

        # Inspect pixels in output image
        with Image.open(out_path) as redacted:
            # Inside the box (e.g. x=60, y=60) must be pure black (0, 0, 0)
            pixel_inside = redacted.getpixel((60, 60))
            assert pixel_inside[:3] == (0, 0, 0)

            # Outside the box (e.g. x=10, y=10) must remain pure white (255, 255, 255)
            pixel_outside = redacted.getpixel((10, 10))
            assert pixel_outside[:3] == (255, 255, 255)
