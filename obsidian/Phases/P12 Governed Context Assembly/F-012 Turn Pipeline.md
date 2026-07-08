---
type: flow
phase: P12
feature: F-012
status: active
layer:
  - api
  - worker
contract: AI-001
spec: specs/04-features/F-012-governed-context-assembly/spec.md
audience: junior-dev
lifecycle: building
tags:
  - phase/p12
  - feature/f-012
  - type/flow
  - layer/api
  - layer/worker
  - contract/api
  - status/active
---

# F-012 Turn Pipeline

Server path from composer submit to SSE stream. Ref validation and prompt assembly happen **before** TurnOrchestrator.

Parent: [[P12 Index]]. Overview: [[F-012 Governed Context Assembly Overview]].

---

## Pipeline

```text
/chat workbench
    │
    ▼
POST turns:stream
  { message, domainId?, clientRequestId, composerRefTokens? }
    │
    ▼
Strict validation (reject model/provider/systemPrompt/apiKey/…)
    │
    ▼
ComposerRefValidationService
  fail closed → 409 composer_ref_unavailable (before SSE)
    │
    ▼
Idempotency + ref fingerprint check
    │
    ▼
PromptAssemblyService → private assembly context
  (user_message stays original text in DB)
    │
    ▼
TurnOrchestrator
    ├─ domain_rag → P6 RetrievalPort → evidence → synthesis
    └─ direct_llm → synthesis only
    │
    ▼
Persist turn + accepted safe ref metadata + evidence
    │
    ▼
SSE: stage → evidence → token → done | error
```

---

## Idempotency (ref fingerprint included)

| Same `clientRequestId` + same message + domain + refs | Replay persisted stream |
| Same id, different message/refs | `409 client_request_conflict` |
| Turn still running | `409 conversation_turn_in_progress` |

Replay does **not** revalidate expired ref tokens or rebuild assembly.

---

## Safe public metadata

History/SSE may show:

- `acceptedRefs`: kind, order, safe label only
- `evidence`: citation label, source label, approved excerpt

Never: ref tokens, template body, prompt text, private ids, paths, provider payloads.

---

## Pre-stream error UX

Invalid ref → JSON error before `text/event-stream`. Composer preserves message text and selected chips.

---

## Related

- [[P12 Index]]
- [[F-012 Governed Context Assembly Overview]]
- [[P7 Index]]
- [[P2 Model Profiles Table]]

## Repo sources

- `specs/03-contracts/api/context-engine-v1.md` — P7 idempotency + F-012 refs
- `specs/03-contracts/ai/grounded-answering.md`
- `docs/plans/2026-07-08-001-feature-governed-context-assembly-plan.md` — high-level design
