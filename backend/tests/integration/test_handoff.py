"""
Integration tests for AI Handoff endpoints:
- POST /api/v1/handoff/prepare
- POST /api/v1/handoff/send
Verifies fail-closed validation, explicit user confirmation, and mock AI provider responses.
"""
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_handoff_full_lifecycle():
    # 1. Analyze text prompt
    prompt = "Hello Alice Smith, your secret key is sk-live1234567890abcdefghijklmnopqrstuvwxyz."
    analyze_resp = client.post("/api/v1/analyze/text", json={"text": prompt})
    assert analyze_resp.status_code == 200
    sess_id = analyze_resp.json()["session_id"]
    findings = analyze_resp.json()["findings"]

    # 2. Before sanitization, prepare should fail
    early_prep = client.post(
        "/api/v1/handoff/prepare",
        json={"session_id": sess_id, "destination": "mock-chatgpt"},
    )
    assert early_prep.status_code == 400
    assert "not been sanitized" in early_prep.json()["detail"]

    # 3. Sanitize all findings
    finding_ids = [f["id"] for f in findings]
    sanitize_resp = client.post(
        f"/api/v1/sessions/{sess_id}/sanitize",
        json={"approved_finding_ids": finding_ids},
    )
    assert sanitize_resp.status_code == 200

    # 4. Prepare handoff to mock-chatgpt
    prep_resp = client.post(
        "/api/v1/handoff/prepare",
        json={"session_id": sess_id, "destination": "mock-chatgpt"},
    )
    assert prep_resp.status_code == 200
    p_data = prep_resp.json()
    assert p_data["destination"] == "mock-chatgpt"
    assert "OpenAI ChatGPT" in p_data["destination_name"]
    assert p_data["can_handoff"] is True
    assert "Alice Smith" not in p_data["sanitized_content"]
    assert "sk-live" not in p_data["sanitized_content"]

    # 5. Send handoff without confirmation must fail
    unconfirmed_send = client.post(
        "/api/v1/handoff/send",
        json={
            "session_id": sess_id,
            "destination": "mock-chatgpt",
            "confirmed": False,
        },
    )
    assert unconfirmed_send.status_code == 400
    assert "confirmation is required" in unconfirmed_send.json()["detail"]

    # 6. Send handoff with confirmed: True succeeds
    confirmed_send = client.post(
        "/api/v1/handoff/send",
        json={
            "session_id": sess_id,
            "destination": "mock-chatgpt",
            "confirmed": True,
        },
    )
    assert confirmed_send.status_code == 200
    send_data = confirmed_send.json()
    assert send_data["status"] == "success"
    assert "OpenAI ChatGPT (Mock)" in send_data["provider_name"]
    assert "simulated response" in send_data["simulated_response"].lower()


def test_handoff_with_unredacted_credentials_warning():
    prompt = "User Alice with key sk-live1234567890abcdefghijklmnopqrstuvwxyz."
    analyze_resp = client.post("/api/v1/analyze/text", json={"text": prompt})
    sess_id = analyze_resp.json()["session_id"]
    findings = analyze_resp.json()["findings"]

    # Exclude the critical key from approval
    person_findings = [f["id"] for f in findings if f["entity_type"] == "PERSON"]
    client.post(
        f"/api/v1/sessions/{sess_id}/sanitize",
        json={"approved_finding_ids": person_findings},
    )

    # Prepare handoff should flag warning
    prep_resp = client.post(
        "/api/v1/handoff/prepare",
        json={"session_id": sess_id, "destination": "mock-claude"},
    )
    assert prep_resp.status_code == 200
    data = prep_resp.json()
    assert data["has_unredacted_credentials"] is True
    assert data["warning"] is not None
    assert "credentials" in data["warning"].lower()

