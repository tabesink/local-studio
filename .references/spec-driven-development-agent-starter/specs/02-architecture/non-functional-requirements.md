---
id: ARCH-005
title: Non-Functional Requirements
status: draft
owner: <engineering lead>
last_reviewed: <YYYY-MM-DD>
depends_on: [PROD-001]
supersedes: []
---

# Non-Functional Requirements

Use measurable requirements. “Fast”, “secure”, and “scalable” are not requirements without a scope and threshold.

| NFR ID | Area | Requirement | Scope/load | Measurement | Verification |
| --- | --- | --- | --- | --- | --- |
| NFR-001 | Availability | `<target>` | `<scope>` | `<metric>` | `<test/dashboard>` |
| NFR-002 | Performance | `<latency/batch target>` | `<load>` | `<metric>` | `<test>` |
| NFR-003 | Security | `<control>` | `<scope>` | `<evidence>` | `<review/test>` |
| NFR-004 | Privacy | `<data/retention rule>` | `<scope>` | `<evidence>` | `<review/test>` |
| NFR-005 | Accessibility | `<standard/expected flows>` | `<screens>` | `<evidence>` | `<audit/test>` |
| NFR-006 | Operability | `<logs/alert/recovery>` | `<services>` | `<evidence>` | `<drill>` |

## Capacity and concurrency

- Expected active users: `<number>`
- Peak concurrent users/jobs: `<number>`
- Data volume/throughput: `<number>`
- Cost envelope: `<budget/limits>`
- Explicitly unsupported scale: `<limits>`
