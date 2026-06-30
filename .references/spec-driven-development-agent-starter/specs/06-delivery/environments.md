---
id: DEL-001
title: Environments and Configuration
status: draft
owner: <platform/operations owner>
last_reviewed: <YYYY-MM-DD>
depends_on: [ARCH-001, QUAL-002]
supersedes: []
---

# Environments and Configuration

## Environments

| Environment | Purpose | Data policy | Deployment trigger | Access | External dependencies |
| --- | --- | --- | --- | --- | --- |
| Local | `<purpose>` | `<policy>` | `<trigger>` | `<access>` | `<dependencies>` |
| Test | `<purpose>` | `<policy>` | `<trigger>` | `<access>` | `<dependencies>` |
| Staging | `<purpose>` | `<policy>` | `<trigger>` | `<access>` | `<dependencies>` |
| Production | `<purpose>` | `<policy>` | `<trigger>` | `<access>` | `<dependencies>` |

## Configuration rules

- Configuration has one documented owner.
- Secrets are referenced by name only; never committed.
- Default values must be safe.
- Environment-specific behaviour must be minimal and documented.
- Every required variable has purpose, allowed format, and owner.

## Parity risks

List differences that could invalidate test confidence: `<data volume, provider stub, network policy, identity, scale>`.
