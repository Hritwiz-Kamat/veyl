"""
Analysis API request and response schemas.
"""
from typing import List, Optional
from pydantic import BaseModel, Field

from app.schemas.finding import Finding


class AnalyzeTextRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=100000, description="Plain text prompt or document content to analyze")


class AnalysisStats(BaseModel):
    total_findings: int = Field(..., ge=0, description="Total detected findings after overlap resolution")
    has_credentials: bool = Field(False, description="Flag indicating critical secret/credential findings")
    entity_counts: dict[str, int] = Field(default_factory=dict, description="Count of findings per entity type")


class AnalyzeTextResponse(BaseModel):
    session_id: str = Field(..., description="Short-lived session identifier for sanitization handoff")
    findings: List[Finding] = Field(default_factory=list, description="Ordered list of non-overlapping findings")
    stats: Optional[AnalysisStats] = Field(None, description="Summary statistics for UI display")

