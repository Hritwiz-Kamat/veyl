"""
Analysis endpoints.
Handles PII and secret detection for text prompts and uploaded files (images/documents).
"""
import os
import uuid
import logging
from io import BytesIO
from PIL import Image
from collections import Counter
from fastapi import APIRouter, HTTPException, UploadFile, File, status

from app.schemas.analysis import (
    AnalyzeTextRequest,
    AnalyzeTextResponse,
    AnalyzeFileResponse,
    FileMetadata,
    AnalysisStats,
)
from app.services.analysis_service import AnalysisService
from app.processors.image_processor import ImageProcessor
from app.processors.pdf_processor import PdfProcessor
from app.storage.session_store import SessionStore
from app.core.config import settings

logger = logging.getLogger(__name__)
router = APIRouter()
_analysis_service = AnalysisService()
_session_store = SessionStore.get_instance()


@router.post(
    "/analyze/text",
    response_model=AnalyzeTextResponse,
    status_code=status.HTTP_200_OK,
    summary="Analyze text for sensitive information",
    description="Detects PII, identifiers, and secrets in text using local detectors. Returns findings and a short-lived session ID.",
    tags=["analysis"],
)
async def analyze_text(request: AnalyzeTextRequest) -> AnalyzeTextResponse:
    try:
        return _analysis_service.analyze_text(request)
    except Exception as e:
        logger.error(f"Error during text analysis: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while analyzing the text.",
        )


@router.post(
    "/analyze/file",
    response_model=AnalyzeFileResponse,
    status_code=status.HTTP_200_OK,
    summary="Analyze uploaded file (image or PDF)",
    description="Validates image or PDF, extracts text/OCR, detects sensitive entities, and maps character spans to bounding boxes.",
    tags=["analysis"],
)
async def analyze_file(file: UploadFile = File(...)) -> AnalyzeFileResponse:
    try:
        content = await file.read()
    except Exception as e:
        logger.error(f"Failed to read uploaded file: {e}")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Could not read uploaded file.")

    if len(content) > settings.MAX_UPLOAD_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds maximum allowed size of {settings.MAX_UPLOAD_BYTES // (1024 * 1024)}MB.",
        )

    filename_lower = (file.filename or "").lower()
    is_pdf = content.startswith(b"%PDF-") or filename_lower.endswith(".pdf") or file.content_type == "application/pdf"

    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

    # ── Handle PDF File ───────────────────────────────────────────────────────
    if is_pdf:
        pdf_val = PdfProcessor.validate_pdf(content)
        if not pdf_val.is_valid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=pdf_val.error_message or "Invalid or corrupted PDF file.",
            )

        temp_filename = f"{uuid.uuid4().hex}.pdf"
        temp_path = os.path.join(settings.UPLOAD_DIR, temp_filename)
        with open(temp_path, "wb") as f:
            f.write(content)

        extraction_result = PdfProcessor.extract_and_analyze(content, _analysis_service.registry)

        session_id = _session_store.create_file_session(
            file_path=temp_path,
            file_type="pdf",
            text=extraction_result.extracted_text,
            findings=extraction_result.findings,
        )

        has_credentials = any(f.severity == "critical" for f in extraction_result.findings)
        entity_counts = dict(Counter(f.entity_type for f in extraction_result.findings))
        stats = AnalysisStats(
            total_findings=len(extraction_result.findings),
            has_credentials=has_credentials,
            entity_counts=entity_counts,
        )

        metadata = FileMetadata(
            filename=file.filename or temp_filename,
            content_type="PDF",
            size_bytes=len(content),
            page_count=extraction_result.page_count,
        )

        return AnalyzeFileResponse(
            session_id=session_id,
            file_type="pdf",
            metadata=metadata,
            extracted_text=extraction_result.extracted_text,
            findings=extraction_result.findings,
            stats=stats,
            is_incomplete_scan=extraction_result.is_incomplete,
            scan_warning=extraction_result.scan_warning,
        )

    # ── Handle Image File ─────────────────────────────────────────────────────
    val_result = ImageProcessor.validate_image(content)
    if not val_result.is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=val_result.error_message or "Unsupported or invalid file format. Allowed: PNG, JPEG, WEBP, PDF.",
        )

    ext = (val_result.format_name or "png").lower()
    temp_filename = f"{uuid.uuid4().hex}.{ext}"
    temp_path = os.path.join(settings.UPLOAD_DIR, temp_filename)

    with open(temp_path, "wb") as f:
        f.write(content)

    with Image.open(BytesIO(content)) as img:
        ocr_text, ocr_words, is_complete, scan_warning = ImageProcessor.extract_words_and_text(img)

    findings = _analysis_service.registry.analyze(ocr_text) if ocr_text else []

    if findings and ocr_words:
        findings = ImageProcessor.map_findings_to_boxes(findings, ocr_words)

    session_id = _session_store.create_file_session(
        file_path=temp_path,
        file_type="image",
        text=ocr_text,
        findings=findings,
        dimensions=(val_result.width, val_result.height),
    )

    has_credentials = any(f.severity == "critical" for f in findings)
    entity_counts = dict(Counter(f.entity_type for f in findings))
    stats = AnalysisStats(
        total_findings=len(findings),
        has_credentials=has_credentials,
        entity_counts=entity_counts,
    )

    metadata = FileMetadata(
        filename=file.filename or temp_filename,
        content_type=val_result.format_name or "IMAGE",
        size_bytes=len(content),
        image_width=val_result.width,
        image_height=val_result.height,
    )

    return AnalyzeFileResponse(
        session_id=session_id,
        file_type="image",
        metadata=metadata,
        extracted_text=ocr_text,
        findings=findings,
        stats=stats,
        is_incomplete_scan=not is_complete,
        scan_warning=scan_warning,
    )
