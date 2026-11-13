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
  ├── processors/       ← image_processor (image validation, structured OCR, text-to-box mapping)
  ├── privacy_engine/   ← detector registry, policies, anonymizers
  │     ├── detectors/  ← presidio (en_core_web_sm), secret_detector, regex_detector
  │     ├── policies/   ← severity mapping, consistent replacement tokens
  │     └── anonymizers/← text_sanitizer (RTL text replace), image_sanitizer (Pillow pixel masks)
  ├── storage/          ← session_store (in-memory TTL manager + temporary file lifecycle)
  └── integrations/     ← AI handoff adapters (M8)
```

## Milestone status
- **M1:** Vite dev server, React placeholder shell, monorepo scaffold.
- **M2:** FastAPI backend foundation, `/api/v1/health`, CORS restricted to dev server.
- **M3:** Local offline text detection pipeline combining Microsoft Presidio (spaCy `en_core_web_sm`), custom regex (SSN, credit card with Luhn verification, IPv4/MAC/UUID), and secret recognizers (OpenAI, AWS, GitHub, Slack, Private Keys, Passwords).
- **M4:** In-memory session store (15-min TTL), approval validation, right-to-left text replacement, side-by-side comparison, copy output, and session cleanup.
- **M5:** Image processing pipeline: file signature/size validation, structured word-level Tesseract OCR, character-span to bounding-box mapping, server-side destructive pixel masking with Pillow, EXIF metadata stripping, and artifact download endpoint.
