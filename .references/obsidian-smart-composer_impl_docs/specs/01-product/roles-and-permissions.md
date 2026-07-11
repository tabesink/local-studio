---
id: PRD-003
title: Roles and permissions
status: proposed
owner: Context Engine team
last_reviewed: 2026-07-02
depends_on: []
supersedes: []
---
# Roles and permissions

| Action | Member | Admin | Enforcement owner |
|---|---:|---:|---|
| View eligible domains | yes | yes | FastAPI |
| Ask a grounded question | yes | yes | FastAPI |
| Read own conversations | yes | yes | FastAPI owner filter |
| Read another member’s conversations | no | no by default | FastAPI owner filter |
| Create/use own templates | proposed | proposed | FastAPI |
| Manage global templates | no | proposed | FastAPI |
| Upload/manage sources | no | yes | FastAPI |
| Configure provider/runtime | no | yes | FastAPI |
| Create/apply source change proposal | no decision | no decision | blocked by ADR-005 |

Frontend visibility is a usability affordance, never authorization.
