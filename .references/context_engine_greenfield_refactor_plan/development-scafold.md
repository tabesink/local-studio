# Context Engine — Validated Greenfield Development Scaffold

## Purpose

This is the base build map for a clean greenfield implementation of Context Engine.

It is intentionally high level. Each phase is a self-contained vertical slice with a clear outcome and test gate. Detailed architecture, APIs, schemas, storage layouts, and implementation tasks belong in separate phase leaf documents.

This scaffold is governed by the Context Engine ground truth. Reference architectures may inform implementation patterns, but cannot change the product boundary, ownership model, or operating constraints.

Read [`00-cross-phase-alignment.md`](00-cross-phase-alignment.md) with this scaffold. It resolves the known review tensions across parser snapshots, embedding immutability, asynchronous deletion, provider-secret delivery, conversation history, runtime limits, and launch readiness.

---

## Product and architecture guardrails

Context Engine is a small internal, shared-workspace knowledge system for approximately 5–10 concurrent users.

Authenticated users can query administrator-curated knowledge domains and receive:

* grounded synthesized answers;
* traceable source evidence;
* evidence-only output when retrieval succeeds but synthesis cannot safely complete.

### Core boundaries

* All authenticated users query the same trusted shared corpus.
* Administrators alone manage domains, documents, providers, parsers, model profiles, and operations.
* A Knowledge Domain is the primary boundary for retrieval, runtime isolation, and lifecycle.
* Each domain has one private LightRAG runtime and workspace.
* Context Engine owns authentication, authorization, source-document handling, parser normalization, evidence mapping, chat orchestration, and operations.
* LightRAG owns semantic retrieval, graph/vector retrieval, and post-handoff indexing behavior.
* Browser clients communicate only with the Context Engine application API.
* Browser clients never access Docker controls, LightRAG administration, workers, queues, storage paths, database credentials, or provider secrets.
* Context Engine is not a generic document-management system, tenant platform, autonomous agent system, or unrestricted assistant.

---

## Operating principles

### KISS — Keep It Simple

* Prefer one application API, one application database, one background-work path, and one private LightRAG runtime per domain.
* Prefer explicit state, direct control flow, and clear ownership.
* Add infrastructure only when a proven current requirement cannot be met otherwise.

### YAGNI — You Aren’t Gonna Need It

* Build the approved internal shared-workspace workflow only.
* Do not add agents, web browsing, multi-tenancy, local retrieval fallback, workflow engines, event buses, microservices, or automatic provider failover.
* Do not build extension frameworks for hypothetical future parsers, retrieval modes, or document workflows.

### DRY — Don’t Repeat Yourself

Each important concern has one canonical owner:

| Concern                                 | Canonical owner                          |
| --------------------------------------- | ---------------------------------------- |
| Identity and authorization              | Application API                          |
| Provider and model configuration        | Server-side configuration service        |
| Domain lifecycle                        | Domain lifecycle service                 |
| Source preparation                      | Document ingestion service               |
| Parser-normalized source representation | Context Engine canonical document model  |
| Semantic and graph retrieval            | LightRAG                                 |
| Retrieval eligibility                   | One server-side retrieval-scope resolver |
| Evidence mapping                        | One evidence resolver                    |
| Domain lifecycle work                   | `domain_operations`                      |
| Source preparation work                 | `source_preparation_operations`          |
| Source indexing eligibility             | `source_documents.index_state`           |
| Chat turns and history                  | `conversation_turns`                     |
| Security/admin audit                    | `audit_events`                           |

---

## Target operating model

```text
Browser
  → Context Engine application API
      → authentication and authorization
      → application database
      → source/artifact storage
      → background worker and queue
      → private domain lifecycle control
      → private LightRAG runtime per domain
      → configured model provider
```

The application API is the only browser-facing trust boundary.

---

# Resolved Cross-Phase Decisions

These decisions are canonical for the pilot build:

1. Do not build a generic workflow or operation model. Use resource-specific operation/state ownership.
2. Freeze only `parser_kind` on source upload; resolve current parser credentials privately on retry.
3. Select a domain embedding profile at domain creation and keep it immutable immediately.
4. Inject provider secrets into private LightRAG runtimes only through an API-to-controller typed contract proven by a pinned LightRAG fixture.
5. Return `202` for source/domain deletes that require remote or worker cleanup; the row disappears only after cleanup completes.
6. Keep user-owned conversation history, with required `turn.domain_id`, one active turn per conversation, and strict source/domain redaction.
7. Keep pilot chat RAG-only. General/domainless chat and non-grounded direct answers are deferred product decisions.
8. Add server-owned runtime, rate-limit, and admission caps before browser pilot; do not expose tuning sliders in the admin UI.
9. Treat P8 as the internal-pilot launch gate: observability, security checks, recovery proof, and lightweight load testing for 5-10 concurrent users.

---

# Phase 1 — Trusted Application Foundation

| Field                        | Scope                                                                                                                                                                             |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Vertical slice delivered** | Users can sign in to an empty application. Standard users and administrators receive correctly restricted access. Admin exists after `docker compose up` — no manual bootstrap. |
| **Core scope**               | Application shell; database foundation; username-based users and roles; seed admin from `.env` on API startup; secure HttpOnly session; server-side authorization; typed API error contract; local Docker development environment. |
| **Rules established**        | The browser talks only to the application API. Admin authorization is enforced server-side. Admin credentials come from `SEED_ADMIN_USERNAME` and `SEED_ADMIN_PASSWORD` in `.env`. No operator CLI. No secrets or infrastructure credentials enter browser state. |
| **Test gate**                | `docker compose up` → seed admin exists → admin login → authenticated request → member (test fixture) denied an admin route → admin allowed. |
| **Explicitly deferred**      | Operator CLI; user-management HTTP routes; domains, documents, LightRAG, background jobs, providers, chat, analytics, durable chat history. |

Detailed implementation: [`docs/ce-phase-1-trusted-application-foundation.md`](ce-phase-1-trusted-application-foundation.md).

---

# Phase 2 — Admin Configuration and Trusted Runtime Settings

| Field                        | Scope                                                                                                                                                                          |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Vertical slice delivered** | An administrator can configure the provider credentials and trusted settings required to create and operate domains.                                                           |
| **Core scope**               | Server-side provider secrets; global active synthesis profile; immutable domain embedding-profile choices; one active parser kind; trusted configuration resolution.            |
| **Rules established**        | The server resolves provider and model settings. Users cannot choose providers, models, prompts, embeddings, rerankers, or hidden retrieval controls through browser requests. |
| **Test gate**                | Admin saves configuration → standard user cannot read or modify it → application resolves only server-side settings.                                                           |
| **Explicitly deferred**      | Per-user profiles, provider failover, model experimentation UI, embedding migration workflows, parser plugin frameworks.                                                       |

---

# Phase 3 — Knowledge Domains and Private Runtime Lifecycle

| Field                        | Scope                                                                                                                                                                  |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Vertical slice delivered** | An administrator can create, start, stop, view, and delete empty knowledge domains. Users see only domains that are available for use.                                 |
| **Core scope**               | Domain registry; lifecycle states; private runtime/workspace per domain; server-mediated lifecycle control; domain health/status contract; lifecycle audit visibility. |
| **Rules established**        | Domain lifecycle is limited to create, start, stop, delete, and health/status. Lifecycle controls remain private behind the application API.                           |
| **Test gate**                | Admin creates a domain -> starts it -> application API reports status -> user sees it when available -> admin stops it -> admin requests delete and receives `202` -> cleanup completes -> subsequent GET returns `404`. |
| **Explicitly deferred**      | Document upload, semantic retrieval, browser-direct runtime access, repair/recreate/regenerate actions, container orchestration platforms.                             |

---

# Phase 4 — Source Documents and Canonical Preparation

| Field                        | Scope                                                                                                                                                                                                                              |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Vertical slice delivered** | An administrator can upload source documents, monitor preparation, reopen visible progress, inspect safe source structure, and retry, cancel, or delete local preparation work.                                                    |
| **Core scope**               | Original-file retention; document metadata; frozen `parser_kind`; background preparation; parser normalization; source provenance; safe derived artifacts; local preparation lifecycle and cleanup.                                  |
| **Rules established**        | Docling and Reducto may have different native outputs, but both normalize into one Context Engine document model. Parser-specific output does not leak into the browser, LightRAG contract, retrieval logic, or evidence contract. |
| **Test gate**                | Documents prepared through each supported parser produce the same downstream Context Engine representation; failed preparation can retry without duplicate records or orphan artifacts.                                            |
| **Explicitly deferred**      | Semantic retrieval, chat, generic document-management workflows, collaboration, folders, annotations, user-facing version history, parser-specific UI behavior.                                                                    |

### Phase 4 high-level objective

Create one trusted source-preparation boundary:

```text
source document
→ selected parser
→ Context Engine canonical document model
→ source-aware content and metadata
→ later LightRAG handoff
→ later evidence mapping
```

The detailed Phase 4 plan will define the exact canonical model, storage approach, parser adapter behavior, and document-cardinality policy.

---

# Phase 5 — Private LightRAG Indexing and Query Eligibility

| Field                        | Scope                                                                                                                                                                                                                                                                 |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Vertical slice delivered** | Prepared documents are handed to the correct private LightRAG domain runtime and become eligible for retrieval once LightRAG reports readiness.                                                                                                                       |
| **Core scope**               | Private Context Engine-to-LightRAG handoff; typed provider-secret delivery through the private controller; stable source identity; domain-scoped ingestion coordination; accepted-handoff tracking; native LightRAG readiness checks; correct retry, cancel, and deletion routing; immediate immutable domain embedding profile. |
| **Rules established**        | LightRAG is the only semantic and graph retrieval engine. Context Engine does not create local embeddings, vectors, graph entities, semantic fallback, mutable embedding migrations, or a duplicate LightRAG status database.                                           |
| **Test gate**                | Pinned LightRAG fixture proves secret injection, handoff, readiness, idempotent retry, precise delete, and delayed-ready fencing. Prepared document -> LightRAG handoff -> ready state -> repeat handoff does not duplicate indexed content -> deleted content cannot later become ready. |
| **Explicitly deferred**      | Second vector database, BM25/local fallback retrieval, custom graph processing, status-mirroring tables, automatic repair actions.                                                                                                                                    |

---

# Phase 6 — Scoped Evidence Retrieval

| Field                        | Scope                                                                                                                                                                           |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Vertical slice delivered** | Users can query an active domain and receive traceable evidence before answer synthesis is introduced.                                                                          |
| **Core scope**               | Server-side retrieval scope; domain/document eligibility; LightRAG retrieval adapter; evidence mapping.                                                                           |
| **Rules established**        | A retrieval result is user-visible, citable, and eligible for synthesis only when Context Engine can map it to authorized source provenance.                                    |
| **Test gate**                | User queries an active domain → receives mapped evidence cards. Deleted, failed, inactive, unmapped, or cross-domain results cannot be retrieved or cited.                      |
| **Explicitly deferred**      | LLM synthesis, source navigation and source-view opening, user-configurable retrieval controls, cross-domain retrieval, saved searches, recommendations, local fallback search. |

### Evidence rule

```text
Mapped retrieval result
→ evidence card
→ eligible synthesis context
→ valid citation

Unmapped or ineligible result
→ discarded
→ not shown
→ not cited
→ not supplied to synthesis
```

---

# Phase 7 — Grounded Streaming Chat and Evidence-Only Fallback

| Field                        | Scope                                                                                                                                                                                               |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Vertical slice delivered** | Users can create owned conversations, select an available domain per turn, ask grounded questions, and receive mapped evidence with a streamed answer or evidence-only/no-context fallback.          |
| **Core scope**               | Conversation and turn persistence; required domain-per-turn; one running turn per conversation; server-resolved active synthesis profile; bounded prior user-question continuity; bounded evidence-to-context assembly; SSE streaming; one bounded synthesis retry; typed failure states; strict redaction on source/domain delete. |
| **Rules established**        | Pilot chat is RAG-only. Generated text is not evidence. Chat synthesizes only from current-turn mapped evidence. The browser cannot override provider, model, prompt, reranker, top-k, retrieval scope, route, or query flow. |
| **Test gate**                | User asks a question in an owned conversation -> current domain evidence is retrieved -> answer streams with citations. No mapped evidence after retrieval returns no-grounded-context. Simulated provider failure after retrieval returns evidence-only output. Source/domain delete redacts derived answers while preserving user questions. |
| **Explicitly deferred**      | General/domainless chat, direct non-grounded answers, agents, tools, web browsing, user-selected models, collaborative/team chat history, automatic provider switching, background synthesis retries. |

---

# Phase 8 — Safe Operations and Internal-Pilot Release

| Field                        | Scope                                                                                                                                                                                                                                      |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Vertical slice delivered** | Administrators can safely operate, diagnose, delete, and recover domains and source documents. The system is ready for a controlled internal pilot.                                                                                        |
| **Core scope**               | Security/admin audit records; safe structured logs; runtime status; deletion fencing; cross-system cleanup; stale-job and orphan-artifact reconciliation; optional metadata-only Langfuse traces; backup/restore procedure; regression suite; lightweight load/security launch gate; release checklist. |
| **Rules established**        | Destructive operations are ordered, retryable, and auditable. A deleted or fenced document/domain cannot return to retrieval eligibility because of delayed worker or LightRAG status results.                                             |
| **Test gate**                | Interrupt preparation, indexing, or deletion -> restart -> reconciliation identifies incomplete work -> admin safely completes or retries cleanup. Fresh deployment -> domain -> document -> index -> evidence -> chat -> deletion -> restore. Expected-load test for 5-10 concurrent users completes within agreed pilot thresholds. |
| **Explicitly deferred**      | Heavy observability platforms, distributed tracing infrastructure, self-healing automation, Kubernetes, multi-region deployment, high-availability worker fleets, 50-user scale promise.                                                   |

---

# Cross-Phase Validation Requirements

The complete greenfield build is valid only when these end-to-end behaviors are proven:

1. Authenticated users can query only available shared domains.
2. Standard users cannot invoke admin write, configuration, lifecycle, or operational actions.
3. Browser input cannot override trusted provider, model, prompt, or retrieval settings.
4. Documents remain unqueryable until ready in an available domain.
5. Parser choice does not alter the downstream canonical document, LightRAG, evidence, or browser contracts.
6. Retrieval evidence maps to traceable, authorized evidence cards with valid citation metadata.
7. Unmapped, deleted, failed, stale, or cross-domain content cannot be cited or passed to synthesis.
8. Retrieval success plus synthesis failure produces evidence-only output.
9. Retry, cancellation, restart, and deletion do not create duplicate indexing, stale retrieval content, or orphan artifacts.
10. Provider credentials and infrastructure details never appear in browser payloads, ordinary logs, or user-safe errors.
11. Concurrent chat and ingestion across 5-10 users does not allow one domain's work to corrupt another domain.
12. Fresh deployment, migration, backup, restore, and rollback procedures are documented and tested.
13. Cookie-authenticated browser writes are protected by same-origin/CSRF policy before separate-origin browser rollout.
14. Login, admin write, upload/retry, retrieval/chat, and per-domain query paths have server-owned rate/admission limits before internal pilot.
15. Expected-load, dependency-failure, and recovery tests are run before pilot launch, with thresholds calibrated to actual hardware and provider limits.

---

# Explicit Deferrals

Do not introduce these before the core internal-pilot system is stable:

* autonomous agents, tools, and web browsing;
* local semantic retrieval fallback;
* second vector, graph, or retrieval systems;
* tenant, organization, private-workspace, or ACL platforms;
* generic document-management features;
* browser-configurable provider or retrieval controls;
* parser marketplaces or broad plugin systems;
* automatic provider failover;
* event buses, workflow engines, premature microservices, or Kubernetes;
* general/domainless chat and non-grounded direct answers;
* durable collaborative/team chat-history products;
* source navigation, source-view opening, and in-browser source-location browsing;
* broad analytics or heavyweight observability platforms.

---

# Use of This Scaffold

Each detailed phase plan must:

1. Preserve all preceding phase contracts.
2. State the canonical owner for new state and rules.
3. Define only the implementation required by that phase.
4. Include a focused test plan covering success, failure, retry, cancellation, authorization, and cleanup behavior relevant to the slice.
5. Explicitly list what remains deferred.
6. Reject reference-architecture patterns that increase entropy without improving the current Context Engine workflow.
