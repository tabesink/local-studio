---
type: flow
phase: P12
feature: F-012
status: active
layer:
  - api
  - frontend
contract: API-001
spec: specs/04-features/F-012-governed-context-assembly/spec.md
audience: junior-dev
lifecycle: building
tags:
  - phase/p12
  - feature/f-012
  - type/flow
  - layer/api
  - layer/frontend
  - contract/api
  - status/active
---

# F-012 Governed Context Assembly Overview

Chat upgrades from a thin question box to governed composer refs + server-owned prompt assembly. Local Studio **UX shape**, CE **contracts and authority**.

Parent: [[P12 Index]].

---

## Before vs after

```text
BEFORE (P7)                         AFTER (F-012)
─────────────                       ─────────────
message + domainId?                 message + domainId? + composerRefTokens[]
     │                                   │
     ▼                                   ▼
TurnOrchestrator                    validate refs (fail closed)
                                         │
                                         ▼
                                    PromptAssemblyService
                                         │
                                         ▼
                                    TurnOrchestrator (same spine)
```

---

## Ref kinds (v1)

| Kind | Needs `domainId`? | Purpose |
| --- | --- | --- |
| `source` | yes | attach a domain source document |
| `evidence` | yes | prior turn evidence (same conversation) |
| `wiki` | yes | published wiki page |
| `template` | no for direct LLM | approved prompt template ref |

---

## Golden rule

```text
Browser NEVER:
  - builds ref tokens from ids/paths/raw text
  - sees prompt, template body, or raw source
  - picks model, provider, route, retrieval

Browser ONLY:
  - POST /composer-refs:discover → opaque tokens + safe labels
  - shows chips (kind + label)
  - submits tokens with message
```

---

## Two API calls

**Discover:** `POST /composer-refs:discover` — user types `@` in composer.

**Submit:** `POST /conversations/{id}/turns:stream` — same transport as P7; body adds optional `composerRefTokens`.

---

## Routes (unchanged — server decides)

| Route | When |
| --- | --- |
| `domain_rag` | domain selected, or domain-required question |
| `direct_llm` | non-domain general chat; template-only allowed without domain |

Refs add **private assembly context**. They do **not** change route selection or model (still global synthesis from [[P2 Model Profiles Table]]).

---

## Out of scope (v1)

Attachments, terminal/filesystem/Git/browser tools, model picker, queue/steer/compact, raw prompt editor, browser-side RAG, Pi/JSONL session authority.

---

## Related

- [[P12 Index]]
- [[F-012 Turn Pipeline]]
- [[F-012 Chat Workbench Layout]]
- [[P7 Index]]
- [[P2 Model Profiles Table]]

## Repo sources

- `docs/plans/2026-07-08-001-feature-governed-context-assembly-plan.md`
- `specs/04-features/F-012-governed-context-assembly/spec.md`
- `specs/03-contracts/ai/grounded-answering.md` — PromptAssemblyService
- `specs/03-contracts/api/context-engine-v1.md` — F-012 section
