# Frontend + API Reverse-Engineering and Modular Rebuild Review Prompt

## Role

Act as a senior software architect, frontend engineer, API-integration architect, product-minded UI/UX reviewer, security reviewer, and maintainability reviewer.

Review the target repository thoroughly and produce a **canonical, evidence-led implementation report** that junior developers and coding agents can use to:

1. Understand the current frontend, API boundary, data models, and user-visible behavior.
2. Rebuild or extend the frontend safely using **Next.js App Router, TypeScript, Tailwind CSS, and shadcn/ui**.
3. Recreate the application in small, coherent **vertical slices**.
4. Integrate the frontend with an existing or replacement backend without creating duplicate business logic or competing data models.
5. Preserve proven future extension seams without building speculative systems.

This is not a superficial UI audit and not a request to blindly copy code. Trace real code paths, contracts, state transitions, permissions, and visible outcomes.

---

# Repository Context

```text
Repository: [REPOSITORY URL OR LOCAL PATH]
Branch / commit: [BRANCH OR COMMIT]
Primary frontend stack: [DISCOVER]
Primary backend stack: [DISCOVER]
Target frontend stack: Next.js App Router + React + TypeScript + Tailwind CSS + shadcn/ui
Intended outcome: [REBUILD / DOCUMENT / INTEGRATE / REPLACE BACKEND / MODERNIZE]
Optional target backend: [DESCRIPTION OR URL]
```

---

# Primary Objective

Reverse-engineer the target codebase into a practical frontend and API reconstruction map.

The report must explain:

* How the application is structured.
* What each user-facing screen does.
* Which users can access each screen.
* Which data each screen renders or edits.
* Which API calls, streaming connections, polling loops, or local state support it.
* How UI actions flow through backend processing and return to visible UI states.
* Which models, fields, statuses, errors, and permissions are canonical.
* Which code is reusable, duplicated, stale, mock-only, dead, overly coupled, or unnecessarily complex.
* How to rebuild the product incrementally without re-reverse-engineering the repository for every feature.

A junior developer must be able to request a narrow implementation slice such as:

* “Build only the authenticated application shell and navigation.”
* “Build the main layout, role-aware navigation, and an empty Settings dialog.”
* “Build only the domain/resource list page.”
* “Build the document upload workflow.”
* “Build the chat composer and streamed assistant response.”
* “Build the Settings provider page using the documented API contract.”

Each slice must remain modular, independently testable, and limited to the requested scope.

---

# Evidence and Reporting Rules

Treat repository evidence as the source of truth.

For every meaningful finding, classify it as one of:

| Classification   | Meaning                                                                                |
| ---------------- | -------------------------------------------------------------------------------------- |
| Confirmed        | Directly verified in source, tests, configuration, schema, route, or runtime artifact. |
| Strong inference | Supported by multiple code paths but not directly proven.                              |
| Unknown          | Cannot be safely determined without runtime verification.                              |
| Recommendation   | Proposed target architecture or rebuild decision.                                      |

Use exact evidence whenever available:

* File paths
* Symbols and component names
* Route paths
* API paths and methods
* Request/response fields
* Schema names
* Enum values
* Test names
* Configuration keys
* Relevant line ranges where available

Do not invent:

* Endpoints
* Fields
* Status values
* Database relationships
* Permission rules
* Retry behavior
* Streaming event names
* Product workflows

Clearly flag missing evidence and runtime-verification needs.

---

# Ownership Rules

Use this ownership model unless repository evidence proves otherwise.

| Concern                                                                                                                         | Canonical owner                                 |
| ------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| Rendering, local interaction state, form state, accessibility, navigation feedback                                              | Frontend                                        |
| Authentication verification, authorization, business rules, lifecycle transitions, persistence, secrets, cross-user consistency | Backend                                         |
| Request/response models, error models, streaming payloads                                                                       | Explicit API contract                           |
| Domain entity lifecycle and status truth                                                                                        | Backend                                         |
| UI display mappings and view models                                                                                             | Frontend, derived from API contracts            |
| User-visible permission affordances                                                                                             | Frontend for usability, backend for enforcement |

Rules:

* Hidden navigation is not authorization.
* The browser must never be trusted to provide user identity, roles, permissions, resource ownership, or lifecycle status.
* Frontend types, mocks, and local state must not become a competing source of truth.
* Database models are not automatically safe frontend contracts.
* Sensitive values, credentials, provider keys, internal errors, and private document content must not leak to the browser.

---

# Operating Principles

## KISS — Keep It Simple

Prefer:

* Explicit feature modules.
* Direct component composition.
* Typed request and response models.
* Thin routes and page files.
* One obvious API-client boundary.
* Small feature hooks with clear responsibilities.
* Standard Next.js and React patterns.
* Narrow client-component boundaries.
* One implementation path for current requirements.

Avoid:

* Generic workflow engines.
* Plugin systems.
* Broad global stores.
* Event buses.
* Hidden global behavior.
* Deep inheritance.
* Generic “manager,” “helper,” or “utils” dumping grounds.
* Multiple competing data-fetching patterns.
* Frontend business logic that belongs in the backend.
* Premature provider abstractions.
* Custom framework layers over standard Next.js patterns.

## DRY — One Canonical Owner Per Important Rule

Identify and recommend a single owner for:

* API transport.
* API error normalization.
* Session resolution.
* Authentication redirects.
* Permission checks.
* Navigation visibility rules.
* Core domain types.
* Form validation rules where truly shared.
* Status mappings.
* Loading, empty, forbidden, and error states.
* Streaming event parsing.
* Design tokens.
* Provider configuration and endpoint base URLs.

Do not create abstractions merely because two short code blocks look similar. Small, explicit duplication is preferable to confusing shared abstractions.

## YAGNI — Build Only Current Requirements

Do not recommend or implement unless a present requirement proves the need:

* Plugin systems.
* Feature flags.
* Generic workflow engines.
* Multiple client-state libraries.
* Frontend microservices.
* Offline synchronization.
* WebSockets when SSE or polling is sufficient.
* Compatibility layers without a migration requirement.
* Complex retry frameworks.
* Extensive configuration systems.
* Multi-provider UI abstractions before multiple providers actually exist.

Preserve future capability through clean boundaries, not speculative infrastructure.

---

# Frontend Composition-Root Rule

Treat the application shell as the frontend composition root.

Identify the existing root composition path or recommend a lean target equivalent.

A developer should be able to inspect the main application entry path and answer:

1. What renders at application startup?
2. Which global providers exist and why?
3. How are public, authenticated, and admin routes separated?
4. How is the session resolved?
5. Where is API configuration loaded?
6. Where are global styles, fonts, tokens, and layout rules defined?
7. Which routes are exposed?
8. How are API errors normalized and surfaced?
9. How are streaming, toasts, telemetry, and client-wide feedback handled?
10. Which modules own each major feature?

Preferred target shape, adjusted only where repository evidence supports a clearer existing pattern:

```text
src/
  app/
    layout.tsx                   # Root composition shell
    providers.tsx                # Narrow global providers
    (public)/
    (authenticated)/
    (admin)/
  features/
    auth/
    navigation/
    settings/
    [primary-resource]/
    documents/
    chat/
    jobs/
  components/
    ui/                          # shadcn primitives only
    shared/                      # Reusable presentational components
  lib/
    api/
      client.ts                  # Canonical transport boundary
      contracts.ts               # API request/response types
      errors.ts                  # Error normalization
      stream.ts                  # SSE/WebSocket parsing if required
    auth/
    config/
    telemetry/
  styles/
  types/
```

Do not force this structure where the repository has a simpler and sounder equivalent.

---

# Next.js App Router Rules

Review and document:

* Route groups.
* Nested layouts.
* Server components.
* Client components.
* Loading states.
* Error boundaries.
* Not-found behavior.
* Middleware.
* Route handlers.
* Dynamic routes.
* Search parameters.
* Suspense boundaries.
* Metadata.
* Server-side versus browser-side data fetching.
* Streaming rendering behavior.

Use these principles for the rebuild:

* Prefer server components by default.
* Add `"use client"` only when browser APIs, local interaction state, effects, event handlers, or live streaming require it.
* Keep client boundaries narrow.
* Do not make the entire application client-rendered by default.
* Keep environment access centralized and typed.
* Keep protected-route behavior explicit.
* Do not store credentials or long-lived tokens in browser storage unless a proven secure requirement exists.
* Use one canonical API transport pattern rather than scattered raw `fetch` calls.

---

# Required Review Procedure

Inspect all relevant repository areas before forming conclusions:

* Frontend routes, layouts, pages, components, and styles.
* State stores, contexts, hooks, queries, mutations, and form logic.
* API clients, route handlers, OpenAPI definitions, schemas, and generated types.
* Backend routes, controllers, services, repositories, ORM models, migrations, and workers.
* Authentication and authorization paths.
* Environment variables and deployment configuration.
* Tests, fixtures, seed data, mocks, Storybook examples, and sample payloads.
* SSE, WebSocket, polling, long-running jobs, uploads, retries, cancellation, and timeouts.
* Error boundaries, toasts, empty states, loading states, fallback UI, and permission-denied states.
* Build scripts, Docker files, CI workflows, and runtime entrypoints.

Do not stop at visible components. Trace user actions from UI trigger to final user-visible result.

---

# Required Report Structure

## 1. Executive Summary

Provide:

* What the product is.
* Who its primary users are.
* Main user journeys.
* Frontend architecture in plain language.
* Backend integration style.
* Highest-risk rebuild areas.
* Recommended rebuild strategy.
* Review limitations and confidence level.

Explain terminology in junior-developer language.

---

## 2. Repository and Runtime Architecture Map

Document:

* Frontend framework, version, routing model, rendering strategy, and build tooling.
* Backend framework, API structure, authentication model, ORM/database, background jobs, cache, storage, and external providers.
* Monorepo/package layout.
* Runtime entrypoints for frontend, API, workers, scheduled tasks, and deployment.
* Environment/configuration sources.
* Existing service boundaries.

Include an ASCII architecture diagram:

```text
Browser
  ↓
Next.js routes and layouts
  ↓
Feature components and hooks
  ↓
Typed API client / stream client
  ↓
HTTP / SSE / WebSocket boundary
  ↓
API routes / controllers
  ↓
Application services / domain rules
  ↓
Repositories / database / workers / storage / providers
```

Label each layer as Confirmed, Strong inference, or Unknown.

---

## 3. Route, Screen, and Application-Shell Inventory

Create this route inventory:

| Route | Screen purpose | Auth requirement | Role requirement | Main components | Data/API source | Primary actions | Status |
| ----- | -------------- | ---------------- | ---------------- | --------------- | --------------- | --------------- | ------ |

Include:

* Public routes.
* Login/logout/session routes.
* Authenticated routes.
* Admin routes.
* Dynamic routes.
* Settings routes.
* Error routes.
* Not-found routes.
* Modals, sheets, drawers, command menus, and dialog-driven workflows.
* Mobile navigation behavior where applicable.

Then document the app shell:

```text
Root layout
  ├── Public layout
  ├── Authenticated layout
  │   ├── Header
  │   ├── Sidebar / mobile nav
  │   ├── Breadcrumbs
  │   ├── User menu
  │   └── Page content
  └── Admin layout or admin-only route group
```

Identify:

* Route guards.
* Role-aware navigation.
* Direct-navigation behavior for forbidden routes.
* Shared loading, empty, error, and forbidden states.
* Persistent layout regions.
* Responsive behavior.

---

## 4. Design-System and UI Specification

Extract the actual visual system needed for parity.

Document:

* Font family and fallbacks.
* Font sizes, weights, line heights, and letter spacing.
* Color tokens.
* Background layers.
* Border colors and border usage.
* Radius scale.
* Shadow usage.
* Spacing scale.
* Container widths.
* Header/sidebar dimensions.
* Breakpoints.
* Responsive rules.
* Icon library and sizing.
* Button, input, table, dialog, sheet, card, badge, and toast patterns.
* Focus, hover, active, disabled, destructive, and loading states.
* Motion and transition rules.
* Accessibility behavior.

Translate evidence into reusable Tailwind and CSS-variable guidance where appropriate.

Use this component classification table:

| Component/module | Responsibility | Shared primitive or feature-specific | Backend coupling | Reusability | Notes |
| ---------------- | -------------- | ------------------------------------ | ---------------- | ----------- | ----- |

Separate:

* shadcn primitives.
* Shared presentation components.
* Feature components.
* Backend-coupled components.
* Components that should be simplified or split.

---

## 5. End-to-End User Workflow Map

Trace each meaningful user workflow from UI trigger to visible completion.

Include all relevant workflows, such as:

* Login, logout, session restoration, and session expiry.
* Role-aware navigation and protected routes.
* Core resource browsing, creation, editing, archive/delete, start/stop, or lifecycle actions.
* Upload, ingestion, import, export, download, and status tracking.
* Search, retrieval, query, chat, report generation, or task execution.
* Settings and provider/configuration management.
* Background jobs, operations, logs, and history.
* Admin workflows.
* Retry, cancellation, timeout, and recovery behavior.

Use this table:

| Workflow | UI trigger | Preconditions | Request/event sequence | Backend state change | UI states | Error paths | Authorization | Evidence |
| -------- | ---------- | ------------- | ---------------------- | -------------------- | --------- | ----------- | ------------- | -------- |

For workflows with statuses, produce an evidence-backed state machine:

```text
[observed initial state]
  → [observed transition]
  → [observed terminal state]

Failure branches:
[state] → [failure/cancellation/retry state]
```

Do not invent states. Extract them from enums, schemas, UI conditions, tests, and backend logic.

---

## 6. API Contract Catalog

Build a complete frontend-facing API inventory.

For every endpoint, stream, polling resource, or transport event, document:

| Endpoint/event | Method/transport | Purpose | Request model | Response/event model | Error model | Auth | Authorization | Idempotency | UI consumers | Backend owner | Evidence |
| -------------- | ---------------- | ------- | ------------- | -------------------- | ----------- | ---- | ------------- | ----------- | ------------ | ------------- | -------- |

Cover relevant areas:

* Authentication and session.
* Current user/profile.
* Roles and permissions.
* Core domain resources.
* CRUD and lifecycle actions.
* Documents/files/media.
* Background jobs and operations.
* Chat, retrieval, analytics, or reports.
* Settings and provider configuration.
* Admin actions.
* Logs, activity, audit, health, and diagnostics.
* Streaming, polling, subscription, cancellation, and retry endpoints.

For each important contract, provide TypeScript-friendly types or Zod-style schemas.

Example:

```ts
export interface ApiError {
  code: string
  message: string
  fieldErrors?: Record<string, string[]>
  requestId?: string
}

export interface ResourceSummary {
  id: string
  name: string
  status: "active" | "archived"
  createdAt: string
  updatedAt: string
}
```

For every contract, identify:

* Source of truth.
* Backend schema or model relationship.
* Whether the frontend needs a mapped view model.
* Fields that must never reach the browser.

---

## 7. Canonical Data-Model Reconciliation

Identify every meaningful business entity and reconcile frontend assumptions with backend models.

Use this table:

| Canonical entity | Frontend names/types | Backend names/models | Persistence representation | API representation | Conflicts/gaps | Recommended contract |
| ---------------- | -------------------- | -------------------- | -------------------------- | ------------------ | -------------- | -------------------- |

For each entity assess:

* Identifier format.
* Required and optional fields.
* Dates, timestamps, and timezone behavior.
* Status/enum values.
* Pagination, sorting, and filtering.
* Soft-delete/archive behavior.
* Lifecycle ownership.
* Versioning and concurrency behavior.
* Resource ownership and visibility.
* Derived versus persisted fields.
* Nested versus normalized relationships.
* Sensitive fields.
* File references and authorization.

Explicitly identify:

* Duplicate concepts using different names.
* UI fields with no valid backend owner.
* Backend fields required for accurate UI but absent from contracts.
* Stale models.
* Mock-only models.
* Temporary adapters that should not become permanent architecture.

---

## 8. Frontend State, API Client, and Data-Fetching Review

Document how the frontend communicates with the backend and owns state.

Review:

* `fetch`, Axios, React Query, SWR, RTK Query, server actions, custom clients, or route handlers.
* Base URL configuration.
* Header, cookie, and token behavior.
* Session restoration.
* Request cancellation and abort handling.
* Retry behavior.
* Cache keys and invalidation.
* Optimistic updates.
* Pagination and infinite scroll.
* Upload progress.
* Polling intervals and stop conditions.
* SSE/WebSocket parsing.
* Error normalization.
* Loading, stale-data, and refresh behavior.

Classify state:

| State type                | Examples                                         | Recommended owner      |
| ------------------------- | ------------------------------------------------ | ---------------------- |
| URL state                 | route params, selected tab, filter               | URL/search params      |
| Server state              | resources, session, jobs                         | server/query layer     |
| Feature interaction state | open dialog, selected row, draft input           | feature-local state    |
| Form state                | dirty fields, validation, submit state           | form scope             |
| Global UI state           | sidebar collapse, toast queue                    | narrow global provider |
| Stream state              | partial response, connection state, cancellation | stream feature module  |

Recommend a lean target API structure:

```text
src/
  lib/
    api/
      client.ts
      errors.ts
      contracts.ts
      stream.ts
  features/
    auth/
      api.ts
      hooks.ts
    [resource]/
      api.ts
      queries.ts
      mutations.ts
      types.ts
```

For every major finding, label:

* Keep unchanged.
* Simplify.
* Replace.
* Remove.
* Defer pending backend decision.

---

## 9. Authentication, Authorization, and Multi-User Security Map

Map the complete browser-to-backend security flow.

Document:

1. Login entry point.
2. Credential submission.
3. Session creation.
4. Cookie/token behavior.
5. Session refresh or expiry.
6. Current-user resolution.
7. Logout behavior.
8. Protected-route behavior.
9. Unauthorized behavior.
10. Forbidden behavior.
11. Admin-only navigation behavior.
12. Direct URL access to protected/admin routes.
13. Object-level resource authorization.
14. CSRF, CORS, CSP, XSS, redirect, and error-disclosure risks where relevant.
15. Provider/API-secret exposure risks.
16. File/document access controls.
17. Audit logging for destructive or admin actions.

Use this ownership table:

| Control | Frontend responsibility | Backend responsibility | Evidence / validation needed |
| ------- | ----------------------- | ---------------------- | ---------------------------- |

Rules:

* Authenticate once at the API boundary.
* Resolve the current user through one canonical pattern.
* Do not trust browser-supplied roles, permissions, IDs, or resource ownership.
* Keep role names and permission rules centralized.
* Return consistent unauthenticated and forbidden responses.
* Do not expose raw stack traces, secrets, authorization headers, or private source material.

---

## 10. Streaming, Jobs, Polling, and Long-Running Workflows

For every stream, job, background operation, or live-status experience, map the full lifecycle.

Document:

| Concern             | Required finding                                                        |
| ------------------- | ----------------------------------------------------------------------- |
| Transport           | HTTP, SSE, WebSocket, polling, or hybrid                                |
| Start action        | Request path, payload, and response                                     |
| Authentication      | How credentials/session are applied                                     |
| Event/status schema | Event names, fields, ordering, terminal signals                         |
| UI states           | Idle, submitting, queued, running, partial, complete, failed, cancelled |
| Cancellation        | Browser action, backend endpoint, expected final state                  |
| Retry               | Automatic/manual, scope, constraints                                    |
| Reconnect           | Supported behavior and limits                                           |
| Timeout             | Client and server expectations                                          |
| Persistence         | What survives page reload                                               |
| Evidence            | Source locations and tests                                              |

For streamed chat, provide this flow:

```text
composer input
  → submit
  → request validation
  → stream connection
  → incremental event parsing
  → partial assistant rendering
  → citations/evidence rendering
  → final completion or failure
  → cancellation/retry/new-turn behavior
```

Separate verified protocol details from recommendations.

---

## 11. Reliability, Observability, and Error-Handling Review

Treat observability as a cross-cutting concern, not feature business logic.

Identify or recommend one clear place for:

* API error normalization.
* Error boundaries.
* Toast/alert behavior.
* Request IDs/correlation IDs.
* Client-side exception reporting.
* Latency measurement.
* Safe user/action/resource context.
* Sensitive-data redaction.
* Slow-loading behavior.
* Network failure behavior.
* Retry affordances.
* Logging of destructive/admin actions.

Use this API error contract pattern when supported:

```ts
export interface ApiError {
  code: string
  message: string
  fieldErrors?: Record<string, string[]>
  requestId?: string
}
```

Do not recommend complex telemetry infrastructure unless the current application needs it.

---

## 12. Code Removal, Duplication, and Simplification Audit

Find code that can be removed, consolidated, or simplified.

Use this table:

| Finding | Exact files | Why it exists | Why it is stale/duplicated/conflicting | Risk | Dependencies | Recommendation | Validation steps |
| ------- | ----------- | ------------- | -------------------------------------- | ---- | ------------ | -------------- | ---------------- |

Focus on:

* Mock APIs and fake data.
* Duplicate types and schemas.
* Business logic embedded in frontend components.
* Client-side authorization treated as security.
* Legacy API clients.
* Unused stores/context providers.
* Dead routes and components.
* Obsolete feature flags.
* Unused dependencies.
* Generic abstractions with little value.
* Duplicated validation.
* Duplicated status mapping.
* Unreachable UI states.
* Stale fixtures.
* Compatibility layers.

Do not recommend deletion without exact evidence and a safe validation plan.

---

# Target Modular Rebuild Architecture

After documenting the current codebase, recommend a lean target architecture for the Next.js + Tailwind rebuild.

Include:

1. Recommended route groups and layouts.
2. Feature boundaries.
3. Shared UI boundaries.
4. API client boundary.
5. Contract source-of-truth strategy.
6. Session/auth strategy.
7. Error-handling strategy.
8. State-management strategy.
9. Streaming strategy.
10. Test strategy.
11. Explicitly deferred concerns.

The recommendation must preserve this dependency direction:

```text
Routes / layouts
  ↓
Feature modules
  ↓
Feature hooks and controllers
  ↓
Typed API / streaming client
  ↓
Backend API
```

Avoid this anti-pattern:

```text
Shared UI component
  ↓
Direct raw API call
  ↓
Embedded auth decision
  ↓
Feature-specific business logic
```

---

# Vertical-Slice Implementation Plan

Create a prioritized sequence of small, independently shippable implementation slices.

Each slice must include only the minimum route, UI, interaction behavior, API integration, states, and tests required for one usable capability.

Use this exact format:

```text
Slice name:
User outcome:

In scope:
- ...

Explicitly out of scope:
- ...

Routes affected:
- ...

Frontend modules affected:
- ...

API contracts consumed:
- ...

Data models:
- ...

Authorization behavior:
- ...

UI states:
- Loading:
- Empty:
- Error:
- Unauthenticated:
- Forbidden:
- Success:

Acceptance criteria:
- ...

Tests:
- Success case
- Validation failure
- Unauthenticated case
- Unauthorized case
- Network/API failure
- Important edge case

Files to create:
- ...

Files to modify:
- ...

Deliberately not added:
- ...

Dependencies on prior slices:
- ...
```

Suggested order, adjusted only where repository evidence requires a different sequence:

1. Runtime foundation, global styles, design tokens, and API configuration.
2. Public shell and authentication pages.
3. Session resolution and protected-route behavior.
4. Authenticated application shell and navigation.
5. Role-aware navigation and forbidden-route handling.
6. Empty Settings shell/dialog and section navigation.
7. Core resource list/index page.
8. Resource detail page.
9. Create/edit workflow.
10. Upload/document/job-status workflow.
11. Search/query/chat shell.
12. Streaming response rendering.
13. Evidence/source navigation.
14. Admin management views.
15. Logs, operations, and observability views.

### Required Example Slice

Include a fully detailed slice for:

```text
Authenticated application shell + role-aware navigation + empty Settings dialog
```

This slice must cover:

* Root authenticated layout.
* Header and sidebar/mobile navigation.
* Active-route styling.
* Member versus admin navigation visibility.
* Direct navigation to admin-only routes.
* Empty Settings shell/dialog.
* Dialog open/close/focus/escape behavior.
* Placeholder/empty content states.
* No credential storage in browser storage.
* Tests for member/admin/unauthenticated behavior.

---

# Coding-Agent Implementation Rules

When implementing a requested slice:

1. Inspect the relevant report sections and existing repository pattern first.
2. Implement only the requested slice.
3. Keep page and route files thin.
4. Keep feature behavior inside feature modules.
5. Use the canonical API client and contract models.
6. Do not call backend endpoints directly from shared UI primitives.
7. Keep backend authorization as the security boundary.
8. Use frontend role checks only for usability and navigation visibility.
9. Add loading, empty, error, unauthenticated, and forbidden states where relevant.
10. Add tests with every behavior change.
11. Do not refactor unrelated code unless blocked by a correctness, security, or architecture issue.
12. State what was deliberately not added and why.
13. Use explicit names and predictable file placement.
14. Keep files small and control flow easy to trace.
15. Avoid new dependencies unless a current requirement clearly needs them.

A junior developer must be able to trace a feature through:

```text
route
  → layout
  → feature component
  → feature hook/controller
  → typed API client
  → API contract
  → rendered user state
```

---

# Definition of Done for Every Slice

Before marking a slice complete, verify:

* Responsibility is in the correct layer.
* Route/controller code is thin.
* API calls use the canonical client.
* Request and response types are explicit.
* Backend authorization is enforced independently of frontend visibility.
* Loading, empty, error, unauthenticated, and forbidden states are handled.
* Important errors use the common error pattern.
* Configuration comes from one canonical source.
* Sensitive data is not exposed in logs, browser storage, or UI.
* Tests cover success, validation failure, authorization failure, and important edge cases.
* No unnecessary abstraction, dependency, background system, or configuration option was introduced.
* The implementation remains understandable without hidden knowledge of unrelated features.

---

# Final Decision Section

Conclude the report with direct answers:

1. Can the existing frontend be retained, extended, or migrated without a full UI rebuild?
2. Which frontend areas are low, medium, and high integration complexity?
3. What are the major API, data-model, and authorization blockers?
4. What is the minimum canonical API surface required before frontend wiring begins?
5. What is the recommended first implementation slice?
6. Which files should be changed first?
7. Which risks must be resolved before production use?
8. Which code should be removed, simplified, preserved, or deferred?
9. What behavior still requires runtime verification?
10. What must explicitly not be built yet?

The report is complete only when a junior developer or coding agent can implement a narrow request—such as “main app layout, navigation, and empty Settings dialog”—without guessing at routes, permissions, API contracts, models, UI states, or ownership boundaries.
