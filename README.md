# Context Engine Spec-Driven Rebuild

This repository is scaffolded for a greenfield Context Engine rebuild using spec-driven development. The active specifications in `specs/` are the implementation authority for coding agents, junior developers, reviewers, and tech leads.

Context Engine is an internal shared-workspace RAG workbench. Administrators curate Knowledge Domains, Source Documents, provider/parser settings, operations, and diagnostics. Members query available Knowledge Domains through evidence-grounded chat and source-aware workspaces.

## Build Order

Build one phase at a time. Do not let a later phase reopen earlier ownership decisions unless the relevant specification is changed first.

| Phase | Feature folder | Outcome |
| --- | --- | --- |
| P0 | `specs/04-features/F-000-shared-contract/` | shared product, boundary, state, and contract spine |
| P1 | `specs/04-features/F-001-trusted-application-foundation/` | FastAPI foundation, Postgres, users, cookie sessions, authz |
| P2 | `specs/04-features/F-002-trusted-runtime-config/` | admin-only provider, model, parser, and secret configuration |
| P3 | `specs/04-features/F-003-knowledge-domains-runtime/` | Knowledge Domain lifecycle and private LightRAG runtime control |
| P4 | `specs/04-features/F-004-source-documents-preparation/` | Source Document upload, preparation, canonical Source Blocks |
| P5 | `specs/04-features/F-005-lightrag-indexing-eligibility/` | LightRAG indexing, readiness, delete, query eligibility |
| P6 | `specs/04-features/F-006-scoped-evidence-retrieval/` | domain-scoped evidence retrieval without synthesis |
| P7 | `specs/04-features/F-007-grounded-streaming-chat/` | durable conversations, direct general chat, and advanced agentic domain RAG over Context Engine SSE |
| P8 | `specs/04-features/F-008-observability-pilot-gate/` | audit, safe logs, optional tracing, launch evidence |
| P9 | `specs/04-features/F-009-frontend-delivery/` | thin Next.js UI: **port** old CE client layout/routes/PDF viewer/graph/chat shell; **restyle** with Local Studio parity |

## Source Of Truth

Use this precedence when documents conflict:

1. `AGENTS.md`
2. `specs/00-governance/constitution.md`
3. Approved feature specs and acceptance criteria
4. Versioned API, SSE, data, and AI contracts in `specs/03-contracts/`
5. Architecture and quality specs
6. Feature plans, task lists, and implementation logs
7. Code, tests, runtime observations, and reference material

Reference material under `.references/` is evidence, not active implementation authority. If a reference contradicts an approved spec, update the spec through the normal change process instead of silently choosing the reference.

## Reference Code Repos

Use the read-only reference repos only as evidence for implementing the active specs:

| Reference repo | Use for |
| --- | --- |
| `.references/code/context-engine/` | old Context Engine product behavior, route/layout shape (see `client/`), API/backend patterns, and migration clues |
| `.references/code/context-engine/client/` | **P9 port source:** shell, icon rail, `/chat`, `/documents` + PDF preview, `/database-visualize`, Settings dialog |
| `.references/code/lightrag/` | LightRAG library/runtime **read-only evidence** for contract proof and promotion seed (F-003, F-005, F-006). Editable runtime copy lives at `vendor/lightrag/` per ADR-002. |
| `.references/code/local-studio/` | Local Studio visual parity, tokens, primitives, shell geometry, and interaction patterns |
| `.references/controllable-rag-fastapi-replication-pkg/` | advanced controllable RAG architecture evidence for F-007 orchestration, bounded retrieval loops, SSE projection, and modular chat shell wiring |

Do not import behavior from these repos unless the active feature spec and affected contracts allow it.

## Frontend Rule

The frontend is a thin Next.js App Router client over Context Engine API truth.

**Structure (port):** old CE client at `.references/code/context-engine/client/` — w-14 icon rail, `/chat` (two-column + tabbed context panel), `/documents` with inline PDF preview panel, `/database-visualize` graph workspace, global Settings dialog.

**Skin (restyle):** Local Studio tokens and primitives from `DESIGN.md` — compact dark-first workstation, Geist typography, dense rows, restrained borders. Do not ship old CE white-canvas styling.

**Data (wire):** P1–P8 contracts in `specs/03-contracts/` only. Unknown API shape → fixture capture task.

Authoritative port contracts: `specs/04-features/F-009-frontend-delivery/ce-client-port-and-parity.md`, `context-panel-tabs.md`

See also `DESIGN.md`, `specs/04-features/F-009-frontend-delivery/ux.md`, and `.references/feature-ce-api-uiux-wirering-brainstorm/` (junior dev evidence pack).

## Agent Workflow

For any implementation task:

1. Read `AGENTS.md`.
2. Read the relevant feature folder in `specs/04-features/`.
3. Read every contract linked from that feature.
4. Implement only that vertical slice.
5. Run the tests named in `test-plan.md`.
6. Update acceptance evidence, implementation log, traceability, and affected contracts before calling the work done.

## Stop Conditions

Stop and ask for a decision if:

- the pinned LightRAG fixture cannot prove the P5 contract;
- a UI route would need an unknown backend field shape;
- browser code would need direct LightRAG, Docker, storage, provider, database, controller, runtime URL, or secret access;
- a destructive delete, redaction, or migration cannot be tested;
- any phase requires a generic workflow engine, Redis/RQ/Celery, WebSocket migration, broad plugin system, or second retrieval stack not named by the specs.
