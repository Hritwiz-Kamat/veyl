"""
In-memory session manager with TTL-based expiration and temporary file lifecycle tracking.
Stores original text, uploaded files, and detected findings server-side so clients only
reference session IDs and finding IDs without transmitting raw text or sensitive files.
Automatically purges temporary files on disk upon deletion or expiry.
"""
import os
import uuid
import threading
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Optional, Tuple
from pydantic import BaseModel, Field

from app.schemas.finding import Finding


class SessionData(BaseModel):
    session_id: str
    file_type: str = "text"  # "text" | "image" | "pdf"
    original_text: str = ""
    original_file_path: Optional[str] = None
    artifact_id: Optional[str] = None
    artifact_file_path: Optional[str] = None
    sanitized_text: Optional[str] = None
    has_unredacted_credentials: bool = False
    image_dimensions: Optional[Tuple[int, int]] = None
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
            file_type="text",
            original_text=text,
            findings=findings_map,
            created_at=now,
            expires_at=expires_at,
        )

        with self._lock:
            self._cleanup_expired_locked()
            self._sessions[session_id] = session_data

        return session_id

    def create_file_session(
        self,
        file_path: str,
        file_type: str,
        text: str,
        findings: List[Finding],
        dimensions: Optional[Tuple[int, int]] = None,
    ) -> str:
        """Stores file reference, OCR text, and findings."""
        session_id = uuid.uuid4().hex
        now = datetime.now(timezone.utc)
        expires_at = now + self.ttl

        findings_map = {f.id: f for f in findings}

        session_data = SessionData(
            session_id=session_id,
            file_type=file_type,
            original_text=text,
            original_file_path=file_path,
            image_dimensions=dimensions,
            findings=findings_map,
            created_at=now,
            expires_at=expires_at,
        )

        with self._lock:
            self._cleanup_expired_locked()
            self._sessions[session_id] = session_data

        return session_id

    def set_artifact(self, session_id: str, artifact_id: str, artifact_path: str) -> None:
        """Associates a sanitized artifact with the session."""
        with self._lock:
            session = self._sessions.get(session_id)
            if session:
                session.artifact_id = artifact_id
                session.artifact_file_path = artifact_path

    def set_sanitized_text(self, session_id: str, sanitized_text: str, has_unredacted_credentials: bool = False) -> None:
        """Stores the sanitized text and credential warning status in the session."""
        with self._lock:
            session = self._sessions.get(session_id)
            if session:
                session.sanitized_text = sanitized_text
                session.has_unredacted_credentials = has_unredacted_credentials

    def get_session(self, session_id: str) -> Optional[SessionData]:
        """Retrieves session if valid and not expired."""
        with self._lock:
            session = self._sessions.get(session_id)
            if not session:
                return None
            if datetime.now(timezone.utc) > session.expires_at:
                self._purge_session_files(session)
                del self._sessions[session_id]
                return None
            return session

    def delete_session(self, session_id: str) -> bool:
        """Deletes session and purges associated files from disk."""
        with self._lock:
            session = self._sessions.pop(session_id, None)
            if session:
                self._purge_session_files(session)
                return True
            return False

    def _purge_session_files(self, session: SessionData) -> None:
        """Securely removes temporary files associated with the session."""
        for path in (session.original_file_path, session.artifact_file_path):
            if path and os.path.exists(path):
                try:
                    os.remove(path)
                except OSError:
                    pass

    def _cleanup_expired_locked(self) -> int:
        now = datetime.now(timezone.utc)
        expired_ids = [sid for sid, s in self._sessions.items() if now > s.expires_at]
        for sid in expired_ids:
            session = self._sessions.pop(sid, None)
            if session:
                self._purge_session_files(session)
        return len(expired_ids)

    def cleanup_expired(self) -> int:
        with self._lock:
            return self._cleanup_expired_locked()

    def cleanup_stale_disk_files(self, directories: Optional[List[str]] = None, max_age_seconds: int = 1800) -> int:
        """
        Removes orphaned files on disk older than max_age_seconds that are not tracked
        by any active in-memory session.
        """
        from app.core.config import settings
        import time

        target_dirs = directories or [settings.UPLOAD_DIR, settings.SANITIZED_DIR]
        now_ts = time.time()
        purged_count = 0

        # Collect active file paths from current sessions
        with self._lock:
            active_paths = set()
            for s in self._sessions.values():
                if s.original_file_path:
                    active_paths.add(os.path.abspath(s.original_file_path))
                if s.artifact_file_path:
                    active_paths.add(os.path.abspath(s.artifact_file_path))

        for directory in target_dirs:
            if not os.path.exists(directory):
                continue
            try:
                for entry in os.scandir(directory):
                    if entry.is_file():
                        abs_entry = os.path.abspath(entry.path)
                        if abs_entry not in active_paths:
                            try:
                                mtime = entry.stat().st_mtime
                                if (now_ts - mtime) > max_age_seconds:
                                    os.remove(entry.path)
                                    purged_count += 1
                            except OSError:
                                pass
            except OSError:
                pass

        return purged_count
