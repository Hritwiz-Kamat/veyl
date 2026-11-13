"""
Image Sanitizer.
Applies opaque pixel-level redaction masks to sensitive image regions using Pillow.
Strips all image metadata (EXIF) and saves a lossless sanitized artifact.
"""
from __future__ import annotations
import os
import uuid
import logging
from typing import List, Tuple
from PIL import Image, ImageDraw

from app.schemas.finding import Finding

logger = logging.getLogger(__name__)


class ImageSanitizerError(Exception):
    """Raised when image masking or saving fails."""
    pass


class ImageSanitizer:
    @staticmethod
    def redact_image(
        input_image_path: str,
        approved_findings: List[Finding],
        output_directory: str,
        session_id: str,
        padding_px: int = 3,
    ) -> Tuple[str, str]:
        """
        Loads original image, paints opaque black rectangles over approved bounding boxes,
        strips metadata, and writes a new sanitized PNG artifact.
        Returns (artifact_id, sanitized_file_path).
        """
        if not os.path.exists(input_image_path):
            raise ImageSanitizerError(f"Input image not found: {input_image_path}")

        try:
            with Image.open(input_image_path) as src_img:
                # Convert to RGB (or RGBA if transparent)
                mode = "RGBA" if src_img.mode in ("RGBA", "LA") or (src_img.mode == "P" and "transparency" in src_img.info) else "RGB"
                redacted_img = src_img.convert(mode)

                draw = ImageDraw.Draw(redacted_img)
                fill_color = (0, 0, 0, 255) if mode == "RGBA" else (0, 0, 0)

                w, h = redacted_img.size

                for finding in approved_findings:
                    if not finding.bounding_boxes:
                        continue

                    for box in finding.bounding_boxes:
                        # Clamp and apply small padding so text ascenders/descenders are completely covered
                        x1 = max(0, box.x - padding_px)
                        y1 = max(0, box.y - padding_px)
                        x2 = min(w, box.x + box.width + padding_px)
                        y2 = min(h, box.y + box.height + padding_px)

                        draw.rectangle([x1, y1, x2, y2], fill=fill_color)

                # Strip metadata / EXIF
                redacted_img.info = {}

                # Create output file
                artifact_id = uuid.uuid4().hex
                os.makedirs(output_directory, exist_ok=True)
                artifact_filename = f"{session_id}_{artifact_id}.png"
                output_path = os.path.join(output_directory, artifact_filename)

                redacted_img.save(output_path, format="PNG")
                logger.info(f"Redacted image saved to {output_path}")

                return artifact_id, output_path

        except Exception as e:
            logger.error(f"Failed to redact image: {e}")
            raise ImageSanitizerError(f"Image redaction failed: {str(e)}")
