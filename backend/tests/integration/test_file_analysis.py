"""
Integration tests for file upload, image OCR analysis, pixel redaction, and artifact download.
"""
from io import BytesIO
from PIL import Image
from fastapi.testclient import TestClient

from app.main import app
from app.storage.session_store import SessionStore
from app.schemas.finding import Finding, BoundingBox

client = TestClient(app)


def create_png_bytes(color: str = "white", size: tuple = (100, 100)) -> bytes:
    buf = BytesIO()
    img = Image.new("RGB", size, color=color)
    img.save(buf, format="PNG")
    return buf.getvalue()


def test_analyze_file_upload_png():
    png_bytes = create_png_bytes()
    response = client.post(
        "/api/v1/analyze/file",
        files={"file": ("test_scan.png", png_bytes, "image/png")},
    )
    assert response.status_code == 200
    data = response.json()

    assert "session_id" in data
    assert data["file_type"] == "image"
    assert data["metadata"]["content_type"] == "PNG"
    assert data["metadata"]["image_width"] == 100
    assert data["metadata"]["image_height"] == 100


def test_analyze_file_invalid_format_rejected():
    fake_png = b"THIS IS NOT A VALID PNG IMAGE"
    response = client.post(
        "/api/v1/analyze/file",
        files={"file": ("fake.png", fake_png, "image/png")},
    )
    assert response.status_code == 400
    assert "Invalid image" in response.json()["detail"]


def test_image_sanitization_and_artifact_download():
    # 1. Upload image
    png_bytes = create_png_bytes(size=(200, 200))
    upload_resp = client.post(
        "/api/v1/analyze/file",
        files={"file": ("input.png", png_bytes, "image/png")},
    )
    session_id = upload_resp.json()["session_id"]

    # 2. Inject a simulated finding with bounding box into the session store for test
    store = SessionStore.get_instance()
    session = store.get_session(session_id)
    assert session is not None

    test_finding = Finding(
        id="img_f1",
        entity_type="CREDENTIAL",
        start=0,
        end=5,
        replacement="[CRED_1]",
        severity="critical",
        confidence=1.0,
        source="secret",
        selected_by_default=True,
        bounding_boxes=[BoundingBox(x=30, y=30, width=40, height=20)],
    )
    session.findings["img_f1"] = test_finding

    # 3. Sanitize the image session approving the finding
    sanitize_resp = client.post(
        f"/api/v1/sessions/{session_id}/sanitize",
        json={"approved_finding_ids": ["img_f1"]},
    )
    assert sanitize_resp.status_code == 200
    s_data = sanitize_resp.json()
    assert s_data["artifact_id"] is not None
    assert s_data["artifact_download_url"] is not None

    artifact_id = s_data["artifact_id"]

    # 4. Download artifact
    art_resp = client.get(f"/api/v1/sessions/{session_id}/artifact/{artifact_id}")
    assert art_resp.status_code == 200
    assert art_resp.headers["content-type"] == "image/png"

    # Verify downloaded image is valid and has black pixels in the redacted region
    with Image.open(BytesIO(art_resp.content)) as downloaded_img:
        assert downloaded_img.size == (200, 200)
        pixel_in_box = downloaded_img.getpixel((40, 40))
        assert pixel_in_box[:3] == (0, 0, 0)
