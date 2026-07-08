---
type: table
phase: P12
feature: F-012
status: active
spec: specs/04-features/F-012-governed-context-assembly/spec.md
audience: junior-dev
lifecycle: building
tags:
  - phase/p12
  - feature/f-012
  - type/table
  - status/active
---

# F-012 Scope Boundaries

What ships in v1 vs later vs outside CE identity. Prevents accidental Local Studio runtime port.

Parent: [[P12 Index]].

---

## In v1

| Area | Ships |
| --- | --- |
| Composer refs | source, wiki, evidence, template |
| Backend | `PromptAssemblyService`, ref validation, accepted safe metadata |
| Chat UX | LS-style composer chips, stop/retry, SSE reducer |
| Layout | three-region `/chat` workbench |
| Transport | existing `POST turns:stream` (no 202 queue) |

---

## Later contracts

| Area | Deferred |
| --- | --- |
| Attachments | managed CE attachment refs + upload contract |
| Turn controls | queue, steer, follow-up, compact |
| Member choice | model/profile selection policy |
| Wiki UX | filesystem-like knowledge-library navigation |
| Inspector | extra right-panel tabs beyond evidence/ref/source/wiki |
| Sessions | pin, archive, export, multi-pane comparison |

---

## Outside CE identity (do not port)

```text
Pi SDK runtime          JSONL session authority
Host filesystem skills  Browser tools (terminal, Git, browser automation)
Browser-side RAG        Second retrieval stack / local vector store
Plugin framework        Raw prompt editor in browser
Arbitrary model/provider controls from member UI
```

---

## Local Studio adaptation map

| LS behavior | CE v1 |
| --- | --- |
| Composer context (skills/plugins) | governed refs + server assembly |
| Browser prompt assembly | `PromptAssemblyService` |
| Pi SSE frames | EVT-001 CE events only |
| JSONL sessions | Postgres Conversations/Turns |
| Computer tabs (terminal/files/Git) | **excluded** — evidence/ref/source/wiki inspector only |

Scaffold: `.reference-LS-frontend` for layout/tokens/reducers — **not** runtime contracts.

---

## Related

- [[P12 Index]]
- [[F-012 Junior Dev Cheat Sheet]]
- [[F-012 Chat Workbench Layout]]
- [[F-012 Governed Context Assembly Overview]]

## Repo sources

- `docs/plans/2026-07-08-001-feature-governed-context-assembly-plan.md` — Scope Boundaries + KD decisions
- `specs/04-features/F-012-governed-context-assembly/spec.md`
