# F-011 / P11 - Knowledge Curation Workspace

Scope note: P10 is implemented as the first runnable-stack gate only. Runtime Node, Logs, Usage, storage summaries, Docker environment UI/API, workers, and Playwright remain carry-forward gates unless a later approved feature/contract changes that scope.

## Status

Not ready for coding.

Reason: `specs/04-features/F-011-knowledge-curation-workspace/` exists but contains no approved `spec.md`, `plan.md`, `tasks.md`, `test-plan.md`, `acceptance.md`, or `ux.md`. API-001, DATA-001, EVT-001, and AI-001 do not define P11 Wiki Page, Wiki Revision, Wiki Contribution, or Smart Composer behavior.

This is a contract gap, not an implementation detail.

## Goal

Prepare the governed workspace for wiki curation:

```text
selected chat/evidence context
  -> Smart Composer draft/revision workspace
  -> backend-authorized Wiki Contribution
  -> review/publish workflow
  -> immutable Wiki Revision
  -> current Wiki Page users can browse/cite when allowed
```

## Not In P11 Until Approved

| Area | Decision |
| --- | --- |
| Runtime Node, Logs, Usage, storage summaries, Docker environments | P10 carry-forward gates. Do not fold them into P11 unless API-001/DATA-001 and F-010/F-011 explicitly say so. |
| Worker containers | Deferred from P10 first gate. Add only from current repo entrypoints, tests, and acceptance need. Do not copy old worker/status services. |
| Playwright for P10 runnable stack | Still F-009 AC-007 unless P11 ships real UI that needs visual/e2e proof. |
| Obsidian plugin runtime | Reference only. Do not port Obsidian host APIs, vault persistence, provider calls, OAuth, MCP, local RAG, or filesystem writes. |
| Browser-owned wiki writes | Forbidden. Durable writes are backend-authorized Wiki Contributions only. |
| Source navigation by private ids | Blocked until an opaque source-ref contract exists. |
| Raw evidence/source/prompt/provider payload display | Forbidden by AGENTS, GOV-001, QA-002, QA-003, API-001, EVT-001, and AI-001. |

## Big Picture

```text
Browser / Next.js
  -> P9 shell and typed Context Engine API client
  -> P11 Smart Composer UI
  -> FastAPI P11 routes
      -> authz + safe DTO projection
      -> wiki contribution service
      -> Postgres wiki tables
      -> existing Evidence/Citation/Turn reads
      -> optional AI drafting through backend-owned synthesis profile
  -> no browser access to providers, LightRAG, storage, Docker, runtime, or private ids
```

## Core Product Terms

| Term | P11 meaning | Not this |
| --- | --- | --- |
| Wiki Page | Curated published knowledge page derived from authorized evidence and review workflow. | Source Document, raw note, unreviewed draft. |
| Wiki Revision | Immutable published version of a Wiki Page with review metadata and evidence traceability. | Editable row overwritten in place. |
| Wiki Contribution | Private or submitted draft change that may become a Wiki Revision after review/publish. | Inline chat edit, browser-only draft as product truth. |
| Smart Composer | Governed right-panel workspace for drafting, revising, reviewing, and publishing Wiki Contributions from selected context. | Main chat editor, generic notes pane, browser-owned wiki writer. |

## Dependency Gate From P10

| P10 proof | Status | Effect on P11 |
| --- | --- | --- |
| Local stack startup | Implemented | P11 can eventually use the runnable stack for API/frontend smoke. |
| Safe admin auth/proxy smoke | Implemented | P11 authz tests can build on the same session pattern. |
| Safety scan posture | Implemented | P11 must extend or add safety checks for wiki/composer DTOs and evidence. |
| Runtime Node/Logs/Usage/storage/Docker UI/API | Contract-blocked | Not P11 scope unless contract-patched. |
| Workers | Deferred | P11 must decide separately if publish/review needs async work. |
| Playwright | Deferred to F-009/P11 UI | Required only if P11 implements real UI screens. |

## Dependency Gate From P9

| P9 surface | Current state | Effect on P11 |
| --- | --- | --- |
| Shell, login, rail, safe API client | Foundation implemented | P11 may use these as UI foundation. |
| Chat SSE/context panel | Still gated | Smart Composer cannot assume final evidence panel behavior until P9/P7 fixtures are captured. |
| Document preview/source-ref/graph data | Still gated | Do not build wiki source navigation from guessed fields. |
| Visual acceptance | Pending | P11 UI needs its own screenshot matrix if shipped. |

## Questions MUST Answer Before Coding

### A. Contract/data/API blockers

| # | Question | Owner |
| --- | --- | --- |
| A1 | What are the approved P11 acceptance criteria? | `specs/04-features/F-011-knowledge-curation-workspace/spec.md` |
| A2 | What routes create, read, submit, review, publish, and reject Wiki Contributions? | API-001 |
| A3 | What tables own Wiki Pages, Wiki Revisions, and Wiki Contributions? | DATA-001 |
| A4 | What safe evidence/citation references may a contribution store? | DATA-001/API-001 |
| A5 | Does Smart Composer generate/rewrite text through AI? If yes, define prompt, model ownership, safety, and failure behavior. | AI-001 |
| A6 | Is any P11 operation streamed? If yes, define event names, ordering, replay, and terminal states. | EVT-001 |

### B. Runtime/controller/private integration blockers

| # | Question | Owner |
| --- | --- | --- |
| B1 | Does any browser-visible P11 field expose provider, prompt, storage, LightRAG, runtime, Docker, or private source/block ids? If yes, stop. | ARCH-002/QA-002 |
| B2 | Does Smart Composer use existing P7 Evidence and Turn state only through backend services? | F-011/API-001 |
| B3 | Does P11 need a new retrieval path? Expected answer: no unless AI-001 changes. | AI-001/ARCH-002 |

### C. Worker/concurrency/idempotency blockers

| # | Question | Owner |
| --- | --- | --- |
| C1 | Is contribution submit/review/publish synchronous or worker-backed? | F-011 plan |
| C2 | What prevents two reviewers from publishing conflicting revisions? | DATA-001 |
| C3 | Are publish requests idempotent by contribution id or explicit client request id? | API-001/DATA-001 |
| C4 | Are drafts autosaved? If yes, who owns conflict resolution and retention? | F-011/API-001 |

### D. Delete/redaction/destructive-state blockers

| # | Question | Owner |
| --- | --- | --- |
| D1 | What happens to a Wiki Contribution when its cited Source Document or Knowledge Domain is deleted? | DATA-001 |
| D2 | What happens to a published Wiki Revision when supporting Evidence is redacted? | DATA-001/API-001 |
| D3 | Are Wiki Pages deletable, archived, or superseded only by revisions? | F-011/DATA-001 |

### E. Storage/private data blockers

| # | Question | Owner |
| --- | --- | --- |
| E1 | Is wiki content stored as safe curated text, and what size limits apply? | DATA-001/API-001 |
| E2 | Are source excerpts stored in wiki tables? Expected answer should be no unless a safe excerpt contract is approved. | DATA-001 |
| E3 | Are exports or attachments supported? If yes, contract storage and access first. | F-011/API-001 |

### F. Authz/roles blockers

| # | Question | Owner |
| --- | --- | --- |
| F1 | Can Members create private contributions, or only Administrators? | F-011/API-001 |
| F2 | Who can submit, review, publish, reject, archive, or delete? | API-001/DATA-001 |
| F3 | Can a Member read another user's draft? Expected answer must be explicit. | API-001 |

### G. Test/evidence blockers

| # | Question | Owner |
| --- | --- | --- |
| G1 | What migration tests prove wiki tables from a fresh database? | F-011 test-plan |
| G2 | What API tests prove 401/403, safe DTOs, conflict handling, and publish immutability? | F-011 test-plan |
| G3 | What safety scan proves no prompts, raw source text, raw answers, private ids, provider payloads, paths, stack traces, runtime targets, or credentials leak? | QA-002/QA-003 |
| G4 | What frontend screenshots prove Local Studio visual parity for the composer/review workflow? | DESIGN/F-011 ux |

## Acceptance As Definition Of Done

Blocked until F-011 acceptance exists.

Minimum expected acceptance shape:

| Area | Evidence needed |
| --- | --- |
| Contracts | API-001/DATA-001 patches for page/revision/contribution routes and tables. |
| Migrations | Fresh upgrade test and rollback/compensation notes if destructive. |
| Backend | Route/service/repository tests for create, update, submit, review, publish, reject, conflict, redaction/delete handling. |
| AI, if used | Mocked provider tests, prompt ownership, safe failure behavior, no browser prompt/model controls. |
| Frontend, if shipped | Typed wrappers only, no raw fetch, authz states, visual screenshots, no browser private-service imports. |
| Safety | Automated or explicit scan over DTOs, examples, screenshots, logs, traces, fixtures, and acceptance evidence. |

## Junior Dev Reading Order

1. `AGENTS.md`
2. `README.md`
3. `specs/00-governance/constitution.md`
4. `CONTEXT.md`
5. `DESIGN.md`
6. `specs/04-features/F-010-shared-node-operations/acceptance.md`
7. `specs/04-features/F-010-shared-node-operations/implementation-log.md`
8. `specs/04-features/F-009-frontend-delivery/spec.md`
9. `specs/04-features/F-009-frontend-delivery/acceptance.md`
10. `specs/03-contracts/api/context-engine-v1.md`
11. `specs/03-contracts/data/context-engine-data.md`
12. `specs/03-contracts/events/context-engine-sse-v1.md`
13. `specs/03-contracts/ai/grounded-answering.md`
14. `.references/obsidian-smart-composer_impl_docs/README.md`
15. `.references/obsidian-smart-composer_impl_docs/COPYING_AND_ATTRIBUTION.md`

## Practical Start Checklist

- Create the F-011 feature package before coding.
- Patch API-001 and DATA-001 for one vertical slice: contribution draft -> submit -> publish.
- Patch AI-001 only if Smart Composer uses generated or rewritten text.
- Patch EVT-001 only if a P11 operation streams.
- Decide roles before writing UI states.
- Decide redaction/delete behavior before publishing immutable revisions.
- Add migrations and backend tests before frontend wiring.
- Use Smart Composer reference only for UX ideas and small presentational patterns.
- Keep P10 open-ended node/log/usage/storage/Docker work out of P11.

## Reference Comparison

| Question | Smart Composer reference answer | Context Engine delta |
| --- | --- | --- |
| Host/runtime | Obsidian plugin host. | Next.js browser over FastAPI. |
| Persistence | Local plugin data and local DB/JSON patterns. | Postgres through DATA-001 only. |
| Retrieval | Local RAG/vector behavior. | Context Engine Evidence through backend services. |
| Provider calls | Direct client/plugin provider integration. | Backend-owned provider runtime and synthesis profile. |
| Apply/diff | Direct file-oriented apply behavior exists in reference. | Defer or rebuild only through approved change/review contracts. |
| Evidence/citation UI | Useful layout reference. | Must use safe Evidence/Citation DTOs, not private ids or raw source text. |

## Verdict For Junior Dev

Do not start P11 implementation yet. Write the F-011 feature package and contract patches first, then implement the smallest backend-owned Wiki Contribution workflow with tests.

One-line summary: P11 is blocked on specs and contracts; Smart Composer is a UI/workflow reference, not a portable runtime.
