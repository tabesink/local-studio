# Design Parity Spec

## Visual direction — Confirmed

Quiet white developer workbench. Dense but breathable. Flat surfaces. Small radius. Thin neutral borders. Minimal decoration.

## Tokens — target mapping

| Token | Target |
|---|---|
| Font | system sans stack; no display font requirement confirmed |
| Page bg | white / very light neutral |
| Rail bg | white or faint neutral tint |
| Primary text | dark neutral |
| Secondary text | muted neutral |
| Border | low-contrast neutral |
| Accent | restrained product/action color only |
| Radius | `rounded-md` baseline |
| Shadow | almost none; only overlays/dialog separation |
| Spacing | compact 4px scale; page gap 16–24px |
| Titles | 20–22px page title; smaller section labels |
| Icons | compact outline icons; rail-size controls |

## App-shell parity

- Narrow fixed rail near `w-14`.
- Logo top. Primary nav stacked. Settings control bottom/rail.
- Active item: quiet filled/tinted state, not heavy card.
- Content pane: white; title/subtitle then dense work surface.
- Desktop Settings: `220px` left nav + right panel. Mobile: one-column dialog/sheet behavior.
- Avoid card grids where table/list/form surface reads clearer.
- Dialog: Radix-style focus containment, Escape close, opener focus restore, accessible title/description, active section `aria-current`.

## Interaction rules

| State | Pattern |
|---|---|
| Loading | skeleton/inline progress; preserve layout |
| Empty | direct empty copy + one next action |
| Error | compact alert, safe message, retry where valid |
| Disabled | explain missing precondition |
| Destructive | explicit label + confirmation only if irreversible |
| Admin-only | hide nav/control; backend still rejects |
| Streaming | stable message frame; append text; source block visible before/final completion |
| Toast | action result only; not sole error surface |

## Accessibility minimum

- Keyboard reachable rail/dialog/table controls.
- Visible focus ring.
- Icon-only controls have labels/tooltips.
- Form labels tied to controls.
- Dialog has title/description.
- Motion optional/reduced.
- Color never sole status signal.
