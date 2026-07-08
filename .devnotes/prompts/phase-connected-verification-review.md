# Spec-Driven App — Phase-Connected Verification Prompt Suite

## Shared review rules

Use these rules in every review below:

```text
Act as a senior software architect, staff engineer, QA lead, and systems designer.

Review the actual repository, current phase specification, prior phase specifications, API contracts, schema/migrations, tests, and available runtime evidence.

Do not assume a feature exists because a plan says it should exist.

Do not recommend microservices, Redis, queues, Kubernetes, event buses, generic workflow engines, or new infrastructure unless the current requirements and measured evidence clearly require them.

Prioritize:
1. Correctness and user-visible behavior.
2. Clear ownership of data, state, and side effects.
3. Stable cross-phase contracts.
4. Security, deletion, and recovery behavior.
5. Lean implementation suitable for the stated concurrency target.
6. Code that junior developers can safely extend.

For every finding, provide:
- Severity: Blocker / High / Medium / Low
- Evidence: exact file, function, route, schema, test, or missing artifact
- Why it matters
- Concrete correction
- Verification test required after correction

Separate:
- Must fix in this phase
- Explicitly defer to a later phase
- Reject as unnecessary complexity
```

---

# Gate 1 — Specification Coherence and Phase Dependency Review

## When to run

Run before implementation begins for every phase.

## Prompt

```text
Review this phase of a spec-driven application before implementation.

Inputs:
- Current phase specification: <PHASE_SPEC>
- Product requirements: <PRODUCT_REQUIREMENTS>
- Architecture baseline: <ARCHITECTURE_BASELINE>
- Prior phase specs and completed-gate reports: <PRIOR_PHASES>
- Planned next phases: <FUTURE_PHASES>
- Target users, load, and deployment constraints: <TARGET_CONSTRAINTS>

Objective:
Verify that this phase is internally coherent, properly scoped, and safely connected to earlier and later phases.

Assess:

1. Requirement clarity
- Identify ambiguous acceptance criteria.
- Identify requirements that cannot be objectively tested.
- Identify hidden decisions required before implementation.

2. Cross-phase dependency integrity
- For every requirement, identify which earlier phase owns its prerequisite.
- Identify every API, schema, auth, storage, UI-state, worker, or provider contract this phase consumes.
- Identify contracts this phase creates for later phases.
- Flag any dependency that is implied but not specified.

3. Ownership and boundaries
- Confirm exactly one owner for each durable state, background operation, external side effect, and lifecycle action.
- Flag duplicated ownership, unclear source of truth, or browser access to internal services.

4. Scope discipline
- Identify work that belongs to a later phase.
- Identify missing work that must move into this phase to prevent a broken vertical slice.
- Reject speculative abstractions and infrastructure.

5. Testability
- Convert acceptance criteria into observable end-to-end scenarios.
- State the evidence needed to mark the phase complete.

Required output:

A. Conditional Go / No-Go verdict.

B. Phase dependency map:

| Requirement | Prior prerequisite | Current owner | Contract consumed | Contract created | Later dependent phase | Risk |
|---|---|---|---|---|---|---|

C. Spec contradictions and missing decisions.

D. Frozen contracts for this phase:
- API routes and request/response shapes
- Schema/data ownership
- Auth and permissions
- State machine/status values
- Error codes
- Idempotency/cancellation rules where needed

E. Phase exit criteria:
- Required tests
- Required migrations
- Required observability/logging
- Required manual verification
- Required documentation updates

F. Must-fix-now vs defer vs reject list.
```

---

# Gate 2 — Vertical Slice Implementation Review

## When to run

Run after a phase is implemented, before merging or beginning the next phase.

## Prompt

```text
Review the implemented vertical slice for this phase.

Inputs:
- Current phase specification: <PHASE_SPEC>
- Repository and current diff: <CODEBASE_AND_DIFF>
- API/schema contracts: <CONTRACTS>
- Automated test output: <TEST_OUTPUT>
- Runtime logs or screenshots where available: <RUNTIME_EVIDENCE>
- Prior phase gate reports: <PRIOR_GATE_REPORTS>

Objective:
Determine whether this phase is genuinely implemented end-to-end rather than partially scaffolded.

Trace every major user flow through:

Browser/UI
-> API route
-> authentication and authorization
-> service/application logic
-> database/storage
-> worker or external provider where relevant
-> response or SSE stream
-> UI state and persisted result

Verify:

1. No fake vertical slices
- No placeholder API route behind a polished UI.
- No UI state that claims success before durable state is written.
- No schema/table/model that is unused or bypassed.
- No background operation without status ownership and recovery behavior.

2. Data and state correctness
- Validate state transitions.
- Check transaction boundaries.
- Confirm slow work is outside DB transactions.
- Confirm idempotency for harmful duplicate requests.
- Confirm cancellation, retry, and stale-result behavior where applicable.

3. Contract compliance
- Compare implementation against the frozen contracts.
- Flag undocumented response fields, altered status values, breaking schema changes, and hidden coupling.

4. Permissions
- Confirm every route filters by the authenticated user and role.
- Confirm UI hiding is not the only authorization layer.
- Confirm admin actions cannot be triggered by regular users.

5. Error behavior
- Check validation errors, provider failures, timeouts, retries, concurrent requests, and partial completion.
- Confirm safe error messages and structured logs.

Required output:

A. Implementation verdict:
- Complete
- Complete with contained issues
- Partial / misleading
- Blocked

B. End-to-end flow map with exact files, routes, tables, workers, and external calls.

C. Acceptance-criteria proof matrix:

| Acceptance criterion | Code evidence | Automated test | Runtime evidence | Status | Gap |
|---|---|---|---|---|---|

D. Broken or incomplete vertical-slice findings.

E. Exact patch plan ordered by implementation dependency.

F. Tests that must be added before the phase is accepted.
```

---

# Gate 3 — Functional Behaviour and Edge-Case Verification Review

## When to run

Run after Gate 2, especially for user-facing workflows, uploads, chat, payments, data changes, and destructive actions.

## Prompt

```text
Act as a software QA architect and systems reliability reviewer.

Review whether this implemented phase behaves correctly under normal, invalid, interrupted, concurrent, and recovery conditions.

Inputs:
- Phase specification: <PHASE_SPEC>
- Implemented code: <CODEBASE>
- API contracts: <CONTRACTS>
- Existing tests and test results: <TESTS>
- Relevant logs, screenshots, or local runtime evidence: <EVIDENCE>

Build a behavior-verification matrix for every user workflow.

Test categories:

1. Happy path
- A valid authorized user completes the intended action.
- Durable state, UI state, API response, and downstream state all agree.

2. Validation and permissions
- Invalid input.
- Missing fields.
- Invalid state transitions.
- Unauthorized user.
- Incorrect role.
- Cross-user resource access.

3. Failure and recovery
- Provider timeout.
- Worker crash.
- Runtime restart.
- Network interruption.
- Browser refresh during an active operation.
- Duplicate request.
- Retry after partial failure.

4. Concurrency
- Two requests against the same resource.
- Two users acting on separate resources.
- Delete during processing.
- Update while a read/query is running.
- Late worker/provider result after the resource changes state.

5. Lifecycle and deletion
- Create, update, archive, retry, stop, restart, delete, restore where applicable.
- Verify derived data, cached data, search/index data, and user-visible history obey the deletion contract.

6. UX integrity
- Loading, empty, error, blocked, retrying, completed, and permission-denied states.
- No silent failure.
- No misleading success state.
- No action with unclear ownership or irreversible consequences.

Required output:

A. Functional confidence score by workflow.

B. Behaviour matrix:

| Scenario | Expected behavior | Actual evidence | Result | Defect | Required test |
|---|---|---|---|---|---|

C. Missing edge cases ranked by user harm.

D. Required automated test suite:
- Unit tests
- Integration tests
- End-to-end tests
- Concurrency/recovery tests

E. Clear release recommendation:
- Safe for next phase
- Safe only with stated limitations
- Not safe to continue
```

---

# Gate 4 — Cross-Phase Contract and Change-Impact Review

## When to run

Run at the end of every phase, immediately before the next phase starts.

## Prompt

```text
Review the completed phase as part of a multi-phase spec-driven application.

Inputs:
- Current phase spec and implementation: <CURRENT_PHASE>
- All prior phase specifications and completed reviews: <PRIOR_PHASES>
- Next phase plan: <NEXT_PHASE>
- Current repository, migrations, APIs, and tests: <CODEBASE>
- Architecture baseline: <ARCHITECTURE_BASELINE>

Objective:
Prevent architectural drift, orphaned features, undocumented contracts, and broken assumptions between phases.

Review:

1. Contract drift
- Did APIs, schemas, status values, permissions, or event/state assumptions change?
- Were those changes documented?
- Did downstream phases rely on the old shape?

2. Orphaned implementation
- Identify tables, endpoints, components, config fields, background jobs, and feature flags that are no longer connected to a real user flow.
- Identify scaffolding that should be removed before the next phase.

3. Handoff correctness
- Identify what this phase now guarantees.
- Identify what it explicitly does not guarantee.
- Identify what the next phase may safely assume.

4. Migration and compatibility risk
- Confirm existing data remains valid.
- Confirm migration ordering is safe.
- Confirm rollback/restore expectations are realistic.
- Flag changes that require versioning or a one-time data migration.

5. Architectural principles
- Verify one owner per data type and operation.
- Verify no duplicate retrieval, auth, storage, or workflow logic has appeared.
- Verify the browser remains isolated from private infrastructure.

Required output:

A. Cross-phase compatibility verdict.

B. Contract delta report:

| Contract | Previous form | Current form | Compatible? | Required migration/documentation |
|---|---|---|---|---|

C. Orphaned or duplicated implementation list.

D. “Next Phase Handoff Contract” containing:
- Stable APIs
- Stable schema assumptions
- Stable status/state machine
- Permission guarantees
- Known limitations
- Required integration tests for the next phase

E. Exact documentation changes required before proceeding.
```

---

# Gate 5 — Data Lifecycle, Security, and Destructive-Action Review

## When to run

Run for any phase that stores user data, uploads documents, uses LLMs, handles secrets, or includes delete/archive actions.

## Prompt

```text
Review this phase for data ownership, privacy, security boundaries, retention, deletion, and recovery correctness.

Inputs:
- Specifications and implementation: <PHASE_AND_CODEBASE>
- Database schema and migrations: <SCHEMA>
- Storage model: <STORAGE_MODEL>
- Auth model: <AUTH_MODEL>
- External provider integrations: <PROVIDERS>
- Deletion/retention requirements: <DATA_LIFECYCLE_REQUIREMENTS>

Verify:

1. Data ownership
- Who owns each row, file, object, embedding, index entry, log, cache item, trace, and derived answer?
- Can users access only their allowed resources?
- Does every derived artifact retain a reference to its original source?

2. Secrets
- Where are credentials stored, decrypted, injected, rotated, and logged?
- Confirm secrets never reach browser code, client logs, database plaintext, generated config files, or external observability by default.

3. Deletion contract
- Define what “delete” means for original data, derived content, indexes, chat history, logs, backups, and observability traces.
- Confirm async deletion returns an honest status and cannot be reported as complete prematurely.
- Confirm late worker results cannot restore deleted resources.

4. Auditability
- Identify security-sensitive actions requiring audit records.
- Confirm logs are structured but do not contain sensitive payloads.

5. Recovery
- Verify backup, restore, migration, and failure-recovery expectations.
- Do not accept “we have backups” without a tested restore procedure.

Required output:

A. Data lifecycle diagram.

B. Ownership table:

| Data/artifact | Owner | Storage | Access rule | Retention | Delete behavior | Derived artifacts |
|---|---|---|---|---|---|---|

C. Security boundary findings.

D. Deletion and recovery test plan.

E. Required fixes before handling real user data.
```

---

# Gate 6 — UX State and Frontend-System Alignment Review

## When to run

Run for every frontend-heavy phase, especially dashboards, chat, uploads, settings, workflows, and admin controls.

## Prompt

```text
Review this frontend phase as both a UI/UX designer and frontend systems architect.

Inputs:
- UI specification and mockups: <UI_SPEC>
- Frontend code: <FRONTEND_CODE>
- Backend API contracts: <API_CONTRACTS>
- Runtime screenshots or recordings: <UI_EVIDENCE>
- User roles and permissions: <AUTH_RULES>

Objective:
Ensure the interface accurately represents backend truth, supports complete workflows, and remains modular.

Review:

1. State coverage
For every screen and action, verify:
- Initial/loading state
- Empty state
- Success state
- Partial-progress state
- Error state
- Retry state
- Permission-denied state
- Offline/disconnected state where relevant
- Deleted/stale-resource state

2. System alignment
- Confirm labels, states, progress indicators, and controls map to real backend states.
- Flag UI actions that do not have an implemented backend contract.
- Flag backend capabilities that have no safe UI representation.

3. Workflow quality
- Can a user understand consequences before destructive actions?
- Can a user recover from failure?
- Is the next action clear?
- Are long-running operations observable and cancellable where needed?

4. Component architecture
- Identify reusable domain components versus page-specific composition.
- Prevent oversized “god components.”
- Keep state ownership close to the responsible feature.
- Avoid duplicated API calls and conflicting local/global state.

Required output:

A. UI workflow map.

B. Screen-state matrix:

| Screen/action | Backend state source | Required UI states | Missing states | User impact |
|---|---|---|---|---|

C. UX defects and misleading-state risks.

D. Component and state-management recommendations.

E. Minimal implementation plan ordered by user-flow dependency.
```

---

# Gate 7 — Pilot Release and Operational Readiness Review

## When to run

Run before internal pilot, beta, or production release.

## Prompt

```text
Perform a lean pilot-readiness review for this spec-driven application.

Inputs:
- Current architecture and deployment configuration: <DEPLOYMENT>
- Repository and tests: <CODEBASE>
- Current phase gate reports: <ALL_GATE_REPORTS>
- Target users and expected concurrency: <TARGET_LOAD>
- Operational constraints: <OPERATING_CONSTRAINTS>

Objective:
Determine whether the application is safe to pilot for the stated user count without adding speculative infrastructure.

Review:

1. Deployment
- Environment configuration
- TLS and ingress
- Database migrations
- Secret management
- Service startup order
- Health checks
- Resource limits
- Disk-growth policy

2. Observability
- Request IDs
- Structured logs
- Safe error codes
- Basic metrics
- Health dashboard or health endpoints
- Alert thresholds appropriate for a small pilot

3. Capacity and concurrency
- State clear supported concurrency.
- Identify bottlenecks.
- Require benchmark evidence for claims beyond tested capacity.
- Check provider quotas, streaming limits, worker throughput, memory, and database connections.

4. Failure handling
- API restart
- Worker restart
- provider outage
- partial migration
- failed index/job
- deletion during active work
- disk exhaustion
- invalid secret rotation

5. Release controls
- Required CI checks
- Required E2E flow
- Backup and restore proof
- Roll-forward plan
- Feature flags only where genuinely necessary

Required output:

A. Pilot Go / Conditional Go / No-Go verdict.

B. Operational scorecard.

C. Top risks ranked by likelihood and impact.

D. Minimum launch checklist.

E. Explicit “do not add yet” list to prevent overengineering.

F. Capacity statement:
- Proven current capacity
- Untested assumptions
- Exact benchmark required before expansion
```

---

# Recommended execution order

```text
Before each phase:
  Gate 1 — Specification Coherence

After implementation:
  Gate 2 — Vertical Slice Review
  Gate 3 — Functional Behaviour Review

Before starting the next phase:
  Gate 4 — Cross-Phase Contract Review

Whenever data, uploads, LLMs, credentials, or deletion are involved:
  Gate 5 — Data Lifecycle and Security Review

For frontend-heavy phases:
  Gate 6 — UX State and Frontend Alignment Review

Before pilot or release:
  Gate 7 — Operational Readiness Review
```

# Core rule

```text
A phase is not complete because its screens, routes, tables, or tests exist.

A phase is complete only when:
- its acceptance criteria are proven,
- its contracts are stable,
- its dependencies are explicit,
- its failure states are handled,
- its data ownership is clear,
- and the next phase can safely build on it.
```
