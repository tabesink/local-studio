---
type: flow
phase: P2
feature: F-002
status: active
layer:
  - api
  - auth
contract: API-001
spec: specs/04-features/F-002-trusted-runtime-config/spec.md
audience: junior-dev
lifecycle: done
tags:
  - phase/p2
  - feature/f-002
  - type/flow
  - layer/api
  - layer/auth
  - contract/api
  - status/active
---

# P2 Provider Credentials Setup

How Context Engine stores provider API keys. **Not env vars. Not browser.** Administrator rotates credentials through admin API; backend encrypts and decrypts server-side only.

Parent: [[P2 Index]]. Model selection: [[P2 Model Profiles Table]].

---

## What goes in `.env`

```text
CONFIG_ENCRYPTION_KEY   # Fernet key — encrypts stored provider secrets
CE_ADMIN_USERNAME
CE_ADMIN_PASSWORD
CONTEXT_ENGINE_DATABASE_URL
```

There is **no** `OPENAI_API_KEY` (or similar) in CE `Settings`. Provider keys live in Postgres.

---

## Credential flow

```text
Admin login (ce_session cookie)
    │
    ▼
PUT /api/v1/admin/runtime-settings/providers/{provider_kind}
    { "credential": "<secret>" }
    │
    ▼
Fernet encrypt → provider_configs.credential_ciphertext
    │
    ▼
GET returns only: { providerKind, isConfigured: true }
    (secret never returned)
    │
    ▼
TrustedRuntimeResolver decrypts at use time (chat, parser, indexing)
```

---

## Providers

| `provider_kind` | Requires credential? | Used for |
| --- | --- | --- |
| `openai` | yes | synthesis + embedding model profiles |
| `bedrock` | yes | synthesis + embedding model profiles |
| `reducto` | yes | document parser only |
| `ollama` | no | local models; no API key |

---

## Who can set keys

| Actor | Can set? |
| --- | --- |
| Administrator | yes — via admin API |
| Member | no |
| Browser / frontend | no — forbidden on turn and discovery requests |

Admin Settings UI is planned (F-009); today use API or pilot scripts (`scripts/pilot_gate.py` pattern).

---

## Failures

- Missing `CONFIG_ENCRYPTION_KEY` outside test → startup fails.
- Provider not configured when required → `provider_not_ready` / `synthesis_profile_not_ready` (409).
- Turn request with `apiKey`, `provider`, `model` → `422 validation_error`.

---

## Related

- [[P2 Index]]
- [[P2 Model Profiles Table]]
- [[TrustedRuntimeResolver]]

## Repo sources

- `specs/03-contracts/api/context-engine-v1.md` — P2 runtime-settings routes
- `specs/04-features/F-002-trusted-runtime-config/spec.md`
- `context_engine/services/runtime_config.py`
- `context_engine/config.py`
