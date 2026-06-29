# FE-003 Original Layout Healing

## Outcome

Repair the FE-001/FE-002 frontend foundation so the live `webui/` preserves the original Context Engine webui layout topology while applying Local Studio visual themes, tokens, and interaction styling.

## Why This Exists

FE-001 and FE-002 established a working Next.js foundation and shell, but the implementation drifted from the original Context Engine layout:

- Current primary routes render generic centered placeholder cards instead of preserving the original route frames and work surfaces.
- Current shell uses a full-bleed `100dvh` expanded/collapsible rail, while the original Context Engine shell uses a padded viewport, framed work surface, and fixed compact icon rail.
- FE-002 used Local Studio shell geometry as the structure source. The revised target is original Context Engine structure with Local Studio theme language.
- Validation was previously marked blocked because package binaries were unavailable or non-executable; this slice must restore and run the validation loop where possible.

## Prerequisites

- FE-001 and FE-002 are implemented.
- Read `../IMPLEMENTATION_MAP.md`.
- Read `../HANDOFF.md`.
- Read `DESIGN.md`.
- Read `docs/design/context_engine_agent_ui_guidelines.md`.
- Inspect original Context Engine webui references:
  - `.references/code/client/src/components/layout/AppLayout.tsx`
  - `.references/code/client/src/components/layout/AppPageFrame.tsx`
  - `.references/code/client/src/components/layout/AppSideRail.tsx`
  - `.references/code/client/src/app/chat/page.tsx`
  - `.references/code/client/src/app/documents/page.tsx`
  - `.references/code/client/src/app/database-visualize/page.tsx`
  - `.references/code/client/src/features/chat/ChatRoute.tsx`
  - `.references/code/client/src/features/documents/DocumentRoute.tsx`
  - `.references/code/client/src/features/graph/GraphViewer.tsx`
- Inspect Local Studio references only for visual tokens, density, primitive behavior, and theme treatment:
  - `.references/code/local-studio/frontend/src/app/styles/globals/tokens.css`
  - `.references/code/local-studio/frontend/src/ui/`
  - `.references/code/local-studio/frontend/src/features/settings/`

## Scope

- Replace the FE-002 shell topology with an `AppPageFrame`-style framed workspace:
  - root app canvas remains dark-first Local Studio themed;
  - page surface is padded from the viewport;
  - inner workframe has a tokenized border/radius and clips route content;
  - compact fixed icon rail lives inside the frame;
  - primary content fills the remaining workframe.
- Keep route files thin and route interiors aligned with original Context Engine layout contracts:
  - `/chat` should reserve the chat shell layout shape, not a generic placeholder card;
  - `/documents` should reserve the document library layout shape, not a generic placeholder card;
  - `/graph` and `/database-visualize` should preserve the graph viewer canvas layout shape.
- Retain FE-002 role-aware navigation, settings entry, forbidden behavior, and `/database-visualize` compatibility.
- Apply Local Studio tokens and themes to the preserved Context Engine structure:
  - no hard-coded colors when `--ui-*` or compatibility aliases exist;
  - dark default remains `zai-dark`;
  - light theme remains `zai-light`;
  - density stays workstation-oriented.
- Fix the local validation setup enough to distinguish real test failures from missing/non-executable binaries.
- Update tests so they assert the preserved frame/rail/work-canvas geometry and dark/light theme behavior.

## Out Of Scope

- Real chat retrieval, SSE streaming, synthesis, or message history.
- Real document upload, parsing, preview, or table data.
- Real graph data fetch, graph physics, node details, or layout controls.
- Real settings panels beyond the empty settings entry required by FE-002.
- Backend auth redesign or session endpoint changes.
- Editing `.references/**`.

## Layout Contract

Original Context Engine structure is the source of truth for layout topology. Local Studio is the source of truth for visual language.

Preserve these original layout ideas:

```text
viewport padding
  framed app work surface
    compact icon rail
    route-owned primary canvas
```

Do not turn the app into:

```text
full-bleed expanded/collapsible sidebar
  generic centered placeholder card
```

Use Local Studio themes for:

- token names and aliases;
- dark/light surfaces;
- typography scale;
- compact controls;
- active, hover, focus, and disabled states;
- dialog styling.

Use original Context Engine webui for:

- route ownership;
- page frame geometry;
- fixed compact side rail placement;
- chat/documents/graph work-surface proportions;
- compatibility expectations around `/database-visualize`.

## Files Expected To Change

Likely:

```text
webui/src/features/navigation/AppShell.tsx
webui/src/features/navigation/SideRail.tsx
webui/src/app/(app)/chat/page.tsx
webui/src/app/(app)/documents/page.tsx
webui/src/app/(app)/graph/page.tsx
webui/src/app/(app)/database-visualize/page.tsx
webui/src/components/shared/FeaturePlaceholder.tsx
webui/e2e/app-shell.spec.ts
webui/e2e/foundation.spec.ts
```

Create feature-owned placeholder shells if needed:

```text
webui/src/features/chat/
webui/src/features/documents/
webui/src/features/graph/
```

## Tests

- Unit/component coverage for nav and settings behavior remains green.
- Playwright verifies `/chat`, `/documents`, `/graph`, and `/database-visualize` render inside the framed work surface.
- Playwright verifies the rail is compact/fixed and the route title/content does not overlap the rail.
- Playwright verifies dark and light themes keep the framed workspace legible.
- Playwright verifies members still cannot see Operations and direct `/operations` renders forbidden inside the preserved frame.
- Validation notes distinguish dependency/install failures from assertion failures.

## Acceptance Criteria

- FE-001/FE-002 regressions are healed without editing archival reference files.
- The first authenticated viewport clearly reads as the original Context Engine application layout with Local Studio theming.
- Primary routes no longer depend on a generic centered card as their layout.
- `/database-visualize` remains compatible and lands in the preserved graph layout.
- Settings remains accessible and returns focus to the opener.
- Browser storage remains limited to non-secret theme preference.
- `npm run lint`, `npm run test`, and `npm run test:e2e` are run from `webui/`, or the exact environmental blocker is documented with residual risk.
