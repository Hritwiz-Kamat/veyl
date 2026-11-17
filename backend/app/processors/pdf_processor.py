"""
PDF Processor.
Validates PDF files, extracts selectable text with page references, falls back to
OCR for scanned pages (reusing the Tesseract pipeline), and maps sensitive findings
to PDF coordinates.
"""
import io
import uuid
import logging
from typing import List, Optional, Tuple
from PIL import Image
import pymupdf

from app.schemas.finding import Finding, BoundingBox
from app.privacy_engine.registry import DetectorRegistry
from app.processors.image_processor import ImageProcessor

logger = logging.getLogger(__name__)


class PdfValidationResult:
    def __init__(self, is_valid: bool, error_message: Optional[str] = None, page_count: int = 0):
        self.is_valid = is_valid
        self.error_message = error_message
        self.page_count = page_count


class PdfExtractionResult:
    def __init__(
        self,
        extracted_text: str,
        findings: List[Finding],
        page_count: int,
        is_incomplete: bool = False,
        scan_warning: Optional[str] = None,
    ):
        self.extracted_text = extracted_text
        self.findings = findings
        self.page_count = page_count
        self.is_incomplete = is_incomplete
        self.scan_warning = scan_warning


class PdfProcessor:
    @staticmethod
    def validate_pdf(file_bytes: bytes) -> PdfValidationResult:
        """Validates that bytes represent a readable, valid PDF file."""
        if not file_bytes:
            return PdfValidationResult(False, "Empty file.")

        # Check PDF header magic bytes
        if not file_bytes.startswith(b"%PDF-"):
            return PdfValidationResult(False, "Invalid PDF: missing %PDF- header.")

        try:
            doc = pymupdf.open(stream=file_bytes, filetype="pdf")
            page_count = len(doc)
            doc.close()

            if page_count == 0:
                return PdfValidationResult(False, "Invalid PDF: document has 0 pages.")

            return PdfValidationResult(True, None, page_count)
        except Exception as e:
            logger.error(f"Failed to open PDF: {e}")
            return PdfValidationResult(False, f"Corrupted or invalid PDF file: {str(e)}")

    @classmethod
    def extract_and_analyze(
        cls,
        file_bytes: bytes,
        registry: DetectorRegistry,
    ) -> PdfExtractionResult:
        """
        Processes each page of the PDF:
        - If selectable text is found, analyzes it and calculates bounding boxes.
        - If page is scanned (no selectable text), renders pixmap and runs OCR fallback.
        - Returns unified document text, page-referenced findings, and scan metadata.
        """
        doc = pymupdf.open(stream=file_bytes, filetype="pdf")
        page_count = len(doc)

        all_findings: List[Finding] = []
        full_text_parts: List[str] = []
        is_incomplete = False
        scan_warnings: List[str] = []

        current_char_offset = 0

        for page_idx in range(page_count):
            page = doc[page_idx]
            page_number = page_idx + 1

            # Format page header
            page_header = f"--- Page {page_number} ---\n" if page_count > 1 else ""
            header_offset = len(page_header)
            page_text_start_offset = current_char_offset + header_offset

            page_selectable_text = page.get_text("text").strip()

            page_content = ""
            page_findings: List[Finding] = []

            if page_selectable_text:
                # 1. Selectable text extraction
                raw_page_text = page.get_text("text")
                page_content = raw_page_text
                detected = registry.analyze(raw_page_text)

                for f in detected:
                    snippet = raw_page_text[f.start:f.end]
                    # Map text snippet to PDF bounding boxes
                    rects = page.search_for(snippet)
                    boxes: List[BoundingBox] = []
                    for r in rects:
                        boxes.append(
                            BoundingBox(
                                x=int(r.x0),
                                y=int(r.y0),
                                width=max(1, int(r.width)),
                                height=max(1, int(r.height)),
                            )
                        )

                    # Update offset relative to concatenated full document text
                    adjusted_finding = Finding(
                        id=f.id or uuid.uuid4().hex,
                        entity_type=f.entity_type,
                        start=page_text_start_offset + f.start,
                        end=page_text_start_offset + f.end,
                        replacement=f.replacement,
                        severity=f.severity,
                        confidence=f.confidence,
                        source=f.source,
                        selected_by_default=f.selected_by_default,
                        bounding_boxes=boxes if boxes else None,
                        page_number=page_number,
                    )
                    page_findings.append(adjusted_finding)

            else:
                # 2. Scanned-page fallback via Tesseract OCR
                try:
                    pix = page.get_pixmap(dpi=150)
                    img_bytes = pix.tobytes("png")
                    with Image.open(io.BytesIO(img_bytes)) as img:
                        ocr_text, ocr_words, page_complete, page_warning = ImageProcessor.extract_words_and_text(img)

                    if not page_complete and page_warning:
                        is_incomplete = True
                        if page_warning not in scan_warnings:
                            scan_warnings.append(page_warning)

                    if ocr_text:
                        page_content = ocr_text + "\n"
                        detected = registry.analyze(ocr_text)

                        if detected and ocr_words:
                            detected_with_boxes = ImageProcessor.map_findings_to_boxes(detected, ocr_words)
                        else:
                            detected_with_boxes = detected

                        # Scale bounding boxes from pixmap pixels to PDF page coordinates
                        scale_x = page.rect.width / pix.width if pix.width > 0 else 1.0
                        scale_y = page.rect.height / pix.height if pix.height > 0 else 1.0

                        for f in detected_with_boxes:
                            pdf_boxes: List[BoundingBox] = []
                            if f.bounding_boxes:
                                for b in f.bounding_boxes:
                                    pdf_boxes.append(
                                        BoundingBox(
                                            x=int(b.x * scale_x),
                                            y=int(b.y * scale_y),
                                            width=max(1, int(b.width * scale_x)),
                                            height=max(1, int(b.height * scale_y)),
                                        )
                                    )

                            adjusted_finding = Finding(
                                id=f.id or uuid.uuid4().hex,
                                entity_type=f.entity_type,
                                start=page_text_start_offset + f.start,
                                end=page_text_start_offset + f.end,
                                replacement=f.replacement,
                                severity=f.severity,
                                confidence=f.confidence,
                                source="ocr" if f.source == "regex" else f.source,
                                selected_by_default=f.selected_by_default,
                                bounding_boxes=pdf_boxes if pdf_boxes else None,
                                page_number=page_number,
                            )
                            page_findings.append(adjusted_finding)
                    else:
                        page_content = "[Scanned page: No text detected]\n"
                except Exception as e:
                    logger.error(f"Failed OCR fallback on page {page_number}: {e}")
                    is_incomplete = True
                    scan_warnings.append(f"Failed to process page {page_number}: {str(e)}")
                    page_content = f"[Error scanning page {page_number}]\n"

            page_block = f"{page_header}{page_content}\n"
            full_text_parts.append(page_block)
            current_char_offset += len(page_block)
            all_findings.extend(page_findings)

        doc.close()

        full_extracted_text = "".join(full_text_parts).strip()
        combined_warning = "; ".join(scan_warnings) if scan_warnings else None

        return PdfExtractionResult(
            extracted_text=full_extracted_text,
            findings=all_findings,
            page_count=page_count,
            is_incomplete=is_incomplete,
            scan_warning=combined_warning,
        )

