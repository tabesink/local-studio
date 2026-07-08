This focuses the review on the complete streaming path while preserving Context Engine’s evidence-first, API-only boundary. It uses the greenfield scaffold as the product authority and Local Studio only as the frontend implementation reference.  

# Streaming Integration Review and Implementation Plan

## Local Studio Frontend → Context Engine FastAPI Streaming API

## Objective

First, reverse-engineer the current Local Studio frontend streaming implementation from this repository:

```text
https://github.com/sybil-solutions/local-studio/tree/main
```

Then produce an evidence-based plan to let the Local Studio frontend stream grounded Context Engine answers through the Context Engine FastAPI application API.

Use the attached **Context Engine Greenfield Development Scaffold** as the source of truth for product boundaries, ownership, retrieval eligibility, evidence mapping, security, and Phase 7 grounded streaming chat behavior.

Do not redesign the Local Studio UI. Preserve its chat/workspace visual language, streaming response experience, loading states, cancellation behavior, sidebar/layout patterns, markdown rendering, and evidence-panel opportunities wherever safely possible.

The goal is not to preserve Local Studio’s controller, agent, terminal, filesystem, MCP, runtime, model-recipe, or local-workstation architecture.

---

# Mandatory Review Order

## Step 1 — Review Local Studio before proposing a contract

Do not begin with a generic FastAPI streaming design.

Inspect the repository and identify the exact existing streaming path, including:

1. Chat/agent composer component.
2. Submit handler.
3. API route or client request function.
4. Current request method and request body.
5. Existing stream protocol:

   * SSE
   * fetch `ReadableStream`
   * NDJSON
   * WebSocket
   * another custom framing format
6. Existing event parser and event types.
7. Abort/cancel behavior.
8. Retry behavior.
9. Error behavior before stream headers versus after streaming starts.
10. Incremental UI state updates.
11. Message/session state ownership.
12. Markdown, code block, citation, tool-call, or structured-event rendering.
13. Existing reverse proxy, Next.js route handler, rewrite, or controller forwarding behavior.
14. Relevant timeout, buffering, security-header, and runtime configuration.
15. Existing tests covering streamed turns.

For every confirmed finding, cite exact repository file paths, symbols, and line ranges.

Clearly separate:

* confirmed Local Studio behavior;
* assumptions;
* dead code;
* agent-specific streaming behavior that must not survive;
* generic streaming infrastructure worth retaining.

Do not assume a file name or architecture. Discover it from the repository first.

---

# Context Engine Streaming Rules

The proposed design must preserve these rules:

1. Browser clients communicate only with the Context Engine application API.
2. Browser clients never communicate directly with LightRAG, workers, Docker, storage, provider APIs, or runtime processes.
3. FastAPI owns authorization, retrieval scope, evidence mapping, source authorization, synthesis orchestration, provider/model resolution, and all failure decisions.
4. The browser cannot submit or override:

   * provider;
   * model;
   * system prompt;
   * embedding model;
   * reranker;
   * retrieval mode;
   * top-k;
   * LightRAG runtime settings;
   * source paths;
   * provider credentials.
5. Chat synthesis uses only mapped, eligible evidence.
6. Generated answer text is never evidence.
7. Evidence must be mapped and browser-safe before it is shown, cited, or supplied to synthesis.
8. Retrieval success plus synthesis failure returns evidence-only output.
9. The server performs at most one bounded synthesis retry using the same frozen active synthesis profile.
10. The browser does not offer a “retry synthesis” action.
11. A new submitted question is the only user-visible way to create another synthesis attempt.
12. Chat history is not a durable collaborative product in this phase.
13. Keep the design suitable for approximately 5–10 concurrent internal users.
14. Do not introduce WebSockets, event buses, queues, workflow engines, microservices, autonomous agents, local retrieval fallback, or a second retrieval system.

---

# Required Analysis

## 1. Current Local Studio Streaming Architecture Map

Create this table from actual code:

| Layer                        | Exact file(s) | Current responsibility | Stream protocol/state | Keep, adapt, replace, or remove |
| ---------------------------- | ------------- | ---------------------- | --------------------- | ------------------------------- |
| Composer                     |               |                        |                       |                                 |
| Submit action                |               |                        |                       |                                 |
| API client / route handler   |               |                        |                       |                                 |
| Stream parser                |               |                        |                       |                                 |
| Stream event types           |               |                        |                       |                                 |
| Abort/cancel handling        |               |                        |                       |                                 |
| Message state/store          |               |                        |                       |                                 |
| Markdown/citation rendering  |               |                        |                       |                                 |
| Error/loading UX             |               |                        |                       |                                 |
| Proxy/rewrite/runtime config |               |                        |                       |                                 |
| Tests                        |               |                        |                       |                                 |

Answer explicitly:

* Does Local Studio already use POST plus streamed fetch response?
* Does it use SSE event framing?
* Does it rely on agent/tool events that Context Engine must remove?
* Does it use Next.js as a stream proxy?
* Can its parser and incremental rendering code be reused directly?
* Which parts need a narrow Context Engine stream adapter?
* Which existing state/update logic would cause stale or duplicate streamed output?

---

## 2. End-to-End Streaming Concern Inventory

Extract and assess every concern across this path:

```text
User submits question
→ Local Studio frontend
→ browser request
→ same-origin proxy/reverse proxy if required
→ FastAPI authentication and authorization
→ domain eligibility check
→ server-side retrieval scope resolution
→ private LightRAG retrieval
→ evidence mapping and authorization
→ bounded synthesis context assembly
→ configured provider/model stream
→ FastAPI event framing
→ reverse proxy flushing/buffering behavior
→ browser stream parser
→ Local Studio message/evidence UI
→ completion, cancellation, retry, or safe fallback
```

Cover at minimum:

### Transport and framing

* POST streaming versus EventSource limitations.
* Whether Local Studio’s current parser expects SSE, NDJSON, raw chunks, or another format.
* UTF-8 chunk boundaries and partial JSON/event handling.
* Event ordering and exactly one terminal state.
* Event IDs, sequence handling, stale event protection, and reconnect policy.
* Whether reconnect/resume is necessary or should remain explicitly unsupported.
* Keepalive comments and slow-provider connection handling.

### Browser behavior

* `fetch` credentials and cookie forwarding.
* `AbortController` behavior.
* Cancel button behavior.
* What happens when users submit another question while a turn is active.
* Stale response protection when the active domain changes.
* UI state for retrieving, evidence-ready, synthesizing, retrying, complete, evidence-only, cancelled, and failed.
* Whether partial answer text must be cleared if synthesis fails after text has started.
* No browser storage of credentials, provider settings, source paths, or sensitive stream payloads.

### FastAPI behavior

* Authentication and domain access before streaming starts.
* Validation and safe JSON errors before headers are sent.
* SSE terminal error/fallback events after headers are sent.
* Async cancellation propagation when the browser disconnects.
* One bounded server-side retry with unchanged frozen synthesis settings.
* Bounded active synthesis capacity for 5–10 users.
* Behavior when no eligible evidence exists.
* Behavior when LightRAG is unavailable.
* Behavior when provider streaming fails before first token.
* Behavior when provider streaming fails after partial output.
* Server-side timeout, provider timeout, and cancellation cleanup.
* No durable chat history requirement.

### Evidence and citations

* Evidence must arrive before answer text.
* Evidence cards use opaque source references only.
* Citation identifiers must map only to evidence emitted for the current turn.
* Unknown, cross-domain, deleted, stale, or unmapped citation references must be rejected.
* The client must not treat model-generated source labels as trusted.
* Define how streamed text references evidence:

  * inline reference markers;
  * structured citation events;
  * final citation ranges;
  * another minimal supported approach.
* Explain how Local Studio’s existing markdown renderer must change to render only validated citations.

### Reverse proxy and deployment

* Same-origin browser API path.
* Whether direct `/api/v1/*` routing to FastAPI is possible.
* Whether Local Studio’s current Next.js proxy must be removed, retained temporarily, or replaced.
* Reverse-proxy buffering disabled for the chat endpoint.
* Streaming response headers.
* Compression, caching, CDN, proxy read timeout, connection timeout, and flush behavior.
* Development versus production API origin behavior.
* CORS only when same-origin routing is impossible.

### Security and observability

* Session cookie flow.
* CSRF/origin checks for authenticated POST requests.
* Safe user-facing stream errors.
* No provider secrets, source storage paths, model internals, raw LightRAG payloads, or stack traces in streamed events.
* Minimal structured logs and metrics:

  * `turn_id`;
  * domain ID;
  * user ID or safe actor ID;
  * retrieval duration;
  * evidence count;
  * time to first stream event;
  * time to first answer delta;
  * completion outcome;
  * retry count;
  * cancellation/disconnect;
  * sanitized failure code.
* Do not persist raw prompts or full generated answers unless the existing approved product requirement explicitly needs it.

---

# Required Target API Contract

Design the smallest FastAPI contract that supports Context Engine grounded streaming and Local Studio’s existing frontend interaction patterns.

Use this endpoint as the baseline unless repository findings require a justified variation:

```text
POST /api/v1/domains/{domain_id}/chat/turns
Accept: text/event-stream
Content-Type: application/json
```

## Request model

Start from this narrow model:

```python
class ChatTurnRequest(BaseModel):
    question: str
```

The request must not include model, provider, prompt, retrieval controls, source paths, history, or hidden backend controls.

State whether Local Studio needs any additional non-sensitive client field. Reject additions that do not solve a current verified frontend requirement.

## Pre-stream JSON errors

Define standard JSON errors for failures detected before stream headers are sent:

```text
401 AUTH_SESSION_REQUIRED
403 DOMAIN_ACCESS_DENIED
404 DOMAIN_NOT_FOUND
409 DOMAIN_NOT_AVAILABLE
422 REQUEST_VALIDATION_FAILED
429 SYNTHESIS_CAPACITY_UNAVAILABLE
503 RETRIEVAL_UNAVAILABLE
```

Use the existing Context Engine canonical error envelope.

## Stream event contract

Create explicit Pydantic and TypeScript discriminated-union models for the final event protocol.

Start from these concepts, then simplify or adjust only when justified by Local Studio’s actual parser and UI:

```text
turn.started
evidence.ready
answer.delta
answer.reset
turn.completed
turn.failed
```

Required semantics:

| Event            | Required purpose                                                                     |
| ---------------- | ------------------------------------------------------------------------------------ |
| `turn.started`   | Confirms accepted streamed turn and returns opaque `turn_id`.                        |
| `evidence.ready` | Sends complete mapped, authorized evidence before synthesis text.                    |
| `answer.delta`   | Sends incremental answer text only.                                                  |
| `answer.reset`   | Clears partial answer UI when a later failure requires evidence-only fallback.       |
| `turn.completed` | Exactly one successful terminal state: `synthesized` or `evidence_only`.             |
| `turn.failed`    | Exactly one failed terminal state when no safe evidence-only completion is possible. |

Define the final protocol precisely:

* required fields;
* optional fields;
* event ordering;
* whether every event needs a sequence number;
* whether events include `turn_id`;
* whether keepalives are SSE comments or typed events;
* terminal-event rules;
* payload-size limits;
* encoding behavior;
* citation representation;
* cancelled/disconnected behavior;
* whether retrying is a visible event or only an internal server action.

Do not emit duplicate terminal events. Do not create a generic event bus contract.

## Evidence model

Define a browser-safe evidence model containing only required fields:

```python
class Evidence(BaseModel):
    evidence_id: str
    reference_id: str
    source_ref: str
    document_title: str
    locator: EvidenceLocator
    excerpt: str
    kind: Literal["text", "table", "image"]
```

Define `EvidenceLocator` only with supported browser-safe fields such as page, section, chunk label, or table/image label.

Do not expose LightRAG IDs unless required and safe. Do not expose storage paths, container paths, provider data, or raw parser internals.

## Completion/fallback model

Define how the frontend distinguishes:

```text
synthesized
evidence_only
cancelled
failed
```

Required behavior:

```text
retrieval succeeds + synthesis fails before text
→ evidence.ready
→ turn.completed(outcome=evidence_only)

retrieval succeeds + synthesis fails after partial text
→ answer.reset
→ turn.completed(outcome=evidence_only)

retrieval has no eligible mapped evidence
→ turn.failed(code=RETRIEVAL_NO_ELIGIBLE_EVIDENCE)

browser aborts request
→ server cancels provider stream
→ no durable partial chat record
```

Assess whether Local Studio’s current UI can express these states without redesign. Recommend the smallest state/UI changes needed.

---

# Required FastAPI Streaming Sequence

Provide a sequence diagram and implementation plan for this target flow:

```text
Browser submits question
→ FastAPI validates session, role, domain availability
→ FastAPI creates in-memory turn context
→ FastAPI resolves retrieval scope
→ FastAPI queries private LightRAG
→ FastAPI discards unmapped/ineligible retrieval results
→ FastAPI emits turn.started
→ FastAPI emits evidence.ready
→ FastAPI freezes active synthesis profile
→ FastAPI streams provider output as answer.delta events
→ FastAPI validates/maps citations
→ FastAPI emits exactly one terminal event
→ browser updates Local Studio UI
```

Also define alternate paths:

1. Unauthorized request.
2. Domain unavailable.
3. Retrieval failure.
4. No eligible evidence.
5. Provider failure before text.
6. Provider failure after partial text.
7. One bounded backend retry succeeds.
8. One bounded backend retry fails.
9. Browser cancel/disconnect.
10. Reverse proxy timeout or buffering failure.
11. Provider capacity exhausted.

---

# Required Local Studio Frontend Plan

Provide a file-by-file plan based on actual repository findings.

For each file, state:

| File | Current responsibility | Context Engine change | Keep/adapt/remove | Risk | Validation |
| ---- | ---------------------- | --------------------- | ----------------- | ---- | ---------- |

Cover at minimum:

* current composer;
* current submit hook/action;
* stream parser;
* message/session store;
* agent-turn API route;
* controller proxy/rewrite;
* markdown/citation renderer;
* loading/error components;
* cancel/retry controls;
* test fixtures;
* Next.js config;
* environment configuration.

Required frontend design rules:

1. Preserve existing Local Studio streaming visual behavior where possible.
2. Replace agent/tool event rendering with grounded-answer and evidence rendering.
3. Use one Context Engine stream parser, not parallel old/new parsers.
4. No local fake domain lifecycle, retrieval, citation, or model state.
5. No token, provider configuration, role, or source path in browser storage.
6. Domain selection comes from the Context Engine API and URL/UI state, not local persisted controller state.
7. Hide admin-only controls for members, but rely on FastAPI for actual authorization.
8. Disable duplicate submission while a turn is active unless the verified Local Studio UX already supports safe replacement.
9. Abort active stream when the user explicitly cancels or changes away from the active domain.
10. Do not add a user-facing synthesis retry button.

---

# Required Implementation Plan

Provide a focused phased plan.

## Phase A — Repository extraction and contract decision

* Inspect and document existing Local Studio stream flow.
* Identify reusable parser/UI pieces.
* Identify agent/controller code that must be removed.
* Decide whether current framing can be retained.
* Lock one typed Context Engine stream contract.

## Phase B — FastAPI streaming endpoint

* Implement endpoint and request validation.
* Implement authenticated domain eligibility checks.
* Implement retrieval and mapped-evidence assembly.
* Implement SSE `StreamingResponse`.
* Implement bounded provider stream and one bounded retry.
* Implement safe evidence-only fallback.
* Implement cancellation/disconnect handling.
* Add minimal stream metrics/logging.

## Phase C — Local Studio frontend rewiring

* Replace current agent-turn request path.
* Add Context Engine typed stream parser.
* Map evidence event to existing side-panel/card UI.
* Map answer deltas to current incremental assistant rendering.
* Map terminal outcomes to explicit UX states.
* Remove controller token/proxy/agent event coupling.

## Phase D — Reverse proxy and deployment validation

* Configure same-origin `/api/v1/*` path.
* Disable buffering for streaming endpoint.
* Set safe read/idle timeouts.
* Verify cookies, credentials, and origin handling.
* Verify streaming works in development and Compose deployment.

## Phase E — End-to-end tests

* Add FastAPI stream-contract tests.
* Add Local Studio parser tests.
* Add browser Playwright tests.
* Add Compose/reverse-proxy streaming smoke test.
* Add cancellation and evidence-only fallback test.

Do not propose implementation phases unrelated to streaming.

---

# Required Test Matrix

Include concrete tests for:

| Scenario                                               | Required expected result                                                     |
| ------------------------------------------------------ | ---------------------------------------------------------------------------- |
| Member submits valid question to available domain      | Evidence arrives before answer deltas; answer completes with valid citations |
| No authenticated session                               | JSON `401` before stream starts                                              |
| Member accesses unavailable domain                     | JSON `409` or defined safe error before stream starts                        |
| Retrieval returns only unmapped results                | No answer stream; safe terminal failure                                      |
| Retrieval succeeds; provider fails before first delta  | Evidence-only completion                                                     |
| Retrieval succeeds; provider fails after partial delta | Partial answer is cleared; evidence-only completion                          |
| One internal retry succeeds                            | One continuous user-visible turn; no profile switch                          |
| Retry fails                                            | Evidence-only completion; no client retry action                             |
| Browser cancels                                        | Provider task is cancelled; UI shows cancelled state; no stale updates       |
| User starts a second question                          | First turn cannot overwrite second turn UI                                   |
| Stream contains malformed event                        | Parser fails safely; no crash; safe error state                              |
| Proxy buffering enabled accidentally                   | Deployment test detects delayed first event                                  |
| Unknown citation reference                             | Client does not render it as trusted citation                                |
| Cross-domain source reference                          | Backend rejects it                                                           |
| Member sees Local Studio UI                            | No admin/provider/runtime controls visible                                   |
| Browser storage inspection                             | No credentials, provider config, raw source path, or session token persisted |

---

# Required Final Report

Use this structure:

1. Executive streaming assessment
2. Confirmed Local Studio streaming architecture
3. Stream path diagram
4. Reusable versus agent/controller-coupled streaming code
5. End-to-end streaming concerns and risks
6. Final FastAPI API contract
7. Final Pydantic and TypeScript data models
8. SSE event ordering and terminal-state rules
9. Evidence and citation contract
10. FastAPI implementation design
11. Local Studio frontend integration plan
12. Reverse proxy/deployment requirements
13. File-by-file removal/adaptation plan
14. Test matrix and acceptance criteria
15. Risks, assumptions, and unresolved decisions
16. Research consulted

End with a direct decision:

```text
Can Local Studio’s existing streaming UX be retained for Context Engine?
What exact code can be reused?
What must be replaced?
What is the minimum backend stream contract required before frontend wiring starts?
What is the first safe vertical implementation slice?
```

---

# Reporting Standards

* Review repository code first.
* Cite exact files, symbols, and line ranges.
* Do not invent Local Studio behavior.
* Separate confirmed findings from assumptions.
* Prefer direct FastAPI API integration over generic Next.js proxying.
* Preserve Local Studio UI continuity without preserving its workstation/agent architecture.
* Keep FastAPI as the canonical owner of all business rules and streamed state.
* Use KISS, YAGNI, and DRY throughout.
* Do not recommend a frontend rebuild.
* Do not introduce speculative compatibility layers, second stream protocols, event buses, or framework abstractions.
