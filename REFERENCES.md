# Rebuild Reference Index

These files were used to populate the active spec-driven scaffold. They remain reference evidence only; active implementation authority lives in `specs/`, `AGENTS.md`, `CONTEXT.md`, and `DESIGN.md`.

## Required References

| Reference | Active destination |
| --- | --- |
| `.references/CONTEXT.md` | `CONTEXT.md`, glossary, product specs |
| `.references/DESIGN.md` | `DESIGN.md`, frontend feature UX specs |
| `.references/local-studio-visual-parity-package.md` | `DESIGN.md`, F-009 frontend delivery |
| `.references/code/context-engine/` | old Context Engine backend and product evidence |
| `.references/code/context-engine/client/` | **P9 structure port:** shell, icon rail, documents + PDF preview, graph, chat layout |
| `.references/code/lightrag/` | external LightRAG library/runtime **read-only evidence** for private Context Engine runtime integration (F-003, F-005, F-006); promotion seed only — editable runtime copy lives at `vendor/lightrag/` per ADR-002 |
| `.references/code/local-studio/` | Local Studio visual restyle: tokens, primitives, density, interaction patterns |
| `.references/controllable-rag-fastapi-replication-pkg/` | advanced controllable RAG FastAPI architecture evidence for F-007 TurnOrchestrator, RetrievalPort reuse, bounded agent loops, and safe SSE projection |
| `.references/local-studio-tab-patterns.md` | LS tab systems (Computer panel tabs, PaneGrid, ui/tabs) — junior dev reference |
| `.references/context_engine_fullstack_impl_docs/phase_plan/*.md` | F-000 through F-009 feature plans |
| `.references/context_engine_fullstack_impl_docs/slices/*.md` | frontend vertical-slice build order inside F-009 |
| `.references/context_engine_fullstack_impl_docs/*.md` | architecture, API, data, auth, design, evidence, rebuild-order specs |
| `.references/feature-ce-api-uiux-wirering-brainstorm/` | junior dev API↔UI wiring evidence pack (not authority; see F-009 `ce-client-port-and-parity.md`, `context-panel-tabs.md`) |

## Use Rules

- Do not edit `.references/`.
- Do not copy stale v1 API paths blindly. Active specs and reconciled phase plans win when they conflict with reference code.
- **Port** layout, routes, and interaction geometry from `context-engine/client/`. **Restyle** with Local Studio tokens per `DESIGN.md`. **Wire** data from `specs/03-contracts/` only.
- Capture runtime/OpenAPI fixtures before wiring any API shape marked verify or unknown.
