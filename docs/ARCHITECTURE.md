# Architecture

> Updated as milestones are completed.

## High-level overview

```
Browser (React/Vite :5173)
        │  fetch /api/v1/* (text scan, image upload, sanitization, artifact download)
        ▼
FastAPI (:8000)
  ├── api/v1/           ← thin route handlers (/health, /analyze/text, /analyze/file, /sessions/*)
  ├── services/         ← analysis_service (orchestration)
  ├── processors/       ← image_processor (structured OCR, mapping), pdf_processor (selectable text & OCR fallback)
  ├── privacy_engine/   ← detector registry, policies, anonymizers
  │     ├── detectors/  ← presidio (en_core_web_sm), secret_detector, regex_detector
  │     ├── policies/   ← severity mapping, consistent replacement tokens
  │     └── anonymizers/← text_sanitizer (RTL text replace), image_sanitizer (pixel masks), pdf_sanitizer (true redaction & verification)
  ├── storage/          ← session_store (in-memory TTL manager + temporary file lifecycle)
  └── integrations/     ← AI handoff adapters (M8)
```

## Milestone status
- **M1:** Vite dev server, React placeholder shell, monorepo scaffold.
- **M2:** FastAPI backend foundation, `/api/v1/health`, CORS restricted to dev server.
- **M3:** Local offline text detection pipeline combining Microsoft Presidio (spaCy `en_core_web_sm`), custom regex (SSN, credit card with Luhn verification, IPv4/MAC/UUID), and secret recognizers (OpenAI, AWS, GitHub, Slack, Private Keys, Passwords).
- **M4:** In-memory session store (15-min TTL), approval validation, right-to-left text replacement, side-by-side comparison, copy output, and session cleanup.
- **M5:** Image processing pipeline: file signature/size validation, structured word-level Tesseract OCR, character-span to bounding-box mapping, server-side destructive pixel masking with Pillow, EXIF metadata stripping, and artifact download endpoint.
- **M6:** PDF processing pipeline: selectable-text extraction with page references, scanned-page OCR fallback via Tesseract, true destructive stream and image redaction via PyMuPDF, post-sanitization output verification asserting approved findings cannot be extracted, artifact downloads, and multi-page UI review navigation.
- **M7:** Integration hardening: background session & orphaned temp-file lifecycle cleanup via FastAPI lifespan, transient network retry with exponential backoff on the frontend API client, comprehensive UI state handling (loading, empty, error, retry, and success for text/image/PDF), and full regression test suite (48 tests passing).
- **M8:** Demo handoff: manual copy flow for sanitized output, mock AI provider integration (ChatGPT, Claude, Cursor simulators) with destination selection, fail-closed pre-flight validation (session must be sanitized first), explicit user confirmation checkbox, simulated AI response display, and 50 tests passing.
