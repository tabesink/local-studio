---
id: ARCH-004
title: Integration Flows
status: draft
owner: <engineering lead>
last_reviewed: <YYYY-MM-DD>
depends_on: [ARCH-001, ARCH-003]
supersedes: []
---

# Integration Flows

## Integration inventory

| Integration | Pattern | Contract | Auth | Timeout/retry | Idempotency | Failure behaviour | Owner |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `<name>` | `<HTTP/event/job/file>` | `<path>` | `<method>` | `<policy>` | `<key/none>` | `<behaviour>` | `<owner>` |

## Flow template

### INT-001 — `<flow name>`

```text
[Producer] -> [Boundary] -> [Consumer]
```

- **Trigger:** `<event/request>`
- **Input contract:** `<path/version>`
- **Success result:** `<observable outcome>`
- **Failure classes:** `<transient/permanent/user-correctable>`
- **Retry and idempotency:** `<rules>`
- **Timeout / cancellation:** `<rules>`
- **Observability:** `<logs/metrics/traces/audit>`
- **Security:** `<auth/data handling>`
