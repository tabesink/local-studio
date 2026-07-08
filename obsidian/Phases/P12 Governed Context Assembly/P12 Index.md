---
type: index
phase: P12
feature: F-012
status: active
spec: specs/04-features/F-012-governed-context-assembly/spec.md
audience:
  - agent
  - junior-dev
tags:
  - phase/p12
  - feature/f-012
  - type/index
  - status/active
---

# P12 Index

**F-012 — Governed Context Assembly** — composer refs, server-owned prompt assembly, three-region `/chat` workbench over existing P7 turn path.

Builds on [[P7 Index]] (TurnOrchestrator, SSE, idempotency) and [[P2 Index]] (global synthesis profile). Does not give browser model/provider/prompt control.

---

## Notes

- [[F-012 Junior Dev Cheat Sheet]] — one-page quick reference
- [[F-012 Governed Context Assembly Overview]] — what changed vs P7 thin composer
- [[F-012 Composer Ref Discovery]] — `@` picker and opaque tokens
- [[F-012 Turn Pipeline]] — ref validation → PromptAssemblyService → TurnOrchestrator
- [[F-012 Errors And Idempotency]] — ref fingerprint + pre-stream failures
- [[F-012 Scope Boundaries]] — v1 vs later vs outside CE
- [[F-012 Chat Workbench Layout]] — three-region UI shape

---

## Repo sources

- `specs/04-features/F-012-governed-context-assembly/spec.md`
- `specs/04-features/F-012-governed-context-assembly/ux.md`
- `docs/plans/2026-07-08-001-feature-governed-context-assembly-plan.md`
- `specs/03-contracts/api/context-engine-v1.md` — F-012 composer refs + discovery

## Related

- [[Build Order Index]]
- [[P7 Index]]
- [[P9 Index]] — frontend workbench + LS visual parity
- [[Context Engine Index]]
