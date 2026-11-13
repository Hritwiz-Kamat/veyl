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
    },
    {
      "id": "f8a2c10b...",
      "entity_type": "EMAIL_ADDRESS",
      "start": 46,
      "end": 63,
      "replacement": "[EMAIL_ADDRESS_1]",
      "severity": "medium",
      "confidence": 1.0,
      "source": "presidio",
      "selected_by_default": true
    },
    {
      "id": "a9b1c2d3...",
      "entity_type": "OPENAI_KEY",
      "start": 70,
      "end": 114,
      "replacement": "[OPENAI_KEY_1]",
      "severity": "critical",
      "confidence": 0.95,
      "source": "secret",
      "selected_by_default": true
    }
  ],
  "stats": {
    "total_findings": 3,
    "has_credentials": true,
    "entity_counts": {
      "PERSON": 1,
      "EMAIL_ADDRESS": 1,
      "OPENAI_KEY": 1
    }
  }
}
```

---

## Planned endpoints (M4+)

| Method | Path | Purpose |
|--------|------|---------|
| POST | /api/v1/analyze/file | Analyze uploaded file (M5/M6) |
| GET | /api/v1/sessions/{id} | Get session state |
| POST | /api/v1/sessions/{id}/sanitize | Apply approved findings (M4) |
| GET | /api/v1/sessions/{id}/artifact/{artifact_id} | Download sanitized artifact |
| DELETE | /api/v1/sessions/{id} | Delete session and cleanup |
