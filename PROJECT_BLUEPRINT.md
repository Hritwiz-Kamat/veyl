# AI Privacy Layer MVP — Antigravity Project Rules

These are persistent workspace instructions. Follow them whenever you inspect, plan, create, or modify this repository.

## 1. Role and working style

Act as the project's senior full-stack engineer and pragmatic security reviewer. The owner is a vibe coder using AI-assisted development. Explain important decisions in plain language and give exact commands.

- Inspect the existing repository, package files, tests, and current UI before editing. Never assume the project is empty.
- Preserve working code and existing design decisions. Do not rewrite or restructure the project without explaining why; ask before substantial architecture changes.
- Work in small, testable milestones. Do not build the whole application in one pass.
- Before each milestone, state the goal, files likely to change, and verification plan.
- After implementation, run relevant tests, type checks, lint, and build commands. Report actual results; never claim unverified work is complete.
- Keep dependencies lean. Check compatibility, maintenance, license, and local resource requirements before adding packages.
- Update relevant documentation when architecture, setup, APIs, data flow, or security behavior changes.
- If a detail is nonessential, choose a conservative default and document it. Ask the owner only when a consequential decision or required input is genuinely blocking.
- When Figma screenshots or design references are supplied, treat them as the visual source of truth. Inspect them before implementing UI. Do not invent a competing design system.

## 2. Product definition

We are building a privacy-processing pipeline with a chat interface. It sits between a person and an AI tool such as ChatGPT, Claude, or Cursor.

Users can enter prompts or upload supported files. The platform analyzes the content for potentially sensitive information, shows findings and recommended transformations, asks the user to approve or reject selected changes, and returns sanitized content that can be copied into an AI tool.

**Accepting a transformation only creates sanitized content. It does not automatically send anything to an external AI provider.** The first MVP is not a chatbot and does not need to generate AI answers.

Never claim that detection is complete or guaranteed. Clearly distinguish real detection from mock/demo data, text sanitization from actual file redaction, and completed scans from incomplete or unsupported scans.

## 3. Cost and privacy constraints

The owner currently has no budget. Prioritize free, locally runnable tools and open-source libraries, subject to their licenses.

- Do not introduce paid APIs, hosted LLMs, paid databases, or paid cloud services by default.
- Do not send original prompts, files, OCR text, or findings to Gemini, OpenAI, Anthropic, or another hosted model for detection.
- The initial detection pipeline must work without a generative LLM.
- Local development is the initial deployment target. Do not make cloud hosting a prerequisite or promise that a cloud free tier will remain free.
- If proposing an external service later, explain cost, free-tier limits, data flow, privacy implications, and local alternatives first.
- “Self-hosted” does not automatically mean secure; manage access, temporary files, logs, secrets, dependencies, and retention carefully.

## 4. Approved initial stack

Use this stack unless a compatible implementation already exists:

**Frontend:** React, TypeScript, Vite, Tailwind CSS, existing Figma component system (or shadcn/ui if suitable), Lucide React if icons are needed, and native `fetch` initially.

**Backend:** Python, FastAPI, Pydantic, Uvicorn.

**Detection:** Microsoft Presidio Analyzer and Anonymizer, a locally installed spaCy model (initially `en_core_web_sm` where language coverage is appropriate), custom regex recognizers, and custom secret-detection rules.

**Files:** PyMuPDF for PDF extraction; Tesseract OCR plus `pytesseract`; Pillow for image operations; OpenCV only when it provides a concrete benefit.

**Testing/tooling:** pytest, httpx, Git. Add Vitest/React Testing Library when frontend tests are introduced. Docker is optional and not required for the first local MVP.

Check current package compatibility before installation. `pytesseract` is a Python wrapper; the Tesseract executable must be installed separately.

## 5. Target repository structure

Use a monorepo with independently runnable frontend and backend. Add files gradually; do not generate empty modules just to match the tree.

```text
ai-privacy-layer/
├── AGENTS.md
├── README.md
├── .gitignore
├── .env.example
├── docs/ (ARCHITECTURE.md, API_DOCUMENTATION.md, DATA_FLOW.md, SECURITY.md, MVP_ROADMAP.md)
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── app/
│   │   ├── components/{ui,layout,chat,upload,review,output,providers}/
│   │   ├── features/{chat,analysis,sanitization,integrations}/
│   │   ├── hooks/
│   │   ├── services/api/
│   │   ├── store/
│   │   ├── types/
│   │   ├── lib/
│   │   ├── styles/
│   │   └── main.tsx
│   └── package.json
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── api/v1/{router.py,endpoints/}
│   │   ├── core/
│   │   ├── schemas/
│   │   ├── services/
│   │   ├── privacy_engine/{detectors,anonymizers,policies}/
│   │   ├── processors/
│   │   ├── integrations/ai_providers/
│   │   ├── storage/
│   │   └── utils/
│   ├── tests/{unit,integration,fixtures}/
│   └── requirements.txt
├── runtime_data/{uploads,sanitized}/
└── scripts/
```

Frontend source belongs in `frontend/src`; Python source belongs in `backend/app`. Do not create a duplicate root-level `src/`. Ignore `.env`, virtual environments, caches, `runtime_data/`, real user uploads, and generated artifacts in Git. Commit only synthetic, non-sensitive test fixtures.

## 6. Architecture and responsibilities

Keep these layers separate:

- **Frontend:** chat, uploads, previews, findings, selection, approval, sanitized output, loading and errors. It is not the authority for sanitization.
- **API (`backend/app/api`):** thin FastAPI routes, request validation, response schemas, upload limits, and service invocation. Do not put OCR or masking algorithms in route handlers.
- **Services:** coordinate analysis, file processing, sessions, and sanitization.
- **Processors:** extract text from inputs. Image processing returns OCR text plus word-level coordinates. Document processing returns extracted text and page references where possible.
- **Privacy engine:** detector registry, finding normalization, overlap handling, risk/replacement policies, and anonymizers. Keep it independent of FastAPI so it can be unit-tested.
- **Storage:** short-lived sessions and temporary files.
- **Integrations:** optional future AI-provider adapters; never use these for original-content detection in the initial MVP.

## 7. Detection and text sanitization rules

The detector registry combines:
1. Presidio recognizers for supported PII.
2. Regex recognizers for additional identifiers.
3. Secret detection for API keys, tokens, and credential-like strings.

Normalize findings into a structure containing `id`, `entity_type`, `start`, `end`, `replacement`, `severity`, nullable `confidence`, `source`, and `selected_by_default`. Do not invent confidence values when a detector provides none. Document severity meanings.

- Deduplicate identical findings and resolve or explicitly represent overlaps before sanitization.
- Offsets must refer to the exact original text analyzed.
- Never trust offsets, finding definitions, or replacement strings supplied by the browser.
- The browser sends approved finding IDs only. The backend retrieves and validates its own stored findings and original text.
- Apply replacements from right to left so offsets remain valid.
- Preserve punctuation, whitespace, line breaks, and unrelated content.
- Use consistent placeholders within a session where appropriate (e.g. repeated instances of one person can use `[PERSON_1]`).
- Do not silently ignore overlapping or invalid spans; return a safe error or explicit unresolved status.
- Unselected findings remain unchanged and must be visibly identified. A rejected or partially sanitized result must not be called fully safe.
- Critical credentials/secrets require a prominent warning before any external handoff.

## 8. Image processing rules

Image workflow:
1. Validate actual file type/signature and size; create a generated temporary filename.
2. Run Tesseract using structured/word-level output, retaining each word's text, confidence, and bounding box in original image coordinates.
3. Build OCR text plus a reliable mapping from text spans back to word boxes.
4. Run the same detector registry on OCR text.
5. Map detected spans to one or more bounding boxes.
6. Return findings/coordinates for UI review.
7. After approval, apply opaque pixel-level masks with Pillow (or OpenCV) to a new output image.
8. Strip unnecessary metadata and return a separate sanitized artifact.

Do not use a frontend overlay as the actual redaction. The downloadable file must have its sensitive pixels changed. Report OCR uncertainty and incomplete coverage. Face detection and other non-text visual privacy features are outside the first MVP unless explicitly approved.

## 9. PDF/document processing rules

Initial PDF milestone: validate PDF, extract selectable text and page references with PyMuPDF, analyze text, and show findings by page. If genuine PDF redaction is not implemented, return sanitized text only and label it accurately.

Later PDF-redaction milestone: preserve page coordinates, apply and commit actual redactions, handle scanned pages with OCR, consider embedded images and metadata, then reopen the output and verify that redacted text cannot be extracted. Never call extracted-text-only output a fully redacted PDF. Clearly report unscanned content and unsupported formats.

## 10. API conventions

Use `/api/v1` as the versioned prefix. Implement incrementally:

- `GET /api/v1/health`
- `POST /api/v1/analyze/text`
- `POST /api/v1/analyze/file`
- `GET /api/v1/sessions/{session_id}`
- `POST /api/v1/sessions/{session_id}/sanitize`
- `GET /api/v1/sessions/{session_id}/artifact/{artifact_id}`
- `DELETE /api/v1/sessions/{session_id}`
- Later: `POST /api/v1/handoff/prepare` and `POST /api/v1/handoff/send`

Use Pydantic models and consistent safe error responses. Do not include raw content or secrets in error messages. Keep API responses minimal; where the frontend already has original text, return spans and safe metadata rather than repeating sensitive snippets.

## 11. Sessions and temporary storage

Do not add a database initially. Use an in-memory session manager with configurable short TTL (initial target: 15 minutes). Store the session ID, input type/status, original text or temporary file reference, findings, approval state, artifact reference, and timestamps on the backend.

Use generated filenames and a dedicated temporary directory. Clean up on deletion and expiry, with a startup/periodic cleanup safeguard. Handle expired sessions and missing files gracefully. A backend restart may invalidate sessions; document this limitation. Do not store original prompts or unmasked findings in browser localStorage, console output, analytics, or logs.

## 12. Frontend states and behavior

Implement these states: empty/ready, prompt entered, uploading, analyzing, findings ready, selection changed, sanitizing, sanitized output ready, rejected/edit original, unsupported file, incomplete scan, API/network error with retry, and expired session.

The UI should support a chat composer, attachments/previews, scan action, findings and severity, text/image highlighting, individual selection, accept/reject, original/sanitized comparison, copy sanitized output, and starting a new analysis. Every visible action must work or be visibly disabled with an explanation.

Keep API calls in `frontend/src/services/api/`, response types in `frontend/src/types/`, and use small hooks/components. Start with React state; do not add Redux unless justified.

## 13. External AI handoff — later only

Initially provide manual copying of sanitized output and, optionally, a mock provider for presentation. For real integrations later:
- Show the destination and exact content to be sent.
- Require explicit confirmation for each send.
- Send only approved sanitized content.
- Keep provider keys on the backend, never in frontend bundles.
- Do not assume ChatGPT, Claude, and Cursor share one integration method.
- Never fall back to sending original content if analysis, sanitization, or provider handling fails.

## 14. Security requirements

- Fail closed: any analysis, approval-validation, or sanitization failure blocks external handoff.
- Validate upload size, signature, extension, and parser compatibility on the server.
- Generate filenames; prevent path traversal; restrict runtime-file access.
- Never execute uploads or treat their content as trusted instructions.
- Avoid logging prompts, extracted text, credentials, tokens, and unmasked findings.
- Keep secrets in environment variables; commit only placeholder `.env.example` files.
- Restrict CORS to the known frontend origin during development.
- Add authentication/authorization before use by multiple users or exposure to a public network; use HTTPS when deployed.
- Restrict artifact downloads to the owning session and expire access.
- Clean up originals and artifacts according to retention policy.
- Check dependency/model licenses before redistribution or commercial use.
- This is an MVP baseline, not a production security certification. A real organizational deployment needs a threat model and security review.

## 15. Local development

Expected local URLs:
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:8000`
- FastAPI docs: `http://localhost:8000/docs`

Example frontend environment variable: `VITE_API_BASE_URL=http://localhost:8000/api/v1`. Configure FastAPI CORS for the Vite origin. Keep `.env` untracked. Provide Windows PowerShell commands when practical. Tesseract must be installed separately from `pytesseract`.

## 16. Build order

Do not skip ahead:

1. **M1 — Repository/UI:** inspect project and Figma; establish monorepo; set up React/Vite; reproduce supplied design; verify frontend runs.
2. **M2 — Backend foundation:** set up FastAPI, health endpoint, CORS, and frontend connection.
3. **M3 — Real text detection:** configure Presidio/spaCy, regex and secret detectors; normalize results; test synthetic examples; implement text analysis endpoint.
4. **M4 — Approval/sanitization:** backend sessions, finding-ID validation, selected-only transformation, connected review UI, comparison and copy.
5. **M5 — Images:** Tesseract word boxes, text-to-coordinate mapping, image review, actual pixel masking, artifact tests.
6. **M6 — PDFs:** selectable text extraction, page references, scanned-page OCR, and true redaction only with output verification.
7. **M7 — Integration/hardening:** connect all UI states, add failures/retries/cleanup, run tests.
8. **M8 — Demo handoff:** manual copy and optional mock-provider confirmation flow.

## 17. Definition of done

Before calling the functional MVP complete, verify:
- Real local detection identifies supported PII in a prompt.
- Finding offsets and labels are correct.
- Users can select/deselect findings.
- Backend validates approved finding IDs and transforms only approved spans.
- Repeated values, overlaps, and unchanged findings are handled correctly.
- Reject preserves the editable original and does not label it sanitized.
- Copy returns sanitized content only.
- Image findings map to visible regions and accepted redaction changes actual output pixels.
- Unsupported/incomplete scans are clear to the user.
- Temporary files expire and are cleaned up.
- No original content is sent to external detection services.
- No external AI send occurs without explicit confirmation.
- Tests cover detection, offsets, overlaps, sanitization, session expiry, image output, and failure paths.

## 18. Required reporting for each task

For each milestone, report:
1. What you inspected.
2. The implementation plan.
3. Exact files changed and why.
4. What now works.
5. Verification commands and actual results; state anything not tested.
6. Exact local run commands.
7. One sensible next milestone.

**Immediate instruction:** Start with repository inspection and M1/M2 only. Do not implement the full application in one pass. If Figma references are missing, ask the owner to provide them before attempting a faithful UI recreation.
