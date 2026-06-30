# Context Engine UI Design System - Local Studio Visual Parity

Status: approved source of truth for Context Engine UI implementation.

Context Engine must keep the old Context Engine information architecture where it is useful: public login, authenticated app rail, Chat, Documents, Graph, Operations, and a Settings dialog with panels. It must not keep the old white dashboard aesthetic. The target visual language is Local Studio: compact, dark-first, dense, tokenized, and workstation-like.

## Governing Rule

Resolve UI decisions in this order:

1. Existing Local Studio token.
2. Existing Local Studio primitive.
3. Existing Local Studio screen pattern.
4. Narrow Context Engine variant using the same primitive grammar.
5. New component only when no compatible pattern exists.

Do not start from generic Tailwind, generic shadcn defaults, marketing layouts, decorative cards, saturated panels, gradients, or broad blue SaaS controls.

## Theme

- Default theme: `zai-dark`.
- Light theme: `zai-light`.
- Fonts: Geist Sans for UI/body; Geist Mono for IDs, timestamps, API routes, model names, paths, logs, and payload-shaped data.
- Rhythm: 4px spacing; common row heights `24px` and `28px`.
- Radius: Local Studio radius tokens, usually around `7px`.
- Surfaces: layered charcoal panels, quiet 1px borders, restrained hover/selected states.
- Status: `StatusDot`, `StatusPill`, slim progress, compact alert rows; color is never the only signal.

## Layout Mapping

| Context Engine surface | Layout pattern |
| --- | --- |
| Authenticated app | Compact left rail, main work canvas, optional right detail panel |
| Settings | Dialog with left section nav and compact right panel forms/tables |
| Documents | Dense table/list, selected row detail, upload dialog, status/progress rows |
| Chat | Conversation/thread region, anchored composer, evidence blocks or right detail panel |
| Graph | Work canvas with graph viewport and right detail inspector |
| Operations | Dense operations table with detail/retry/cancel affordances |
| Audit/diagnostics | Compact logs/status surfaces with safe metadata only |

## Component Rules

- Buttons use shared variants: primary, secondary, danger, ghost, icon.
- Icon-only controls need accessible labels/tooltips.
- Shared UI primitives never call API.
- Feature modules own endpoint wrappers and state mapping.
- API DTOs are mapped at feature boundaries; components do not ingest DB models.
- Use one status map per entity. Document state and operation state stay separate.
- Loading preserves layout with skeleton rows or quiet inline progress.
- Empty states use one short sentence plus one next action.
- Error states show safe copy and request ID when available. Never render stack traces, raw provider errors, secrets, paths, raw LightRAG payloads, prompts, or source text.

## Visual Acceptance

Each frontend slice must verify:

- dark mode at `1440x900` and `1280x800` reads as Local Studio's compact workstation;
- light mode uses the matching Local Studio token system;
- narrow viewport keeps navigation, content, dialogs, composer, and detail panels usable without overlap;
- no hard-coded feature colors, spacing, radius, row height, or shadow when a token/primitive exists;
- no old Context Engine white-canvas styling, giant cards, gradients, large rounded panels, or saturated status backgrounds.

## Reference Evidence

- `.references/DESIGN.md`
- `.references/local-studio-visual-parity-package.md`
- `.references/code/local-studio/frontend/src/app/styles/globals/tokens.css`
- `.references/code/local-studio/frontend/src/lib/themes.ts`
- `.references/code/local-studio/frontend/src/ui/`
- `.references/code/local-studio/frontend/src/features/shell/`
- `.references/code/local-studio/frontend/src/features/settings/`
- `.references/code/client`
