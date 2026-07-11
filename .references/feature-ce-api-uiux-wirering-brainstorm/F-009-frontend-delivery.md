# F-009 — Frontend Delivery

**Phase P9 · Thin client · All 17 slices**

## Outcome

Next.js UI: **port old CE routes/layout/PDF viewer/graph shell** from `.references/code/context-engine/client/`, restyle with Local Studio tokens. Rewire to P1–P8 contracts.

## Route Map

```text
/login                          public
/(app)
  /chat                         member+admin
  /documents                    member+admin (admin write actions)
  /database-visualize           graph workspace
  /operations                   admin
  /forbidden                    member blocked from admin URL
Settings dialog (global)        general | users | domains | providers | parser
```

## Port Sources

| Concern | Port from (structure) | Restyle with |
| --- | --- | --- |
| Shell + nav | `client/src/components/layout/AppSideRail.tsx` | LS tokens, icon buttons |
| Documents + PDF | `client/src/features/documents/DocumentRoute.tsx` | LS table + panel surfaces |
| Graph | `client/src/features/graph/GraphViewer.tsx` | LS popover/card on controls |
| Chat | `client/src/components/chat/LightRagChatShell.tsx` | LS composer + markdown |
| Settings | `client/src/components/settings/SettingsDialog.tsx` | LS `SettingsLayout` |

Full file map: `02-ce-client-port-map.md`

## Architecture

```text
app/routes
  └── features/<name>/
        ├── *Page.tsx           route shell
        ├── *-api.ts            typed wrappers (only place that calls fetch)
        ├── types.ts            DTO mappers
        └── components/         presentational; no fetch
shared/
  ├── ui/                       LS-adapted primitives
  ├── api-client.ts             cookie credentials, error envelope
  └── auth/                     session from /auth/me
```

## Wiring Rules

| Rule | Detail |
| --- | --- |
| No token storage | cookie only |
| Feature owns API | shared ui never fetches |
| Unknown shape | fixture task, block slice |
| 401 | clear auth once → login |
| 403 | forbidden page, no loop |
| Admin controls | hidden for member + backend 403 |

## Visual Gate

Every slice: dark default (`zai-dark`), Geist fonts, 28px rows, no white dashboard.

See `01-local-studio-parity-cheatsheet.md` + `DESIGN.md`.

## Slice Index

Full detail: `F-009-frontend-slices.md`

## Spec + Map

- `specs/04-features/F-009-frontend-delivery/spec.md`
- `specs/04-features/F-009-frontend-delivery/frontend-slice-map.md`
