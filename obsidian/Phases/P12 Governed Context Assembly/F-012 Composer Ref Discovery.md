---
type: flow
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
  - type/flow
  - layer/api
  - contract/api
  - status/active
---

# F-012 Composer Ref Discovery

How the composer `@` picker gets opaque ref tokens. Discovery issues tokens; submit sends them back.

Parent: [[P12 Index]]. Submit path: [[F-012 Turn Pipeline]].

---

## Flow

```text
User types @ in composer
    │
    ▼
POST /api/v1/composer-refs:discover
    │
    ▼
Response: refs[{ refToken, kind, label, description, disabledReason }]
    │
    ▼
User picks item → chip in composer
    │
    ▼
Submit turn with composerRefTokens: ["opaque_ref_token", ...]
```

---

## Request shape

```json
{
  "conversationId": "conv_01",
  "domainId": "manuals",
  "kinds": ["source", "evidence", "wiki", "template"],
  "query": "manual",
  "limit": 10
}
```

| Field | Rule |
| --- | --- |
| `conversationId` | optional; **required** for evidence refs in active conversation |
| `domainId` | required for source/evidence/wiki; optional for template-only |
| `kinds` | default all four; max one of each kind in list |
| `query` | optional filter, max 120 chars; not persisted |
| `limit` | default 10, max 25 |

---

## Response safety

`refToken` is opaque — must not encode readable private ids.

Discovery never returns: Source Document ids, block ids, wiki revision ids, template bodies, prompt text, raw source/wiki text, paths, provider payloads, credentials.

Chips in UI show **kind + label** only — never display the token string.

---

## Revalidation on submit

Tokens issued by discover are **revalidated** at turn claim. Stale, redacted, deleted, unauthorized, or out-of-domain refs fail **before SSE opens**.

Silent partial drop is **not** allowed.

---

## Related

- [[P12 Index]]
- [[F-012 Junior Dev Cheat Sheet]]
- [[F-012 Turn Pipeline]]
- [[F-012 Errors And Idempotency]]

## Repo sources

- `specs/03-contracts/api/context-engine-v1.md` — F-012 Composer Ref Discovery And Templates
- `specs/04-features/F-012-governed-context-assembly/spec.md`
