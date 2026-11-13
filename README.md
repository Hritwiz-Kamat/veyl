# AI Privacy Layer — MVP

A privacy-processing pipeline with a chat interface. Users enter prompts or upload documents; the platform detects potentially sensitive information, lets users review and approve transformations, and returns sanitized content ready to paste into an AI tool.

> **Status:** M1 + M2 — monorepo scaffold, frontend shell, backend health endpoint.

---

## Quick start (local development)

### Prerequisites
- Node.js ≥ 18 and npm ≥ 9
- Python 3.11+

### 1. Frontend

```powershell
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

### 2. Backend

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
# → http://localhost:8000
# FastAPI docs → http://localhost:8000/docs
```

### Environment variables

Copy `.env.example` to `.env` (repo root) for backend settings.  
Copy `frontend/.env.example` to `frontend/.env` for frontend settings.

---

## Project layout

```
Privacy_Mask/
├── AGENTS.md                  ← Persistent workspace rules
├── PROJECT_BLUEPRINT.md       ← Full project spec
├── README.md
├── .gitignore
├── .env.example               ← Backend env template
├── docs/                      ← Architecture, API, data-flow, security notes
├── frontend/                  ← React + TypeScript + Vite
├── backend/                   ← Python + FastAPI
├── runtime_data/              ← Gitignored: temp uploads & sanitized files
└── scripts/                   ← Dev/util scripts
```

---

## Milestones

| # | Name | Status |
|---|------|--------|
| M1 | Repository / UI scaffold | ✅ Done |
| M2 | Backend foundation (health, CORS) | ✅ Done |
| M3 | Real text detection (Presidio/spaCy) | ⏳ Next |
| M4 | Approval & sanitization | — |
| M5 | Image processing | — |
| M6 | PDF processing | — |
| M7 | Integration & hardening | — |
| M8 | Demo handoff | — |

---

## Notes

- Backend restart invalidates all in-memory sessions (documented limitation, M4+).
- No external LLMs, paid APIs, or databases are used for detection.
- Figma design references: **not yet provided** — UI will be updated once supplied.

