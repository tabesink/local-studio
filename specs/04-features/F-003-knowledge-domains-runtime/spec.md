---
id: F-003
title: Knowledge Domains And Private Runtime Specification
status: approved
owner: Context Engine delivery team
last_reviewed: 2026-06-30
depends_on: [F-002]
supersedes: []
---


# F-003 - Knowledge Domains And Private Runtime

Phase: P3

## Outcome

Allow Administrators to create, start, stop, inspect, and hard-delete empty Knowledge Domains backed by isolated private LightRAG runtimes.

## Why Now

All Source Documents, retrieval, and chat are scoped to Knowledge Domains and private runtime availability.

## Actors

Administrators, Members listing available domains, worker, private controller.

## In Scope

- `domains` and `domain_operations`.
- Admin-chosen slug domain id with hard-delete reuse after cleanup.
- Required immutable `embedding_profile_id` FK to an embedding model profile.
- One active domain lifecycle operation per domain; second lifecycle request fails fast with `domain_operation_in_progress`.
- `runtime_instance_id` private identity and `control_generation` fencing.
- Private domain controller with Docker socket and internal token-auth routes.
- Deterministic runtime naming policy.
- Private workspace/log/runtime DB per domain instance.
- Member available-domain list.
- One worker path for async domain delete completion.

## Out Of Scope

- browser UI
- documents/source prep/indexing
- provider calls
- runtime URL in DB/API
- runtime manifest/env/Compose
- archive/restore
- generic operation framework
- API Docker socket
- public runtime port

## Functional Requirements

| ID | Requirement | Source |
| --- | --- | --- |
| FR-001 | Domain state persists only `stopped`, `running`, or `deleting`. | DATA-001 |
| FR-002 | Availability is computed from running state, no active operation, and fresh private health. | PROD-003 |
| FR-003 | Admin DTOs never expose runtime instance ID, controller payload, container ID, runtime URL, path, DB name, or provider config. | API-001 |
| FR-004 | DELETE fences domain as deleting and worker removes runtime resources before row removal. | DATA-001 |
| FR-005 | Domain id is a slug and is reusable only after hard delete completes with fresh private runtime identity. | API-001, DATA-001 |
| FR-006 | Domain availability is computed from running state, no active operation, and private health; member `GET /domains` returns available rows only. | API-001, PROD-003 |
| FR-007 | Failure details live on `domain_operations`, never as extra domain states or domain error columns. | DATA-001, QA-002 |

## Contracts And Data

- Contracts: API-001, DATA-001, QA-004
- Data: `domains`, `domain_operations`; runtime private identity hidden from API DTOs.

## Acceptance Criteria

- AC-001: domain create validates embedding profile
- AC-002: start creates private runtime with no host port
- AC-003: member sees only available domains
- AC-004: delete removes container/runtime DB/workspace/logs/domain row
- AC-005: same public ID reusable only after delete complete
- AC-006: API has no Docker socket

## Open Decisions

No open product decisions are allowed before implementation starts. If a backend/runtime/frontend contract is unknown, create a fixture-capture task and keep the feature blocked until evidence exists.


## Resolved Pre-P3 Decisions

The ID-A pre-P3 review decisions are adopted into API-001 and DATA-001:

- `domains.id` is a public slug matching `^[a-z0-9][a-z0-9_-]{1,62}$`, not a UUID.
- `domains.embedding_profile_id` is required and immutable after create. Domain create validates it through `TrustedRuntimeResolver.resolve_embedding_profile`.
- `domains.state` remains only `stopped`, `running`, or `deleting`. Runtime/health/failure details are not persisted on the domain row.
- `domain_operations` is a dedicated typed table for create/start/stop/delete lifecycle history; it is not a generic jobs table.
- At most one queued/running domain operation may exist per domain. Additional lifecycle requests return `409 domain_operation_in_progress`; no FIFO queue is implied.
- Delete is asynchronous with worker lease fields on the delete operation row only. Create/start/stop complete in the API request.
- `available` is computed at read time and never stored. Member `GET /domains` omits unavailable rows.
- Hard delete removes the domain row and cascades operations. Recreating the same slug creates a fresh `runtime_instance_id` with `control_generation = 1`.
