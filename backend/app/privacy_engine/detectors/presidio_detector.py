"""
Presidio Analyzer Detector wrapper.
Initializes Microsoft Presidio with local spaCy model (en_core_web_sm).
Configured to operate completely offline without external network calls.
"""
import logging
from typing import List, Optional
from presidio_analyzer import AnalyzerEngine
from presidio_analyzer.nlp_engine import NlpEngineProvider

from app.privacy_engine.detectors.secret_detector import RawDetection

logger = logging.getLogger(__name__)


class PresidioDetector:
    _instance: Optional["PresidioDetector"] = None
    _analyzer: Optional[AnalyzerEngine] = None

    @classmethod
    def get_instance(cls) -> "PresidioDetector":
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def __init__(self) -> None:
        self._init_analyzer()

    def _init_analyzer(self) -> None:
        try:
            nlp_configuration = {
                "nlp_engine_name": "spacy",
                "models": [{"lang_code": "en", "model_name": "en_core_web_sm"}],
            }
            provider = NlpEngineProvider(nlp_configuration=nlp_configuration)
            nlp_engine = provider.create_engine()
            self._analyzer = AnalyzerEngine(
                nlp_engine=nlp_engine,
                supported_languages=["en"],
            )
            logger.info("Presidio AnalyzerEngine initialized with en_core_web_sm")
        except Exception as e:
            logger.error(f"Failed to initialize Presidio AnalyzerEngine: {e}")
            self._analyzer = None

    def analyze(self, text: str) -> List[RawDetection]:
        findings: List[RawDetection] = []
        if not text or not self._analyzer:
            return findings

        try:
            results = self._analyzer.analyze(
                text=text,
                language="en",
                score_threshold=0.4,
            )

            for res in results:
                findings.append(
                    RawDetection(
                        entity_type=res.entity_type,
                        start=res.start,
                        end=res.end,
                        confidence=round(res.score, 2),
                        source="presidio",
                    )
                )
        except Exception as e:
            logger.warning(f"Presidio detection error: {e}")

        return findings

