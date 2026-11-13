"""
Integration tests for session retrieval, sanitization, and lifecycle endpoints.
"""
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_full_analysis_and_sanitization_flow():
    # 1. Analyze text with PII and secret
    fake_key = "sk-test1234567890abcdefghijklmnopqrstuvwxyz"
    prompt = f"Hello Alice Smith, your key is {fake_key}."
    analyze_resp = client.post("/api/v1/analyze/text", json={"text": prompt})
    assert analyze_resp.status_code == 200
    data = analyze_resp.json()

    session_id = data["session_id"]
    findings = data["findings"]
    assert len(findings) >= 2

    # 2. Get session details
    get_resp = client.get(f"/api/v1/sessions/{session_id}")
    assert get_resp.status_code == 200
    session_data = get_resp.json()
    assert session_data["session_id"] == session_id
    assert len(session_data["findings"]) == len(findings)

    # 3. Sanitize with ALL findings approved
    all_finding_ids = [f["id"] for f in findings]
    sanitize_resp = client.post(
        f"/api/v1/sessions/{session_id}/sanitize",
        json={"approved_finding_ids": all_finding_ids},
    )
    assert sanitize_resp.status_code == 200
    sanitize_data = sanitize_resp.json()

    assert sanitize_data["applied_count"] == len(findings)
    assert sanitize_data["skipped_count"] == 0
    assert sanitize_data["all_sanitized"] is True
    assert sanitize_data["has_unredacted_credentials"] is False

    # Check transformed text
    sanitized_text = sanitize_data["sanitized_text"]
    assert fake_key not in sanitized_text
    assert "Alice Smith" not in sanitized_text
    assert "[OPENAI_KEY_1]" in sanitized_text or "[CREDENTIAL" in sanitized_text or "[PERSON_1]" in sanitized_text


def test_partial_sanitization_warning_for_unredacted_credentials():
    fake_key = "sk-test1234567890abcdefghijklmnopqrstuvwxyz"
    prompt = f"Alice Smith has key {fake_key}."
    analyze_resp = client.post("/api/v1/analyze/text", json={"text": prompt})
    data = analyze_resp.json()
    session_id = data["session_id"]
    findings = data["findings"]

    # Approve ONLY the PERSON finding (skipping the critical OPENAI_KEY finding)
    person_findings = [f["id"] for f in findings if f["entity_type"] == "PERSON"]
    assert len(person_findings) >= 1

    sanitize_resp = client.post(
        f"/api/v1/sessions/{session_id}/sanitize",
        json={"approved_finding_ids": person_findings},
    )
    assert sanitize_resp.status_code == 200
    s_data = sanitize_resp.json()

    assert s_data["applied_count"] == len(person_findings)
    assert s_data["skipped_count"] > 0
    assert s_data["all_sanitized"] is False
    # Since we skipped the secret, has_unredacted_credentials must be True!
    assert s_data["has_unredacted_credentials"] is True
    # The secret should still remain in the text
    assert fake_key in s_data["sanitized_text"]


def test_sanitize_with_invalid_finding_id_rejected():
    prompt = "Hello world."
    analyze_resp = client.post("/api/v1/analyze/text", json={"text": prompt})
    session_id = analyze_resp.json()["session_id"]

    sanitize_resp = client.post(
        f"/api/v1/sessions/{session_id}/sanitize",
        json={"approved_finding_ids": ["bogus_non_existent_id"]},
    )
    assert sanitize_resp.status_code == 400
    assert "invalid" in sanitize_resp.json()["detail"].lower()


def test_session_lifecycle_and_deletion():
    prompt = "Temporary text."
    analyze_resp = client.post("/api/v1/analyze/text", json={"text": prompt})
    session_id = analyze_resp.json()["session_id"]

    # Delete session
    del_resp = client.delete(f"/api/v1/sessions/{session_id}")
    assert del_resp.status_code == 204

    # Now retrieving or sanitizing it should return 404
    get_resp = client.get(f"/api/v1/sessions/{session_id}")
    assert get_resp.status_code == 404

    sanitize_resp = client.post(
        f"/api/v1/sessions/{session_id}/sanitize",
        json={"approved_finding_ids": []},
    )
    assert sanitize_resp.status_code == 404
