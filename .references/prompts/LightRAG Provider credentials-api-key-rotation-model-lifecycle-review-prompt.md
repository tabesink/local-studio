# LightRAG Provider Credentials, API-Key Rotation, and Model Lifecycle Review

Review the upstream LightRAG repository and the latest Context Engine architecture decisions to design a **lean provider-credential and model-lifecycle boundary**.

## Goal

Context Engine must let an administrator safely:

* add, replace, disable, and rotate provider API keys;
* change LLM models used for LightRAG knowledge-graph extraction and related indexing work;
* change the global Context Engine chat-synthesis LLM profile;
* change embedding credentials without re-indexing when the actual embedding model/configuration remains identical;
* prevent an embedding-model change from silently mixing incompatible vectors in an existing domain.

The design must preserve the current product model:

* one private LightRAG runtime per Knowledge Domain;
* Context Engine owns authorization, provider settings, secret handling, domain lifecycle, source documents, parsing, index units, and user-facing UI;
* LightRAG owns embeddings, graph/vector storage, post-handoff indexing, and retrieval;
* browser users never receive LightRAG credentials, provider API keys, runtime URLs, or secret-bearing configuration;
* all persistent domain storage remains host-visible under `.data/`;
* do not add unnecessary services, secret systems, workflow engines, or duplicate configuration registries.

---

## First: Reverse Engineer LightRAG’s Actual Configuration Model

Inspect the pinned upstream LightRAG version in code, not documentation alone.

Clearly distinguish these separate credential/configuration concerns:

1. **Inbound LightRAG server authentication**

   * API keys, JWT/account credentials, WebUI credentials, health-route exceptions, and service-to-service access.
   * Determine exactly how they are configured, loaded, validated, rotated, and whether restart is required.

2. **Outbound provider credentials**

   * LLM provider API keys used for knowledge-graph/entity/relation extraction, keyword generation, or query-related upstream LLM calls.
   * Embedding provider API keys.
   * Reranker/provider keys, if applicable.
   * Determine where each is configured, how the runtime chooses models, and whether values are read at startup, per request, or per indexing task.

3. **Index-shaping configuration**

   * Embedding model identity, dimensions, normalization, prefixes, tokenizer assumptions, or other values that affect vector compatibility.
   * LLM model used for extraction/KG construction.
   * Any parser/chunking settings that influence stored retrieval data.
   * Identify what can safely change in place versus what requires re-indexing.

For every material claim, provide:

```md
Evidence:
- File:
- Symbol / configuration field:
- Runtime call path:
- Loaded at startup, per request, or per job:
- Requires restart?:
- Confidence:
```

Do not assume environment variables can be changed dynamically. Verify whether the pinned LightRAG runtime must be restarted to apply each setting.

---

# Context Engine Desired Policy

## A. Credential rotation

Context Engine must be able to rotate a provider key without exposing it to the browser or writing it into:

* `.data/`;
* generated domain runtime files;
* Compose files;
* persistent `domain.env` files;
* logs;
* error payloads.

Use the existing Context Engine secure configuration/encryption path where possible. Do not introduce a new secret-management product unless the codebase proves the current approach cannot support this safely.

Determine the leanest way to inject a rotated secret into a private LightRAG runtime.

For every credential type, state whether rotation requires:

* no runtime action;
* a bounded runtime restart;
* reprocessing only future work;
* full domain re-indexing.

## B. LLM model rotation

Treat LLM roles separately:

| Role                                       | Intended policy                                                                                                      |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------- |
| Context Engine chat synthesis LLM          | Admin may change the active global profile. Each submitted chat turn uses one frozen profile; no mid-turn switching. |
| LightRAG indexing/KG extraction LLM        | Admin may rotate provider key or model for future indexing/reprocessing work.                                        |
| LightRAG query-related LLM use, if enabled | Must be explicitly identified and controlled; browser cannot select it.                                              |
| Reranker model                             | Evaluate separately; document whether it changes retrieval semantics or only ranking behavior.                       |

A changed LightRAG extraction LLM does **not** require re-embedding existing vectors. However, it may mean newly indexed/reprocessed content has different graph/entity extraction behavior than earlier content.

Recommend the leanest honest policy for this:

* permit LLM/key rotation for future indexing;
* do not silently claim the existing graph was regenerated;
* record enough safe provenance to know which model/profile created the current index;
* do not automatically trigger a rebuild merely because the extraction LLM changes;
* state when an administrator should explicitly choose reprocess/rebuild for consistency.

## C. Embedding model rotation

Treat embedding configuration as an immutable domain-index concern after first successful ingestion.

Classify these changes precisely:

| Change                                                             | Allowed in place? | Restart required? | Re-embed/re-index required? | Why |
| ------------------------------------------------------------------ | ----------------: | ----------------: | --------------------------: | --- |
| Rotate API key for the same embedding provider/model/configuration |                   |                   |                             |     |
| Change embedding model name                                        |                   |                   |                             |     |
| Change embedding dimensions                                        |                   |                   |                             |     |
| Change embedding provider                                          |                   |                   |                             |     |
| Change query/document prefix or asymmetric embedding behavior      |                   |                   |                             |     |
| Change normalization/tokenization-relevant behavior                |                   |                   |                             |     |

Required rule:

> A domain must never contain mixed embeddings created using incompatible embedding models or configuration.

For the current one-primary-document-per-domain model, recommend the leanest explicit workflow for an embedding-model change:

```text
Admin selects a new embedding profile
→ Context Engine clearly reports “full re-index required”
→ current domain remains unchanged until explicit confirmation
→ delete/clear old LightRAG retrieval index
→ rebuild index units from the retained canonical source document
→ re-ingest using the new locked profile
→ mark the new profile active only after successful completion
```

Do not make this an automatic background migration.

---

# Required Target Design

## 1. Configuration ownership matrix

Define the canonical owner, storage location, edit permissions, runtime application behavior, and audit requirements for:

* LightRAG inbound service API key;
* LightRAG WebUI/JWT credentials, if retained;
* LLM provider credential;
* embedding provider credential;
* reranker credential;
* Context Engine chat-synthesis credential;
* active chat-synthesis model profile;
* LightRAG extraction/KG LLM profile;
* domain embedding profile;
* domain index-profile fingerprint;
* pinned LightRAG image and private adapter version.

The application database must be the canonical configuration registry. Runtime environment/configuration is derived only.

## 2. Minimal Context Engine model

Recommend the smallest practical model. Do not add tables merely for architectural purity.

Prefer a shape equivalent to:

```ts
type ProviderCredential = {
  id: string;
  provider: string;
  secretRef: string; // or existing encrypted-secret reference
  status: "active" | "disabled";
  rotatedAt: string;
};

type ModelProfile = {
  id: string;
  role:
    | "chat_synthesis"
    | "lightrag_extraction"
    | "embedding"
    | "reranker";

  providerCredentialId: string;
  model: string;
  configurationFingerprint: string;
};

type DomainIndexProfile = {
  domainId: string;

  embeddingProfileId: string;
  embeddingFingerprint: string;

  extractionLlmProfileId: string;
  lightragImageDigest: string;
  lightragAdapterVersion: string;

  lockedAt: string | null;
};
```

You may simplify this further if the existing Context Engine provider/settings model already covers part of it. Explain every retained field and every removed abstraction.

## 3. Runtime application mechanism

Recommend the smallest secure mechanism for applying an admin change:

```text
Admin updates credential or model profile
→ Context Engine validates the change
→ Context Engine writes canonical configuration/audit state
→ Context Engine determines required action:
   no action / controlled runtime restart / future-job-only / explicit full re-index
→ private runtime receives resolved secrets only in memory at start
→ browser receives a safe status, never the secret
```

Do not write plaintext provider keys into generated Compose files, `.data/`, domain folders, or logs.

## 4. Administrator API and UI contract

Define lean admin-only operations such as:

```text
Create/update/disable provider credential
Test provider connectivity
Create/update model profile
Set global active chat-synthesis profile
Set domain extraction LLM profile
Set embedding profile before first successful index
Request explicit re-index after embedding-profile change
```

For each operation, specify:

* authorization;
* validation;
* whether it affects existing data;
* whether it requires runtime restart;
* whether it must be blocked while a domain is processing/deleting;
* safe response/error shape;
* audit fields.

The standard user must receive only model-availability outcomes, never provider names, credentials, raw upstream error bodies, or runtime configuration.

---

# Required Change-Impact Matrix

Produce one concise matrix covering at minimum:

| Administrator change                 | Immediate effect | Requires LightRAG restart? | Requires re-index? | Affects existing graph/vectors? | Allowed while processing? | Required audit event |
| ------------------------------------ | ---------------- | -------------------------: | -----------------: | ------------------------------: | ------------------------: | -------------------- |
| Rotate LightRAG service API key      |                  |                            |                    |                                 |                           |                      |
| Rotate LLM provider API key          |                  |                            |                    |                                 |                           |                      |
| Change LightRAG extraction/KG LLM    |                  |                            |                    |                                 |                           |                      |
| Change global chat-synthesis LLM     |                  |                            |                    |                                 |                           |                      |
| Rotate embedding provider API key    |                  |                            |                    |                                 |                           |                      |
| Change embedding model/configuration |                  |                            |                    |                                 |                           |                      |
| Change reranker model/configuration  |                  |                            |                    |                                 |                           |                      |
| Pin/upgrade LightRAG image           |                  |                            |                    |                                 |                           |                      |

---

# Required Review Output

Produce a report titled:

```text
Context Engine — Provider Credentials, API-Key Rotation, and Model Lifecycle
```

Include:

1. Executive recommendation.
2. Verified LightRAG configuration and API-key findings.
3. Inbound LightRAG authentication versus outbound provider credential distinction.
4. Configuration ownership and secret-handling model.
5. LLM rotation policy.
6. Embedding profile lock and explicit re-index policy.
7. Minimal data model and API/UI contract.
8. Runtime restart/application rules.
9. Change-impact matrix.
10. Migration path from current Context Engine settings/runtime configuration.
11. Required tests:

* secret never reaches browser, `.data/`, generated files, or normal logs;
* same-model credential rotation preserves query/index behavior;
* extraction-LLM rotation affects only future indexing;
* embedding-model change is blocked until explicit re-index;
* failed re-index leaves the old active domain/index intact or returns it to a safe unavailable state;
* domain restart applies rotated credentials without changing its locked index profile;
* unauthorized users cannot read or modify provider/model configuration.

12. Explicit non-goals:

* browser-managed provider keys;
* automatic provider failover/model switching;
* silent embedding migration;
* per-request model overrides from the browser;
* persistent secret-bearing domain env files;
* broad LightRAG fork;
* a new secret-management platform unless proven necessary.

End with a direct recommendation answering:

> What is the leanest safe way for Context Engine to rotate credentials and LLM models freely while enforcing a locked embedding profile and an explicit re-index workflow for embedding changes?
