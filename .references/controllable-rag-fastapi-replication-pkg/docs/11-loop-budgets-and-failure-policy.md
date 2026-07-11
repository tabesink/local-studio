# 11 — Loop Budgets and Failure Policy

## Why budgets are required

**OBSERVED:** upstream conditional edges may retry content distillation and answer generation until the LLM verifier accepts them. The top-level graph can also return to plan refinement after replanning.

**PROPOSED:** all loops must have a counter, deadline, and terminal outcome.

## Initial server policy

```text
MAX_PLAN_STEPS                = 5
MAX_RETRIEVAL_OPERATIONS      = 3
MAX_REPAIR_ATTEMPTS_PER_STEP  = 1
MAX_FINAL_ANSWER_RETRIES      = 1
MAX_EVIDENCE_TOKENS           = server configured
TURN_TIMEOUT_SECONDS          = 90
MAX_ADVANCED_TURNS_PER_PROCESS = server configured
```

Values are server configuration, not browser input.

## Bounded execution

```text
for step in plan[:MAX_PLAN_STEPS]:
    decide operation
    execute one operation
    verify returned evidence/fact
    if original question answerable: break
else:
    terminal_reason = "turn_budget_exhausted"
```

## Terminal rules

| Condition | Result |
|---|---|
| Retrieval has no useful evidence | Attempt allowed alternate retrieval intent once; otherwise insufficiency. |
| Verifier rejects distillation | Retry once with stricter extraction; otherwise discard it. |
| Final answer fails citation/grounding | Regenerate once using only vetted evidence; otherwise insufficiency. |
| Timeout/provider failure | Stop safely; do not persist an answer as grounded. |
| Planner emits invalid tool/intent | Reject, record safe trace, return controlled failure. |

## Concurrency rule

Advanced turns are I/O-heavy and cost-sensitive. Use an application-process semaphore or deployment configuration to limit simultaneous advanced turns; keep a direct answer path available for normal turns. Do not add a queue merely for this first scope.
