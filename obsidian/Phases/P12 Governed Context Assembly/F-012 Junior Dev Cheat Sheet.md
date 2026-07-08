---
type: flow
phase: P12
feature: F-012
status: active
layer:
  - api
  - frontend
spec: specs/04-features/F-012-governed-context-assembly/spec.md
audience: junior-dev
lifecycle: building
tags:
  - phase/p12
  - feature/f-012
  - type/flow
  - layer/api
  - layer/frontend
  - status/active
---

# F-012 Junior Dev Cheat Sheet

One-page mental model. Details: [[F-012 Governed Context Assembly Overview]], [[F-012 Turn Pipeline]], [[F-012 Chat Workbench Layout]].

Parent: [[P12 Index]].

---

## One sentence

Chat gets `@`-mentions (refs) and a 3-panel UI — browser picks opaque chips; server validates, assembles prompt, runs turn.

---

## Ref kinds

| Kind | Domain? | What |
| --- | --- | --- |
| `source` | yes | domain document |
| `evidence` | yes | prior turn evidence (same conv) |
| `wiki` | yes | published wiki page |
| `template` | no (direct ok) | approved prompt template |

---

## Golden rule

```text
Browser NEVER: build tokens, see prompts/templates/raw source, pick model/route
Browser ONLY:   discover → chips → submit opaque tokens
```

---

## Two API calls

```text
@ picker  →  POST /composer-refs:discover
submit   →  POST /conversations/{id}/turns:stream
              + composerRefTokens[]
```

---

## Server path (memorize order)

```text
validate request → validate refs (fail closed) → idempotency
  → PromptAssemblyService → TurnOrchestrator → SSE
```

---

## Routes (server picks)

| Route | When |
| --- | --- |
| `domain_rag` | domain selected or required |
| `direct_llm` | general chat; template-only ok without domain |

Refs add context. They do **not** change route or model ([[P2 Model Profiles Table]]).

---

## Safe vs forbidden in UI/history

| OK | Never |
| --- | --- |
| chip kind + label | ref token, template body, prompt |
| evidence excerpt + citation | private ids, paths, raw source |

---

## Errors to remember

| Case | Result |
| --- | --- |
| Bad ref before stream | `409 composer_ref_unavailable`; composer keeps text + chips |
| Same clientRequestId, different refs | `409 client_request_conflict` |
| Forbidden `model`/`apiKey`/… | `422 validation_error` |

Full table: [[F-012 Errors And Idempotency]].

---

## Not v1

Attachments, terminal, filesystem, Git, browser tools, model picker, queue/steer/compact, raw prompt editor, Pi/JSONL sessions.

---

## Mental model

> Local Studio = pretty composer + local assembly on your machine  
> Context Engine = same composer *feel*; refs are opaque tickets; FastAPI assembles in private

You build the ticket counter and display — not the kitchen.

---

## Related

- [[P12 Index]]
- [[F-012 Composer Ref Discovery]]
- [[F-012 Errors And Idempotency]]
- [[P2 Model Profiles Table]]

## Repo sources

- `docs/plans/2026-07-08-001-feature-governed-context-assembly-plan.md`
- `specs/03-contracts/api/context-engine-v1.md`
