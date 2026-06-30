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
