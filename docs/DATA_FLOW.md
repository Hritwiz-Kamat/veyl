# Data Flow

> To be expanded in M3+.

## Text analysis (planned)
```
User types prompt
  → Frontend POST /api/v1/analyze/text {text}
  → Backend: AnalysisService → PrivacyEngine (Presidio + regex + secret detectors)
  → Normalize findings → store in-memory session
  → Return session_id + findings list (no raw text in response)
  → Frontend renders findings overlay
  → User approves/rejects individual findings
  → Frontend POST /api/v1/sessions/{id}/sanitize {approved_finding_ids}
  → Backend validates IDs, applies right-to-left replacements
  → Returns sanitized text artifact
  → User copies sanitized text into AI tool
```

## M1-M2 data flow
Only the health endpoint is live. No user data is processed.

