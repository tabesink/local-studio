---
id: F-008
title: Observability And Pilot Gate Test Plan
status: approved
owner: Context Engine delivery team
last_reviewed: 2026-07-06
depends_on: [F-007]
supersedes: []
---


# F-008 - Test Plan

## Required Evidence

| Acceptance | Test type | Scenario |
| --- | --- | --- |
| AC-001 | automated or explicit manual | compile/lint checks and documented no-typechecker limitation |
| AC-002 | automated or explicit manual | unit/integration/migration/OpenAPI tests, including audit schema, operation request ids, and private chat trace ids |
| AC-003 | automated or explicit manual | secret scan |
| AC-004 | automated or explicit manual | compose smoke |
| AC-005 | automated or explicit manual | SSE end-to-end |
| AC-006 | automated or explicit manual | full pilot flow |
| AC-007 | automated or explicit manual | 5-10 concurrent user load test |
| AC-008 | automated or explicit manual | provider timeout/worker unavailable/DB unavailable/invalid upload tests |

## Regression Checks

- API errors use the canonical safe envelope.
- Authz failures return 401/403 behavior defined by API-001 and PROD-004.
- Safe DTO/log snapshots do not contain forbidden data.
- Migrations, OpenAPI snapshots, SSE fixtures, and visual screenshots are updated when affected.
- P7 SSE transcripts and idempotent replay behavior do not change when request/log/trace context is enabled.
- New chat turn execution creates a private `trace_id`; replay reuses the persisted trace id and does not expose it in API/SSE payloads.
- Domain and source-preparation operations persist the originating API `request_id`; worker logs use that value plus `operation_id`.
- Source-index log/audit correlation uses existing `source_documents.index_request_id` plus Source Document id.
- Audit coverage includes the full P8 `AuditEventName` set and same-transaction rollback behavior.
- Audit read tests prove `audit_events.read` is written and default list behavior handles self-read rows per API-001.
- JSON log snapshots exist for HTTP, worker, audit failure, turn milestone, and replay paths.
- Turn milestone logs include ids/status/counters only, never message text, prompts, answers, evidence excerpts, or raw LightRAG/provider payloads.
- Optional tracing imports are isolated to the tracing wrapper module.
- Diagnostics redaction tests use synthetic sentinel strings only.
- Optional LightRAG runtime log tail tests, when implemented, prove domain scoping, line/body bounds, redaction, and audited reads.
- Native LightRAG lifecycle guard tests prove concurrent calls through separate `LightRAGClient` instances serialize the native lifecycle region process-wide.
- Per-domain native lifecycle locking is not an approved optimization until a later concurrency proof against `vendor/lightrag/1.4.16` shows different Knowledge Domains can safely run native LightRAG work concurrently.
- Audit write failure rolls back protected admin/security mutations.

## Named Commands And Artifacts

Compile:

```text
python -m compileall context_engine tests
```

Lint:

```text
python -m ruff check context_engine tests
```

`ruff` is listed in `pyproject.toml` test extras for P8.

Static type checking is not configured for this repo in P8. AC-001 is satisfied by compile plus lint evidence with this documented no-typechecker limitation; adding mypy/pyright is deferred until a later tooling task rather than blocking P8.

OpenAPI snapshot:

```text
tests/snapshots/f008_openapi.json
```

Secret/safety scan:

```text
python scripts/secret_scan.py
```

P8 adds this script for generated public artifacts and must keep AC-003 blocked if the scan cannot run.

Pilot flow evidence:

```text
python scripts/pilot_flow.py
```

The pilot flow helper uses a migrated temp database, local runtime boundary, local LightRAG client, and deterministic provider adapter path to prove auth -> domain -> upload -> prepare -> index -> evidence -> chat -> source delete/redaction -> domain delete.

Expected-load gate:

```text
10 concurrent authenticated users
```

Use deterministic fakes where provider/runtime quotas would make the test flaky, and record any pilot-like manual run separately.

Docker controller gate:

```text
python -m pytest -m integration_docker -q --basetemp .pytest-tmp-integration-docker
```

This is the named live Docker boundary command used by `.github/workflows/integration-docker.yml`. It is not a full compose smoke substitute.

Native LightRAG lifecycle guard:

```text
python -m pytest tests/test_lightrag_indexing.py::test_native_lightrag_client_uses_global_lifecycle_guard -q
```

Compose smoke:

```text
python scripts/compose_smoke.py
```

This is the approved P8 local compose-replacement smoke until a deployment compose fixture exists. It proves API live/ready, database connectivity, local runtime boundary, worker-unavailable no-partial-success behavior, worker processing, evidence retrieval, diagnostics redaction, and no browser-visible private runtime target. Deployment-specific compose remains a later environment artifact.

Failure fixtures:

- provider timeout -> safe provider/turn error, no raw payload;
- worker unavailable -> safe health/readiness or operation failure evidence;
- DB unavailable -> readiness fails safely, no partial success claim;
- invalid upload -> `source_file_unsupported` or `source_file_too_large`;
- diagnostics/log tail unavailable -> `diagnostics_unavailable` when diagnostics is implemented;
- tracing outage -> ignored and core behavior continues.

Safety scan scope:

- audit API responses;
- log snapshot fixtures;
- tracing test payloads;
- diagnostics responses;
- optional LightRAG runtime log/tail fixtures;
- OpenAPI examples;
- acceptance evidence artifacts.

## Blocked Evidence

If any test cannot be run, mark the feature blocked in `acceptance.md` with the missing dependency and owner.
