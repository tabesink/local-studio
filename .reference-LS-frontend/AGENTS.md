# Agent Operating Contract — Frontend Parity Templates

This repository packages Local Studio frontend parity templates. Coding agents working here rebuild **frontend slices only**: fixture-backed Next.js feature demos that carbon-copy the Local Studio UI/UX. There is no backend, auth, or product logic in scope.

## What This Repo Is

- `.references/local-studio/` — the reference application (read-only evidence). Its frontend at `.references/local-studio/frontend/src` is the single source of truth for look, feel, copy, and interaction.
- `templates/nextjs-feature-demos/` — the deliverable: twelve feature slices plus a shared foundation and a demo host app.
- `docs/feature-parity/` — per-feature implementation guides with code maps, UI/UX parity notes, contracts, and acceptance criteria, plus the backend-wiring guide for connecting a FastAPI/Python backend.

## Required Reading Order

Before editing code, read in this order:

1. `DESIGN.md` — the design system contract (tokens, primitives, component grammar, prohibited drift).
2. `docs/feature-parity/README.md` — package purpose, structure, and implementation rules.
3. The relevant `docs/feature-parity/features/<feature>.md` for the slice you are building.
4. `docs/feature-parity/backend-wiring.md` — when connecting a slice to a real backend: the `api/` seam, per-slice endpoint tables, and the chat SSE contract.
5. The matching reference source under `.references/local-studio/frontend/src` (evidence only, never edited).
6. The existing slice under `templates/nextjs-feature-demos/features/<feature>/` and its README copy map.

## Non-Negotiable Rules

1. **No invented behavior.** If the reference doesn't show it and the feature doc doesn't specify it, it is an open decision — ask, don't guess.
2. **`.references/` is read-only.** Copy values and class recipes out of it; never modify it.
3. **Visual parity governs styling.** Local Studio tokens and primitives always win. Do not create a generic white dashboard, do not restyle with default shadcn looks, do not introduce new fonts, colors, radii, or spacing scales.
4. **Token-first.** Components read CSS variables (`--ui-*`, `--fs-*`, `--rad-*`, legacy `--bg/--fg/--dim/...`) from `templates/nextjs-feature-demos/_shared/styles/local-studio-tokens.css`. No hardcoded colors or radii in component files.
5. **Primitive-first.** Reuse `templates/nextjs-feature-demos/_shared/ui` (Button, StatusPill, ListGroup/ListRow, SettingsLayout/SettingsGroup/SettingsRow, ModelSection/ModelRow, Card, Alert, FactGrid, UiModal, Drawer, Tabs, SegmentedControl, Table, Stat, ...) before writing bespoke markup.
6. **One slice at a time.** Keep changes scoped to the requested feature folder plus, when necessary, `_shared`.
7. **Fixture-backed demos only.** No real backends, auth, databases, or network calls. Async behavior is simulated through each slice's `api/` module over typed fixtures.
8. **Keep the folder contract.** Every slice keeps `components/ hooks/ api/ types/ fixtures/ constants/ index.ts README.md`.
9. **`api/` is the backend seam.** Each slice's `api/` module defines the future backend surface: function names, request/response shapes, polling cadences, and stream contracts stay aligned with `.references/local-studio/shared/contracts/` and `docs/feature-parity/backend-wiring.md`. Components never fetch; hooks call `api/*` only.
10. **Icons are lucide-react** (reference pins `0.561.0`), same glyphs the reference uses — check `.references/local-studio/frontend/src/ui/icon-registry.ts` when unsure.
11. **shadcn MCP is lookup-only.** It may be consulted as a reference for component APIs, but generated shadcn styling never lands in this repo; Local Studio primitives and tokens always take precedence.

## Workflow For A Slice

1. **Discover** — read the feature doc and the reference source; list the screens, labels, and states you must mirror.
2. **Implement** — build against the reference class recipes; take literal labels and realistic sample content from the reference.
3. **Verify** — run the checks below and compare the route against the reference source structure side by side.

## Verification

From `templates/nextjs-feature-demos/demo-app`:

```bash
npm run typecheck   # must pass clean
npm run dev         # serves http://localhost:3033
```

Open `/features/<slug>` for the slice you changed and check against the reference: layout geometry, type sizes, icon glyphs, labels, hover/active states, empty/error states.

## Required Response Format

```text
Slice: <feature folder>
Scope: <what changed / did not change>
Reference read: <reference paths used as evidence>
Implementation: <files changed>
Verification: <typecheck/dev-check outcome>
Open decisions / known limits: <items or none>
```

## Definition Of Done

A slice is complete when it typechecks clean, renders at its demo route, visually matches the reference screens (tokens, geometry, icons, literal copy), keeps the folder contract, stays fixture-backed, and its README copy map points at the exact reference files it mirrors.
