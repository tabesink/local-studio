# Context Engine — P2: Trusted Provider/Model/Parser Config (caveman)

**Goal:** Admin-only trusted config. Server owns provider credentials, allowed model profiles, active synthesis pick, parser pick, private resolution.
**Depends:** P1.
**Reads:** P0 (provider secrets = encrypted CE config owner; parser_kind rule §9; embedding-profile immutability §8).
**Style:** caveman.

---

## 0. Build target

```text
Admin client / curl / tests
  -> CE API
  -> PostgreSQL
     ├─ provider_configs   (encrypted creds + Bedrock region)
     ├─ model_profiles     (admin allowlist of usable synthesis/embedding models)
     └─ runtime_settings   (active synthesis profile + active parser)
  -> TrustedRuntimeResolver (private: active synthesis / requested embedding / active parser)
```

Proves:

```text
admin login -> configure OpenAI/Bedrock/Reducto credential
-> API encrypts before DB write
-> create explicit synthesis + embedding profiles
-> set one active global synthesis profile
-> pick docling or reducto parser
-> server resolves trusted private config
-> member can't read/change
-> API never returns raw credential/ciphertext
```

### Do not build

```text
browser client, provider SDKs (OpenAI/boto/Ollama/Reducto), model discovery,
test-connection route, /models calls, catalog sync, provider registry, plugin loader,
generic config key/value table, generic JSON settings, arbitrary base_url,
fallback chains, credential history/version rows, candidate/revision workflow,
runtime-sync workflow, domain.env, compose secret injection, Redis, workers,
documents, parsing execution, LightRAG, chat, SSE, prompt editor, temp/top-k config,
KMS/Vault, key rotation, CLI
```

P2 = trusted config boundary. Persist only what later phases resolve.

---

## 1. Core rules

```text
1. P1 opaque session + role contract unchanged.
2. All P2 routes require_admin. member 403, anon 401.
3. No browser client this phase.
4. Future client gets safe summaries only. Never raw credential/ciphertext.
5. User/chat/doc requests never choose provider/model/parser/credential/endpoint/
   prompt/embedding/reranker/top-k/retrieval mode.
6. Provider set = closed enum: openai, bedrock, ollama, reducto.
7. No arbitrary providers. No URL on model profile. No caller-controlled secret name.
8. model_id = exact opaque string, admin-supplied. Not a hardcoded catalog.
9. One global active synthesis profile max. No global active embedding profile.
10. Embedding profile picked per-domain at P3 create, IMMUTABLE from then (P0 §8).
11. Docling = default parser, no credential. Reducto needs configured Reducto credential.
12. Only TrustedRuntimeResolver decrypts credentials.
13. Raw credential lives only: inbound request, short server memory during encrypt/decrypt,
    future private provider/runtime call.
14. Raw credential never in: response, DB plaintext, logs, exceptions, OpenAPI, browser,
    runtime file, compose, .env (except encryption root).
15. No provider call during create/update/delete/resolve/startup/health/test.
16. No decrypted credential cache. No profile versioning.
```

---

## 2. Model IDs + endpoint ownership

`model_id` = exact runtime identifier (e.g. `gpt-4.1`, `text-embedding-3-small`, `amazon.titan-embed-text-v2:0`). `display_name` = human label. No hardcoded list, no .env list, no remote catalog in DB.

Endpoint policy in code/infra, never on model profile:

| Provider | URL source | DB | .env |
|---|---|---|---|
| OpenAI | code-owned official | no URL | no URL |
| Bedrock | adapter derives from region + capability | region only | no URL |
| Ollama | deployment infra | no URL | OLLAMA_BASE_URL optional |
| Reducto | code-owned | no URL | no URL |

No arbitrary base_url -> avoids typo/drift/SSRF/ambiguity. Model discovery deferred -> no provider HTTP client before runtime exists.

---

## 3. Done means

```text
1. P1 gate passes unchanged.
2. compose up --build works.
3. 0002 migration after 0001.
4. Startup fails when CONFIG_ENCRYPTION_KEY missing/invalid.
5. provider_configs rows exist: openai, bedrock, ollama, reducto.
6. Admin updates OpenAI credential -> DB stores ciphertext, not raw.
7. Admin rotates credential in place.
8. Admin sets Bedrock region + credential. Bad region/unknown provider rejected.
9. Admin creates synthesis + embedding profiles (embedding needs vectorDimensions).
10. Reducto model profile rejected.
11. Admin activates one ready synthesis profile. Unready provider -> rejected.
12. Admin selects docling; reducto only when Reducto credential exists.
13. Resolver resolves active synthesis / requested embedding / active parser.
14. Resolver rejects missing/invalid config.
15. Member 403, anon 401 all routes.
16. Active synthesis profile delete -> 409.
17. No API output has credential/ciphertext. No provider network call in tests.
18. pytest + OpenAPI snapshot pass.
```

---

## 4. Runtime

Same as P1 containers. api also holds admin-config API + private resolver. Flow adds: `config validates CONFIG_ENCRYPTION_KEY` after migrate, before seed-admin reconcile.

Compose rules: keep P1 shape. No Docker socket, no Redis, no worker, no provider service, no runtime-secret volume, no NEXT_PUBLIC provider vars. Only optional OLLAMA_BASE_URL.

---

## 5. Repo layout (add only)

```text
backend/
├── alembic/versions/0002_trusted_runtime_config.py
├── app/
│   ├── api/v1/admin_runtime_config.py
│   ├── core/{config.py, secrets.py, provider_policy.py}
│   ├── db/models/trusted_runtime_config.py
│   ├── db/repositories/trusted_runtime_config.py
│   ├── schemas/trusted_runtime_config.py
│   └── services/{trusted_runtime_config.py, trusted_runtime_resolver.py}
└── tests/{integration/, unit/}
docs/api/{openapi.phase-2.json, phase-2-contract.md}
```

Ownership: secrets.py = encrypt/decrypt only. provider_policy.py = fixed enum + local validation + endpoint policy. config service = mutations/validation/delete-guard/encryption. resolver = private resolution + decryption only. route = HTTP only.

Bad: route decrypts/SQL/calls provider/accepts base_url. Bad: profile holds API key/env-name. Bad: provider config read directly by LightRAG service. Bad: generic JSON blob, plugin framework, credential history, runtime file on save.

---

## 6. Deps

Keep P1. Add `cryptography` only. Use `cryptography.fernet.Fernet`. Do not add provider SDKs, httpx provider client, vault/KMS, plugin framework, settings framework.

---

## 7. Env config

```dotenv
# python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
CONFIG_ENCRYPTION_KEY=replace-with-generated-fernet-key
OLLAMA_BASE_URL=http://ollama:11434/v1   # optional; required later only when Ollama profile used
```

Keep P1 settings.

Do not add: OPENAI_API_KEY, AWS_BEARER_TOKEN_BEDROCK, REDUCTO_API_KEY, OPENAI_BASE_URL, BEDROCK_BASE_URL, NEXT_PUBLIC_*.

Rules: CONFIG_ENCRYPTION_KEY required outside test. Valid Fernet key. Missing/invalid -> startup fails. Test = fixed fixture key. Never log. Never browser-exposed. Rotation deferred. Don't derive key from password/db-url/app-name/random -> restart must decrypt stored creds.

---

## 8. DB model

### Enums

```ts
type ProviderKind = "openai" | "bedrock" | "ollama" | "reducto";
type ModelPurpose = "synthesis" | "embedding";
type ParserKind   = "docling" | "reducto";
```

No enum for model IDs / retrieval modes / top-k / reranker / prompts / domain states.

### provider_configs (one row per kind)

```ts
type ProviderConfig = {
  kind: ProviderKind;               // PK
  region: string | null;            // Bedrock only
  secretCiphertext: string | null;  // OpenAI/Bedrock/Reducto only
  createdAt; updatedAt; createdByUserId; updatedByUserId;
};
```

Migration seeds 4 rows. Rules: kind can't create/delete/rename. OpenAI region null. Bedrock region required (lowercase AWS shape). Ollama region+secret null (endpoint from OLLAMA_BASE_URL). Reducto secret required before reducto parser. No secret-name/URL/version/enabled fields.

```text
CHECK: openai->region null | bedrock->region not null when used
       ollama->region+secret null | reducto->region null
FK created_by/updated_by -> users.id
```

### model_profiles

```ts
type ModelProfile = {
  id: string;                                  // UUID
  displayName: string;                         // unique
  purpose: "synthesis" | "embedding";          // immutable
  providerKind: "openai" | "bedrock" | "ollama"; // immutable; reducto rejected
  modelId: string;                             // exact opaque
  vectorDimensions: number | null;             // embedding only, required+positive
  createdAt; updatedAt; createdByUserId; updatedByUserId;
};
```

Rules: synthesis -> vectorDimensions null. embedding -> required positive int (P3/P5 need stable vector dim). No baseUrl/secret/env-name/token-limit/flags/extra-JSON/enabled/version.

```text
UNIQUE display_name, INDEX purpose, INDEX provider_kind
FK provider_kind -> provider_configs.kind ON DELETE RESTRICT
CHECK synthesis->dims null | embedding->dims not null and >0
```

### runtime_settings (singleton)

```ts
type RuntimeSettings = {
  singleton: true;
  activeSynthesisProfileId: string | null;
  activeParserKind: ParserKind;     // default docling
  updatedAt; updatedByUserId;
};
```

Initial row: singleton=true, activeSynthesisProfileId=null, activeParserKind=docling.

Rules: one row. activeSynthesisProfileId null=none, else existing synthesis profile with ready provider. docling no credential. reducto needs Reducto credential. No active embedding profile. No parser-profile table.

```text
PK singleton, CHECK singleton=true
FK active_synthesis_profile_id -> model_profiles.id ON DELETE RESTRICT
```

### Migration 0002

create provider_configs (+4 rows), model_profiles, runtime_settings (+singleton), FKs/checks/indexes. Downgrade in dev. After 0001 on blank Postgres. Do NOT seed model IDs / credentials / active synthesis / reducto. Safe default = no active synthesis + docling.

---

## 9. Secret design

```text
Admin config req -> TrustedRuntimeConfigService -> SecretCipher.encrypt -> ciphertext column.
Future private call -> TrustedRuntimeResolver -> SecretCipher.decrypt -> private resolved config.
```

```python
class SecretCipher:
    def encrypt(self, raw: str) -> str: ...
    def decrypt(self, ct: str) -> str: ...
```

Fernet only. No custom cipher. No decrypt in route/repository/GET. No decrypted cache. No repr/print of resolved config.

Rotation: PUT provider config with new credential -> validate -> encrypt -> update same row -> updatedAt/By -> old ciphertext replaced. No history. Existing profile IDs unchanged. Stored != provider-accepted (acceptance tested where runtime adapter exists).

Safe response:

```json
{"kind":"openai","isConfigured":true,"region":null,"updatedAt":"...","updatedByUserId":"uuid"}
```

Never return secret/apiKey/secretCiphertext/configEncryptionKey/baseUrl.

---

## 10. Trusted resolution

`TrustedRuntimeResolver` = sole owner of resolving credential / active synthesis / embedding / active parser / region / Ollama endpoint.

```python
resolve_active_synthesis() -> ResolvedModelProfile
resolve_embedding_profile(profile_id) -> ResolvedModelProfile
resolve_active_parser() -> ResolvedParser
```

```ts
type ResolvedModelProfile = {
  profileId; purpose; providerKind; modelId;
  vectorDimensions: number | null;
  providerSecret: string | null; region: string | null; ollamaBaseUrl: string | null;
};
type ResolvedParser = { kind: "docling" | "reducto"; providerSecret: string | null };
```

Private result: never route response / serialize / log / store / cache / browser. No endpoint field — future adapter builds endpoint.

Behavior:

```text
resolve_active_synthesis: read settings -> profile required, purpose=synthesis,
  provider ready, decrypt only if provider needs, Ollama needs OLLAMA_BASE_URL.
  missing -> ConfigurationUnavailable("active_synthesis_profile_missing").

resolve_embedding_profile(id): purpose=embedding, dims required, provider ready,
  decrypt if needed. Called by P3 at domain create, P5 at LightRAG embed config.

resolve_active_parser: docling -> (docling, null). reducto -> require credential,
  decrypt now -> (reducto, private secret).
```

Internal errors: ConfigurationUnavailable, ConfigurationInvalid. Later phases map to safe API errors. No error exposes credential/cipher/endpoint/db/stack.

---

## 11. Admin API

All under `/api/v1/admin/runtime-settings`. All require_admin. No member/public config route.

```text
GET    /                              -> full safe config
PUT    /providers/{provider_kind}     -> update known provider config
POST   /model-profiles                -> create profile
PATCH  /model-profiles/{id}           -> update displayName/modelId(/dims)
DELETE /model-profiles/{id}           -> 204 | 409 if active synthesis | 404
PATCH  /                              -> set active synthesis + active parser
```

### PUT provider

```text
openai:  {secret}            secret required, region forbidden
bedrock: {region, secret}    both required
ollama:  {}                  all fields forbidden; readiness from OLLAMA_BASE_URL
reducto: {secret}            secret required, region forbidden

secret omitted -> rejected (explicit full replacement). secret empty -> 422.
unknown provider -> 404. No provider HTTP call. Response = safe summary.
```

No secret-clear endpoint. Replace = rotation.

### Create profile

```text
synthesis: {displayName, purpose, providerKind, modelId}
embedding: {... , vectorDimensions}
providerKind openai|bedrock|ollama only. displayName unique. modelId non-empty.
provider may be unconfigured at create; unconfigured profile can't become active synthesis.
```

### PATCH profile

```text
allowed: displayName, modelId, (embedding: vectorDimensions together with modelId if dims change)
purpose + providerKind immutable.
active synthesis update applies to LATER turns (P7 freezes per turn).
P3/P5 later block embedding profile mutation once any domain references it.
```

### PATCH runtime settings

```text
activeSynthesisProfileId: null=unset | UUID=existing synthesis w/ ready provider
activeParserKind: docling always valid | reducto needs Reducto credential
partial update ok. one transaction. updatedAt/By recorded. no provider request.
```

### Error map (add to P1)

```text
422 configuration_invalid   -> bad provider/profile/parser relationship
    configuration_unavailable -> resolve fails
```

No raw provider/cipher/DB error text.

---

## 12. Service rules

`TrustedRuntimeConfigService` owns: provider mutation, credential encryption, profile CRUD, settings update, validation, delete guard, ownership. Does NOT own: provider HTTP, discovery, LightRAG config, domains, parsing, chat, runtime files.

`ProviderPolicy` = pure code rules: known kinds, credential-required kinds, region-required kinds, allowed profile kinds, endpoint ownership. No SDK/HTTP/registry.

Repository: queries only, commit once per action, no encrypt/decrypt/HTTP/DTO/auth/policy.

Transaction = route -> require_admin -> service -> validate -> encrypt (if cred) -> update row -> commit once -> safe DTO. No outbox, queue, async.

---

## 13. Build order

```text
Step 1 config root + schema: add cryptography, CONFIG_ENCRYPTION_KEY, optional OLLAMA_BASE_URL,
  startup validation, provider policy, models, 0002 migration, seed provider rows + singleton.
  Check: 0002 current, starts with valid key, refuses missing/invalid key, 4 provider rows.

Step 2 secret boundary + provider config: SecretCipher, repo, provider mutations, safe DTOs, endpoint.
  Check: stored != raw, isConfigured true, no ciphertext in GET, rotate -> one row, member 403.

Step 3 model profiles + active synthesis: profile mutation, purpose/dim checks, delete guard,
  settings GET/PATCH, active synthesis validation.
  Check: embedding rejected as synthesis, reducto profile rejected, unconfigured rejected, delete=409.

Step 4 parser + resolver: active parser setting, docling/reducto validation, resolver,
  private dataclasses, ConfigurationUnavailable/Invalid.
  Check: docling resolves no cred, reducto fails without cred then resolves, resolver never returns DTO.

Step 5 contract + tests + docs: OpenAPI snapshot, unit/integration/compose, README, phase-2 contract.
  Check: pytest green, no provider network calls.
```

---

## 14. Tests

### Unit

```text
Fernet config validation | encrypt round-trip | ciphertext != raw | rotation resolves new cred |
safe DTO can't leak credential | provider policy exact | per-provider field rules |
Bedrock region required+shape | reducto can't have model profile | embedding dims required+positive |
active synthesis = synthesis purpose + ready provider | docling no cred, reducto needs cred |
active synthesis can't delete | resolver returns private profile | resolver reads DB every call (no cache) |
provider client absent/unused
```

### Integration

```text
1. P1 seed admin login. 2. insert member. 3. anon all routes 401. 4. member all routes 403.
5. admin GET seeded summaries. 6. PUT OpenAI cred. 7. DB ciphertext != raw. 8. GET no credential.
9. rotate -> resolver returns new cred (server-side test only). 10. Bedrock region+cred.
11. create synthesis. 12. create embedding w/ dims. 13. missing dims = 422. 14. reducto profile = 422.
15. select active synthesis. 16. missing provider cred blocks activation. 17. select docling.
18. reducto without cred = 422. 19. configure reducto then select reducto. 20. delete active synthesis = 409.
21. X-Request-ID present. 22. OpenAPI no credential field. 23. no outbound HTTP mock hit.
```

### Compose

```text
fresh P1 DB -> 0002 works -> starts w/ valid key -> restart preserves config ->
restart resolves ciphertext w/ same key -> missing/invalid key -> startup fails -> no external provider needed.
```

### Don't test now

OpenAI/Bedrock/Ollama/Reducto key acceptance, model existence, reachability, rate limits, retry, discovery. P2 has no provider request path.

---

## 15. Security checks

```text
[ ] P1 session unchanged. [ ] No JWT. [ ] No client token/config code.
[ ] Every route require_admin. [ ] Member can't read/change config.
[ ] Credential encrypted before DB write. [ ] Raw cred absent: DB plaintext, DTO, logs, exceptions, OpenAPI.
[ ] CONFIG_ENCRYPTION_KEY absent from client-readable config. [ ] No domain.env. [ ] No compose credential.
[ ] No provider network call save/update/resolve. [ ] No arbitrary base_url. [ ] No secret name.
[ ] No user request chooses model/provider/parser. [ ] Active synthesis = synthesis profile only.
[ ] Reducto parser only with Reducto credential. [ ] Active profile can't delete.
[ ] Resolver result can't serialize as DTO. [ ] No generic config blob. [ ] No plugin registry. [ ] No revision table.
```

---

## 16. Common mistakes

| Mistake | Why bad | Correct |
|---|---|---|
| store API key plaintext | DB leak = provider compromise | Fernet ciphertext |
| return API key after save | exposure | isConfigured:true only |
| provider key in .env | rotation needs deploy | encrypted DB config |
| model list in .env | deploy-time becomes runtime state | DB model profiles |
| arbitrary base_url | SSRF/drift | fixed provider policy |
| endpoint on profile | URL duplicated | adapter owns endpoint |
| secret env-name on profile | target arbitrary secret | known provider row |
| decrypt in route | leak surface | resolver only |
| model discovery now | runtime before needed | manual model_id |
| candidate/revision model | more state no gain | one active, frozen per turn (P7) |
| global embedding profile | conflicts per-domain fixed embedding | catalog only |
| parser_profile_id + revision (P4 draft) | snapshot drift, two parser systems | freeze parser_kind at upload (P0 §9) |
| allow active profile delete | breaks config | 409 |

---

## 17. Deferred

```text
P3: admin creates domain -> selects embedding profile -> stores embedding_profile_id (immutable).
    referenced embedding profile can't update/delete.
P4: doc intake -> snapshot active parser_kind -> resolve parser -> Docling/Reducto -> flat blocks.
P5: domain index -> resolve domain embedding profile -> secret injection (P0 §7) -> LightRAG handoff.
    prove Bedrock embedding call-shape compat before assuming.
P7: chat turn -> resolve active synthesis once -> freeze for turn -> retrieve -> synthesize -> one bounded retry.
Later only on real need: browser client, server-only discovery, test endpoint, Bedrock SigV4,
  KMS/Vault, key rotation, usage metrics, failover, re-embed workflow, audit ledger.
```

---

## 18. Definition of done

```text
Admin: rotate OpenAI/Bedrock/Reducto credential, set Bedrock region, create exact synthesis +
  embedding profiles, select one active synthesis, pick Docling/Reducto, inspect safe config only.
Member: can't read/change config.
System: encrypted creds at rest, known provider enum, model IDs in DB allowlist,
  endpoint ownership outside profile, one config owner, one private resolver,
  no provider call, no browser, no domain, no runtime file, no LightRAG, no queue,
  typed safe errors, tests green.
```

## Final boundary

```text
P2: known provider config -> encrypted credential -> exact model profiles ->
  active synthesis -> active parser -> one private resolver -> tests.
Not P2: browser -> domains -> runtime lifecycle -> discovery/test ->
  parser execution -> documents -> jobs -> LightRAG -> retrieval -> chat.
```
