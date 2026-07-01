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