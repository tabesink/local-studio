# 08 — State, Persistence, and Deletion

## Request-scoped turn state

```text
TurnState
├── turn_id
├── user_id
├── domain_id
├── question
├── transcript_excerpt
├── plan: list[PlanStep]
├── completed_steps: list[StepRecord]
├── evidence: list[EvidenceRef]
├── derived_facts: list[DerivedFact]
├── remaining_budget
├── terminal_reason
└── safe_trace: list[TraceEvent]
```

**PROPOSED:** `TurnState` exists only during the request. It is not a cross-turn agent memory and is not a durable LangGraph checkpoint.

## Persisted records

```text
conversations
  └── messages
       ├── user message
       └── assistant message
            ├── message_evidence links
            └── turn_trace_summary

sources
  └── source_revision
       └── evidence locator metadata
```

Persist only:

- question and final answer;
- source-safe citations / evidence reference IDs;
- coarse stage timings, tool enum, stop reason, verifier verdict;
- bounded plan step labels only when safe to expose internally.

Never persist or stream hidden chain-of-thought, raw planner deliberation, private system prompts, keys, or internal runtime addresses.

## Conversation/domain rule

```text
Conversation A (user-owned)
  turn 1 → domain manuals
  turn 2 → domain policies
  turn 3 → domain manuals
```

**PROPOSED:** current `domain_id` scopes only the current retrieval call. Do not introduce `conversation_domains`, shared session indexes, or cross-domain retrieval memory.

## Deletion/redaction rule

```text
source deleted
  → retrieval runtime excludes it immediately
  → evidence locator becomes inactive
  → assistant messages citing it render citation as redacted
  → no historical answer reuses the deleted source as evidence
```

The chat module checks evidence activity before serving a citation or reusing message context.
