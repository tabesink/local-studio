---
id: Q-SEC-001
title: Security and privacy
status: proposed
owner: Context Engine team
last_reviewed: 2026-07-02
depends_on: []
supersedes: []
---
# Security and privacy review

## Verified source risks that must not transfer

| Finding | Evidence | Target rule |
|---|---|---|
| Direct model/provider client ownership in plugin UI/runtime | `Chat.tsx`, `useChatStreamManager.ts`, `core/llm/` | FastAPI owns provider calls and secrets. |
| Local persisted plugin data and PGlite vector DB | `main.ts`, `constants.ts`, `database/` | PostgreSQL/server-owned persistence only. |
| Local vault reads and indexing | `RAGEngine`, `utils/obsidian`, plugin commands | Context Engine source lifecycle/retrieval only. |
| MCP manager/tool calls | `core/mcp/`, chat tool state | Excluded until a separate vetted product capability. |
| OAuth/provider configuration, including a credential-named constant in `src/constants.ts` | `src/constants.ts` | Never copy literal secret material; no browser OAuth/provider setup. |
| Direct local file apply | `ApplyView.tsx`, `utils/chat/apply.ts` | Blocked pending editable-source/audit contract. |

## Target controls

- Secure, HttpOnly cookie sessions outside local dev; server-side role/object checks.
- Origin/CSRF policy for unsafe cookie-authenticated routes.
- Request size/type limits for uploads and explicit timeouts.
- Server-rendered/sanitized markdown policy; never trust source content as HTML.
- CORS restricted to intended browser origins.
- Structured redacted logs with request ID only.
- Rate-limit login, chat, and upload at ingress/API according to deployment shape.
