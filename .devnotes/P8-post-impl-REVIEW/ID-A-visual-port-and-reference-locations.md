# ID-A - visual port and reference locations (junior dev explainer)

Parent: [ID-A.md](./ID-A.md)

Related docs: `DESIGN.md`, `specs/04-features/F-009-frontend-delivery/ce-client-port-and-parity.md`, `specs/04-features/F-009-frontend-delivery/context-panel-tabs.md`, `.references/local-studio-tab-patterns.md`, `.references/local-studio-visual-parity-package.md`.

**Question:** Should P9 design a fresh Context Engine UI now that backend P1-P8 is implemented?

## Decision

No. P9 ports old CE structure and restyles with Local Studio visual parity. It does not invent a new information architecture or generic dashboard aesthetic.

Port:

```text
icon rail
/chat
/documents
/database-visualize
Settings dialog
documents inline preview split
graph canvas workspace
chat two-column shell
```

Restyle:

```text
Local Studio dark-first tokens
Geist / Geist Mono
24px/28px dense rows and controls
status dots/pills
compact tables/lists
modals/drawers/right detail panels
quiet borders and restrained surfaces
```

## Source Location Sanity

Active docs name:

```text
.references/code/context-engine/client/
.references/code/local-studio/
```

Observed checkout evidence includes:

```text
.references/ce-local-studio/webui/
.references/code/local-studio-codebase/frontend/
```

Before porting, verify with the reviewer which local paths are approved evidence roots. This is a repo guidance issue, not a license to improvise.

## Why

| Bad path | Good path |
| --- | --- |
| Rebuild as a white admin dashboard. | Local Studio compact workstation grammar. |
| Use Local Studio Status/Usage/Models routes as CE nav. | Keep CE Chat/Documents/Knowledge graph/Settings/Logout rail. |
| Copy old CE white-canvas classes. | Keep old CE geometry only, then restyle. |
| Build cards for every row. | Use dense tables/lists and right detail panels. |
| Add broad purple/blue gradients or decorative panels. | Use tokenized charcoal/light neutral surfaces. |

## Required Visual Rules

| Concern | Rule |
| --- | --- |
| Theme | default dark `zai-dark`; matching `zai-light` support |
| Type | Geist Sans for UI/body; Geist Mono for IDs/timestamps/code-like metadata |
| Controls | 28px compact controls unless existing primitive says otherwise |
| Rows | 24px or 28px dense rows |
| Radius | tokenized 7px base; full pills are exceptional |
| Actions | primary is high-contrast monochrome, not broad blue |
| Status | dot/pill plus text; never color alone |
| Layout | left rail, central canvas, optional right panel |
| Cards | exceptions only; no nested cards |

## Implement Order

1. Confirm source roots.
2. Add/port token foundation before route styling.
3. Add primitives or wrappers only when Local Studio primitive cannot be reused.
4. Port shell geometry and rail order.
5. Restyle route by route with tokens, not arbitrary colors.
6. Run visual checks after each route group.
7. Screenshot dark and light at 1440x900, 1280x800, and narrow viewport.

## Red Flags In PR

- `bg-white`, `text-neutral-*`, or generic shadcn defaults dominate production surfaces.
- Wide text sidebar replaces w-14 icon rail.
- `/database-visualize` is renamed.
- Chat route uses `RoutePageShell` instead of its two-column shell.
- Documents preview moves to a new page.
- New UI uses gradients, broad colored cards, oversized headings, 40px controls, or full-pill buttons.
- Feature CSS hard-codes colors/radius/row heights that DESIGN.md already covers.
- Text overlaps, clips, or changes layout at required viewport sizes.

## Tests

- Screenshot shell/nav dark and light at 1440x900 and 1280x800.
- Screenshot narrow viewport for rail, Settings dialog, documents panel, chat context panel.
- Visual diff checks density, fonts, surfaces, borders, control height, radius, status grammar.
- Accessibility checks: labels/tooltips for icon rail and toolbars, focus trap for Settings/preview drawer, Escape close.
- Static style scan for forbidden old CE/generic dashboard classes after implementation.

## One-line summary

P9 changes data and wiring, not the product family; port CE geometry and wear Local Studio clothes.
