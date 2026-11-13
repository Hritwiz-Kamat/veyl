"""
Replacement policy: generates consistent placeholders for detected entities.
Repeated mentions of the exact same value receive identical placeholders
(e.g., all occurrences of "Alice" map to [PERSON_1]).
"""
from typing import Dict, Tuple


class ReplacementPolicy:
    def __init__(self) -> None:
        # Maps (entity_type, normalized_value) -> placeholder token
        self._value_map: Dict[Tuple[str, str], str] = {}
        # Tracks current index counter for each entity type
        self._counter: Dict[str, int] = {}

    def get_replacement(self, entity_type: str, raw_text: str) -> str:
        """
        Returns a consistent replacement string for the entity and text snippet.
        e.g. [PERSON_1], [EMAIL_ADDRESS_1], [CREDENTIAL_1]
        """
        clean_type = entity_type.upper().strip()
        normalized_val = raw_text.strip().lower()

        key = (clean_type, normalized_val)
        if key in self._value_map:
            return self._value_map[key]

        current_idx = self._counter.get(clean_type, 0) + 1
        self._counter[clean_type] = current_idx

        token = f"[{clean_type}_{current_idx}]"
        self._value_map[key] = token
        return token

    def reset(self) -> None:
        self._value_map.clear()
        self._counter.clear()

