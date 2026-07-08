# Context Engine

## Local Studio Convergence Review: Frontend, UX, FastAPI Contract Plan

Product-preserving plan: adopt Local Studio UI foundations, keep Context Engine as FastAPI multi-user RAG workbench.

> **Scope**
> Consolidates architecture review, Local Studio adoption map, target API contract, typed streaming model, impl plan, future-capability compatibility update. Preserves clean path to add Local Studio-type capabilities later — without building now.

| **Prepared for** | Context Engine product + engineering |
|---|---|
| **Reference apps** | Local Studio (visual/interaction ref), Context Engine (target product) |
| **Prepared on** | June 28, 2026 |
| **Decision posture** | KISS, YAGNI, DRY; FastAPI = backend authority; Local Studio = UI foundation |

## Contents

1. [Executive recommendation](#1-executive-recommendation)
2. [Evidence base + confidence limits](#2-evidence-base-and-confidence-limits)
3. [Functional overlap matrix](#3-functional-overlap-matrix)
4. [Local Studio code adoption map](#4-local-studio-code-adoption-map)
5. [Target Context Engine route + shell architecture](#5-target-context-engine-route-and-shell-architecture)
6. [Visual parity rules + required corrections](#6-visual-parity-rules-and-required-corrections)
7. [FastAPI contract inventory](#7-fastapi-contract-inventory)
8. [Canonical API data models](#8-canonical-api-data-models)
9. [Typed SSE query contract](#9-typed-sse-query-contract)
10. [Frontend architecture map](#10-frontend-architecture-map)
11. [Future capability compatibility update](#11-future-capability-compatibility-update)
12. [Vertical-slice impl plan](#12-vertical-slice-implementation-plan)
13. [Test + visual-regression plan](#13-test-and-visual-regression-plan)
14. [Risks, deferred decisions, explicit non-goals](#14-risks-deferred-decisions-and-explicit-non-goals)
15. [Appendix A: Sources + reference inputs](#appendix-a-sources-and-reference-inputs)

> **Interpretation**
> "Future compatible" = initial architecture avoids dead ends, preserves stable seams. Not: unused abstractions, placeholder schemas, Local Studio coding-agent runtime import now.

# 1. Executive Recommendation

Adopt Local Studio as Context Engine UI foundation — not product architecture.

**Port/narrow recreate:** design tokens, compact workstation shell, UI primitives, status patterns, settings composition, right-detail panel, query interaction feel.

**Keep Context Engine:** FastAPI backend, RAG domain model, document library, ingestion, evidence, graph, provider settings, admin workflows.

**Do not port:** Local Studio coding-agent runtime, controller process, Pi session mechanics, terminal/filesystem, Electron, command queue, agent replay. Different product problem → avoidable complexity.

> **Immediate priorities**
> 1. Replace browser-persisted bearer creds → HttpOnly cookie session.
> 2. Replace non-streaming retrieval boundary → one typed FastAPI SSE endpoint per RAG query turn.
> Establishes secure stable seam for visual redesign + future expansion.

## Target principle

Context Engine = multi-user RAG workbench. Local Studio = visual system, interaction patterns, selected frontend dev practices. Context Engine keeps domain vocabulary, backend source-of-truth, auth model, workflow ownership.

# 2. Evidence Base and Confidence Limits

Consolidates prior repo review + supplied Local Studio visual-parity docs. Source-level architecture + UI-convergence plan. Runtime behavior (reverse-proxy buffering, cookie/CORS deploy, provider cancellation, worker interruption) → verify during impl.

| **Evidence source** | **Used for** | **Confidence / limitation** |
|--------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------|
| Local Studio repository | Visual tokens, shared UI primitives, dense workstation shell, settings + agent interaction patterns. | High for UI arch; ref only, not product dependency. |
| Context Engine repository | FastAPI routes, frontend structure, auth, retrieval, documents, ingestion jobs, graph, domain lifecycle, settings. | High for static design + migration planning; runtime validation still required. |
| Context Engine UI Design System - Local Studio Visual Parity | Binding visual rules: dark-first theme, Geist/Geist Mono, compact density, right detail panel, token-first impl. | High. Verify source details against Local Studio before copying exact values. |
| Local Studio Visual-Parity Package | Extraction procedure, parity acceptance criteria, impl constraints. | High. Implementation governance. |

# 3. Functional Overlap Matrix

Decide: direct reuse, adapt, preserve, or exclude Local Studio capabilities. "Common" = compatible user intent + ownership — not similar visual shape alone.

| **Functional area** | **Context Engine role** | **Local Studio role** | **Relationship** | **Target decision** | **Frontend / contract implication** |
|-------------------------------------|---------------------------------------------------------------------|----------------------------------------------------------------------------|---------------------------------------------|------------------------------------------------------------------------------------------|---------------------------------------------------------|
| Application shell and sidebar | Domain-oriented nav, library, graph, settings, admin. | Dense collapsible workstation rail. | Common - controlled adaptation | Preserve CE nav; adopt LS rail behavior + visual grammar. | Shared shell primitives; no backend change. |
| Theme, tokens, typography | Existing client theme + Geist font. | Dark/light tokens, compact scale, dense surface hierarchy. | Common - direct reuse candidate | LS-compatible token system = one canonical design system. | No data contract change. |
| Shared UI primitives | Existing UI components + feature widgets. | Buttons, inputs, lists, tables, tabs, modal, drawer, detail panel, status. | Common - direct reuse candidate | Port/recreate narrow primitives under CE ownership. | No backend change. |
| Authentication and current user | JWT/client token behavior; role-aware views. | Different single-product/controller assumptions. | Common - controlled adaptation | CE cookie session + CurrentUser boundary. | New session/me contract; no browser credential storage. |
| Role-gated navigation | Member/admin distinction + server enforcement. | Not same multi-user auth scope. | CE only - preserve | Hide admin nav for members; backend = authority. | CurrentUser.role + consistent 403 error envelope. |
| Query composer and answer thread | RAG question + result display. | Agent composer/thread workspace. | Common - controlled adaptation | Composer/thread visual behavior only; keep RAG-specific states. | One typed SSE turn endpoint. |
| Streaming response | Current retrieval result non-streaming. | Live agent/controller stream. | Common - controlled adaptation | FastAPI SSE per query; no LS session EventSource arch. | POST /chat/turns -> SSE. |
| Evidence, citations, right panel | Document/chunk/asset evidence inspection. | Contextual detail-panel pattern. | Common - controlled adaptation | Detail panel for sources, chunks, assets, logs, node detail. | Stable EvidenceReference + EvidenceChunk models. |
| Settings and provider configuration | Admin provider profiles/defaults; account/appearance settings. | Compact settings nav + form rows. | Common - controlled adaptation | Keep CE settings concepts; port settings grammar. | Normalize provider profile + status contracts. |
| Documents and library | Core document, chunk, structure, asset navigation. | No equivalent RAG-library domain. | CE only - preserve and restyle | Keep route + data; LS tables/lists/detail panel. | Domain-scoped document contracts. |
| File upload and ingestion | Admin upload + pipeline jobs. | No compatible product workflow. | CE only - preserve and restyle | Focused modal, compact progress, job detail panel. | Upload returns document + job; normalized job state. |
| Domain lifecycle | Create/start/stop/delete per-domain runtime. | No matching runtime concept. | CE only - preserve and simplify | Four lifecycle actions; remove/refrain recreate/regenerate UI. | Canonical lifecycle enum + operation responses. |
| Graph exploration | Semantic graph + workspace context. | No matching semantic graph feature. | CE only - preserve and restyle | Keep graph route; LS shell + panel treatment. | Domain-scoped graph contract. |
| Operations and logs | Admin lifecycle/audit/ingestion visibility. | Usage/log surfaces. | Common - controlled adaptation | Dense table + right-side detail inspection. | OperationSummary / OperationDetail. |
| Conversation/session history | Page-level turn state; no durable thread need. | Persistent agent session/replay semantics. | LS only - exclude now | No durable conversation model in initial plan. | No session/conversation schema now. |

# 4. Local Studio Code Adoption Map

Local Studio = visual + interaction ref. Reuse narrow: tokens + primitives direct where license/deps allow; else recreate same behavior in CE codebase. No large product feature folder imports for single component.

| **Local Studio source area** | **Provides** | **Decision** | **Context Engine target** | **Required change** |
|----------------------------------------------------|--------------------------------------------------------|-----------------|------------------------------------------------------|------------------------------------------------------------------------------|
| frontend/src/app/styles/globals/tokens.css | Theme tokens, density, typography, surface hierarchy. | Port / recreate | Global CE style tokens. | One token map; no feature-level duplicate tokens. |
| frontend/src/lib/themes.ts | Theme selection + aliases. | Adapt | Appearance preference. | Keep CE preference ownership. |
| frontend/src/ui/button.tsx and form primitives | Compact, accessible controls. | Port / recreate | Shared CE UI. | Keep only variants actually needed. |
| frontend/src/ui/status, table, tabs, modal, drawer | Dense operational UI patterns. | Port / recreate | Library, jobs, settings, admin. | Map CE status enums centrally. |
| frontend/src/ui/right-detail-panel.tsx | Contextual inspection pattern. | Port / adapt | Evidence, document, job, graph-node, log inspection. | Replace agent detail content with RAG domain content. |
| frontend/src/features/shell/ | Sidebar + workstation shell composition. | Adapt | App layout + navigation. | Preserve CE domain/library/graph/admin info arch. |
| frontend/src/features/agent/ | Composer/thread interaction ref. | Reference only | Query/chat feature. | Rebuild against FastAPI SSE; no agent runtime import. |
| Controller APIs, Pi runtime, Electron, xterm | Coding-agent execution, sessions, terminal/filesystem. | Exclude now | None in initial product. | Future compatibility constraints only — not code. |

> **License gate**
> Before verbatim LS source copy: confirm repo license, preserve attribution/notices. Until confirmed: LS source = high-fidelity ref; recreate minimum necessary primitives.

# 5. Target Context Engine Route and Shell Architecture

Keep existing CE product areas. Redesigned shell: compact left rail, central work canvas, optional right detail panel. Panel = reusable continuity mechanism — not new per-feature dashboard.

## Proposed navigation map

- Domain selector
- Query
- Library
- Graph
- Settings: Account and Appearance
- Admin only: Domains, Ingestion, Operations, Providers, Users

| **Route** | **Audience** | **Purpose** | **Main layout** | **Right detail panel** |
|-------------------------------|----------------|-------------------------------------------------|----------------------------------------|------------------------------------------|
| /domains/\[domainId\]/chat | Member / Admin | Grounded questions + streamed answers. | Conversation thread + composer. | Evidence source, chunk, document asset. |
| /domains/\[domainId\]/library | Member / Admin | Browse source documents + derived content. | Dense document table/list. | Document, chunk, asset, ingestion state. |
| /domains/\[domainId\]/graph | Member / Admin | Explore semantic graph. | Graph canvas, restrained controls. | Node metadata, linked sources, evidence. |
| /settings/account | Member / Admin | Account details + session actions. | Settings rows. | None. |
| /settings/appearance | Member / Admin | Theme + UI preference. | Settings rows. | None. |
| /admin/domains | Admin | Create + manage runtime domains. | Dense list/table. | Lifecycle detail, failure diagnostics. |
| /admin/ingestion | Admin | Monitor jobs, retry where allowed. | Table with status/progress. | Job detail/log. |
| /admin/operations | Admin | Review lifecycle + audit operations. | Table. | Operation payload/log. |
| /admin/providers | Admin | Manage configured providers + model profiles. | Settings rows. | Provider test result. |
| /admin/users | Admin | User administration. | Table. | User detail. |

# 6. Visual Parity Rules and Required Corrections

Context Engine UI Design System = governing direction. Local Studio = visual authority. CE changes business objects + copy — not foundational visual language.

| **Keep as binding rule** | **Implementation correction / clarification** |
|---------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------|
| Dark-first LS-compatible theme; matching light theme. | One CE token map preserving LS-compatible aliases. No duplicate theme vars per feature. |
| Geist / Geist Mono + compact type ramp. | Monospace only for technical values: paths, IDs, models, timestamps, payloads, code. |
| Dense workstation shell: left rail, central canvas, optional right panel. | Preserve CE nav hierarchy + domain selector; don't copy LS product menu. |
| Quiet monochrome primary actions + restrained semantic statuses. | No broad default-blue CTA, saturated cards, gradients, status-card backgrounds. |
| Tables/lists before card grids. | 24/28px dense row patterns where primitive allows; don't force arbitrary height over shared primitive behavior. |
| LS chat interaction feel. | FastAPI fetch + SSE for RAG streaming — not LS agent/controller session transport. |

# 7. FastAPI Contract Inventory

FastAPI = backend authority. Pydantic schemas + generated OpenAPI types = public boundary. Frontend: small feature-scoped client — no independent schema system.

## Session, domain, document, ingestion routes

| **Endpoint** | **Method** | **Role** | **Request** | **Success response** | **Frontend consumer** | **Notes** |
|---------------------------------------------|------------|--------------|-------------------------|-----------------------------|-----------------------|---------------------------------------------------------------|
| /api/v1/session/login | POST | Public | Credentials | CurrentUser + secure cookie | Login | HttpOnly, Secure cookie; no token in browser. |
| /api/v1/session/logout | POST | Signed-in | None | 204 | User menu | Clears cookie server-side. |
| /api/v1/session/me | GET | Signed-in | None | CurrentUser | App bootstrap | Establishes role + session state. |
| /api/v1/domains | GET | Member/Admin | cursor, limit | Page\[DomainSummary\] | Domain selector | Only domains user may access. |
| /api/v1/admin/domains | POST | Admin | CreateDomainRequest | DomainDetail | Admin domains | Embedding profile → domain-locked. |
| /api/v1/domains/{id} | GET | Authorized | None | DomainDetail | Header/detail | Server decides domain access. |
| /api/v1/admin/domains/{id}/start | POST | Admin | None | OperationSummary | Lifecycle action | Server-confirmed state only. |
| /api/v1/admin/domains/{id}/stop | POST | Admin | None | OperationSummary | Lifecycle action | Server-confirmed state only. |
| /api/v1/admin/domains/{id} | DELETE | Admin | None | OperationSummary | Delete modal | No recreate/regenerate endpoint in target UI. |
| /api/v1/domains/{id}/documents | GET | Authorized | cursor, limit, status | Page\[DocumentSummary\] | Library | Domain-scoped. |
| /api/v1/admin/domains/{id}/documents | POST | Admin | multipart file + parser | {document, job} | Upload modal | One explicit ingestion job. |
| /api/v1/domains/{id}/documents/{documentId} | GET | Authorized | None | DocumentDetail | Detail panel | Source of truth for status + counts. |
| /api/v1/domains/{id}/documents/{documentId} | DELETE | Admin | None | OperationSummary | Library action | Server-authorized delete. |
| /api/v1/documents/{id}/chunks/{chunkId} | GET | Authorized | None | EvidenceChunk | Evidence panel | Resolve via document/domain authorization. |

- All mutations: server-confirmed state; frontend disables duplicate controls while req pending.
- All list endpoints: canonical cursor-based Page\[T\] — not feature-specific list shapes.
- Auth + domain eligibility: always FastAPI-verified; client nav gates = presentational only.

## Chat, graph, provider, operations, health routes

| **Endpoint** | **Method** | **Role** | **Request** | **Success response** | **Frontend consumer** | **Notes** |
|--------------------------------------|------------|-----------------|------------------------|-----------------------------|-----------------------|------------------------------------------|
| /api/v1/domains/{id}/ingestion-jobs | GET | Admin | cursor, limit, status | Page\[IngestionJobSummary\] | Ingestion page | Polling sufficient initially. |
| /api/v1/ingestion-jobs/{jobId} | GET | Admin | None | IngestionJobDetail | Job detail | Keep diagnostics compact. |
| /api/v1/ingestion-jobs/{jobId}/retry | POST | Admin | None | OperationSummary | Retry action | Only if pipeline supports retry. |
| /api/v1/domains/{id}/chat/turns | POST | Authorized | ChatTurnRequest | text/event-stream | Query/chat | Typed SSE; one req per query turn. |
| /api/v1/domains/{id}/graph | GET | Authorized | label/depth/node limit | GraphResponse | Graph route | Explicit domain context. |
| /api/v1/admin/providers | GET/PATCH | Admin | ProviderConfig | ProviderConfig | Providers settings | Secret values never read back. |
| /api/v1/admin/providers/{id}/test | POST | Admin | None | OperationSummary | Providers settings | Optional health/test action. |
| /api/v1/admin/operations | GET | Admin | cursor, limit, filters | Page\[OperationSummary\] | Operations page | Admin-only diagnostic surface. |
| /api/v1/admin/operations/{id} | GET | Admin | None | OperationDetail | Detail panel | No log payloads in row list. |
| /api/v1/health | GET | Public/Internal | None | Health response | Bootstrap/ops | Keep minimal. |

> **Canonical API error**
> All feature errors normalize to: `{ error: { code, message, details, request_id } }`. No mixed FastAPI detail payloads or feature-specific response shapes. Error codes — not client-side text matching — drive UI state.

# 8. Canonical API Data Models

Pydantic models = canonical. Generate TypeScript from FastAPI OpenAPI; commit generated client types. Models small + role-specific. Frontend must not invent duplicate status vocabularies.

| **Model group** | **Core models** | **Source of truth** | **Frontend cache / owner** |
|----------------------------|-------------------------------------------------------------------------------------------------------------|------------------------------------------------|--------------------------------------------------------|
| Identity and authorization | CurrentUser, Role | FastAPI session + DB. | App bootstrap; refresh on login/logout. |
| Domains | DomainSummary, DomainDetail, DomainLifecycleState | FastAPI/domain runtime service. | Route data; refresh after server-confirmed operation. |
| Documents and ingestion | DocumentSummary, DocumentDetail, DocumentStatus, IngestionJobSummary, IngestionJobDetail, IngestionProgress | FastAPI/document + job persistence. | Route data + detail-panel data. |
| Providers and operations | ProviderSummary, ProviderConfig, ModelProfile, OperationSummary, OperationDetail | FastAPI/settings + operations data. | Admin route data. |
| Evidence | EvidenceReference, EvidenceChunk, Citation | Retrieval service + document/chunk records. | Current turn + detail-panel fetch. |
| Streaming query | ChatTurnRequest + event payloads. | FastAPI query/synthesis service while active. | Feature-local turn state only; not durable by default. |
| Client preference | Theme, sidebar collapse. | Browser preference only. | UI preference store; never credentials. |

## Canonical status vocabulary

| **Resource** | **Canonical values** |
|--------------------|-------------------------------------------------------|
| Domain lifecycle | created, starting, ready, stopped, failed, deleting |
| Document lifecycle | queued, parsing, indexing, indexed, failed, cancelled |
| Ingestion job | queued, running, succeeded, failed, cancelled |
| Operation | pending, running, succeeded, failed |
| Provider health | unconfigured, ready, degraded, failed |
| Query stream stage | retrieving, synthesizing |

> **Ownership rule**
> Backend owns: lifecycle, eligibility, auth, provider health, retrieval evidence, operation state, final stream completion. Frontend owns: presentational state, local selection, input text, local cancellation, non-sensitive UI preferences.

# 9. Typed SSE Query Contract

One authenticated POST per RAG query turn. Fetch + parse response body as SSE stream — EventSource can't POST body. Browser owns AbortController for active req.

## Request

POST /api/v1/domains/{domain_id}/chat/turns | Content-Type: application/json | Accept: text/event-stream

| **Field** | **Type** | **Required** | **Purpose** |
|-------------------|----------------------------------|---------------------|-------------------------------------------------------------------------------|
| question | string | Yes | User's grounded RAG question. |
| mode | hybrid \| semantic \| navigation | Yes, default hybrid | Current retrieval approach — only where product already supports. |
| top_k | integer | No | Bounded retrieval count; expose only if product policy supports user control. |
| client_request_id | string | No | Duplicate-click / req correlation aid; not conversation ID. |

## SSE events

| **Event** | **Required payload** | **When emitted** | **UI behavior** | **Terminal** |
|----------------|-------------------------------------|----------------------------------------|-----------------------------------|--------------|
| turn.started | turn_id, occurred_at | Server accepts + creates turn state. | Create assistant placeholder. | No |
| turn.status | turn_id, stage, message? | Retrieval or synthesis stage changes. | Show compact status text. | No |
| turn.evidence | turn_id, evidence\[\] | Mapped evidence available. | Populate citations/source panel. | No |
| turn.delta | turn_id, sequence, text | Provider emits answer text. | Append incrementally. | No |
| turn.completed | turn_id, citations\[\], duration_ms | Turn completed successfully. | Mark complete; hydrate citations. | Yes |
| turn.failed | turn_id?, code, message, retryable | Terminal failure. | Render concise error/retry state. | Yes |

- Client aborts active fetch → stop local rendering + signal cancellation to FastAPI.
- FastAPI checks client disconnect → stop provider generation where provider/runtime permits.
- No dedicated cancel endpoint unless evidence shows HTTP disconnect leaves material upstream compute running.
- Disable reverse-proxy buffering for this endpoint; send `Cache-Control: no-cache`.
- No WebSockets, agent sessions, conversation replay, generalized event bus in initial slice.

# 10. Frontend Architecture Map

Feature boundaries around CE concepts. LS visual primitives = shared foundation. API calls + stream parsing in capability-specific modules — not page components.

| **Module** | **Responsibility** | **Inputs / outputs** | **State owner** | **Reason** |
|---------------------------------|---------------------------------------------------|-----------------------------------|-----------------------------|---------------------------------------------|
| app/routes | Route assembly + protected page entry. | Route params -> feature screens. | Route layer. | Keeps navigation explicit. |
| components/ui | LS parity primitives. | Props -> accessible UI. | Stateless. | One design language. |
| components/layout | Shell, sidebar, header, detail panel. | Current user + nav state. | Local UI preference. | Preserves workstation composition. |
| features/query | Composer, turn rendering, evidence references. | Question -> streamed turn state. | Current page/session. | No durable conversation model needed. |
| features/library | Document list/detail/upload interaction. | Document APIs -> tables/panel. | Route data/local selection. | Preserves CE library. |
| features/graph | Graph controls/canvas/node inspection. | Graph API -> canvas/panel. | Route data/local selection. | Preserves graph product feature. |
| features/ingestion | Job lists, progress, retry. | Job APIs -> table/panel. | Route data. | Admin workflow stays focused. |
| features/providers / operations | Admin settings + diagnostics. | Admin APIs -> settings/table. | Route data. | Separates admin product areas. |
| lib/api | Typed HTTP, auth cookie use, error normalization. | Models -> requests/responses. | Stateless. | Avoids calls scattered in pages. |
| lib/stream | Single SSE parser. | ReadableStream -> typed events. | Stateless. | No duplicate parsing. |
| stores/ui-preferences | Theme/sidebar only. | Browser preference. | Browser. | Safe local persistence; no credentials. |

# 11. Future Capability Compatibility Update

> **Small update**
> CE should selectively adopt useful LS-style capabilities later. Initial arch preserves clean expansion seams — no unused agent infra, placeholder persistence, abstractions, or data fields today.

## Future candidate capabilities

| **Potential future capability** | **Compatibility seam preserved now** | **Do not build now** | **Future decision gate** |
|-----------------------------------------|-------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------|
| Saved workspaces or query transcripts | Query turns have stable turn_id; domain explicit; UI shell can host workspace/history list later. | Workspace tables, conversation persistence, message history APIs, replay. | Add when users need recall, collaboration, audit, long-running work. |
| Tool-using or assisted research tasks | Typed SSE event namespace additive; right panel can show task details; FastAPI role/domain auth stays central. | Agent loop, tool registry, command queue, autonomous planner, generic event bus. | Require product PRD, capability-specific auth, observable run model. |
| Artifacts and generated outputs | Detail panel + evidence/source identifiers can host rendered files or structured output refs. | Generic Artifact model, storage layer, artifact gallery. | Add when product creates user-visible files, reports, structured output. |
| Long-running runs and execution traces | Operations + ingestion jobs already provide focused status/detail patterns; SSE supports additive progress events. | Merge all jobs, operations, future runs into one generic framework. | Unify only if lifecycles + users truly share one operational model. |
| Advanced model/recipe selection | Provider + ModelProfile schemas separate model identity from UI presentation. | Recipe engine, per-user model override system, broad config matrix. | Add when multiple approved synthesis modes = current product req. |
| MCP or controlled external integrations | FastAPI boundary + role/domain scoping define where future capability checks belong. | MCP client/server, external action execution, credential brokerage. | Require security model, admin enablement, audit events, explicit provider contracts. |
| Session/workspace side panels | Shell + RightDetailPanel = content-agnostic composition patterns. | Agent session replay UI, background activity feed. | Add when persistent workspace entity exists. |

## Compatibility rules

- SSE event naming contract additive: future event names introduced without changing transport; current clients ignore unknown non-terminal events safely.
- Future execution/tool capabilities → new capability-specific FastAPI routes + Pydantic models; never overload current RAG query contract with unrelated execution semantics.
- Domain + role auth at FastAPI boundary → future capabilities inherit same access-control model.
- Existing right detail panel + operations patterns = UI composition seams. No placeholder panels, tabs, DBs, empty feature flags now.
- Provider config separated from UI components → future model/tool options won't require frontend arch rewrite.
- No pre-created generic Workspace, Session, Artifact, Run, Tool, or Agent tables. Add one resource only when ownership, lifecycle, user need concrete.

## Hard exclusions until dedicated phase

- No terminal, filesystem, shell-command, coding-agent runtime.
- No Electron or desktop-controller process.
- No persistent conversation/session history by default.
- No generalized runtime queue, event bus, plugin framework, tool registry.
- No autonomous execution or external actions without explicit product, security, audit reqs.

# 12. Vertical-Slice Implementation Plan

## Phase 1 - Secure session + API foundation

**Goal:** Remove browser-persisted creds; establish stable API seam.

**Scope:** Cookie login/logout/me; CurrentUser role boundary; normalized error envelope; /api/v1 route prefix; generated TypeScript types.

**Acceptance:**

- Seed admin login succeeds.
- Member fixture login succeeds.
- Admin endpoint → 403 for member.
- Admin nav hidden for member.
- Direct admin route → redirect or forbidden.
- No credential in localStorage, sessionStorage, IndexedDB, or URL.

## Phase 2 - Tokens, primitives, shell convergence

**Goal:** LS parity without changing product workflows.

**Scope:** Global token map; dark/light theme; compact primitives; app shell; sidebar; page header; right detail panel.

**Acceptance:**

- Existing query, library, graph, settings routes stay functional.
- No generic shadcn/blue dashboard styling on migrated surfaces.
- Required visual screenshots pass.

## Phase 3 - Streaming query vertical slice

**Goal:** LS-quality RAG query experience; FastAPI ownership.

**Scope:** POST chat/turns SSE; stream parser; incremental answer; evidence panel; abort; retry error state.

**Acceptance:**

- Answer text incremental.
- Evidence before/during synthesis.
- Citations open source detail.
- Stop aborts active req.
- Failed stream → recoverable state.

## Phase 4 - Library + ingestion vertical slice

**Goal:** Preserve documents; LS parity.

**Scope:** Domain library table; upload modal; job progress; document detail; retry where supported.

**Acceptance:**

- Upload returns document + job.
- Status server-confirmed.
- Document, parser, chunks, assets, error inspectable.
- Member cannot mutate.

## Phase 5 - Graph + evidence convergence

**Goal:** Preserve semantic graph; coherent shell + evidence links.

**Scope:** Graph chrome; selected node detail panel; domain-scoped graph API.

**Acceptance:**

- Node detail opens in panel.
- Evidence links resolve correctly.
- Domain auth holds.

## Phase 6 - Providers, operations, admin convergence

**Goal:** Finish admin workflows; focused operational surfaces.

**Scope:** Provider profile settings; secret configured-state; lifecycle operations; logs.

**Acceptance:**

- Secrets never read back.
- Embedding lock clear.
- Lifecycle state server-confirmed.
- Operations admin-only.

## Phase 7 - Cleanup + regression protection

**Goal:** Remove duplicate paths; protect boundary.

**Scope:** Remove legacy client adapters; deprecate old routes; contract tests; visual regression.

**Acceptance:**

- One query API.
- One token/primitives system.
- OpenAPI/client types can't drift.
- Legacy endpoints removed or time-bounded.

# 13. Test and Visual-Regression Plan

## Backend + contract testing

- Pytest route tests for each new /api/v1 endpoint.
- Role tests: admin permitted; member denied; anonymous denied.
- OpenAPI schema snapshot/change review + generated TypeScript build check.
- SSE generator test: started -> status -> evidence -> delta -> completed.
- Failure + disconnect tests for streamed turns.
- Domain lifecycle transition tests + upload/job status tests.

## Frontend + E2E testing

- Admin + member fixture login tests.
- Browser storage audit: no credential in localStorage, sessionStorage, IndexedDB, or URL.
- Member admin nav hidden; direct admin nav → forbidden/redirect.
- Stream incremental; citation opens detail panel; stop aborts req.
- Upload/progress/retry flow + graph-node panel against stable fixtures.

## Required visual verification

| **Viewport** | **Theme** | **Surfaces** |
|--------------|----------------|--------------------------------------------------|
| 1440 x 900 | Dark | Chat, library, graph, settings, admin. |
| 1440 x 900 | Light | Chat, library, settings. |
| 1280 x 800 | Dark | Shell density, tables, detail panel. |
| Narrow width | Dark and Light | Sidebar behavior, detail-panel drawer, composer. |

Review: font rendering, density, surface stack, border contrast, control height, radius, sidebar + panel width, semantic status treatment, loading/error/forbidden states, accidental generic shadcn styling.

# 14. Risks, Deferred Decisions, and Explicit Non-Goals

## Risks — resolve during impl

- Cookie session deploy: same-origin proxy, Secure, HttpOnly, SameSite, CORS, CSRF = one deployment contract.
- SSE buffering: reverse proxies must not buffer chat stream.
- Provider cancellation: browser abort may not stop all upstream model compute; measure before adding cancel endpoint.
- Domain scoping: documents, retrieval, graph, workspace context must agree on selected domain.
- License: confirm LS licensing before source-level code copy.
- Current endpoint drift: version + remove duplicate/obsolete routes — no permanent compatibility layers.

## Deferred product decisions

- Members see all ready domains or only assigned?
- Query turns → auditable persistent transcripts?
- Permanent-delete vs archive for domains + documents?
- Ingestion cancellation actually supported by worker/provider pipeline?
- Screenshot validation in CI or release validation only?
- Which LS-like future capability warrants dedicated product phase?

## Explicit non-goals — current plan

- No LS controller, Pi runtime, terminal, filesystem, Electron, tool execution, agent replay.
- No WebSocket layer or generalized event bus.
- No durable conversation/session feature in initial release.
- No broad rewrite of CE graph or library backend.
- No card-heavy admin dashboard, duplicate token system, hand-maintained TypeScript schema copy.
- No speculative future-agent infra; future compatibility via stable seams only.

# Appendix A. Sources and Reference Inputs

Repository references

- Local Studio: https://github.com/sybil-solutions/local-studio.git
- Context Engine: https://github.com/tabesink/context_engine.git

Provided implementation references

- Context Engine UI Design System - Local Studio Visual Parity (design.md).
- Local Studio Visual-Parity Package (local-studio-visual-parity-package.md).

> **Usage note**
> Implementation-planning artifact. FastAPI models + route tables = target contracts — validate against current source before merge. Current code differs → migrate deliberately; don't silently change behavior.
