# FE Context Engine Next.js Vertical Slices

Status: planning package for downstream implementation.
Created: 2026-06-29.
Audience: junior developers and coding agents building the Next.js frontend in `webui/`.

## Purpose

This package turns the frontend reference reviews into an implementation baton for rebuilding Context Engine as a Next.js app in vertical slices.

The first implementation goal is narrow:

1. Create the `webui/` Next.js runtime foundation.
2. Rebuild the authenticated Context Engine main app layout structurally as-is.
3. Rebuild the navigation side panel using Local Studio UI/UX rules.
4. Document every frontend feature's API, backend owner, and data-model expectation before wiring real backend behavior.

## Source Packages

Use these read-only sources:

- `.references/context_engine_frontend_review/`
- `.references/local_studio_frontend_review/`
- `.references/local-studio-visual-parity-package.md`
- `.references/code/local-studio/`

Use these live docs as higher priority than older reference notes:

- `DESIGN.md`
- `docs/design/context_engine_agent_ui_guidelines.md`
- `AGENTS.md`
- `CONTEXT.md`

Important: older review notes may mention a white workbench. That is superseded. The current target is Local Studio visual parity: dark-first workstation with an equivalent light theme.

## Read Order

1. `prd.md`
2. `IMPLEMENTATION_MAP.md`
3. `API_BACKEND_CONNECTIONS.md`
4. `HANDOFF.md`
5. one issue under `issues/`

Do not build beyond the active issue.

## Issue Order

| Order | Issue | Outcome |
| ---: | --- | --- |
| 1 | `issues/FE-001-runtime-foundation.md` | `webui/` boots with current stable packages, tokens, themes, API client boundary, and test harness |
| 2 | `issues/FE-002-app-shell-nav-settings-entry.md` | authenticated shell, side rail, role-aware nav, theme toggle contract, empty settings entry |
| 3 | `issues/FE-003-original-layout-healing.md` | heal FE-001/FE-002 drift by preserving original Context Engine layouts with Local Studio theming |
| 4 | future | login/session UI |
| 5 | future | settings panels |
| 6 | future | documents library |
| 7 | future | chat shell and SSE evidence |
| 8 | future | graph, operations, diagnostics |

