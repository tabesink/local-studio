---
id: ARCH-001
title: System Context
status: draft
owner: <engineering lead>
last_reviewed: <YYYY-MM-DD>
depends_on: [PROD-001, PROD-002]
supersedes: []
---

# System Context

## System responsibility

State the system's responsibility in one paragraph. Describe what is inside the system boundary and what remains external.

## Actors and external dependencies

| Actor/system | Why it interacts | Direction | Data exchanged | Trust level | Contract |
| --- | --- | --- | --- | --- | --- |
| `<actor/system>` | `<reason>` | `<in/out/both>` | `<data>` | `<trusted/untrusted>` | `<path>` |

## Context diagram

```text
[User] --> [This System] --> [External Service]
```

Replace this with a maintained diagram or an understandable text diagram.

## Critical end-to-end flows

| Flow | Trigger | Main components | Failure owner | Evidence |
| --- | --- | --- | --- | --- |
| `<flow>` | `<trigger>` | `<components>` | `<owner>` | `<logs/tests>` |

## Assumptions and exclusions

- `<assumption>`
- `<system explicitly outside the boundary>`
