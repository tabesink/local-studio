# Context Engine

> Trusted answers from documents your team controls.

Context Engine is a private, evidence-grounded document intelligence workspace for trusted teams.

Admins curate knowledge domains, control document ingestion, configure approved providers, and monitor indexing operations. Team members ask questions in natural language, receive grounded answers, and inspect the supporting evidence and source documents.

Context Engine is not merely a “hybrid RAG backend.” It is the application control plane and evidence experience around semantic retrieval. LightRAG performs semantic retrieval; Context Engine owns authentication, document lifecycle, source mapping, administration, operations, and the user workspace.

## Product principles

* **Evidence before eloquence** — answers should be grounded in retrieved source material.
* **Curated knowledge** — approved documents and domains define what users can query.
* **Inspectable answers** — users should be able to move from an answer to its supporting evidence and source document.
* **Clear admin control** — ingestion, providers, domain lifecycle, and operational visibility belong to administrators.
* **Lean deployment** — designed for a private, small-team deployment rather than a public web search engine.

## Repository layout

| Path | Purpose |
| --- | --- |
| `webui/` | Next.js frontend application (live implementation) |
| `docs/` | Architecture, implementation, deployment, and operational documentation |
| `DESIGN.md` | UI and visual-system source of truth |
| `CONTEXT.md` | Product and domain vocabulary |
| `AGENTS.md` | Coding-agent guidance and documentation map |
| `.references/` | Read-only reference material (not runtime code) |
| `.references/code/client/` | Original Context Engine frontend reference (topology and routes) |
| `.references/code/local-studio/` | Local Studio reference for tokens, primitives, and visual parity |

**Naming note:** the live frontend lives in `webui/`. Older docs and reference checkouts may still say `client/`; treat that as the archived frontend reference under `.references/code/client/`, not the runtime app path.

## Prerequisites

* Node.js and npm
* A running Context Engine API (or a mocked origin for local UI work)

## Frontend

The frontend lives in `webui/`. It is a Next.js application intended to provide a calm, evidence-focused workspace for chat, documents, graph exploration, and settings.

First-time setup:

```bash
cd webui
npm install
cp .env.local.example .env.local
npx playwright install chromium
```

Configure the public, secret-free backend origin in `webui/.env.local`:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

Do not place credentials, bearer tokens, API keys, or private infrastructure URLs in `NEXT_PUBLIC_*` variables. Values with this prefix are exposed to the browser.

Start the dev server:

```bash
cd webui
npm run dev
```

Default local endpoints:

| Service | Address |
| --- | --- |
| Frontend (manual dev) | `http://localhost:3000` |
| Frontend (Playwright) | `http://127.0.0.1:3456` |
| Backend API (expected) | value of `NEXT_PUBLIC_API_BASE_URL` |

The root route redirects to `/chat`. The authenticated application shell resolves the current session through the backend API (`GET /auth/me`).

Browser storage should contain only non-secret UI preferences such as theme selection.

If port `3000` is already in use:

```bash
npm run dev -- -p 3460
```

See `docs/deployment.md` for backend integration expectations and `docs/test-strategy.md` for the full frontend validation workflow.

## Checks

Run from `webui/`:

```bash
npm run lint
npm run test
npm run test:e2e
```

* `npm run lint` runs `tsc --noEmit` for strict type coverage.
* `npm run test` runs Vitest unit tests.
* `npm run test:e2e` runs Playwright smoke tests against the Next.js dev server.

## Documentation

| Need | Document |
| --- | --- |
| Product and domain vocabulary | `CONTEXT.md` |
| Architecture and runtime boundaries | `docs/architecture.md` |
| Current implementation details | `docs/implementation.md` |
| Frontend deployment and env vars | `docs/deployment.md` |
| Frontend test commands and fixtures | `docs/test-strategy.md` |
| UI direction and interaction rules | `DESIGN.md` |
| Coding-agent guidance | `AGENTS.md` |
| Frontend vertical-slice PRD | `docs/brainstorm/01_fe_context_engine_nextjs_vertical_slices/` |

## Scope

Context Engine is intended for trusted internal knowledge, including technical manuals, operational procedures, policies, engineering references, and curated business documents.

It is not:

* A public-web AI search engine
* An autonomous coding agent
* A general document-authoring system
* A replacement for LightRAG
* A multi-tenant enterprise knowledge platform with document-level ACLs

Its value is simple: approved documents become inspectable, grounded team knowledge.
