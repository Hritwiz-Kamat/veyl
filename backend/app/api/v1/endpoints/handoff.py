"""
AI Handoff endpoints.
Provides preparation and explicit confirmation flows for external AI handoffs
(manual copy and optional mock providers).
Enforces fail-closed validation: only server-side sanitized content is ever dispatched.
"""
import logging
from fastapi import APIRouter, HTTPException, status

from app.schemas.handoff import (
    HandoffPrepareRequest,
    HandoffPrepareResponse,
    HandoffSendRequest,
    HandoffSendResponse,
)
from app.storage.session_store import SessionStore
from app.integrations.ai_providers.mock_provider import MockAIProvider, SUPPORTED_MOCK_PROVIDERS

logger = logging.getLogger(__name__)
router = APIRouter()
_session_store = SessionStore.get_instance()


@router.post(
    "/handoff/prepare",
    response_model=HandoffPrepareResponse,
    summary="Prepare AI handoff preview",
    description="Inspects sanitized session content and destination before user confirmation.",
    tags=["handoff"],
)
async def prepare_handoff(request: HandoffPrepareRequest) -> HandoffPrepareResponse:
    session = _session_store.get_session(request.session_id)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found or expired.",
        )

    if session.sanitized_text is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Session has not been sanitized yet. Please approve and sanitize before preparing handoff.",
        )

    if request.destination not in SUPPORTED_MOCK_PROVIDERS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported provider '{request.destination}'. Supported: {', '.join(SUPPORTED_MOCK_PROVIDERS.keys())}",
        )

    dest_name = SUPPORTED_MOCK_PROVIDERS[request.destination]
    sanitized_text = session.sanitized_text
    warning = None

    if session.has_unredacted_credentials:
        warning = (
            "DANGER: This session contains unredacted credentials/secrets that were excluded from sanitization. "
            "Transmitting this content may expose critical credentials."
        )

    return HandoffPrepareResponse(
        session_id=session.session_id,
        destination=request.destination,
        destination_name=dest_name,
        sanitized_content=sanitized_text,
        char_count=len(sanitized_text),
        has_unredacted_credentials=session.has_unredacted_credentials,
        can_handoff=True,
        warning=warning,
    )


@router.post(
    "/handoff/send",
    response_model=HandoffSendResponse,
    summary="Send sanitized prompt to mock AI provider",
    description="Executes mock AI handoff after explicit confirmation. Never sends original raw data.",
    tags=["handoff"],
)
async def send_handoff(request: HandoffSendRequest) -> HandoffSendResponse:
    if not request.confirmed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Explicit user confirmation is required before dispatching to an AI provider.",
        )

    session = _session_store.get_session(request.session_id)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found or expired.",
        )

    if session.sanitized_text is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot dispatch unsanitized content. You must sanitize first.",
        )

    if request.destination not in SUPPORTED_MOCK_PROVIDERS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported provider '{request.destination}'.",
        )

    # Execute mock completion
    result = MockAIProvider.simulate_completion(
        destination=request.destination,
        sanitized_text=session.sanitized_text,
    )

    return HandoffSendResponse(
        session_id=session.session_id,
        destination=request.destination,
        provider_name=result["provider_name"],
        status="success",
        simulated_response=result["simulated_response"],
        timestamp=result["timestamp"],
    )

