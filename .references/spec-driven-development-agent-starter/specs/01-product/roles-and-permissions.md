---
id: PROD-004
title: Roles and Permissions
status: draft
owner: <security/domain owner>
last_reviewed: <YYYY-MM-DD>
depends_on: [PROD-001]
supersedes: []
---

# Roles and Permissions

Define permissions in business language first; map to implementation policy second.

| Role | Can do | Cannot do | Data scope | Audit required |
| --- | --- | --- | --- | --- |
| `<role>` | `<actions>` | `<actions>` | `<tenant/project/own records>` | `<yes/no and events>` |

## Permission decisions

| Action ID | Action | Allowed roles | Preconditions | Denial behaviour |
| --- | --- | --- | --- | --- |
| ACT-001 | `<verb + object>` | `<roles>` | `<conditions>` | `<status/message/audit>` |

## Rules

- Authorization must be enforced server-side or at the trusted boundary.
- UI visibility is not authorization.
- Every privileged, destructive, or data-export action must define an audit event when appropriate.
