# Turn Orchestrator — Request Sequence (Direct vs Advanced)

Terse sequence reference for implementers. Pseudocode shape only.

---

## Shared Preconditions (every turn)

```text
ChatTurnService.handle_stream(request):
  1. authenticate + authorize domain_id
  2. assert client_request_id idempotency
  3. assert no other running turn on conversation
  4. persist user message + turn row (running)
  5. load transcript excerpt (prior user questions only — AI-001)
  6. resolve synthesis profile once (F-002)
  7. yield SSE turn.started (internal; may map to first evidence/token)
  8. async for progress in orchestrator.run(state): yield to SSE
  9. persist assistant message + evidence links + terminal status
```

---

## Mode A — Direct (pilot default)

One retrieval, one answer. Meets F-007 without planner.

```text
state = TurnState(domain_id, question, mode="direct")

yield progress(retrieving)
evidence = await retrieval.retrieve(domain_id, question, intent="overview")
if not evidence:
    return terminal(no_grounded_context)

yield progress(evidence_ready, evidence)
answer_stream = await synthesis.stream_final(question, evidence, transcript)
async for chunk in answer_stream:
    yield progress(token, chunk)

validated = citations.validate(answer, evidence)
if not validated:
    return terminal(insufficiency)

yield progress(done, answer, citations)
```

**Budget:** 1 retrieval op, 1 final answer, 1 verify/repair max.

---

## Mode B — Advanced (controllable RAG)

Bounded plan loop. Enable when `chat.policy.advanced_enabled = true`.

```text
state = TurnState(domain_id, question, mode="advanced")

yield progress(planning)
state.plan = await planner.create_executable_plan(question)

for step in state.plan[:MAX_PLAN_STEPS]:
    if state.budget.exhausted():
        return terminal(turn_budget_exhausted)

    op = await router.choose(step, state.evidence, policy.allowed_ops)

    if op.kind in {fact, overview, verbatim}:
        yield progress(retrieving)
        raw = await retrieval.retrieve(domain_id, op.query, op.kind)
        vetted = await verifier.distill_and_verify_once(op.query, raw)
        state.add_evidence(vetted)
        yield progress(evidence_ready, vetted.safe_batch())
    else:
        fact = await synthesis.answer_from_evidence(step, state.evidence)
        state.add_derived_fact(fact)

    yield progress(verifying)
    if await answerability.is_satisfied(question, state):
        break
    state.plan = await replanner.remaining(state)

yield progress(answering)
answer = await synthesis.final_answer(question, state)
citations.require_supported(answer, state.evidence)
verdict = await grounder.verify_once(answer, state.evidence)
if not verdict.ok:
    answer = await synthesis.repair_once(answer, state.evidence)

stream + yield done
```

---

## RetrievalPort Call (both modes)

```text
                    ┌─────────────────────┐
                    │  TurnOrchestrator   │
                    └──────────┬──────────┘
                               │ retrieve(domain, query, intent)
                               ▼
                    ┌─────────────────────┐
                    │  F-006 callable     │
                    │  (same as HTTP P6)  │
                    └──────────┬──────────┘
                               │
              ┌────────────────┼────────────────┐
              ▼                ▼                ▼
        LightRAGClient   CE_BLOCK parser   eligibility filter
              │                │                │
              └────────────────┴────────────────┘
                               ▼
                      list[Evidence DTO]
```

**Rule:** HTTP route `POST /domains/{id}/evidence` and internal `RetrievalPort` must call the same function.

---

## SSE Projection

```text
Orchestrator progress          EVT-001 (pilot)     EVT-001 (+ stage patch)
─────────────────────          ───────────────     ─────────────────────
evidence_ready (batch)    →    event: evidence     + event: stage retrieving
token chunk               →    event: token
terminal success          →    event: done
terminal failure          →    event: error
planning/verifying        →    (omit or log)       event: stage
```

---

## Failure Terminals

| Condition | Terminal | User-visible |
| --- | --- | --- |
| Zero mapped evidence | `no_grounded_context` | safe insufficiency |
| Provider fails after evidence | `evidence_only` | show evidence panel, fallback text |
| Budget exhausted | `turn_budget_exhausted` | concise unable-to-complete |
| Citation/grounding fail after repair | insufficiency | no fabricated claims |
| Cross-domain / auth fail | HTTP error before stream | no turn created |
