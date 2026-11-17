"""
Integration tests for the full PDF lifecycle:
- Upload multi-page PDF to /api/v1/analyze/file
- Verify per-page findings and metadata
- Approve specific findings to /api/v1/sessions/{id}/sanitize
- Download the truly redacted PDF artifact
- Assert that approved sensitive data is physically unrecoverable from the downloaded file
- Delete session and verify cleanup
"""
import pymupdf
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def generate_multi_page_pdf() -> bytes:
    doc = pymupdf.open()

    # Page 1: Alice's credentials
    p1 = doc.new_page(width=400, height=300)
    p1.insert_text((40, 50), "Confidential Document - Page 1\nContact: Alice Smith\nEmail: alice@example.com", fontsize=11)

    # Page 2: System API secret
    p2 = doc.new_page(width=400, height=300)
    p2.insert_text((40, 50), "Confidential Document - Page 2\nSecret Key: sk-live1234567890abcdefghijklmnopqrstuvwxyz", fontsize=11)

    data = doc.tobytes()
    doc.close()
    return data


def test_pdf_full_lifecycle():
    pdf_bytes = generate_multi_page_pdf()

    # 1. Upload and analyze PDF
    upload_resp = client.post(
        "/api/v1/analyze/file",
        files={"file": ("report.pdf", pdf_bytes, "application/pdf")},
    )
    assert upload_resp.status_code == 200
    data = upload_resp.json()

    assert data["file_type"] == "pdf"
    assert data["metadata"]["page_count"] == 2
    assert "session_id" in data
    session_id = data["session_id"]
    findings = data["findings"]
    assert len(findings) >= 2

    # Check that findings have valid page_number references
    page_numbers = {f["page_number"] for f in findings}
    assert 1 in page_numbers or 2 in page_numbers

    # 2. Selectively approve finding on Page 2 (the secret key)
    key_findings = [f for f in findings if f["entity_type"] == "OPENAI_KEY"]
    assert len(key_findings) == 1
    key_id = key_findings[0]["id"]

    sanitize_resp = client.post(
        f"/api/v1/sessions/{session_id}/sanitize",
        json={"approved_finding_ids": [key_id]},
    )
    assert sanitize_resp.status_code == 200
    s_data = sanitize_resp.json()

    assert s_data["applied_count"] == 1
    assert s_data["artifact_id"] is not None
    assert s_data["artifact_download_url"] is not None
    artifact_id = s_data["artifact_id"]

    # 3. Download the redacted PDF artifact
    download_resp = client.get(f"/api/v1/sessions/{session_id}/artifact/{artifact_id}")
    assert download_resp.status_code == 200
    assert download_resp.headers["content-type"] == "application/pdf"
    assert "attachment" in download_resp.headers["content-disposition"]
    downloaded_pdf_bytes = download_resp.content

    # 4. Open downloaded PDF and assert the approved secret is physically wiped
    out_doc = pymupdf.open(stream=downloaded_pdf_bytes, filetype="pdf")
    assert len(out_doc) == 2
    full_text = "\n".join([page.get_text("text") for page in out_doc])
    out_doc.close()

    assert "sk-live1234567890abcdefghijklmnopqrstuvwxyz" not in full_text
    # Unapproved email should still be present
    assert "alice@example.com" in full_text

    # 5. Delete session and clean up
    del_resp = client.delete(f"/api/v1/sessions/{session_id}")
    assert del_resp.status_code == 204

    # Verification: artifact should now be gone
    gone_resp = client.get(f"/api/v1/sessions/{session_id}/artifact/{artifact_id}")
    assert gone_resp.status_code == 404

