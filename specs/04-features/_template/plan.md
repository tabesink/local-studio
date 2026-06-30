---
id: F-###-PLAN
title: <feature implementation plan>
status: draft
owner: <technical owner>
last_reviewed: <YYYY-MM-DD>
depends_on: [F-###]
supersedes: []
---

# Implementation Plan — F-###

## 1. Summary

Explain the smallest design that meets the feature specification.

## 2. Boundary impact

| Boundary | Change | Contract impact | Compatibility | Owner |
| --- | --- | --- | --- | --- |
| UI | `<change>` | `<none/path>` | `<notes>` | `<owner>` |
| API/service | `<change>` | `<path>` | `<notes>` | `<owner>` |
| Data | `<change>` | `<path>` | `<migration>` | `<owner>` |
| Worker/event | `<change>` | `<path>` | `<notes>` | `<owner>` |
| AI capability | `<change>` | `<path>` | `<eval/version>` | `<owner>` |

## 3. Design

### Components to change

| Component | Responsibility change | Reason | Dependencies |
| --- | --- | --- | --- |
| `<path/module>` | `<change>` | `<reason>` | `<dependencies>` |

### Request / data flow

```text
<User> -> <UI> -> <API> -> <use case> -> <storage/provider>
```

### Authorization and security

- `<where authorization is enforced>`
- `<data validation/redaction>`
- `<audit event>`

### Failure and recovery

| Failure | Detection | User/system behaviour | Retry/recovery | Observability |
| --- | --- | --- | --- | --- |
| `<failure>` | `<signal>` | `<behaviour>` | `<policy>` | `<evidence>` |

## 4. Data and migration

- Schema change: `<none or link>`
- Backfill: `<none or plan>`
- Rollback/compensation: `<plan>`
- Retention/delete impact: `<impact>`

## 5. Test and verification strategy

Link `test-plan.md`. Name unit, integration, contract, UI/E2E, security, performance, and manual acceptance evidence needed.

## 6. Deployment

- Feature flag: `<only when explicitly needed>`
- Configuration/secrets: `<names; no values>`
- Migration order: `<order>`
- Rollback: `<steps>`
- Monitoring after release: `<signals>`

## 7. Deferred work

List only conscious, non-blocking deferrals. Give each a reason and follow-up destination.
