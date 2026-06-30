# P2 - Trusted Runtime Config

Status: PLANNED

## Context Packet

Build admin-only trusted provider/model/parser configuration. This phase persists encrypted credentials and model profiles but does not call providers.

Read first: `docs/backend/p0-shared-contract.md`, `docs/backend/p2-runtime-config-plan.md`.

## Previous Slice Provides

P1 provides sessions, admin authorization, typed errors, request IDs, config loading, DB/migration infrastructure, and safe response patterns.

## This Slice Changes

- add `provider_configs`, `model_profiles`, and `runtime_settings`;
- add Fernet encryption root validation;
- add provider policy for OpenAI, Bedrock, Ollama, and Reducto;
- add admin runtime-settings routes;
- add safe DTOs that expose only configuration summaries;
- add `TrustedRuntimeResolver` as the only decrypting path;
- enforce active synthesis and active parser rules.

## This Slice Must Not Rework

- no provider SDK calls or test-connection routes;
- no model discovery;
- no arbitrary base URLs;
- no generic JSON config table;
- no credential history or key rotation machinery;
- no browser config route;
- no domain/runtime/source behavior.

## Next Slice Can Assume

P3 can resolve an existing embedding profile privately at domain creation and can rely on referenced embedding profiles being immutable while a domain references them.

## Acceptance Criteria

- migration `0002` runs after `0001`.
- missing/invalid `CONFIG_ENCRYPTION_KEY` fails startup outside test.
- provider rows are seeded.
- admin can update and rotate credentials; DB stores ciphertext, never raw secret.
- admin can create synthesis and embedding profiles with correct dimension rules.
- active synthesis requires a ready provider.
- Reducto parser requires Reducto credential.
- members and anonymous callers cannot read or write config.
- resolver returns private resolved config and safe DTOs never expose secrets/ciphertext.
- tests prove no provider network calls.

