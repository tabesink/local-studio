# FE-003 Original Layout Healing

## Status

DONE (2026-06-29).

## Purpose

Heal FE-001/FE-002 implementation drift by preserving the original Context Engine webui layouts while applying Local Studio visual themes.

## Completed Changes

- Replaced the FE-002 full-bleed expanded/collapsible shell with a padded viewport and bordered app workframe matching the original Context Engine `AppPageFrame` topology.
- Simplified the navigation into a fixed compact icon rail inside the frame while retaining role-aware items, active state, theme toggle, settings trigger, and settings focus restoration.
- Added route-owned placeholder shells for Chat, Documents, and Graph instead of using the generic centered feature card.
- Changed `/database-visualize` from a redirect into a compatibility route that renders the Graph work surface at the original URL.
- Disabled the Next.js development indicator in `next.config.ts` because the devtools portal intercepted Playwright pointer clicks during e2e validation.
- Added a compact rail token (`--shell-rail-compact`) and reused Local Studio `--ui-*` tokens for all new FE-003 surfaces.

## Interfaces Changed

- `webui/src/features/navigation/SideRail.tsx` no longer accepts collapse state props.
- `webui/src/app/(app)/chat/page.tsx`, `documents/page.tsx`, `graph/page.tsx`, and `database-visualize/page.tsx` now delegate to feature-owned route components.
- `webui/src/components/shared/RoutePageShell.tsx` provides shared route chrome for document and graph placeholder surfaces.

## Tests Added Or Updated

- `webui/e2e/app-shell.spec.ts` now asserts the framed work surface, compact fixed rail, route canvas positioning, primary route work surfaces, member/admin nav, forbidden route behavior, settings dialog behavior, and dark/light theme geometry.
- `webui/e2e/foundation.spec.ts` now asserts the default and light themed app shell include the framed work surface.

## Validation

- `npm run lint` from `webui/`: passed.
- `npm run test` from `webui/`: passed, 5 files and 18 tests.
- `npm run test:e2e` from `webui/`: passed, 8 Chromium tests.

## Follow-On Assumptions

- Route shells intentionally reserve layout shape only; real chat retrieval, document loading, graph data, and operations data remain out of scope.
- Operations still uses the FE-002 placeholder for admin visibility because FE-003 focused on the primary Context Engine route frames.
- GitNexus symbol impact could not resolve the edited frontend symbols from the current index, so impact was assessed via local imports and final change detection.
