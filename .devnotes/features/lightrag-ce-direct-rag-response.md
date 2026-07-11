# Context Engine — Direct RAG Response Synthesis

**Audience:** junior developers and coding agents
**Status:** vertical-slice implementation note
**Upstream inspected:** LightRAG `main`, July 3, 2026
**Scope:** one authorized, ready Knowledge Domain; text query; transient conversation history; streamed answer and scoped evidence.

---

## 1. Decision in one minute

LightRAG does **not** expose a function named `direct_rag`. Its direct, vector-only RAG equivalent is:

```text
Context Engine name: direct_rag
LightRAG mode:       naive
```

In LightRAG, `aquery_llm()` can run retrieval **and** final LLM generation in one operation. In `naive` mode it retrieves vector chunks, compiles chunk context, then sends the final LLM:

```text
system prompt + retrieved context + conversation history + current user query
```

For Context Engine, **do not proxy LightRAG `/query/stream` as the app's final answer path.**

Use this split instead:

```text
LightRAG: semantic retrieval only
Context Engine: authorization, evidence mapping, history policy, final prompt assembly,
                response synthesis, and application streaming contract
```

```text
Context Engine `direct_rag`
        |
        |  1. retrieve only: LightRAG `naive` / query-data path
        v
accepted retrieval candidates
        |
        |  2. map and authorize against Context Engine index bindings
        v
accepted evidence only
        |
        |  3. build final prompt + bounded transient history
        v
Context Engine query LLM -> streamed answer
```

This preserves Context Engine’s control point:

> Unmapped, deleted, archived, or unauthorized material must not be displayed, cited, or supplied to answer synthesis.

---

## 2. Scope and deliberate exclusions

### Include now

* One new user message.
* Browser-supplied **transient** visible chat history.
* One server-authorized, ready domain runtime.
* LightRAG vector-only retrieval (`naive`).
* Context Engine evidence mapping/filtering before synthesis.
* Server-side LLM streaming.
* Evidence-first app stream: evidence, answer deltas, terminal event.

### Do not add in this slice

* Browser access to LightRAG, Docker, provider keys, or model endpoints.
* Persistent conversation-history tables.
* Local fallback retrieval, duplicate chunk/vector stores, or a second index.
* Graph/local/global/hybrid/mix modes.
* Generic agent/executor frameworks.
* Retrieval/evidence result tables.
* Automated provider failover.
* Follow-up query rewriting.

The first version retrieves with the current user message exactly as written.

---

## 3. Upstream LightRAG behavior to understand

### 3.1 `aquery_llm()` mode dispatch

```text
request query + QueryParam
          |
          +-- local/global/hybrid/mix --> kg_query(...)
          |
          +-- naive ------------------> naive_query(...)
          |
          +-- bypass -----------------> LLM only; no retrieval
          |
          +-- unknown ----------------> failure
```

`naive` is the relevant path for Context Engine `direct_rag`.

### 3.2 What `naive_query()` does

```text
current user query
      |
      v
chunk vector search
      |
      v
optional rerank / score filtering / truncation
      |
      v
selected chunks + source references
      |
      v
naive context template
      |
      v
final LLM call
```

The final LLM call receives three independent inputs:

```text
1. user_query           = current user message
2. system_prompt        = response instructions + retrieved chunk context
3. history_messages     = conversation_history
```

### 3.3 What `aquery_llm()` returns

For a non-streamed query, it packages a string answer. For a streamed query, it packages an iterator. In both cases the structured retrieval payload is retained and `llm_response` is attached to it.

```text
{
  status,
  message,
  data: { chunks, references, ... },
  metadata: { mode, keywords, process_info, ... },
  llm_response: {
    content | response_iterator,
    is_streaming
  }
}
```

`bypass` returns early and skips retrieval completely. Do **not** use it for evidence-grounded Context Engine chat.

---

## 4. Conversation history: exact placement

### Important upstream rule

LightRAG documents `conversation_history` as LLM-only context. It is **not** used as input to retrieval.

```text
                 CURRENT USER MESSAGE
                         |
                         v
                    vector retrieval
                         |
                         v
                selected evidence chunks

CONVERSATION HISTORY --------------------+
                                          |
SYSTEM INSTRUCTIONS + EVIDENCE CONTEXT ---+--> final LLM synthesis
                                          |
CURRENT USER MESSAGE ---------------------+
```

### Consequence for v1

A follow-up such as:

```text
User: "What was the test procedure?"
Assistant: "..."
User: "What was its acceptance limit?"
```

uses **“What was its acceptance limit?”** as the retrieval query.

History can help the final LLM understand “its,” but it does not change which chunks LightRAG retrieves.

Preserve this behavior in the first Context Engine `direct_rag` slice. Do not silently add an LLM query-rewriter now.

### Context Engine history policy

Only send prior visible turns to synthesis:

```text
allowed roles: user, assistant
rejected roles: system, developer, tool, function, arbitrary roles
excluded:      current user message, internal prompts, raw evidence, tool traces,
               errors, provider metadata, hidden chain-of-thought
persistence:   none in this slice
```

Use the latest complete turns that fit the configured history budget. Never accept a browser-supplied system message.

---

## 5. Why Context Engine should split retrieval from synthesis

### Weak integration

```text
Browser -> Context Engine -> LightRAG /query/stream -> Browser
```

This is convenient, but LightRAG would synthesize the answer before Context Engine can validate every reference against its own domain binding and source policy.

### Required integration

```text
Browser
  |
  | POST /api/v1/chat/turn/stream
  | { domain_id, message, history[] }
  v
Context Engine
  |
  +-- authenticate user + authorize domain + require ready runtime
  |
  +-- retrieve only from private LightRAG runtime (mode=naive)
  |
  +-- map candidate source ids/paths -> LightRAGIndexBinding -> IndexUnit/source
  |
  +-- discard anything no longer eligible
  |
  +-- compile allowed evidence into final prompt
  |
  +-- send validated history + current message to configured query LLM
  |
  +-- transform to Context Engine stream contract
  v
Browser
```

| Concern                            | Direct LightRAG answer proxy | Context Engine split                  |
| ---------------------------------- | ---------------------------- | ------------------------------------- |
| Evidence eligibility before answer | Too late                     | Enforced before synthesis             |
| App-specific source/evidence ids   | Upstream ids leak into UI    | Context Engine emits opaque ids       |
| Prompt and history policy          | Coupled to LightRAG          | Server-owned and testable             |
| Provider ownership                 | LightRAG-owned               | Context Engine query provider profile |
| Browser contract                   | Upstream shape leaks         | Stable Context Engine SSE contract    |
| Future graph modes                 | Entangled with answer route  | Adapter can add modes later           |

---

## 6. End-to-end vertical slice

### 6.1 Primary flow

```text
+------------------+
| Browser chat UI  |
+--------+---------+
         |
         | user message + visible prior turns
         v
+---------------------------------------------------------------+
| Context Engine: POST /chat/turn/stream                        |
|---------------------------------------------------------------|
| 1. authenticate                                                |
| 2. authorize user -> domain                                   |
| 3. resolve active ready LightRAGIndexBinding                  |
| 4. validate + compact transient history                       |
| 5. server owns retrieval profile: direct_rag -> naive         |
+----------------------------+----------------------------------+
                             |
                             | retrieval query only
                             | history = []
                             v
+---------------------------------------------------------------+
| Private LightRAG domain runtime                               |
|---------------------------------------------------------------|
| query-data / structured retrieval                             |
| naive -> vector candidates -> rerank/truncate -> chunks/refs  |
+----------------------------+----------------------------------+
                             |
                             | raw candidate evidence
                             v
+---------------------------------------------------------------+
| Context Engine                                                 |
|---------------------------------------------------------------|
| 6. EvidenceMapper: binding + source eligibility check         |
| 7. PromptBuilder: allowed evidence -> bounded context block   |
| 8. QueryLLMClient: system prompt + history + current message  |
| 9. emit app events: evidence -> delta* -> complete/error      |
+----------------------------+----------------------------------+
                             |
                             v
+------------------+
| Browser chat UI  |
+------------------+
```

### 6.2 Sequence flow

```text
Browser          Context Engine            LightRAG                 Query LLM
   |                    |                     |                         |
   | chat turn          |                     |                         |
   |------------------->|                     |                         |
   |                    | authorize + ready   |                         |
   |                    |                     |                         |
   |                    | query-data(naive, current_query)               |
   |                    |-------------------->|                         |
   |                    |                     | vector retrieval        |
   |                    |<--------------------| chunks + references     |
   |                    |                     |                         |
   |                    | map/filter evidence |                         |
   |                    | evidence event      |                         |
   |<-------------------|                     |                         |
   |                    | system + accepted context + history + query    |
   |                    |----------------------------------------------->|
   |                    |<-----------------------------------------------|
   | answer deltas      |                    streamed tokens             |
   |<-------------------|                     |                         |
   | complete           |                     |                         |
   |<-------------------|                     |                         |
```

---

## 7. Minimal contracts

### Browser request

```json
{
  "domain_id": "uuid",
  "message": "What is the inspection acceptance limit?",
  "history": [
    {
      "role": "user",
      "content": "Summarize the inspection procedure."
    },
    {
      "role": "assistant",
      "content": "The procedure requires ..."
    }
  ]
}
```

### Server-owned fields

Never accept these from the browser:

```text
mode
system prompt
provider/model selection
LightRAG base URL
max token budgets
rerank knobs
source eligibility controls
raw document paths
```

### Internal retrieval plan

```python
DirectRagRetrievalPlan(
    lightrag_mode="naive",
    query=current_message,
    domain_runtime=resolved_runtime,
    server_token_budget=domain_profile.retrieval_budget,
    conversation_history=[],  # intentional: retrieval does not use history
)
```

### Internal synthesis plan

```python
DirectRagSynthesisPlan(
    system_prompt=compiled_system_prompt,
    evidence=accepted_evidence,
    history=bounded_visible_history,
    user_message=current_message,
    model_profile=domain_profile.query_model,
    stream=True,
)
```

### Browser stream events

```text
event: evidence
data: { "items": [{ "evidence_id": "ev_...", "label": "Manual · Section 4" }] }

event: delta
data: { "text": "The acceptance limit is ..." }

event: complete
data: { "status": "success" }
```

Terminal alternatives:

```text
complete: { status: "no_evidence" }
error:    { code: "domain_not_ready" | "retrieval_failed" | "synthesis_failed" }
```

Emit no answer delta before the evidence event.

---

## 8. History normalizer and context budget

### Required normalizer

```python
def normalize_history(turns: list[dict], token_budget: int) -> list[ChatTurn]:
    # 1. allow only user/assistant roles
    # 2. require non-empty string content
    # 3. trim per-turn content to a server limit
    # 4. preserve chronological order
    # 5. retain newest complete user/assistant turns within budget
    # 6. never include the current message here
    ...
```

### Budget rule

LightRAG’s native context budget is calculated around prompt/query/retrieved context. Because history is injected later into the LLM call, Context Engine must reserve room for it itself.

```text
model context window
- requested output tokens
- fixed system instructions
- bounded history tokens
- current user message tokens
= maximum evidence-context tokens
```

The evidence compiler must truncate evidence **before** starting LLM synthesis. Do not rely on the provider to truncate messages implicitly.

### Safe prompt assembly

```text
SYSTEM
  Context Engine grounding rules
  + requested response form
  + only accepted evidence
  + citation/evidence formatting instruction

HISTORY
  prior visible user/assistant messages only

USER
  current message
```

Treat retrieved document text as evidence, not privileged instructions. The synthesis prompt must state that document instructions cannot override system rules.

---

## 9. Evidence mapping rule

Use the canonical binding chain:

```text
LightRAG reference / chunk source id
        -> LightRAGIndexBinding
        -> IndexUnit
        -> canonical document/source location
        -> authorization and lifecycle check
        -> Context Engine EvidenceItem
```

### Mapping outcomes

```text
known + active + authorized  -> include in prompt and stream as opaque evidence
known + archived/deleted     -> discard
unknown/unmapped             -> discard and log structured warning
wrong domain                 -> discard and treat as integration failure
```

Do not expose a LightRAG file path, raw reference ID, internal runtime URL, or raw chunk database ID as a permanent browser identifier.

No evidence table is necessary. Resolve this from existing bindings/index units during the request.

---

## 10. Small module layout

```text
app/
  chat/
    direct_rag/
      contracts.py          # request, event, retrieval/synthesis plans
      route.py              # POST /chat/turn/stream
      service.py            # orchestrates this one vertical slice
      history.py            # validate + compact visible history
      prompt.py             # evidence-safe final system prompt
      streaming.py          # app SSE events
  integrations/
    lightrag/
      query_data_client.py  # private remote structured retrieval call
  evidence/
    mapper.py               # binding/source eligibility -> EvidenceItem
  llm/
    query_client.py         # configured server-side synthesis model

tests/
  chat/direct_rag/
    test_history.py
    test_retrieval_payload.py
    test_evidence_gate.py
    test_prompt_budget.py
    test_stream_order.py
```

Avoid adding `RagExecutor`, `AgentRunner`, `WorkflowEngine`, or a generic provider abstraction merely for this slice.

---

## 11. Orchestrator pseudocode

```python
async def stream_direct_rag_turn(actor, request):
    domain = await domain_access.require_queryable_domain(actor, request.domain_id)
    binding = await bindings.require_ready_binding(domain.id)

    history = normalize_history(
        request.history,
        token_budget=domain.query_profile.history_token_budget,
    )

    # Retrieval intentionally sees only the current message.
    raw = await lightrag_query_data.retrieve_naive(
        runtime=binding.runtime,
        query=request.message,
        token_budget=domain.query_profile.retrieval_token_budget,
    )

    evidence = await evidence_mapper.accept_only_bound_evidence(
        domain=domain,
        binding=binding,
        raw_retrieval=raw,
    )

    if not evidence:
        yield event.no_evidence()
        return

    prompt = prompt_builder.build(
        policy=domain.query_profile,
        current_message=request.message,
        history=history,
        evidence=evidence,
    )

    yield event.evidence(evidence.public_items())

    async for text in query_llm.stream(
        model_profile=domain.query_profile.query_model,
        system_prompt=prompt.system_prompt,
        history_messages=history,
        user_message=request.message,
    ):
        yield event.delta(text)

    yield event.complete()
```

---

## 12. Failure behavior

| Condition                      | Browser result                         | Do not do                                  |
| ------------------------------ | -------------------------------------- | ------------------------------------------ |
| User lacks domain access       | authorization error                    | reveal domain existence or source labels   |
| No ready binding/runtime       | `domain_not_ready`                     | start Docker/runtime from chat request     |
| LightRAG returns no candidates | `no_evidence`                          | bypass retrieval and hallucinate an answer |
| Candidates cannot be mapped    | `no_evidence` plus server warning      | synthesize from unknown chunks             |
| Upstream retrieval fails       | `retrieval_failed`                     | silently use local fallback retrieval      |
| LLM fails after evidence event | `synthesis_failed`                     | emit a fabricated completion               |
| Browser disconnects            | cancel downstream request if supported | continue a costly stream unnecessarily     |

---

## 13. Native LightRAG cache caution

In the inspected LightRAG `naive_query` / KG query code, the argument hash used for the response cache includes the query and several query controls but does not visibly include `conversation_history`.

For a Context Engine integration that lets LightRAG synthesize directly, that can cause the same current query to reuse an answer generated under a different prior conversation.

This vertical slice avoids that risk by:

```text
1. calling LightRAG for structured retrieval only;
2. omitting history from the LightRAG retrieval request;
3. synthesizing in Context Engine with the history-aware prompt;
4. adding no answer cache in v1.
```

Later, if an answer cache is introduced, its key must include at least:

```text
domain/binding version
retrieval configuration version
normalized current user message
normalized retained history digest
accepted evidence ids/content revision
system-prompt/profile version
query-model identity
```

---

## 14. Implementation order

1. Add the request and event contracts.
2. Gate the route by authenticated actor, authorized domain, and ready binding.
3. Implement `history.normalize_history()` with role validation and a token budget.
4. Add the private LightRAG query-data adapter for `mode="naive"`.
5. Map and filter raw candidates through the existing binding/index-unit chain.
6. Build a bounded evidence-only synthesis prompt.
7. Stream `evidence -> delta* -> complete/error` from Context Engine.
8. Add tests before enabling the route in the UI.

---

## 15. Acceptance tests

| Test                                         | Expected result                                                  |
| -------------------------------------------- | ---------------------------------------------------------------- |
| Browser submits `mode="bypass"`              | ignored/rejected; server uses `direct_rag -> naive`              |
| Browser submits a `system` history role      | request rejected or history item dropped; never forwarded        |
| History supplied                             | it reaches only Context Engine synthesis, not LightRAG retrieval |
| Same question, different history             | final prompt differs; no shared answer cache in v1               |
| LightRAG returns an unknown source reference | source is excluded from prompt and browser stream                |
| Domain binding is stopped                    | no LightRAG call; deterministic `domain_not_ready` event         |
| Evidence arrives                             | `evidence` event precedes first answer `delta`                   |
| No accepted evidence                         | no LLM synthesis request occurs                                  |
| Browser disconnects                          | downstream stream is cancelled/closed where client supports it   |
| Query model emits an error midstream         | terminal `synthesis_failed`; no fabricated completion            |

---

## 16. Upstream source trace for maintainers

Use these locations when LightRAG is upgraded:

```text
lightrag/lightrag.py
  - LightRAG.aquery_llm()
  - LightRAG.aquery_data()

lightrag/operate.py
  - naive_query()
  - kg_query()
  - context construction / chunk budgeting / result packaging

lightrag/base.py
  - QueryParam

lightrag/api/routers/query_routes.py
  - /query, /query/stream, /query/data request/response handling
```

Re-run the acceptance tests whenever any of these change. Verify especially:

```text
- `naive` remains vector-only retrieval
- structured query-data still returns enough chunk/reference information to map evidence
- history remains synthesis-only
- cache-key behavior
- streaming response framing
```
