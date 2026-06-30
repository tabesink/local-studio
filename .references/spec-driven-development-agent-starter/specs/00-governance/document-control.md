---
id: GOV-002
title: Documentation Control
status: draft
owner: <team or role>
last_reviewed: <YYYY-MM-DD>
depends_on: [GOV-001]
supersedes: []
---

# Documentation Control

## Ownership

| Artifact class | Accountable owner | Required reviewers |
| --- | --- | --- |
| Product/business rule | Product owner | domain owner, engineering lead |
| Architecture/ADR | Engineering lead | affected component owners |
| API/event/data contract | Contract owner | provider and consumer owners |
| AI capability contract | AI capability owner | security/privacy + domain owner |
| Feature spec | Delivery owner | product + engineering |
| Quality/release/runbook | Engineering/operations owner | affected delivery owners |

Replace roles with actual names or teams.

## Review rule

Update review date when:
- behaviour changes;
- a contract changes;
- an incident reveals a missing assumption;
- a planned decision becomes obsolete;
- a document reaches its scheduled review date.

## Document lifecycle

1. Draft without implementation authority.
2. Proposed and reviewed.
3. Approved and actionable.
4. Implemented with evidence.
5. Superseded or archived with a successor link.

## Source-of-truth rule

No document may claim to be authoritative over a topic already owned elsewhere. Link to the canonical document instead.

## Versioning

- Use document `id` plus Git history for normal evolution.
- Add semantic version in API/event files where consumers need explicit compatibility management.
- Preserve superseded documents in `99-archive/` only when history is valuable.
