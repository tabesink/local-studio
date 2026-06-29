# Handoff

## Current Baton

FE-001, FE-002, and FE-003 are implemented. FE-003 healed the shell and primary route layout drift by restoring the original Context Engine framed workspace topology with Local Studio visual tokens.

## Mission

Create the Next.js frontend in `webui/` and rebuild the Context Engine main layout plus side navigation panel as the first visible vertical slice.

Use original Context Engine webui layouts as the topology source. Use Local Studio visual grammar for tokens, themes, surfaces, density, and controls.

## Non-Negotiables

- Dark theme and light theme both exist before feature screens are considered done.
- Dark theme is default.
- Light theme is the Local Studio equivalent, not a separate white SaaS skin.
- No credential persistence in browser storage.
- One typed API client.
- One SSE parser when streaming begins.
- Backend owns auth, roles, domains, lifecycle, operations, evidence, and secrets.
- Reference packages are read-only.
- When layout topology conflicts, `.references/code/client/` wins over the FE-002 expanded/collapsible shell. Local Studio still wins for theme language.

## Operator Notes

- The live design docs supersede older white-workbench reference notes.
- If exact package versions matter, rerun npm version checks because the list in `IMPLEMENTATION_MAP.md` was verified on 2026-06-29.
- If GitNexus tools are available before editing code symbols, follow `AGENTS.md` GitNexus impact and detect-change rules.
- Keep each issue independently testable and stop after the issue scope.
- FE-003 should inspect `.references/code/client/src/components/layout/AppPageFrame.tsx`, `AppSideRail.tsx`, and route pages before editing live `webui/` files.

## Latest Completion

- FE-003 (2026-06-29): replaced the expanded/collapsible shell with the original padded workframe and compact rail, added route-owned Chat/Documents/Graph placeholder surfaces, preserved `/database-visualize`, disabled the Next dev indicator for e2e reliability, and passed `npm run lint`, `npm run test`, and `npm run test:e2e` from `webui/`.

## Done For First Frontend Phase

- `webui/` exists and runs.
- Theme tokens load in dark and light.
- App shell renders with side rail, active route, placeholder content, settings trigger, toast host, and forbidden state.
- API/backend connection expectations are documented and not faked as implemented.
- Tests or smoke checks cover dark and light shell states.

## Next Issue

- No next issue is currently assigned in this PRD workspace. Continue from the master build plan or create the next baton before implementation.
