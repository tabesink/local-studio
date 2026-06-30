# PRD - Context Engine Backend

Status: planned

## Problem

Trusted users need a local, admin-curated knowledge system where they can upload domain documents, query one active domain, inspect exact source evidence, and receive grounded answers without exposing provider secrets, private runtime details, raw source storage, or unmanaged LightRAG access to the browser.

## Users

- Admin: configures provider credentials, creates domains, uploads sources, manages lifecycle, and handles delete/retry operations.
- Member: signs in, sees available domains, retrieves mapped evidence, opens focused source views, and chats with grounded or general answers.
- Operator/developer: deploys locally, runs migrations, validates tests, backs up/restores data, and troubleshoots with safe logs.

## Outcomes

- A user can authenticate with a secure opaque cookie session.
- Admins can configure trusted providers and model profiles without leaking credentials.
- Admins can create isolated knowledge domains with private LightRAG runtimes.
- Admins can upload documents that become canonical prepared source blocks.
- Prepared sources index into LightRAG and become query-eligible only after native ready state.
- Members can query one active domain and receive only evidence mapped to exact authorized source blocks.
- Members can open focused source views through opaque refs that re-check current eligibility.
- Chat routes each turn to direct general answer or grounded RAG, with citations validated against current-turn mapped evidence.
- Hard delete removes owned artifacts and redacts derived grounded chat content.
- Observability exports metadata only and never blocks request flow.

## Non-Goals

- public or anonymous access;
- browser access to LightRAG, Docker, provider APIs, runtime ports, or storage paths;
- cross-domain retrieval;
- local vector/BM25/graph fallback;
- generic workflow engine;
- multi-agent framework;
- provider failover;
- web search;
- Kubernetes or multi-region deployment;
- raw document browser or original download;
- storing raw prompts, questions, answers, source text, or raw LightRAG payloads in observability systems.

## Scope By Phase

P0 records the shared contract and resolves cross-phase conflicts.

P1 builds the trusted API foundation: auth, sessions, roles, errors, request IDs, and migration scaffolding.

P2 builds encrypted provider/model/parser configuration and private runtime resolution.

P3 builds domains and private runtime lifecycle through a narrow Docker-privileged controller.

P4 builds source upload, parser-neutral preparation, flat canonical blocks/images, and worker lifecycle.

P5 builds private LightRAG indexing, readiness, cancel/delete fences, and query eligibility.

P6 builds evidence retrieval, exact source-block mapping, opaque refs, and focused source navigation.

P7 builds routed streaming chat, grounded citations, conversation history, and redaction.

P8 builds metadata-only observability.

## Success Criteria

- All P1-P8 acceptance criteria pass.
- A fresh environment can run migrations, seed admin, and serve the API.
- Pilot E2E succeeds: login -> configure provider/profile -> create domain -> upload source -> prepare -> index -> retrieve evidence -> chat -> source/domain delete -> restore-proof.
- Response and log shape tests prove no secrets/private internals leak.
- Hard deletes leave no owned source/runtime artifacts and cannot later restore eligibility through delayed async work.

## Risks

- LightRAG upstream contract may not preserve exact block identity. P5/P6 are blocked until fixtures prove it.
- Runtime provider-secret injection can leak if implemented through generic env maps or persisted files. P5 requires a narrow typed bootstrap contract.
- Deletion can become unsafe if rows are deleted before remote/runtime artifacts are confirmed absent.
- Chat can become ungrounded if it consumes raw LightRAG hits or prior assistant answers instead of current mapped evidence.

