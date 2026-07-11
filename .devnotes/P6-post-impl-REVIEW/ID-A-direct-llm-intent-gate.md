# ID-A - Direct LLM intent gate (junior dev explainer)

Parent: [ID-A.md](./ID-A.md)

Related docs: `specs/04-features/F-007-grounded-streaming-chat/spec.md`, `specs/03-contracts/ai/grounded-answering.md`, `specs/03-contracts/api/context-engine-v1.md`, `specs/01-product/business-rules.md`, `specs/05-quality/ai-evaluation.md`.

**Question:** Can the browser choose direct LLM or domain RAG?

## Decision

No. Server owns the route decision.

Direct LLM is only for non-domain general chat. Domain-specific, source-specific, operational, or ambiguous knowledge questions require one selected available Knowledge Domain and the domain RAG path.

## Why

| Bad path | Good path |
| --- | --- |
| Browser sends `route: direct_llm`. | Browser sends message plus optional domain; server classifies. |
| Missing Evidence falls back to direct LLM. | Missing Evidence returns `no_grounded_context`. |
| Direct LLM answers source/domain questions. | Domain-specific or ambiguous questions fail closed without a domain. |
| Direct LLM includes citations for convenience. | Direct LLM has no Evidence and citations = []. |
| Provider/model fields are accepted from client. | Active synthesis profile resolves server-side. |

## Exact Contract Sketch

Turn request:

```text
clientRequestId: required idempotency key
message: required user-visible question
domainId: optional only for direct general chat
```

Forbidden request fields:

```text
route
model
provider
embeddingModel
systemPrompt
topK
reranker
hiddenFilter
retrievalMode
toolChoice
apiKey
sourcePath
prompt fragments
provider payloads
```

Server route outcomes:

| Route | Requirement | Behavior |
| --- | --- | --- |
| `direct_llm` | non-domain general chat | no retrieval, no Evidence, no citations |
| `domain_rag` | selected available Knowledge Domain | advanced RAG through P6 RetrievalPort |

Open decision: exact classifier fixture set and exact safe error/terminal when a message requires a Knowledge Domain but `domainId` is absent.

## Implementation Order

1. Patch API-001/AI-001 if missing-domain terminal shape is not explicit enough.
2. Write intent fixture table before classifier code.
3. Validate forbidden request fields -> 422.
4. Implement classifier as a server service with deterministic tests.
5. Implement direct LLM route with trusted synthesis profile resolution.
6. Assert no retrieval client is called for direct LLM.
7. Assert direct LLM creates no evidence refs and done citations are empty.
8. Assert domain no-Evidence case does not call direct LLM.

## Red Flags In PR

- Request model includes route, provider, model, prompt, or retrieval controls.
- Direct LLM code path accepts a selected domain and makes domain claims.
- Domain RAG with no Evidence calls the direct responder.
- Ambiguous domain/source question proceeds without selected domain.
- Intent classifier uses browser-provided hints beyond allowed fields.
- Tests only cover happy path greetings.

## Tests

- Direct greeting/writing-help fixture -> `direct_llm`, no retrieval, no citations.
- Domain-specific question with selected available domain -> `domain_rag`.
- Domain-specific question without domain -> contracted safe failure.
- Ambiguous knowledge question without domain -> fail closed or ask for domain per contract.
- No-Evidence domain RAG -> `no_grounded_context`, no direct fallback.
- Forbidden fields -> 422.
- Provider failure direct route -> safe terminal with no raw provider details.

## One-line summary

Direct chat is a narrow server-owned route, not an escape hatch for ungrounded domain answers.
