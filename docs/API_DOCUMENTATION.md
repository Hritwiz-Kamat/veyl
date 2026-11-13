# API Documentation

> Base URL: `http://localhost:8000/api/v1`  
> Interactive docs: `http://localhost:8000/docs`

## Implemented endpoints

### GET /api/v1/health
Returns service health status.

**Response 200**
```json
{
  "status": "ok",
  "version": "0.1.0",
  "timestamp": "2026-11-13T20:00:00.000Z"
}
```

---

### POST /api/v1/analyze/text
Analyzes plain text prompts for PII, identifiers, and secrets using local offline detectors. Returns detected findings with consistent placeholders and a short-lived `session_id`.

**Request Body**
```json
{
  "text": "Hello, my name is Alice Smith and my email is alice@example.com."
}
```

**Response 200**
```json
{
  "session_id": "4b5d4a70...",
  "findings": [ ... ],
  "stats": { ... }
}
```

---

### POST /api/v1/analyze/file
Uploads an image file (`image/png`, `image/jpeg`, `image/webp` up to 10MB).
Validates image signature, runs word-level OCR via Tesseract (when available), detects PII/secrets, and maps character spans to pixel-level bounding boxes in original image coordinates.

**Request**
- Multipart form-data with `file` field.

**Response 200**
```json
{
  "session_id": "8f3b2a1c...",
  "file_type": "image",
  "metadata": {
    "filename": "screenshot.png",
    "content_type": "PNG",
    "size_bytes": 142050,
    "image_width": 800,
    "image_height": 600
  },
  "extracted_text": "Account Number: 1234-5678-9012-3456",
  "findings": [
    {
      "id": "f1a2b3...",
      "entity_type": "CREDIT_CARD",
      "start": 16,
      "end": 35,
      "replacement": "[CREDIT_CARD_1]",
      "severity": "high",
      "confidence": 0.90,
      "source": "regex",
      "selected_by_default": true,
      "bounding_boxes": [
        { "x": 120, "y": 45, "width": 180, "height": 22 }
      ]
    }
  ],
  "stats": { "total_findings": 1, "has_credentials": false, "entity_counts": { "CREDIT_CARD": 1 } },
  "is_incomplete_scan": false,
  "scan_warning": null
}
```

---

### GET /api/v1/sessions/{session_id}
Retrieves session findings, file type, and TTL expiration metadata from server-side memory.

**Response 200**
```json
{
  "session_id": "4b5d4a70...",
  "file_type": "image",
  "findings": [ ... ],
  "created_at": "2026-11-13T20:00:00.000Z",
  "expires_at": "2026-11-13T20:15:00.000Z",
  "artifact_id": null
}
```

---

### POST /api/v1/sessions/{session_id}/sanitize
Applies approved finding transformations:
- For text sessions: transforms text right-to-left.
- For image sessions: applies opaque solid black pixel masks over approved bounding boxes using Pillow, strips all EXIF metadata, and creates a downloadable sanitized PNG artifact.

**Request Body**
```json
{
  "approved_finding_ids": ["f1a2b3..."]
}
```

**Response 200**
```json
{
  "sanitized_text": "Account Number: [CREDIT_CARD_1]",
  "applied_count": 1,
  "skipped_count": 0,
  "all_sanitized": true,
  "has_unredacted_credentials": false,
  "artifact_id": "c9e8d7...",
  "artifact_download_url": "/api/v1/sessions/8f3b2a1c.../artifact/c9e8d7..."
}
```

---

### GET /api/v1/sessions/{session_id}/artifact/{artifact_id}
Downloads the pixel-redacted sanitized image artifact.

**Response 200**
- Content-Type: `image/png`
- Content-Disposition: `attachment; filename="sanitized_image.png"`

---

### DELETE /api/v1/sessions/{session_id}
Explicitly deletes session data, findings, and temporary upload/artifact files from disk immediately.

**Response 204 No Content**

---

## Planned endpoints (M6+)

| Method | Path | Purpose |
|--------|------|---------|
| POST | /api/v1/analyze/file | PDF extraction with page references and true redaction (M6) |
