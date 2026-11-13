"""
Session management and sanitization endpoints.
"""
import logging
from fastapi import APIRouter, HTTPException, status

from app.schemas.session import SanitizeRequest, SanitizeResponse, SessionResponse
from app.storage.session_store import SessionStore
from app.privacy_engine.anonymizers.text_sanitizer import TextSanitizer, SanitizationError

logger = logging.getLogger(__name__)
router = APIRouter()
_session_store = SessionStore.get_instance()


@router.get(
    "/sessions/{session_id}",
    response_model=SessionResponse,
    summary="Get session details",
    description="Retrieves active findings and expiration metadata for a session.",
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
        findings=list(session.findings.values()),
        created_at=session.created_at,
        expires_at=session.expires_at,
    )


@router.post(
    "/sessions/{session_id}/sanitize",
    response_model=SanitizeResponse,
    summary="Sanitize approved findings",
    description="Validates approved finding IDs against server-side storage and transforms the original text right-to-left.",
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

    # Check unapproved findings
    skipped_findings = [
        finding for fid, finding in session.findings.items() if fid not in approved_ids
    ]
    has_unredacted_credentials = any(f.severity == "critical" for f in skipped_findings)

    return SanitizeResponse(
        sanitized_text=sanitized_text,
        applied_count=len(approved_findings),
        skipped_count=len(skipped_findings),
        all_sanitized=(len(skipped_findings) == 0),
        has_unredacted_credentials=has_unredacted_credentials,
    )


@router.delete(
    "/sessions/{session_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete session and cleanup",
    description="Purges session data and findings from memory immediately.",
    tags=["sessions"],
)
async def delete_session(session_id: str) -> None:
    deleted = _session_store.delete_session(session_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found or already deleted.",
        )
