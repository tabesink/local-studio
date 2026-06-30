---
id: DEL-001
title: Environments
status: approved
owner: Context Engine platform team
last_reviewed: 2026-06-30
depends_on: [GOV-001]
supersedes: []
---

# Environments

| Environment | Purpose | Config policy | External dependencies |
| --- | --- | --- | --- |
| Local | developer build and tests | `.env` with local secrets, no committed values | local Postgres/storage/runtime fakes as needed |
| Test/CI | deterministic automated checks | generated ephemeral secrets | Postgres test container, pinned fixtures |
| Staging/Pilot | pilot rehearsal | production-like secrets and private runtime network | real pinned LightRAG/provider/parser where required |
| Production | later, not claimed by this scaffold | needs separate release readiness | target infra/provider quotas |

## Secret Rules

- Secret values never enter specs, fixtures, screenshots, or logs.
- `CONFIG_ENCRYPTION_KEY` is required outside test.
- Provider credentials are encrypted and resolved server-side only.
