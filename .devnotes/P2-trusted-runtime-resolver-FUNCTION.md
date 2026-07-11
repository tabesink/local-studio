# `TrustedRuntimeResolver` — what it does

It is the **single backend gate** for turning stored admin config (DB rows + encrypted secrets) into **ready-to-use runtime config** with **plaintext credentials**.

The admin API never does that. It only returns safe status DTOs (`isConfigured`, model names, etc.). The resolver is for **internal server code** that will actually call OpenAI, Bedrock, Reducto, etc. in later phases.

---

## Two jobs

### 1. `resolve()` — global chat + parser config

Reads the singleton `runtime_settings` row and builds:

```
TrustedRuntimeConfig
├── synthesis  → active LLM profile + decrypted provider key
└── parser     → docling | reducto (+ Reducto key if parser is reducto)
```

Used later by chat, synthesis, document parsing workers — **not wired to HTTP yet** in P2.

### 2. `resolve_embedding_profile(id)` — per-domain embedding config

Given one embedding profile ID, returns:

```
TrustedEmbeddingRuntimeConfig
├── profile_id, provider_kind, model_name
├── vector_dimensions
└── credential (decrypted, or None for Ollama)
```

**Already used in P3** when creating a Knowledge Domain — domain create validates the profile through the resolver before saving:

```242:244:context_engine/services/domains.py
    from context_engine.services.runtime_config import SecretCrypto, TrustedRuntimeResolver

    TrustedRuntimeResolver(db, SecretCrypto.from_settings(settings)).resolve_embedding_profile(embedding_profile_id)
```

Note: domain create uses it for **validation only** right now; the return value is discarded. The point is: if resolver throws, domain is not created.

---

## What “trusted” means

Each resolve path re-checks business rules that the admin API also enforces, but **cannot be skipped** by callers:

| Check | Why |
|-------|-----|
| Profile exists | No dangling FKs |
| Correct `profile_kind` | synthesis vs embedding |
| Provider configured | credentials present when required |
| Active synthesis set (for `resolve()`) | runtime not half-configured |
| Reducto creds if parser=reducto | parser can't run blind |

Then it **decrypts** via `SecretCrypto` (Fernet + `CONFIG_ENCRYPTION_KEY`):

```486:491:context_engine/services/runtime_config.py
    def _credential_for(self, provider: ProviderConfig) -> str | None:
        if not provider.requires_credentials:
            return None
        if not provider.credential_ciphertext:
            raise RuntimeConfigError(409, "provider_not_ready", "Provider is not configured.")
        return self._crypto.decrypt_secret(provider.credential_ciphertext)
```

**No provider network calls.** Resolver only reads DB + decrypts locally. Tests prove this by monkeypatching `socket.create_connection` to explode if anything tries to dial out.

---

## What “server workers only” means

Not a separate Celery/RQ worker in this repo yet — it means **boundary**, not a process name:

```
┌─────────────┐     HTTP      ┌──────────────────┐
│   Browser   │──────────────►│  Admin API       │
│             │◄──────────────│  safe DTOs only  │
└─────────────┘               └──────────────────┘
                                      │
                                      │ never exposes
                                      │ decrypted keys
                                      ▼
                              ┌──────────────────┐
                              │ TrustedRuntime   │  ◄── only backend
                              │ Resolver         │      service code
                              └────────┬─────────┘
                                       │
                    ┌──────────────────┼──────────────────┐
                    ▼                  ▼                  ▼
              domain create      future chat job    future parse job
              (validate now)     (resolve())         (resolve())
```

Rules:

1. **Never called from frontend** — browser has no access to DB, Fernet key, or decrypted secrets.
2. **Never returned in HTTP responses** — API routes use `safe_provider()` / `safe_model_profile()`, not the resolver output.
3. **Only backend services import it** — e.g. `domains.py`, future indexing/chat/parse modules.
4. **Plaintext creds live briefly in server memory** — only inside the returned dataclass for the caller’s immediate use; they must not log, serialize, or forward them to clients.

Think of it as: **admin API writes config; resolver reads config for execution.**

---

## Flow diagram

```
  DB tables                         TrustedRuntimeResolver              Caller
  ─────────                         ──────────────────────              ──────

  runtime_settings ──┐
  model_profiles  ───┼──► validate rules ──► SecretCrypto.decrypt ──► TrustedRuntimeConfig
  provider_configs ──┘         │                      │
                               │                      └── credential in memory
                               │
  model_profiles  ─────────────┼──► resolve_embedding_profile(id) ──► TrustedEmbeddingRuntimeConfig
  provider_configs ────────────┘
```

---

## Why not just query the DB directly?

Without the resolver, every future feature would duplicate:

- “Is this profile the right kind?”
- “Is the provider ready?”
- “How do I decrypt safely?”
- “Did someone forget Reducto creds for Reducto parser?”

One class = **one trust boundary**. Change the rules once; all consumers stay consistent.

---

## Junior mental model

- **Admin routes** = configure and inspect (safe, public-to-admin HTTP).
- **`TrustedRuntimeResolver`** = “give me the real runtime package, or fail loudly” (private, server-only).
- **P2 ships the resolver**; **P3+ call it** when they need to validate or actually run work.

If you see code doing `provider.credential_ciphertext` + manual decrypt outside this class, that’s a smell — it bypasses the trust boundary.