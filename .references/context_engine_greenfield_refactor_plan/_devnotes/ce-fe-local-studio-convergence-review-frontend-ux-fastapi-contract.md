# Context Engine

## Local Studio Convergence Review: Frontend, UX, and FastAPI Contract Plan

A product-preserving plan to adopt Local Studio-quality UI foundations while retaining Context Engine as a FastAPI-backed multi-user RAG workbench.

> **Scope of this document**  
> This consolidates the architecture review, Local Studio adoption map, target API contract, typed streaming model, implementation plan, and future-capability compatibility update. The update preserves a clean path to selectively add Local Studio-type capabilities later without building them now.

| **Prepared for** | Context Engine product and engineering work |
|---|---|
| **Reference applications** | Local Studio (visual and interaction reference) and Context Engine (target product) |
| **Prepared on** | June 28, 2026 |
| **Decision posture** | KISS, YAGNI, DRY; FastAPI is the backend authority; Local Studio is the UI foundation |

## Contents

1. [Executive recommendation](#1-executive-recommendation)
2. [Evidence base and confidence limits](#2-evidence-base-and-confidence-limits)
3. [Functional overlap matrix](#3-functional-overlap-matrix)
4. [Local Studio code adoption map](#4-local-studio-code-adoption-map)
5. [Target Context Engine route and shell architecture](#5-target-context-engine-route-and-shell-architecture)
6. [Visual parity rules and required corrections](#6-visual-parity-rules-and-required-corrections)
7. [FastAPI contract inventory](#7-fastapi-contract-inventory)
8. [Canonical API data models](#8-canonical-api-data-models)
9. [Typed SSE query contract](#9-typed-sse-query-contract)
10. [Frontend architecture map](#10-frontend-architecture-map)
11. [Future capability compatibility update](#11-future-capability-compatibility-update)
12. [Vertical-slice implementation plan](#12-vertical-slice-implementation-plan)
13. [Test and visual-regression plan](#13-test-and-visual-regression-plan)
14. [Risks, deferred decisions, and explicit non-goals](#14-risks-deferred-decisions-and-explicit-non-goals)
15. [Appendix A: Sources and reference inputs](#appendix-a-sources-and-reference-inputs)

> **Important interpretation**  
> “Future compatible” means the initial architecture avoids dead ends and preserves stable seams. It does not mean building unused abstractions, creating placeholder schemas, or importing Local Studio’s coding-agent runtime now.

# 1. Executive Recommendation

Adopt Local Studio as Context Engine’s UI foundation, not as its product architecture. Port or narrowly recreate Local Studio’s design tokens, compact workstation shell, UI primitives, status patterns, settings composition, right-detail panel, and query interaction feel. Keep Context Engine’s FastAPI backend, RAG domain model, document library, ingestion, evidence, graph, provider settings, and admin workflows.

Do not port Local Studio’s coding-agent runtime, controller process, Pi-specific session mechanics, terminal/filesystem capabilities, Electron layer, command queue, or agent replay model. These solve a different product problem and would add avoidable complexity to Context Engine.

> **Immediate architectural priorities**  
> First, replace browser-persisted bearer credentials with an HttpOnly cookie-based session. Second, replace the current non-streaming retrieval response boundary with one typed FastAPI Server-Sent Events (SSE) endpoint per RAG query turn. These changes establish a secure, stable seam for the visual redesign and future product expansion.

## Target principle

Context Engine remains a multi-user RAG workbench. Local Studio supplies the visual system, interaction patterns, and selected frontend development practices. Context Engine retains the domain vocabulary, source-of-truth backend, authorization model, and workflow ownership.

# 2. Evidence Base and Confidence Limits

This review consolidates the prior repository review with the supplied Local Studio visual-parity documentation. It is a source-level architecture and UI-convergence plan. Runtime behavior such as reverse-proxy buffering, cookie/CORS deployment, provider cancellation, and worker interruption must be verified during implementation.

| **Evidence source**                                          | **Used for**                                                                                                                | **Confidence / limitation**                                                         |
|--------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------|
| Local Studio repository                                      | Visual tokens, shared UI primitives, dense workstation shell, settings and agent interaction patterns.                      | High for UI architecture; treated as a reference, not a product dependency.         |
| Context Engine repository                                    | FastAPI routes, existing frontend structure, auth, retrieval, documents, ingestion jobs, graph, domain lifecycle, settings. | High for static design and migration planning; runtime validation remains required. |
| Context Engine UI Design System - Local Studio Visual Parity | Binding visual rules: dark-first theme, Geist/Geist Mono, compact density, right detail panel, token-first implementation.  | High. Verify source details against Local Studio before copying exact values.       |
| Local Studio Visual-Parity Package                           | Extraction procedure, parity acceptance criteria, and implementation constraints.                                           | High. Used as implementation governance.                                            |

# 3. Functional Overlap Matrix

Use this matrix to decide whether Context Engine directly reuses, adapts, preserves, or excludes Local Studio capabilities. “Common” requires compatible user intent and ownership, not merely a similar visual shape.

| **Functional area**                 | **Context Engine role**                                             | **Local Studio role**                                                      | **Relationship**                            | **Target decision**                                                                      | **Frontend / contract implication**                     |
|-------------------------------------|---------------------------------------------------------------------|----------------------------------------------------------------------------|---------------------------------------------|------------------------------------------------------------------------------------------|---------------------------------------------------------|
| Application shell and sidebar       | Domain-oriented navigation, library, graph, settings, admin.        | Dense collapsible workstation rail.                                        | Common - controlled adaptation              | Preserve Context Engine navigation; adopt Local Studio rail behavior and visual grammar. | Shared shell primitives; no backend change.             |
| Theme, tokens, typography           | Existing client theme and Geist font foundation.                    | Dark/light tokens, compact scale, dense surface hierarchy.                 | Common - direct reuse candidate             | Use Local Studio-compatible token system as one canonical design system.                 | No data contract change.                                |
| Shared UI primitives                | Existing UI components and feature widgets.                         | Buttons, inputs, lists, tables, tabs, modal, drawer, detail panel, status. | Common - direct reuse candidate             | Port or recreate narrow primitives under Context Engine ownership.                       | No backend change.                                      |
| Authentication and current user     | JWT/client token behavior; role-aware views.                        | Different single-product/controller assumptions.                           | Common - controlled adaptation              | Implement Context Engine cookie session and CurrentUser boundary.                        | New session/me contract; no browser credential storage. |
| Role-gated navigation               | Member/admin distinction and server enforcement.                    | Not the same multi-user authorization scope.                               | Context Engine only - preserve              | Hide admin navigation for members; backend remains authority.                            | CurrentUser.role and consistent 403 error envelope.     |
| Query composer and answer thread    | RAG question and result display.                                    | Agent composer/thread workspace.                                           | Common - controlled adaptation              | Use composer/thread visual behavior only; keep RAG-specific states.                      | One typed SSE turn endpoint.                            |
| Streaming response                  | Current retrieval result is non-streaming.                          | Live agent/controller stream.                                              | Common - controlled adaptation              | Use FastAPI SSE per query; do not copy session EventSource architecture.                 | POST /chat/turns -> SSE.                               |
| Evidence, citations, right panel    | Document/chunk/asset evidence requires inspection.                  | Contextual detail-panel pattern.                                           | Common - controlled adaptation              | Use detail panel for sources, chunks, assets, logs, node detail.                         | Stable EvidenceReference and EvidenceChunk models.      |
| Settings and provider configuration | Admin provider profiles/defaults; account/appearance settings.      | Compact settings navigation and form rows.                                 | Common - controlled adaptation              | Keep Context Engine settings concepts; port settings grammar.                            | Normalize provider profile and status contracts.        |
| Documents and library               | Core document, chunk, structure, and asset navigation.              | No equivalent RAG-library domain feature.                                  | Context Engine only - preserve and restyle  | Keep route and data; use Local tables/lists/detail panel.                                | Domain-scoped document contracts.                       |
| File upload and ingestion           | Admin upload and pipeline jobs.                                     | No compatible product workflow.                                            | Context Engine only - preserve and restyle  | Use focused modal, compact progress, job detail panel.                                   | Upload returns document + job; normalized job state.    |
| Domain lifecycle                    | Create/start/stop/delete per-domain runtime.                        | No matching runtime concept.                                               | Context Engine only - preserve and simplify | Keep four lifecycle actions; remove/refrain from recreate/regenerate UI.                 | Canonical lifecycle enum and operation responses.       |
| Graph exploration                   | Semantic graph and workspace context.                               | No matching semantic graph feature.                                        | Context Engine only - preserve and restyle  | Keep graph route; use Local Studio surrounding shell and panel treatment.                | Domain-scoped graph contract.                           |
| Operations and logs                 | Admin lifecycle/audit/ingestion visibility.                         | Usage/log surfaces.                                                        | Common - controlled adaptation              | Use dense table and right-side detail inspection.                                        | OperationSummary / OperationDetail.                     |
| Conversation/session history        | Current page-level turn state; no product need for durable threads. | Persistent agent session/replay semantics.                                 | Local Studio only - exclude now             | No durable conversation model in initial plan.                                           | No session/conversation schema now.                     |

# 4. Local Studio Code Adoption Map

Local Studio is the visual and interaction reference. Reuse should be narrow: take tokens and primitives directly where license and dependencies allow; otherwise recreate the same behavior in Context Engine’s codebase. Do not import large product feature folders to obtain a single component.

| **Local Studio source area**                       | **Provides**                                           | **Decision**    | **Context Engine target**                            | **Required change**                                                          |
|----------------------------------------------------|--------------------------------------------------------|-----------------|------------------------------------------------------|------------------------------------------------------------------------------|
| frontend/src/app/styles/globals/tokens.css         | Theme tokens, density, typography, surface hierarchy.  | Port / recreate | Global Context Engine style tokens.                  | One token map; no feature-level duplicate tokens.                            |
| frontend/src/lib/themes.ts                         | Theme selection and aliases.                           | Adapt           | Appearance preference.                               | Keep Context Engine preference ownership.                                    |
| frontend/src/ui/button.tsx and form primitives     | Compact, accessible controls.                          | Port / recreate | Shared Context Engine UI.                            | Keep only variants actually needed.                                          |
| frontend/src/ui/status, table, tabs, modal, drawer | Dense operational UI patterns.                         | Port / recreate | Library, jobs, settings, admin.                      | Map Context Engine status enums centrally.                                   |
| frontend/src/ui/right-detail-panel.tsx             | Contextual inspection pattern.                         | Port / adapt    | Evidence, document, job, graph-node, log inspection. | Replace agent detail content with RAG domain content.                        |
| frontend/src/features/shell/                       | Sidebar and workstation shell composition.             | Adapt           | App layout and navigation.                           | Preserve Context Engine domain/library/graph/admin information architecture. |
| frontend/src/features/agent/                       | Composer/thread interaction reference.                 | Reference only  | Query/chat feature.                                  | Rebuild against FastAPI SSE; no agent runtime import.                        |
| Controller APIs, Pi runtime, Electron, xterm       | Coding-agent execution, sessions, terminal/filesystem. | Exclude now     | None in initial product.                             | Retain only future compatibility constraints, not code.                      |

> **License gate**  
> Before copying Local Studio source files verbatim, confirm the repository license and preserve required attribution or notices. Until confirmed, treat Local Studio source as a high-fidelity implementation reference and recreate the minimum necessary primitives.

# 5. Target Context Engine Route and Shell Architecture

Keep the existing Context Engine product areas. The redesigned shell provides a compact left rail, central work canvas, and optional right detail panel. The panel is a reusable continuity mechanism, not a new per-feature dashboard.

## Proposed navigation map

- Domain selector

- Query

- Library

- Graph

- Settings: Account and Appearance

- Admin only: Domains, Ingestion, Operations, Providers, Users

| **Route**                     | **Audience**   | **Purpose**                                     | **Main layout**                        | **Right detail panel**                   |
|-------------------------------|----------------|-------------------------------------------------|----------------------------------------|------------------------------------------|
| /domains/\[domainId\]/chat    | Member / Admin | Grounded questions and streamed answers.        | Conversation thread plus composer.     | Evidence source, chunk, document asset.  |
| /domains/\[domainId\]/library | Member / Admin | Browse source documents and derived content.    | Dense document table/list.             | Document, chunk, asset, ingestion state. |
| /domains/\[domainId\]/graph   | Member / Admin | Explore semantic graph.                         | Graph canvas with restrained controls. | Node metadata, linked sources, evidence. |
| /settings/account             | Member / Admin | Account details and session actions.            | Settings rows.                         | None.                                    |
| /settings/appearance          | Member / Admin | Theme and UI preference.                        | Settings rows.                         | None.                                    |
| /admin/domains                | Admin          | Create and manage runtime domains.              | Dense list/table.                      | Lifecycle detail, failure diagnostics.   |
| /admin/ingestion              | Admin          | Monitor jobs and retry where allowed.           | Table with status/progress.            | Job detail/log.                          |
| /admin/operations             | Admin          | Review lifecycle and audit operations.          | Table.                                 | Operation payload/log.                   |
| /admin/providers              | Admin          | Manage configured providers and model profiles. | Settings rows.                         | Provider test result.                    |
| /admin/users                  | Admin          | User administration.                            | Table.                                 | User detail.                             |

# 6. Visual Parity Rules and Required Corrections

The supplied Context Engine UI Design System is the correct governing direction: Local Studio is the visual authority; Context Engine changes business objects and copy, not the foundational visual language.

| **Keep as a binding rule**                                                | **Implementation correction / clarification**                                                                                     |
|---------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------|
| Dark-first Local Studio-compatible theme; matching light theme.           | Create one Context Engine token map that preserves Local Studio-compatible aliases. Do not duplicate theme variables per feature. |
| Geist / Geist Mono and compact type ramp.                                 | Use monospace only for technical values such as paths, IDs, models, timestamps, payloads, and code.                               |
| Dense workstation shell: left rail, central canvas, optional right panel. | Preserve Context Engine navigation hierarchy and domain selector; do not copy Local Studio’s product menu.                        |
| Quiet monochrome primary actions and restrained semantic statuses.        | No broad default-blue CTA styling, saturated cards, gradients, or status-card backgrounds.                                        |
| Tables/lists before card grids.                                           | Use 24/28px dense row patterns where primitive content allows; do not force an arbitrary height over shared primitive behavior.   |
| Local Studio chat interaction feel.                                       | Use FastAPI fetch + SSE for RAG response streaming, not Local Studio’s agent/controller session transport.                        |

# 7. FastAPI Contract Inventory

FastAPI is the backend authority. Pydantic schemas and generated OpenAPI types define the public boundary. The frontend uses a small, feature-scoped client; it does not maintain an independent schema system.

## Session, domain, document, and ingestion routes

| **Endpoint**                                | **Method** | **Role**     | **Request**             | **Success response**        | **Frontend consumer** | **Notes**                                                     |
|---------------------------------------------|------------|--------------|-------------------------|-----------------------------|-----------------------|---------------------------------------------------------------|
| /api/v1/session/login                       | POST       | Public       | Credentials             | CurrentUser + secure cookie | Login                 | HttpOnly, Secure cookie; no token response stored in browser. |
| /api/v1/session/logout                      | POST       | Signed-in    | None                    | 204                         | User menu             | Clears cookie server-side.                                    |
| /api/v1/session/me                          | GET        | Signed-in    | None                    | CurrentUser                 | App bootstrap         | Establishes role and session state.                           |
| /api/v1/domains                             | GET        | Member/Admin | cursor, limit           | Page\[DomainSummary\]       | Domain selector       | Only domains user may access.                                 |
| /api/v1/admin/domains                       | POST       | Admin        | CreateDomainRequest     | DomainDetail                | Admin domains         | Embedding profile becomes domain-locked.                      |
| /api/v1/domains/{id}                        | GET        | Authorized   | None                    | DomainDetail                | Header/detail         | Server decides domain access.                                 |
| /api/v1/admin/domains/{id}/start            | POST       | Admin        | None                    | OperationSummary            | Lifecycle action      | Server-confirmed state only.                                  |
| /api/v1/admin/domains/{id}/stop             | POST       | Admin        | None                    | OperationSummary            | Lifecycle action      | Server-confirmed state only.                                  |
| /api/v1/admin/domains/{id}                  | DELETE     | Admin        | None                    | OperationSummary            | Delete modal          | No recreate/regenerate endpoint in target UI.                 |
| /api/v1/domains/{id}/documents              | GET        | Authorized   | cursor, limit, status   | Page\[DocumentSummary\]     | Library               | Domain-scoped.                                                |
| /api/v1/admin/domains/{id}/documents        | POST       | Admin        | multipart file + parser | {document, job}             | Upload modal          | One explicit ingestion job.                                   |
| /api/v1/domains/{id}/documents/{documentId} | GET        | Authorized   | None                    | DocumentDetail              | Detail panel          | Source of truth for status and counts.                        |
| /api/v1/domains/{id}/documents/{documentId} | DELETE     | Admin        | None                    | OperationSummary            | Library action        | Server-authorized delete.                                     |
| /api/v1/documents/{id}/chunks/{chunkId}     | GET        | Authorized   | None                    | EvidenceChunk               | Evidence panel        | Resolve via document/domain authorization.                    |

- All mutations use server-confirmed state; the frontend disables duplicate controls while a request is pending.

- All list endpoints return a canonical cursor-based Page\[T\] model rather than feature-specific list shapes.

- Authorization and domain eligibility are always verified by FastAPI; client-side navigation gates are presentational only.

## Chat, graph, provider, operations, and health routes

| **Endpoint**                         | **Method** | **Role**        | **Request**            | **Success response**        | **Frontend consumer** | **Notes**                                |
|--------------------------------------|------------|-----------------|------------------------|-----------------------------|-----------------------|------------------------------------------|
| /api/v1/domains/{id}/ingestion-jobs  | GET        | Admin           | cursor, limit, status  | Page\[IngestionJobSummary\] | Ingestion page        | Polling is sufficient initially.         |
| /api/v1/ingestion-jobs/{jobId}       | GET        | Admin           | None                   | IngestionJobDetail          | Job detail            | Keep diagnostics compact.                |
| /api/v1/ingestion-jobs/{jobId}/retry | POST       | Admin           | None                   | OperationSummary            | Retry action          | Only if current pipeline supports retry. |
| /api/v1/domains/{id}/chat/turns      | POST       | Authorized      | ChatTurnRequest        | text/event-stream           | Query/chat            | Typed SSE; one request per query turn.   |
| /api/v1/domains/{id}/graph           | GET        | Authorized      | label/depth/node limit | GraphResponse               | Graph route           | Explicit domain context.                 |
| /api/v1/admin/providers              | GET/PATCH  | Admin           | ProviderConfig         | ProviderConfig              | Providers settings    | Secret values never read back.           |
| /api/v1/admin/providers/{id}/test    | POST       | Admin           | None                   | OperationSummary            | Providers settings    | Optional health/test action.             |
| /api/v1/admin/operations             | GET        | Admin           | cursor, limit, filters | Page\[OperationSummary\]    | Operations page       | Admin-only diagnostic surface.           |
| /api/v1/admin/operations/{id}        | GET        | Admin           | None                   | OperationDetail             | Detail panel          | No log payloads in row list.             |
| /api/v1/health                       | GET        | Public/Internal | None                   | Health response             | Bootstrap/ops         | Keep minimal.                            |

> **Canonical API error**  
> All feature errors should normalize to: { error: { code, message, details, request_id } }. Avoid mixed FastAPI detail payloads and feature-specific response shapes. Error codes, not client-side text matching, drive UI state.

# 8. Canonical API Data Models

Pydantic models are canonical. Generate TypeScript from FastAPI OpenAPI and commit the generated client types. Keep models small and role-specific. The frontend must not invent duplicate status vocabularies.

| **Model group**            | **Core models**                                                                                             | **Source of truth**                            | **Frontend cache / owner**                             |
|----------------------------|-------------------------------------------------------------------------------------------------------------|------------------------------------------------|--------------------------------------------------------|
| Identity and authorization | CurrentUser, Role                                                                                           | FastAPI session and database.                  | App bootstrap; refresh on login/logout.                |
| Domains                    | DomainSummary, DomainDetail, DomainLifecycleState                                                           | FastAPI/domain runtime service.                | Route data; refresh after server-confirmed operation.  |
| Documents and ingestion    | DocumentSummary, DocumentDetail, DocumentStatus, IngestionJobSummary, IngestionJobDetail, IngestionProgress | FastAPI/document and job persistence.          | Route data and detail-panel data.                      |
| Providers and operations   | ProviderSummary, ProviderConfig, ModelProfile, OperationSummary, OperationDetail                            | FastAPI/settings and operations data.          | Admin route data.                                      |
| Evidence                   | EvidenceReference, EvidenceChunk, Citation                                                                  | Retrieval service plus document/chunk records. | Current turn plus detail-panel fetch.                  |
| Streaming query            | ChatTurnRequest and event payloads.                                                                         | FastAPI query/synthesis service while active.  | Feature-local turn state only; not durable by default. |
| Client preference          | Theme, sidebar collapse.                                                                                    | Browser preference only.                       | UI preference store; never credentials.                |

## Canonical status vocabulary

| **Resource**       | **Canonical values**                                  |
|--------------------|-------------------------------------------------------|
| Domain lifecycle   | created, starting, ready, stopped, failed, deleting   |
| Document lifecycle | queued, parsing, indexing, indexed, failed, cancelled |
| Ingestion job      | queued, running, succeeded, failed, cancelled         |
| Operation          | pending, running, succeeded, failed                   |
| Provider health    | unconfigured, ready, degraded, failed                 |
| Query stream stage | retrieving, synthesizing                              |

> **Ownership rule**  
> The backend owns lifecycle, eligibility, authorization, provider health, retrieval evidence, operation state, and final stream completion. The frontend owns presentational state, local selection, input text, local cancellation, and non-sensitive UI preferences.

# 9. Typed SSE Query Contract

Use one authenticated POST request per RAG query turn. Fetch and parse the response body as an SSE stream because EventSource does not support the required POST body. The browser owns an AbortController for the active request.

## Request

POST /api/v1/domains/{domain_id}/chat/turns \| Content-Type: application/json \| Accept: text/event-stream

| **Field**         | **Type**                         | **Required**        | **Purpose**                                                                   |
|-------------------|----------------------------------|---------------------|-------------------------------------------------------------------------------|
| question          | string                           | Yes                 | User’s grounded RAG question.                                                 |
| mode              | hybrid \| semantic \| navigation | Yes, default hybrid | Current retrieval approach, only where product already supports it.           |
| top_k             | integer                          | No                  | Bounded retrieval count; only expose if product policy supports user control. |
| client_request_id | string                           | No                  | Duplicate-click / request correlation aid; not a conversation ID.             |

## SSE events

| **Event**      | **Required payload**                | **When emitted**                       | **UI behavior**                   | **Terminal** |
|----------------|-------------------------------------|----------------------------------------|-----------------------------------|--------------|
| turn.started   | turn_id, occurred_at                | Server accepts and creates turn state. | Create assistant placeholder.     | No           |
| turn.status    | turn_id, stage, message?            | Retrieval or synthesis stage changes.  | Show compact status text.         | No           |
| turn.evidence  | turn_id, evidence\[\]               | Mapped evidence becomes available.     | Populate citations/source panel.  | No           |
| turn.delta     | turn_id, sequence, text             | Provider emits answer text.            | Append incrementally.             | No           |
| turn.completed | turn_id, citations\[\], duration_ms | Turn completed successfully.           | Mark complete; hydrate citations. | Yes          |
| turn.failed    | turn_id?, code, message, retryable  | Terminal failure.                      | Render concise error/retry state. | Yes          |

- The client aborts the active fetch request to stop local rendering and signal cancellation to FastAPI.

- FastAPI should check client disconnect and stop provider generation where the provider/runtime permits it.

- Do not add a dedicated cancel endpoint unless evidence shows HTTP disconnect leaves material upstream compute running.

- Disable reverse-proxy buffering for this endpoint and send Cache-Control: no-cache.

- Do not add WebSockets, agent sessions, conversation replay, or a generalized event bus in the initial slice.

# 10. Frontend Architecture Map

Keep feature boundaries organized around Context Engine concepts. Local Studio visual primitives become the shared foundation. API calls and stream parsing live in capability-specific modules rather than page components.

| **Module**                      | **Responsibility**                                | **Inputs / outputs**              | **State owner**             | **Reason**                                  |
|---------------------------------|---------------------------------------------------|-----------------------------------|-----------------------------|---------------------------------------------|
| app/routes                      | Route assembly and protected page entry.          | Route params -> feature screens. | Route layer.                | Keeps navigation explicit.                  |
| components/ui                   | Local Studio parity primitives.                   | Props -> accessible UI.          | Stateless.                  | One design language.                        |
| components/layout               | Shell, sidebar, header, detail panel.             | Current user + nav state.         | Local UI preference.        | Preserves workstation composition.          |
| features/query                  | Composer, turn rendering, evidence references.    | Question -> streamed turn state. | Current page/session.       | No durable conversation model needed.       |
| features/library                | Document list/detail/upload interaction.          | Document APIs -> tables/panel.   | Route data/local selection. | Preserves Context Engine library.           |
| features/graph                  | Graph controls/canvas/node inspection.            | Graph API -> canvas/panel.       | Route data/local selection. | Preserves graph product feature.            |
| features/ingestion              | Job lists, progress, retry.                       | Job APIs -> table/panel.         | Route data.                 | Admin workflow remains focused.             |
| features/providers / operations | Admin settings and diagnostics.                   | Admin APIs -> settings/table.    | Route data.                 | Separates admin product areas.              |
| lib/api                         | Typed HTTP, auth cookie use, error normalization. | Models -> requests/responses.    | Stateless.                  | Avoids calls scattered in pages.            |
| lib/stream                      | Single SSE parser.                                | ReadableStream -> typed events.  | Stateless.                  | No duplicate parsing.                       |
| stores/ui-preferences           | Theme/sidebar only.                               | Browser preference.               | Browser.                    | Safe local persistence with no credentials. |

# 11. Future Capability Compatibility Update

> **Small but important update**  
> Context Engine should be able to selectively adopt useful Local Studio-style capabilities later. The initial architecture must preserve clean expansion seams, but must not implement unused agent infrastructure, placeholder persistence, abstractions, or data fields today.

## Future candidate capabilities

| **Potential future capability**         | **Compatibility seam preserved now**                                                                                          | **Do not build now**                                                             | **Future decision gate**                                                                   |
|-----------------------------------------|-------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------|
| Saved workspaces or query transcripts   | Query turns have stable turn_id; domain is explicit; UI shell can host a workspace/history list later.                        | Workspace tables, conversation persistence, message history APIs, replay.        | Add only when users need recall, collaboration, audit, or long-running work.               |
| Tool-using or assisted research tasks   | Typed SSE event namespace is additive; right panel can display task details; FastAPI role/domain authorization stays central. | Agent loop, tool registry, command queue, autonomous planner, generic event bus. | Require a product PRD, capability-specific authorization, and observable run model.        |
| Artifacts and generated outputs         | Detail panel and evidence/source identifiers can host rendered files or structured output references.                         | Generic Artifact model, storage layer, artifact gallery.                         | Add only when the product creates user-visible files, reports, or structured output.       |
| Long-running runs and execution traces  | Operations and ingestion jobs already provide focused status/detail patterns; SSE supports additive progress events.          | Merge all jobs, operations, and future runs into one generic framework.          | Unify only if life cycles and users truly share one operational model.                     |
| Advanced model/recipe selection         | Provider and ModelProfile schemas separate model identity from UI presentation.                                               | Recipe engine, per-user model override system, broad configuration matrix.       | Add only when multiple approved synthesis modes are a current product requirement.         |
| MCP or controlled external integrations | FastAPI boundary and role/domain scoping define where future capability checks belong.                                        | MCP client/server, external action execution, credential brokerage.              | Require a security model, admin enablement, audit events, and explicit provider contracts. |
| Session/workspace side panels           | Shell and RightDetailPanel are content-agnostic composition patterns.                                                         | Agent session replay UI, background activity feed.                               | Add when a persistent workspace entity exists.                                             |

## Compatibility rules

- Keep the SSE event naming contract additive: future event names may be introduced without changing the transport, while current clients safely ignore unknown non-terminal events.

- Keep all future execution or tool capabilities behind new, capability-specific FastAPI routes and Pydantic models; never overload the current RAG query contract with unrelated execution semantics.

- Keep domain and role authorization at the FastAPI boundary so future capabilities inherit the same access-control model.

- Use the existing right detail panel and operations patterns as UI composition seams. Do not create placeholder panels, tabs, databases, or empty feature flags now.

- Keep provider configuration separated from UI components so future model or tool options do not require a frontend architectural rewrite.

- Do not pre-create generic Workspace, Session, Artifact, Run, Tool, or Agent tables. Add one resource only when its ownership, lifecycle, and user need are concrete.

## Hard exclusions until a dedicated phase

- No terminal, filesystem, shell-command, or coding-agent runtime.

- No Electron integration or desktop-controller process.

- No persistent conversation/session history by default.

- No generalized runtime queue, event bus, plugin framework, or tool registry.

- No autonomous execution or external actions without explicit product, security, and audit requirements.

# 12. Vertical-Slice Implementation Plan

## Phase 1 - Secure session and API foundation

Goal: remove browser-persisted credentials and establish the stable API seam.

**Scope:** Cookie login/logout/me; CurrentUser role boundary; normalized error envelope; /api/v1 route prefix; generated TypeScript types.

**Acceptance criteria:**

- Seed admin login succeeds.

- Member fixture login succeeds.

- Admin endpoint returns 403 for member.

- Admin navigation hidden for member.

- Direct admin route redirects or renders forbidden.

- No credential in localStorage, sessionStorage, IndexedDB, or URL.

## Phase 2 - Tokens, primitives, and shell convergence

Goal: establish Local Studio parity without changing product workflows.

**Scope:** Global token map; dark/light theme; compact primitives; app shell; sidebar; page header; right detail panel.

**Acceptance criteria:**

- Existing query, library, graph, settings routes remain functional.

- No generic shadcn/blue dashboard styling remains in migrated surfaces.

- Required visual screenshots pass.

## Phase 3 - Streaming query vertical slice

Goal: deliver a Local Studio-quality RAG query experience with FastAPI ownership.

**Scope:** POST chat/turns SSE; stream parser; incremental answer; evidence panel; abort; retry error state.

**Acceptance criteria:**

- Answer text appears incrementally.

- Evidence arrives before/during synthesis.

- Citations open source detail.

- Stop aborts active request.

- Failed stream exposes recoverable state.

## Phase 4 - Library and ingestion vertical slice

Goal: preserve documents while giving them Local Studio parity.

**Scope:** Domain library table; upload modal; job progress; document detail; retry where supported.

**Acceptance criteria:**

- Upload returns document + job.

- Status is server-confirmed.

- Document, parser, chunks, assets, error are inspectable.

- Member cannot mutate.

## Phase 5 - Graph and evidence convergence

Goal: preserve semantic graph with coherent shell and evidence links.

**Scope:** Graph chrome; selected node detail panel; domain-scoped graph API.

**Acceptance criteria:**

- Node detail opens in panel.

- Evidence links resolve correctly.

- Domain authorization holds.

## Phase 6 - Providers, operations, and admin convergence

Goal: finish admin workflows with focused operational surfaces.

**Scope:** Provider profile settings; secret configured-state; lifecycle operations; logs.

**Acceptance criteria:**

- Secrets never read back.

- Embedding lock is clear.

- Lifecycle state server-confirmed.

- Operations admin-only.

## Phase 7 - Cleanup and regression protection

Goal: remove duplicate paths and protect the boundary.

**Scope:** Remove legacy client adapters; deprecate old routes; contract tests; visual regression.

**Acceptance criteria:**

- One query API.

- One token/primitives system.

- OpenAPI/client types cannot drift.

- Legacy endpoints removed or time-bounded.

# 13. Test and Visual-Regression Plan

## Backend and contract testing

- Pytest route tests for each new /api/v1 endpoint.

- Role tests: admin permitted; member denied; anonymous denied.

- OpenAPI schema snapshot/change review and generated TypeScript build check.

- SSE generator test for started -> status -> evidence -> delta -> completed.

- Failure and disconnect tests for streamed turns.

- Domain lifecycle transition tests and upload/job status tests.

## Frontend and end-to-end testing

- Admin and member fixture login tests.

- Browser storage audit confirms no credential in localStorage, sessionStorage, IndexedDB, or URL.

- Member admin navigation hidden; direct admin navigation produces forbidden/redirect behavior.

- Stream appears incrementally; citation opens detail panel; stop aborts request.

- Upload/progress/retry flow and graph-node panel work against stable fixtures.

## Required visual verification

| **Viewport** | **Theme**      | **Surfaces**                                     |
|--------------|----------------|--------------------------------------------------|
| 1440 x 900   | Dark           | Chat, library, graph, settings, admin.           |
| 1440 x 900   | Light          | Chat, library, settings.                         |
| 1280 x 800   | Dark           | Shell density, tables, detail panel.             |
| Narrow width | Dark and Light | Sidebar behavior, detail-panel drawer, composer. |

Review font rendering, density, surface stack, border contrast, control height, radius, sidebar and panel width, semantic status treatment, loading/error/forbidden states, and accidental generic shadcn styling.

# 14. Risks, Deferred Decisions, and Explicit Non-Goals

## Risks to resolve during implementation

- Cookie session deployment: same-origin proxy, Secure, HttpOnly, SameSite, CORS, and CSRF must work as one deployment contract.

- SSE buffering: reverse proxies must not buffer the chat stream.

- Provider cancellation: browser abort may not stop all upstream model computation; measure before adding a cancel endpoint.

- Domain scoping: documents, retrieval, graph, and workspace context must agree on the selected domain.

- License: confirm Local Studio licensing before source-level code copying.

- Current endpoint drift: version and remove duplicate/obsolete routes instead of maintaining permanent compatibility layers.

## Deferred product decisions

- Whether members can see all ready domains or only assigned domains.

- Whether query turns should become auditable persistent transcripts.

- Permanent-delete versus archive behavior for domains and documents.

- Whether ingestion cancellation is actually supported by the worker/provider pipeline.

- Whether screenshot validation runs in CI or release validation only.

- Which, if any, Local Studio-like future capability warrants a dedicated product phase.

## Explicit non-goals for the current plan

- No Local Studio controller, Pi runtime, terminal, filesystem, Electron, tool execution, or agent replay.

- No WebSocket layer or generalized event bus.

- No durable conversation/session feature in the initial release.

- No broad rewrite of the Context Engine graph or library backend.

- No card-heavy admin dashboard, duplicate token system, or hand-maintained TypeScript schema copy.

- No speculative future-agent infrastructure; future compatibility is maintained through stable seams only.

# Appendix A. Sources and Reference Inputs

Repository references

- Local Studio: https://github.com/sybil-solutions/local-studio.git

- Context Engine: https://github.com/tabesink/context_engine.git

Provided implementation references

- Context Engine UI Design System - Local Studio Visual Parity (design.md).

- Local Studio Visual-Parity Package (local-studio-visual-parity-package.md).

> **Usage note**  
> This document is an implementation-planning artifact. Treat the FastAPI models and route tables as target contracts to be validated against current source before changes are merged. Where current code differs, migrate deliberately; do not silently change behavior.
