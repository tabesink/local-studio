# Evidence, Scope, Limits

## Review method

Static source review. Repository documentation, FastAPI routers/schemas, client routes/components/API modules, config/runtime composition, tests where visible.

## Finding labels

| Label | Meaning |
|---|---|
| **Confirmed** | Direct source evidence. |
| **Strong inference** | Multiple code paths support it; runtime not observed. |
| **Unknown** | Static source cannot prove it. |
| **Recommendation** | Target rebuild choice. |

## Confirmed anchors

- Backend: FastAPI app with auth, users, documents, AI settings, parser settings, chat/retrieval, LightRAG, operations routers.
- Client: Next.js 16 / React 19 / Tailwind 4-style client; routes include login, chat, documents, graph, settings users.
- App root mounts auth bootstrap, app shell, global Settings dialog, toast surface.
- Login returns bearer token and sets HttpOnly cookie. Client also persists bearer token in `localStorage`.
- Chat uses `POST /chat/turn/stream` SSE; known event categories include sources, answer completion, evidence-only completion, error.
- Documents have status `uploaded | indexing | ready | failed | deleted`.
- Operations have visible lifecycle `queued | running | succeeded | failed | canceled`; failed work can requeue/retry.
- Provider/parser secret values are backend-only; UI gets secret status, not secret values.

## Critical unknowns

- Exact deployed cookie/domain/SameSite behavior.
- CSRF defense in production topology.
- All live API payload variants and error envelopes.
- Browser responsive parity, keyboard focus edge cases, screen reader output.
- Background poller retry/timeout behavior under outages.
- Authorization detail beyond role-level routes. Per-document/per-domain ACL is deferred in architecture docs.
- Whether all v1 UI paths are still product-supported versus compatibility/stale.

## Review constraints

Do not treat source documentation as live-runtime truth. Before production:
1. Start full compose stack.
2. Seed admin/member fixtures.
3. Capture OpenAPI.
4. Execute auth, provider, parser, document upload, operation, chat SSE smoke paths.
5. Record actual error payloads, cookie headers, CORS/CSRF behavior.
6. Run desktop/mobile accessibility checks.

## Rule for implementers

No invented endpoint, enum, stream event, permission, retry, or state transition. Need missing behavior -> add runtime verification task first.
