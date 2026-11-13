"""
Session management, sanitization, and artifact download endpoints.
"""
import os
import logging
from fastapi import APIRouter, HTTPException, status
from fastapi.responses import FileResponse

from app.schemas.session import SanitizeRequest, SanitizeResponse, SessionResponse
from app.storage.session_store import SessionStore
from app.privacy_engine.anonymizers.text_sanitizer import TextSanitizer, SanitizationError
from app.privacy_engine.anonymizers.image_sanitizer import ImageSanitizer, ImageSanitizerError
from app.privacy_engine.anonymizers.pdf_sanitizer import PdfSanitizer, PdfSanitizationError, PdfVerificationError
from app.core.config import settings

logger = logging.getLogger(__name__)
router = APIRouter()
_session_store = SessionStore.get_instance()


@router.get(
    "/sessions/{session_id}",
    response_model=SessionResponse,
    summary="Get session details",
    description="Retrieves active findings, file type, and expiration metadata for a session.",
    tags=["sessions"],
)
async def get_session(session_id: str) -> SessionResponse:
    session = _session_store.get_session(session_id)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found or expired.",
        )

    return SessionResponse(
        session_id=session.session_id,
        file_type=session.file_type,
        original_file_path=session.original_file_path,
        findings=list(session.findings.values()),
        created_at=session.created_at,
        expires_at=session.expires_at,
        artifact_id=session.artifact_id,
    )


@router.post(
    "/sessions/{session_id}/sanitize",
    response_model=SanitizeResponse,
    summary="Sanitize approved findings",
    description="Transforms text and/or applies pixel-level masking to images for approved finding IDs.",
    tags=["sessions"],
)
async def sanitize_session(session_id: str, request: SanitizeRequest) -> SanitizeResponse:
    session = _session_store.get_session(session_id)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found or expired.",
        )

    approved_ids = set(request.approved_finding_ids)

    # Validate that every approved ID belongs to this session
    invalid_ids = approved_ids - set(session.findings.keys())
    if invalid_ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="One or more finding IDs are invalid for this session.",
        )

    approved_findings = [
        finding for fid, finding in session.findings.items() if fid in approved_ids
    ]

    # Text sanitization
    try:
        sanitized_text = TextSanitizer.sanitize(
            original_text=session.original_text,
            approved_findings=approved_findings,
        )
    except SanitizationError as e:
        logger.error(f"Sanitization error in session {session_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to sanitize text due to span conflict.",
        )

    artifact_id = None
    artifact_download_url = None

    # Image pixel-level redaction
    if session.file_type == "image" and session.original_file_path:
        try:
            art_id, art_path = ImageSanitizer.redact_image(
                input_image_path=session.original_file_path,
                approved_findings=approved_findings,
                output_directory=settings.SANITIZED_DIR,
                session_id=session_id,
            )
            _session_store.set_artifact(session_id, art_id, art_path)
            artifact_id = art_id
            artifact_download_url = f"/api/v1/sessions/{session_id}/artifact/{art_id}"
        except ImageSanitizerError as e:
            logger.error(f"Image redaction error in session {session_id}: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to redact image pixels.",
            )

    # PDF true redaction & verification
    if session.file_type == "pdf" and session.original_file_path:
        try:
            art_id, art_path = PdfSanitizer.redact_pdf(
                input_pdf_path=session.original_file_path,
                original_text=session.original_text,
                approved_findings=approved_findings,
                output_directory=settings.SANITIZED_DIR,
                session_id=session_id,
            )
            _session_store.set_artifact(session_id, art_id, art_path)
            artifact_id = art_id
            artifact_download_url = f"/api/v1/sessions/{session_id}/artifact/{art_id}"
        except PdfVerificationError as e:
            logger.error(f"PDF redaction verification failed for session {session_id}: {e}")
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=str(e),
            )
        except PdfSanitizationError as e:
            logger.error(f"PDF redaction error for session {session_id}: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to redact PDF: {str(e)}",
            )

    # Check unapproved findings
    skipped_findings = [
        finding for fid, finding in session.findings.items() if fid not in approved_ids
    ]
    has_unredacted_credentials = any(f.severity == "critical" for f in skipped_findings)

    # Persist sanitized result in session for downstream handoff
    _session_store.set_sanitized_text(
        session_id=session_id,
        sanitized_text=sanitized_text,
        has_unredacted_credentials=has_unredacted_credentials,
    )

    return SanitizeResponse(
        sanitized_text=sanitized_text,
        applied_count=len(approved_findings),
        skipped_count=len(skipped_findings),
        all_sanitized=(len(skipped_findings) == 0),
        has_unredacted_credentials=has_unredacted_credentials,
        artifact_id=artifact_id,
        artifact_download_url=artifact_download_url,
    )


@router.get(
    "/sessions/{session_id}/artifact/{artifact_id}",
    summary="Download sanitized artifact",
    description="Downloads the pixel-redacted sanitized image or document artifact.",
    tags=["sessions"],
)
async def download_artifact(session_id: str, artifact_id: str) -> FileResponse:
    session = _session_store.get_session(session_id)
    if not session or session.artifact_id != artifact_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Artifact not found or session expired.",
        )

    if not session.artifact_file_path or not os.path.exists(session.artifact_file_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Artifact file missing from storage.",
        )

    is_pdf = session.file_type == "pdf" or (session.artifact_file_path and session.artifact_file_path.endswith(".pdf"))
    media_type = "application/pdf" if is_pdf else "image/png"
    filename = f"sanitized_{artifact_id}.pdf" if is_pdf else f"sanitized_{artifact_id}.png"

    return FileResponse(
        path=session.artifact_file_path,
        media_type=media_type,
        filename=filename,
    )


@router.delete(
    "/sessions/{session_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete session and cleanup",
    description="Purges session data, findings, and temporary files from disk immediately.",
    tags=["sessions"],
)
async def delete_session(session_id: str) -> None:
    deleted = _session_store.delete_session(session_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found or already deleted.",
        )
