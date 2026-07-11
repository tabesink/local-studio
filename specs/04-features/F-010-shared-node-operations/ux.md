---
id: F-010
title: Shared Node Operations UX Contract
status: approved
owner: Context Engine delivery team
last_reviewed: 2026-07-06
depends_on: [F-010]
supersedes: []
---

# F-010 - UX Contract

## User Journey

```text
Operator starts stack -> opens frontend -> signs in -> verifies authenticated shell and safe operational status
```

## Surfaces

| Surface | User goal | Required elements | Forbidden/misleading elements |
| --- | --- | --- | --- |
| Login | prove frontend reaches backend auth | normal P9 login form and safe API-unavailable error | database/runtime/controller targets |
| Settings reserved node/ops areas | avoid implying unimplemented controls | absent or inactive sections until contracts exist | fake toggles, browser-local infrastructure mutation |
| Future Logs/Usage/Node dashboard | inspect safe operator state | compact Local Studio rows/tables, safe statuses, right detail panel | raw logs, raw cost math, raw Docker/runtime URLs, host paths, credentials |

## UI States

| State | Trigger | Must show | Available actions | Accessibility notes |
| --- | --- | --- | --- | --- |
| API unavailable | frontend cannot reach backend | safe short error | retry after backend start | no stack trace |
| Authenticated | login succeeds | app shell | logout/settings/navigation | focus moves into shell |
| Forbidden | member reaches admin/operator surface | safe forbidden state | back/navigation | no hidden infrastructure clues |
| Node ops blocked | contracts missing | unavailable state or absent nav | none | do not present disabled fake controls as working |

## Visual Constraints

- Use Local Studio dark-first tokens from DESIGN.md.
- Use compact rows/tables and right detail panels for operator surfaces.
- Do not create a generic white dashboard.
- Do not show raw runtime, Docker, database, storage, provider, or controller targets.
