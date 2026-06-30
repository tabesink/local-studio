# Test Strategy

Context Engine uses test-driven development for behavior changes, bug fixes, lifecycle hardening, and security hardening.

## Current State

There is no runtime code or test runner in this repository yet. No automated tests can be run until P1 scaffolds the backend package.

When P1 creates the backend, document exact commands here and in the root `README.md`.

## Expected Commands

These commands are planned, not currently available:

```text
cd backend
python -m pytest
python -m ruff check .
python -m mypy app
alembic upgrade head
```

Once Docker Compose exists:

```text
docker compose up --build
docker compose run --rm backend-tests
docker compose run --rm migrate alembic upgrade head
```

Adjust these commands to the actual committed toolchain. Do not leave placeholder commands once implementation starts.

## Test Pyramid

Unit tests:

- pure policies and validators;
- password hashing/token hashing helpers;
- error mapping;
- provider policy;
- runtime naming;
- state transition guards;
- source prepared-output validation;
- marker parsing and citation filtering.

Integration tests:

- API routes through HTTP clients;
- auth/session and role gates;
- Postgres repositories and migrations;
- source worker claim/lease behavior;
- deletion recovery;
- OpenAPI snapshots;
- response-shape security checks.

Contract and compose tests:

- Alembic fresh-upgrade on blank Postgres;
- pinned LightRAG submit/readiness/delete fixture;
- pinned LightRAG retrieval-provenance fixture;
- private domain-controller lifecycle smoke;
- end-to-end pilot flow before production.

Browser tests, when a frontend exists:

- login and authenticated navigation;
- available-domain selector;
- evidence query and source panel;
- streaming chat happy path;
- narrow viewport and disabled/loading/error states.

## Phase Gates

P1:

- admin seed create-if-absent;
- login returns no token;
- HttpOnly cookie set;
- revoked/expired/disabled sessions rejected;
- member blocked from admin route;
- every response has request ID;
- OpenAPI snapshot passes.

P2:

- credentials encrypted before storage;
- safe config DTOs never expose raw credential or ciphertext;
- resolver decrypts privately;
- no provider network call occurs;
- member/anon access blocked.

P3:

- API has no Docker socket;
- controller token required;
- domain create/start/stop/delete state transitions work;
- delete returns `202` and worker completes cleanup;
- same domain ID can be reused only after hard delete with a new runtime instance;
- member list shows only available domains.

P4:

- upload preserves immutable original;
- parser kind freezes at upload;
- prepared output validates all-or-none;
- worker stale publish is fenced;
- retry and cancel behave correctly;
- source delete removes DB rows and files.

P5:

- LightRAG contract fixture proves idempotent submit, readiness, delete, stable identity, and secret injection;
- prepared source queues index in the same transaction;
- native ready is required for query eligibility;
- cancel/delete prevents late ready from restoring eligibility.

P6:

- exact `CE_BLOCK` marker maps to one local block;
- missing, multiple, unknown, foreign, deleted, or ineligible markers are discarded;
- source refs and asset refs are opaque, expiring, and re-check current eligibility;
- no source/block/asset IDs or storage paths appear in browser DTOs.

P7:

- one running turn per conversation;
- idempotent client request IDs;
- direct chat performs zero retrieval and stores no citations;
- RAG reuses P6 mapped evidence only;
- citations outside the current evidence allowlist are removed;
- source/domain delete redacts grounded turns only;
- direct/general turns survive domain delete.

P8:

- trace export is metadata-only;
- masking happens before export;
- exporter failure never blocks request flow;
- never-log list is enforced in tests.

## Fixtures

Use fixtures that model public behavior:

- admin and member users;
- configured provider rows without real secrets;
- embedding and synthesis profiles;
- domain with a fake or contract runtime;
- prepared source with deterministic block IDs;
- LightRAG contract container for pinned upstream behavior;
- provider stream doubles at the adapter boundary.

Do not mock internal collaborators just to observe private implementation details. Mock only external boundaries such as provider calls, Docker gateway, filesystem faults, and LightRAG contract failures when a real container is not the test target.

## Security Assertions

Every phase should include response and log-shape tests that prove:

- no raw session tokens;
- no password hashes in API output;
- no provider secrets, ciphertext, or encryption key;
- no raw parser payload, raw LightRAG payload, prompt, answer, full question, source text, source refs, paths, runtime URLs, Docker errors, SQL, or stack traces;
- no browser-controlled model/provider/retrieval/source fields accepted where forbidden.

