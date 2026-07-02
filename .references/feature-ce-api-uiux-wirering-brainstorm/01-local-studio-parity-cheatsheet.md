# Local Studio Parity Cheatsheet

Apply to surfaces **ported from old CE client**. Copy **patterns**, not LS product routes (Status/Usage/Recipes).

**Port map:** `02-ce-client-port-map.md` — which CE files supply structure.

## Two-Source Rule

```text
Structure / routes / PDF split / graph canvas  ←  context-engine/client
Colors / type / density / primitives           ←  local-studio + DESIGN.md
```

## Token + Theme Sources

```text
.references/code/local-studio/frontend/src/app/styles/globals/tokens.css
.references/code/local-studio/frontend/src/lib/themes.ts          → zai-dark (default), zai-light
.references/code/local-studio/frontend/src/ui/                     → shared primitives
```

## Shell Geometry (from DESIGN.md + LS)

| Region | Size | LS reference |
| --- | --- | --- |
| Expanded rail | 224px | `features/shell/left-sidebar.tsx` (`SIDEBAR_DEFAULT_WIDTH`) |
| Collapsed rail | 48px | same file |
| Row height | 28px / 24px compact | `ui/list.tsx`, `ui/table.tsx` |
| Control height | 28px (`h-7`) | `ui/button.tsx`, `ui/input.tsx` |
| Right panel | `min(560px, calc(100vw-64px))` | `ui/right-detail-panel.tsx` |
| Composer width | `clamp(25vw, 46rem, 50vw)` | agent composer patterns |

## Primitive → CE Use

| LS primitive | Path | CE screen |
| --- | --- | --- |
| `Button` | `ui/button.tsx` | all actions; primary = fg/bg invert, not blue |
| `Input`, `Select`, `Textarea` | `ui/input.tsx` etc. | settings, login, forms |
| `Table`, `ListGroup`, `ListRow` | `ui/table.tsx`, `ui/list.tsx` | documents, domains, ops, audit |
| `StatusDot`, `StatusPill` | `ui/status.tsx` | domain/source/index/job state |
| `SettingsLayout`, `SettingsRow` | `ui/settings.tsx` | settings dialog panels |
| `RightDetailPanel` | `ui/right-detail-panel.tsx` | doc detail, evidence, ops log |
| `Modal` | `ui/modal.tsx` | upload, delete confirm, create domain |
| `PageState` | `ui/page-state.tsx` | loading / empty / error |
| `ErrorBox` | `ui/error-box.tsx` | API failures |
| `ProgressBar` | `ui/progress-bar.tsx` | prep/index progress |
| `MarkdownContent` | `ui/markdown-content.tsx` | chat answers, evidence excerpts |
| `SearchInput` | `ui/search-input.tsx` | document list filter |
| `Tabs`, `SegmentedControl` | `ui/tabs.tsx` | detail panel sections |

## Screen Pattern → CE port + LS restyle

| CE screen (port from) | CE reference | LS restyle with |
| --- | --- | --- |
| App shell + icon rail | `client/.../AppSideRail.tsx`, `AppPageFrame.tsx` | LS tokens on same w-14 geometry |
| Settings dialog | `client/.../SettingsDialog.tsx` | `ui/settings.tsx` rows |
| Documents + PDF panel | `client/.../DocumentRoute.tsx`, `DocumentPreviewPanel.tsx`, `DocumentPdfPreview.tsx` | `ui/table.tsx`, panel tokens |
| Graph workspace | `client/.../GraphViewer.tsx`, `components/graph/*` | popover/card tokens on float controls |
| Chat 2-col shell | `client/.../LightRagChatShell.tsx`, `SidePanel.tsx` | agent composer + `markdown-content` |
| Route chrome | `client/.../route-page-chrome.tsx` | drop `bg-white`; use `--color-background` |
| Operations/logs (new) | — (no old CE route) | `features/logs/logs-view.tsx` |

## Status Tone Mapping

```text
default  → stopped, idle, unknown, cancelled
info     → starting, running, preparing, indexing, querying
good     → ready, prepared, indexed, complete, healthy
warning  → queued, paused, degraded, deleting (pending)
danger   → failed, blocked, config invalid
```

Always pair color with text/icon (`StatusDot` + label).

## Typography Quick Ref

| Content | Font | Size |
| --- | --- | --- |
| Nav, buttons, body | Geist Sans | 12–14px (`--fs-md` … `--fs-lg`) |
| IDs, timestamps, models | Geist Mono | 9–12px (`--fs-2xs` … `--fs-sm`) |
| Page title | Geist Sans | 18–20px, weight 500–600 |

## Anti-Patterns (do not ship)

```text
✗ white SaaS dashboard defaults
✗ large rounded pill buttons
✗ saturated status cards as row backgrounds
✗ nested cards in lists
✗ browser-stored auth tokens
✗ client-side eligibility / lifecycle inference
✗ direct LightRAG / storage / provider calls from browser
```

## Visual Acceptance

Check dark + light at `1440×900`, `1280×800`, narrow viewport. Compare against LS reference, not generic Tailwind defaults.
