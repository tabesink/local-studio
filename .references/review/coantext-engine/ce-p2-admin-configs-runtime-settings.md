# Context Engine — Phase 2: Trusted Provider, Model, and Parser Configuration

**Status:** Greenfield implementation plan — revised after v1 Settings/API review  
**Build style:** API-first. Junior-dev friendly.  
**Goal:** Admin-only trusted configuration. Server owns provider credentials, allowed model profiles, active synthesis selection, parser selection, endpoint policy, and private resolution.  
**Depends on:** Phase 1 — Trusted Application Foundation.  
**Deferred:** browser client, domains, LightRAG, Docker lifecycle, documents, parsing execution, queues/workers, provider SDKs, provider network calls, chat, SSE, provider discovery, model-catalog sync, runtime secret-file injection, audit platform.

---

## 0. Read This First

### Build target

```text
Admin API client / curl / tests
        ↓
Context Engine API
        ↓
PostgreSQL
  ├─ provider_configs
  │   └─ encrypted provider credentials + Bedrock region
  ├─ model_profiles
  │   └─ explicit admin allowlist of usable synthesis/embedding models
  └─ runtime_settings
      └─ active synthesis profile + active parser
        ↓
TrustedRuntimeResolver
  ├─ active synthesis config
  ├─ requested embedding config
  └─ active parser config
```

Phase 2 proves:

```text
admin login
→ configure OpenAI / Bedrock / Reducto credential
→ API encrypts credential before DB write
→ create explicit synthesis + embedding model profiles
→ set one active global synthesis profile
→ select docling or reducto parser
→ server resolves trusted private config
→ member cannot read/change config
→ API never returns raw credential/ciphertext
```

### This phase fixes current v1 configuration entropy

Legacy v1 is reference only. Do not preserve its DB/API shape.

| Legacy v1 pattern | Phase 2 decision |
|---|---|
| Model profile stores provider, model, arbitrary `base_url`, secret env-var name, binding, dimensions, token limit, flags, free-form `extra` | Split known provider config from model profile. No arbitrary URL, secret-name, binding, JSON blob, token-limit, or transport flags. |
| `provider-secrets/{secret_name}` lets caller target a named secret | Known provider enum only. No user-controlled secret identifier. |
| Provider credentials may resolve from encrypted DB or process env | Provider credentials resolve from encrypted DB only. `.env` owns encryption root + deployment infrastructure only. |
| Secret version rows, synthesis candidates, validation, revision numbers, supersession, activation workflow | One connection/config per known provider. Rotate credential in place. One active synthesis profile. No profile/secret revisions. |
| Configuration save/test can probe provider `/models` | No provider call in Phase 2. Save = persist validated local shape only. |
| Separate AI settings and parser settings systems | One `runtime_settings` singleton + one `TrustedRuntimeResolver`. |
| Global default embedding profile | No global embedding default. Phase 3 selects one embedding profile per domain; Phase 5 locks it after first successful indexing. |
| Runtime config must be re-applied to stale domains | No domain/runtime exists. Later runtime reads resolved config through one private boundary; no browser-triggered sync action. |

Reference evidence reviewed:

```text
app/api/routes/ai_settings.py
app/schemas/ai_settings.py
app/services/ai_model_settings_service.py
app/storage/repositories/ai_model_settings.py
app/storage/repositories/ai_provider_secrets.py
app/api/routes/document_parser_settings.py
```

### Do not build

```text
Next.js
React
browser client
provider SDKs
OpenAI/Boto/Ollama/Reducto clients
provider model discovery
provider test-connection route
provider `/models` calls
model-catalog persistence/sync
generic provider registry
generic plugin loader
generic config key/value table
generic JSON settings field
arbitrary provider base URL
browser-selected provider/model/parser
provider fallback chains
credential history/version rows
synthesis candidate/revision workflow
runtime-sync/stale-domain workflow
domain runtime files
domain.env
Docker Compose secret injection
Redis
RQ/Celery
workers
documents
Docling/Reducto execution
LightRAG
chat
SSE
prompt editor
temperature/top-k/reranker config
secret-manager/KMS integration
encryption-key rotation
CLI/operator commands
```

Reason:

```text
Phase 2 = trusted config boundary.

No provider/runtime/document flow exists yet.
Persist only data later phases must resolve.
```

---

## 1. Core Rules

1. Phase 1 opaque HttpOnly DB-backed session + server role contract stays unchanged.
2. All Phase 2 routes require `require_admin`.
3. `member` gets `403`. Anonymous gets `401`.
4. No browser client is built in this phase.
5. Future client contract exposes safe config summaries only. Never raw credential or ciphertext.
6. User/chat/document requests never choose provider, model, parser, credential, endpoint, prompt, embedding model, reranker, top-k, or retrieval mode.
7. Provider set is closed code enum:

```text
openai
bedrock
ollama
reducto
```

8. No admin creates arbitrary providers.
9. No model profile stores a URL.
10. No provider credential uses a caller-controlled secret name.
11. Model profile stores exact opaque `model_id`, not a hardcoded catalog enum.
12. Explicit model profiles are Context Engine allowlist:

```text
provider account access
→ provider/model profile created by admin
→ only selected profile usable by runtime
```

13. One global active synthesis profile exists at most.
14. No global active embedding profile.
15. Phase 3 selects one embedding profile for a new domain.
16. Phase 5 locks chosen embedding profile for indexed domain.
17. Docling is default parser. It needs no credential.
18. Reducto parser requires configured Reducto credential.
19. Only `TrustedRuntimeResolver` decrypts provider credentials.
20. Raw credential exists only:
    - inbound admin request;
    - short-lived server memory during encrypt/decrypt;
    - future private provider/runtime call.
21. Raw credential never appears in:
    - API response;
    - DB plaintext;
    - logs;
    - exceptions;
    - OpenAPI examples;
    - browser state;
    - process-generated runtime file;
    - Docker Compose;
    - `.env` except encryption root.
22. No provider call during create, update, delete, resolve, startup, health, or test.
23. No decrypted credential cache.
24. No profile versioning. Config update affects later work only.
25. Later Phase 7 freezes resolved synthesis config once per chat turn. Retry uses same frozen config.
26. Later domain/runtime code gets config only through resolver. It never reads provider DB tables directly.

---

## 2. Model IDs and Endpoint Ownership

### 2.1 Model identifiers

Admin stores exact provider identifiers in `model_profiles.model_id`.

Examples only:

```text
OpenAI synthesis:   gpt-4.1
OpenAI embedding:   text-embedding-3-small
Bedrock synthesis:  openai.gpt-oss-20b-1:0
Bedrock embedding:  amazon.titan-embed-text-v2:0
Ollama synthesis:   qwen3:8b
```

`display_name` = human label.  
`model_id` = exact runtime identifier.

No hardcoded model list. No `.env` model list. No remote catalog stored in DB.

Reason:

```text
provider availability changes
provider account access changes
Bedrock model access changes by Region
admin-curated model profile = small explicit allowlist
```

Later phase may add on-demand server-side discovery. Do not build discovery now.

### 2.2 Endpoint URLs

Endpoint policy belongs in code/infrastructure. Never in `model_profiles`.

| Provider | URL source | Stored in DB | Stored in `.env` | Phase 2 behavior |
|---|---|---|---|---|
| OpenAI | Code-owned official endpoint | No URL | No URL | Credential config + model profile only |
| Amazon Bedrock | Provider adapter derives endpoint from selected Region + needed API capability | `region` only | No URL | Credential config + Region + model profile only |
| Ollama | Deployment infrastructure | No URL | `OLLAMA_BASE_URL` optional | Provider config + model profile only |
| Reducto | Code-owned service endpoint | No URL | No URL | Credential config + parser selection only |

Rules:

```text
OpenAI:
  endpoint is code-owned.
  no admin base-url input.

Bedrock:
  admin chooses Region.
  endpoint derived by server adapter later.
  no admin endpoint input.
  no native SigV4 implementation in Phase 2.
  Phase 5/7 selects compatible Bedrock transport by purpose/model capability.

Ollama:
  endpoint is deployment infrastructure.
  OLLAMA_BASE_URL in .env.
  admin cannot change host URL.
  model ID remains DB profile data.

Reducto:
  endpoint code-owned.
  admin rotates API key only.
```

### 2.3 Why no arbitrary `base_url`

```text
arbitrary DB URL
→ typo / config drift / SSRF surface / provider behavior ambiguity

known provider kind + code endpoint policy
→ one trusted request path
→ stable later runtime adapter
```

### 2.4 Why model discovery is deferred

```text
model discovery
→ provider HTTP client
→ credential validation / timeout / provider error contract
→ duplicate runtime behavior before runtime exists

Phase 2:
  manual exact model ID
  explicit profile allowlist
  no network dependency

Later phase:
  optional server-only discovery
  ephemeral picker data
  selected model ID saved into same model_profiles table
  catalog never becomes source of truth
```

---

## 3. Done Means

Phase complete only when all pass:

```text
1. Phase 1 test gate passes unchanged.
2. docker compose up --build works.
3. 0002 migration runs after 0001.
4. API startup fails when CONFIG_ENCRYPTION_KEY missing/invalid.
5. Provider-config rows exist for openai, bedrock, ollama, reducto.
6. Admin updates OpenAI credential.
7. DB stores ciphertext, never submitted raw credential.
8. Admin rotates same provider credential in place.
9. Admin sets Bedrock Region and credential.
10. API rejects unknown provider kind or invalid Region shape.
11. Admin creates synthesis profile for OpenAI/Bedrock/Ollama.
12. Admin creates embedding profile with required vector dimensions.
13. API rejects Reducto model profile.
14. Admin activates one ready synthesis profile.
15. API rejects active synthesis profile whose provider config is unready.
16. Admin selects docling parser.
17. Admin selects reducto parser only when Reducto credential exists.
18. TrustedRuntimeResolver resolves active synthesis, requested embedding, active parser.
19. Resolver rejects missing/invalid configuration.
20. Member gets 403 for every Phase 2 route.
21. Anonymous gets 401 for every Phase 2 route.
22. Active synthesis profile delete returns 409.
23. No API output includes credential/ciphertext.
24. No provider network call occurs in tests.
25. pytest passes.
26. OpenAPI snapshot passes.
```

---

## 4. Runtime

## Containers

| Container | Job | Public? | Data |
|---|---|---:|---|
| `postgres` | Users, sessions, trusted runtime config | No | `postgres_data` volume |
| `migrate` | Runs Alembic once | No | None |
| `api` | FastAPI auth + admin config API + private resolver | Local dev port only | None |

## Compose flow

```text
postgres healthy
→ migrate: alembic upgrade head
→ api starts
→ config validates CONFIG_ENCRYPTION_KEY
→ Phase 1 seed admin reconciles
→ /health/live = 200
→ /health/ready = 200
```

## Compose rules

```text
Keep Phase 1 Compose shape.

No Docker socket.
No Redis.
No worker.
No provider service.
No runtime-secret volume.
No provider secret mounted through Compose.
No NEXT_PUBLIC provider/model/config variables.
No provider URL except optional OLLAMA_BASE_URL process config.
```

---

## 5. Repository Layout

Add only this.

```text
context-engine/
├── .env.example
├── backend/
│   ├── alembic/
│   │   └── versions/
│   │       └── 0002_trusted_runtime_config.py
│   ├── app/
│   │   ├── api/
│   │   │   └── v1/
│   │   │       └── admin_runtime_config.py
│   │   ├── core/
│   │   │   ├── config.py
│   │   │   ├── secrets.py
│   │   │   └── provider_policy.py
│   │   ├── db/
│   │   │   ├── models/
│   │   │   │   └── trusted_runtime_config.py
│   │   │   └── repositories/
│   │   │       └── trusted_runtime_config.py
│   │   ├── schemas/
│   │   │   └── trusted_runtime_config.py
│   │   └── services/
│   │       ├── trusted_runtime_config.py
│   │       └── trusted_runtime_resolver.py
│   └── tests/
│       ├── integration/
│       │   └── test_admin_runtime_config.py
│       └── unit/
│           ├── test_secret_cipher.py
│           ├── test_provider_policy.py
│           ├── test_trusted_runtime_config.py
│           └── test_trusted_runtime_resolver.py
└── docs/
    └── api/
        ├── openapi.phase-2.json
        └── phase-2-contract.md
```

## File ownership

| File/group | Owns |
|---|---|
| `core/config.py` | env config validation; encryption root; optional Ollama base URL |
| `core/secrets.py` | maintained-library encrypt/decrypt only |
| `core/provider_policy.py` | fixed provider enum, local validation, endpoint ownership policy |
| `models/trusted_runtime_config.py` | SQLAlchemy rows/enums only |
| `repositories/trusted_runtime_config.py` | DB reads/writes only |
| `services/trusted_runtime_config.py` | admin mutations, validation, delete guard, encryption |
| `services/trusted_runtime_resolver.py` | internal private config resolution + decryption only |
| `schemas/trusted_runtime_config.py` | HTTP DTOs, safe responses only |
| `api/v1/admin_runtime_config.py` | HTTP request/response only |
| `main.py` | router registration only |
| `alembic/` | migration history |
| `tests/` | proof |

Bad:

```text
route decrypts credential
route writes SQL
route calls provider
route accepts arbitrary base URL
profile contains API key / env var name
provider config read directly by LightRAG service
client controls runtime config
generic JSON config blob
provider plugin framework
provider discovery cache
credential history table
runtime file written on save
```

Correct:

```text
route
→ TrustedRuntimeConfigService
→ repository
→ encrypted DB write

future runtime caller
→ TrustedRuntimeResolver
→ private resolved config
→ provider adapter
```

---

## 6. Dependencies

Keep Phase 1 dependencies.

Add only:

```text
cryptography
```

Use:

```text
cryptography.fernet.Fernet
```

Reason:

```text
maintained authenticated encryption
single deployment-held root key
small internal app fit
no custom crypto
```

Do not add:

```text
OpenAI SDK
boto3 / AWS SDK
Ollama SDK
Reducto SDK
httpx provider client
vault/KMS client
provider plugin framework
settings framework
secret ORM type
generic encryption abstraction
```

---

## 7. Environment Configuration

## 7.1 `.env.example`

Add:

```dotenv
# Generate once:
# python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
CONFIG_ENCRYPTION_KEY=replace-with-generated-fernet-key

# Optional. Required later only when an Ollama model profile is used.
# Deployment-owned internal URL. Never browser-visible.
OLLAMA_BASE_URL=http://ollama:11434/v1
```

Keep Phase 1 settings:

```dotenv
APP_ENV=development
DATABASE_URL=postgresql+psycopg://context_engine:change-me@postgres:5432/context_engine
SEED_ADMIN_USERNAME=admin
SEED_ADMIN_PASSWORD=change-me
SESSION_TTL_HOURS=168
COOKIE_SECURE=false
LOG_LEVEL=INFO
```

Do not add:

```dotenv
OPENAI_API_KEY=
AWS_BEARER_TOKEN_BEDROCK=
REDUCTO_API_KEY=
OPENAI_BASE_URL=
BEDROCK_BASE_URL=
NEXT_PUBLIC_OPENAI_*
NEXT_PUBLIC_BEDROCK_*
NEXT_PUBLIC_MODEL_*
```

## 7.2 Rules

| Setting | Rule |
|---|---|
| `CONFIG_ENCRYPTION_KEY` | Required outside test runtime |
| Key format | Valid Fernet generated key |
| Missing/invalid key | API startup fails |
| Test key | Fixed fixture key only |
| Key output | Never log |
| Key browser exposure | Never |
| Key rotation | Deferred |
| `OLLAMA_BASE_URL` | Optional in Phase 2; required later when Ollama profile resolves |
| Provider credential | DB ciphertext only |
| OpenAI/Bedrock/Reducto URL | Code policy only |
| Model IDs | DB model profiles only |

Do not derive encryption key from:

```text
SEED_ADMIN_PASSWORD
DATABASE_URL
app name
random startup value
```

Reason:

```text
restart must decrypt stored provider credentials.
```

---

## 8. Database Model

## 8.1 Enums

```ts
type ProviderKind =
  | "openai"
  | "bedrock"
  | "ollama"
  | "reducto";

type ModelPurpose =
  | "synthesis"
  | "embedding";

type ParserKind =
  | "docling"
  | "reducto";
```

No enum for:

```text
model IDs
retrieval modes
top-k
reranker
prompt presets
provider URL modes
domain/job states
```

Not Phase 2.

---

## 8.2 Provider config

Table: `provider_configs`

Exactly one row per known provider kind.

```ts
type ProviderConfig = {
  kind: ProviderKind;                 // PK
  region: string | null;              // Bedrock only
  secretCiphertext: string | null;    // OpenAI / Bedrock / Reducto only
  createdAt: string;
  updatedAt: string;
  createdByUserId: string | null;
  updatedByUserId: string | null;
};
```

Migration seeds four rows:

```text
openai
bedrock
ollama
reducto
```

### Rules

```text
provider kind cannot create/delete/rename
OpenAI:
  region = null
  secret required before active synthesis profile can use it

Bedrock:
  region required
  region = lowercase AWS-region format
  secret required before active synthesis profile can use it

Ollama:
  region = null
  secret = null
  endpoint comes only from OLLAMA_BASE_URL

Reducto:
  region = null
  secret required before active reducto parser selection

raw credential never leaves service/resolver boundary
no secret name field
no URL field
no API version field
no `enabled` field
no credential version/history
```

### Required constraints/indexes

```text
provider_configs:
  PK kind
  FK created_by_user_id -> users.id
  FK updated_by_user_id -> users.id
  CHECK:
    openai  -> region is null
    bedrock -> region is not null when configured for use
    ollama  -> region is null and secret_ciphertext is null
    reducto -> region is null
```

Use service validation for encrypted-secret and runtime-readiness rules.

---

## 8.3 Model profiles

Table: `model_profiles`

```ts
type ModelProfile = {
  id: string;                           // UUID
  displayName: string;                  // admin label; unique
  purpose: ModelPurpose;                // synthesis | embedding
  providerKind: "openai" | "bedrock" | "ollama";
  modelId: string;                      // exact opaque provider ID
  vectorDimensions: number | null;      // embedding only
  createdAt: string;
  updatedAt: string;
  createdByUserId: string;
  updatedByUserId: string;
};
```

### Rules

```text
displayName unique
providerKind immutable after create
purpose immutable after create
modelId non-empty opaque string
modelId manually supplied by admin
providerKind = reducto rejected
synthesis:
  vectorDimensions = null
embedding:
  vectorDimensions required; positive integer

no baseUrl
no API key env variable
no secret field
no binding/transport field
no token limit
no send-dimensions flag
no base64 flag
no generic extra JSON
no enabled flag
no version/revision/supersession
```

### Embedding dimensions

`vectorDimensions` is required because Phase 3/5 needs a stable vector-store dimension for a domain.

Rules:

```text
admin enters model's intended output dimension
profile is selected once at domain creation
domain stores profile ID
after first successful index:
  embedding profile/domain pairing cannot change in place
  later explicit re-embed workflow required
```

No dimension validation against provider in Phase 2. No provider calls exist.

### Required constraints/indexes

```text
model_profiles:
  PK id
  UNIQUE display_name
  INDEX purpose
  INDEX provider_kind
  FK provider_kind -> provider_configs.kind ON DELETE RESTRICT
  FK created_by_user_id -> users.id
  FK updated_by_user_id -> users.id
  CHECK:
    synthesis -> vector_dimensions is null
    embedding -> vector_dimensions is not null and > 0
```

---

## 8.4 Runtime settings

Table: `runtime_settings`

Exactly one row.

```ts
type RuntimeSettings = {
  singleton: true;                          // fixed PK
  activeSynthesisProfileId: string | null;
  activeParserKind: ParserKind;             // default docling
  updatedAt: string;
  updatedByUserId: string | null;
};
```

### Initial migration row

```text
singleton = true
activeSynthesisProfileId = null
activeParserKind = docling
updatedByUserId = null
```

### Rules

```text
one row only

activeSynthesisProfileId:
  null = no active synthesis config
  non-null = existing synthesis model profile
  provider config must be ready before activation

docling:
  no credential required

reducto:
  provider_configs.reducto must contain a credential before selection

no active embedding profile
no parser-profile table
no separate parser-settings subsystem
no generic key/value settings
```

### Required constraints

```text
PK singleton
CHECK singleton = true
FK active_synthesis_profile_id -> model_profiles.id ON DELETE RESTRICT
FK updated_by_user_id -> users.id
```

Cross-row capability/readiness checks stay in service layer.

---

## 8.5 Migration

Create:

```text
0002_trusted_runtime_config
```

Must:

```text
create provider_configs
insert four provider rows
create model_profiles
create runtime_settings
insert singleton runtime row
create FKs/checks/indexes
support downgrade in dev
run after Phase 1 on blank Postgres
```

Do not seed:

```text
OpenAI model IDs
Bedrock model IDs
Ollama model IDs
provider credentials
active synthesis profile
Reducto parser
```

Reason:

```text
model availability/account access are external.
safe default = no active synthesis + docling parser.
```

---

## 9. Secret Design

## 9.1 Encrypt/decrypt boundary

```text
Admin config request
→ TrustedRuntimeConfigService
→ SecretCipher.encrypt(raw credential)
→ provider_configs.secret_ciphertext

Future private runtime call
→ TrustedRuntimeResolver
→ SecretCipher.decrypt(ciphertext)
→ private resolved config
→ provider adapter
```

`SecretCipher` stays tiny.

```python
class SecretCipher:
    def encrypt(self, raw_secret: str) -> str: ...
    def decrypt(self, ciphertext: str) -> str: ...
```

Rules:

```text
use Fernet only
no custom cipher
no manual AES
no raw credential storage
no decrypt in route
no decrypt in repository
no decrypt for GET response
no decrypted credential cache
no repr/print of resolved private config
```

## 9.2 Rotation

```text
PUT provider config with new credential
→ validate local input
→ encrypt replacement
→ update same provider row
→ updatedAt + updatedBy
→ old ciphertext replaced
→ no history/version row
→ existing model profile IDs stay unchanged
```

Phase 2 result:

```text
credential stored = configured
credential stored ≠ provider accepted
```

Provider acceptance test belongs where real runtime adapter/provider call exists.

## 9.3 Safe response

```json
{
  "kind": "openai",
  "isConfigured": true,
  "region": null,
  "updatedAt": "2026-06-26T12:00:00Z",
  "updatedByUserId": "uuid"
}
```

Never return:

```json
{
  "secret": "...",
  "apiKey": "...",
  "secretCiphertext": "...",
  "configEncryptionKey": "...",
  "baseUrl": "..."
}
```

---

## 10. Trusted Resolution

## 10.1 Canonical owner

```text
TrustedRuntimeResolver
```

No other service resolves:

```text
provider credential
active synthesis profile
embedding profile
active parser
provider Region
Ollama deployment endpoint
```

## 10.2 Private resolved types

```ts
type ResolvedModelProfile = {
  profileId: string;
  purpose: "synthesis" | "embedding";
  providerKind: "openai" | "bedrock" | "ollama";
  modelId: string;
  vectorDimensions: number | null;
  providerSecret: string | null;
  region: string | null;
  ollamaBaseUrl: string | null;
};

type ResolvedParser = {
  kind: "docling" | "reducto";
  providerSecret: string | null;
};
```

Private result rules:

```text
never route response
never serialize
never log
never store
never cache
never pass to browser
```

No endpoint field needed in resolver result. Future provider adapter owns exact endpoint construction.

## 10.3 Resolver methods

```python
resolve_active_synthesis() -> ResolvedModelProfile
resolve_embedding_profile(profile_id: UUID) -> ResolvedModelProfile
resolve_active_parser() -> ResolvedParser
```

## 10.4 Resolver rules

### `resolve_active_synthesis`

```text
read runtime_settings
→ active synthesis profile required
→ profile purpose = synthesis
→ provider config must be ready
→ decrypt credential only when provider requires it
→ Ollama requires OLLAMA_BASE_URL
→ return private resolved config
```

Missing profile:

```text
raise ConfigurationUnavailable("active_synthesis_profile_missing")
```

### `resolve_embedding_profile`

```text
read exact requested profile
→ profile purpose = embedding
→ vectorDimensions required
→ provider config must be ready
→ decrypt credential only when required
→ Ollama requires OLLAMA_BASE_URL
→ return private resolved config
```

Phase 3 calls this only during domain creation.  
Phase 5 calls it for LightRAG embedding configuration.

### `resolve_active_parser`

```text
read runtime_settings

docling:
  return kind=docling, providerSecret=null

reducto:
  require encrypted Reducto credential
  decrypt only now
  return kind=reducto, private providerSecret
```

## 10.5 Error behavior

Internal only:

```text
ConfigurationUnavailable
ConfigurationInvalid
```

Future phases map these to safe typed API errors.

No error exposes:

```text
raw credential
cipher/decryption internals
provider endpoint
database error
stack trace
```

---

## 11. Admin API Contract

All Phase 2 routes:

```text
/api/v1/admin/runtime-settings
```

All routes require:

```python
AdminUser = Depends(require_admin)
```

No member config routes. No public config route. No client implementation in this phase.

---

## 11.1 Read full safe config

### `GET /api/v1/admin/runtime-settings`

Response `200`:

```json
{
  "providers": [
    {
      "kind": "openai",
      "isConfigured": true,
      "region": null,
      "updatedAt": "2026-06-26T12:00:00Z",
      "updatedByUserId": "uuid"
    },
    {
      "kind": "bedrock",
      "isConfigured": true,
      "region": "us-east-1",
      "updatedAt": "2026-06-26T12:00:00Z",
      "updatedByUserId": "uuid"
    },
    {
      "kind": "ollama",
      "isConfigured": true,
      "region": null,
      "updatedAt": "2026-06-26T12:00:00Z",
      "updatedByUserId": "uuid"
    },
    {
      "kind": "reducto",
      "isConfigured": false,
      "region": null,
      "updatedAt": "2026-06-26T12:00:00Z",
      "updatedByUserId": null
    }
  ],
  "modelProfiles": [
    {
      "id": "uuid",
      "displayName": "Primary chat",
      "purpose": "synthesis",
      "providerKind": "openai",
      "modelId": "gpt-4.1",
      "vectorDimensions": null,
      "createdAt": "2026-06-26T12:00:00Z",
      "updatedAt": "2026-06-26T12:00:00Z",
      "createdByUserId": "uuid",
      "updatedByUserId": "uuid"
    }
  ],
  "activeSynthesisProfileId": "uuid",
  "activeParserKind": "docling",
  "updatedAt": "2026-06-26T12:00:00Z",
  "updatedByUserId": "uuid"
}
```

`ollama.isConfigured` means `OLLAMA_BASE_URL` exists and has acceptable URL shape. It does not mean network reachable.

---

## 11.2 Update known provider config

### `PUT /api/v1/admin/runtime-settings/providers/{provider_kind}`

Allowed path values:

```text
openai
bedrock
ollama
reducto
```

OpenAI request:

```json
{
  "secret": "provider-api-key"
}
```

Bedrock request:

```json
{
  "region": "us-east-1",
  "secret": "bedrock-api-key"
}
```

Ollama request:

```json
{}
```

Reducto request:

```json
{
  "secret": "reducto-api-key"
}
```

Rules:

```text
openai:
  secret required
  region forbidden

bedrock:
  secret required
  region required

ollama:
  all request fields forbidden
  config readiness derives from OLLAMA_BASE_URL

reducto:
  secret required
  region forbidden

secret omitted:
  rejected for current Phase 2 provider update.
  Explicit full replacement keeps contract unambiguous.

secret null/empty/whitespace:
  422 validation_failed

unknown provider:
  404 not_found

no provider HTTP call
```

Response:

```text
safe ProviderConfig summary only
```

No secret clear endpoint. Replacing provider credential is intended rotation. Removing a provider from use requires removing or changing references first, then an explicit later lifecycle feature if needed.

---

## 11.3 Create model profile

### `POST /api/v1/admin/runtime-settings/model-profiles`

Synthesis request:

```json
{
  "displayName": "Primary chat",
  "purpose": "synthesis",
  "providerKind": "openai",
  "modelId": "gpt-4.1"
}
```

Embedding request:

```json
{
  "displayName": "OpenAI embeddings",
  "purpose": "embedding",
  "providerKind": "openai",
  "modelId": "text-embedding-3-small",
  "vectorDimensions": 1536
}
```

Rules:

```text
providerKind:
  openai | bedrock | ollama only

purpose:
  synthesis:
    vectorDimensions absent/null

  embedding:
    vectorDimensions required, positive

displayName unique
modelId non-empty
provider credential may be unconfigured at creation
unconfigured provider profile cannot become active synthesis profile
```

---

## 11.4 Update model profile

### `PATCH /api/v1/admin/runtime-settings/model-profiles/{profile_id}`

Allowed fields:

```json
{
  "displayName": "Primary chat v2",
  "modelId": "gpt-4.1-mini"
}
```

Embedding example:

```json
{
  "modelId": "text-embedding-3-large",
  "vectorDimensions": 3072
}
```

Rules:

```text
purpose immutable
providerKind immutable
embedding:
  modelId/vectorDimensions update together if dimensions change
active synthesis profile update applies to later turns only
Phase 7 freezes resolved config per submitted chat turn
Phase 3/5 later blocks embedding profile mutation once any domain references it
```

No profile revision/candidate created.

---

## 11.5 Delete model profile

### `DELETE /api/v1/admin/runtime-settings/model-profiles/{profile_id}`

Rules:

```text
active synthesis profile → 409 conflict
unreferenced profile → 204
not found → 404
```

Phase 3 adds:

```text
embedding profile referenced by domain → 409 conflict
```

---

## 11.6 Update global runtime settings

### `PATCH /api/v1/admin/runtime-settings`

Set active synthesis + docling:

```json
{
  "activeSynthesisProfileId": "uuid",
  "activeParserKind": "docling"
}
```

Set Reducto parser:

```json
{
  "activeParserKind": "reducto"
}
```

Unset active synthesis:

```json
{
  "activeSynthesisProfileId": null
}
```

Rules:

```text
partial update allowed

activeSynthesisProfileId:
  null = unset
  UUID = existing synthesis profile
  referenced provider config must be ready

activeParserKind:
  docling = always locally valid
  reducto = Reducto credential must exist

one DB transaction
updatedAt + updatedBy recorded
no provider request
```

---

## 11.7 Status/error map

Use Phase 1 typed error shape.

Add only:

```text
configuration_invalid
configuration_unavailable
```

| HTTP | Code | Use |
|---:|---|---|
| 401 | `unauthenticated` | no/invalid session |
| 403 | `forbidden` | member config request |
| 404 | `not_found` | unknown provider/profile |
| 409 | `conflict` | protected profile deletion |
| 422 | `validation_failed` | malformed field/body |
| 422 | `configuration_invalid` | invalid provider/profile/parser relationship |
| 500 | `internal_error` | unexpected safe failure |

Example:

```json
{
  "error": {
    "code": "configuration_invalid",
    "message": "Configuration is invalid.",
    "requestId": "..."
  }
}
```

No raw provider/cipher/DB error text.

---

## 12. Service Rules

## 12.1 `TrustedRuntimeConfigService`

Owns:

```text
provider config mutation
provider credential encryption
model profile create/update/delete
runtime settings update
known provider validation
Bedrock Region validation
model purpose/dimension validation
active-synthesis readiness validation
active-parser readiness validation
reference/delete guard
createdBy/updatedBy ownership
```

Does not own:

```text
provider HTTP calls
model discovery
LightRAG config
domain creation
document parsing
chat
retrieval
browser state
runtime file generation
```

## 12.2 `TrustedRuntimeResolver`

Owns:

```text
resolve active synthesis
resolve requested embedding profile
resolve active parser
credential decryption at private call point
Ollama deployment endpoint config read
```

Does not own:

```text
HTTP response
database write
credential rotation
profile mutation
provider request execution
cache
provider fallback
endpoint transport choice
```

## 12.3 `ProviderPolicy`

Pure code rules only:

```text
known provider kinds
credential-required provider kinds
region-required provider kinds
allowed model-profile provider kinds
code-owned endpoint ownership
```

No SDK. No HTTP. No registry abstraction.

## 12.4 Repository rules

```text
queries only
commit once per service action
no encrypt/decrypt
no HTTP
no DTO construction
no auth/role decision
no provider policy
```

## 12.5 Transaction boundary

Provider update:

```text
route
→ require_admin
→ TrustedRuntimeConfigService
→ validate provider-specific request shape
→ encrypt credential
→ update known provider row
→ commit once
→ safe DTO
```

Runtime settings update:

```text
route
→ require_admin
→ TrustedRuntimeConfigService
→ calculate final state
→ validate final active profile/parser state
→ update singleton row
→ commit once
→ safe DTO
```

No outbox. No queue. No async work.

---

## 13. Build Order

Do steps in order. Do not jump.

## Step 1 — Config root + DB schema

Build:

```text
add cryptography
add CONFIG_ENCRYPTION_KEY
add optional OLLAMA_BASE_URL
startup validation
provider policy
trusted config SQLAlchemy rows
0002 migration
seed known provider rows + singleton runtime row
```

Check:

```bash
docker compose up --build
docker compose exec api alembic current
```

Expected:

```text
0002_trusted_runtime_config
API starts with valid encryption key
API refuses missing/invalid encryption key
four provider rows exist
```

---

## Step 2 — Secret boundary + provider config

Build:

```text
SecretCipher
TrustedRuntimeConfigRepository
provider config mutations
safe provider DTOs
admin provider config endpoint
```

Check:

```text
admin updates OpenAI credential
stored DB value != raw credential
GET response shows isConfigured=true
GET response has no credential/ciphertext
admin replaces credential → one row updated
member gets 403
```

---

## Step 3 — Model profiles + active synthesis

Build:

```text
model profile mutation
purpose/dimension checks
model profile delete guard
runtime settings GET/PATCH
active synthesis validation
```

Check:

```text
admin creates OpenAI synthesis profile
admin creates embedding profile with dimensions
embedding profile rejected as active synthesis
Reducto model profile rejected
unconfigured provider profile rejected as active synthesis
active synthesis delete = 409
```

---

## Step 4 — Parser + private resolver

Build:

```text
active parser setting
docling/reducto validation
TrustedRuntimeResolver
private resolved dataclasses
ConfigurationUnavailable / ConfigurationInvalid
```

Check:

```text
docling resolves with no provider credential
reducto selection fails without credential
reducto resolves private credential after config
active synthesis resolver works
embedding resolver works
resolver never returns HTTP DTO
```

---

## Step 5 — Contract + tests + docs

Build:

```text
OpenAPI snapshot
unit tests
integration tests
Compose checks
README config section
phase-2 API contract
```

Check:

```bash
pytest
```

Expected:

```text
all green
no provider network calls
```

---

## 14. Tests

## 14.1 Unit

| Test | Must prove |
|---|---|
| Fernet config validation | Missing/invalid key fails config startup |
| Encryption | Raw credential decrypts correctly |
| Encryption storage | Ciphertext differs from raw credential |
| Provider rotation | Same provider row resolves new credential |
| Safe DTO | Credential/ciphertext impossible in output |
| Provider policy | Known provider rules exact |
| Provider validation | OpenAI/Bedrock/Ollama/Reducto field rules |
| Bedrock Region | Required only for Bedrock; invalid shape rejects |
| Model validation | Reducto cannot have model profile |
| Embedding validation | Dimensions required and positive |
| Active synthesis | Synthesis purpose + ready provider only |
| Parser selection | Docling needs no credential; Reducto needs credential |
| Profile delete guard | Active synthesis profile cannot delete |
| Resolver synthesis | Returns private resolved profile |
| Resolver embedding | Exact embedding profile resolves |
| Resolver parser | Docling/Reducto private result correct |
| Resolver no cache | Current DB config read every call |
| No provider call | Provider service mock unused/absent |

## 14.2 Integration

```text
1. Phase 1 seed admin login.
2. Insert member through Phase 1 test fixture.
3. Anonymous all Phase 2 routes = 401.
4. Member all Phase 2 routes = 403.
5. Admin GET config returns seeded safe provider summaries.
6. Admin PUT OpenAI credential.
7. DB query proves stored ciphertext exists and != raw input.
8. GET response excludes credential/ciphertext.
9. Admin rotates OpenAI credential.
10. Resolver returns replacement credential only in server-side test.
11. Admin configures Bedrock Region + credential.
12. Admin creates synthesis profile.
13. Admin creates embedding profile with dimensions.
14. Missing dimensions for embedding = 422.
15. Reducto model profile = 422.
16. Admin selects active synthesis profile.
17. Missing provider credential blocks activation.
18. Admin selects docling.
19. Reducto selection without credential = 422.
20. Admin configures Reducto, then selects reducto.
21. Active synthesis profile delete = 409.
22. Every response has X-Request-ID.
23. OpenAPI contains no credential response field/example.
24. No outbound HTTP mock receives a request.
```

## 14.3 Compose

```text
fresh Phase 1 DB → 0002 migration works
API starts after migration with valid CONFIG_ENCRYPTION_KEY
API restart preserves config
API restart resolves existing ciphertext with same key
missing/invalid key → startup fails
no external provider service needed
```

## 14.4 Explicitly do not test now

```text
OpenAI key acceptance
Bedrock key acceptance
Bedrock model/Region access
Ollama reachability
Reducto key acceptance
provider model existence
embedding dimension provider response
rate limits
provider retry
model discovery
```

Reason:

```text
Phase 2 has no provider request path.
Fake connectivity code would duplicate later runtime adapter behavior.
```

---

## 15. Security Checks

Before mark done:

```text
[ ] Phase 1 opaque HttpOnly session unchanged.
[ ] No JWT library added.
[ ] No client-side token/config code.
[ ] Every Phase 2 route requires require_admin.
[ ] Member cannot read/change trusted config.
[ ] Provider credential encrypted before DB write.
[ ] Raw credential absent from DB plaintext.
[ ] Raw credential absent from safe DTO.
[ ] Raw credential absent from logs.
[ ] Raw credential absent from exceptions.
[ ] Raw credential absent from OpenAPI.
[ ] CONFIG_ENCRYPTION_KEY absent from all client-readable config.
[ ] No generated domain.env.
[ ] No Compose credential value.
[ ] No provider network request during save/update/resolve.
[ ] No request accepts arbitrary base_url.
[ ] No request supplies secret name.
[ ] No user request chooses model/provider/parser.
[ ] Active synthesis only references synthesis profile.
[ ] Reducto parser only activates with configured Reducto credential.
[ ] Active profile cannot delete.
[ ] Resolver private result cannot serialize as API DTO.
[ ] No generic config blob/table.
[ ] No provider plugin registry.
[ ] No credential/profile revision table.
```

---

## 16. Common Junior Dev Mistakes

| Mistake | Why bad | Correct |
|---|---|---|
| Store API key plaintext | DB leak = provider compromise | Fernet ciphertext only |
| Return API key after save | Browser/log exposure | `isConfigured: true` only |
| Put provider key in `.env` | Rotation requires deploy; config drift | encrypted DB provider config |
| Put model list in `.env` | Deploy-time config becomes runtime product state | DB model profiles |
| Allow arbitrary `base_url` | SSRF/config drift/hidden transport behavior | fixed provider policy + Region/Ollama deployment URL |
| Store endpoint on model profile | URL duplicated across profiles | provider adapter owns endpoint |
| Store secret env-var name on profile | caller can target/resolve arbitrary secrets | known provider config row |
| Decrypt inside route | secret-leak surface grows | resolver only |
| Add model discovery now | creates provider runtime before needed | manual exact `model_id`; defer discovery |
| Add provider SDK now | dead runtime code | config only |
| Add test-connection now | duplicates later adapter behavior | defer |
| Add generic provider/plugin system | hypothetical bloat | closed enum |
| Add generic settings JSON | weak invariants/schema drift | typed singleton row |
| Keep candidate/revision model | no current safety gain; more state | one active profile, frozen per turn later |
| Make embedding profile global | conflicts with per-domain fixed embeddings | catalog only |
| Copy secret into domain env | persistent plaintext leak | resolve in private runtime boundary later |
| Allow active profile delete | breaks config | 409 conflict |
| Add user config route | clients must not choose runtime behavior | admin-only API |
| Make Bedrock URL editable | Region/model/API capability should be adapter-owned | persist Region only |
| Add `is_enabled` everywhere | duplicate lifecycle state | validate references; delete protected config |
```

---

## 17. Deferred Work

### Phase 3 — Knowledge Domains

```text
admin creates domain
→ selects embedding model profile
→ domain stores embedding_profile_id
→ domain creation validates resolver output
```

Phase 3 adds:

```text
embedding profile referenced by domain cannot update/delete
```

### Phase 4 — Source Documents and Canonical Preparation

```text
document intake
→ snapshot active parser kind
→ resolve active parser
→ run Docling or Reducto adapter
→ normalize into canonical document model
```

### Phase 5 — Private LightRAG Indexing

```text
domain indexing
→ resolve domain embedding profile
→ provider adapter selects needed endpoint/transport
→ private LightRAG handoff
```

Before adding Bedrock embedding support, prove selected model/API compatibility in Phase 5. Do not assume a Chat/Responses-compatible Bedrock model also matches required embedding call shape.

### Phase 7 — Grounded Streaming Chat

```text
chat turn
→ resolve active synthesis profile once
→ freeze resolved config for turn
→ retrieve mapped evidence
→ synthesize
→ one bounded retry using same frozen config
→ evidence-only result after failure
```

### Later, only when concrete need exists

```text
browser client
server-only provider discovery
provider credential test endpoint
model catalog selection
native Bedrock SigV4/IAM role auth
short-term Bedrock token refresh
secret master-key rotation
KMS/Vault
provider usage metrics
provider failover
domain-specific parser override
embedding migration/re-embed workflow
configuration audit ledger
```

---

## 18. Final Definition of Done

```text
Trusted runtime config exists.

Admin:
  rotate OpenAI / Bedrock / Reducto credential
  set Bedrock Region
  create exact synthesis model profile
  create exact embedding model profile with vector dimensions
  select one active synthesis profile
  select Docling or Reducto parser
  inspect safe config only

Member:
  cannot read/change trusted config

System:
  encrypted provider credentials at rest
  known provider enum
  model IDs in DB allowlist
  endpoint ownership outside profile data
  one config owner
  one private resolver
  no provider call
  no browser client
  no domain
  no runtime file
  no LightRAG
  no queue
  typed safe errors
  tests green
```

---

## Final Boundary

```text
Phase 2:
known provider config
→ encrypted credential
→ exact model profiles
→ active synthesis profile
→ active parser
→ one private resolver
→ tests.

Not Phase 2:
browser client
→ domains
→ runtime lifecycle
→ provider discovery/test
→ parser execution
→ documents
→ jobs
→ LightRAG
→ retrieval
→ chat.
```
