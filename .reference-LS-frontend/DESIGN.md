# Local Studio UI Design System — Template Parity Guide

> **Status:** Source of truth for UI work in `templates/nextjs-feature-demos`.  
> **Visual reference:** `.references/local-studio/frontend` (read-only).  
> **Priority:** Visual and interaction parity first; demo/fixture logic second; personal design preference last.

Local Studio is a compact, dark-first Codex-like desktop workstation. The templates in this repository carbon-copy that system. Apps built from these templates change **labels and data**, not the foundational visual grammar. Never introduce an independent white SaaS/admin aesthetic.

---

## Related Documentation

| Need | Document |
| --- | --- |
| Agent implementation rules | `AGENTS.md` |
| Template package overview | `templates/nextjs-feature-demos/README.md` |
| Per-feature implementation guides | `docs/feature-parity/features/<feature>.md` |
| Feature parity package rules | `docs/feature-parity/README.md` |
| Canonical token source | `.references/local-studio/frontend/src/app/styles/globals/tokens.css` |
| Reference shared primitives | `.references/local-studio/frontend/src/ui/` |
| Reference shell | `.references/local-studio/frontend/src/features/shell/` |
| Ported token sheet (live) | `templates/nextjs-feature-demos/_shared/styles/local-studio-tokens.css` |
| Ported primitives (live) | `templates/nextjs-feature-demos/_shared/ui/index.tsx` |

When instructions conflict, use this order:

1. existing Local Studio visual tokens and primitives (the reference source);
2. this document;
3. the feature-specific guide under `docs/feature-parity/features/`;
4. generic shadcn/Tailwind defaults — effectively never.

---

# 1. Governing Rule: Visual Parity, Not Visual Inspiration

Use Local Studio as the reference implementation, not as vague inspiration.

For any UI decision, resolve in this order:

1. Is there an existing Local Studio token?
2. Is there an existing Local Studio primitive?
3. Is there an existing Local Studio screen pattern to mirror?
4. Can a narrow variant extend that primitive without adding a new design language?
5. Only then add a template-specific component.

Never start from generic Tailwind, generic shadcn, a white dashboard template, or a marketing-page aesthetic. The shadcn MCP is available for API lookups only; its default styling never lands here.

## Non-Negotiables

- Default theme is `zai-dark` / dark-first.
- Light theme is the matching `zai-light` system.
- Use Local Studio's token aliases: `--ui-*` for component implementation, plus the compatible `--bg`, `--fg`, `--surface`, `--rail`, `--border`, `--accent`, `--dim`, `--ok`, `--warn`, and `--err` aliases where existing primitives use them.
- Never hard-code a color, spacing value, radius, or row height in a feature when the token system already expresses it.
- Do not use saturated color cards, gradients, decorative illustrations, large rounded surfaces, or full-pill controls unless a Local Studio reference already uses them.
- Preserve dense workstation behavior: small controls, calm surfaces, controlled contrast, compact metadata, and information-rich rows.

---

# 2. Reference Implementation

The source implementation lives in this repo under `.references/local-studio/`. Use it as read-only reference code for concrete tokens, primitives, shell geometry, and interaction patterns:

```text
.references/local-studio/frontend/src/app/styles/globals/tokens.css
.references/local-studio/frontend/src/app/layout.tsx
.references/local-studio/frontend/src/lib/themes-data.ts
.references/local-studio/frontend/src/ui/
.references/local-studio/frontend/src/features/shell/
.references/local-studio/frontend/src/features/dashboard/
.references/local-studio/frontend/src/features/settings/
.references/local-studio/frontend/src/features/usage/
.references/local-studio/frontend/src/features/logs/
.references/local-studio/frontend/src/features/chat/
```

Do not edit the reference checkout. Copy or adapt patterns into `templates/nextjs-feature-demos` only.

## Canonical Fonts

```css
--font-geist-sans
--font-geist-mono
```

- Default sans: **Geist**
- Default monospace: **Geist Mono**
- Fallback sans: `system-ui, sans-serif`
- Fallback mono: `ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace`

Use Geist Sans for application chrome, messages, labels, buttons, tables, and page titles.  
Use Geist Mono for code, API routes, model names, paths, IDs, timestamps, token counts, durations, file names, commands, and payloads.

Do not introduce Inter, Roboto, Arial, system-only typography, or a new mono font as the default visual language.

---

# 3. Theme Contract

## 3.1 Dark Mode — Default

Use `zai-dark` as the default theme (`<html data-theme="zai-dark">`).

| Role | Canonical token/value | Usage |
| --- | --- | --- |
| App canvas | `--color-background: #0f0f0f` | Root canvas and central work area |
| Header | `--color-header: #101010` | Compact top bars |
| Panel | `--color-panel: #111111` | Structural side/secondary areas |
| Sidebar / rail | `--color-sidebar: #191919` | Navigation rail and dense left surfaces |
| Raised card | `--color-card: #202020` | Only where a raised surface is needed |
| Popover | `--color-popover: #222222` | Menus, dialogs, popovers |
| Input | `--color-input: #242424` | Inputs, selects, low-elevation controls |
| Subtle surface | `--color-surface: #ffffff0c` | Hoverable/quiet internal surfaces |
| Hover | `--color-hover: #ffffff0f` | Hover background |
| Selected | `--color-selected: #ffffff17` | Selected row, active local context |
| Border | `--color-border: #ffffff14` | Default 1px separator/border |
| Hover border | `--color-border-hover: #ffffff24` | Focus or hover boundary |
| Primary foreground | `--color-foreground: #e7e7e7` | Standard text |
| Brand / primary | `--color-brand: #ffffff` | Main primary action / accent |
| Link / information | `--link: #7ea1c8` | Links, file/URL chips, live status |

Dark mode must read as layered charcoal, not pure black plus bright-blue product chrome.

## 3.2 Light Mode — Equivalent System

Use `zai-light` only as the matching Local Studio light theme. It is not a separate design direction.

| Role | Canonical token/value | Usage |
| --- | --- | --- |
| App canvas | `--color-background: #f4f5f5` | Root canvas |
| Raised alternate canvas | `--color-background-win-alt: #e9ebec` | Secondary window/pane areas |
| Header / panel / card / popover / input | `#fbfbfb` | Main elevated surfaces |
| Sidebar / rail | `--color-sidebar: #eceeee` | Navigation rail |
| Subtle surface | `--color-surface: #0d0d0d08` | Quiet grouping |
| Hover | `--color-hover: #0d0d0d0b` | Hover background |
| Selected | `--color-selected: #0d0d0d12` | Selected local state |
| Border | `--color-border: #0d0d0d1a` | Default 1px separator/border |
| Hover border | `--color-border-hover: #0d0d0d24` | Focus or hover boundary |
| Brand / primary | `--color-brand: #000000` | Primary action / accent |
| Link | `--link: #6b8db5` | Links and information state |

The light theme is warm-neutral/gray, not pure white with blue SaaS panels.

## 3.3 Semantic Color

Semantic color is local, restrained, and never the main page background.

| State | Dark | Light | Use |
| --- | --- | --- | --- |
| Information / active | `#7ea1c8` | sky token | live status, links, active underline, non-destructive attention |
| Success | `#46bf72` | `#1e8a3e` | complete, ready, healthy, running |
| Warning | `#d48a4c` | `#e07b00` | paused, queued with attention, degraded |
| Danger | `#ff5c5c` | `#e03131` | failed, blocked, destructive action |
| Neutral | foreground-muted token | foreground-muted token | idle, stopped, unavailable, unknown |

Use semantic color through `StatusDot`, `StatusPill`, a text accent, a 1–2px local border, a small icon, a slim progress fill, or a compact error/success row.

Do **not** use semantic color as a full-card fill, page section background, navigation rail color, hero treatment, or broad dashboard decoration.

---

# 4. Typography

## 4.1 Core Scale

Use the Local Studio CSS variable ramp. These are the source sizes at `--ui-scale: 1`.

| Token | Base size | Primary role |
| --- | ---: | --- |
| `--fs-2xs` | 9px | micro metadata only |
| `--fs-xs` | 10px | dense metadata, counts, compact state |
| `--fs-sm` | 11px | row metadata, dense labels |
| `--fs-md` | 12px | compact controls and navigation |
| `--fs-base` | 13px | normal workstation body text |
| `--fs-lg` | 14px | readable body, tabs, prominent labels |
| `--fs-xl` | 16px | page/navigation emphasis |
| `--fs-2xl` | 18px | page title |
| `--fs-3xl` | 20px | large page title / key empty state |
| `--fs-4xl` | 24px | rare emphasis only |
| `--fs-display` | 34px | startup or exceptional display treatment only |

Use `text-[length:var(--fs-*)]` or the shared component implementation. Do not assume generic Tailwind `text-sm` maps to the product's compact scale.

## 4.2 Weight and Leading

```css
--weight-normal: 400;
--weight-medium: 500;
--weight-strong: 600;
--leading: 1.5;
--leading-tight: 1.25;
```

Rules:

- Use 400 for body, metadata, normal labels.
- Use 500 for active navigation, section headers, tabs, selected values.
- Use 600 for compact button labels and decisive page titles.
- Do not default to 700/800/900.
- Use `--leading` for body/multi-line explanation; `--leading-tight` for titles, compact rows, single-line control labels.
- Make hierarchy through position, spacing, and contrast before increasing weight or size.

## 4.3 Text Roles

| Role | Font | Size | Weight | Notes |
| --- | --- | ---: | ---: | --- |
| Page title | Geist Sans | 18–20px | 500–600 | Short and functional |
| Section heading | Geist Sans | 13–16px | 500 | Quiet, not display-like |
| Navigation item | Geist Sans | 12–14px | 400–500 | Dense and scannable |
| Button label | Geist Sans | 12–14px | 600 | Existing size variant decides exact size |
| Body | Geist Sans | 13–14px | 400 | Explanatory content |
| Table primary cell | Geist Sans | 12–13px | 400–500 | Avoid oversized rows |
| Metadata | Geist Mono | 9–12px | 400–500 | Paths, IDs, timing, model/version |
| Code/API content | Geist Mono | 12–14px | 400 | Payloads, snippets, commands |
| Section label / overline | Geist Sans/Mono | 9–13px | 500 | `0.14–0.18em` tracking where the reference uses it |

No generic all-caps taxonomy. All caps is reserved for small, pre-existing section-label patterns (e.g. mono `--fs-2xs` uppercase strip headers on the dashboard/usage pages).

---

# 5. Geometry, Spacing, and Shape

## 5.1 Base Rules

```css
--space-base: 4px;
--radius-base: 7px;
--border-width: 1px;
--ui-control-h: 28px;
--row-h: 28px;
--row-h-sm: 24px;
```

Use a 4px-based rhythm: `4, 8, 12, 16, 20, 24, 28, 32`.

Do not make screens spacious by default. This is a desktop workbench; density should remain readable but operational.

## 5.2 Radius Ramp

At the default 7px base radius:

| Token | Approx. value | Use |
| --- | ---: | --- |
| `--rad-2xs` | 1.75px | exceptional micro details (dashboard action buttons, thin bars) |
| `--rad-xs` | 3.5px | tiny local elements, badges, swatches |
| `--rad-sm` | 5.25px | compact inner elements |
| `--rad-md` | 5.25px | active rows, segmented items |
| `--rad-lg` | 7px | buttons, inputs, panels |
| `--rad-xl` | 10.5px | larger contained areas |
| `--rad-2xl` | 14px | exceptional large container |
| `--rad-3xl` | 21px | avoid unless a reference pattern needs it |
| `--rad-full` | 9999px | never default UI chrome (send button is a reference exception) |

The composer uses its own `--composer-radius: 18px`.

## 5.3 Shell Geometry

| Region | Canonical geometry |
| --- | --- |
| Expanded sidebar | `224px` (`--sidebar-w`), resizable 188–320px |
| Collapsed sidebar | `48px` (`--sidebar-w-collapsed`) or width 0 with a floating expand button |
| Standard dense row | `28px` |
| Small dense row | `24px` |
| Standard compact inline control | `28px` (`h-7`) |
| Sidebar header | `h-10` |
| Conversation thread max width | `900px` (`--thread-w`) |
| Composer width at desktop | `clamp(25vw, 46rem, 50vw)` (`--composer-w`) |
| Settings layout | `max-w-5xl`, `200px` sticky nav + `minmax(0, 640px)` content |
| Wide telemetry pages | `max-w-[86rem]` |
| Agent computer panel | `440px` default, left-edge resize, min `max(280px, 25vw)`, max `65vw` |
| Agent pane grid | binary split tree, separator drag ratio clamped `0.15–0.85` |
| Recipe editor drawer | `880px` right drawer, `bg-black/50 backdrop-blur-sm` scrim |

Preserve the workstation shell: `left navigation rail | primary work canvas | optional right detail panel`.

---

# 6. Surface, Border, and Elevation Rules

## 6.1 Surfaces

Use hierarchy through close dark (or light) neutrals, not cards inside cards.

| Layer | Token | Typical use |
| --- | --- | --- |
| Root canvas | `--color-background` | page base |
| Rail | `--color-sidebar` | persistent navigation |
| Structural panel | `--color-panel` | side and secondary containers |
| Raised component | `--color-card` | modal/card only where needed |
| Input/control | `--color-input` | editable controls |
| Quiet grouping | `--color-surface` | local hover/selected support |

Use `1px` tokenized borders sparingly. Dense lists and tables should prefer separators and row hover states rather than individual floating cards. `ListGroup` draws inset hairline separators between rows (`before:` pseudo elements starting at `left-3.5`).

## 6.2 Shadows

Default: no shadow.

Permitted reference behavior:

- `shadow-sm` on active segmented-control items;
- `shadow-[0_1px_0_rgba(255,255,255,0.025)_inset]` on `ListGroup` bodies;
- composer/floating tray only: dark `0 18px 42px rgba(0,0,0,0.42)`, light `0 12px 36px rgba(0,0,0,0.06)` (`--composer-shadow`).

Do not introduce dashboard-card shadows, floating tile shadows, or multi-level elevation systems.

---

# 7. Component Grammar

Build from `templates/nextjs-feature-demos/_shared/ui` before creating feature variants. Those primitives are one-to-one ports of `.references/local-studio/frontend/src/ui/*`.

## 7.1 Buttons

| Variant | Visual role | Use |
| --- | --- | --- |
| `primary` | high-contrast foreground/background inversion | create, run, submit, confirm |
| `secondary` | bordered low-emphasis action | normal utility action |
| `danger` | red text, quiet danger treatment | delete, stop destructive action |
| `ghost` | low-chrome local action | secondary in-row action |
| `icon` | compact icon-only action | panel/header/row tool |

Also available: `SettingsButton` (h-7 compact control for settings rows, tones default/primary/danger) and `IconButton` (28px icon-only, sidebar/header idiom). The dashboard uses its own mono uppercase `ActionBtn` recipe (`h-7`, `--rad-2xs`, bordered).

Rules: 600 label weight on `Button`; compact sizes; primary is foreground-inverted (white on dark / black on light), never broad blue; avoid full-pill buttons.

## 7.2 Inputs and Selects

- Standard compact control target: `h-7`/`h-8` (28–32px).
- Shape: `rounded-md`.
- Surface: `--ui-bg` / `--color-input`, never bright white in dark mode.
- Border: `--ui-separator`; focus uses restrained `--ui-accent`/`--ui-info` alpha borders, not thick rings.
- Use mono treatment only when the value itself is developer data (URLs, keys, paths).

## 7.3 Tabs and Segmented Controls

| Pattern | Use |
| --- | --- |
| Underline tabs | primary content sections within a page/detail surface (Server Logs / API Docs) |
| Pill tabs | local choice inside a contained panel (usage source tabs) |
| Button-group tabs | explicit mode/state choice where boundaries improve clarity |
| Segmented control | small binary/small-set choices (theme mode, logs/server switch) |

Do not invent a fourth tab style.

## 7.4 Lists, Tables, and Rows

- Rows target 24px or 28px height whenever content allows.
- Primary data left-aligned; status, compact metadata, and actions align right.
- Use muted mono for IDs, model names, paths, token counts, timestamps, durations.
- Active rows: restrained selected surface + `rounded-md` where the reference applies it; sidebar active rows add a 2px left hairline accent.
- Hover: tokenized hover surface, not an animated card lift.
- Do not wrap every row in a card.

## 7.5 Status Dots and Status Pills

| Tone | Examples |
| --- | --- |
| `default` | stopped, idle, unknown, disabled |
| `info` | starting, running job, live stream |
| `good` | ready, connected, enabled, ok |
| `warning` | queued, degraded, needs action |
| `danger` | failed, offline, unreachable |

Use dot form where text already communicates state; badge form only when the state label must remain visible in a dense list. No full-color status cards. Pair color with text or icon for accessibility.

## 7.6 Cards and Panels

Cards are exceptions, not the base layout. Use dividers/list rows for most settings, jobs, and lists. Avoid nested cards. A page should feel like a continuous workstation surface — the dashboard is explicitly "one continuous operator sheet" with hairline section rules, no outer card.

## 7.7 Progress

Compact, thin, neutral track, semantic current-state fill, exact numeric/word label nearby. GPU memory bars are 2–3px tall. No giant animated loaders or gradient bars.

---

# 8. Template Feature Mapping

Each slice in `templates/nextjs-feature-demos/features/` mirrors specific reference screens. Use these as the parity checklist:

| Slice | Reference screens | Key primitives/patterns |
| --- | --- | --- |
| `navigation-sidebar` | `features/shell/left-sidebar.tsx` | 224px resizable rail, h-10 header, h-8 nav rows with left hairline accent, Cmd+K overlay, mobile drawer |
| `recipes-models` | `features/recipes/recipes-content/*`, `recipe-modal/*` | `SettingsLayout` + model-page grammar (`ModelSection`/`ModelRow`), engine badges on node tokens, 880px editor `Drawer`, `UiModal` delete confirm, explore shine rows, download queue |
| `setup-wizard` | `features/setup/setup-view/*`, `use-setup.ts` | full-page `max-w-5xl` wizard, `h-8 w-8` numbered stepper circles, `Card`/`Alert`/`FactGrid` steps, `h-2` download bar, benchmark 4-fact grid |
| `agent-workspace` | `features/agent/ui/*`, `tools/*`, `sessions/*` | `--agent-bg` shell, binary-split pane grid (0.15–0.85), 440px computer panel with 9 tabs, ⌘K palette `w-[min(720px,92vw)] rounded-2xl`, composer extras (steer/queue, chips, model picker) |
| `dashboard` | `features/dashboard/control-panel/*` | continuous telemetry sheet: status header + tags, six-column mono metric strip, GPU aggregate + rows, controller matrix, mono log tail, launch toast |
| `settings-panel` | `features/settings/settings-view.tsx`, `ui/settings.tsx` | `SettingsLayout` two-column shell, 7 sections with lucide icons, hash selection |
| `environment-controls` | `features/settings/api-connection-section.tsx` | radio controller rows, masked key + reveal, inline add row, Test / Save active |
| `logs-observability` | `features/logs/logs-view.tsx`, `features/server/server-view.tsx` | 18rem session sidebar, mono severity-colored pane, header controls, server status aside + tabs |
| `usage-cost-reporting` | `features/usage/usage-page.tsx` + chart/table modules | source pill tabs, USAGE header, `HeaderStat` strip, stacked CSS bar chart, sortable expandable table |
| `chat-shell` | `features/chat/chat-pane.tsx`, `timeline.tsx`, `agent-composer-frame.tsx` | block timeline, lifted composer on `--composer-*` tokens, cwd/git/tokens status bar |
| `user-preferences` | `features/settings/appearance-settings.tsx`, `lib/themes-data.ts` | theme mode segmented control, swatch theme rows, token editor, density sliders |
| `admin-configuration` | `features/settings/system-settings-section.tsx`, `engines-section.tsx`, `features/plugins/plugins-page.tsx` | fact groups, runtime targets + jobs, plugins manager (manual add, MCP JSON, curated) |

All slices are fixture-backed: `api/` modules simulate latency and streams over typed `fixtures/`. No real controllers, databases, or auth.

---

# 9. Motion and Interaction

Motion is brief and functional.

Allowed: opacity/background transition on hover, disclosure expansion/collapse, row insertion/removal, local progress updates, panel/drawer open and close, sidebar width transition (150ms ease-out, disabled while dragging).

Avoid: bounce easing, card lift, pulsing decoration (the status dot pulse while loading is a reference exception), large gradient animation, automatic route-level movement, "AI magic" effects.

The animated gradient text treatment is an exceptional startup treatment only.

---

# 10. Accessibility and State Integrity

- Do not communicate state by color alone.
- Keep keyboard focus visible through tokenized borders/rings.
- Use real labels for inputs; placeholders do not replace labels.
- Icon-only controls need accessible names/tooltips (`aria-label` + `title`).
- Preserve contrast in both themes.
- Loading, failed, and completed lifecycle states must remain understandable to screen-reader and keyboard users.

---

# 11. Implementation Rules for Coding Agents

## 11.1 Token First

Before writing a class, check whether the value already exists:

```text
color → --ui-* / --color-* / legacy alias (--bg/--fg/--dim/--surface/--border/...)
type → --fs-* / --font-geist-*
radius → --rad-*
spacing → 4px rhythm
height → --ui-control-h / --row-h / --row-h-sm
state → StatusDot / StatusPill / existing status tone
layout → AppPage / PageHeader / SettingsLayout / ListGroup / Table
```

## 11.2 Primitive First

Use shared primitives from `templates/nextjs-feature-demos/_shared/ui` before adding a local equivalent:

```text
Button / SettingsButton / IconButton
Input / Select / Textarea / Checkbox / SearchInput
SettingsInput / SettingsTextarea
SegmentedControl / Tabs
Table / THead / TBody / TRow / TH / TCell
ListGroup / ListRow / RowValue / KeyValueRow / EmptySafeNotice
AppPage / PageHeader / SectionNav / RefreshIconButton
SettingsLayout / SettingsGroup / SettingsRow / SettingsValue / SettingsFactRows / SettingsNotice / SettingsActions
ModelSection / ModelRow / ModelValue / ModelStatus / ModelButton / ModelInput
Card / Alert / FactGrid
UiModal / UiModalHeader / Drawer / DrawerHeader / DrawerBody / DrawerFooter
ProgressBar / Stat / SectionLabel
StatusDot / StatusPill
```

A feature-specific component may compose these primitives but must not recreate their token system.

## 11.3 Variant Rule

Create a new variant only when:

1. an existing primitive cannot express the required accessible state,
2. the behavior will appear in more than one slice,
3. it is documented here or added here in the same change,
4. it inherits tokens and geometry from the base primitive.

Do not create a variant for one isolated screen.

## 11.4 Prohibited Drift

Do not add:

- `rounded-full` as a default,
- arbitrary `bg-*` brand colors,
- page-level gradients,
- shadows on ordinary cards,
- 32–44px controls where 28px dense controls fit,
- new UI font families,
- oversized headings,
- per-feature CSS variables that duplicate global tokens,
- generic shadcn default colors/radius when Local Studio tokens already exist,
- nested panels just to create visual separation.

---

# 12. Visual Acceptance Checklist

Before merging a template UI change, verify:

## Theme

1. Dark mode uses the Local Studio dark token system by default (`data-theme="zai-dark"`).
2. Light mode uses its matching Local Studio light tokens.
3. No hard-coded feature color overrides a semantic/global token.

## Typography

4. Geist / Geist Mono are used correctly.
5. Compact `--fs-*` scale is used, not arbitrary browser/default sizes.
6. Weight hierarchy stays within 400 / 500 / 600.
7. Paths, IDs, commands, models, timestamps, and payloads use mono.

## Geometry

8. Compact rows and inline controls respect 24px/28px geometry.
9. Sidebar, work canvas, and page max widths preserve workstation proportions.
10. Radius values come from `--rad-*`; full pills are exceptional.

## Components

11. Existing primitives are used before new components.
12. Status uses dots/pills and text, not colored panels.
13. Tables/lists use dividers and quiet selection, not card grids.
14. Primary action remains high-contrast monochrome, not default blue.

## Behavior

15. Hover, focus, disabled, loading, error, and empty states are complete.
16. Long-running state uses compact progress and fixture-confirmed status.
17. No visual embellishment hides operational information.

## Visual Regression

18. Compare changed routes to the reference source at `1440 × 900` dark, `1440 × 900` light, `1280 × 800` dark, and a narrow width for responsive surfaces.
19. Review differences for font rendering, density, surface stack, border contrast, control height, radius, sidebar width, status semantics, and accidental generic shadcn styling.

---

# 13. Short Agent Prompt

Use this for slice implementation:

> Build this template slice with Local Studio visual parity. First inspect `.references/local-studio/frontend/src` for the closest existing token, primitive, shell geometry, or screen pattern, and the matching guide in `docs/feature-parity/features/`. Use the existing dark-first `zai-dark` / `zai-light` token system from `templates/nextjs-feature-demos/_shared/styles/local-studio-tokens.css`, Geist and Geist Mono, the compact `--fs-*` scale, 4px rhythm, 7px base radius, 24/28px dense row/control geometry, and the shared primitives in `templates/nextjs-feature-demos/_shared/ui`. Keep the slice's folder contract (components/hooks/api/types/fixtures/constants) and keep it fixture-backed. Use tokenized subtle surfaces, 1px borders, quiet monochrome primary actions, Local Studio status dots/pills, compact tables/lists, and no generic dashboard cards, gradients, full pills, or arbitrary colors. Your app changes data and copy only; it does not introduce a competing visual language.
