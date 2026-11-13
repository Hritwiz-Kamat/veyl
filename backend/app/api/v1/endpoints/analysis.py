"""
Analysis endpoints.
Handles PII and secret detection for submitted text prompts.
"""
import logging
from fastapi import APIRouter, HTTPException, status

from app.schemas.analysis import AnalyzeTextRequest, AnalyzeTextResponse
from app.services.analysis_service import AnalysisService

logger = logging.getLogger(__name__)
router = APIRouter()
_analysis_service = AnalysisService()


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
        # Never leak raw text or internal traces in error details
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while analyzing the text.",
        )

