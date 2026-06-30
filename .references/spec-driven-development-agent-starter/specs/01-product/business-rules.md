---
id: PROD-003
title: Business Rules
status: draft
owner: <domain owner>
last_reviewed: <YYYY-MM-DD>
depends_on: [PROD-002]
supersedes: []
---

# Business Rules

A business rule describes a durable domain fact, calculation, permission, threshold, state transition, or policy. Keep each rule testable.

| Rule ID | Statement | Applies to | Source/owner | Verification |
| --- | --- | --- | --- | --- |
| BR-001 | `<precise rule>` | `<entities/users/flow>` | `<owner>` | `<test/acceptance>` |

## Rule detail template

### BR-001 — `<name>`

- **Statement:** `<MUST/MUST NOT rule>`
- **Rationale:** `<business reason>`
- **Inputs:** `<data>`
- **Expected result:** `<observable outcome>`
- **Exceptions:** `<explicit exceptions or none>`
- **Owner:** `<role>`
- **Tests:** `<test IDs>`
