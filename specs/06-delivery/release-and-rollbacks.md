---
id: DEL-002
title: Release And Rollbacks
status: approved
owner: Context Engine release owner
last_reviewed: 2026-06-30
depends_on: [DEL-001, QA-001]
supersedes: []
---

# Release And Rollbacks

## Gates

- Format/lint/type checks pass.
- Unit, integration, migration, OpenAPI, SSE, e2e, and visual checks pass for touched phases.
- Secret scan passes.
- Full auth -> domain -> upload -> prepare -> index -> evidence -> chat -> delete/redact proof exists before pilot.
- Known limitations are listed in affected feature `implementation-log.md`.

## Rollback Rules

| Change | Rollback |
| --- | --- |
| Stateless code | redeploy previous version |
| Additive schema | code rollback can leave schema in place |
| Destructive schema | explicit compensation/restore plan required before merge |
| Runtime config | revert safe profile/settings rows; do not restore secret values from docs |
| Prompt/model policy | revert contract/version and active profile selection |
| Frontend visual change | revert component/slice; keep contracts unchanged |
