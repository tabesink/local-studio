# Canonical Frontend Guardrails

## 1. Product boundary

**[OBSERVED]** Context Engine is a small internal shared-workspace RAG product for roughly 5–10 concurrent users. Authenticated users query administrator-curated Knowledge Domains. Administrators manage users, trusted runtime settings, domains, source documents, lifecycle actions, diagnostics, and audit visibility.

It is not:

```text
an agent workstation
an unrestricted assistant
a terminal/filesystem product
a browser-exposed runtime controller
a document management platform
a tenant / ACL platform
a generic workflow engine
a model playground
```

## 2. Browser / API / private-runtime boundary

```text
Browser
  -> Context Engine application API only
      -> application DB and services
      -> worker / source lifecycle
      -> private domain controller
      -> private LightRAG runtime
      -> trusted provider adapters
```

Never permit browser code to call or receive:

```text
LightRAG URLs or raw responses
Docker/controller routes
worker queues or worker internals
storage keys, file paths, workspace paths
PostgreSQL credentials or database names
provider secrets/ciphertext
provider/model/retrieval overrides
runtime instance IDs or controller generations
raw parser outputs
container IDs, engine output, raw stack traces
```

## 3. Target frontend shape

```text
route/layout
  -> feature shell
  -> feature controller / hook
  -> typed Context Engine API client
  -> DTO -> view-model mapper
  -> presentational components
```

Recommended ownership:

```text
src/app/                    route shells, layouts, route error/loading boundaries
src/features/<feature>/     controller, API wrapper, DTO mapping, view components, tests
src/lib/api/                one transport, common error contract, stream primitives
src/lib/config/             public browser config only
src/components/ui/          narrow shared primitive set, dark-first tokens
src/components/shared/      true cross-feature surfaces only
```

Rules:

- One raw transport: `apiRequest()` and one bounded streaming helper.
- Cookie-first auth; `credentials: include`.
- No bearer token persistence in `localStorage`, `sessionStorage`, Zustand, URL, or request manually composed in a component.
- API wrappers live beside feature modules; components do not contain route strings.
- API DTOs do not leak through visual components. Map to feature view models first.
- Role-aware navigation is usability. Backend authorization remains authority.
- Shared components are only for repeated UI behavior—not business abstractions.
- No global business store. Feature-local state first.

## 4. Dark-first visual reconciliation

**[CONTEXT ENGINE ADAPTATION]** Use Local Studio as visual reference: dark-first workstation shell, compact density, system/Geist-like typography, quiet borders, small radius, stable side navigation, and narrow inspector patterns.

Do not preserve old Context Engine’s white canvas as target UI merely because its early frontend docs describe it. Treat white/light styling as **[OBSERVED] legacy evidence**, not greenfield visual authority.

Implementation rule:

```text
Borrow Local Studio visual language.
Borrow old Context Engine route concepts and Context Engine-specific seams.
Do not borrow Local Studio product runtime behavior.
```

## 5. State vocabulary rule

Never create frontend state labels that imply backend truth not provided by a contract.

Examples:

| Backend truth | Valid UI behavior | Invalid UI behavior |
|---|---|---|
| `domain.state=running` + fresh healthy availability | “Available” | “Fully indexed” without source eligibility proof |
| source index `accepted` | “Indexing” / “Waiting for runtime” | “Ready” |
| delete returns `202` | “Deletion in progress” | remove row permanently before server confirmation |
| parser setting `docling` | “Docling active” | show fake parser profile version/revision |
| P6 evidence response | “Evidence found” | “Open original source” without a later source-view contract |

## 6. Contract capture rule

Use this status whenever an endpoint, event schema, status enum, pagination model, mutation transition, or authorization behavior is not proven by the current backend phase:

```text
CONTRACT CAPTURE REQUIRED
```

Required proof:

```text
OpenAPI snapshot + typed fixture + API integration test
```

For SSE or private LightRAG-derived data, also require:

```text
real runtime contract fixture + browser parser test
```

## 7. Security/UI rule

Every screen must define:

```text
loading
empty
success
safe error
unauthenticated
forbidden
stale / conflict where applicable
```

Every admin mutation must:

```text
be backend authorized
be disabled while pending
render server-safe validation errors
refresh backend truth after success
use explicit destructive confirmation where needed
avoid optimistic deletion for asynchronous cleanup
```

## 8. Explicitly rejected patterns

```text
browser direct LightRAG/Docker/controller calls
browser-side provider/model/parser/retrieval selection
terminal/filesystem features
agent runtime controls
general/domainless chat
cross-domain retrieval
local semantic fallback
legacy bearer token storage
raw log/prompt/provider response viewers
generic operations/workflow backend
invented SSE progress/reconnect protocol
unproven source viewer, asset route, or source-path resolution
```
