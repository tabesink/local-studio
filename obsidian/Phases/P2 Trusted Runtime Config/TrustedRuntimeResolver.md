---
type: architecture
phase: P2
feature: F-002
status: active
layer:
  - api
  - data
contract: DATA-001
spec: specs/04-features/F-002-trusted-runtime-config/spec.md
audience: junior-dev
lifecycle: done
tags:
  - phase/p2
  - feature/f-002
  - type/architecture
  - layer/api
  - layer/data
  - contract/data
  - status/active
  - architecture
---

# TrustedRuntimeResolver

Backend-only service that turns DB runtime config into private runtime handles. No network calls. No public secret exposure.

Parent: [[P2 Index]].

---

## Responsibilities

```text
TrustedRuntimeResolver(db, SecretCrypto)
    │
    ├─ resolve()
    │     → TrustedRuntimeConfig
    │         synthesis: profile + provider + decrypted credential
    │         parser:    parser_kind + credential (if reducto)
    │
    └─ resolve_embedding_profile(embedding_profile_id)
          → TrustedEmbeddingRuntimeConfig
              profile + provider + vector_dimensions + credential
```

---

## Callers

| Caller | Method | When |
| --- | --- | --- |
| `chat_turns._resolve_synthesis` | `resolve().synthesis` | before turn stream |
| `domains.create_domain` | `resolve_embedding_profile` | domain create validation |
| `sources` prep worker | parser credential via provider row | source preparation |

---

## Ready checks

- Synthesis profile must exist, be `profile_kind=synthesis`, and have configured provider.
- Embedding profile must exist, have `vector_dimensions`, and have configured provider.
- Reducto parser requires configured Reducto provider.

Errors map to API codes like `runtime_settings_not_ready`, `embedding_profile_invalid`, `provider_not_ready`.

---

## Related

- [[P2 Index]]
- [[P2 Provider Credentials Setup]]
- [[P2 Model Profiles Table]]

## Repo sources

- `context_engine/services/runtime_config.py` — `TrustedRuntimeResolver` class
- `specs/04-features/F-002-trusted-runtime-config/spec.md`
