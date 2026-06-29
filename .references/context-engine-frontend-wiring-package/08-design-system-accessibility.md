# Dark-First Design System + Accessibility Reconciliation

## Target visual direction

| Trait | Origin | Target decision |
|---|---|---|
| Dark-first application canvas | Local Studio | Adopt as default visual language. |
| Geist / Geist Mono-like system typography | Local Studio | Adopt after package/font licensing/build review; do not ship font files from reference. |
| Compact density | Both references | Keep dense, readable, operational. |
| 4px spatial rhythm / small radius | Local Studio style | Use tokenized spacing/radius; do not hard-code per feature. |
| Quiet borders, subtle surface separation | Both | Prefer surface hierarchy over card overload. |
| Context Engine rail/settings/chat shapes | Old CE | Retain concepts, recolor/recompose for dark shell. |
| 224px desktop sidebar / 56px responsive icon representation | Local Studio + CE rail compromise | No persisted user preference in first shell slice. |
| Narrow inspector/evidence panel | Local Studio + old CE | Metadata-first; source opening gated. |

## Tokens

Create semantic tokens. Do not scatter literal colors or copy a stylesheet blindly.

```css
--ce-bg-app
--ce-bg-panel
--ce-bg-elevated
--ce-border-subtle
--ce-border-strong
--ce-text-primary
--ce-text-muted
--ce-text-danger
--ce-focus-ring
--ce-status-success
--ce-status-warning
--ce-status-danger
--ce-radius-sm
--ce-radius-md
--ce-space-1 .. --ce-space-8
```

Implementation constraints:

```text
Use semantic names, not component-specific colors.
Do not encode authorization/state in color alone.
Do not introduce arbitrary chart/status palettes before graph API exists.
Keep contrast and focus visibility testable.
```

## Shell

```text
Desktop
┌──────────── Sidebar ────────────┬──────── Main workbench ────────┬─ optional inspector ─┐
│ logo / identity                 │ route title / context          │ evidence / detail      │
│ Chat                            │ feature content                │ metadata only initially│
│ Sources                         │                                │                         │
│ Knowledge Graph                 │                                │                         │
│ Settings                        │                                │                         │
└─────────────────────────────────┴────────────────────────────────┴─────────────────────────┘
```

Rules:

- Sidebar labels remain visible at desktop width; compact representation is responsive, not a stored preference.
- Main pane owns scroll context where possible.
- Inspector is optional and must not hide core task completion.
- Avoid nested-card grids inside dialog/table/workbench surfaces.

## Status language

Use text plus icon/shape. Never use color alone.

| Domain/source truth | Suggested user label |
|---|---|
| running + healthy + available | Available |
| running + health stale/unknown | Status unknown |
| stopped | Stopped |
| deleting | Deletion in progress |
| source pending / prep queued | Preparing |
| source prepared / index queued | Ready for indexing |
| source index accepted | Indexing |
| source index ready | Available for retrieval |
| failed | Needs attention |
| cancelled | Cancelled |

Do not show a label unless the server state supports it.

## Dialogs, drawers, and destructive actions

- Desktop Settings: accessible dialog with focus trap, Escape, overlay close, focus restore.
- Small screens: full-height sheet/page fallback.
- Confirmation dialogs name the human display label, never only a raw ID.
- Async destructive actions display pending/server truth; do not optimistically erase rows.
- Never place secrets, provider endpoints, storage paths, or raw error payload in dialogs/toasts.

## Tables and lists

- Dense, readable rows; filename/title primary; timestamps/status secondary.
- Long safe message gets truncation plus accessible full description.
- Use row action menus sparingly.
- Empty states explain next action only when user may perform it.
- Admin-only controls must be absent for members, but API remains authority.

## Accessibility non-negotiables

```text
keyboard-operable navigation, dialogs, lists, selection controls
visible focus ring on dark surfaces
labels and descriptions for inputs/errors
status text not color-only
screen-reader title for icon-only compact rail controls
focus restore after dialog close
no raw streaming DOM churn that steals focus
list fallback for graph visualization
safe markdown rendering; no raw HTML injection
```

## Responsive rule

Do not solve mobile with a second product shell. Reflow existing hierarchy:

```text
sidebar -> compact rail or overlay
settings dialog -> sheet/page
inspector -> inline/collapsible region
wide tables -> horizontally scrollable or labeled stacked rows
```
