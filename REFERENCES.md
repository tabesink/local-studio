# Rebuild Reference Index

These files were used to populate the active spec-driven scaffold. They remain reference evidence only; active implementation authority lives in `specs/`, `AGENTS.md`, `CONTEXT.md`, and `DESIGN.md`.

## Required References

| Reference | Active destination |
| --- | --- |
| `.references/CONTEXT.md` | `CONTEXT.md`, glossary, product specs |
| `.references/DESIGN.md` | `DESIGN.md`, frontend feature UX specs |
| `.references/local-studio-visual-parity-package.md` | `DESIGN.md`, F-009 frontend delivery |
| `.references/code/context_engine/` | old Context Engine product behavior, route/layout shape, API/backend patterns, and migration clues |
| `.references/code/lightrag/` | external LightRAG library/runtime evidence for private Context Engine runtime integration (F-003, F-005, F-006); minimal surgical edits only when specs require it |
| `.references/code/local-studio/` | Local Studio tokens, primitives, shell, settings, dense UI evidence |
| `.references/context_engine_fullstack_impl_docs/phase_plan/*.md` | F-000 through F-009 feature plans |
| `.references/context_engine_fullstack_impl_docs/slices/*.md` | frontend vertical-slice build order inside F-009 |
| `.references/context_engine_fullstack_impl_docs/*.md` | architecture, API, data, auth, design, evidence, rebuild-order specs |

## Use Rules

- Do not edit `.references/`.
- Do not copy stale v1 API paths blindly. The reconciled phase plans under `phase_plan/` win when they conflict with older catalogs.
- Use reference code for evidence of layout, component grammar, tokens, and contracts. Do not treat reference implementation shortcuts as product permission.
- Capture runtime/OpenAPI fixtures before wiring any API shape marked verify or unknown.
