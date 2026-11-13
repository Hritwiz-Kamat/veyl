# Security Notes

> This is an MVP baseline — not a production security certification.

## Current (M1-M2)
- CORS restricted to `http://localhost:5173` only.
- No secrets in committed files; `.env` is gitignored.
- No user data processed yet.

## Planned controls (M3+)
- Upload validation: size limit, file-signature check, extension allowlist, parser compatibility.
- Generated filenames; path traversal prevention.
- Session TTL with cleanup on expiry/delete.
- Never log prompts, extracted text, or unmasked findings.
- No original content sent to external detection services.
- Backend restart invalidates sessions (documented limitation).

## Before multi-user / public deployment
- Add authentication/authorization.
- Switch to HTTPS.
- Conduct a threat model and security review.

