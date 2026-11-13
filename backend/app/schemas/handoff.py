"""
Schemas for AI handoff and mock provider integration.
"""
from typing import Optional, Dict
from pydantic import BaseModel, Field


class HandoffPrepareRequest(BaseModel):
    session_id: str = Field(..., description="ID of sanitized session")
    destination: str = Field(..., description="Target AI provider (e.g. mock-chatgpt, mock-claude, mock-cursor)")


class HandoffPrepareResponse(BaseModel):
    session_id: str
    destination: str
    destination_name: str
    sanitized_content: str = Field(..., description="The exact sanitized text that will be sent")
    char_count: int
    has_unredacted_credentials: bool
    can_handoff: bool
    warning: Optional[str] = None


class HandoffSendRequest(BaseModel):
    session_id: str = Field(..., description="ID of sanitized session")
    destination: str = Field(..., description="Target AI provider")
    confirmed: bool = Field(..., description="Explicit user confirmation for dispatch")


class HandoffSendResponse(BaseModel):
    session_id: str
    destination: str
    provider_name: str
    status: str
    simulated_response: str
    timestamp: str

