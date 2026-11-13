# AI Privacy Layer MVP — Antigravity Workspace Rules

These are persistent instructions for this repository. Follow them whenever you inspect, plan, create, or modify project files.

## 1. Start here

Before implementing a feature, inspect the repository and read `PROJECT_BLUEPRINT.md`. Read the relevant files in `docs/` as well. Do not assume the repository is empty.

The owner is a vibe coder using AI-assisted development. Act as a senior full-stack engineer and practical security reviewer. Explain important decisions in plain language and provide exact commands.

## 2. Product definition

We are building a **privacy-processing pipeline with a chat interface**, not a chatbot. Users enter prompts or upload supported documents/images. The platform detects potentially sensitive information, displays findings and recommended transformations, asks the user to approve or reject selected changes, and returns sanitized content for copying into an AI tool.

Accepting changes only produces sanitized content. It does not automatically send anything to ChatGPT, Claude, Cursor, or another external provider.

Never claim detection is complete or guaranteed. Distinguish genuine scans from mock/demo data, text sanitization from actual file redaction, and complete scans from incomplete or unsupported scans.

## 3. Non-negotiable cost and data rules

- Prefer free, locally runnable tools and open-source libraries, subject to their licenses.
- Do not add paid APIs, hosted LLMs, paid databases, or paid cloud services by default.
- Never send original prompts, files, OCR text, or findings to an external LLM for detection.
- Initial detection must work without a generative LLM.
- Local development is the initial deployment target. Do not make cloud hosting a prerequisite or promise a cloud free tier will remain free.
- If proposing an external service later, explain cost, free-tier limits, data flow, privacy impact, and local alternatives before integration.
- Self-hosting does not automatically make the system secure; manage access, logs, temporary files, secrets, and retention.

## 4. Approved initial stack

Use this stack unless compatible code already exists:

- **Frontend:** React, TypeScript, Vite, Tailwind CSS, existing Figma component system (or shadcn/ui when appropriate), Lucide React if needed, native `fetch` initially.
- **Backend:** Python, FastAPI, Pydantic, Uvicorn.
- **Text detection:** Microsoft Presidio Analyzer/Anonymizer, local spaCy model (initially `en_core_web_sm` where language coverage is appropriate), custom regex recognizers, custom secret detection.
- **Image:** Tesseract OCR + `pytesseract`, Pillow; OpenCV only when useful.
- **PDF:** PyMuPDF.
- **Testing:** pytest, httpx; add Vitest/React Testing Library when frontend tests are needed.
- **Tooling:** Git. Docker is optional and not required for local MVP development.

Check package compatibility and licenses before adding dependencies. `pytesseract` is only a Python wrapper; the Tesseract executable must be installed separately.

## 5. Repository architecture

Use the monorepo described in `PROJECT_BLUEPRINT.md`: `frontend/` contains the React app and its `src/`; `backend/` contains FastAPI code under `app/` and tests under `tests/`; `docs/` contains architecture, API, data-flow, security, and roadmap notes. Add files only when needed. Do not create a duplicate root `src/`. Temporary files may live under `runtime_data/{uploads,sanitized}/`. Ignore runtime data, `.env`, virtual environments, caches, real uploads, and generated artifacts in Git. Commit only synthetic, non-sensitive fixtures.

## 6. Separation of responsibilities

- **Frontend:** chat, uploads, previews, findings, selection, approval, sanitized output, loading and errors. It is not the authority for sanitization.
- **API:** thin FastAPI routes, validation, response schemas, upload limits, and service invocation. Do not put OCR/detection algorithms in routes.
- **Services:** coordinate analysis, file processing, sessions, and sanitization.
- **Processors:** extract text from input. Image processing must retain OCR word coordinates; document processing should retain page references where possible.
- **Privacy engine:** detector registry, finding normalization, overlap handling, policies, and anonymizers. Keep it independent of FastAPI for unit testing.
- **Storage:** short-lived sessions and temporary files. **Integrations:** optional future AI adapters; never used for original-content detection.

## 7. Detection and sanitization rules

Combine Presidio recognizers, custom regex recognizers, and secret detection. Normalize findings with `id`, `entity_type`, `start`, `end`, `replacement`, `severity`, nullable `confidence`, `source`, and `selected_by_default`. Never invent confidence values. Document severity meanings.

- Deduplicate identical findings and resolve or explicitly represent overlaps.
- Offsets must refer to the exact original text analyzed.
- The browser sends approved finding IDs only. The backend retrieves its own original text/findings and validates the IDs.
- Never trust browser-supplied offsets, finding definitions, or replacement strings.
- Apply replacements right-to-left; preserve punctuation, whitespace, line breaks, and unrelated text.
- Use consistent placeholders within a session where appropriate (e.g. `[PERSON_1]`).
- Do not silently ignore invalid or overlapping spans.
- Unselected findings remain unchanged and must be visibly identified. Rejected or partially sanitized content must not be called fully safe.
- Show a strong warning for credentials/secrets before any external handoff.

## 8. Image and PDF requirements

**Images:** validate the file; use Tesseract structured/word-level OCR output; retain word text, confidence, and bounding boxes in original image coordinates; map detector spans back to boxes; show them for review; after approval, apply opaque pixel-level masks to a new output image using Pillow; strip unnecessary metadata. Never use a frontend overlay as the actual redaction. Report OCR uncertainty and incomplete coverage. Face detection is out of the first MVP unless requested.

**PDFs:** initially extract selectable text and page references with PyMuPDF, analyze it, and show page-level findings. If true PDF redaction is not implemented, return sanitized text only and label it accurately. Later PDF redaction must commit real redactions, handle scanned pages with OCR, consider embedded images/metadata, and verify output by reopening and extracting text. Never call text-only output a fully redacted PDF.

Support only explicitly listed formats. Do not trust a filename or browser MIME type alone.

## 9. API and session conventions

Use `/api/v1` and build incrementally. Target routes:

- `GET /api/v1/health`
- `POST /api/v1/analyze/text`
- `POST /api/v1/analyze/file`
- `GET /api/v1/sessions/{session_id}`
- `POST /api/v1/sessions/{session_id}/sanitize`
- `GET /api/v1/sessions/{session_id}/artifact/{artifact_id}`
- `DELETE /api/v1/sessions/{session_id}`
- Later: `POST /api/v1/handoff/prepare` and `/api/v1/handoff/send`

Use Pydantic schemas and safe, consistent, minimal error responses. Never include raw content or secrets in errors.

Do not add a database initially. Use backend in-memory sessions with a configurable short TTL (initial target 15 minutes) and generated temporary filenames. Store original text or a temporary file reference, findings, approval state, status, artifact reference, and timestamps server-side. Clean up on deletion/expiry and handle expired sessions gracefully. Backend restart may invalidate sessions; document this. Never store original prompts/unmasked findings in browser localStorage, console output, analytics, or logs.

## 10. Frontend behavior

Implement states for empty/ready, prompt entered, uploading, analyzing, findings ready, selection changed, sanitizing, sanitized output, rejected/edit original, unsupported file, incomplete scan, network/API error, and expired session.

Support chat composer, attachments/previews, scan action, findings/severity, text/image highlighting, individual selection, accept/reject, original/sanitized comparison, copy sanitized output, and new analysis. Every visible action must work or be clearly disabled with an explanation.

Keep API calls in `frontend/src/services/api/`, shared response types in `frontend/src/types/`, and use small components/hooks. Start with React state; do not add Redux without a concrete need.

## 11. External AI handoff — later only

Start with manual copying of sanitized output and optionally a mock provider. A real integration must show the destination and exact content, require explicit confirmation for each send, send only approved sanitized content, and keep provider keys on the backend. Do not assume ChatGPT, Claude, and Cursor use the same integration method. Never fall back to sending original content if analysis/sanitization/provider handling fails.

## 12. Security baseline

- Fail closed: analysis, approval-validation, or sanitization failures block external handoff.
- Validate upload size, signature, extension, and parser compatibility on the backend; generate filenames and prevent path traversal.
- Never execute uploads or treat file contents as trusted instructions. Restrict runtime-file and artifact access to the owning session.
- Never log prompts, extracted text, credentials, tokens, or unmasked findings. Keep secrets in environment variables; commit only placeholder `.env.example`.
- Restrict CORS during development; add authentication before multi-user/public use and HTTPS when deployed.
- Check library/model licenses before redistribution or commercial use. This MVP baseline is not a production security certification; organizational deployment needs a threat model and security review.

## 13. Local development

Local URLs: frontend `http://localhost:5173`, backend `http://localhost:8000`, FastAPI docs `http://localhost:8000/docs`. Frontend env: `VITE_API_BASE_URL=http://localhost:8000/api/v1`. Configure CORS for Vite. Keep `.env` untracked. Provide Windows PowerShell commands where practical.

## 14. Milestones — do not skip ahead

1. **M1 Repository/UI:** inspect repo and Figma; establish monorepo; set up React/Vite; reproduce supplied design; verify frontend runs.
2. **M2 Backend:** set up FastAPI, health endpoint, CORS, and frontend connection.
3. **M3 Text detection:** configure Presidio/spaCy, regex and secret detectors; normalize results; test synthetic examples; implement text analysis.
4. **M4 Approval/sanitization:** backend sessions, finding-ID validation, selected-only transformation, review UI, comparison and copy.
5. **M5 Images:** Tesseract word boxes, text-to-coordinate mapping, image review, actual pixel masking, artifact tests.
6. **M6 PDFs:** text extraction, page references, scanned-page OCR, and true redaction only with output verification.
7. **M7 Integration/hardening:** connect UI states, errors/retries/cleanup, and run tests.
8. **M8 Demo handoff:** manual copy and optional mock-provider confirmation flow.

## 15. Definition of done

Verify real local PII detection, correct offsets, finding selection, server-side approval validation, selected-only transformation, overlap/repeated-value handling, reject behavior, sanitized-only copy, pixel-level image redaction, incomplete-scan disclosure, file expiry, and explicit confirmation before external sends. Test detection, offsets, overlaps, sanitization, expiry, image output, and failures.

## 16. Required task report

For each milestone, report: inspection, plan, exact files changed, what works, verification commands/results, run commands, and one next milestone. State anything not tested.

**Immediate instruction: inspect the repository and complete M1/M2 only. Do not implement the full application in one pass. If Figma references are missing, ask the owner to provide them before attempting a faithful UI recreation.**
