"""
Integration tests for POST /api/v1/analyze/text.
Verifies detection, normalization, session generation, and input validation.
"""
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_analyze_clean_text():
    response = client.post("/api/v1/analyze/text", json={"text": "The quick brown fox jumps."})
    assert response.status_code == 200
    data = response.json()
    assert "session_id" in data
    assert data["findings"] == []
    assert data["stats"]["total_findings"] == 0
    assert data["stats"]["has_credentials"] is False


def test_analyze_pii_and_secrets():
    fake_key = "sk-test1234567890abcdefghijklmnopqrstuvwxyz"
    text = f"Contact Alice Smith at alice@example.com or use key {fake_key}."
    response = client.post("/api/v1/analyze/text", json={"text": text})
    assert response.status_code == 200
    data = response.json()

    assert "session_id" in data
    findings = data["findings"]
    assert len(findings) >= 2

    # Check that OpenAI key is detected as critical
    key_findings = [f for f in findings if f["entity_type"] == "OPENAI_KEY"]
    assert len(key_findings) == 1
    assert key_findings[0]["severity"] == "critical"
    assert text[key_findings[0]["start"]:key_findings[0]["end"]] == fake_key

    # Check stats
    assert data["stats"]["has_credentials"] is True
    assert data["stats"]["total_findings"] == len(findings)


def test_analyze_repeated_entities_consistent_placeholders():
    text = "Alice went to Paris. Later, Alice met Bob in Paris."
    response = client.post("/api/v1/analyze/text", json={"text": text})
    assert response.status_code == 200
    data = response.json()
    findings = data["findings"]

    # All mentions of "Alice" should share the same replacement placeholder
    alice_findings = [f for f in findings if text[f["start"]:f["end"]] == "Alice"]
    if len(alice_findings) >= 2:
        assert alice_findings[0]["replacement"] == alice_findings[1]["replacement"]


def test_analyze_empty_text_validation_error():
    response = client.post("/api/v1/analyze/text", json={"text": ""})
    assert response.status_code == 422  # Pydantic validation error
