---
type: flow
phase: P2
feature: F-002
status: active
layer:
  - api
  - auth
spec: specs/04-features/F-002-trusted-runtime-config/spec.md
audience: junior-dev
lifecycle: done
tags:
  - phase/p2
  - feature/f-002
  - type/flow
  - layer/api
  - layer/auth
  - status/active
---

# P2 Runtime Setup Flow

Typical order to make CE ready for domains, indexing, and chat. Administrator-only for steps 3–6.

Parent: [[P2 Index]]. Details: [[P2 Provider Credentials Setup]], [[P2 Model Profiles Table]].

---

## Setup sequence

```text
1. Env: CONFIG_ENCRYPTION_KEY, CE_ADMIN_*, DATABASE_URL
        │
        ▼
2. Start CE + migrations (seeds providers + model catalog)
        │
        ▼
3. Admin login (ce_session cookie)
        │
        ▼
4. PUT /admin/runtime-settings/providers/{kind}
     { credential }  for openai / bedrock / reducto as needed
        │
        ▼
5. PATCH /admin/runtime-settings
     activeSynthesisProfileId, activeParserKind
        │
        ▼
6. POST /admin/domains
     { id, embeddingProfileId }  per Knowledge Domain
        │
        ▼
7. Members use chat — CE applies global synthesis automatically
```

---

## Readiness checks

| Check | GET `/admin/runtime-settings` |
| --- | --- |
| Provider ready? | `providers[].isConfigured: true` |
| Synthesis set? | `runtimeSettings.activeSynthesisProfileId` non-null |
| Parser set? | `runtimeSettings.activeParserKind` (`docling` or `reducto`) |

OpenAI credential + no active synthesis → backend may auto-activate `openai-synthesis-default`.

---

## Common blockers

| Symptom | Likely cause |
| --- | --- |
| `synthesis_profile_not_ready` on chat | no credential or no active synthesis profile |
| `embedding_profile_invalid` on domain create | embedding provider not configured |
| `parser_not_ready` on upload | `activeParserKind: reducto` without Reducto credential |
| Startup failure | missing/invalid `CONFIG_ENCRYPTION_KEY` |

---

## What members cannot do

Members do not set API keys or pick models. Turn submit with `apiKey`/`model`/`provider` → `422`.

---

## Related

- [[P2 Index]]
- [[P2 Provider Credentials Setup]]
- [[P2 Model Profiles Table]]
- [[TrustedRuntimeResolver]]
- [[P3 Index]]

## Repo sources

- `.env.p10.example`
- `scripts/pilot_gate.py`
- `specs/03-contracts/api/context-engine-v1.md`
- `context_engine/services/runtime_config.py`
