# API Contracts

Primary API contract: `context-engine-v1.md`.

Rules:

- Use `/api/v1` for product APIs unless a health endpoint is explicitly outside the API version.
- Use opaque HttpOnly cookie sessions.
- Use canonical safe error envelopes.
- Capture OpenAPI/runtime fixtures before frontend wiring.
- Never expose secret values, ciphertext, runtime URLs, storage paths, controller payloads, raw provider payloads, raw LightRAG hits, prompts, stack traces, or raw source text.
