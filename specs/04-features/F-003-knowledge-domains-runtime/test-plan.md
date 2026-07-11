---
id: F-003
title: Knowledge Domains And Private Runtime Test Plan
status: approved
owner: Context Engine delivery team
last_reviewed: 2026-06-30
depends_on: [F-002]
supersedes: []
---


# F-003 - Test Plan

## Required Evidence

| Acceptance | Test type | Scenario |
| --- | --- | --- |
| AC-001 | automated or explicit manual | domain create requires `embeddingProfileId`, rejects missing/wrong/unready embedding profile, and stores immutable FK |
| AC-002 | automated or explicit manual | start creates private runtime with no host port |
| AC-003 | automated or explicit manual | member sees only available domains; stopped/deleting/unhealthy/active-operation rows are omitted |
| AC-004 | automated or explicit manual | delete removes container/runtime DB/workspace/logs/domain row |
| AC-005 | automated or explicit manual | same slug reusable only after delete complete; stale `runtime_instance_id` or `control_generation` updates affect zero rows |
| AC-006 | automated or explicit manual | API has no Docker socket |

## Regression Checks

- Domain lifecycle concurrency returns `409 domain_operation_in_progress`; no second queued operation is inserted.
- Domain failure details are stored on `domain_operations.error_code` / `error_message`, not on `domains`.
- `domains` migration omits `available`, `health_status`, runtime URL, host port, paths, DB names, container IDs, provider config, and generic JSON metadata.
- API errors use the canonical safe envelope.
- Authz failures return 401/403 behavior defined by API-001 and PROD-004.
- Safe DTO/log snapshots do not contain forbidden data.
- Migrations, OpenAPI snapshots, SSE fixtures, and visual screenshots are updated when affected.

## Blocked Evidence

If any test cannot be run, mark the feature blocked in `acceptance.md` with the missing dependency and owner.
