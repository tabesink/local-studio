---
id: QA-002
title: Security And Privacy
status: approved
owner: Context Engine security team
last_reviewed: 2026-06-30
depends_on: [GOV-001, PROD-004]
supersedes: []
---

# Security And Privacy

## Data Classes

| Class | Examples | Rule |
| --- | --- | --- |
| Internal | safe IDs, roles, statuses, safe operation metadata | authenticated access only |
| Confidential | usernames, conversations, audit metadata, model profile metadata | API DTO minimization and authz |
| Restricted | secrets, source originals, Source Blocks, prompts, raw answers, raw provider/LightRAG payloads, storage paths, runtime URLs | never browser/log/trace exposed except approved safe excerpts |

## Controls

- Authentication: opaque HttpOnly `ce_session` cookie.
- Authorization: backend route/resource checks on every protected route.
- Secret management: encrypted provider credentials; safe status-only DTOs.
- Logging: safe structured metadata only; no raw exception text in production logs.
- AI data: current-turn Evidence only; no raw provider payloads or prompt export by default.
- Diagnostics: admin-only, redacted, bounded, audited, no browser-provided paths or URLs.
