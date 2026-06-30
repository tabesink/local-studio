# Context Engine — P8: Observability (caveman) — SEED

**Status:** SEED / placeholder. Content lifted out of P7 so it isn't lost. **You will expand this into the full P8 plan.** Not build-ready yet — it captures the constraints and the Langfuse/logging material the chat plan referenced.
**Depends:** P1 (request IDs + safe errors); P0 §16 (canonical log schema); P7 (turn lifecycle, the data that must NOT leak).
**Reads:** P0 (logs §16; limits §14).
**Style:** caveman.

---

## 0. Why P8 exists

P1 gives request IDs + typed safe errors. P0 §16 fixes the canonical structured-log schema. P7 produces chat turns worth tracing. None of that is full observability. P8 adds the trace/metric layer — **metadata only, failure-isolated** — without leaking content or secrets.

Observability is **observational only.** Langfuse (or any tracer) down -> chat, retrieval, upload still work. Never a dependency on the request path.

---

## 1. Scope (draft)

Build (later): masked metadata traces over the request -> retrieval -> evidence-mapping -> synthesis -> stream path; a fixed structured-event schema; small pilot health metrics; export-time masking. Add at P7/P8, not P1.

Do not build: Grafana stack, analytics platform, raw-prompt/answer store, per-user dashboards, sampling tuned on content, anything that puts user text or secrets into a third party.

---

## 2. Canonical log fields (from P0 §16 + P7)

P0 §16 base:

```text
event, request_id, actor_kind, domain_id, source_id,
conversation_turn_id, operation_id, safe_error_code, elapsed_ms
```

P7 chat additions (safe facts only):

```text
conversation_turn_id, answer_kind, catalog_document_count, catalog_truncated,
retrieval_call_count, mapped_evidence_count, citation_count,
first_token_ms, total_ms, safe_outcome_code
```

---

## 3. Never log / never trace (hard rule — already enforced in P7)

```text
raw question, prior questions, catalog titles/summaries, classifier prompt/output, follow-up query,
raw answer, raw evidence, source refs, raw LightRAG response, provider secret, provider prompt,
storage path, session token, source/block IDs, runtime URL, stack trace.
```

This list is a security control. It stays enforced in P7 regardless of P8. P8 must not weaken it.

---

## 4. Langfuse (or equivalent) — metadata only

Trace path:

```text
CE request -> retrieval -> evidence mapping -> synthesis -> stream completion/failure
```

Send by default ONLY:

```text
request_id, opaque turn ID, domain ID, model-profile ID, latency,
retrieval hit count, mapped evidence count, citation count, safe outcome code.
```

Do NOT send: user questions, assistant answers, source blocks, images, uploads, provider secrets, real usernames, catalog text, prompts, raw LightRAG payloads, private IDs.

Mask before any payload leaves Context Engine. Use async tracing, OTel-compatible trace IDs, sampling, and export-time masking. **Tracer failure never blocks chat.**

---

## 5. Open questions for the full P8 plan

```text
- exact event schema + versioning.
- sampling policy (rate, not content-based).
- pilot health metric set (p95 first-token, error rate, runtime RAM, Postgres conns, provider 429s).
- where masking lives (one chokepoint before export).
- retention + access policy for trace metadata.
- self-hosted vs SaaS tracer decision (trusted-corpus constraint).
```

---

## 6. Pointer

P7 (`p7-grounded-chat-plan.md` §22) keeps only the "never log" safety list and defers all trace/metric tooling here. Expand this seed into the full phase plan when ready; keep it metadata-only and failure-isolated.
