---
id: ARCH-002
title: Component Boundaries
status: draft
owner: <engineering lead>
last_reviewed: <YYYY-MM-DD>
depends_on: [ARCH-001, PROD-002]
supersedes: []
---

# Component Boundaries

## Composition-root rule

Name the runtime/bootstrap location where configuration, infrastructure clients, routing, dependency wiring, middleware, and background jobs are assembled.

- **Composition root:** `<path/module>`
- **Why it is the composition root:** `<explanation>`

## Components

| Component/module | Responsibility | Owns | Depends on | Must not know |
| --- | --- | --- | --- | --- |
| `<component>` | `<single responsibility>` | `<rules/data>` | `<interfaces>` | `<forbidden outer concerns>` |

## Dependency rules

- Domain/business logic must not depend directly on web frameworks, UI frameworks, databases, model-provider SDKs, or cloud SDKs.
- Adapters own integration details.
- Cross-cutting concerns such as authentication, logging, metrics, tracing, validation, and error translation are applied at explicit boundaries.
- Do not introduce a new layer without a concrete responsibility and current maintenance benefit.

## Allowed dependency direction

```text
UI / API / Workers
        ↓
Application use-cases
        ↓
Domain rules and models
        ↑
Infrastructure adapters
```

Adapt this to the actual system rather than forcing the pattern blindly.
