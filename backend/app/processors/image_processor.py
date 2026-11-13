"""
Image Processor.
Validates uploaded image files, runs structured word-level Tesseract OCR,
reconstructs text, and maps detected sensitive character spans to pixel bounding boxes.
"""
import io
import shutil
import logging
from typing import List, Tuple, Dict, Any, Optional
from PIL import Image
import pytesseract

from app.schemas.finding import Finding, BoundingBox

logger = logging.getLogger(__name__)

SUPPORTED_IMAGE_FORMATS = {"PNG", "JPEG", "WEBP"}


class OCRWord:
    def __init__(self, text: str, x: int, y: int, width: int, height: int, conf: float, start_char: int, end_char: int):
        self.text = text
        self.x = x
        self.y = y
        self.width = width
        self.height = height
        self.conf = conf
        self.start_char = start_char
        self.end_char = end_char


class ImageValidationResult:
    def __init__(self, is_valid: bool, error_message: Optional[str] = None, format_name: Optional[str] = None, width: int = 0, height: int = 0):
        self.is_valid = is_valid
        self.error_message = error_message
        self.format_name = format_name
        self.width = width
        self.height = height


class ImageProcessor:
    @staticmethod
    def validate_image(file_bytes: bytes) -> ImageValidationResult:
        """Validates that bytes represent a valid supported image."""
        if not file_bytes:
            return ImageValidationResult(False, "Empty file.")

        try:
            with Image.open(io.BytesIO(file_bytes)) as img:
                img.verify()

            # Re-open after verify() to inspect properties safely
            with Image.open(io.BytesIO(file_bytes)) as img:
                fmt = (img.format or "").upper()
                if fmt not in SUPPORTED_IMAGE_FORMATS:
                    return ImageValidationResult(
                        False, f"Unsupported format '{fmt}'. Allowed: {', '.join(sorted(SUPPORTED_IMAGE_FORMATS))}"
                    )
                return ImageValidationResult(True, None, fmt, img.width, img.height)
        except Exception as e:
            return ImageValidationResult(False, f"Invalid image file: {str(e)}")

    @staticmethod
    def is_tesseract_available() -> bool:
        """Checks if tesseract executable exists on the system PATH or configured path."""
        try:
            return shutil.which(pytesseract.pytesseract.tesseract_cmd) is not None or shutil.which("tesseract") is not None
        except Exception:
            return False

    @classmethod
    def extract_words_and_text(cls, image: Image.Image) -> Tuple[str, List[OCRWord], bool, Optional[str]]:
        """
        Runs structured word-level OCR via Tesseract.
        Returns (reconstructed_text, ocr_words, is_complete, warning_message).
        """
        if not cls.is_tesseract_available():
            warning = "Tesseract OCR engine is not installed on the system. Scanned text could not be extracted."
            return "", [], False, warning

        try:
            data: Dict[str, List[Any]] = pytesseract.image_to_data(
                image, output_type=pytesseract.Output.DICT
            )

            ocr_words: List[OCRWord] = []
            text_parts: List[str] = []
            current_pos = 0

            n_boxes = len(data["text"])
            for i in range(n_boxes):
                raw_word = data["text"][i]
                clean_word = raw_word.strip()
                if not clean_word:
                    continue

                conf = float(data["conf"][i]) if "conf" in data and data["conf"][i] != "-1" else 0.0

                start_char = current_pos
                end_char = current_pos + len(clean_word)

                ocr_word = OCRWord(
                    text=clean_word,
                    x=int(data["left"][i]),
                    y=int(data["top"][i]),
                    width=int(data["width"][i]),
                    height=int(data["height"][i]),
                    conf=conf,
                    start_char=start_char,
                    end_char=end_char,
                )
                ocr_words.append(ocr_word)
                text_parts.append(clean_word)

                # Add a space between words
                current_pos = end_char + 1

            reconstructed_text = " ".join(text_parts)
            return reconstructed_text, ocr_words, True, None

        except Exception as e:
            logger.error(f"Tesseract OCR failed: {e}")
            return "", [], False, f"OCR processing failed: {str(e)}"

    @staticmethod
    def map_findings_to_boxes(findings: List[Finding], ocr_words: List[OCRWord]) -> List[Finding]:
        """
        Maps detected text character spans [finding.start, finding.end]
        back to one or more OCR word bounding boxes in original image coordinates.
        """
        for finding in findings:
            f_start = finding.start
            f_end = finding.end

            matched_boxes: List[BoundingBox] = []

            for word in ocr_words:
                # Word and finding overlap if max(start1, start2) < min(end1, end2)
                if max(f_start, word.start_char) < min(f_end, word.end_char):
                    matched_boxes.append(
                        BoundingBox(
                            x=word.x,
                            y=word.y,
                            width=word.width,
                            height=word.height,
                        )
                    )

            finding.bounding_boxes = matched_boxes

        return findings
