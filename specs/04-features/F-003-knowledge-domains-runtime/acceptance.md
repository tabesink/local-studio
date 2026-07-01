---
id: F-003
title: Knowledge Domains And Private Runtime Acceptance Evidence
status: implemented
owner: Context Engine delivery team
last_reviewed: 2026-06-30
depends_on: [F-002]
supersedes: []
---


# F-003 - Acceptance Evidence

Status: implemented.

| Criterion | Evidence | Result | Notes |
| --- | --- | --- | --- |
| AC-001 | `test_domain_create_validates_embedding_profile_and_returns_safe_dto` in `tests/test_domains.py`; `.\.venv\Scripts\python.exe -m pytest tests/test_domains.py -q`; `.\.venv\Scripts\python.exe -m pytest -q` | pass | Domain create requires `embeddingProfileId`, rejects unready embedding profiles, creates a stopped safe DTO, and profile patch/delete is blocked while referenced. |
| AC-002 | `test_start_creates_private_runtime_without_host_port_and_member_sees_available_only` in `tests/test_domains.py`; `.\.venv\Scripts\python.exe -m pytest tests/test_domains.py -q` | pass | Start creates a private runtime record through `LocalDomainRuntimeController`; automated proof inspects the private controller record and verifies `hostPorts: []`. |
| AC-003 | `test_start_creates_private_runtime_without_host_port_and_member_sees_available_only` and `test_domain_admin_routes_forbid_members_but_member_available_list_is_allowed` in `tests/test_domains.py`; `.\.venv\Scripts\python.exe -m pytest tests/test_domains.py -q` | pass | Member `GET /domains` returns only running, healthy, no-active-operation domains and omits stopped/active-operation rows. |
| AC-004 | `test_delete_worker_removes_runtime_resources_and_slug_reuse_gets_fresh_fence` in `tests/test_domains.py`; `.\.venv\Scripts\python.exe -m pytest tests/test_domains.py -q` | pass | Delete is accepted as queued, worker removes the private runtime instance directory containing container/runtime DB/workspace/logs records, then hard-deletes the domain row and cascaded operations. |
| AC-005 | `test_delete_worker_removes_runtime_resources_and_slug_reuse_gets_fresh_fence` in `tests/test_domains.py`; `.\.venv\Scripts\python.exe -m pytest tests/test_domains.py -q` | pass | Recreating the same slug after worker completion succeeds with a new `runtime_instance_id`, `control_generation = 1`, and stale fence updates affect zero rows. |
| AC-006 | `test_api_layer_has_no_docker_socket_dependency` in `tests/test_domains.py`; `.\.venv\Scripts\python.exe -m pytest tests/test_domains.py -q`; `.\.venv\Scripts\python.exe -m alembic upgrade head --sql` | pass | API source contains no Docker/subprocess dependency; private controller exposes `uses_docker_socket = False` for the automated P3 proof and API DTOs never return runtime/controller fields. |

## Completion Rule

Do not mark this feature implemented until every criterion has real command output, snapshot, screenshot, fixture, review note, or runbook evidence.


## Pre-Implementation Evidence

- `API-001` now defines P3 strict domain create, admin summary/detail/status/operations DTOs, member available-only list, and safe lifecycle error codes.
- `DATA-001` now defines `domains`, `domain_operations`, operation concurrency, computed availability, failure ownership, and delete/recreate fencing semantics.
- F-003 implementation acceptance is backed by automated local private-controller evidence. A live Docker-host fixture was not run in this workspace; the implementation keeps Docker access out of the API and proves the private controller command/record shape without host ports.
