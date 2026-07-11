---
id: F-001-ACC
title: Next.js Composition Root and Safe Session Bridge acceptance
status: proposed
owner: Context Engine team
last_reviewed: 2026-07-02
depends_on: [F-000]
supersedes: []
---
# Acceptance criteria

- A signed-out user cannot render protected content.
- A member and admin receive only display-safe session data.
- No secret/token is placed in browser storage.
- All browser API calls use one transport boundary.

## Completion evidence

| Check | Result | Evidence link / command | Notes |
|---|---|---|---|
| Feature tests | pending | | |
| API/integration tests | pending | | |
| Authorization test | pending | | |
| Security review | pending | | |
| UI state review | pending | | |
| Source-reference review | pending | | |

A feature is not `implemented` until each required check has recorded evidence or an approved deviation.
