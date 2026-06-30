---
id: TRACE-002
title: Traceability Matrix
status: draft
owner: <delivery coordinator>
last_reviewed: <YYYY-MM-DD>
depends_on: [TRACE-001]
supersedes: []
---

# Traceability Matrix

Use this table for high-risk, regulated, enterprise-critical, or cross-boundary work. Do not create a giant matrix for trivial changes.

| Need / rule | Feature acceptance | Design/contract | Implementation | Tests | Release evidence | Status |
| --- | --- | --- | --- | --- | --- | --- |
| BR-001 | AC-001 | `<path>` | `<module/path>` | `<test>` | `<evidence>` | pass/fail/blocked |

## Forward trace

Start with a business rule or user need. Confirm it reaches feature criteria, design, implementation, test, and delivery evidence.

## Backward trace

Start with code, a test, or a deployed behaviour. Confirm it is justified by an active feature or contract. Remove or document orphaned behaviour.
