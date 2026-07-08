---
type: table
phase: P12
feature: F-012
status: active
layer:
  - api
contract: API-001
spec: specs/03-contracts/api/context-engine-v1.md
audience: junior-dev
lifecycle: building
tags:
  - phase/p12
  - feature/f-012
  - type/table
  - layer/api
  - contract/api
  - status/active
---

# F-012 Errors And Idempotency

Turn submit and replay rules when composer refs are present. Extends P7 idempotency with **composer-ref fingerprint**.

Parent: [[P12 Index]]. Pipeline: [[F-012 Turn Pipeline]].

---

## Idempotency matrix

| Condition | HTTP / stream | Notes |
| --- | --- | --- |
| Same `clientRequestId` + same message + domain + **ref fingerprint** | `200` SSE replay | `done.replay = true`; no provider/retrieval |
| Same id, completed terminal (`no_grounded_context`, `evidence_only`, redacted, failed) | `200` SSE replay | persisted safe terminal state |
| Same id, **different** message, domain, route, or ref fingerprint | `409` | `client_request_conflict` |
| Same id while original turn running | `409` | `conversation_turn_in_progress` |
| Different id while any turn running | `409` | `conversation_turn_in_progress` |

Replay uses persisted safe data only — does **not** revalidate expired ref tokens or rebuild assembly.

---

## Pre-stream errors (JSON, not SSE)

| Situation | HTTP | Code |
| --- | --- | --- |
| Bad/forbidden request fields | 422 | `validation_error` |
| Domain required but missing | 422 | `domain_required` |
| Unknown/unavailable domain | 404/409 | `domain_not_found` / `domain_state_conflict` |
| Stale/unauthorized/redacted ref | 409 | `composer_ref_unavailable` |
| Synthesis not configured | 409 | `synthesis_profile_not_ready` |
| Turn in progress / id conflict | 409 | `conversation_turn_in_progress` / `client_request_conflict` |

Pre-stream ref failure: composer preserves editable message + chips.

---

## Forbidden turn request fields

Includes: `route`, `model`, `provider`, `systemPrompt`, `apiKey`, `topK`, `retrievalMode`, `sourcePath`, template bodies, raw prompt fragments, ref target ids.

Unknown or forbidden fields → `422` even if refs are otherwise valid.

---

## Safe error messages

Bland only. Never echo submitted message, prompt, source text, provider payload, paths, private ids, or stack traces.

---

## Related

- [[P12 Index]]
- [[F-012 Junior Dev Cheat Sheet]]
- [[F-012 Turn Pipeline]]
- [[P7 Index]]

## Repo sources

- `specs/03-contracts/api/context-engine-v1.md` — P7 idempotency and safe errors
- `specs/04-features/F-012-governed-context-assembly/acceptance.md`
