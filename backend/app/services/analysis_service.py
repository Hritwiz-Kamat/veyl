"""
Analysis Service.
Coordinates privacy engine detection, session persistence, and statistical aggregation.
"""
from typing import Optional
from collections import Counter

from app.schemas.analysis import AnalyzeTextRequest, AnalyzeTextResponse, AnalysisStats
from app.privacy_engine.registry import DetectorRegistry
from app.storage.session_store import SessionStore


class AnalysisService:
    def __init__(
        self,
        registry: Optional[DetectorRegistry] = None,
        session_store: Optional[SessionStore] = None,
    ) -> None:
        self.registry = registry or DetectorRegistry()
        self.session_store = session_store or SessionStore.get_instance()

    def analyze_text(self, request: AnalyzeTextRequest) -> AnalyzeTextResponse:
        """Analyzes text for sensitive entities, stores the session, and returns findings."""
        text = request.text

        # 1. Detect findings
        findings = self.registry.analyze(text)

        # 2. Persist session
        session_id = self.session_store.create_session(text=text, findings=findings)

        # 3. Compute stats
        has_credentials = any(f.severity == "critical" for f in findings)
        entity_counts = dict(Counter(f.entity_type for f in findings))

        stats = AnalysisStats(
            total_findings=len(findings),
            has_credentials=has_credentials,
            entity_counts=entity_counts,
        )

        return AnalyzeTextResponse(
            session_id=session_id,
            findings=findings,
            stats=stats,
        )

