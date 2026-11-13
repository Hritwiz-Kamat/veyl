"""
Unit tests for ReplacementPolicy and Severity Policy.
"""
from app.privacy_engine.policies.replacement import ReplacementPolicy
from app.privacy_engine.policies.severity import get_severity_for_entity


def test_consistent_replacement():
    policy = ReplacementPolicy()

    # First occurrence of Alice
    rep1 = policy.get_replacement("PERSON", "Alice Smith")
    assert rep1 == "[PERSON_1]"

    # Second occurrence of Alice (case-insensitive normalized)
    rep2 = policy.get_replacement("PERSON", "alice smith")
    assert rep2 == "[PERSON_1]"

    # Distinct person Bob
    rep3 = policy.get_replacement("PERSON", "Bob Jones")
    assert rep3 == "[PERSON_2]"

    # Different entity type starts at 1
    rep_email = policy.get_replacement("EMAIL_ADDRESS", "alice@example.com")
    assert rep_email == "[EMAIL_ADDRESS_1]"


def test_severity_mappings():
    assert get_severity_for_entity("OPENAI_KEY") == "critical"
    assert get_severity_for_entity("PASSWORD") == "critical"
    assert get_severity_for_entity("US_SSN") == "high"
    assert get_severity_for_entity("CREDIT_CARD") == "high"
    assert get_severity_for_entity("PERSON") == "medium"
    assert get_severity_for_entity("EMAIL_ADDRESS") == "medium"
    assert get_severity_for_entity("URL") == "low"

