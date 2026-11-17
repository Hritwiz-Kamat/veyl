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

    @staticmethod
    def _get_word_rects(page) -> list:
        """
        Extract every word on the page with its bounding rectangle.
        Returns list of (word_text, pymupdf.Rect).
        Uses get_text("words") which returns:
          (x0, y0, x1, y1, "word", block_no, line_no, word_no)
        """
        results = []
        for w in page.get_text("words"):
            x0, y0, x1, y1 = w[:4]
            word_text = w[4]
            results.append((word_text, pymupdf.Rect(x0, y0, x1, y1)))
        return results

    @classmethod
    def _redact_snippet_on_page(cls, page, snippet: str) -> bool:
        """
        Finds and marks redaction annotations for a text snippet on a page.
        Uses multiple strategies:
          1. Exact text search via page.search_for()
          2. Word-level matching via get_text("words") for multi-word entities
        Returns True if any redaction annotations were added.
        """
        added = False

        # Strategy 1: Exact text search (works when PDF text runs match)
        hits = page.search_for(snippet)
        for r in hits:
            pad = pymupdf.Rect(r.x0 - 1, r.y0 - 1, r.x1 + 1, r.y1 + 1)
            page.add_redact_annot(pad, fill=(0, 0, 0))
            added = True

        # Strategy 2: Word-level matching — get all words on the page and
        # redact any word that is part of the snippet.  This handles text
        # that is split across multiple internal PDF text runs.
        snippet_lower = snippet.lower()
        snippet_words = snippet_lower.split()

        if snippet_words:
            page_words = cls._get_word_rects(page)

            # For single-word snippets, just find that word
            if len(snippet_words) == 1:
                target = snippet_words[0]
                for word_text, rect in page_words:
                    if target in word_text.lower():
                        pad = pymupdf.Rect(rect.x0 - 1, rect.y0 - 1, rect.x1 + 1, rect.y1 + 1)
                        page.add_redact_annot(pad, fill=(0, 0, 0))
                        added = True
            else:
                # For multi-word snippets, use a sliding window over page words
                # to find sequences that match the snippet words
                for i in range(len(page_words)):
                    # Try matching starting from position i
                    matched_rects = []
                    si = 0  # index into snippet_words
                    for j in range(i, min(i + len(snippet_words) + 5, len(page_words))):
                        pw_text = page_words[j][0].lower().strip(".,;:!?()[]{}\"'")
                        if si < len(snippet_words) and (
                            pw_text == snippet_words[si] or
                            snippet_words[si] in pw_text or
                            pw_text in snippet_words[si]
                        ):
                            matched_rects.append(page_words[j][1])
                            si += 1
                            if si >= len(snippet_words):
                                break

                    # If we matched all snippet words, redact all their rects
                    if si >= len(snippet_words) and matched_rects:
                        for rect in matched_rects:
                            pad = pymupdf.Rect(rect.x0 - 1, rect.y0 - 1, rect.x1 + 1, rect.y1 + 1)
                            page.add_redact_annot(pad, fill=(0, 0, 0))
                            added = True

        return added

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

        # Collect all snippets to redact (for cross-page sweep)
        all_snippets: List[str] = []
        for f in approved_findings:
            snippet = original_text[f.start:f.end].strip() if original_text and 0 <= f.start < f.end <= len(original_text) else ""
            if snippet and len(snippet) >= 2:
                all_snippets.append(snippet)

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

                # Phase 1: Redact bounding boxes from detection
                for f in page_findings:
                    if f.bounding_boxes:
                        for box in f.bounding_boxes:
                            rect = pymupdf.Rect(
                                box.x - 1,
                                box.y - 1,
                                box.x + box.width + 1,
                                box.y + box.height + 1,
                            )
                            page.add_redact_annot(rect, fill=(0, 0, 0))

                # Phase 2: Search-based redaction for page-specific findings
                for f in page_findings:
                    snippet = original_text[f.start:f.end].strip() if original_text and 0 <= f.start < f.end <= len(original_text) else ""
                    if snippet and len(snippet) >= 2:
                        cls._redact_snippet_on_page(page, snippet)

                # Phase 3: Cross-page sweep — search ALL snippets on EVERY page
                # This catches text that appears on unexpected pages or was
                # assigned the wrong page number during detection
                for snippet in all_snippets:
                    cls._redact_snippet_on_page(page, snippet)

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

            # Only check nontrivial snippets (> 3 characters) to avoid false positives
            if snippet and len(snippet) > 3:
                if snippet.lower() in full_extracted:
                    # Clean up failed artifact
                    try:
                        os.remove(redacted_pdf_path)
                    except OSError:
                        pass
                    snippet_preview = snippet if len(snippet) <= 10 else f"{snippet[:10]}..."
                    logger.error(
                        f"Verification failure: '{snippet}' (type={f.entity_type}) "
                        f"still found in redacted PDF"
                    )
                    raise PdfVerificationError(
                        f"Redaction verification failed: sensitive content for finding '{f.id}' "
                        f"({f.entity_type}: '{snippet_preview}') was still recoverable in output PDF."
                    )
