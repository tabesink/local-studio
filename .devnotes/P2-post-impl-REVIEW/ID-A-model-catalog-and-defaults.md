# ID-A — Model catalog, defaults, and admin selection

Working doc for **Runtime Config (P2) + Knowledge Domains (P3)** boundary. Feeds ADR/spec patches for `DATA-001`, `API-001`, and F-002/F-003 before coding-agent implementation.

**Related (read together)**

| Doc | Scope |
|-----|--------|
| [ID-A.md](./ID-A.md) | P3 contract + data: `domains`, `domain_operations`, DTOs |
| [ID-A-embedding-profile-storage.md](./ID-A-embedding-profile-storage.md) | Why `domains.embedding_profile_id` FK exists and immutability rules |
| [F-003-P3-review.md](./F-003-P3-review.md) | Gap analysis vs old server |

---

## Decision summary

```text
Defaults?
  -> OpenAI out of the box (seed on startup)
  -> text-embedding-3-small @ 1536 (embedding)
  -> gpt-4.1-mini (synthesis — KG indexing LLM + RAG query LLM in v1)

Admin override?
  -> Yes, via existing P2 Runtime Settings API + Settings UI (Provider panel)
  -> Curated catalog only (no free-text modelName in UI)
  -> Optional: strict API allowlist on POST/PATCH model-profiles

Embedding per domain?
  -> Admin picks from seeded embedding profiles at POST /admin/domains
  -> Preselect OpenAI default embedding profile
  -> FK immutable after create (see embedding-profile-storage doc)

Synthesis global?
  -> runtime_settings.activeSynthesisProfileId
  -> Injected into LightRAG as LLM_MODEL (entity/relation extraction at index)
  -> Same profile used for P7 grounded chat synthesis in v1
```

---

## Three model roles in RAG + LightRAG

| Role | Purpose | When | App mapping |
|------|---------|------|-------------|
| **Embedding** | Vector similarity search | Index + retrieve | `model_profiles.profile_kind = embedding` → `domains.embedding_profile_id` |
| **Indexing / KG LLM** | Entity + relation extraction → knowledge graph | LightRAG ingest (P5) | Active synthesis profile → LightRAG `LLM_MODEL` |
| **Query / synthesis LLM** | Grounded answer from evidence | Chat turn (P7) | `runtime_settings.active_synthesis_profile_id` |

v1 uses **one synthesis profile** for both indexing KG and chat query (matches old server `default_llm_profile_id` → LightRAG `LLM_MODEL`).

```text
Source Document
      │
      ▼
LightRAG INDEX (P5)
      ├─► EMBEDDING_MODEL ── vectors (per-domain embedding profile)
      └─► LLM_MODEL       ── entities + relations → KNOWLEDGE GRAPH (active synthesis)

User question (P7)
      ▼
LightRAG RETRIEVE → SYNTHESIS LLM (active synthesis) → grounded answer
```

---

## Connection to embedding profile storage (ID-A core concern)

From [ID-A.md](./ID-A.md) grill tree and [ID-A-embedding-profile-storage.md](./ID-A-embedding-profile-storage.md):

| Rule | Catalog impact |
|------|----------------|
| `domains.embedding_profile_id` NOT NULL FK | Domain create **must** reference a seeded **embedding** profile id |
| Validate at create via `TrustedRuntimeResolver` | Profile must exist, be `embedding` kind, provider ready |
| Immutable after create | Admin cannot change domain embedding later — **choose carefully at domain create** |
| FK blocks profile PATCH/DELETE | Once a domain references a profile, that row is locked |
| No global default embedding in `runtime_settings` | Default is a **seed convention** + UI preselect, not a runtime_settings column |

**Implication for catalog:** seed multiple embedding profiles so admin can pick Bedrock/OpenAI alternatives at **domain create**. Changing embedding for an existing domain is out of scope (would require re-index migration policy).

**Implication for synthesis:** admin switches `activeSynthesisProfileId` in Settings. Affects **new** LightRAG runtime boots and chat. Graphs already indexed used whatever synthesis model was active at index time.

---

## Default OpenAI policy (fresh install)

Applied when `seed_runtime_config()` runs and profile rows are absent (idempotent).

| Seed key | `name` | `profileKind` | `providerKind` | `modelName` | `vectorDimensions` | `isDefault` | `isActive` |
|----------|--------|---------------|----------------|-------------|---------------------|-------------|------------|
| `openai-embedding-default` | OpenAI Default Embedding | `embedding` | `openai` | `text-embedding-3-small` | `1536` | **yes** (domain-create preselect) | — |
| `openai-synthesis-default` | OpenAI Default Synthesis | `synthesis` | `openai` | `gpt-4.1-mini` | — | **yes** (synthesis default) | **yes** after OpenAI credential configured |

**Activation rules**

- Set `runtime_settings.active_synthesis_profile_id` to OpenAI Default Synthesis **only when** `provider_configs.openai.isConfigured`.
- Until OpenAI credential is set: leave `active_synthesis_profile_id` null; UI shows “Configure OpenAI to activate defaults.”
- Domain create preselects `openai-embedding-default` profile id in embedding dropdown.

---

## Full seeded profile catalog

Seed all rows idempotently (`seed_key` or `name` + `modelName` + `profileKind` + `providerKind` uniqueness). Only defaults are active/preselected; rest are admin-selectable alternatives.

### Embedding profiles (`profileKind: embedding`)

| `seed_key` | `name` | `providerKind` | `modelName` | `vectorDimensions` | `isDefault` | Provider gate |
|------------|--------|----------------|-------------|-------------------|-------------|---------------|
| `openai-embedding-default` | OpenAI Default Embedding | `openai` | `text-embedding-3-small` | `1536` | **yes** | OpenAI configured |
| `openai-embedding-large` | OpenAI Embedding Large | `openai` | `text-embedding-3-large` | `3072` | no | OpenAI configured |
| `openai-embedding-ada002` | OpenAI Embedding Ada 002 (legacy) | `openai` | `text-embedding-ada-002` | `1536` | no | OpenAI configured |
| `bedrock-titan-embed-v2` | Bedrock Titan Embed v2 | `bedrock` | `amazon.titan-embed-text-v2:0` | `1024` | no | Bedrock configured |
| `bedrock-cohere-embed-v4` | Bedrock Cohere Embed v4 | `bedrock` | `cohere.embed-v4:0` | `1536` | no | Bedrock configured |
| `bedrock-cohere-embed-en-v3` | Bedrock Cohere Embed English v3 | `bedrock` | `cohere.embed-english-v3` | `1024` | no | Bedrock configured |
| `bedrock-cohere-embed-multi-v3` | Bedrock Cohere Embed Multilingual v3 | `bedrock` | `cohere.embed-multilingual-v3` | `1024` | no | Bedrock configured |
| `bedrock-titan-embed-v1` | Bedrock Titan Embed v1 (legacy) | `bedrock` | `amazon.titan-embed-text-v1` | `1536` | no | Bedrock configured |

**LightRAG injection:** `EMBEDDING_MODEL` = `modelName`, `EMBEDDING_DIM` = `vectorDimensions` from domain’s locked embedding profile.

**Configurable dimensions note:** OpenAI and some Bedrock models support runtime `dimensions` / `output_dimension` params. Profile `vectorDimensions` is the **locked contract value** — runtime must use the same value at index time.

### Synthesis profiles (`profileKind: synthesis`)

| `seed_key` | `name` | `providerKind` | `modelName` | `isDefault` | `isActive` (initial) | Provider gate |
|------------|--------|----------------|-------------|-------------|------------------------|---------------|
| `openai-synthesis-default` | OpenAI Default Synthesis | `openai` | `gpt-4.1-mini` | **yes** | **yes** (when OpenAI ready) | OpenAI configured |
| `openai-gpt-4-1` | OpenAI GPT-4.1 | `openai` | `gpt-4.1` | no | no | OpenAI configured |
| `openai-gpt-4-1-nano` | OpenAI GPT-4.1 Nano | `openai` | `gpt-4.1-nano` | no | no | OpenAI configured |
| `openai-gpt-4o` | OpenAI GPT-4o | `openai` | `gpt-4o` | no | no | OpenAI configured |
| `openai-gpt-4o-mini` | OpenAI GPT-4o Mini | `openai` | `gpt-4o-mini` | no | no | OpenAI configured |
| `bedrock-claude-sonnet-4-5` | Bedrock Claude Sonnet 4.5 | `bedrock` | `anthropic.claude-sonnet-4-5-20250929-v1:0` | no | no | Bedrock configured |
| `bedrock-claude-35-sonnet-v2` | Bedrock Claude 3.5 Sonnet v2 | `bedrock` | `anthropic.claude-3-5-sonnet-20241022-v2:0` | no | no | Bedrock configured |
| `bedrock-claude-35-haiku` | Bedrock Claude 3.5 Haiku | `bedrock` | `anthropic.claude-3-5-haiku-20241022-v1:0` | no | no | Bedrock configured |
| `bedrock-claude-3-opus` | Bedrock Claude 3 Opus | `bedrock` | `anthropic.claude-3-opus-20240229-v1:0` | no | no | Bedrock configured |
| `bedrock-cohere-command-r-plus` | Bedrock Cohere Command R+ | `bedrock` | `cohere.command-r-plus-v1:0` | no | no | Bedrock configured |
| `bedrock-cohere-command-r` | Bedrock Cohere Command R | `bedrock` | `cohere.command-r-v1:0` | no | no | Bedrock configured |
| `bedrock-llama-33-70b` | Bedrock Llama 3.3 70B Instruct | `bedrock` | `meta.llama3-3-70b-instruct-v1:0` | no | no | Bedrock configured |

**Excluded from v1 catalog (reasoning-first, poor KG extraction default):** `o3-mini`, `o4-mini`.

**LightRAG injection:** `LLM_MODEL` = active synthesis profile `modelName`.

---

## Admin selection surfaces

| Surface | API | Selection rule |
|---------|-----|----------------|
| Provider credentials | `PUT /admin/runtime-settings/providers/{provider_kind}` | Unlocks catalog rows for that provider |
| Active synthesis (KG + chat) | `PATCH /admin/runtime-settings` → `activeSynthesisProfileId` | Dropdown: synthesis profiles where provider ready |
| Domain embedding | `POST /admin/domains` → `embeddingProfileId` | Dropdown: embedding profiles where provider ready; preselect default |
| Parser | `PATCH /admin/runtime-settings` → `activeParserKind` | Unrelated to model catalog |

**UI (Slice 07 Provider panel):** catalog-backed `Select` only — no free-text `modelName`. Disable options when provider not configured.

**Backend hardening (recommended):** reject `POST/PATCH /admin/runtime-settings/model-profiles` when `modelName` not in catalog for given `providerKind` + `profileKind`.

---

## Spec / ADR targets for coding agent

Patch these after review (do not implement before contract update):

| Target | Change |
|--------|--------|
| `specs/03-contracts/data/context-engine-data.md` | Document optional `seed_key` on profiles OR seed idempotency rule; no new columns required if seed uses `name` uniqueness |
| `specs/03-contracts/api/context-engine-v1.md` | Catalog allowlist reference; `GET /admin/runtime-settings` may expose `isDefault` on profiles (optional DTO field); domain create preselect behavior |
| `docs/adr/` (new ADR) | **Model catalog + defaults**: OpenAI seed, admin override via settings, embedding per-domain FK immutability, synthesis global for KG+chat v1 |
| F-002 spec / plan | Extend `seed_runtime_config` + catalog constant + optional allowlist validation |
| F-003 spec / plan | Domain create validates embedding from catalog; default preselect |

---

## Implementation checklist (coding agent)

```text
1. Add MODEL_CATALOG constant (tables above) in backend
2. Extend seed_runtime_config(): seed all catalog rows + set active synthesis default when OpenAI ready
3. Optional: validate modelName against catalog on profile create/patch
4. TrustedRuntimeResolver: resolve_embedding_profile() for domain create (P3)
5. Domain create: preselect default embedding profile id; require embeddingProfileId
6. Settings UI: synthesis dropdown + domain-create embedding dropdown from GET /admin/runtime-settings
7. LightRAG runtime bootstrap (P3/P5): EMBEDDING_* from domain profile, LLM_* from active synthesis
8. Tests: seed idempotency, default active after credential, domain create rejects invalid embedding, locked profile blocks delete
```

**Red flags**

- Free-text model id in admin UI
- Global default embedding column on `runtime_settings`
- Allowing domain embedding change after create
- Mixing embedding models within one domain index
- `vectorDimensions` mismatch vs provider output

---

## Open decisions (for ADR grill)

| # | Question | Lean recommendation |
|---|----------|---------------------|
| 1 | Expose `isDefault` on profile DTO? | yes — simplifies UI preselect |
| 2 | Strict API catalog allowlist? | yes — internal admin, prevents typos |
| 3 | Store `seed_key` column on `model_profiles`? | optional — can derive from seed idempotency on `(providerKind, profileKind, modelName)` |
| 4 | Separate indexing LLM vs query LLM profiles? | defer — v1 single active synthesis |
| 5 | Bedrock region-specific model id variants? | deployment env documents enabled ids; catalog uses standard ids |

---

## Entity diagram (profiles + domains)

```text
model_profiles (seeded catalog)
  ├── embedding profiles ──selected at──► domains.embedding_profile_id (immutable FK)
  └── synthesis profiles ──active one──► runtime_settings.active_synthesis_profile_id
                                              │
                                              ├──► LightRAG LLM_MODEL (KG index)
                                              └──► P7 chat synthesis (v1 same profile)
```
