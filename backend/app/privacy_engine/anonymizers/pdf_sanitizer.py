"""
PDF Sanitizer.
Applies true redaction to PDF documents using PyMuPDF:
- Removes text and vector elements from content stream.
- Truly redacts underlying raster pixels for scanned pages.
- Verifies output by reopening the saved artifact and asserting all approved findings are unrecoverable.
"""
import os
import uuid
import logging
from typing import List, Tuple, Optional
import pymupdf

from app.schemas.finding import Finding
from app.processors.image_processor import ImageProcessor

logger = logging.getLogger(__name__)


class PdfSanitizationError(Exception):
    """Raised when PDF redaction or file generation fails."""
    pass


class PdfVerificationError(Exception):
    """Raised when verification detects sensitive content survived redaction."""
    pass


class PdfSanitizer:
    @classmethod
    def redact_pdf(
        cls,
        input_pdf_path: str,
        original_text: str,
        approved_findings: List[Finding],
        output_directory: str,
        session_id: str,
    ) -> Tuple[str, str]:
        """
        Redacts approved findings from the PDF document:
        1. Identifies redaction rectangles per page.
        2. Applies destructive redactions to text and image layers.
        3. Compacts and purges unused streams with garbage collection.
        4. Verifies that redacted text is unrecoverable.
        Returns (artifact_id, artifact_file_path).
        """
        if not os.path.exists(input_pdf_path):
            raise PdfSanitizationError(f"Input PDF not found: {input_pdf_path}")

        os.makedirs(output_directory, exist_ok=True)
        artifact_id = uuid.uuid4().hex
        output_filename = f"{session_id}_{artifact_id}.pdf"
        output_path = os.path.join(output_directory, output_filename)

        try:
            doc = pymupdf.open(input_pdf_path)
        except Exception as e:
            raise PdfSanitizationError(f"Could not open input PDF: {e}")

        # Group approved findings by 1-based page number
        findings_by_page: dict[int, List[Finding]] = {}
        for f in approved_findings:
            p_num = f.page_number or 1
            findings_by_page.setdefault(p_num, []).append(f)

        try:
            for page_idx in range(len(doc)):
                page_num = page_idx + 1
                page = doc[page_idx]
                page_findings = findings_by_page.get(page_num, [])

                if not page_findings:
                    continue

                for f in page_findings:
                    snippet = original_text[f.start:f.end].strip() if original_text and 0 <= f.start < f.end <= len(original_text) else ""

                    # Method A: Redact recorded bounding boxes
                    if f.bounding_boxes:
                        for box in f.bounding_boxes:
                            rect = pymupdf.Rect(
                                box.x - 1,
                                box.y - 1,
                                box.x + box.width + 1,
                                box.y + box.height + 1,
                            )
                            page.add_redact_annot(rect, fill=(0, 0, 0))

                    # Method B: Search directly on page for exact snippet to catch any missed glyphs
                    if snippet and len(snippet) >= 2:
                        for r in page.search_for(snippet):
                            pad_rect = pymupdf.Rect(r.x0 - 1, r.y0 - 1, r.x1 + 1, r.y1 + 1)
                            page.add_redact_annot(pad_rect, fill=(0, 0, 0))

                # Apply true destructive redaction (both text stream and image pixels)
                page.apply_redactions(images=pymupdf.PDF_REDACT_IMAGE_PIXELS)

            # Save with maximum garbage collection to eliminate deleted objects/streams
            doc.save(
                output_path,
                garbage=4,
                deflate=True,
                clean=True,
            )
            doc.close()
        except Exception as e:
            if os.path.exists(output_path):
                try:
                    os.remove(output_path)
                except OSError:
                    pass
            raise PdfSanitizationError(f"Failed to redact and save PDF: {e}")

        # ── Verification Phase ────────────────────────────────────────────────
        # Re-extract all content from the output PDF and assert approved findings are absent
        cls.verify_redacted_pdf(
            redacted_pdf_path=output_path,
            original_text=original_text,
            approved_findings=approved_findings,
        )

        logger.info(f"PDF redaction and verification completed for session {session_id}")
        return artifact_id, output_path

    @classmethod
    def verify_redacted_pdf(
        cls,
        redacted_pdf_path: str,
        original_text: str,
        approved_findings: List[Finding],
    ) -> None:
        """
        Reopens the generated PDF, extracts selectable text across all pages,
        and verifies that none of the approved sensitive strings survive.
        """
        try:
            verify_doc = pymupdf.open(redacted_pdf_path)
        except Exception as e:
            raise PdfVerificationError(f"Verification failed: could not open redacted PDF: {e}")

        all_page_texts: List[str] = []
        for page_idx in range(len(verify_doc)):
            page = verify_doc[page_idx]
            page_text = page.get_text("text")
            all_page_texts.append(page_text)

        verify_doc.close()

        full_extracted = "\n".join(all_page_texts).lower()

        # Check each approved finding
        for f in approved_findings:
            if original_text and 0 <= f.start < f.end <= len(original_text):
                snippet = original_text[f.start:f.end].strip()
            else:
                snippet = ""

            # Only check nontrivial snippets (> 2 characters)
            if snippet and len(snippet) > 2:
                # Disallow finding's original value if found verbatim in text
                if snippet.lower() in full_extracted:
                    # Clean up failed artifact
                    try:
                        os.remove(redacted_pdf_path)
                    except OSError:
                        pass
                    snippet_preview = snippet if len(snippet) <= 10 else f"{snippet[:10]}..."
                    raise PdfVerificationError(
                        f"Redaction verification failed: sensitive content for finding '{f.id}' "
                        f"({f.entity_type}: '{snippet_preview}') was still recoverable in output PDF."
                    )
