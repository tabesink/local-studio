# Phase 2 (P2) — Trusted Runtime Config

**Feature:** `F-002`  
**One-liner:** Admins configure *which* AI providers, models, and document parsers the backend uses — secrets stay encrypted server-side; the browser never sees them.

P1 gave you auth, roles, and a safe API shell. P2 adds the **configuration layer** that later phases (domains, parsing, chat) will consume privately.

---

## What got built

| Piece | Purpose |
|-------|---------|
| **3 DB tables** | `provider_configs`, `model_profiles`, `runtime_settings` |
| **Fernet encryption** | API keys stored as `credential_ciphertext`; requires `CONFIG_ENCRYPTION_KEY` at startup (except tests) |
| **Startup seeding** | 4 providers, ~20 curated model profiles, singleton runtime settings |
| **Admin HTTP API** | CRUD-ish for providers, profiles, active synthesis + parser |
| **`TrustedRuntimeResolver`** | Backend-only path that decrypts credentials and validates config — **no provider SDK / network calls** |

---

## Mental model (data)

```
┌─────────────────────────────────────────────────────────────────┐
│                    runtime_settings (singleton, id=1)            │
│  active_synthesis_profile_id ──► model_profiles (synthesis)     │
│  active_parser_kind: docling | reducto                            │
└─────────────────────────────────────────────────────────────────┘
         │
         │  each profile points at
         ▼
┌──────────────────┐     ┌──────────────────────────────────────┐
│  model_profiles  │────►│  provider_configs                     │
│  kind:           │     │  openai | bedrock | ollama | reducto   │
│   synthesis      │     │  credential_ciphertext (encrypted)     │
│   embedding      │     │  isConfigured = has cred OR no cred    │
│  + vector_dims   │     │    needed (ollama)                     │
│    (embedding)   │     └──────────────────────────────────────┘
└──────────────────┘
```

**Providers (closed list):**

- **Model providers:** OpenAI, Bedrock, Ollama  
- **Parser-only:** Reducto (cannot be a model profile provider)

**Profiles (closed catalog):**

- **Synthesis** — chat/LLM model (no vector dimensions)  
- **Embedding** — vector model (must have `vector_dimensions`, e.g. 1536)

Admins can create *additional* profiles, but `model_name` + dimensions must match the hardcoded `MODEL_CATALOG` in `runtime_config.py`.

---

## Admin API flow

```
  Admin UI (future P9)          FastAPI (P1 auth)              DB + crypto
        │                              │                            │
        │  GET /admin/runtime-settings │                            │
        │─────────────────────────────►│  safe DTOs only            │
        │◄─────────────────────────────│  (no secrets)              │
        │                              │                            │
        │  PUT .../providers/openai    │                            │
        │  { "credential": "sk-..." }  │──► Fernet encrypt ────────►│
        │◄── { isConfigured: true }    │                            │
        │                              │                            │
        │  PATCH /admin/runtime-settings                            │
        │  { activeSynthesisProfileId }│──► validate provider ready │
        │                              │                            │
```

**Endpoints** (all admin-only):

| Method | Path | Does |
|--------|------|------|
| GET | `/admin/runtime-settings` | Full safe snapshot |
| PUT | `/admin/runtime-settings/providers/{kind}` | Rotate encrypted credential |
| POST | `/admin/runtime-settings/model-profiles` | Add catalog-valid profile |
| PATCH | `/admin/runtime-settings/model-profiles/{id}` | Rename / change model |
| DELETE | `/admin/runtime-settings/model-profiles/{id}` | Remove unused profile |
| PATCH | `/admin/runtime-settings` | Set active synthesis + parser |

Safe response rule: clients get `isConfigured`, never ciphertext or plaintext secrets.

---

## Security boundaries (memorize these)

```
┌──────────────┐         ┌─────────────────────┐         ┌─────────────┐
│   Browser    │  HTTP   │   Context Engine    │  DB     │  Postgres   │
│              │────────►│   API               │────────►│  ciphertext │
│  sees:       │         │                     │         │             │
│  isConfigured│         │  SecretCrypto       │         │             │
│  model names │         │  (Fernet decrypt)   │         │             │
│  NEVER keys  │         │       ▼             │         │             │
└──────────────┘         │ TrustedRuntimeResolver        │             │
                         │  (server workers only)       │             │
                         └─────────────────────┘         └─────────────┘
```

1. **Startup fails** without valid `CONFIG_ENCRYPTION_KEY` outside test mode.  
2. **Ollama** does not accept credentials (`requires_credentials=false`).  
3. **Reducto parser** requires Reducto credentials before you can set `activeParserKind=reducto`.  
4. **Active synthesis** requires a configured provider for that profile.  
5. **Embedding profiles** become **immutable** once a Knowledge Domain references them (P3 wires this FK; P2 added the guard).

---

## `TrustedRuntimeResolver` — why it exists

Later code (chat, indexing, parsing) should not read DB + decrypt ad hoc. They call the resolver:

```
TrustedRuntimeResolver.resolve()
    └── synthesis: { profileId, providerKind, modelName, credential? }
    └── parser:    { parserKind, credential? }   // cred only if reducto

TrustedRuntimeResolver.resolve_embedding_profile(profileId)
    └── { profileId, providerKind, modelName, vectorDimensions, credential? }
```

Validation only — **no HTTP to OpenAI/Bedrock/Reducto**. Tests install a network trap to prove that.

Default synthesis auto-activates: when OpenAI creds are first saved and nothing is active yet, `openai-synthesis-default` is selected automatically.

---

## Key files (where to look)

| File | What |
|------|------|
| `context_engine/services/runtime_config.py` | Catalog, seeding, crypto, resolver, business rules |
| `context_engine/models.py` | `ProviderConfig`, `ModelProfile`, `RuntimeSettings` |
| `context_engine/api/routes.py` | Admin runtime-settings routes |
| `context_engine/app.py` | Startup: `validate_config_encryption_key` + `seed_runtime_config` |
| `migrations/versions/20260630_0002_trusted_runtime_config.py` | Schema |
| `tests/test_runtime_config.py` | All 8 acceptance criteria |

---

## What P2 deliberately did **not** build

- No Settings UI (that's P9)  
- No "test connection" button  
- No model discovery / sync from providers  
- No arbitrary `base_url` overrides  
- No domain lifecycle, LightRAG, document upload, or chat  
- No actual calls to provider APIs

P2 is **config storage + validation + private resolution**. Execution comes in later phases.

---

## How P2 connects forward

```
P1 (auth) ──► P2 (runtime config) ──► P3 (domains pick embedding profile)
                      │                        │
                      │                        └── domains.py calls
                      │                            resolve_embedding_profile()
                      └── resolve() will feed
                          synthesis + parser in P4+ (parsing, chat)
```

When an admin creates a domain (P3), the backend validates `embeddingProfileId` through the same trusted path — not just "does this UUID exist?"

---

## Junior dev checklist

1. **Read safe DTOs first** — if you're tempted to return a secret in JSON, you're wrong.  
2. **Catalog is allowlist** — custom model strings that aren't in `MODEL_CATALOG` → 422.  
3. **Singleton pattern** — `runtime_settings` always row `id=1`.  
4. **Credentials rotate in place** — same `provider_kind` row, new ciphertext.  
5. **Run** `pytest tests/test_runtime_config.py` to see every rule exercised.

---

**Status:** F-002 marked **implemented** (2026-06-30); all AC-001 through AC-008 pass per `acceptance.md`.