---
id: PROD-004
title: Roles And Permissions
status: approved
owner: Context Engine security and product team
last_reviewed: 2026-06-30
depends_on: [PROD-001, PROD-003]
supersedes: []
---

# Roles And Permissions

| Role | May do | Must not do | Scope | Audit |
| --- | --- | --- | --- | --- |
| Public | login, health/live if exposed | access app data | none | auth failures safe-log only |
| Member | resolve own session, list available domains, query evidence/chat, manage own conversations, view allowed documents/graph surfaces when implemented | mutate users/settings/domains/sources/operations/audit | own conversation plus available domains | chat/retrieval metadata per P8 |
| Administrator | all Member actions plus users, runtime settings, domains, source upload/prep/index/delete, operations, audit/diagnostics | bypass backend auth, view secret values, access raw runtime internals | system admin within internal product | admin/security events |
| Controller/internal worker | private runtime lifecycle and worker actions through internal auth | browser access, public network exposure | private service boundary | operation/audit metadata |

## Authorization Rules

- UI visibility is usability only. Backend authorization is final.
- `401` clears client auth state once and redirects to login.
- `403` preserves route context and shows forbidden state; no redirect loop.
- Unsafe `next` redirects are blocked.
- Admin diagnostics are redacted, bounded, audited, and never path/URL driven by browser input.
