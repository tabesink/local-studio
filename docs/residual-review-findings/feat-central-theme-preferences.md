# Known Residuals — feat/central-theme-preferences

Source review: ce-work shipping gate after plan `docs/plans/2026-07-11-001-feature-central-theme-preferences-plan.md` (2026-07-11).

## Accepted residuals

| Severity | File | Title | Notes |
| --- | --- | --- | --- |
| P2 | `appearanceBootstrap.ts` | Duplicated bootstrap vs runtime apply | Mitigated with parity smoke test (`keeps bootstrap script math aligned with runtime helpers`). Full shared codegen deferred. |
| P3 | `visual-matrix.spec.ts` | E2E still assigns `dataset.theme` for binary shots | Acceptable for Workbench Dark/Light matrix; accents not in matrix. |
| P3 | Product | System Mode is themeId-driven only | Intentional per R15; OS `prefers-color-scheme` deferred. |
| — | Fonts | Inter may fall back without `@font-face` | Stack fallback allowed; optional follow-up. |

## Fixed in follow-up commit

- P2 setState side effects → ref + commit outside updater
- P2 fontSize default 16 → 13 to match DESIGN `--fs-base`
- P3 DESIGN.md Inter exception pointer
- P3 normalizeAppearance clamps + font id validation
