# F-009 / P9 - Frontend Delivery

Goal: build the Next.js UI as a thin client over P1-P8 contracts by porting old Context Engine route/shell geometry and restyling every surface with Local Studio visual parity.

Not in P9: Local Studio agent runtime, terminal, filesystem, Git, browser automation, Pi/controller mechanics, browser-held provider controls, dashboard/logs/usage/cost/storage/node operations, wiki authoring, Smart Composer durable writes, source navigation without an opaque source-ref contract, or any browser access to private runtime/provider/storage infrastructure.

---

## Big Picture

```text
Browser, P9 only
  |
  | ce_session cookie only
  | typed HTTP/SSE wrappers
  v
Context Engine API, P1-P8
  |
  +-- Auth/session/user role
  +-- Runtime settings, domains, sources, index state
  +-- Evidence retrieval and P7 turn stream
  +-- P8 audit and diagnostics admin reads
  |
  v
Private backend state
  Postgres, storage, worker, controller, LightRAG, providers

UI structure:
  PORT    old CE shell/routes/PDF/graph/chat geometry
  RESTYLE Local Studio tokens/primitives
  WIRE    P1-P8 API/SSE DTOs only
```

P9 is a rendering phase. It must not become a second product authority for auth, roles, domain lifecycle, query eligibility, retrieval route, citations, audit, diagnostics, or destructive state.

---

## What Frontend Delivery Means Here

| Term | Meaning in P9 | Not this |
| --- | --- | --- |
| Port | Keep old CE route names, icon rail, documents split preview, graph workspace, chat two-column shell | copying stale old API paths |
| Restyle | Use Local Studio dark-first tokens, dense primitives, Geist typography, compact rows | generic white dashboard or broad shadcn redesign |
| Wire | Consume typed P1-P8 API/SSE wrappers | browser computes backend truth |
| Fixture gate | Capture OpenAPI/SSE/runtime fixture before unknown field wiring | guessing DTO fields |
| Context panel | Tabbed right panel with v1 `context` tab from P7 SSE Evidence | hard-coded side panel with no registry |

---

## P8 Dependency Gate

| Gate | Current review result |
| --- | --- |
| F-008 status | `acceptance.md`, `implementation-log.md`, and feature register say implemented. |
| P8 acceptance | Records compile, lint, OpenAPI, secret scan, observability tests, compose-replacement smoke, pilot flow, expected-load, failure-injection coverage. |
| Admin audit route | API-001 and implementation expose `GET /api/v1/admin/audit-events`; admin-only, bounded, self-audited. |
| Diagnostics route | API-001 and implementation expose optional `GET /api/v1/admin/domains/{domain_id}/diagnostics/lightrag`; admin-only, bounded, redacted, audited. |
| Request ids | Server generates `X-Request-ID`; clients may display/copy it but cannot choose persisted correlation ids. |
| Chat traces | `conversation_turns.trace_id` is private; API/SSE must not expose it. |
| P9 status | F-009 is approved, not implemented. All acceptance rows are planned. |

Decision: P8 is a usable dependency for P9. P9 must consume the P8 admin reads only where F-009 slice 17 allows them, and must not invent F-010 Logs/Usage/operator dashboards.

---

## Build Order From `tasks.md`

```text
T-000  read docs/contracts/feature folder
T-010  runtime foundation: env, API client, error normalization, tokens
T-020  cookie login/logout/me and route guards
T-030  authenticated app shell, compact rail, settings entry, states
T-040  Settings panels only after relevant OpenAPI fixtures exist
T-050  documents/upload/operations slices
T-060  chat shell with ContextPanelShell + context tab + P7 SSE
T-070  graph/source-nav/audit diagnostics only after contracts are captured
T-080  settings ownership split and post-P9 node/workspace guards
T-900  run test-plan.md checks
T-910  update acceptance, implementation log, feature register
```

Do not jump to documents preview, graph details, audit diagnostics, source navigation, or node/workspace settings before the contract gate for that slice is closed.

---

## Lifecycle Flows

### Auth And Route Guards

```text
/login
  -> POST /api/v1/auth/login
  -> server sets HttpOnly ce_session
  -> GET /api/v1/auth/me resolves user and role

401 anywhere
  -> clear client auth state once
  -> login

403 on admin route
  -> forbidden state
  -> no redirect loop
```

### Port/Restyle/Wire Loop

```text
choose P9 slice
  -> read F-009 source-of-truth docs
  -> inspect old CE structure evidence
  -> inspect Local Studio token/primitive evidence
  -> map only captured P1-P8 DTOs
  -> implement states and tests
  -> update acceptance evidence
```

### Chat SSE

```text
POST /api/v1/conversations/{conversation_id}/turns:stream
  -> pre-stream errors are JSON
  -> direct_llm: stage/token/done, no evidence
  -> domain_rag: stage/evidence before token/done
  -> context tab stores evidence by assistant turn id
```

No model, provider, prompt, route, top-k, tool, retrieval-mode, or runtime controls belong in the browser.

### Documents

```text
/documents
  -> Source Document table from P4/P5 safe source DTOs
  -> admin upload dialog through P4 upload
  -> prep/index states from safe fields
  -> inline PDF preview shell may be ported
  -> blob fetch is blocked until safe preview contract exists
```

### Audit/Diagnostics

```text
admin-only slice 17
  -> GET /admin/audit-events only
  -> optional GET /admin/domains/{id}/diagnostics/lightrag only
  -> safe table/detail display
  -> no raw log tail, no F-010 usage/cost/node controls
```

---

## Layer Ownership

| Layer | Owns | Must not own |
| --- | --- | --- |
| Shared UI primitives | styling, accessibility, dense workstation controls | fetch, roles, business state |
| Frontend feature modules | local interaction state, DTO mapping, endpoint wrappers | backend lifecycle, authz, query eligibility |
| API/SSE client | base URL, credentials, error envelope, stream parser | tokens in browser storage, private runtime targets |
| Route components | page composition and view states | direct service/provider/LightRAG calls |
| Chat UI | render conversations, streaming state, context tab from SSE | route/model/tool/retrieval choices |
| Settings UI | render role-allowed panels and safe admin forms | secret display, infrastructure mutation outside contracts |
| Backend | auth, roles, state, retrieval, evidence, chat, audit, destructive transitions | UI assumptions as source of truth |

---

## Questions MUST Answer Before Coding

### A. Contract/data/API blockers

| # | Question | Owner |
| --- | --- | --- |
| A1 | Exact generated client source: OpenAPI snapshot, hand-written wrappers, or both? | F-009 T-010 |
| A2 | How are API errors normalized without logging raw payloads? | API-001 + QA-002 |
| A3 | Are current OpenAPI snapshots enough for Settings provider/domain/source/audit panels, or do missing endpoints need fixture-capture tasks? | API-001 + F-009 plan |
| A4 | Safe PDF preview blob endpoint is not captured. Is slice 10 UI shell-only until API-001 patch? | F-009 open decisions |
| A5 | Opaque source-ref contract for evidence->source navigation is missing. Slice 16 must stay blocked. | F-009 open decisions |
| A6 | Graph workspace API/DTO is not captured in P1-P8. Slice 13 can port canvas shell only until graph contract exists. | F-009 frontend-slice-map |

### B. Runtime/private integration blockers

| # | Question | Owner |
| --- | --- | --- |
| B1 | Does any UI control require runtime URL, host path, container id, provider key, port, or storage target? If yes, stop. | AGENTS + QA-002 |
| B2 | Which Settings panels are real P9 controls and which are reserved labels for F-010/F-011? | F-009 spec + F-010/F-011 gates |
| B3 | Does audit diagnostics display stay on P8 safe DTOs only? | API-001 + QA-003 |

### C. SSE/concurrency/idempotency blockers

| # | Question | Owner |
| --- | --- | --- |
| C1 | Capture raw SSE transcripts for direct success, domain success, no grounded context, evidence-only, validation/auth failures, duplicate request, and cancel. | EVT-001 fixture requirement |
| C2 | Client `clientRequestId` generation must be stable per submit and never reused with changed message/domain. Where is it owned? | P9 chat wrapper |
| C3 | Cancel aborts fetch and UI settles locally while server settles safely. Which state is rendered before refresh? | F-009 test-plan |

### D. Delete/redaction/source blockers

| # | Question | Owner |
| --- | --- | --- |
| D1 | Redacted turns return empty evidence/citations and null answer. UI must not keep stale derived answer. | API-001/DATA-001 |
| D2 | Source delete removes current Source Document from list; no client-side hidden cache of preview/source content. | P4/P5 API |
| D3 | Evidence citation click cannot use private Source Document or Source Block ids. | source-ref contract |

### E. Storage/private data blockers

| # | Question | Owner |
| --- | --- | --- |
| E1 | Browser storage may keep UI prefs only. What local keys exist and do tests assert no auth token? | F-009 AC-001 |
| E2 | Client logs/errors must not include request bodies, source content, Evidence excerpts beyond DTO display, provider payloads, stack traces, paths, or runtime targets. | QA-002 |
| E3 | Download/export/pin/archive/attachments/source mentions are blocked unless API/data contracts capture them. | F-009 open decisions |

### F. Authz/roles blockers

| # | Question | Owner |
| --- | --- | --- |
| F1 | Member cannot see admin controls and cannot call admin endpoint wrappers from UI actions. Backend still decides. | PROD-004 + tests |
| F2 | Admin Settings split must separate personal, admin runtime/provider, and reserved node/workspace sections. | F-009 FR-010 |
| F3 | 401 and 403 behavior must be stable and tested across page loads, fetches, and SSE. | F-009 AC-002/003 |

### G. Test/evidence blockers

| # | Question | Owner |
| --- | --- | --- |
| G1 | Playwright desktop/mobile key flows for login, chat, documents, graph. | F-009 AC-007 |
| G2 | Visual checks at 1440x900, 1280x800, and narrow viewport in dark/light. | F-009 AC-008 |
| G3 | Import/network audit proves no direct private runtime/provider/storage access. | F-009 AC-001/006/012/013 |
| G4 | SSE ordering fixtures prove context evidence appears before grounded tokens. | F-009 AC-005/010 |

---

## Acceptance Criteria As Definition Of Done

| AC | Done means |
| --- | --- |
| AC-001 | Browser storage tests prove no auth token or credential value is stored. |
| AC-002 | 401 clears auth state once and redirects to login without loops. |
| AC-003 | 403 renders forbidden without losing route context or looping. |
| AC-004 | Member cannot see or invoke admin controls; backend 403 is tested. |
| AC-005 | SSE fixtures match EVT-001 ordering and terminal outcomes. |
| AC-006 | Client errors/logs/snapshots contain no forbidden private content. |
| AC-007 | Playwright covers desktop/mobile login, chat, documents with preview shell, and graph shell. |
| AC-008 | Visual checks prove Local Studio dark/light parity at required viewports. |
| AC-009 | Shell nav order and routes match `ce-client-port-and-parity.md`. |
| AC-010 | Chat right panel uses registry/router and context tab gets Evidence before answer tokens. |
| AC-011 | Direct LLM turns render no Evidence rows/citations and no hidden model/route/tool controls. |
| AC-012 | Chat adapts timeline/composer/streaming UX without Local Studio local-agent tools. |
| AC-013 | Settings split hides raw controller/API key/path/port/credential material and does not imply post-P9 infrastructure mutation. |

---

## What Junior Dev Should Read

1. `AGENTS.md`
2. `README.md`
3. `specs/00-governance/constitution.md`
4. `CONTEXT.md`
5. `DESIGN.md`
6. `specs/04-features/F-008-observability-pilot-gate/acceptance.md`
7. `specs/04-features/F-008-observability-pilot-gate/implementation-log.md`
8. `specs/04-features/F-009-frontend-delivery/`
9. `specs/03-contracts/api/context-engine-v1.md`
10. `specs/03-contracts/events/context-engine-sse-v1.md`
11. `specs/03-contracts/data/context-engine-data.md`
12. `specs/03-contracts/ai/grounded-answering.md`
13. `specs/05-quality/security-and-privacy.md`
14. `specs/05-quality/test-strategy.md`
15. `specs/05-quality/observability.md`
16. `.references/feature-ce-api-uiux-wirering-brainstorm/`
17. `.references/local-studio-tab-patterns.md`
18. `.devnotes/P8-post-impl-REVIEW/ID-A.md`

---

## Practical Start Checklist

- Confirm frontend app package location and toolchain before T-010.
- Generate or freeze the P1-P8 OpenAPI fixture and decide the typed wrapper pattern.
- Implement `apiClient` with cookie credentials, canonical error normalization, and safe request id exposure.
- Add browser storage tests before login UI lands.
- Port shell/nav first: `/`, `/login`, `/chat`, `/documents`, `/database-visualize`, Settings dialog, Logout.
- Implement route guards and 401/403 state tests before admin panels.
- Port documents table and preview shell; keep preview blob fetch blocked until contract patch.
- Implement chat ContextPanelShell registry before SSE feature work.
- Capture SSE transcripts before streaming UI assertions.
- Keep graph source-nav and audit diagnostics behind explicit fixture gates.
- Update acceptance, implementation log, feature register, and traceability only when evidence exists.

---

## Reference Comparison

| Question | Reference answer | Greenfield delta |
| --- | --- | --- |
| App structure | Old CE client uses icon rail, Settings dialog, `/chat`, `/documents`, `/database-visualize`. | F-009 requires the same route/layout structure but rewired to P1-P8 contracts. |
| Visual grammar | Local Studio uses compact dark-first tokens, dense rows, Geist fonts, quiet borders. | DESIGN.md is authority; do not copy LS product routes. |
| Chat panel | Old CE side panel plus Local Studio tab pattern become `ContextPanelShell`. | v1 tab is only `context`; future tabs need spec gates. |
| Documents preview | Old CE inline PDF split uses blob object viewer. | Safe preview blob API is open; UI shell may port first. |
| Graph | Old CE graph workspace keeps `/database-visualize`. | Graph API/DTO must be captured before real data wiring. |
| Audit/diagnostics | P8 backend has safe audit and diagnostics routes. | P9 may render safe admin views only; F-010 owns broader Logs/Usage/node surfaces. |

### Source Location Sanity Check

Active docs name these evidence paths:

```text
.references/code/context-engine/client/
.references/code/local-studio/
```

This checkout currently also shows likely equivalent evidence under:

```text
.references/ce-local-studio/webui/
.references/code/local-studio-codebase/frontend/
```

Junior dev: before porting source files, confirm which paths are the approved local evidence roots. Do not patch active specs or silently switch evidence roots without reviewer sign-off.

What reference evidence answers well:

| Area | Useful evidence |
| --- | --- |
| Shell/route geometry | Icon rail, route map, Settings dialog, documents split, graph workspace, chat two-column shell. |
| Visual parity | Tokens, primitives, dense rows, tabs, tables, modals, right detail panels. |
| Slice order | 17 frontend slices and their backend gates. |

What reference evidence does not answer:

| Area | Gap |
| --- | --- |
| Current API DTO shape | API-001/OpenAPI snapshot owns it. |
| Preview/source navigation | Missing safe contracts. |
| Graph data model | Missing P1-P8 graph endpoint contract. |
| F-010/F-011 surfaces | Not P9 unless later contracts approve them. |

Verdict for junior dev: port structure, restyle appearance, and wire only captured DTOs. Unknown field shape is a blocker, not a UI TODO.

One-line summary: P9 is ready to start at the foundation/shell slices, but documents preview, source navigation, graph data, future context tabs, and Logs/Usage/node surfaces must stay behind explicit contract gates.
