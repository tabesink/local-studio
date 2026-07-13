# Known Residuals — feat/design-kit-contract-inventory @ 063f90af

Source: ce-work shipping review for `docs/plans/2026-07-13-001-feat-frontend-uiux-component-factory-plan.md` (factory slice). Actionable P1/P2 findings were applied in `063f90af`.

## Accepted residuals

| Severity | Title | Notes |
|---|---|---|
| P3 | Short template cites can collide with live feature folder names | `AGENTS.md` uses `features/settings-panel/` and `features/user-preferences/` per DESIGN/KTD-3; full `environment-controls` path is qualified. Misread risk only. |
| P3 | Integrity test does not assert foreign folders stay deleted | Marker bans cover foreign content; a reintroduced empty stub folder without banned substrings would still pass. |

## Applied findings (for trace)

- P1: Removed invented `ControllersStyleAccordionRow` API from KG components pack.
- P2: Aligned storage target chrome with plan 002 (total bar only).
- P2: Strengthened U5 AE3 asserts (positive drift/canon anchors + ban invented Accordion* tags).
