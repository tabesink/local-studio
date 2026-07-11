# 12 — Implementation Slices

Each slice is vertical: contract → service → test → UI wiring.

## Slice 0 — Trusted turn foundation

**Build**
- `ChatTurnRequest`, `EvidenceRef`, `TurnOutcome`, SSE event DTOs.
- Authenticated `POST /api/v1/chat/turns:stream` returning a placeholder safe stream.
- Conversation/message persistence.

**Accept**
- Unauthorized and cross-domain calls fail before turn creation.
- Browser request cannot include server-owned controls.

## Slice 1 — Direct grounded retrieval answer

**Build**
- `RetrievalPort` and one private runtime adapter.
- Evidence normalization, citation validator, final answer writer.

**Accept**
- One factual question returns a cited answer.
- No evidence returns grounded insufficiency.

## Slice 2 — Safe progress stream

**Build**
- `TurnProgress` generator mapped to SSE events.
- Client stage indicator and citation panel.

**Accept**
- No event includes prompts, planning reasoning, private paths, or API secrets.

## Slice 3 — Bounded advanced planner

**Build**
- Planner → executable-plan validator → constrained tool router.
- Typed `PlanStep`, `RetrievalIntent`, loop budgets.

**Accept**
- Multi-hop fixture needs at least two evidence operations.
- Invalid plan/tool fails closed.

## Slice 4 — Evidence verifier and repair

**Build**
- Evidence distillation / claim verification, one retry maximum.
- Citation-to-source validation.

**Accept**
- Unsupported claims cannot be emitted as grounded.
- Verifier failure is observable in safe trace.

## Slice 5 — Per-user chat history and redaction

**Build**
- Transcript excerpt policy.
- Assistant-message ↔ evidence links.
- Source delete/domain delete redaction behavior.

**Accept**
- Deleting a source prevents future retrieval and redacts historic citations.
- Switching domains does not expose prior-domain evidence to retrieval.

## Slice 6 — Evaluation and operations

**Build**
- Fixture corpus, trace review, offline Ragas runner, latency/token counters.

**Accept**
- Regression suite measures groundedness, citation validity, answer quality, and budget compliance.
