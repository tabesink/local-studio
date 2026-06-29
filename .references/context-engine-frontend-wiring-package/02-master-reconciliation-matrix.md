# Master Backend-to-Frontend Reconciliation Matrix

## How to read a record

Each record maps one frontend slice to its backend authority, safe reference-code reuse, conflict resolution, and proof requirements. **Status** is binding for frontend work.

---

## F01 — Runtime Foundation

| Field | Decision |
|---|---|
| Frontend slice | `01_runtime_foundation.md` |
| Backend dependency | P1 trusted foundation; P8 request correlation later |
| User outcome | Browser boots with validated public config, normalized errors, reusable loading/error surfaces. |
| Required API contract | `GET /health/live` / readiness only if product needs a probe; canonical typed API error and request ID headers. **CONTRACT CAPTURE REQUIRED:** exact API base path/version normalization. |
| Old CE reference | `client/src/lib/api/client.ts`: typed fetch seam is reusable; bearer/localStorage branch is not. |
| Local Studio reference | `frontend/src/app` error/loading boundaries; `src/ui/page-state`, error box, form/list primitive patterns. |
| Safe lift candidate | Feature-first folder boundary, route error surfaces, compact page-state components, dark token wiring. |
| Conflict / tension | Old CE sends `Authorization: Bearer` and stores access token; P1 uses opaque HttpOnly cookie. |
| Reconciliation decision | Retain one `apiRequest()` transport shape but force `credentials: include`; remove token read/write and authorization-header composition. |
| Backend/API coordination | Freeze `/api/v1` versus proxy prefix; publish error DTO (`code`, `message`, `requestId`, `fieldErrors?`); set cookie/CORS/CSRF policy before separate-origin deployment. |
| Frontend work | `env.ts`, `client.ts`, `errors.ts`, error boundary, not-found, loading, dark tokens. |
| Ownership boundary | Browser owns display/abort; API owns auth/error/request ID; runtime remains private. |
| Acceptance tests | Missing public URL fails safely; credentials sent; malformed/non-JSON/abort normalize; root error does not crash layout. |
| Status | **Adopt now** |

## F02 — Login + Cookie Session

| Field | Decision |
|---|---|
| Frontend slice | `02_login_cookie_session.md` |
| Backend dependency | P1 |
| User outcome | User signs in, refresh restores session, logout invalidates server session. |
| Required API contract | P1: `POST /api/v1/auth/login`, `GET /api/v1/auth/me`, `POST /api/v1/auth/logout`; cookie attributes and safe current-user DTO. |
| Old CE reference | `client/src/lib/api/auth.ts`; old login/result DTO and local-only logout are legacy evidence. |
| Local Studio reference | Centered setup/login form density, form field primitives, focus/error treatment. |
| Safe lift candidate | Form composition, accessible submit/pending controls, route guard shape. |
| Conflict / tension | Frontend slice uses legacy unversioned route examples; P1 uses `/api/v1`. Old CE expects `access_token`. |
| Reconciliation decision | Versioned P1 routes win. Session provider stores safe user only in memory; no browser credential persistence. |
| Backend/API coordination | Confirm `Set-Cookie`, same-origin policy, CSRF/origin write protection, `next` redirect policy, 401 shape. |
| Frontend work | Login form, session context/hook, authenticated layout guard, one safe redirect gate. |
| Ownership boundary | Browser submits credentials; API issues/revokes opaque cookie and resolves role from DB. |
| Acceptance tests | No storage token; reload works; logout calls backend; unsafe external `next` ignored; member/admin role safely visible. |
| Status | **Adopt now** |

## F03 — App Shell + Role Navigation + Empty Settings

| Field | Decision |
|---|---|
| Frontend slice | `03_app_shell_role_nav_empty_settings.md` |
| Backend dependency | P1; later P2/P3/P4/P7/P8 route availability |
| User outcome | Authenticated user sees stable dark workstation shell, role-aware navigation, accessible Settings surface. |
| Required API contract | `GET /api/v1/auth/me`; role enum. |
| Old CE reference | `AppLayout`, `AppPageFrame`, `AppSideRail`, `SettingsDialog`; good Context Engine navigation seams. |
| Local Studio reference | Dark root layout, `LeftSidebar`, feature-route composition, UI drawers/modals. |
| Safe lift candidate | Local Studio dark shell and full-label sidebar geometry; old CE route grouping and Settings dialog focus restoration. |
| Conflict / tension | Old CE favors narrow icon rail/light canvas; Local Studio has dark workstation sidebar. |
| Reconciliation decision | Desktop default: dark 224px labeled sidebar; responsive compact 56px icon representation at constrained widths; no persisted collapse preference in initial slice. All admin panels hidden for members: Users, Domains, Provider, Parser, Operations, Diagnostics. |
| Backend/API coordination | None beyond current user now; later routes need separate contract gates. |
| Frontend work | Canonical navigation config, dark shell, Settings dialog/sheet, forbidden state, toast host. |
| Ownership boundary | Browser computes visibility only; API enforces all admin routes. |
| Acceptance tests | Keyboard dialog close/focus restore; direct admin route produces forbidden; member does not see any admin section. |
| Status | **Adopt now** |

## F04 — General Settings

| Field | Decision |
|---|---|
| Frontend slice | `04_settings_general.md` |
| Backend dependency | P1 |
| User outcome | User sees verified account/session facts without fake preferences. |
| Required API contract | `GET /api/v1/auth/me`; no general write contract currently. |
| Old CE reference | General Settings panel layout only. |
| Local Studio reference | Settings page section title, compact form/fact rows. |
| Safe lift candidate | Read-only fact layout and field semantics. |
| Conflict / tension | Legacy UI may imply client preference persistence. Greenfield has no such feature. |
| Reconciliation decision | Read-only account/session information. No theme switcher, notification preference, fake save, or local preference write. |
| Backend/API coordination | None beyond current user. |
| Frontend work | Feature-local `GeneralSettingsPanel`, no independent auth fetch. |
| Ownership boundary | Session remains API truth. |
| Acceptance tests | No network write; verified user fields render; error state is safe. |
| Status | **Adopt now** |

## F05 — Users

| Field | Decision |
|---|---|
| Frontend slice | `05_settings_users.md` |
| Backend dependency | P1 initially; later explicit user-management backend phase required |
| User outcome | Admin can eventually view/manage users through explicit API-backed actions. |
| Required API contract | P1 proves `GET /api/v1/admin/users` only. Create/update/reset/delete endpoints are **CONTRACT CAPTURE REQUIRED**; current greenfield plan defers user management writes. |
| Old CE reference | Existing users table/forms and row actions are structural evidence only. |
| Local Studio reference | Dense list/table, form modal, confirmation patterns. |
| Safe lift candidate | Table/action-menu/form separation; no mega-modal. |
| Conflict / tension | Frontend Slice 05 assumes CRUD endpoints; P1 explicitly defers user-management HTTP routes. |
| Reconciliation decision | Ship read-only admin user list only after P1 proof. Keep mutation UI absent/disabled until a backend plan adds exact routes and self-lockout rules. |
| Backend/API coordination | Add dedicated user-management contract only when approved: create/update/activate/reset/delete, conflict and self-admin protections. |
| Frontend work | Read-only list first; mutation feature deferred behind API gate. |
| Ownership boundary | Backend owns role, active state, password rules, self-lockout safety. |
| Acceptance tests | Member gets 403; no hidden mutation endpoint calls; no password in table/log/toast. |
| Status | **Contract capture required** |

## F06 — Settings Domains / Knowledge Domains

| Field | Decision |
|---|---|
| Frontend slice | `06_settings_domains.md` |
| Backend dependency | P3; P2 embedding profile summary |
| User outcome | Admin sees domain registry and safe lifecycle/config entry points. |
| Required API contract | P3 admin domain list/detail/status; safe domain DTO; availability; lifecycle operation DTO; allowed actions if exposed. |
| Old CE reference | Domain cards and domain selector concept. |
| Local Studio reference | Compact workspace/runtime status row patterns. |
| Safe lift candidate | Dense list, status chips with text/icon, detail drawer, action row. |
| Conflict / tension | Old CE may surface runtime details/control calls; P3 forbids browser direct runtime information/actions. |
| Reconciliation decision | Settings list shows public ID, display name, embedding-profile reference, derived health, availability, active lifecycle action. Domain actions delegate to F14; no env/path/container/URL. |
| Backend/API coordination | Capture P3 list/detail/status response and `202` lifecycle response; do not infer allowed transitions in client. |
| Frontend work | `DomainsPanel` is read-first, lifecycle action slot, refresh after mutation. |
| Ownership boundary | API owns lifecycle state, health, availability, transition validation. |
| Acceptance tests | Member no access; deleting domain cannot show start/stop; safe unknown health state does not become available. |
| Status | **Adopt after P3 contract proof** |

## F07 — Provider / Model Runtime Settings

| Field | Decision |
|---|---|
| Frontend slice | `07_settings_model_provider.md` |
| Backend dependency | P2 |
| User outcome | Admin safely manages known provider configuration, explicit model profiles, active synthesis profile; browser sees configured status only. |
| Required API contract | P2 `GET /api/v1/admin/runtime-settings`, known-provider update, model-profile create/update/delete, active synthesis selection. Exact response fixture required. |
| Old CE reference | `ai-settings` lists/forms; old broad provider profile and secret editor are legacy. |
| Local Studio reference | Compact settings form, status row, safe validation/error layout. |
| Safe lift candidate | Split list/editor, configured badge, pending feedback, form field primitives. |
| Conflict / tension | Frontend slice assumes arbitrary base URL, secret-name API, provider network test/validate/activate endpoints. P2 rejects arbitrary URLs, secret names, generic config blobs, and provider network calls. |
| Reconciliation decision | Replace legacy provider panel with one P2 runtime-settings adapter. UI supports known provider kinds, safe configured state, Bedrock region where applicable, exact model ID, purpose, dimensions, active synthesis selection. No provider test button in P2; no secret readback; no base URL field except infrastructure-owned OLLAMA endpoint never browser-editable. |
| Backend/API coordination | Publish safe DTO and validation errors; clarify exact mutation route shapes. |
| Frontend work | `RuntimeSettingsPanel`, provider config form, model profile form, active synthesis selector. |
| Ownership boundary | API encrypts/decrypts; resolver is private; browser cannot select runtime settings per request. |
| Acceptance tests | Secret never renders; member forbidden; invalid configuration maps field errors; no provider browser call. |
| Status | **Adapt now after P2 API fixture** |

## F08 — Document Parser Settings

| Field | Decision |
|---|---|
| Frontend slice | `08_settings_document_parser.md` |
| Backend dependency | P2 |
| User outcome | Admin selects active parser kind and sees safe Reducto configured status. |
| Required API contract | P2 singleton runtime settings; parser kind `docling | reducto`; configured status. |
| Old CE reference | Parser Settings panel geometry and safe status pattern. |
| Local Studio reference | Settings form hierarchy and in-panel help. |
| Safe lift candidate | Select control + contextual configuration warning. |
| Conflict / tension | Frontend slice assumes parser profiles, parser URLs/config JSON, and test endpoint; P2 intentionally has one active parser kind and no provider network test. |
| Reconciliation decision | Render one active parser selector. Docling needs no credential. Reducto selection requires safe configured indication. No parser profile marketplace, advanced JSON, parser test action, or parser config history. |
| Backend/API coordination | Publish active parser mutation and P2 validation result. |
| Frontend work | Small `ParserSettingsPanel`; upload feature never reads local form state. |
| Ownership boundary | API resolves parser credentials privately at worker time. |
| Acceptance tests | Member forbidden; Reducto invalid without config; no secrets/URLs visible. |
| Status | **Adapt now after P2 API fixture** |

## F09 — Documents Library becomes Admin Sources Library

| Field | Decision |
|---|---|
| Frontend slice | `09_documents_library.md` |
| Backend dependency | P4, P5 |
| User outcome | Admin browses safe source document summaries, preparation/index status, and permitted actions. |
| Required API contract | P4 source list/detail/outline/operation routes under `/api/v1/admin/domains/{domain_id}/sources`; P5 safe index fields. |
| Old CE reference | Documents table/list, status badge, domain selector. |
| Local Studio reference | Dense resource list, list rows, empty states, right detail panel. |
| Safe lift candidate | Flat table/list visual pattern and status mapper seam. |
| Conflict / tension | Frontend Slice 09 assumes authenticated generic `GET /documents` and member library visibility. P4 has admin-only source management; no member source viewer/download. |
| Reconciliation decision | Rename implementation concept to **Sources Library**. Scope it under selected domain and admin only. Keep nav label “Documents” only if product vocabulary explicitly approves; do not imply member browsing. No mutation from a generic library table unless P4/P5 route allows it. |
| Backend/API coordination | Capture source pagination/filter contract; source summary fields; safe prep/index status enum; domain selection source. |
| Frontend work | Domain-scoped Sources page, source table, canonical status maps, safe error summary, outline launch for admin. |
| Ownership boundary | API owns source visibility/state; browser never knows storage path or parser-native detail. |
| Acceptance tests | No member source content access; unknown status safe fallback; index `accepted` differs from `ready`. |
| Status | **Adapt after P4/P5 API proof** |

## F10 — Source Upload + Preparation / Index State

| Field | Decision |
|---|---|
| Frontend slice | `10_document_upload_operations.md` |
| Backend dependency | P4, P5 |
| User outcome | Admin uploads one source to a domain and sees preparation/index truth without fake progress. |
| Required API contract | P4 `POST /api/v1/admin/domains/{domain_id}/sources` multipart; source/detail/operation routes; P5 index state/current safe fields; cancel/retry route proof. |
| Old CE reference | Upload dialog, operation status component, list refresh pattern. |
| Local Studio reference | Modal/drop-zone/inline activity visual pattern. |
| Safe lift candidate | Accessible dialog, selected file row, stage timeline, bounded poll hook. |
| Conflict / tension | Slice assumes `/admin/documents/upload`, generic `/operations/{id}`, and a generic operation model. P4/P5 use source-specific lifecycle rows/state. |
| Reconciliation decision | Upload controller targets a selected domain source route. Render two separate truths: preparation operation and index state. Shared polling utility may exist, but resource APIs remain separate. Never fabricate percentage. |
| Backend/API coordination | Prove upload response, source status refresh, cancellation/retry transitions, async delete `202`, and terminal conditions. |
| Frontend work | `UploadSourceDialog`, source status panel, source detail/refetch, abort handling. |
| Ownership boundary | API fast upload intake; worker owns parsing/indexing; browser only refreshes safe API state. |
| Acceptance tests | Multipart once; member denied; source `prepared` vs index `accepted` vs `ready` distinct; poll stops unmount/terminal. |
| Status | **Adapt after P4/P5 API proof** |

## F11 — Chat Route Shell

| Field | Decision |
|---|---|
| Frontend slice | `11_chat_route_shell.md` |
| Backend dependency | P3/P5/P6/P7 |
| User outcome | User can enter a domain-scoped RAG conversation only when a domain and eligible source are available. |
| Required API contract | P7 conversation list/create/read; P3 member available domains; P6/P7 safe readiness/no-source errors. `GET /chat/capability` is **CONTRACT CAPTURE REQUIRED** and not canonical in P7. |
| Old CE reference | `LightRagChatShell`, composer, conversation frame, domain selector. |
| Local Studio reference | Workbench message area/composer visual rhythm and robust empty-state presentation. |
| Safe lift candidate | Conversation scaffold, domain selection prompt, stable composer geometry. |
| Conflict / tension | Slice uses a separate capability route and optional domain logic. P7 requires a domain per turn and conversation ownership. |
| Reconciliation decision | Build chat around P7 conversations. Domain selection is required for a new turn. Readiness derives from safe domain list and typed server errors, not a locally inferred capability model. Do not send a stream until P7 route/event schema is proven. |
| Backend/API coordination | Capture conversation DTOs, create/list/detail routes, available-domain shape, domain-unavailable/no-eligible-source errors. |
| Frontend work | Chat route empty state, conversation sidebar/list only if P7 route exists, required domain selector, local draft. |
| Ownership boundary | API owns conversation ownership, domain scope, admission, prior context. |
| Acceptance tests | No domain -> blocked; unavailable domain -> safe message; no fabricated answer. |
| Status | **Adapt after P7 API fixture** |

## F12 — Grounded SSE + Evidence

| Field | Decision |
|---|---|
| Frontend slice | `12_chat_sse_evidence.md` |
| Backend dependency | P6, P7 |
| User outcome | User receives mapped evidence before/with RAG-only streamed result; cancellation and terminal states are safe. |
| Required API contract | P7 canonical draft: `POST /api/v1/conversations/{conversation_id}/turns` SSE and Context Engine events `evidence`, `token`, `done`, `error`. Exact payload/order/disconnect/idempotency behavior is **CONTRACT CAPTURE REQUIRED**. |
| Old CE reference | `LightRagChatShell` event/reducer idea and evidence panel, not its old endpoint/event contract. |
| Local Studio reference | Stable message frame/streaming visual behavior only. |
| Safe lift candidate | Bounded SSE parser, reducer/controller separation, AbortController, stable assistant frame. |
| Conflict / tension | Frontend Slice 12 assumes `/chat/turn/stream` with `sources/answer_complete/evidence_only/error`; P7 specifies conversation turn endpoint and `evidence/token/done/error`. |
| Reconciliation decision | P7 vocabulary wins after fixture proof. Implement one stream adapter with typed `ChatStreamEvent` union. No raw provider/LightRAG event, no invented reconnect/heartbeat/progress. Terminal `done.resultKind` determines grounded answer/evidence-only/no-grounded-context. |
| Backend/API coordination | Freeze OpenAPI/non-OpenAPI SSE spec; fixture split frames, evidence-first, duplicate request ID, disconnect, no-grounded-context, evidence-only, redacted turn. |
| Frontend work | Stream parser, state machine, assistant bubble, evidence list, cancel, retry/new turn rule. |
| Ownership boundary | Browser owns abort/rendering; API owns turn identity, evidence mapping, synthesis, persistence. |
| Acceptance tests | No event after terminal mutates UI; evidence never exposes IDs/raw hits; duplicate request produces no second assistant message. |
| Status | **P0 contract gate before implementation** |

## F13 — Knowledge Graph Workspace

| Field | Decision |
|---|---|
| Frontend slice | `13_knowledge_graph_workspace.md` |
| Backend dependency | P5 graph ownership; later approved graph-proxy contract |
| User outcome | User eventually explores safe graph data through Context Engine API with accessible fallback. |
| Required API contract | **CONTRACT CAPTURE REQUIRED:** graph list/detail/schema, domain association, limits/pagination, authorization, safe links. |
| Old CE reference | Existing `/database-visualize` route and graph visual shell. |
| Local Studio reference | Workbench pane/right inspector/list-detail patterns. |
| Safe lift candidate | Route shell, selected-node detail pane, keyboard/list fallback. |
| Conflict / tension | LightRAG owns graph internally, but no greenfield public graph proxy is proven. |
| Reconciliation decision | Build only route shell/empty state after shell phase. Do not bind a graph library or expose graph actions until proxy DTO capture. Renderer remains API-neutral `GraphViewModel`. |
| Backend/API coordination | Define safe graph proxy; prohibit direct LightRAG browser connection; define selected node/edge DTO and limits. |
| Frontend work | Empty shell, accessible list fallback, disabled canvas placeholder; later renderer. |
| Ownership boundary | API transforms/authorizes graph data; browser visualizes only safe graph DTO. |
| Acceptance tests | Empty/loading/error safe; keyboard fallback parity; no direct internal service request. |
| Status | **Contract capture required** |

## F14 — Domain Lifecycle

| Field | Decision |
|---|---|
| Frontend slice | `14_lightrag_domain_lifecycle.md` |
| Backend dependency | P3 |
| User outcome | Admin starts, stops, and hard-deletes a domain through API lifecycle control plane. |
| Required API contract | P3 admin create/list/detail/status/start/stop/delete/operation history routes; safe lifecycle DTO; 202 action response. |
| Old CE reference | Domain action buttons/cards. |
| Local Studio reference | Compact action/status rows and confirmation modal treatment. |
| Safe lift candidate | Clear destructive dialog, action pending state, safe status display. |
| Conflict / tension | Legacy UIs can imply repair/recreate/regen or direct runtime inspection; P3 allows create/start/stop/delete only. |
| Reconciliation decision | Render only server-permitted actions. Start/stop/delete go through typed lifecycle client. Delete remains visible as “Deletion in progress” until server row disappears; no repair/recreate/purge buttons. |
| Backend/API coordination | Capture action result, conflict/busy responses, status refresh behavior, domain deletion completion/404 semantics. |
| Frontend work | `DomainLifecycleActions`, `DeleteDomainDialog`, detail refresh, resource-specific history link. |
| Ownership boundary | Controller/Docker remains private; API validates state/fencing; browser does not encode transition graph. |
| Acceptance tests | Delete explicit confirmation; 202 remains pending; stale/404 safe; member blocked. |
| Status | **Adopt after P3 contract proof** |

## F15 — Admin Activity / Resource Recovery

| Field | Decision |
|---|---|
| Frontend slice | `15_operations_recovery.md` |
| Backend dependency | P3/P4/P5/P7/P8 |
| User outcome | Admin sees safe resource-specific activity/recovery truth without a fake universal workflow system. |
| Required API contract | Domain lifecycle history; source prep history; source current index state; audit list; optional chat/admin visibility only if later approved. A generic `/operations` endpoint is **not canonical**. |
| Old CE reference | Operations list/polling patterns. |
| Local Studio reference | Logs/status lists and right-detail panels, visual only. |
| Safe lift candidate | Unified visual **Activity** page composition with tabs, filters, resource links, bounded refresh. |
| Conflict / tension | Frontend Slice 15 expects canonical generic `/operations`; cross-phase alignment rejects generic operation/workflow ownership. |
| Reconciliation decision | Compose one admin support surface from resource adapters: Domains, Sources, Indexing, Audit. Each keeps its own DTO/status mapper and route. Do not create common backend operation table or force common status enum. |
| Backend/API coordination | Define resource-specific list/history DTOs and pagination; decide which subsets are global/admin-visible. |
| Frontend work | Activity tabs, detail drawer, per-resource status maps, isolated poll policies. |
| Ownership boundary | Backend maintains resource truth; browser aggregates read models only. |
| Acceptance tests | No generic endpoint assumption; stale source/domain recovery does not change state client-side; member forbidden. |
| Status | **Adapt later after resource contracts** |

## F16 — Evidence Context / Source Navigation

| Field | Decision |
|---|---|
| Frontend slice | `16_workspace_context_source_nav.md` |
| Backend dependency | P6 now; later explicit authorized source-view phase |
| User outcome | User sees safe evidence metadata now; later may navigate to authorized source detail only after contract proof. |
| Required API contract | P6 safe evidence DTO gives response-local evidence ID, excerpt, source label. Source detail/open/asset contract is **CONTRACT CAPTURE REQUIRED**. |
| Old CE reference | Source inspector pane / side panel. |
| Local Studio reference | Right detail panel structure and focus behavior. |
| Safe lift candidate | Thin right evidence inspector, selection state, keyboard navigation, metadata-only detail presentation. |
| Conflict / tension | F16 and old CE expect source paths/chunks/assets/open behavior. P6 explicitly prohibits source navigation, source refs, asset refs, document browser, IDs, and source opening. |
| Reconciliation decision | Build `EvidencePanel` as metadata-only presentation seam. It may select evidence locally but exposes no Open action and makes no detail fetch. Add a later capability field only when backend returns an authorized opaque source-view handle. Never construct URLs/paths from labels. |
| Backend/API coordination | Later prove authorization, opaque locator/handle, safe excerpt/window, asset access, deletion/redaction behavior, audit requirement. |
| Frontend work | `EvidenceViewModel`, list/detail presentation, optional callback kept unused by default. |
| Ownership boundary | Browser renders API-provided metadata; API authorizes all source content; no client path resolution. |
| Acceptance tests | Missing metadata safe; no source path/ID rendered; no network source detail request; keyboard selection works. |
| Status | **Metadata seam now; real navigation deferred** |

## F17 — Audit + Diagnostics

| Field | Decision |
|---|---|
| Frontend slice | `17_audit_diagnostics.md` |
| Backend dependency | P8 |
| User outcome | Admin reviews safe audit events, health summary, and capped diagnostic information. |
| Required API contract | P8 `GET /api/v1/admin/audit-events`; optional `GET /api/v1/admin/domains/{domain_id}/diagnostics/lightrag?tail=200`; request ID only if DTO supplies it. |
| Old CE reference | Audit/log table concepts and safe status patterns. |
| Local Studio reference | Inspector/list/detail visual treatment, compact log-like rows. |
| Safe lift candidate | Dense table, filters, expandable safe metadata, copyable opaque IDs, page-state patterns. |
| Conflict / tension | Old/ref UI may surface raw logs/provider internals or link Langfuse. P8 explicitly restricts diagnostics and keeps Langfuse optional/private. |
| Reconciliation decision | Admin-only audit table plus redacted/capped diagnostics panel. No raw provider logs, stack traces, source content, secrets, trace dashboard proxy, Langfuse key, or browser Langfuse SDK. |
| Backend/API coordination | Capture audit filters/DTO, diagnostic truncation/redaction fields, availability when runtime stopped, 403 behavior. |
| Frontend work | Diagnostics page, audit table, health summary, display redaction backup. |
| Ownership boundary | API redacts/authorizes; browser defense-in-depth redacts known sensitive keys only. |
| Acceptance tests | Sensitive fixture redacted; member forbidden; no raw payload leaks; diagnostics unavailable state safe. |
| Status | **Adopt after P8 contract proof** |
