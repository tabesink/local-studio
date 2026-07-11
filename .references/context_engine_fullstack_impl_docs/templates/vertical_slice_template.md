# Slice NN — Name

## User outcome

## In scope
- 

## Explicitly out of scope
- 

## Routes affected
- 

## Frontend modules
- 

## API contracts consumed
- 

## Data models
- 

## Authorization behavior

## UI states
- Loading:
- Empty:
- Error:
- Unauthenticated:
- Forbidden:
- Success:

## UI parity and Local Studio transfer

Use `DESIGN.md`, `docs/design/context_engine_agent_ui_guidelines.md`, `.references/review_docs/local_studio_frontend_review/local-studio-visual-parity-package.md`, and `.references/code/local-studio/frontend/` before inventing visual patterns.

| Concern | Required transfer |
|---|---|
| Theme | `zai-dark` default; `zai-light` matching light mode. |
| Tokens | Local Studio `--ui-*` aliases and compatible semantic aliases; no feature-local hard-coded colors/spacing/radius. |
| Typography | Geist Sans for UI/body; Geist Mono for IDs, paths, timestamps, model names, request IDs, and payload-shaped metadata. |
| Density | 4px rhythm, `24px` compact rows, `28px` controls/standard rows where primitive supports it. |
| Surfaces | Layered charcoal panels, quiet borders, subtle selected/hover states; no white-canvas dashboard shell. |
| Components | Reuse/adapt Local Studio primitives before adding Context Engine variants. |
| Detail | Prefer right detail panel/drawer for contextual inspection. |
| Accessibility | Keyboard reachability, focus state, labels/tooltips, dialog title/description, Escape close, and focus restore. |

## Implementation shape

```text
route → feature shell → feature hook/controller → typed API client → rendered state
```

## Slice-specific UI contract
- 

## Visual acceptance checks
- Dark mode at `1440x900` and `1280x800` reads as Local Studio's compact workstation.
- Light mode uses the matching Local Studio token system.
- Narrow viewport has no overlapping nav/dialog/detail/composer/table content.
- No old white-canvas UI, giant cards, gradients, or saturated status backgrounds.

## Acceptance criteria
- 

## Tests
- Success:
- Validation:
- Unauthenticated:
- Unauthorized:
- Network/API:
- Edge:

## Test scenarios to create
- 

## Files to modify
- 

## Deliberately not added
- 

## Dependencies
- 

## Evidence / verification
-
