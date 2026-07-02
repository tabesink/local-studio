# 07 — Module Boundaries

## Target file tree

See the fuller map in `scaffold/target-file-tree.md`.

## Boundary contract

```text
route
  → ChatTurnService
     → TurnRepository
     → AdvancedOrchestrator
        → PlannerPort
        → RetrievalPort
        → EvidenceVerifier
        → AnswerWriterPort
     → CitationValidator
     → TurnRepository
```

## Rules per module

### `api/v1/chat.py`

- Parse `ChatTurnRequest`.
- Resolve authenticated principal.
- Return `StreamingResponse`.
- No prompt assembly, retrieval, persistence queries, or model calls.

### `modules/chat/service.py`

- Owns transaction order and event generator.
- Authorizes domain before creating a turn.
- Converts expected failures into safe terminal events.

### `modules/chat/orchestrator.py`

- Owns only one request-scoped advanced turn.
- Has no database session, HTTP request object, UI dependency, or global mutable state.
- Emits `TurnProgress` and returns `TurnOutcome`.

### `modules/retrieval/ports.py`

- Defines `retrieve(domain_id, query, intent, policy) -> list[EvidenceRef]`.
- Does not know chat tables or browser events.

### `modules/evidence/`

- Owns canonical evidence DTOs, dedupe, citation validation, grounding verdicts, and redaction checks.

### `modules/providers/`

- Resolves server-owned model profile by domain policy.
- Browser cannot pass API keys/model/system prompt.

### `modules/conversations/`

- Owns user-scoped transcript retrieval and messages.
- Stores evidence links by assistant message.

## Avoid imports in the wrong direction

```text
api → modules/*                 allowed
chat → retrieval/evidence/...   allowed
retrieval → chat                forbidden
evidence → api                  forbidden
provider → route                forbidden
repository → orchestrator       forbidden
```
