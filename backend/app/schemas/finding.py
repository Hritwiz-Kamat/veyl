"""
Finding schema definition.
Represents a detected sensitive entity or secret span within text.
"""
from typing import Literal, Optional
from pydantic import BaseModel, Field

Severity = Literal["critical", "high", "medium", "low"]


class Finding(BaseModel):
    id: str = Field(..., description="Unique finding ID within the session")
    entity_type: str = Field(..., description="Type of detected entity (e.g. PERSON, EMAIL_ADDRESS, CREDENTIAL)")
    start: int = Field(..., ge=0, description="0-based character start index in original text")
    end: int = Field(..., ge=0, description="0-based character end index in original text (exclusive)")
    replacement: str = Field(..., description="Proposed placeholder replacement (e.g. [PERSON_1])")
    severity: Severity = Field(..., description="Risk severity: critical, high, medium, low")
    confidence: Optional[float] = Field(None, ge=0.0, le=1.0, description="Detector confidence score or None")
    source: str = Field(..., description="Detection source: presidio, regex, or secret")
    selected_by_default: bool = Field(True, description="Whether finding is checked by default for redaction")

