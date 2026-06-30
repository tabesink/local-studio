# Design Parity Spec — Local Studio Visual Parity

## Visual direction — confirmed

Context Engine must feel like the Local Studio product family while keeping Context Engine's RAG product meaning. Use Local Studio as the reference implementation, not as loose inspiration.

Default UI is a compact, dark-first workstation:

- Theme: `zai-dark` by default; `zai-light` as the matching light equivalent.
- Typography: Geist Sans for UI/body; Geist Mono for IDs, paths, timestamps, model names, code, request IDs, and payload-shaped data.
- Density: 4px rhythm, `24px` small rows, `28px` standard rows/controls where the primitive supports it.
- Surfaces: layered charcoal panels, quiet 1px borders, restrained selected/hover states.
- Shape: Local Studio radius tokens, usually around `7px`; no pill-heavy or large rounded SaaS controls.
- Actions: high-contrast black/white primary, quiet secondary/ghost/icon actions, restrained danger styling.
- Status: `StatusDot`, `StatusPill`, slim progress, compact alert/error rows; color is never the only status signal.

Do not rebuild the old white Context Engine UI. Do not use generic shadcn defaults, card-heavy dashboards, gradients, saturated product panels, decorative illustrations, or bespoke color/radius/spacing values when Local Studio tokens and primitives already exist.

## Source of truth

| Need | Source |
|---|---|
| Canonical Context Engine design rules | `DESIGN.md` |
| Agent-facing UI implementation rules | `docs/design/context_engine_agent_ui_guidelines.md` |
| Visual parity extraction package | `.references/review_docs/local_studio_frontend_review/local-studio-visual-parity-package.md` |
| Local Studio token source | `.references/code/local-studio/frontend/src/app/styles/globals/tokens.css` |
| Local Studio theme runtime | `.references/code/local-studio/frontend/src/lib/themes.ts` |
| Local Studio shared primitives | `.references/code/local-studio/frontend/src/ui/` |
| Local Studio shell patterns | `.references/code/local-studio/frontend/src/features/shell/` |
| Local Studio agent/workspace patterns | `.references/code/local-studio/frontend/src/features/agent/` |
| Local Studio settings patterns | `.references/code/local-studio/frontend/src/features/settings/` |

Resolve UI decisions in this order:

1. Existing Local Studio token.
2. Existing Local Studio primitive.
3. Existing Local Studio screen pattern.
4. Narrow Context Engine variant using the same tokens and primitive grammar.
5. New Context Engine component only when the product concept has no compatible Local Studio pattern.

## Token and primitive transfer

| Context Engine need | Local Studio transfer |
|---|---|
| App shell | Left rail, center work canvas, optional right detail panel. Expanded sidebar `224px`; collapsed rail `48px`. |
| Settings | Local Studio settings layout: left section nav, right panel content, compact form rows, focused modal behavior. |
| Tables/lists | Dense rows with separators, hover/selected state, compact row actions; avoid repeated floating cards. |
| Detail inspection | `right-detail-panel` style for evidence, source chunks, document metadata, graph node detail, operations, and diagnostics. |
| Forms | Shared input/select/form-field grammar; `28px` compact controls; field-level validation; no broad custom form chrome. |
| Buttons | Shared button variants: primary, secondary, danger, ghost, icon; compact heights; no broad blue primary buttons. |
| Status/lifecycle | Shared status/progress grammar for domains, documents, operations, provider tests, stream phases, and health. |
| Errors | Compact `ErrorBox`/alert pattern with safe copy, retry where valid, and request ID only when API returns one. |
| Empty states | One short sentence plus one next action; no decorative illustration by default. |
| Streaming/chat | Local Studio chat/workspace density: stable message frame, anchored composer, evidence in compact blocks or right detail panel. |

## App-shell parity

- Persistent authenticated shell uses a compact left rail with icon+tooltip navigation and a Settings trigger.
- Route content sits in the main work canvas and uses feature-owned controllers/hooks before rendering UI state.
- Right detail panels hold contextual inspection without navigating away for small details.
- Mobile/narrow behavior may collapse the rail and panels, but it must keep the same information hierarchy.
- Admin-only navigation may be hidden for members, but backend authorization remains the authority.

## Interaction rules

| State | Pattern |
|---|---|
| Loading | Preserve layout; use skeleton rows or quiet inline progress. |
| Empty | Short copy, one next action, no illustration by default. |
| Error | Compact safe error, request ID when available, retry only where valid. |
| Disabled | Explain the missing precondition near the control. |
| Destructive | Use danger styling and confirmation when irreversible; name the target object. |
| Admin-only | Hide controls for members and still handle `403` with a forbidden state. |
| Streaming | Stable message frame, explicit stop/cancel, evidence visible without layout jump. |
| Toast | Use for action result acknowledgement, not as the only error surface. |

## Accessibility minimum

- Keyboard-reachable rail, dialogs, tables, tabs, forms, detail panels, and composer controls.
- Visible focus states using Local Studio focus treatment.
- Icon-only controls need labels/tooltips.
- Dialogs have title/description, focus trap, Escape close, and opener focus restore.
- Form labels are tied to controls; validation is field-specific when possible.
- Motion is optional and respects reduced-motion.
- Color is never the only status indicator.

## Visual acceptance checks

Every frontend slice should verify:

- Dark mode at `1440x900` and `1280x800` reads as Local Studio's compact workstation.
- Light mode uses the matching Local Studio token system, not a separate white dashboard design.
- Narrow viewport keeps nav, content, dialogs, and detail panels usable without overlapping text.
- No hard-coded feature colors, spacing, radius, row height, or shadow when a token/primitive exists.
- No old Context Engine white-canvas styling, giant cards, gradients, large rounded panels, or saturated status backgrounds.
