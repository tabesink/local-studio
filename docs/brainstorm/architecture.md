# Architecture

Context Engine is a trusted, small-team RAG system for 5-10 authenticated users. The system exposes one Context Engine API to the browser. The browser never talks to Docker, LightRAG, provider APIs, runtime ports, storage paths, or the private domain controller.

## System Shape

```text
Browser
  -> TLS ingress
  -> Context Engine API
     -> PostgreSQL
     -> private source storage
     -> one source worker
     -> private domain controller
     -> one private LightRAG runtime per running domain
     -> synthesis provider
Optional metadata-only tracing <- Context Engine
```

The target runtime is a modular monolith plus two narrow companion processes:

- API process: auth, authorization, request validation, routes, services, error handling, public API contracts.
- Worker process: source preparation, LightRAG indexing, readiness sweep, remote cleanup, delete completion.
- Domain controller: the only process with Docker socket and runtime storage privileges.

## Layering

Use these boundaries unless an ADR changes them:

| Layer | Owns | Must Not Own |
|---|---|---|
| API / presentation | routes, request parsing, response DTOs, status-code translation | business rules, SQL, provider calls, Docker calls |
| Application services | use-case orchestration, transactions, authorization-adjacent checks | framework-specific response logic |
| Domain | state machines, policies, validations independent of vendors/frameworks | FastAPI, SQLAlchemy sessions, SDK models |
| Infrastructure | repositories, migrations, storage, controller client, LightRAG client, provider adapters | user-facing decisions |
| Cross-cutting | config, request IDs, logging, metrics, tracing, auth dependencies, centralized errors | duplicated per-route handling |

Dependencies point inward: `API -> Application -> Domain`; infrastructure adapts external systems to application contracts.

## Composition Root

The runtime entrypoint, expected to be `backend/app/main.py`, is the composition root. It should be the one obvious place that:

- loads typed configuration;
- validates startup invariants;
- creates shared DB/session infrastructure;
- configures request IDs, structured logging, error handlers, and middleware;
- wires auth dependencies and routes;
- installs provider/controller/LightRAG clients behind services;
- starts the application.

Do not scatter runtime setup, provider setup, logging setup, auth initialization, or dependency wiring across route modules.

## Canonical Ownership

| Concern | Owner | Never Duplicate Into |
|---|---|---|
| Identity, roles, sessions | Context Engine DB/API | LightRAG, browser token storage |
| Provider secrets | encrypted Context Engine config | runtime files, domain env files, manifests, browser |
| Domain lifecycle | `domains` row plus private controller | browser, LightRAG status, generated files |
| Runtime health | live bounded controller check | durable mirror table |
| Original files, prepared blocks, images | Context Engine storage plus DB | LightRAG |
| Embeddings, graph, semantic retrieval | LightRAG | local CE vector store |
| Query eligibility and citations | Context Engine API | browser, LightRAG |
| Source work progress | source row plus source operation row | generic jobs table |
| Conversation lifecycle and redaction | chat service plus conversation tables | event bus, citation history table |

## State Machines

Persist only the two canonical lifecycle axes.

Domain state:

```text
stopped
running
deleting
```

Compute health and availability. Do not persist `healthy`, `starting`, `failed`, `ready`, `available`, or runtime URL status.

Source state and index state:

```text
source.state: pending -> prepared -> deleting -> row gone

prepared source index_state:
not_requested -> queued -> submitting -> accepted -> ready
any active index path -> cancelling -> cancelled
failure -> failed on index fields, not source.state
```

Preparation failure leaves `source.state = pending` and records failure on the preparation operation. Index failure leaves `source.state = prepared` and records failure on index fields.

## Domain Controller Boundary

The API process must not mount or access the Docker socket. The private domain controller is the only Docker-privileged process and exposes only fixed internal actions:

```text
provision
start
stop
remove
inspect
```

The controller rejects arbitrary images, commands, mounts, networks, ports, environment maps, shell commands, database names, and URLs. Runtime containers have no published host ports.

## Routes By Phase

P1:

- `GET /health/live`
- `GET /health/ready`
- `POST /api/v1/auth/login`
- `GET /api/v1/auth/me`
- `POST /api/v1/auth/logout`
- `GET /api/v1/admin/users`

P2:

- `/api/v1/admin/runtime-settings`
- `/api/v1/admin/runtime-settings/providers/{provider_kind}`
- `/api/v1/admin/runtime-settings/model-profiles`

P3:

- `/api/v1/admin/domains`
- `/api/v1/admin/domains/{id}`
- `/api/v1/admin/domains/{id}/status`
- `/api/v1/admin/domains/{id}/start`
- `/api/v1/admin/domains/{id}/stop`
- `/api/v1/admin/domains/{id}/operations`
- `/api/v1/domains`

P4-P5:

- `/api/v1/admin/domains/{id}/sources`
- `/api/v1/admin/domains/{id}/sources/{source_id}`
- `/api/v1/admin/domains/{id}/sources/{source_id}/outline`
- `/api/v1/admin/domains/{id}/sources/{source_id}/operations`
- `/api/v1/admin/domains/{id}/sources/{source_id}/retry`
- `/api/v1/admin/domains/{id}/sources/{source_id}/cancel`
- `/api/v1/admin/domains/{id}/sources/{source_id}/index/retry`
- `/api/v1/admin/domains/{id}/sources/{source_id}/index/cancel`

P6:

- `POST /api/v1/domains/{domain_id}/evidence`
- `GET /api/v1/source-views/{source_ref}`
- `GET /api/v1/source-assets/{asset_ref}`

P7:

- `POST /api/v1/conversations`
- `GET /api/v1/conversations`
- `GET /api/v1/conversations/{id}`
- `POST /api/v1/conversations/{id}/turns`
- `DELETE /api/v1/conversations/{id}`

## Security Invariants

- Authentication is an opaque random HttpOnly cookie session. Store only token hashes.
- Authorization is server-side. Browser roles, user IDs, source IDs, model choices, and retrieval settings are not trusted.
- Provider credentials are encrypted at rest and decrypted only by private resolver paths.
- Runtime secret injection happens only at runtime process start through typed closed config, never through persisted env files.
- All writes use owner/admin checks once ownership exists.
- All hard deletes verify owned artifacts are removed before deleting the durable row that anchors retries.
- Error responses use the canonical envelope and never expose stack traces, SQL, paths, provider errors, Docker output, raw LightRAG payloads, prompts, answers, or secrets.

## Explicit Non-Goals

Do not add Redis, Celery/RQ, generic workflow engines, local vector stores, second retrieval stacks, cross-domain retrieval, Kubernetes, provider failover, agent frameworks, multi-region deployment, browser retrieval controls, direct LightRAG access, or runtime log UI unless a future ADR and task acceptance criteria require them.

