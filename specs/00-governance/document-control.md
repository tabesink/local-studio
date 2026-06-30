---
id: GOV-002
title: Document Control
status: approved
owner: Context Engine delivery team
last_reviewed: 2026-06-30
depends_on: [GOV-001]
supersedes: []
---

# Document Control

## Status Labels

- `draft`: incomplete; not implementation authority.
- `proposed`: ready for review; implementation should not start without approval.
- `approved`: authoritative for implementation.
- `implemented`: code and evidence satisfy the document.
- `superseded`: replaced by a linked document.
- `archived`: historical only.

## Change Rule

A meaningful behavior change must update the active feature spec, affected contracts, test/acceptance evidence, traceability register, and implementation code in the same delivery change when practical.

## Reference Rule

`.references/` content is read-only evidence. If reference material conflicts with active specs, active specs win. If the active spec is wrong, change the active spec first.

## Review Cadence

- Review each feature before implementation starts.
- Review contracts whenever API/SSE/data/AI behavior changes.
- Review `DESIGN.md` and F-009 UX before creating a new UI primitive or screen pattern.
