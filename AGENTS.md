# Agent Guidance

Entry point for coding agents working in this clean project repo. Read this first, then use the documentation map below as it becomes populated.

This repository is at bootstrap stage. Most documentation files are intentionally empty placeholders until the project shape, stack, product vocabulary, and implementation plan are defined. Do not assume referenced docs already contain answers; if a file is empty, create the missing context as part of the task that needs it.

## Documentation Map

| If you need... | Read or create |
| --- | --- |
| Product/domain vocabulary, terms to use, and terms to avoid | [CONTEXT.md](./CONTEXT.md) |
| Project overview, setup, and run commands | [README.md](./README.md) |
| Documentation index and doc ownership | [docs/README.md](./docs/README.md) |
| System shape, routes, state ownership, providers, and module boundaries | [docs/architecture.md](./docs/architecture.md) |
| Implemented scope, backlog, and definition of done | [docs/implementation.md](./docs/implementation.md) |
| Testing expectations, commands, fixtures, and TDD workflow | [docs/test-strategy.md](./docs/test-strategy.md) |
| Deployment, environment variables, migrations, backups, and local run modes | [docs/deployment.md](./docs/deployment.md) |
| Data ownership, persistence rules, and migration guardrails | [docs/DATABASE_OWNERSHIP.md](./docs/DATABASE_OWNERSHIP.md) |
| Durable architecture decisions | [docs/adr/](./docs/adr/) |
| Lightweight decision history | [docs/decisions/log.md](./docs/decisions/log.md) |
| Local task tracker | [docs/master-build-plan.md](./docs/master-build-plan.md) |
| Per-task completion notes | [docs/tasks/](./docs/tasks/) |
| Temporary ideas and structured PRD workspaces | [docs/brainstorm/](./docs/brainstorm/) |
| Agent workflow conventions | [docs/agents/](./docs/agents/) |
| UI design system and frontend UX direction | [DESIGN.md](./DESIGN.md), [docs/design/context_engine_agent_ui_guidelines.md](./docs/design/context_engine_agent_ui_guidelines.md), the read-only source package [`.references/local-studio-visual-parity-package.md`](./.references/local-studio-visual-parity-package.md), and the read-only Local Studio codebase [`.references/code/local-studio/`](./.references/code/local-studio/) |

**Suggested read order for unfamiliar work:** `CONTEXT.md` -> `docs/README.md` -> relevant ADR(s) -> `docs/architecture.md` -> `docs/implementation.md` -> `docs/test-strategy.md` -> code.

## Documentation Structure

```text
README.md                         # Project overview, setup, and run commands
CONTEXT.md                        # Product/domain vocabulary and naming guidance
DESIGN.md                         # Canonical UI design source of truth when a frontend exists
.references/
  local-studio-visual-parity-package.md # Read-only visual parity extraction/source package
  code/local-studio/              # Read-only Local Studio reference codebase for tokens/primitives/patterns
docs/
  README.md                       # Documentation index and ownership
  design/
    context_engine_agent_ui_guidelines.md # Agent-facing UI implementation guide copied from Local Studio visual parity
  master-build-plan.md            # Task tracker: phases, IDs, status, deps
  architecture.md                 # System shape, routes, state ownership, boundaries
  implementation.md               # Implemented scope, backlog, definition of done
  test-strategy.md                # Test approach, commands, fixtures, gaps
  deployment.md                   # Env vars, migrations, backups, local run modes
  DATABASE_OWNERSHIP.md           # Data ownership and migration guardrails
  decisions/
    log.md                        # Append-only durable decision log
  tasks/                          # Per-task implementation notes
  agents/                         # Issue tracker, labels, and domain-doc guidance
  adr/                            # Architecture decision records
  brainstorm/{phase_task}/        # Optional structured PRD workspace
    prd.md                        # Feature/slice PRD
    HANDOFF.md                    # Shared mission, issue order, current baton
    IMPLEMENTATION_MAP.md         # Shared technical truth for multi-issue PRDs
    issues/{TASK-ID}.md           # Sequential implementation issue batons
```

## Project Rules

- Treat this repo as a clean project unless code or docs prove otherwise. Do not carry assumptions from reference packages, old projects, or copied prompts into runtime decisions.
- Apply instructions in this order: platform and user instructions; repository-local instructions closest to the code; approved ADRs, public contracts, and security requirements; current task acceptance criteria; then this general guidance. When sources conflict, follow the higher-priority or more specific source, state the conflict, and choose the safest compliant interpretation.
- Live docs live in `docs/` and root guidance files (`README.md`, `CONTEXT.md`, `DESIGN.md`, and this file). Update them when you define or change public contracts, product behavior, task workflow, setup commands, architecture, or durable decisions.
- `.references/` and any `docs/brainstorm/**/reference*/` folders are archival source material, not runtime implementation. Do not edit reference material unless the user explicitly asks for historical/reference changes.
- `.references/code/local-studio/` is the read-only Local Studio reference codebase. Use it for visual parity evidence, exact token names, component APIs, shell geometry, and implementation examples before inventing new UI patterns.
- When searching for runtime code, exclude archival reference paths by default, for example: `rg "pattern" . -g '!.references/**' -g '!docs/brainstorm/**/reference*/**'`. Include `.references/code/local-studio/` only when intentionally checking Local Studio parity.
- Use vocabulary from `CONTEXT.md` in issues, tests, docs, and user-facing copy once that file has terms. If vocabulary is missing, add it before relying on new names broadly.
- Keep changes surgical and verifiable. Do not refactor unrelated code, remove unrelated dead code, or expand the project structure beyond the current task.
- Never print, log, commit, or expose credentials, bearer tokens, API keys, database dumps, private URLs, or `.env*` contents. Redact secrets in diagnostics and handoffs.
- Never bypass git hooks, test gates, lint gates, type checks, or security checks with flags such as `--no-verify` unless the user explicitly directs a temporary emergency bypass and the risk is documented.

## Working Agreement

- Prefer momentum over permission. Pick the most sensible default, proceed, and surface assumptions in the handoff summary.
- Ask a question only when a reasonable default would be destructive, credential-dependent, legally/security-sensitive, or likely to invalidate the user's goal.
- Leave the workspace better than you found it, but only inside the task boundary. Do not tidy unrelated files, churn formatting, or rewrite working code just because it could be prettier.
- Respect local work. If a file contains changes you did not make, preserve them and adapt around them; never revert user work without an explicit request.
- Commit hygiene, when commits are requested, is one logical change at a time. Stage only files changed for that logical change and use task IDs or conventional message style when the repo adopts them.

## Operating Principles

- Keep it simple. Prefer the simplest design that fully solves the current problem, with obvious control flow, explicit ownership, and standard platform features.
- Build only what is needed now. Do not add extension points, optional dependencies, compatibility modes, flags, queues, services, or configuration without a concrete current requirement.
- Keep important knowledge in one canonical place. Rules, calculations, schemas, ownership decisions, and business concepts should not drift across duplicate implementations or documents.
- Make state and ownership explicit. Every mutable resource should have a clear owner, lifecycle, source of truth, and validation boundary.
- Preserve working behavior. Do not silently change adjacent behavior while completing a focused task.
- Use evidence, not assumptions. Read code, tests, runtime configuration, and documentation before asserting how the system works.

## Modular Architecture

Build runtime code with layered architecture and a composable middleware/application pipeline for cross-cutting concerns. The goal is simple code that a junior developer can trace from request to authorization, service, domain rule, repository or provider, and response without guessing where behavior lives.

Treat the runtime entrypoint as the composition root. The bootstrap file, such as `src/main.py`, should be the one obvious place where the app is assembled: load typed configuration, create shared infrastructure clients, configure structured logging/tracing/metrics, register middleware in explicit order, attach authentication and authorization, wire routes/controllers, install centralized error handling, and start the application. Do not scatter runtime setup, provider setup, dependency wiring, auth initialization, or logging configuration across unrelated modules.

Use these boundaries unless the repo documents a better local pattern:

- API/presentation layer: route definitions, request parsing, response formatting, and status codes. Keep business rules out of controllers.
- Application/service layer: orchestration of use cases such as creating documents, running retrieval, or submitting chat turns.
- Domain layer: business rules, entities, policies, and validations independent of HTTP, databases, vendors, and framework types.
- Infrastructure layer: database repositories, queues, file storage, provider SDKs, telemetry SDKs, and external APIs.
- Cross-cutting layer: authentication, authorization, logging, metrics, tracing, request IDs, rate limits, validation, and centralized error handling. Apply these through middleware, decorators, interceptors, or explicit service boundaries instead of duplicating them in every route or service.

Dependencies should point inward: `API -> Application -> Domain`, while infrastructure adapts external systems to application or domain contracts. Domain code must not import FastAPI, ORM models, cloud SDKs, LLM SDKs, or web-framework types. Do not let external vendor models leak through the codebase.

Prefer explicit dependencies over service locators, direct function calls over event systems, typed request/response models over unstructured dictionaries, standard framework patterns over custom frameworks, and synchronous execution unless background work is required. Avoid deep inheritance, generic base services or repositories with unclear value, hidden global state, circular dependencies, dumping-ground `manager`/`helper`/`utils` modules, and multiple competing patterns for the same concern.

## Code Quality Principles

These standards apply to new and edited code. Existing code may be exploratory; do not broaden the task just to normalize it, but anything you touch should meet the bar.

- Keep functions small, named, and single-purpose. If a function validates, transforms, persists, and formats in one place, split those responsibilities and compose them.
- Use intention-revealing names. Avoid vague names such as `data`, `helper`, `manager`, `util`, `process`, or `handle` when a precise name is possible.
- Prefer early returns and straightforward control flow over nested branches. Make the happy path easy to scan.
- Keep code DRY at the behavior level. Extract shared logic when two call sites must stay semantically identical, but avoid premature abstraction for incidental similarity.
- Reuse established contracts, service helpers, fixtures, API clients, component primitives, and test utilities before introducing new ones.
- Use the fewest lines that clearly express the intent. Avoid ceremony, speculative extension points, and clever compression that hides meaning.
- Comments should be rare and useful. Do not add commented-out code, stale TODOs, or prose that repeats the code; prefer clearer names, smaller functions, stronger types, or task notes.
- Preserve type discipline. Avoid `any`, unchecked casts, blanket ignores, and unvalidated dictionaries at boundaries; fix or model the type instead.
- Use typed request/response models and canonical domain models for important business concepts. Keep provider-specific and persistence-specific models behind adapter boundaries.
- Validate external input at the boundary with the project's chosen schema tools. If no tool is chosen yet, document the choice before spreading validation patterns.
- Keep async, lifecycle, caching, and streaming behavior inside established project patterns. Do not invent a parallel runtime, state store, scheduler, or event protocol without documenting the reason.
- Return or raise errors that preserve useful context without leaking secrets or raw internals. Business/domain code should raise meaningful typed exceptions or return explicit results; API code translates them into the common response pattern. Avoid broad exception handling that masks failure.
- Keep logs structured and actionable. Include useful operational context such as request ID, route, user ID when appropriate, resource ID, duration, status, and error category. Never log credentials, tokens, personal data, private URLs, raw authentication headers, or sensitive payloads.
- Remove only dead code created by your change. Do not perform broad dead-code sweeps unless the task is explicitly about cleanup.

## Frontend UI/UX Workflow

Use this section only when a frontend exists or the task creates one.

- Treat `DESIGN.md` as the source of truth before modifying visual surfaces, component styling, layout, dialogs, navigation, empty/loading/error states, or UI copy.
- Read `docs/design/context_engine_agent_ui_guidelines.md` with `DESIGN.md` for Local Studio visual-parity implementation rules; keep both aligned when UI rules or reusable patterns change.
- Treat `.references/local-studio-visual-parity-package.md` as the read-only extraction/source package behind the live design docs; do not edit it unless the user explicitly asks for reference-material changes.
- Use `.references/code/local-studio/` as the read-only implementation reference for Local Studio tokens, primitives, shell geometry, and screen patterns; prefer concrete source evidence from that checkout before creating a new Context Engine UI pattern.
- Build from existing primitives, design tokens, hooks, data-fetching utilities, and page shells before hand-rolling controls, dialogs, tables, tabs, forms, toasts, or layout scaffolding.
- Keep route files thin. Put feature behavior in feature-owned modules and keep shared client utilities genuinely shared across more than one feature. UI handlers should call application APIs or feature services rather than embedding business rules.
- Do not hard-code colors, spacing scales, shadows, border radii, or status colors when the design system or tokens provide an equivalent.
- Make interactive states complete: loading, empty, error, disabled, optimistic/pending, permission-denied, and narrow viewport states should be considered for every user-facing workflow.
- UI copy should use `CONTEXT.md` vocabulary, be concise, and avoid explaining implementation details to users.
- Frontend state should not leak sensitive data into long-lived browser caches, global stores, logs, URLs, or analytics payloads.
- When UI work changes reusable primitives, shared layout, or guardrails, update `DESIGN.md`, `docs/design/context_engine_agent_ui_guidelines.md`, and relevant task or PRD docs in the same change.

## Task Hygiene

- Match the workflow to the task size. A small local fix needs only local tracing, focused validation, and docs when behavior or setup changed. Non-trivial behavior, API, persistence, auth, UI workflow, security, infrastructure, or cross-layer work should be tracked with a task ID and task note. Multi-slice work belongs in a structured PRD workspace with issue batons.
- Do not turn a small bug fix into a PRD. Do not treat a risky cross-layer change as a small task merely to skip planning.
- When starting a tracked task, mark it `IN PROGRESS` in `docs/master-build-plan.md`.
- When done, mark it `DONE (YYYY-MM-DD)` and summarize the result in `docs/master-build-plan.md`.
- Use stable task IDs once the project adopts an ID scheme. Until then, use clear short names in task notes and branch/PR context.
- For non-trivial tracked work, create or update `docs/tasks/{task-id}.md`. Non-trivial means behavior, API, schema, UI workflow, auth, persistence, security, infrastructure, or cross-layer changes.
- Completion notes in `docs/tasks/{task-id}.md` should include behavior added or changed, interfaces changed, tests added and what they prove, follow-on assumptions, and decisions intentionally left unchanged.
- Update `CHANGELOG.md` for user-facing behavior changes when that file exists in the working tree.
- Add an entry to `docs/decisions/log.md` for architectural or durable design decisions. Create or update an ADR only when the decision is hard to reverse, surprising without context, and the result of a real trade-off.
- For multi-issue PRD work, keep `docs/brainstorm/{phase_task}/IMPLEMENTATION_MAP.md` and `HANDOFF.md` current before handing off or marking work done.

## PRD And Issue Workflow

Use this workflow when structured planning, issue decomposition, or sequential agent work is involved.

1. PRDs under `docs/brainstorm/{phase_task}/prd.md` describe product intent: user problem, outcomes, constraints, and non-goals. Do not bury implementation contracts only in the PRD.
2. `docs/brainstorm/{phase_task}/IMPLEMENTATION_MAP.md` is mandatory for every multi-issue PRD. It is the shared technical source of truth for end-to-end flow, state model, canonical contracts, invariants, key modules, ownership boundaries, cross-layer interfaces, persistence semantics, non-goals, and forbidden shortcuts.
3. Issue batons live under `docs/brainstorm/{phase_task}/issues/{TASK-ID}.md`. Local issue files are the durable baton for coding agents even if an external tracker is added later.
4. Each issue baton should include a context packet, previous slice provides, this slice changes, this slice must not rework, next slice can assume, and acceptance criteria covering behavior, tests, docs, and handoff/map updates.
5. Prefer thin vertical slices over broad horizontal ones. Each issue should be independently testable and should strengthen the shared contract.
6. Handoffs stay small. `HANDOFF.md` should summarize mission, issue order, current baton, recovery/operator notes, and links without duplicating the PRD or implementation map.

## Local Environment

- Prefer project-local toolchains over global tools. If the repo adopts Python, use `.venv/`; if it adopts Node, use the package manager and scripts committed to the repo.
- Document setup, run, lint, test, and build commands in `README.md` and `docs/test-strategy.md` as soon as they exist.
- Do not install dependencies, start long-running services, or mutate machine-level configuration unless the task requires it and the user has approved any needed escalation.

## Testing And TDD

- Use TDD for behavior changes, bug fixes, lifecycle hardening, and security hardening unless the user explicitly asks otherwise.
- Prefer behavior tests through public interfaces: HTTP routes, public services, adapters, UI surfaces, CLIs, or package APIs.
- Follow a tracer-bullet loop for behavior changes: one failing test, minimal implementation, then repeat.
- Do not write bulk horizontal test suites ahead of implementation.
- Refactor only while green. Keep each refactor small and rerun focused tests after it.
- Tests should survive internal refactors. If renaming or moving private code breaks a test while behavior is unchanged, the test is too coupled.
- Mock at system boundaries only when needed. Avoid mocking internal collaborators just to make implementation details observable.
- Focus test coverage on critical paths, ownership/security rules, persistence semantics, and risky cross-layer behavior.
- Use `docs/test-strategy.md` for repo-specific commands, fixtures, and expectations once populated.

Per-cycle checklist:

1. The test names one observable behavior.
2. The test uses the public interface that owns that behavior.
3. The test fails for the expected reason before implementation.
4. The implementation is minimal and avoids speculative future behavior.
5. The focused test passes before adding the next behavior.
6. Any cleanup/refactor happens after green.

## Code Change Workflow

- Trace before editing. For unfamiliar flows, identify callers, owners, side effects, persistence boundaries, and tests before changing behavior.
- Frame the change before broad edits: observable behavior, constraints, invariants, non-goals, affected contracts, and validation plan.
- State assumptions and ask when requirements are ambiguous enough to risk the goal. Otherwise, choose the lowest-risk interpretation compatible with existing contracts and record the assumption in the handoff when useful.
- Prefer the smallest code that solves the verified behavior.
- Implement in vertical slices when possible: one observable behavior, focused test or validation, minimal implementation, then cleanup while green.
- Match existing style and module boundaries once they exist.
- Remove only dead code your change creates.
- Review your own diff as a skeptical maintainer before handoff. Look for accidental scope growth, duplicated state, broken boundaries, missed permissions, migration gaps, and untested failure paths.
- Before finishing, run focused tests/lints relevant to the changed files. If code symbols or execution flows changed and a code-intelligence tool is configured, run its change-detection check.

## Validation Before Handoff

- Run the narrowest meaningful checks first: targeted tests, lint/type checks for touched packages, and any migration or contract checks relevant to the change.
- Escalate to broader gates when the blast radius is wide, shared contracts changed, security/auth changed, persistence changed, or release confidence depends on integration behavior.
- If a documented validation command cannot run in the current environment, report the exact command, failure reason, and residual risk in the handoff.
- Do not claim a command passed unless it was actually run.
- Do not mark tracked work done until behavior, tests, docs, and task notes satisfy the acceptance criteria for that task.
- For frontend visual changes, inspect the result in relevant viewport states before handoff whenever a browser/dev server is available.

## Review Standard

When reviewing code, be rigorous, constructive, and evidence-based. Lead with findings ordered by impact.

Review in this order:

1. Correctness: Does it satisfy the actual requirement across normal, invalid, and failure paths?
2. Safety: Are authorization, validation, secrets, data integrity, and failure handling sound?
3. Architecture: Does it preserve boundaries, ownership, and stable contracts?
4. Maintainability: Is it simple, cohesive, readable, and free of unnecessary duplication or abstraction?
5. Tests: Do tests prove behavior and cover meaningful risk?
6. Operations: Are logging, configuration, migrations, rollout, and recovery adequate?
7. Performance: Are there obvious unnecessary queries, expensive loops, leaks, N+1 patterns, or unbounded work?

Classify findings as `Blocker`, `High`, `Medium`, or `Low`. Every finding should state the affected behavior, risk, evidence, and a proportionate recommendation. Do not invent issues merely to appear thorough.

## Database And Multi-User Changes

Use this section only when the project has persistence, user accounts, or shared resources.

- Create or update `docs/DATABASE_OWNERSHIP.md` before schema, persistence, or table-ownership changes.
- For write paths such as upload, delete, metadata update, custom fields, and document mutation, enforce owner/admin checks once roles exist.
- Verify cache invalidation for write paths.
- Prefer migrations over ad hoc schema edits once the project has a migration tool.

## Security Considerations

### Auth, Secrets, And Sessions

Authentication establishes who the caller is. Authorization establishes what the caller can do.

- Never hardcode secrets, API keys, passwords, or bearer tokens.
- JWT/session secrets must be strong random values, not defaults or placeholders.
- Production cookies should be `Secure`, `HttpOnly`, and `SameSite=Lax` or `SameSite=Strict`.
- Token expiry should be <=24h unless refresh tokens exist.
- Hash passwords with a modern password hashing algorithm and never log, return, or store plaintext passwords.
- Authenticate requests once at the API boundary and resolve the current user through one dependency or middleware mechanism.
- Enforce role and permission checks close to protected endpoints and use cases. Keep role names and permission policies centralized.
- Do not trust user IDs, roles, or permissions sent directly by the browser.
- Return consistent unauthenticated and forbidden responses.

### Input And API Boundaries

- Validate inputs at boundaries with the project's chosen schema/model tools.
- Use parameterized database queries; never interpolate user input into SQL.
- Never interpolate untrusted values into shell commands, filesystem paths, templates, redirects, or provider requests without explicit validation and escaping.
- Sanitize uploaded filenames and reject unexpected MIME types.
- Apply auth guards to new routes once auth exists.
- Restrict CORS in production; never use `[*]` or wildcard origins outside local dev.
- Return generic client errors and log details server-side only.

### Data Protection

- Every write, update, and delete verifies owner or admin privileges when user ownership exists.
- Prefer soft-delete before hard-delete for user data unless the product explicitly requires purge semantics.
- Database files, exports, and backups should use restrictive permissions.
- Export/import workflows should be admin-only when they can expose raw internals.
- Never expose stack traces or raw database errors to clients.

### Frontend Security

- Prefer HttpOnly cookies for session tokens; do not store sensitive tokens in local/session storage unless the architecture explicitly accepts that risk.
- Avoid `dangerouslySetInnerHTML`; sanitize user content if HTML rendering is unavoidable.
- Validate redirect URLs.
- Do not leak sensitive data into client caches, global stores, logs, URLs, or analytics payloads.

### Observability And Error Handling

Observability is a cross-cutting concern, not business logic. Configure structured logs, request/correlation IDs, centralized exception handling, timing/latency measurement, metrics, and tracing at the runtime entrypoint or established infrastructure boundary. Each request should be traceable through safe logs using a request ID.

Use centralized error handling. Domain and application code should not decide HTTP status codes directly, return raw stack traces, silently continue after broad exceptions, or hide failures behind generic logs without context.

### Infrastructure And Deployment

- Run containers as non-root where practical and drop unnecessary capabilities.
- Pin dependencies and audit for CVEs once dependency management exists.
- Use structured audit logging without secrets or password-bearing request bodies.
- Set CPU/memory limits for deployed services when applicable.
- Disable debug or verbose error pages in production.

## Checklist For New Endpoints

1. Auth guard applied when auth exists.
2. Input validated via the project boundary model/schema.
3. Ownership or role check on the target resource when users/roles exist.
4. Rate limit category assigned where the app supports rate limits.
5. Error responses do not leak internals.
6. Cache invalidation covered if the endpoint mutates data.

## APIs And Integrations

- Treat existing API behavior as a contract unless change is explicitly required.
- Validate request and response shapes at boundaries.
- Use consistent status codes, error shapes, pagination, idempotency, and timeout behavior according to repository conventions.
- Make integration failures diagnosable without exposing provider secrets or raw internal errors.
- Design retries deliberately, only for safe, bounded, transient failures.

## Versioning And Releases

- Use SemVer (`MAJOR.MINOR.PATCH`) once the project publishes releases, and never reuse a published version.
- Keep the version in one canonical location; derive all UI/API/build references from it.
- Document every user-facing change in `CHANGELOG.md` under `[Unreleased]` when that file exists.
- Use Keep a Changelog sections: `Added`, `Changed`, `Deprecated`, `Removed`, `Fixed`, `Security`.
- Tag releases as annotated `vX.Y.Z` tags pointing to the tested commit.
- Run full automated tests and manual smoke tests before tagging.
- Verify migration compatibility for schema changes.
- Use build metadata (`+build.N`) for internal or CI builds when needed.

## Before Finishing

- Confirm the implementation satisfies the requested behavior and acceptance criteria.
- Confirm the route/controller is thin, responsibilities belong in the correct layer, and business rules are testable without starting the web server.
- Confirm auth and authorization are enforced where required, errors use the common response pattern, important operations emit safe useful logs, and configuration comes from the canonical settings source.
- Confirm the change is minimal, coherent, and does not introduce speculative capability, unnecessary abstractions, dependencies, configuration options, or background systems.
- Confirm names, boundaries, state ownership, inputs, permissions, errors, and sensitive data handling remain clear.
- Run relevant tests and quality checks, or explicitly report skipped checks and why.
- Update public contracts, migrations, configuration, documentation, task notes, and decision records where necessary.
- Ensure no unrelated files were changed, reverted, or reformatted.
- Keep the final summary honest, concise, and actionable.

## Optional Code Intelligence

If GitNexus or another code-intelligence index is configured for this repo, use it for unfamiliar flows, caller analysis, impact checks, symbol-aware refactors, and change detection. If no index exists yet, rely on local search and tests; do not treat missing code-intelligence metadata as a blocker for ordinary bootstrap work.

<!-- gitnexus:start -->
# GitNexus — Code Intelligence

This project is indexed by GitNexus as **localTest_local_studio** (96 symbols, 102 relationships, 0 execution flows). Use the GitNexus MCP tools to understand code, assess impact, and navigate safely.

> Index stale? Run `node .gitnexus/run.cjs analyze` from the project root — it auto-selects an available runner. No `.gitnexus/run.cjs` yet? `npx gitnexus analyze` (npm 11 crash → `npm i -g gitnexus`; #1939).

## Always Do

- **MUST run impact analysis before editing any symbol.** Before modifying a function, class, or method, run `impact({target: "symbolName", direction: "upstream"})` and report the blast radius (direct callers, affected processes, risk level) to the user.
- **MUST run `detect_changes()` before committing** to verify your changes only affect expected symbols and execution flows. For regression review, compare against the default branch: `detect_changes({scope: "compare", base_ref: "main"})`.
- **MUST warn the user** if impact analysis returns HIGH or CRITICAL risk before proceeding with edits.
- When exploring unfamiliar code, use `query({search_query: "concept"})` to find execution flows instead of grepping. It returns process-grouped results ranked by relevance.
- When you need full context on a specific symbol — callers, callees, which execution flows it participates in — use `context({name: "symbolName"})`.
- For security review, `explain({target: "fileOrSymbol"})` lists taint findings (source→sink flows; needs `analyze --pdg`).

## Never Do

- NEVER edit a function, class, or method without first running `impact` on it.
- NEVER ignore HIGH or CRITICAL risk warnings from impact analysis.
- NEVER rename symbols with find-and-replace — use `rename` which understands the call graph.
- NEVER commit changes without running `detect_changes()` to check affected scope.

## Resources

| Resource | Use for |
|----------|---------|
| `gitnexus://repo/localTest_local_studio/context` | Codebase overview, check index freshness |
| `gitnexus://repo/localTest_local_studio/clusters` | All functional areas |
| `gitnexus://repo/localTest_local_studio/processes` | All execution flows |
| `gitnexus://repo/localTest_local_studio/process/{name}` | Step-by-step execution trace |

## CLI

| Task | Read this skill file |
|------|---------------------|
| Understand architecture / "How does X work?" | `.cursor/skills/gitnexus-exploring/SKILL.md` |
| Blast radius / "What breaks if I change X?" | `.cursor/skills/gitnexus-impact-analysis/SKILL.md` |
| Trace bugs / "Why is X failing?" | `.cursor/skills/gitnexus-debugging/SKILL.md` |
| Rename / extract / split / refactor | `.cursor/skills/gitnexus-refactoring/SKILL.md` |
| Tools, resources, schema reference | `.cursor/skills/gitnexus-guide/SKILL.md` |
| Index, status, clean, wiki CLI commands | `.cursor/skills/gitnexus-cli/SKILL.md` |

<!-- gitnexus:end -->
