# F-009 / P9 Reconciled Design Gates

Status: review decision draft
Feature: F-009 - Frontend Delivery
Date: 2026-07-06
Method: grill-with-docs

## Scope

This document answers the "Questions MUST Answer Before Coding" in `.devnotes/P8-post-impl-REVIEW/F-009-P9-readiness.md`.

It is not implementation authority by itself. Before coding, patch only the files named by each gate below. Active specs and contracts remain the source of truth.

Canonical patch targets for P9:

- `specs/04-features/F-009-frontend-delivery/spec.md`
- `specs/04-features/F-009-frontend-delivery/ux.md`
- `specs/04-features/F-009-frontend-delivery/ce-client-port-and-parity.md`
- `specs/04-features/F-009-frontend-delivery/context-panel-tabs.md`
- `specs/04-features/F-009-frontend-delivery/frontend-slice-map.md`
- `specs/04-features/F-009-frontend-delivery/plan.md`
- `specs/04-features/F-009-frontend-delivery/tasks.md`
- `specs/04-features/F-009-frontend-delivery/test-plan.md`
- `specs/03-contracts/api/context-engine-v1.md`
- `specs/03-contracts/events/context-engine-sse-v1.md`
- `specs/03-contracts/data/context-engine-data.md`
- `DESIGN.md`

Only patch `API-001`, `EVT-001`, or `DATA-001` when a UI slice needs public field shape not already captured.

## Sources Grilled

- `AGENTS.md`
- `README.md`
- `specs/00-governance/constitution.md`
- `CONTEXT.md`
- `DESIGN.md`
- `specs/01-product/business-rules.md`
- `specs/01-product/domain-model.md`
- `specs/01-product/roles-and-permissions.md`
- `specs/02-architecture/system-context.md`
- `specs/02-architecture/component-boundaries.md`
- `specs/02-architecture/data-ownership.md`
- `specs/02-architecture/integration-flows.md`
- `specs/02-architecture/non-functional-requirements.md`
- `specs/03-contracts/api/context-engine-v1.md`
- `specs/03-contracts/events/context-engine-sse-v1.md`
- `specs/03-contracts/data/context-engine-data.md`
- `specs/03-contracts/ai/grounded-answering.md`
- `specs/04-features/F-008-observability-pilot-gate/acceptance.md`
- `specs/04-features/F-008-observability-pilot-gate/implementation-log.md`
- `specs/04-features/F-009-frontend-delivery/`
- `specs/05-quality/security-and-privacy.md`
- `specs/05-quality/test-strategy.md`
- `specs/05-quality/observability.md`
- `specs/05-quality/performance-and-resilience.md`
- `specs/05-quality/ai-evaluation.md`
- `specs/07-traceability/feature-register.md`
- P8 implementation evidence in `context_engine/app.py`, `context_engine/models.py`, and observability/search hits from `context_engine/services/`
- `tests/test_observability.py`
- `tests/test_grounded_streaming_chat.py`
- `.devnotes/P8-post-impl-REVIEW/F-009-P9-readiness.md`
- `.devnotes/P8-post-impl-REVIEW/ID-A.md`
- `.devnotes/P8-post-impl-REVIEW/ID-A-api-client-and-auth.md`
- `.devnotes/P8-post-impl-REVIEW/ID-A-sse-context-panel.md`
- `.devnotes/P8-post-impl-REVIEW/ID-A-documents-preview-and-source-ref.md`
- `.devnotes/P8-post-impl-REVIEW/ID-A-visual-port-and-reference-locations.md`
- `.devnotes/P8-post-impl-REVIEW/ID-A-admin-settings-audit-diagnostics.md`
- `.devnotes/P3-post-impl-REVIEW/F-004-P4-reconciled-design-gates.md`
- `.devnotes/ascii-mockups/README.md`
- `.devnotes/ascii-mockups/shell.md`
- `.devnotes/ascii-mockups/main-chat.md`
- `.devnotes/ascii-mockups/chat-sessions.md`
- `.devnotes/ascii-mockups/evidence.md`
- `.devnotes/ascii-mockups/settings.md`
- `.references/feature-ce-api-uiux-wirering-brainstorm/`
- `.references/local-studio-tab-patterns.md`
- `.references/local-studio-visual-parity-package.md`

## Product DNA Locks

- Use canonical product terms: Knowledge Domain, Source Document, Canonical Source, Source Block, Evidence, Citation, Conversation, Turn, Redaction, Runtime Node, Usage Event, Wiki Page, Smart Composer.
- P9 creates the thin Next.js frontend: typed API/SSE wrappers, cookie auth UI, route guards, app shell, Settings dialog, documents workspace, chat shell, graph shell, and safe admin audit/diagnostics surfaces where contracts exist.
- P9 owns browser interaction state only: theme, density, selected route, selected row, panel width, active tab, in-flight request lifecycle, and safe view state.
- P9 does not own auth truth, role truth, query eligibility, lifecycle state, retrieval, evidence mapping, chat routing, model/profile choice, audit truth, diagnostics source, delete behavior, redaction, or private runtime configuration.
- Browser calls only Context Engine API/SSE routes through feature-owned wrappers. It never calls LightRAG, Docker, storage, database, provider APIs, controller routes, runtime targets, Langfuse, or node internals.
- Browser storage may contain UI preferences only. No auth token, session token, provider credential, controller target, runtime port, storage target, prompt, answer, source text, or raw payload.
- Local Studio visual parity is mandatory: dark-first, compact workstation grammar, Geist fonts, tokenized surfaces, 24/28px rows and controls, status dots/pills, quiet borders, and no generic white dashboard.
- Port old CE route/layout structure only where active F-009 contracts say to port it. Do not copy stale old API paths.
- KISS/YAGNI: no generic workflow/event-bus/frontend plugin framework, broad global state platform, WebSocket migration, client retrieval engine, local vector store, client cost accounting, or frontend-owned operation dashboard in P9.
- The new ASCII mockups are advisory. The proposed three-panel `/chat` revision is useful design evidence, but it conflicts with the approved two-column F-009 wording. Patch F-009 before implementing it.
- Reserved F-010/F-011 hooks can be visible only as inactive labels if a spec allows them. Do not build Logs, Usage, node controls, wiki writes, or Smart Composer durable writes in P9.

## Recommended Build Shape

```text
Next.js App Router
  app layout / routes
    -> route shells
       /login
       /chat
       /documents
       /database-visualize
       Settings dialog
    -> feature UI modules
       auth, shell, settings, domains, sources, chat, graph, audit
    -> feature-owned typed wrappers
       authApi, runtimeSettingsApi, domainsApi, sourcesApi,
       conversationsApi, chatStreamClient, auditApi
    -> shared API/SSE foundation
       ceFetch, normalizeApiError, parseContextEngineSse
    -> Context Engine API/SSE only

Shared UI primitives
  tokens, buttons, inputs, tables, tabs, status, modals, drawers
  no fetch, no roles, no product state

Local UI state
  prefs, selected ids, active tabs, panel sizes, pending request state
  no product truth, no credentials, no private infrastructure
```

## A. Contract/data/API blockers

### A1. Exact generated client source: OpenAPI snapshot, hand-written wrappers, or both?

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| OpenAPI snapshot plus feature-owned wrappers | Contract drift is visible; wrappers keep UI ergonomic and safe | Needs fixture capture before T-010 | `authApi.login`, `sourcesApi.listForDomain` |
| Generated client only | Fast endpoint coverage | Often leaks awkward generated shapes into components | generated hooks everywhere |
| Hand-written wrappers only | Simple first pass | Easier to drift from API-001 | ad hoc DTOs |

Recommendation: use both. Freeze or generate an OpenAPI snapshot first, then write small feature-owned wrappers over the captured P1-P8 DTOs.

Patch F-009 plan/tasks/test-plan with:

```text
T-010 must capture or freeze the current OpenAPI fixture before broad UI wiring.
Feature modules may expose typed wrapper functions, but wrapper request/response DTOs must be checked against the captured OpenAPI fixture.
Unknown public fields create a fixture-capture or contract-patch task before component work.
```

Patch API-001 only if the snapshot shows a public shape needed by P9 is absent or ambiguous.

### A2. How are API errors normalized without logging raw payloads?

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| One `normalizeApiError` over API-001 envelope | Consistent, testable, safe request id display | Needs wrapper tests | `{ code, message, requestId, fields }` |
| Route-specific error handling | Flexible | Inconsistent 401/403 and leakage risk | component catches response |
| Raw response passthrough | Debug friendly | Forbidden | response body dump |

Recommendation: one shared error normalizer, used only by typed API/SSE wrappers. Components receive a safe UI error object, not raw `Response` or raw body.

Patch F-009 spec/test-plan with:

```text
ApiError:
  code: string
  message: string
  requestId: string | null
  fields?: { path: string; message: string }[]

Rules:
  display safe message and requestId when present
  never log raw response bodies
  never store request or response payload snapshots with private fields
  401 clears auth state once
  403 renders forbidden without redirect loop
```

No API-001 patch is needed unless the canonical envelope changes.

### A3. Are current OpenAPI snapshots enough for Settings provider/domain/source/audit panels, or do missing endpoints need fixture-capture tasks?

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| Gate each Settings panel by captured endpoint fixture | Prevents guessed admin UI | More upfront fixture work | provider status, domains, sources, audit |
| Build all panels from spec memory | Looks complete | Silent drift risk | fields guessed from old CE |
| Hide Settings until all admin endpoints are perfect | Safe but slow | Blocks useful P9 slices | no Settings shell |

Recommendation: build Settings shell early, but wire each panel only after its OpenAPI/current fixture is captured.

Patch F-009 plan/tasks with:

```text
Settings panels:
  personal prefs: UI-local only
  users: P1 admin user route when fixture exists
  provider/model/parser: P2 routes when fixture exists
  domains: P3 routes when fixture exists
  sources/index: P4/P5 routes when fixture exists
  audit/diagnostics: P8 routes when fixture exists
  node/workspace/logs/usage/wiki: reserved or absent until F-010/F-011
```

Patch API-001 only for missing Settings DTOs required by the current P9 slice.

### A4. Safe PDF preview blob endpoint is not captured. Is slice 10 UI shell-only until API-001 patch?

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| Shell-only preview until contract exists | Preserves old CE geometry without leakage | PDF content not viewable yet | unavailable preview panel |
| Copy old preview endpoint | Fast visual parity | Stale path and unsafe shape risk | old preview route |
| Fetch storage/original file target | Makes viewer work | Forbidden browser private access | storage target fetch |

Recommendation: slice 10 may port the inline preview panel shell only. Blob fetch is blocked until API-001 captures a safe route.

Patch API-001 later with:

```text
GET /admin/domains/{domain_id}/sources/{source_id}/preview
Auth: Administrator-only unless a later member source-view policy exists
Response: application/pdf or safe 404/409/415 envelope
Rules:
  no storage paths
  no original filename as path
  no private runtime target
  bounded content type
  object URL lifecycle is browser-local and revoked on unmount
```

Patch F-009 spec/frontend-slice-map now with: preview UI is shell-only until that route exists.

### A5. Opaque source-ref contract for evidence->source navigation is missing. Slice 16 must stay blocked.

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| Block source navigation until opaque ref contract | Protects private ids and redaction | No click-through in P9 v1 | disabled citation/source action |
| Use Source Document and Source Block ids in browser URLs | Simple | Violates API/DATA contracts | private ids in route |
| Reconstruct source location from labels/excerpts | No contract patch | Unreliable and leaky | label matching |

Recommendation: keep slice 16 blocked. Evidence rows may display safe `id`, `citationLabel`, `sourceLabel`, and approved `excerpt`; navigation needs a new opaque source-ref contract.

Patch API-001/DATA-001 later with:

```text
SourceRef:
  id: opaque public source-ref id
  evidenceRefId: turn-scoped evidence ref id
  sourceLabel: safe label
  locationLabel?: safe page/section label
  previewAvailable: boolean

Rules:
  no source_document_id
  no source_block_id
  no storage target
  no canonical markdown
  redacted refs resolve absent
```

Patch F-009 acceptance with: citation/source click is disabled or unavailable until `SourceRef` exists.

### A6. Graph workspace API/DTO is not captured in P1-P8. Slice 13 can port canvas shell only until graph contract exists.

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| Port `/database-visualize` shell/canvas only | Keeps route parity without inventing data | Empty/fixture state until later | sigma canvas shell |
| Create graph DTOs in frontend | Fast demo | Browser product truth and contract drift | computed nodes |
| Use old CE graph API paths | Quick port | Stale path risk | old graph endpoint |

Recommendation: keep `/database-visualize` route and visual shell, but do not wire graph data until API-001/DATA-001 capture graph DTOs.

Patch F-009 frontend-slice-map with:

```text
Slice 13:
  allowed now: route shell, canvas container, domain selector, empty/unavailable state
  blocked now: real graph nodes/edges/properties/source navigation
  owner: graph API/data contract patch
```

Patch API-001 later with a graph read route only when product behavior is approved.

## B. Runtime/private integration blockers

### B1. Does any UI control require runtime URL, host path, container id, provider key, port, or storage target? If yes, stop.

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| Stop and patch backend contract | Keeps browser thin and safe | Slower than a shortcut | approved safe DTO |
| Add the private field as hidden/admin-only UI | Seems operator-friendly | Violates AGENTS and QA-002 | runtime target input |
| Store it as local setting | Easy local demo | Forbidden credential/infrastructure persistence | local target cache |

Recommendation: stop. No P9 UI control may require those values. Build only from safe DTOs.

Patch F-009 spec/test-plan with:

```text
Import/network audit must fail if frontend imports, stores, renders, or sends:
  runtime target
  storage target
  container id
  host path
  provider credential
  controller target
  LightRAG target
  Langfuse target
```

No API patch is allowed just to expose private infrastructure.

### B2. Which Settings panels are real P9 controls and which are reserved labels for F-010/F-011?

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| Split real captured P1-P8 panels from reserved F-010/F-011 labels | Clear ownership; safe delivery | Requires inactive states | provider real, node reserved |
| Build all visible settings as working controls | Looks complete | Pulls future phases forward | node mutation |
| Hide all future labels | Simplest | Loses roadmap affordance | no placeholders |

Recommendation: implement real panels only for captured P1-P8 routes. Keep F-010/F-011 sections absent unless F-009 explicitly allows inactive reserved labels.

Patch F-009 spec/ux with:

```text
Settings ownership:
  personal: UI-local preferences only unless API exists
  administrator: users, provider/model/parser, domains, sources, audit/diagnostics where captured
  reserved: Runtime Node, workspace, Logs, Usage, storage, Docker, Wiki, Smart Composer

Reserved sections do not submit, poll, mutate, or display private details.
```

Open decision: whether reserved F-010/F-011 labels appear in P9 UI at all. Owner patch target: `specs/04-features/F-009-frontend-delivery/spec.md`.

### B3. Does audit diagnostics display stay on P8 safe DTOs only?

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| Use only P8 audit and diagnostics DTOs | Matches P8 and QA-003 | Not a full operations product | audit table, bounded diagnostics lines |
| Build log/usage dashboard from P8 logs/traces | Tempting after P8 | F-010 scope and contract drift | usage/cost UI |
| Proxy runtime logs from browser-selected target | Operator-like | Forbidden | target-driven tail |

Recommendation: yes. P9 may render `GET /admin/audit-events` and optional `GET /admin/domains/{domain_id}/diagnostics/lightrag` only as bounded admin reads.

Patch F-009 plan/test-plan with:

```text
Audit UI:
  admin-only
  newest-first bounded list
  safe filters from API-001 only
  no export/delete/retention/mutation

Diagnostics UI:
  admin-only
  bounded redacted lines
  safe unavailable state
  no browser-supplied path, target, URL, container, provider, or storage value
```

No F-010 Logs/Usage surface in P9.

## C. SSE/concurrency/idempotency blockers

### C1. Capture raw SSE transcripts for direct success, domain success, no grounded context, evidence-only, validation/auth failures, duplicate request, and cancel.

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| Capture fixtures before stream UI | EVT-001 proof; deterministic parser tests | Requires harness before polish | direct/domain/error/cancel transcripts |
| Test stream UI against live happy path only | Fast | Misses terminal and replay drift | one success stream |
| Mock arbitrary provider chunks | Easy | Tests wrong contract | provider-native chunks |

Recommendation: capture EVT-001 transcript fixtures before implementing UI assertions for streaming.

Patch F-009 test-plan with fixture names:

```text
fixtures/sse/direct_llm_success.sse
fixtures/sse/domain_rag_success.sse
fixtures/sse/no_grounded_context.sse
fixtures/sse/evidence_only.sse
fixtures/sse/terminal_error.sse
fixtures/http/pre_stream_validation_error.json
fixtures/http/pre_stream_auth_error.json
fixtures/http/client_request_conflict.json
fixtures/sse/cancel_settlement.md
```

Patch EVT-001 only if implementation emits an event shape not captured there.

### C2. Client `clientRequestId` generation must be stable per submit and never reused with changed message/domain. Where is it owned?

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| Own in chat submit wrapper | Stable boundary; easy tests | Needs stale guard state | `clientRequestId` per pending turn |
| Generate in component render | Simple | Re-renders can change identity | render-time id |
| Let server create it | Avoids client id | Breaks P7 idempotency contract | no client key |

Recommendation: own `clientRequestId` in the chat stream wrapper/request lifecycle, created once when the user submits a Turn.

Patch F-009 spec/ux with:

```text
Chat submit lifecycle:
  create clientRequestId once per submit
  bind it to submitted message text and selected domainId
  reuse only for retry/replay of the same submit
  never reuse with changed message or changed effective domain
  on conflict, render safe API error and do not create a duplicate local assistant row
```

No DATA-001 patch is needed; P7 already owns `(conversation_id, client_request_id)`.

### C3. Cancel aborts fetch and UI settles locally while server settles safely. Which state is rendered before refresh?

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| Local cancelled/pending-refresh state | Honest about client abort and server settlement | Needs refresh path | "cancelled, refreshing" |
| Hide assistant row immediately | Clean UI | Can lose persisted terminal state | disappearing turn |
| Invent final success/failure locally | Smooth | Browser lies about server truth | fake done |

Recommendation: abort fetch, render a local cancelled/pending-refresh terminal row, then refresh conversation detail to server truth.

Patch F-009 ux/test-plan with:

```text
Cancel UI:
  abort active fetch
  disable duplicate submit until request settles locally
  show safe cancelled/pending-refresh state
  refresh conversation detail
  replace local state with server turn status
  never emit fake Evidence, citations, answer, or provider error
```

Patch EVT-001 only if cancel needs a new public terminal event. Current EVT-001 allows stream close with persisted cancelled state.

## D. Delete/redaction/source blockers

### D1. Redacted turns return empty evidence/citations and null answer. UI must not keep stale derived answer.

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| Render server redacted state and clear cached derived content | Matches DATA-001 | Requires cache invalidation | user question remains |
| Mask answer only visually | Looks easy | Stale data remains in memory/UI | hidden answer |
| Keep old evidence until page reload | Convenient | Violates redaction | stale citation |

Recommendation: when server returns `status=redacted`, clear assistant answer, evidence, citations, context panel rows, source inspector detail, and citation click state for that Turn.

Patch F-009 ux/test-plan with:

```text
Redacted turn UI:
  preserve user message
  assistant answer: null/absent
  evidence: []
  citations: []
  context panel: empty redacted state
  source inspector: clear selection
```

No API/DATA patch is needed; API-001 and DATA-001 already define redaction.

### D2. Source delete removes current Source Document from list; no client-side hidden cache of preview/source content.

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| Invalidate source list and clear selected preview | Safe and simple | User loses local selection | source row removed |
| Keep hidden preview cache | Faster navigation | Stale restricted content risk | retained blob |
| Soft-hide row locally | Smooth | Browser becomes state truth | hidden row |

Recommendation: after source delete or domain delete, invalidate the relevant source/domain/conversation views and clear selected preview/source state.

Patch F-009 ux/test-plan with:

```text
Source delete UI:
  remove source from table after API success or refetch
  clear selected source id
  close/empty preview panel
  revoke object URL if preview route later exists
  clear source inspector detail for redacted evidence
  do not keep hidden source content cache
```

No DATA/API patch is needed for current list behavior.

### D3. Evidence citation click cannot use private Source Document or Source Block ids.

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| Disable citation navigation until source-ref contract exists | Safe and honest | Less interactive | disabled citation action |
| Use evidence ref id only for local context selection | Useful within current Turn | Does not navigate source file | select evidence row |
| Put private source ids in URL | Direct | Forbidden | private source path |

Recommendation: in P9, citation clicks may select the current Turn Evidence row in the context panel by public evidence ref id. They must not navigate to a source viewer until opaque source-ref exists.

Patch F-009 context-panel-tabs/ux with:

```text
Citation click v1:
  input: evidenceRefId from current Turn
  action: select Evidence row in ContextTabPanel
  blocked: source document navigation, source block route, raw preview jump
```

Patch API-001/DATA-001 later for source-ref navigation.

## E. Storage/private data blockers

### E1. Browser storage may keep UI prefs only. What local keys exist and do tests assert no auth token?

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| Explicit browser storage allowlist | Testable and safe | Must maintain as UI grows | `ce.theme`, `ce.density` |
| Ban all browser storage | Very safe | Loses harmless prefs | no theme persistence |
| Let stores persist by default | Convenient | High leakage risk | persisted auth store |

Recommendation: define a storage allowlist before login work lands.

Patch F-009 spec/test-plan with:

```text
Allowed browser storage keys:
  ce.theme
  ce.density
  ce.railCollapsed
  ce.panelWidths
  ce.lastRouteGroup

Forbidden in browser storage:
  auth/session token
  provider credential
  controller/runtime/storage target
  prompt/question/answer/source/evidence text
  API response payload cache
```

Automated storage scan must run after login/logout/chat/documents flows.

### E2. Client logs/errors must not include request bodies, source content, Evidence excerpts beyond DTO display, provider payloads, stack traces, paths, or runtime targets.

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| Safe client logging wrapper and snapshot scan | Consistent and testable | Requires discipline | code/message/requestId |
| No client logs at all | Safe | Harder diagnostics | no console events |
| Raw error logging in dev only | Convenient | Dev fixtures/screenshots can leak | raw response |

Recommendation: use a minimal safe client log/error path and scan snapshots/fixtures.

Patch F-009 test-plan with:

```text
Client safety scan scope:
  console/error fixtures
  UI snapshots
  Playwright traces/screenshots if retained
  OpenAPI/SSE fixtures
  network mocks

Allowed:
  safe code
  safe message
  safe requestId
  safe route label
  safe status enum
```

Patch QA-002 only if frontend scan rules need to become cross-feature policy.

### E3. Download/export/pin/archive/attachments/source mentions are blocked unless API/data contracts capture them.

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| Block until contracts exist | Prevents behavior invention | Fewer convenience features | disabled/unshown actions |
| UI-only local actions | Looks useful | Fake product behavior | local pin |
| Copy Local Studio actions | Familiar | Wrong product authority | local attachment |

Recommendation: block all listed actions unless a captured API/data contract exists for the current slice.

Patch F-009 open decisions with:

```text
Blocked in P9 unless later contract patch lands:
  attachment upload to chat
  source mentions
  model profile selection
  pin/archive/export
  wiki writes
  Smart Composer durable writes
```

If rename/archive/delete conversation actions are desired in P9, patch API-001 and DATA-001 first.

## F. Authz/roles blockers

### F1. Member cannot see admin controls and cannot call admin endpoint wrappers from UI actions. Backend still decides.

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| UI hides admin controls and tests backend 403 | Good UX plus real security | More tests | member/admin Playwright paths |
| UI hides controls only | Looks right | Security unproven | no 403 test |
| Show disabled admin controls to members | Discoverable | Confusing and risky | grey admin actions |

Recommendation: role-aware UI for usability, backend 403 tests for authority.

Patch F-009 test-plan with:

```text
Member proof:
  no admin nav/actions visible
  direct admin route/action attempt receives 403
  forbidden state preserves route context
  no redirect loop
  backend denial remains final even if UI gate is bypassed
```

No PROD-004 patch is needed.

### F2. Admin Settings split must separate personal, admin runtime/provider, and reserved node/workspace sections.

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| Explicit ownership split | Prevents infrastructure drift | Requires clear labels | Personal/Admin/Reserved |
| One mixed settings list | Shorter UI | Blurs browser-local vs backend mutation | all rows together |
| Port Local Studio settings wholesale | Familiar | Wrong product and private controls | node/controller rows |

Recommendation: split Settings by ownership from the first implementation.

Patch F-009 spec/ux with:

```text
Settings groups:
  Personal:
    appearance, density, compact UI preferences
  Administration:
    users, provider/model/parser, domains, sources, audit/diagnostics
  Reserved:
    Runtime Node, workspace, Logs, Usage, storage, Docker, Wiki, Smart Composer
```

Reserved groups are not working controls in P9.

### F3. 401 and 403 behavior must be stable and tested across page loads, fetches, and SSE.

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| Central auth boundary for HTTP and pre-stream errors | Consistent and testable | Requires stream preflight handling | login once, forbidden state |
| Per-route handling | Flexible | Loop/drift risk | each page redirects |
| Treat SSE auth errors as stream errors | Simpler parser | Contradicts pre-stream JSON rule | half-open stream |

Recommendation: centralize 401/403 handling in the API client/auth boundary and keep pre-stream SSE validation/auth failures as JSON error handling.

Patch F-009 test-plan with:

```text
Auth tests:
  page load unauth -> login
  authenticated login route -> app shell
  HTTP 401 -> clear auth once, redirect once
  HTTP 403 -> forbidden state, no redirect loop
  stream preflight 401/403 -> same JSON error path, no partial message row
```

No EVT-001 patch is needed; it already says pre-stream failures are JSON errors.

## G. Test/evidence blockers

### G1. Playwright desktop/mobile key flows for login, chat, documents, graph.

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| Playwright per route group plus fixtures | Strong delivery evidence | Needs app server/test data setup | login/chat/documents/graph |
| Manual screenshots only | Faster | Weak regression coverage | reviewer clicks |
| Unit tests only | Cheap | Misses layout/auth flows | no browser proof |

Recommendation: Playwright is required for P9 route flows. Use deterministic backend fixtures/fakes where provider/runtime quotas would make tests flaky.

Patch F-009 test-plan with:

```text
Playwright required flows:
  login/logout/me
  401 and 403
  shell nav and Settings dialog
  documents list/upload states and preview shell
  chat direct turn
  chat domain RAG evidence before tokens
  chat cancel/retry/error
  graph shell empty/unavailable state
```

Acceptance cannot move from planned until these have real evidence.

### G2. Visual checks at 1440x900, 1280x800, and narrow viewport in dark/light.

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| Required visual captures per route group | Matches DESIGN.md | More artifacts | dark/light desktop/narrow |
| One desktop screenshot | Minimal | Misses responsive/dark-light drift | single image |
| Rely on component tests | Fast | Misses app shell composition | no viewport proof |

Recommendation: visual evidence is mandatory for every implemented P9 route group.

Patch F-009 test-plan with:

```text
Visual captures:
  1440x900 dark and light
  1280x800 dark and light
  narrow viewport dark and light

Surfaces:
  login
  app shell
  Settings dialog
  documents route with preview shell
  chat route with context panel
  graph shell
```

Reject any screenshot that reads as generic white dashboard, old CE white canvas, oversized controls, card grid, or Local Studio product route copy.

### G3. Import/network audit proves no direct private runtime/provider/storage access.

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| Static import scan plus Playwright network audit | Strong browser boundary proof | Needs allowlist | only `/api/v1` and SSE |
| Code review only | Cheap | Easy to miss | reviewer notes |
| Network audit only | Useful | Misses imported private SDKs | unused import |

Recommendation: run both static and browser network audits.

Patch F-009 test-plan with:

```text
Import audit fails on frontend imports or literals for:
  LightRAG
  Docker/controller clients
  storage clients
  provider SDKs
  tracing provider SDKs
  filesystem/process modules
  private runtime or node targets

Network audit:
  browser may call same-origin Context Engine API/SSE only
  no private service targets
  no provider endpoints
```

### G4. SSE ordering fixtures prove context evidence appears before grounded tokens.

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| Parser unit tests plus UI Playwright assertion | Proves contract and rendering | Requires fixture harness | evidence before token |
| Unit parser only | Good contract proof | UI can still render late | parser passes |
| UI happy path only | Visible | Ordering can be hidden/flaky | final screen only |

Recommendation: write both parser fixture tests and UI ordering tests.

Patch F-009 test-plan with:

```text
SSE proof:
  parser asserts domain_rag evidence before token
  parser asserts direct_llm has no evidence and empty citations
  UI asserts context tab evidence row appears before grounded answer tokens
  UI asserts no_grounded_context renders no answer bubble
  UI asserts evidence_only renders evidence and terminal fallback with no answer tokens
```

No EVT-001 patch is needed unless event names/order change.

## Additional Layout Decision From ASCII Mockups

The current active specs approve a two-column chat shell:

```text
ConversationView + ChatComposer | ContextPanelShell
```

The current `.devnotes/ascii-mockups/main-chat.md` proposes a three-panel route-internal shell:

```text
ChatLibraryPanel | ConversationView + inline composer | RightWorkbenchShell
```

Recommendation: do not implement the three-panel layout from devnotes until F-009 accepts it. It is a plausible improvement, but today it is advisory evidence and conflicts with approved F-009 text.

Patch F-009 with one of these options before T-060:

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| Keep approved two-column shell for P9 | Fastest and already contracted | Chat sessions/wiki library wait | current F-009 |
| Accept three-panel route-internal shell | Matches current handoff mockups and chat library idea | Requires spec/UX/port/context/slice patches | left library, center chat, right workbench |
| Build two-column now and refactor later | Low immediate risk | Possible rework | staged layout |

Open decision: accept or reject the three-panel `/chat` revision. Owner patch targets: `spec.md`, `ux.md`, `ce-client-port-and-parity.md`, `context-panel-tabs.md`, and `frontend-slice-map.md`.

## Contract Patch Order For Junior Dev

1. Patch F-009 docs for the API client/OpenAPI fixture gate, storage allowlist, error handling, and per-slice fixture gates.
2. Resolve the three-panel `/chat` decision. Patch F-009 docs before T-060 if the proposed mockup is accepted.
3. Patch F-009 Settings ownership language: real captured P1-P8 panels, reserved F-010/F-011 labels absent or inactive.
4. Patch F-009 test-plan with OpenAPI snapshot, SSE transcript fixtures, Playwright flows, visual captures, storage scan, import audit, network audit, and safe client snapshot scan.
5. Patch API-001 only for missing public route/DTO contracts discovered before a slice: preview blob, source-ref, graph DTO, conversation rename/archive/export, or other explicit UI need.
6. Patch DATA-001 only when a new public ref/state/entity is required, such as `SourceRef` or graph data ownership.
7. Implement T-010 foundation: token import, `ceFetch`, `normalizeApiError`, auth boundary tests, storage allowlist tests.
8. Implement T-020/T-030 auth, route guards, shell, rail, Settings entry, forbidden/loading/error states.
9. Implement Settings panels only where wrapper fixtures exist.
10. Implement documents table/upload/operations and preview shell; keep blob fetch blocked until API-001 patch.
11. Implement chat shell after layout decision; capture SSE fixtures before stream UI assertions.
12. Implement graph shell only; block real graph data until graph contract exists.
13. Implement P8 audit/diagnostics admin display only from captured safe DTOs.
14. Run F-009 test-plan checks.
15. Update `acceptance.md`, `implementation-log.md`, `specs/07-traceability/feature-register.md`, and any changed contract evidence.

## Red Flags In PR

| Red flag | Why it is bad | Junior-dev rule |
| --- | --- | --- |
| Browser stores auth/session/provider/controller data | Violates cookie-only auth and QA-002 | Storage allowlist only; scan after flows. |
| Components call `fetch` directly | Error/auth behavior fragments | Use feature-owned wrappers over shared `ceFetch`. |
| Wrapper accepts arbitrary full URLs | Enables private target calls | Wrapper paths are same-origin Context Engine API/SSE only. |
| UI sends route, model, provider, prompt, topK, retrievalMode, tool, or API key to chat | Browser is choosing backend-owned behavior | Chat body is message, optional domainId, and clientRequestId only. |
| `trace_id` appears in API/SSE/client UI | P8 trace id is private metadata | Display requestId only where API-001 allows. |
| Direct LLM turn shows Evidence/citations | Violates AI-001 and EVT-001 | Direct route has empty context. |
| Domain RAG answer tokens render before Evidence | Violates EVT-001 | Context tab receives evidence first. |
| Context panel is hard-coded with no registry/router | Blocks approved future extension pattern | Use `CONTEXT_PANEL_TAB_IDS` from v1. |
| Three-panel chat layout lands without F-009 patch | Silent contract drift | Resolve the layout decision before T-060. |
| Documents preview fetches old or guessed endpoint | Unsafe stale reference behavior | Shell-only until API-001 preview route exists. |
| Evidence/source links use private Source Document or Source Block ids | Leaks private identifiers | Use evidenceRefId for local selection only until source-ref exists. |
| `/database-visualize` is renamed | Breaks F-009 route parity | Keep path unless spec changes. |
| Graph data is computed or invented in frontend | Browser becomes product truth | Shell-only until graph API/DTO exists. |
| Settings exposes controller targets, provider secrets, host paths, runtime ports, storage targets, or node credentials | Private infrastructure leak | Render safe status DTOs only. |
| Audit/diagnostics UI becomes Logs/Usage/cost/node dashboard | Pulls F-010 into P9 | P8 audit/diagnostics reads only. |
| Generic white dashboard, broad shadcn defaults, gradients, big cards, or old CE white-canvas classes dominate UI | Violates DESIGN.md | Use Local Studio tokens/primitives and dense workstation grammar. |
| Acceptance is marked complete without Playwright, visual, storage, import/network, and SSE fixture evidence | Tests are delivery evidence | Update acceptance only with real proof. |

## Context And ADR Notes

`CONTEXT.md` does not need a product vocabulary change for P9 foundation. It already names Knowledge Domain, Source Document, Evidence, Citation, Conversation, Turn, Runtime Node, Usage Event, Wiki, and Smart Composer.

No ADR is needed for the recommended P9 foundation. These decisions are governed by AGENTS, the constitution, F-009, API-001, EVT-001, DATA-001, AI-001, DESIGN.md, and QA specs.

An ADR may be needed later only if the team chooses a hard-to-reverse frontend architecture outside current contracts, such as a broad state-management platform, a new source-ref model with durable public references, or a substantial chat IA change that affects future F-011/F-010 surfaces. The three-panel `/chat` decision can start as a F-009 spec/UX patch; create an ADR only if it changes cross-feature product architecture.

## QA

- Readiness question IDs covered: A1, A2, A3, A4, A5, A6, B1, B2, B3, C1, C2, C3, D1, D2, D3, E1, E2, E3, F1, F2, F3, G1, G2, G3, G4.
- Open decisions still blocking coding: accept or reject the three-panel `/chat` revision before T-060; decide whether reserved F-010/F-011 Settings labels appear in P9 at all; patch API-001 before preview blob, source-ref navigation, graph data, or conversation extra actions.
- Forbidden-string scan result: pass for concrete secret/token values, runtime URLs, host paths, stack traces, and raw source text. This document uses forbidden-category names only as policy labels.
- Output path written: `.devnotes/P8-post-impl-REVIEW/F-009-P9-reconciled-design-gates.md`.
- Style parity with exemplar: includes Scope, Sources Grilled, Product DNA Locks, Recommended Build Shape, A-G gates, Contract Patch Order, Red Flags, Context/ADR Notes, and QA.
