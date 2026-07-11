---
id: F-003
title: Knowledge Domains And Private Runtime Acceptance Evidence
status: implemented
owner: Context Engine delivery team
last_reviewed: 2026-07-06
depends_on: [F-002]
supersedes: []
---


# F-003 - Acceptance Evidence

Status: implemented.

| Criterion | Evidence | Result | Notes |
| --- | --- | --- | --- |
| AC-001 | `test_domain_create_validates_embedding_profile_and_returns_safe_dto` in `tests/test_domains.py`; `.\.venv\Scripts\python.exe -m pytest tests/test_domains.py -q`; `.\.venv\Scripts\python.exe -m pytest -q` | pass | Domain create requires `embeddingProfileId`, rejects unready embedding profiles, creates a stopped safe DTO, and profile patch/delete is blocked while referenced. |
| AC-002 | `test_start_creates_private_runtime_without_host_port_and_member_sees_available_only`, `test_production_runtime_controller_default_is_docker_boundary`, `test_docker_controller_delegates_to_private_command_boundary`, `test_live_ce_domain_controller_lifecycle`, and `test_slice_a_live_docker_controller_native_index_and_evidence`; `.\.venv\Scripts\python.exe -m pytest tests/test_domain_controller_integration.py -q --basetemp .pytest-tmp-domain-controller-integration`; `.\.venv\Scripts\python.exe -m pytest tests/test_slice_a_runtime_integration.py -q --basetemp .pytest-tmp-slice-a-live`; `.\.venv\Scripts\python.exe -m pytest -q --basetemp .pytest-tmp-full-final-5` | pass | Test fixtures still prove no-host-port local runtime records; Pre-P7 Slice A adds production-default `DockerDomainRuntimeController`, a real Docker CLI command boundary, and live Docker start/health/stop/delete proof. |
| AC-003 | `test_start_creates_private_runtime_without_host_port_and_member_sees_available_only` and `test_domain_admin_routes_forbid_members_but_member_available_list_is_allowed` in `tests/test_domains.py`; `.\.venv\Scripts\python.exe -m pytest tests/test_domains.py -q` | pass | Member `GET /domains` returns only running, healthy, no-active-operation domains and omits stopped/active-operation rows. |
| AC-004 | `test_delete_worker_removes_runtime_resources_and_slug_reuse_gets_fresh_fence` in `tests/test_domains.py`; `.\.venv\Scripts\python.exe -m pytest tests/test_domains.py -q` | pass | Delete is accepted as queued, worker removes the private runtime instance directory containing container/runtime DB/workspace/logs records, then hard-deletes the domain row and cascaded operations. |
| AC-005 | `test_delete_worker_removes_runtime_resources_and_slug_reuse_gets_fresh_fence` in `tests/test_domains.py`; `.\.venv\Scripts\python.exe -m pytest tests/test_domains.py -q` | pass | Recreating the same slug after worker completion succeeds with a new `runtime_instance_id`, `control_generation = 1`, and stale fence updates affect zero rows. |
| AC-006 | `test_api_layer_has_no_docker_socket_dependency`, `test_production_runtime_controller_default_is_docker_boundary`, `test_docker_controller_delegates_to_private_command_boundary`, `test_domain_runtime_controller_command_invokes_private_docker_lifecycle`, `test_live_ce_domain_controller_lifecycle`, and `test_slice_a_live_docker_controller_native_index_and_evidence`; `.\.venv\Scripts\python.exe -m pytest tests/test_domain_runtime_controller_command.py -q --basetemp .pytest-tmp-controller-command`; `.\.venv\Scripts\python.exe -m pytest -q --basetemp .pytest-tmp-full-final-5` | pass | API source contains no Docker/subprocess dependency; production settings resolve to `DockerDomainRuntimeController`; Docker access is delegated to `CE_DOMAIN_CONTROLLER_COMMAND`; the repo-owned command uses Docker with no host ports and keeps runtime/controller details out of API DTOs. |

## Completion Rule

Do not mark this feature implemented until every criterion has real command output, snapshot, screenshot, fixture, review note, or runbook evidence.


## Pre-Implementation Evidence

- `API-001` now defines P3 strict domain create, admin summary/detail/status/operations DTOs, member available-only list, and safe lifecycle error codes.
- `DATA-001` now defines `domains`, `domain_operations`, operation concurrency, computed availability, failure ownership, and delete/recreate fencing semantics.
- F-003 implementation acceptance is backed by automated local private-controller evidence plus a live Docker proof for the production command boundary.
- Pre-P7 Slice A update on 2026-07-06: `controller_from_settings()` now defaults to `DockerDomainRuntimeController`; `LocalDomainRuntimeController` remains available only through explicit test/settings injection.
- Pre-P7 Slice A live update on 2026-07-06: `context_engine.tools.domain_runtime_controller` and the compatibility wrapper `scripts/ce-domain-controller.py` provide the repo-owned Docker command for `CE_DOMAIN_CONTROLLER_COMMAND`; `.github/workflows/integration-docker.yml` runs the live Docker lifecycle gate in CI (`pytest -m integration_docker`); local elevated Docker proof passed with `test_live_ce_domain_controller_lifecycle` and `test_slice_a_live_docker_controller_native_index_and_evidence`.
