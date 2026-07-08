---
type: table
phase: P2
feature: F-002
status: active
layer:
  - api
  - data
contract: API-001
spec: specs/04-features/F-002-trusted-runtime-config/spec.md
audience: junior-dev
lifecycle: done
tags:
  - phase/p2
  - feature/f-002
  - type/table
  - layer/api
  - layer/data
  - contract/api
  - status/active
  - architecture
---

# P2 Model Profiles Table

Which model applies to which CE operation. Members never pick models; admin configures profiles and runtime singleton.

Parent: [[P2 Index]]. Credentials: [[P2 Provider Credentials Setup]].

---

## Three knobs

```text
┌─────────────────────────────────────────────────────────────┐
│ RUNTIME SETTINGS (global singleton)                         │
│  activeSynthesisProfileId  →  all chat answers (P7/F-012)     │
│  activeParserKind          →  new source uploads only       │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ PER KNOWLEDGE DOMAIN (locked at create)                     │
│  embeddingProfileId        →  that domain's vectors/index   │
└─────────────────────────────────────────────────────────────┘
```

---

## Operation → model mapping

| Operation | Setting location | Set via | Locked? |
| --- | --- | --- | --- |
| Chat synthesis (direct + grounded) | `runtime_settings.active_synthesis_profile_id` | `PATCH /admin/runtime-settings` | changeable |
| Source parsing (new uploads) | `runtime_settings.active_parser_kind` | `PATCH /admin/runtime-settings` | frozen per source at upload |
| Domain embedding / index | `domains.embedding_profile_id` | `POST /admin/domains` | **immutable** once domain exists |

---

## Profile kinds

| `profileKind` | `providerKind` options | `vectorDimensions` | Example seed id |
| --- | --- | --- | --- |
| `synthesis` | `openai`, `bedrock`, `ollama` | must be null | `openai-synthesis-default` (`gpt-4.1-mini`) |
| `embedding` | `openai`, `bedrock`, `ollama` | required | `openai-embedding-default` (`text-embedding-3-small`, 1536) |

`reducto` is parser-only — not a model profile provider.

`modelName` must match the approved seeded catalog in `runtime_config.MODEL_CATALOG`.

---

## Default activation

```text
Startup seeds catalog + provider rows
    │
    ▼
Admin configures OpenAI credential
    │
    ▼
If active_synthesis_profile_id is null
  → auto-set openai-synthesis-default
```

Chat turn without ready synthesis → `synthesis_profile_not_ready` (409).

---

## Parser kinds

| `activeParserKind` | Credential needed? | Frozen on |
| --- | --- | --- |
| `docling` (default) | no | `source_documents.parser_kind` at upload |
| `reducto` | yes (Reducto provider) | same |

Retry preparation uses the source's frozen `parserKind`, not the current global setting.

---

## Browser forbidden controls

Turn and evidence requests reject unknown/forbidden fields including: `model`, `provider`, `apiKey`, `systemPrompt`, `topK`, `retrievalMode`, `route`.

Route and model are **server-owned** (AI-001, P7).

---

## Implementation note

`TrustedRuntimeResolver` resolves synthesis + parser + embedding profiles and decrypts credentials privately. `SynthesisStreamAdapter` in chat is still a stub; credential resolution path exists before real provider SDK wiring.

Native LightRAG indexing may still use synthetic embed in local/test paths — intended design injects domain `embeddingProfileId` server-side per ADR-001.

---

## Related

- [[P2 Index]]
- [[P2 Provider Credentials Setup]]
- [[TrustedRuntimeResolver]]
- [[P3 Index]] — domain `embeddingProfileId` at create
- [[P7 Index]] — chat uses global synthesis profile

## Repo sources

- `specs/02-architecture/decisions/ADR-001-model-catalog-and-domain-runtime-contract.md`
- `specs/03-contracts/api/context-engine-v1.md` — P2 + P3 DTOs
- `context_engine/services/runtime_config.py`
- `context_engine/services/chat_turns.py` — `_resolve_synthesis`
- `context_engine/services/domains.py` — `resolve_embedding_profile` at domain create
