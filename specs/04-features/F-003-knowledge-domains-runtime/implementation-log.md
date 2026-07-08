---
id: F-003
title: Knowledge Domains And Private Runtime Implementation Log
status: implemented
owner: Context Engine delivery team
last_reviewed: 2026-07-06
depends_on: [F-002]
supersedes: []
---


# F-003 - Implementation Log

Status: implemented.

## Decisions And Deviations

| Date | Decision/deviation | Reason | Follow-up |
| --- | --- | --- | --- |
| 2026-06-30 | Initial spec imported from Context Engine fullstack phase plan. | Prepare agent/junior-dev build path. | Implement phase tasks in order. |
| 2026-06-30 | Adopted resolved ID-A pre-P3 decisions into F-003, API-001, and DATA-001 before implementation. | Removes contract gaps for domain slug identity, embedding FK storage, domain operations, availability, member filtering, failure state ownership, and ID reuse fencing. | Controller protocol/storage/Docker fixture decisions still gate T-030/T-040 implementation. |
| 2026-06-30 | Implemented `domains` and `domain_operations` schema, models, admin/member domain routes, lifecycle services, private controller boundary, and delete worker. | Completes the P3 vertical slice over the existing P1/P2 FastAPI/runtime config foundation. | None for automated P3 acceptance. |
| 2026-06-30 | Enabled SQLite foreign-key enforcement and flushed seeded provider rows before model catalog rows. | P3 relies on `ON DELETE CASCADE` for domain operations and real model-profile FKs; enforcing SQLite FKs exposed a P2 seed ordering bug. | None. |
| 2026-06-30 | Used `LocalDomainRuntimeController` as the private controller boundary for automated P3 evidence. | The workspace does not provide a live Docker-host fixture, while QA-001 allows controller boundary fakes for integration tests; the implementation proves no API Docker socket and no host ports in the private runtime record. | Run a target-infra Docker fixture before replacing or extending the controller adapter for deployment. |
| 2026-06-30 | Updated API-001 with P3 lifecycle success bodies and refreshed `tests/snapshots/f003_openapi.json`. | Start/stop/delete response shapes are public API behavior and must not drift silently. | None. |
| 2026-07-06 | Pre-P7 Slice A changed production runtime wiring from the local controller default to `DockerDomainRuntimeController`, with `LocalDomainRuntimeController` retained for explicit test injection. | LD-002 requires Docker-backed domain runtime control before F-007 chat code ships, and the API process must not own Docker/socket access. | Use `CE_DOMAIN_CONTROLLER_COMMAND=python -m context_engine.tools.domain_runtime_controller` or an equivalent private Docker command. |
| 2026-07-06 | Added `context_engine.tools.domain_runtime_controller`, compatibility wrapper `scripts/ce-domain-controller.py`, and `.github/workflows/slice-a-runtime.yml` as the Slice A CI gate. | LD-005 requires live Docker proof before F-007 starts; subprocess fakes are not enough for the locked plan. | Remote GitHub Actions still needs to run on PR/push, but the local elevated Docker proof passed in this workspace. |

## Drift Register

No public API, data, SSE, or AI contract drift recorded. P3 API lifecycle response shapes were added to API-001 before claiming completion.

## Verification

| Date | Command | Result | Notes |
| --- | --- | --- | --- |
| 2026-06-30 | `.\.venv\Scripts\python.exe -m pytest tests/test_domains.py -q` | pass | 7 P3 tests pass; one Starlette/httpx deprecation warning from dependencies. |
| 2026-06-30 | `.\.venv\Scripts\python.exe -m pytest -q` | pass | 24 full-suite tests pass; one Starlette/httpx deprecation warning from dependencies. |
| 2026-06-30 | `.\.venv\Scripts\python.exe -m alembic upgrade head --sql` | pass | SQL output includes `domains`, `domain_operations`, slug/state checks, FK indexes, and active-operation partial unique index. |
| 2026-07-06 | `.\.venv\Scripts\python.exe -m pytest tests/test_domains.py::test_api_layer_has_no_docker_socket_dependency tests/test_domains.py::test_production_runtime_controller_default_is_docker_boundary tests/test_domains.py::test_docker_controller_delegates_to_private_command_boundary -q --basetemp .pytest-tmp-domain-boundary-final-2` | pass | 3 controller-boundary tests pass; production settings resolve to Docker controller, API has no Docker/subprocess dependency, and the private command boundary covers provision/start/health/stop/delete. |
| 2026-07-06 | `.\.venv\Scripts\python.exe -m pytest tests/test_domain_runtime_controller_command.py -q --basetemp .pytest-tmp-controller-command` | pass | 2 command tests pass; the Docker command rejects unsafe runtime dirs and invokes Docker lifecycle without publishing host ports. |
| 2026-07-06 | `.\.venv\Scripts\python.exe -m pytest tests/test_domain_controller_integration.py -q --basetemp .pytest-tmp-domain-controller-integration` | pass | 1 live Docker controller lifecycle test passes through the `scripts/ce-domain-controller.py` compatibility wrapper. |
| 2026-07-06 | `.\.venv\Scripts\python.exe -m pytest tests/test_slice_a_runtime_integration.py -q --basetemp .pytest-tmp-slice-a-live` | pass | 1 live Docker/native gate passes locally with Docker daemon access: domain create/start/health, native index, evidence endpoint, stop, and delete worker cleanup. |
| 2026-07-06 | `.\.venv\Scripts\python.exe -m pytest -q --basetemp .pytest-tmp-full-final-5` | pass | 60 full-suite tests pass, including both live Docker Slice A gates; one Starlette/httpx deprecation warning from dependencies. |

## Target-Infra Controller Runbook

Set `CE_DOMAIN_RUNTIME_CONTROLLER_KIND=docker` and `CE_DOMAIN_CONTROLLER_COMMAND=python -m context_engine.tools.domain_runtime_controller` or `CE_DOMAIN_CONTROLLER_COMMAND=python scripts/ce-domain-controller.py`. Context Engine passes the lifecycle action as argv[1] and a JSON payload on stdin containing `action`, `domainId`, `runtimeInstanceId`, `runtimeName`, and `runtimeDir`. The command must return `0` for successful `provision`, `start`, `stop`, and `delete`; `health` must print `{"healthy": true}` only when the private per-domain runtime is ready. The repo-owned command uses `CE_DOMAIN_CONTROLLER_IMAGE` or `alpine:3.20`, runs with Docker `--network none`, publishes no host ports, validates the runtime directory fence, and removes the per-domain container/runtime directory on delete. Native LightRAG runs in-process under `{runtimeDir}/lightrag/`. CI runs `tests/test_slice_a_runtime_integration.py` and the full suite from `.github/workflows/slice-a-runtime.yml`. The command must not expose runtime URLs, paths, container ids, provider payloads, stack traces, or secrets to public API responses or logs.
