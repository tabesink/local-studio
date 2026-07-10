# Context Engine — Agent UI Implementation Guidelines

> **Audience:** coding agents implementing frontend surfaces.  
> **Authority:** `DESIGN.md` is the visual source of truth. This file is the agent-facing checklist and pattern map. When they conflict, follow `DESIGN.md`, then update this file in the same change.

## Read order

1. `DESIGN.md`
2. This file
3. Feature UI requirements under `specs/04-features/` (especially F-009)
4. Closest Local Studio / parity-template reference for the surface you are building

Do not invent a white dashboard, generic shadcn look, or new token system.

## Non-negotiables

- Dark-first `zai-dark` by default; `zai-light` is the matching light system only.
- Token-first: `--ui-*`, `--fs-*`, `--rad-*`, legacy aliases (`--bg`, `--fg`, `--accent`, `--ok`, `--warn`, `--err`, …).
- Primitive-first from `frontend/src/_shared/ui` before bespoke markup.
- Dense workstation geometry: 24/28px rows/controls, 4px rhythm, ~7px base radius.
- Geist Sans + Geist Mono only as product fonts.
- Status via `StatusDot` / `StatusPill` + text — never full-color status cards.
- Browser never talks to Docker, LightRAG, DB, storage paths, or provider APIs directly.
- No secrets, runtime URLs, filesystem paths, stack traces, or raw healthcheck dumps in UI copy or API-driven detail strings.

## Primitive map (use these names)

```text
Button, Input, Select, Textarea, Checkbox, FormField
SegmentedControl, Tabs, Card, Alert
Table / THead / TBody / TRow / TH / TCell
ListGroup / ListRow
SettingsLayout / SettingsGroup / SettingsRow / SettingsFactRows / SettingsNotice
AppPage / PageHeader
Modal, Drawer, ProgressBar, ErrorBox, RightDetailPanel
StatusDot / StatusPill
```

Create a new variant only when an existing primitive cannot express the state, the pattern will be reused, and `DESIGN.md` is updated in the same change.

## Status tones (quick map)

| Tone | Use |
| --- | --- |
| `default` | stopped, idle, unknown, unavailable, not applicable |
| `info` | starting, running, indexing, querying |
| `good` | ready, complete, indexed, healthy, setup `ok` |
| `warning` | paused, queued, degraded, setup `warning`, host-dev N/A |
| `danger` | failed, blocked, unsafe, setup `error` |

## Surface patterns

### App shell

Left rail | primary canvas | optional right detail panel. Do not replace the right panel with a card grid.

### Domains / documents / chat / operations

Follow `DESIGN.md` §8.1–8.4 and §8.6. Port old CE client structure where F-009 says so; restyle with Local Studio tokens.

### Settings panel

**Parity template:** `.reference-LS-frontend/templates/nextjs-feature-demos/features/settings-panel/`  
**Live shell:** `frontend/src/features/settings-panel/` + `SettingsLayout`

Rules:

- One `/settings` page; switch sections in-panel (React state or hash). Do not add a top-level route per section unless a feature contract requires it.
- Left sticky `SectionNav` + dense content column (~640px reference). Prefer `SettingsGroup` / `SettingsRow` over cards.
- Admin sections (provider, domains, users, setup) are role-gated; non-admins keep personal/general only.
- Provider/model: masked credentials, compact form rows, status pills — no marketing provider cards.

#### Setup checks (admin)

Mirror LS **Setup checks** chrome, not LS fixture content:

| Do | Do not |
| --- | --- |
| Section **Setup** + `SettingsGroup` titled **Setup checks** | Copy Pi / controller / `~/models` fixture rows |
| One `SettingsRow` per check + mono detail + `StatusPill` | Show live URLs, paths, `api:8000`, heartbeat file paths |
| Pillars: `postgres` → `migrate` → `api` / `worker` → `frontend` | Treat Setup as a setup wizard or Docker operator console |
| Map `ok`→`good`, `warning`→`warning`, `error`→`danger` | Probe Docker/private runtimes from the browser |
| Host-dev: compose-only pillars N/A/warning, not false danger | Uptime charts, service cards, Portainer-like panels |
| Worker = heartbeat freshness; migrate = one-shot gate | Equate “container exists” with healthy worker |

Backend owns check status. Frontend maps contracted fields only. Logs / Usage / Node / storage / Docker controls stay out of Setup until F-010 contracts allow them.

## Implementation checklist (before merge)

1. Compared to closest LS / parity-template screen (Settings → settings-panel template).
2. No hard-coded colors/radii/heights when tokens exist.
3. Status uses pill/dot + text; no colored panel fills.
4. Settings Setup detail strings are safe (no URL/path/runtime target).
5. Empty / loading / error / permission states present.
6. Visual check at 1440×900 dark (and light if the surface is theme-sensitive).

## Short prompt

> Build with Local Studio visual parity per `DESIGN.md`. For Settings, match `.reference-LS-frontend/templates/nextjs-feature-demos/features/settings-panel/` shell and Setup checks row grammar; use CE stack-pillar content only. Token-first, primitive-first, dense dark workstation — no generic dashboard, no secret/path/URL leakage in status detail.
