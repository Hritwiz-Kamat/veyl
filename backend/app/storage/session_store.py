"""
In-memory session manager with TTL-based expiration.
Stores original text and detected findings server-side so clients only
reference session IDs and finding IDs without transmitting raw text back.
"""
import uuid
import threading
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Optional
from pydantic import BaseModel, Field

from app.schemas.finding import Finding
from app.core.config import settings


class SessionData(BaseModel):
    session_id: str
    original_text: str
    findings: Dict[str, Finding] = Field(default_factory=dict)
    created_at: datetime
    expires_at: datetime


class SessionStore:
    _instance: Optional["SessionStore"] = None

    @classmethod
    def get_instance(cls) -> "SessionStore":
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def __init__(self, ttl_minutes: int = 15) -> None:
        self.ttl = timedelta(minutes=ttl_minutes)
        self._sessions: Dict[str, SessionData] = {}
        self._lock = threading.Lock()

    def create_session(self, text: str, findings: List[Finding]) -> str:
        """Stores text and findings, returning a new session ID."""
        session_id = uuid.uuid4().hex
        now = datetime.now(timezone.utc)
        expires_at = now + self.ttl

        findings_map = {f.id: f for f in findings}

        session_data = SessionData(
            session_id=session_id,
            original_text=text,
            findings=findings_map,
            created_at=now,
            expires_at=expires_at,
        )

        with self._lock:
            # Run opportunistic cleanup
            self._cleanup_expired_locked()
            self._sessions[session_id] = session_data

        return session_id

    def get_session(self, session_id: str) -> Optional[SessionData]:
        """Retrieves session if valid and not expired."""
        with self._lock:
            session = self._sessions.get(session_id)
            if not session:
                return None
            if datetime.now(timezone.utc) > session.expires_at:
                del self._sessions[session_id]
                return None
            return session

    def delete_session(self, session_id: str) -> bool:
        """Deletes session and returns True if it existed."""
        with self._lock:
            if session_id in self._sessions:
                del self._sessions[session_id]
                return True
            return False

    def _cleanup_expired_locked(self) -> int:
        now = datetime.now(timezone.utc)
        expired_ids = [sid for sid, s in self._sessions.items() if now > s.expires_at]
        for sid in expired_ids:
            del self._sessions[sid]
        return len(expired_ids)

    def cleanup_expired(self) -> int:
        with self._lock:
            return self._cleanup_expired_locked()

