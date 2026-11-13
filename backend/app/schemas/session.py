"""
Session and sanitization schemas.
"""
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field

from app.schemas.finding import Finding


class SanitizeRequest(BaseModel):
    approved_finding_ids: List[str] = Field(
        default_factory=list,
        description="List of finding IDs approved by user for redaction"
    )


class SanitizeResponse(BaseModel):
    sanitized_text: str = Field(..., description="The transformed text with approved replacements applied")
    applied_count: int = Field(..., ge=0, description="Count of approved findings that were replaced")
    skipped_count: int = Field(..., ge=0, description="Count of detected findings that were left unredacted")
    all_sanitized: bool = Field(..., description="True if 100% of detected findings were sanitized")
    has_unredacted_credentials: bool = Field(
        False,
        description="Warning flag if any critical secrets were excluded from approved_finding_ids"
    )
    artifact_id: Optional[str] = Field(None, description="Unique artifact ID for downloadable sanitized file")
    artifact_download_url: Optional[str] = Field(None, description="Relative URL to download sanitized artifact")


class SessionResponse(BaseModel):
    session_id: str = Field(..., description="Unique session identifier")
    file_type: str = Field(default="text", description="Type of session content: text, image, pdf")
    original_file_path: Optional[str] = Field(None, description="Server-side path to original uploaded file if any")
    findings: List[Finding] = Field(default_factory=list, description="All detected findings for this session")
    created_at: datetime = Field(..., description="Timestamp of session creation")
    expires_at: datetime = Field(..., description="Timestamp when session expires")
    artifact_id: Optional[str] = Field(None, description="Sanitized artifact ID if produced")
