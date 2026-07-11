# P2 - Trusted Runtime Config

Goal: admin-only provider/model/parser config. Server owns secrets and runtime choices.

## Build

- `provider_configs`.
- `model_profiles`.
- `runtime_settings` singleton.
- `CONFIG_ENCRYPTION_KEY` validation.
- Fernet encryption boundary.
- closed provider policy:
  - `openai`
  - `bedrock`
  - `ollama`
  - `reducto`
- one active synthesis profile.
- no global embedding default.
- one active parser kind:
  - `docling`
  - `reducto`
- `TrustedRuntimeResolver`.
- safe admin runtime-settings API.

## Resolved Tension

Old P2 text said embedding profile locks after first successful index. New rule: embedding profile is immutable as soon as a Knowledge Domain references it at creation.

## Do Not Build

- provider SDK/client calls
- test connection route
- model discovery/catalog sync
- arbitrary `base_url`
- secret-name field
- generic JSON settings table
- credential history/version rows
- provider plugin framework
- browser config route
- runtime secret files
- domain/runtime/source behavior

## Data

`provider_configs`:

- one row per provider kind.
- credential ciphertext for OpenAI, Bedrock, Reducto.
- Bedrock stores region.
- Ollama endpoint from deployment env only.
- no URL field.

`model_profiles`:

- `purpose = synthesis | embedding`
- `provider_kind = openai | bedrock | ollama`
- exact opaque `model_id`
- embedding requires `vector_dimensions`
- no credential, URL, token limit, extra JSON.

`runtime_settings`:

- singleton.
- `active_synthesis_profile_id`.
- `active_parser_kind`, default `docling`.
- no active embedding profile.

## API Contract

```text
GET   /api/v1/admin/runtime-settings
PUT   /api/v1/admin/runtime-settings/providers/{provider_kind}
POST  /api/v1/admin/runtime-settings/model-profiles
PATCH /api/v1/admin/runtime-settings/model-profiles/{profile_id}
DELETE /api/v1/admin/runtime-settings/model-profiles/{profile_id}
PATCH /api/v1/admin/runtime-settings
```

All require Administrator. Member gets `403`.

Safe DTO exposes `isConfigured`, never secret/ciphertext.

## Test Gate

- missing/invalid encryption key fails startup outside test.
- provider rows seeded.
- credential stored as ciphertext, not raw.
- rotation updates same row.
- safe GET excludes secret/ciphertext.
- active synthesis requires synthesis profile + ready provider config.
- embedding profile requires dimensions.
- Reducto cannot be model profile provider.
- Reducto parser requires Reducto credential.
- referenced embedding profile cannot mutate/delete once P3 domain uses it.
- no provider network call happens.

## Handoff

P3 can validate a selected embedding profile through `TrustedRuntimeResolver`, then discard private resolved config.

