# ID-A - Frontend contract and fixture gates (P9 blockers)

Working doc for the P8-to-P9 gate. Canonical patch targets: `specs/04-features/F-009-frontend-delivery/`, `specs/03-contracts/api/context-engine-v1.md`, `specs/03-contracts/events/context-engine-sse-v1.md`, `DESIGN.md`, frontend test fixtures, and the first P9 frontend package files.

Sources grilled: AGENTS.md, README.md, constitution, CONTEXT.md, DESIGN.md, F-008 spec/plan/tasks/test-plan/acceptance/implementation log, F-009 spec/plan/tasks/test-plan/acceptance/ux/port contracts/slice map, API-001, EVT-001, DATA-001, AI-001, PROD-001/003/004, ARCH-001/002/003/004/005, QA-001/002/003/004/005, DEL-001/002, RUN-001, TRACE-001, P8 implementation files, P8/P7 tests, `.references/feature-ce-api-uiux-wirering-brainstorm/`, `.references/local-studio-tab-patterns.md`, `.references/local-studio-visual-parity-package.md`, `.references/context_engine_fullstack_impl_docs/phase_plan/P9_frontend_delivery.md`, and checkout-local reference trees.

**Related docs**

| Doc | Scope |
| --- | --- |
| [ID-A-api-client-and-auth.md](./ID-A-api-client-and-auth.md) | API client, cookie auth, 401/403, storage and error rules |
| [ID-A-sse-context-panel.md](./ID-A-sse-context-panel.md) | P7 SSE fixtures, chat stream parser, ContextPanelShell evidence wiring |
| [ID-A-documents-preview-and-source-ref.md](./ID-A-documents-preview-and-source-ref.md) | documents table/upload, inline preview shell, preview/source-ref blockers |
| [ID-A-visual-port-and-reference-locations.md](./ID-A-visual-port-and-reference-locations.md) | old CE port source, Local Studio restyle source, checkout path sanity |
| [ID-A-admin-settings-audit-diagnostics.md](./ID-A-admin-settings-audit-diagnostics.md) | Settings ownership, admin gates, P8 audit/diagnostics, F-010 deferral |

---

## Lean Winner

```text
P9 foundation first
+ typed API/SSE wrappers over P1-P8 only
+ cookie-only auth and stable 401/403 handling
+ old CE route/shell port
+ Local Studio token/primitives restyle
+ per-slice fixture gates
+ Playwright and visual evidence
+ no frontend-owned product truth
```

This gives a usable UI without reopening backend ownership or dragging F-010/F-011 into P9.

---

## Rejected Alternatives

| Alternative | Reject because |
| --- | --- |
| Copy old CE frontend API calls directly | API-001 says old paths may be stale; P9 consumes P1-P8 contracts only. |
| Use Local Studio product IA as the CE shell | F-009 requires old CE route/layout structure with Local Studio skin only. |
| Store auth/session token in browser storage | AGENTS, QA-002, PROD-003, and F-009 AC-001 forbid it. |
| Compute domain availability/query eligibility in frontend | DATA-001 owns server predicates; browser renders DTO truth. |
| Build graph/source navigation from private ids | F-009 blocks source navigation until opaque source-ref contract exists. |
| Wire PDF preview to a guessed endpoint | Safe preview blob API is not captured. |
| Expose P8 trace ids in chat UI | API-001/DATA-001 keep `trace_id` private. |
| Build Logs/Usage/node dashboard from P8 diagnostics | F-010 owns those surfaces; P8 diagnostics are bounded admin reads only. |
| Leave context panel hard-coded because v1 has one tab | `context-panel-tabs.md` requires registry/router from v1. |

---

## Grill Tree - Decisions Resolved

```text
Can P9 start?
  -> Yes for foundation, auth, shell, and captured DTO slices.

What is the main blocker cluster?
  -> Contract/fixture gates where UI needs fields not captured in P1-P8.

Who owns browser auth?
  -> Server HttpOnly cookie. Browser stores no token.

Can UI hide admin controls as security?
  -> No. UI visibility is usability; backend authz is final.

Can chat UI pick route/model/retrieval mode?
  -> No. Server classifies and resolves.

Can documents preview/source navigation be fully wired now?
  -> No. Preview blob and source-ref contracts are open.

Can audit diagnostics become a log dashboard?
  -> No. P8 route DTOs only; F-010 owns broader operations surfaces.

What closes P9?
  -> Test-plan evidence, Playwright/visual screenshots, fixtures, acceptance docs, traceability.
```

---

## A1 - API Client And Auth Boundary

Use one typed client foundation:

| Surface | Rule |
| --- | --- |
| Base path | `/api/v1` for product APIs. |
| Credentials | `credentials: "include"`; server owns `ce_session`. |
| Error envelope | Normalize `{ error: { code, message, requestId, fields? } }`. |
| Request id | Display/copy safe `requestId`; never let browser set correlation id. |
| Storage | UI prefs only; no auth/session/provider credential persistence. |
| Endpoint wrappers | Feature-owned modules, not fetch calls scattered in components. |

Decision: T-010/T-020 must land tests before broad UI work. A bad auth client poisons every slice.

---

## A2 - Contract Capture Matrix

| UI slice | Captured enough? | Action |
| --- | --- | --- |
| Runtime foundation | Yes | Use API-001 error envelope and OpenAPI snapshot. |
| Login/logout/me | Yes | P1 endpoints captured. |
| Shell/routes | Yes | Use F-009 port contract. |
| Settings users | Partial | Admin user list exists; write behavior depends on captured endpoints. |
| Settings provider/model/parser | Yes for P2 safe status/mutations | Mask secrets; no values returned. |
| Domains | Yes for P3 admin/member and status/operations | Do not compute availability. |
| Documents list/upload/ops | Yes for P4/P5 source DTOs and operations | Preview blob is not captured. |
| Chat | Yes for conversation CRUD and turn stream | Capture SSE transcripts before UI assertions. |
| Graph | No graph data contract | Port shell/canvas only or block wiring. |
| Operations recovery | Partial P3/P4/P5 ops | No generic operations dashboard beyond captured routes. |
| Source navigation | No opaque source-ref | Block slice 16. |
| Audit diagnostics | Yes for P8 audit/diagnostics routes | Admin-only; no F-010 log viewer. |

---

## A3 - SSE And Context Panel

EVT-001 decides:

```text
stage | evidence | token | done | error
```

P9 must prove:

```text
domain_rag: evidence before answer tokens
direct_llm: no evidence, empty citations
pre-stream failures: JSON error, not half-open SSE
replay: persisted safe events only
cancel: fetch abort and safe local state
```

Decision: write transcript fixtures first, then stream parser, then ContextPanelShell wiring.

---

## A4 - Documents Preview And Source Navigation

Documents route can start:

```text
/documents
  table from P4/P5 safe SourceAdminSummary
  upload dialog from P4
  retry/cancel/index actions from P4/P5
  inline preview shell from old CE geometry
```

Documents route cannot guess:

```text
safe PDF preview blob endpoint
source-ref for evidence -> source viewer
raw file/source access
private Source Block ids in browser URLs
```

Decision: ship the shell with clear unavailable/blocked states until API-001 gets preview/source-ref contracts.

---

## A5 - Visual Port And Reference Routing

Source-of-truth rule:

```text
PORT    F-009 ce-client-port-and-parity.md
RESTYLE DESIGN.md
WIRE    specs/03-contracts/ P1-P8 only
```

Checkout note:

```text
Docs name:
  .references/code/context-engine/client/
  .references/code/local-studio/

Observed likely evidence:
  .references/ce-local-studio/webui/
  .references/code/local-studio-codebase/frontend/
```

Decision: verify reference roots before porting. Do not silently substitute a path in source-of-truth docs.

---

## A6 - Admin Settings And P8 Observability

P9 Settings must split ownership:

| Area | P9 status |
| --- | --- |
| Personal preferences | UI-local only unless API contract exists. |
| Users | Admin-only from P1 user route where captured. |
| Provider/model/parser | Admin-only P2 safe runtime settings. |
| Domains/sources | Admin-only P3-P5 safe lifecycle surfaces. |
| Audit/diagnostics | Admin-only P8 routes, bounded and redacted. |
| Node/workspace/logs/usage/cost/storage | Reserved for F-010/F-011, not working P9 controls. |

Decision: reserved sections may appear only as clearly inactive post-P9 placeholders if the spec allows; they must not call private infrastructure or imply mutation.

---

## Single-Source Rules

```text
api_error_to_ui(error) =
  safe message
  + safe requestId when present
  + optional fields for form display
  - raw response body
```

```text
can_show_admin_control(user, feature) =
  user.role == "administrator"
  AND feature route is captured
  AND backend endpoint still enforces authz
```

```text
chat_context_for_turn(turn) =
  direct_llm -> []
  domain_rag -> Evidence from current P7 SSE evidence events or persisted turn summary
```

```text
document_preview_available(source) =
  false until API-001 captures a safe preview blob route
```

```text
source_navigation_available(evidence) =
  false until opaque source-ref contract exists
```

---

## Entity/Data Diagram

```text
Frontend local state
  theme, density, panel width, active tab, selected row
  |
  v
Typed wrappers
  auth, settings, domains, sources, conversations, audit
  |
  v
API/SSE DTOs
  safe public fields only
  |
  v
Backend data owners
  users/sessions
  domains/domain_operations
  source_documents/source_preparation_operations/index fields
  conversations/conversation_turns/evidence refs
  audit_events
```

No browser table mirrors. No client-side product truth.

---

## Junior Dev - Do This Order

1. Read F-009 docs and this ID-A set.
2. Confirm frontend package location and reference roots.
3. Implement token foundation and shared primitives from DESIGN.md/Local Studio evidence.
4. Implement API client and error normalization with tests.
5. Implement auth/me/logout and storage tests.
6. Port app shell, route guards, rail order, Settings dialog entry.
7. Add fixture capture harness for OpenAPI and SSE.
8. Build Settings slices only where wrappers exist.
9. Build documents table/upload and preview shell, leaving preview blob blocked.
10. Build chat shell with ContextPanelShell registry before SSE tokens.
11. Build graph shell only after data contract or keep shell-only evidence.
12. Build audit diagnostics from P8 DTOs only.
13. Run Playwright, visual checks, storage/import/network audit, and update evidence docs.

---

## Red Flags In PR

- Browser storage contains auth/session/provider credential material.
- Fetch calls are scattered through components instead of feature wrappers.
- UI sends `route`, `model`, `provider`, `prompt`, `topK`, `retrievalMode`, or `apiKey` to chat.
- Direct LLM turns render Evidence/citations.
- Domain RAG answer tokens render before Evidence.
- Context panel is hard-coded with no registry/router.
- `/database-visualize` is renamed without spec update.
- Documents preview fetches a guessed or old endpoint.
- Evidence source links use private Source Document or Source Block ids.
- Member UI renders admin mutation controls.
- Settings exposes raw controller URLs, API keys, host paths, runtime ports, or secret values.
- P8 audit/diagnostics UI becomes a raw log viewer or F-010 usage dashboard.
- Production CSS reads as generic white dashboard or old CE white-canvas styling.

---

## Tests To Write

- Unit: API error normalization, request-id display, forbidden field rejection in wrappers.
- Unit: no auth token storage helper exists; storage allowlist covers UI prefs only.
- Unit: SSE parser handles stage/evidence/token/done/error and malformed safe errors.
- Unit: ContextPanelShell registry has `CONTEXT_PANEL_TAB_IDS = ["context"]`.
- Playwright: login/logout/me, 401 once, 403 forbidden, member/admin nav.
- Playwright: shell nav order and Settings dialog.
- Playwright: chat direct turn, domain RAG evidence before tokens, cancel/retry/error UX.
- Playwright: documents table/upload states and preview shell behavior.
- Visual: dark/light 1440x900, 1280x800, narrow viewport for shell/chat/documents/graph.
- Audit: imports/network calls show browser talks only to Context Engine API/SSE.
- Safety: client snapshots/log fixtures contain no forbidden private data.

Still needs ID-B only if P9 implementation discovers a public DTO missing from API-001 and the team wants to patch the contract in the same vertical slice. Otherwise keep ID-A as the P9 gate.

Next grill session: choose the frontend package/toolchain, capture current OpenAPI/SSE fixtures, then start T-010.
