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
  "text": "Hello, my name is Alice Smith and my email is alice@example.com. Key: sk-live1234567890abcdefghijklmnopqrstuvwxyz"
}
```

**Response 200**
```json
{
  "session_id": "4b5d4a70...",
  "findings": [
    {
      "id": "e4f8b1c9...",
      "entity_type": "PERSON",
      "start": 18,
      "end": 29,
      "replacement": "[PERSON_1]",
      "severity": "medium",
      "confidence": 0.85,
      "source": "presidio",
      "selected_by_default": true
    }
  ],
  "stats": {
    "total_findings": 1,
    "has_credentials": false,
    "entity_counts": {
      "PERSON": 1
    }
  }
}
```

---

### GET /api/v1/sessions/{session_id}
Retrieves session findings and TTL expiration metadata from server-side memory.

**Response 200**
```json
{
  "session_id": "4b5d4a70...",
  "findings": [ ... ],
  "created_at": "2026-11-13T20:00:00.000Z",
  "expires_at": "2026-11-13T20:15:00.000Z"
}
```

---

### POST /api/v1/sessions/{session_id}/sanitize
Applies approved finding transformations right-to-left onto the server-held original text.
Clients send only approved finding IDs; original text is never accepted from the browser.

**Request Body**
```json
{
  "approved_finding_ids": ["e4f8b1c9..."]
}
```

**Response 200**
```json
{
  "sanitized_text": "Hello, my name is [PERSON_1] and my email is...",
  "applied_count": 1,
  "skipped_count": 0,
  "all_sanitized": true,
  "has_unredacted_credentials": false
}
```

---

### DELETE /api/v1/sessions/{session_id}
Explicitly deletes session data and findings from memory ahead of TTL expiration.

**Response 204 No Content**

---

## Planned endpoints (M5+)

| Method | Path | Purpose |
|--------|------|---------|
| POST | /api/v1/analyze/file | Analyze uploaded image or document (M5/M6) |
| GET | /api/v1/sessions/{id}/artifact/{artifact_id} | Download sanitized artifact |
