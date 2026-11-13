"""
Finding schema definition.
Represents a detected sensitive entity, secret span, or visual bounding region.
"""
from typing import Literal, Optional, List
from pydantic import BaseModel, Field

Severity = Literal["critical", "high", "medium", "low"]


class BoundingBox(BaseModel):
    x: int = Field(..., ge=0, description="X coordinate (left) in original image pixels")
    y: int = Field(..., ge=0, description="Y coordinate (top) in original image pixels")
    width: int = Field(..., ge=0, description="Width of bounding box in pixels")
    height: int = Field(..., ge=0, description="Height of bounding box in pixels")


class Finding(BaseModel):
    id: str = Field(..., description="Unique finding ID within the session")
    entity_type: str = Field(..., description="Type of detected entity (e.g. PERSON, EMAIL_ADDRESS, CREDENTIAL)")
    start: int = Field(..., ge=0, description="0-based character start index in text")
    end: int = Field(..., ge=0, description="0-based character end index in text (exclusive)")
    replacement: str = Field(..., description="Proposed placeholder replacement (e.g. [PERSON_1])")
    severity: Severity = Field(..., description="Risk severity: critical, high, medium, low")
    confidence: Optional[float] = Field(None, ge=0.0, le=1.0, description="Detector confidence score or None")
    source: str = Field(..., description="Detection source: presidio, regex, secret, or ocr")
    selected_by_default: bool = Field(True, description="Whether finding is checked by default for redaction")
    bounding_boxes: Optional[List[BoundingBox]] = Field(
        default=None,
        description="Bounding boxes in original image coordinates for visual redaction"
    )
    page_number: Optional[int] = Field(
        default=None,
        ge=1,
        description="1-based page number for multi-page documents/PDFs"
    )
