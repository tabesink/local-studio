# P0 - Shared Contract

Status: CANONICAL

## Context Packet

P0 resolves cross-phase conflicts and owns the shared rules for state, deletion, secret injection, eligibility, resource limits, logging, CI, and non-negotiable protections.

Primary source: `docs/backend/p0-shared-contract.md`.

## This Slice Provides

- one owner per concern;
- domain and source state machine rules;
- private controller boundary;
- one worker rule;
- provider-secret runtime injection contract;
- embedding profile immutability from domain create;
- parser-kind freeze rule;
- hard-delete and grounded-only redaction contract;
- eligibility predicate;
- rate-limit/logging/CI minimums;
- forbidden infrastructure list.

## This Slice Must Not Rework

Do not soften P0 rules inside later phase tasks. If implementation discovers a real conflict, update P0 deliberately and note the decision.

## Next Slice Can Assume

P1 can assume the target is one trusted API, one Postgres database, typed errors, request IDs, opaque sessions, and no extra infrastructure.

## Acceptance Criteria

- P0 is referenced by master plan, architecture, implementation map, and phase issues.
- Later phase plans do not redefine shared rules in conflict with P0.
- Deviations require a decision-log entry and likely ADR.

