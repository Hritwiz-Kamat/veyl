# Architecture

> Updated as milestones are completed.

## High-level overview

```
Browser (React/Vite :5173)
        │  fetch /api/v1/*
        ▼
FastAPI (:8000)
  ├── api/v1/           ← thin route handlers (/health, /analyze/text)
  ├── services/         ← analysis_service (orchestration)
  ├── privacy_engine/   ← detector registry, policies (M3)
  │     ├── detectors/  ← presidio (en_core_web_sm), secret_detector, regex_detector
  │     └── policies/   ← severity mapping, consistent replacement tokens
  ├── storage/          ← session_store (in-memory TTL manager)
  ├── processors/       ← text, image, PDF extraction (M5/M6)
  └── integrations/     ← AI handoff adapters (M8)
```

## Milestone status
- **M1:** Vite dev server, React placeholder shell, monorepo scaffold.
- **M2:** FastAPI backend foundation, `/api/v1/health`, CORS restricted to dev server.
- **M3:** Local offline text detection pipeline combining Microsoft Presidio (spaCy `en_core_web_sm`), custom regex (SSN, credit card with Luhn verification, IPv4/MAC/UUID), and secret recognizers (OpenAI, AWS, GitHub, Slack, Private Keys, Passwords). Overlap resolution, consistent placeholders, session generation, and interactive UI scan composer.
- No database. No external cloud detection calls.
