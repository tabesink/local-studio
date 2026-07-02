# F-006 / P6 Reconciled Design Gates

Status: review decision draft
Feature: F-006 - Scoped Evidence Retrieval
Date: 2026-07-02
Method: grill-with-docs

## Scope

This document answers the "Questions MUST Answer Before Coding" in `.devnotes/P5-post-impl-REVIEW/F-006-P6-readiness.md`.

This is not implementation authority by itself. Before P6 code starts, patch the active contracts/specs named below and complete the P5 runtime gate.

Canonical patch targets:

- `specs/04-features/F-005-lightrag-indexing-eligibility/tasks.md`
- `specs/04-features/F-005-lightrag-indexing-eligibility/acceptance.md`
- `specs/04-features/F-005-lightrag-indexing-eligibility/implementation-log.md`
- `specs/03-contracts/api/context-engine-v1.md`
- `specs/03-contracts/ai/grounded-answering.md`
- `specs/04-features/F-006-scoped-evidence-retrieval/spec.md`
- `specs/04-features/F-006-scoped-evidence-retrieval/plan.md`
- `specs/04-features/F-006-scoped-evidence-retrieval/test-plan.md`
- `specs/04-features/F-006-scoped-evidence-retrieval/acceptance.md`
- `specs/07-traceability/traceability-matrix.md`
- `specs/07-traceability/feature-register.md`

User decisions already locked:

- B1: F-005 T-060 has promoted pinned LightRAG 1.4.16 into `vendor/lightrag/` and repointed native proof imports; P6 remains blocked until app-boundary retrieval proves raw hits preserve `CE_BLOCK`.
- A1: Request body is strict camelCase JSON: `{ "question": string }`, min length 1, max length 2000, unknown fields rejected with `422 validation_error`.
- A2: Minimal safe Evidence DTO is `{ "excerpt": string, "sourceLabel": string }`; `excerpt` max 500 characters, `sourceLabel` max 255 characters, no public ids or scores.

## Sources Grilled

- `AGENTS.md`
- `README.md`
- `CONTEXT.md`
- `specs/00-governance/constitution.md`
- `specs/02-architecture/decisions/ADR-002-vendored-lightrag-package.md`
- `specs/03-contracts/api/context-engine-v1.md`
- `specs/03-contracts/ai/grounded-answering.md`
- `specs/03-contracts/data/context-engine-data.md`
- `specs/04-features/F-005-lightrag-indexing-eligibility/tasks.md`
- `specs/04-features/F-006-scoped-evidence-retrieval/spec.md`
- `specs/04-features/F-006-scoped-evidence-retrieval/plan.md`
- `specs/04-features/F-006-scoped-evidence-retrieval/tasks.md`
- `specs/04-features/F-006-scoped-evidence-retrieval/test-plan.md`
- `specs/04-features/F-006-scoped-evidence-retrieval/acceptance.md`
- `specs/05-quality/security-and-privacy.md`
- `specs/05-quality/performance-and-resilience.md`
- `specs/07-traceability/feature-register.md`
- `specs/07-traceability/traceability-matrix.md`
- `.devnotes/P5-post-impl-REVIEW/F-006-P6-readiness.md`
- `.devnotes/P5-post-impl-REVIEW/ID-A.md`
- `.devnotes/P5-post-impl-REVIEW/ID-A-lightrag-client-boundary.md`
- `.devnotes/P5-post-impl-REVIEW/ID-A-vendored-lightrag-promotion.md`
- `.devnotes/P5-post-impl-REVIEW/ID-A-evidence-api-contract.md`
- `.devnotes/P5-post-impl-REVIEW/ID-A-marker-mapping.md`
- `.devnotes/P3-post-impl-REVIEW/F-004-P4-reconciled-design-gates.md`
- `context_engine/services/indexing.py`
- `vendor/lightrag/README.md`
- `.references/feature-ce-api-uiux-wirering-brainstorm/F-006-scoped-evidence-retrieval.md`
- `.references/code/context-engine/server/schemas/retrieval.py`

## Product DNA Locks

- Use canonical product terms: Knowledge Domain, Source Document, Canonical Source, Source Block, Evidence, Query Eligibility, LightRAG Runtime.
- P6 creates safe Evidence DTOs from mapped retrieval results. Evidence is not a search hit, raw runtime result, parser-native chunk, or source navigation token.
- P6 owns one backend evidence endpoint, query target resolution, private retrieval, strict `CE_BLOCK` parsing, exact Source Block mapping, safe retrieval errors, and tests proving the mapping.
- P6 does not own synthesis, SSE, chat history, query persistence, source navigation, source/document selectors, browser retrieval controls, local fallback retrieval, a durable Evidence table, or a second retrieval stack.
- Backend owns authz, query eligibility, private LightRAG access, mapping, and destructive-state enforcement.
- Browser receives safe DTOs only. It never sees LightRAG hits, Source Block ids, Source Document ids, remote ids, scores, paths, runtime addresses, prompt material, provider payloads, full Source Block content, or stack traces.
- Keep `source_is_query_eligible()` as the single query eligibility predicate. Do not copy readiness conditions into P6.
- No fuzzy mapping. No nearest text match. No source order fallback. No remote chunk id fallback. No parser-native id fallback.
- Do not build P6 over `LocalLightRAGIndexClient` sidecar JSON unless API-001, DATA-001, AI-001, F-005, and F-006 are explicitly patched to approve that private runtime strategy.
- No ADR is needed for the current recommendation because ADR-002 already governs vendored LightRAG. A new ADR is needed only if the team accepts a different private runtime strategy.

## Recommended Build Shape

```text
F-005 T-060 gate
  vendor/lightrag/
    pinned LightRAG 1.4.16 promoted from read-only reference evidence
    native proof imports target vendored tree
    private runtime build path targets vendored tree

P5 app boundary
  render_lightrag_input()
    emits [CE_SOURCE ...] and one [CE_BLOCK id=<source-block-id> order=<source-order>] per Source Block
  private LightRAG client submit/readiness/delete
  source_documents index fields remain source-owned truth
  source_is_query_eligible() remains the only query predicate

P6 retrieval boundary
  POST /api/v1/domains/{domain_id}/evidence
    strict { question }
    resolve available Knowledge Domain
    find eligible Source Documents through source_is_query_eligible()
    private LightRAG client retrieve()
    parse exactly one CE_BLOCK marker per hit
    map marker -> SourceBlock -> SourceDocument -> eligible Knowledge Domain
    emit safe Evidence DTOs only
```

## A. Contract/data/API blockers

### A1. Exact request/response body for `POST /domains/{domain_id}/evidence`?

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| Strict `question` body | Matches F-006/reference brainstorm, keeps browser simple, avoids old retrieval knobs | Requires API-001 patch before route code | `{ "question": "..." }` |
| Old reference `query` body | Familiar from old CE reference retrieval schema | Conflicts with F-006 wording and current brainstorm | `{ "query": "..." }` |
| Body with retrieval controls | Flexible for debugging | Violates P6 out-of-scope and browser-thin rule | `topK`, `mode`, `reranker` |

Recommendation: strict `question` body.

User decision: accepted Option 1.

Patch API-001 with:

```text
POST /api/v1/domains/{domain_id}/evidence

Request:
  question: string
    minLength: 1
    maxLength: 2000

Strict JSON:
  reject unknown fields with 422 validation_error
```

Patch F-006 spec with: P6 has no browser retrieval knobs and no request fields beyond `question`.

### A2. Safe Evidence DTO field names, excerpt bounds, and source label shape?

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| Minimal safe DTO | Lowest leakage risk, enough for P6 evidence cards, easy snapshot | No navigation or page labels yet | `{ "excerpt": "...", "sourceLabel": "manual.pdf" }` |
| Add display order | Stable UI ordering without private ids | Unneeded if response array order is contractually stable | `displayOrder: 1` |
| Add page metadata now | Better future UX | Needs explicit field contract and may pull source navigation concepts forward | `pageStart`, `pageEnd` |

Recommendation: minimal safe DTO.

User decision: accepted Option 1.

Patch API-001 with:

```text
EvidenceItem:
  excerpt: string
    safe bounded excerpt derived from mapped Source Block content
    maxLength: 500
  sourceLabel: string
    safe Source Document display label
    maxLength: 255

Evidence response never includes:
  sourceBlockId
  sourceDocumentId
  rawScore
  rawHit
  remoteId
  path
  runtime address
  full Source Block content
```

Patch F-006 test-plan with: DTO snapshot proves only `excerpt` and `sourceLabel` appear in each Evidence item.

### A3. Error code for no eligible source: exact `409` payload?

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| Domain-scoped 409 conflict | Separates precondition failure from zero mapped hits, follows existing conflict style | Requires new P6 error row in API-001 | `domain_no_eligible_sources` |
| Short generic no-eligible code | Simple | Less clear which resource is blocked | `no_eligible_sources` |
| 200 empty response | Easy client path | Hides a domain/source readiness precondition failure | `evidence: []` |

Recommendation: use a domain-scoped `409` error envelope.

Patch API-001 with:

```json
{
  "error": {
    "code": "domain_no_eligible_sources",
    "message": "This knowledge domain has no eligible sources for retrieval.",
    "requestId": "request-id"
  }
}
```

Rule: this response is used only when no Source Document in the selected Knowledge Domain passes `source_is_query_eligible()`. Do not reuse it for all hits discarded after retrieval.

### A4. Error code/body for zero mapped Evidence: exact `no_grounded_context` shape?

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| 200 no-grounded-context result | Matches reference brainstorm and keeps zero mapped hits distinct from domain precondition failure | Client must branch on `result` | `{ "result": "no_grounded_context", "evidence": [] }` |
| 404 not found | Familiar for no result | Incorrect: domain exists and request was valid | `404` |
| 409 conflict | Same status as no eligible source | Collapses two required AC paths | `409` |

Recommendation: return `200` with `result = "no_grounded_context"` and an empty evidence array.

Patch API-001 with:

```json
{
  "result": "no_grounded_context",
  "evidence": []
}
```

Success response:

```json
{
  "result": "evidence_found",
  "evidence": [
    {
      "excerpt": "...",
      "sourceLabel": "source label"
    }
  ]
}
```

Patch F-006 acceptance with: AC-003 proves no eligible source returns contracted `409`; AC-004 proves all hits discarded returns `200 no_grounded_context`.

## B. Runtime/private integration blockers

### B1. Has F-005 T-060 promoted pinned LightRAG 1.4.16 into `vendor/lightrag/` and repointed native proof/runtime imports?

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| Use closed T-060 before P6 retrieval | Matches ADR-002 and AI-001, gives P6 a vendored native runtime source | Still needs app-boundary retrieval proof | `vendor/lightrag/` is real package |
| Treat sidecar records as approved runtime | Lets P6 start quickly | Requires major contract rewrite and weakens retrieval proof | local JSON records |
| Mock P6 retrieval while T-060 waits | Enables parser/API parallel work | AC-001 remains blocked and route risks becoming detached from real runtime | fake hit list |

Recommendation: use closed T-060 vendored runtime before P6 T-020/T-030/T-040 implementation.

User decision: accepted Option 1.

Patch F-005 tasks/acceptance/implementation-log with:

```text
T-060 complete means:
  pinned LightRAG 1.4.16 promoted into vendor/lightrag/
  native proof imports target vendor/lightrag/
  private runtime build/import paths target vendor/lightrag/
  P5 fixture gates re-run against vendored runtime
  .references/code/lightrag/ remains read-only evidence
```

Patch F-006 plan with: vendored LightRAG is the required runtime source before private retrieval client and marker mapper implementation.

### B2. What private retrieve method returns raw hit text containing preserved `CE_BLOCK` markers?

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| Native client `retrieve()` after T-060 | Aligns app submit and retrieval boundary, proves real runtime behavior | Requires vendored runtime wiring first | `retrieve(domain, question=...)` |
| Read `blockIds` from sidecar | Easy with current app code | Not a retrieval proof and bypasses raw marker mapping | sidecar `blockIds` |
| Inject fake hits in service tests only | Useful for unit tests | Cannot satisfy AC-001 by itself | in-memory `RawRetrievalHit` |

Recommendation: define a private retrieval wrapper after T-060:

```text
LightRAGClient.retrieve(domain, *, question: str) -> list[RawRetrievalHit]

RawRetrievalHit:
  text: private runtime hit text
```

The wrapper is private to backend services. API routes receive only mapped Evidence DTOs. Tests may use fake `RawRetrievalHit` values for parser/mapper unit coverage, but AC-001 must use content submitted through the app boundary and retrieved through the native private runtime boundary.

Patch F-006 spec/plan with: `retrieve()` must return enough private text for strict marker parsing and must not expose runtime hit payloads outside backend service boundaries.

### B3. How are LightRAG timeout/unavailable failures made safe?

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| Safe 502 runtime error | Matches existing API-001 runtime pattern, avoids leaking runtime detail | P6 route has a distinct error path | `domain_runtime_unavailable` |
| Return no-grounded-context | Safe-looking | Incorrect: runtime failure is not evidence absence | `no_grounded_context` |
| Surface raw runtime exception | Debuggable | Forbidden by QA-002 | raw exception text |

Recommendation: map private runtime timeout/unavailable failures to a safe `502` error envelope.

Patch API-001 with:

```json
{
  "error": {
    "code": "domain_runtime_unavailable",
    "message": "Knowledge domain runtime is unavailable.",
    "requestId": "request-id"
  }
}
```

Patch QA-002 / F-006 test-plan with: safe error tests assert no runtime details, paths, payloads, stack traces, question text, or hit text appear in responses or logs.

## C. Worker/concurrency/idempotency blockers

### C1. Can retrieval race with cancel/delete?

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| Yes, guard at mapping time | Matches P5 fences and dynamic eligibility, safe under stale runtime hits | Requires mapper tests for destructive states | discard cancelling source hit |
| Block all deletes while retrieval runs | Simpler mental model | Adds coordination not named by specs | global retrieval lock |
| Trust runtime results after retrieval starts | Fast | Can expose stale deleted/ineligible evidence | accepted stale hit |

Recommendation: retrieval may race cancel/delete; the mapper must re-check domain/source eligibility for every hit before returning Evidence.

Patch F-006 test-plan with:

```text
Mapper tests:
  source enters cancelling/cancelled/deleting state -> hit discarded
  source no longer passes source_is_query_eligible() -> hit discarded
  all hits discarded -> no_grounded_context
```

Do not add a retrieval lock, queue, workflow engine, or durable Evidence table in P6.

### C2. Is readiness current by generation/request identity?

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| Reuse P5 helper | Single source of truth, aligns DATA-001 and AI-001 | P6 must pass needed settings/controller dependencies | `source_is_query_eligible()` |
| Copy conditions into P6 | Local readability | Drift risk when P5 changes readiness semantics | `index_state == ready` |
| Trust `index_state` only | Simple | Ignores generation/request/delete fences | ready but stale |

Recommendation: P6 must call `source_is_query_eligible(db, source, domain, ...)` and must not reimplement readiness or generation/request identity checks.

Patch F-006 spec with:

```text
P6 eligibility rule:
  collect candidate Source Documents by domain
  call source_is_query_eligible() for each candidate
  retrieve/map only against eligible sources
  discard any mapped hit whose Source Document fails the same helper at mapping time
```

Patch tests with: a monkeypatched/helper-spy or state-matrix test proves P6 calls the P5 helper rather than checking only `index_state`.

## D. Delete/destructive-state blockers

### D1. Deleted or cancelling source hit appears in LightRAG results. What happens?

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| Discard the hit | Safe, matches FR-002 and AI-001 | May produce no grounded context | cancelling source marker |
| Return evidence with warning | More visible | Leaks stale deleted source content | warning DTO |
| Retry remote delete inline | Might clean up | Pulls P5 cleanup behavior into P6 | delete during query |

Recommendation: discard the hit and continue mapping remaining hits.

Patch F-006 test-plan with: known Source Block from deleted, deleting, cancelling, cancelled, or no-longer-eligible Source Document is discarded and never appears in the Evidence DTO.

No API field should reveal that a discarded hit existed.

### D2. Domain delete starts during retrieval. What happens?

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| Fail safe or discard by availability | Matches domain availability and delete fencing | Result can vary by race point | `domain_state_conflict` or no evidence |
| Continue because retrieval already started | Simpler | Can expose stale domain evidence after delete fence | stale domain hit |
| Queue behind delete operation | Strong serialization | Adds infrastructure not required by P6 | operation queue |

Recommendation: domain delete fences retrieval immediately through existing domain availability checks. If the selected Knowledge Domain is already deleting/unavailable before retrieval, return a safe conflict/runtime error per API-001. If delete starts after runtime hits are returned, mapper eligibility checks discard hits whose domain/source no longer qualifies.

Patch API-001 / F-006 spec with:

```text
Selected domain must be available before retrieve.
Mapped hit domain must still match selected available Knowledge Domain before Evidence DTO emission.
Deleting or unavailable domain produces no public runtime detail.
```

## E. Storage/private data blockers

### E1. Are Evidence excerpts allowed to include bounded Source Block text?

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| Bounded mapped excerpt | P6 can show useful Evidence while respecting QA-002 | Requires exact max length and snapshot tests | `excerpt` max 500 |
| No excerpt, label only | Lowest leakage | Not useful as Evidence card | source label only |
| Full Source Block content | Rich context | Violates minimization and FR-003 | full canonical block |

Recommendation: yes, Evidence excerpts may include bounded mapped Source Block text after API-001 names the field and limit.

Patch API-001 with:

```text
excerpt:
  derived only from the mapped eligible Source Block
  maxLength: 500
  no raw runtime hit payload
  no full Source Block content
```

Patch QA-002 tests with: excerpt length is bounded and public DTO snapshots do not include restricted fields.

### E2. Are Source Block ids ever returned?

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| Never in P6 public DTO | Matches API-001 and source-ref stop condition | Source navigation waits for later contract | no ids |
| Return Source Block id for navigation | Convenient later | Violates member evidence contract and leaks private identity | `sourceBlockId` |
| Return opaque source ref now | Future-ready | Source navigation is explicitly out of scope | `sourceRef` |

Recommendation: no Source Block ids or Source Document ids are returned in P6. Source navigation waits for a later opaque source-ref contract.

Patch API-001 with:

```text
Forbidden in P6 response:
  sourceBlockId
  sourceDocumentId
  indexRemoteDocumentId
  rawScore
  LightRAG hit id
```

Patch F-006 acceptance with: AC-006 snapshot fails if any private id field appears.

## F. Authz/roles blockers

### F1. Members may call evidence for available domains only.

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| Authenticated Members on available domains | Matches F-006 actors and P3 member domain list | Requires route/service authz tests | member queries available domain |
| Administrators only | Safer for admin debug | Violates member evidence outcome | admin-only endpoint |
| Members can query unavailable domains | More transparent state | Violates query eligibility and runtime safety | stopped domain query |

Recommendation: authenticated Members may call evidence only for selected Knowledge Domains that are available by backend rules.

Patch API-001 / F-006 spec with:

```text
POST /api/v1/domains/{domain_id}/evidence:
  authenticated Member or Administrator
  selected Knowledge Domain must exist
  selected Knowledge Domain must be available
  unavailable/deleting/stopped domain fails safely
```

Patch tests with: Member succeeds for available domain with eligible source, fails safely for unavailable/deleting/unknown domain.

### F2. Administrators may also call evidence, but index/admin routes remain admin-only.

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| Members and Administrators can call evidence | Matches actors and lets admins validate retrieval | Needs authz coverage for both roles | admin evidence query |
| Members only | Keeps route user-facing | Blocks admin validation of domain readiness | admin forbidden |
| Admin endpoint variant | More explicit | Adds duplicate API surface | `/admin/.../evidence` |

Recommendation: Administrators may call the same P6 evidence endpoint. P5 index retry/cancel and source/domain management routes remain admin-only.

Patch API-001 with:

```text
POST /api/v1/domains/{domain_id}/evidence:
  roles: Member, Administrator

No P6 public route can mutate source index, source lifecycle, domain lifecycle, runtime settings, or diagnostics.
```

Patch tests with: Member and Administrator success paths for the same available domain; Member remains forbidden from admin index/source routes.

## G. Test/evidence blockers

### G1. Fixture proves `CE_BLOCK` survives retrieval, not just indexing/storage.

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| App-boundary native retrieval fixture | Satisfies AC-001 and closes P5/P6 boundary | Requires T-060 and native client wiring | submit then retrieve |
| Existing rendered-input test only | Already partly present | Proves indexing input, not retrieval output | render contains marker |
| Fake hit fixture only | Good unit coverage | Cannot prove native runtime behavior | `RawRetrievalHit(text=...)` |

Recommendation: add an app-boundary native retrieval fixture before implementing the P6 route.

Patch F-006 test-plan with:

```text
AC-001 proof:
  prepare Source Document with Source Blocks
  submit through P5 app indexing boundary
  retrieve through private native LightRAG client
  assert retrieved hit text contains exactly one usable CE_BLOCK marker
```

F-005 acceptance/implementation-log now record T-060 proof re-run against `vendor/lightrag/`.

### G2. Mapper discards no marker, multi-marker, unknown, foreign, deleted, and ineligible hits.

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| Pure parser/mapper rejection matrix | Fast, precise, covers drift | Requires separate API integration tests too | no marker rejected |
| Only API integration tests | End-to-end confidence | Harder to isolate parser failures | POST route returns no context |
| Accept best effort marker | More results | Violates exact evidence principle | first marker wins |

Recommendation: write parser and mapper unit tests first, then API integration tests.

Patch F-006 test-plan with:

```text
Parser rejects:
  no marker
  multiple markers
  malformed marker

Mapper discards:
  unknown Source Block id
  Source Block in another Knowledge Domain
  deleted/deleting Source Document
  cancelling/cancelled index state
  source that fails source_is_query_eligible()
```

All-discarded result returns the contracted `no_grounded_context` body.

### G3. DTO snapshot excludes private ids, paths, runtime URLs, raw hits, and scores.

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| Strict API/OpenAPI snapshot | Catches leakage and contract drift | Must update when API-001 changes | snapshot has only `excerpt`, `sourceLabel` |
| Manual review only | Lightweight | Easy to miss private fields | reviewer scans JSON |
| Debug flag for admins | Useful debugging | Violates P6 DTO and leakage rules | `includeDebug` |

Recommendation: add DTO snapshot and OpenAPI snapshot coverage for success, no eligible source, no grounded context, and runtime unavailable responses.

Patch F-006 test-plan with:

```text
Snapshots must not contain:
  Source Block ids
  Source Document ids
  raw scores
  raw hit payloads
  runtime addresses
  storage paths
  provider payloads
  full Source Block content
```

Do not add `includeDebug`, retrieval controls, or admin-only raw evidence in P6.

## Contract Patch Order For Junior Dev

1. Use the F-005 T-060 vendored runtime; keep P6 blocked only until API DTO shape and app-boundary retrieval proof are patched.
2. Patch `specs/03-contracts/api/context-engine-v1.md` with P6 request body, Evidence DTO, success result, no eligible source error, no grounded context result, and runtime unavailable error.
3. Patch `specs/04-features/F-006-scoped-evidence-retrieval/spec.md`, `plan.md`, and `test-plan.md` with the field-level API shape and vendored-runtime/app-boundary retrieval gate.
4. Patch `specs/03-contracts/ai/grounded-answering.md` only if app-boundary retrieval proof language needs tightening. Do not weaken the vendored runtime requirement.
5. Update `specs/07-traceability/traceability-matrix.md` so F-005 LightRAG proof/query eligibility rows no longer conflict with the implemented feature-register status after evidence exists.
6. Add the app-boundary retrieval fixture proving `CE_BLOCK` survives native retrieval.
7. Implement strict marker parser and mapper unit tests.
8. Implement private retrieval client wrapper only through backend service boundaries.
9. Implement `POST /api/v1/domains/{domain_id}/evidence`.
10. Add API integration, DTO snapshot, and OpenAPI snapshot tests.
11. Update F-006 `acceptance.md`, `implementation-log.md`, and `specs/07-traceability/feature-register.md`.

## Red Flags In PR

| Red flag | Why it is bad | Junior-dev rule |
| --- | --- | --- |
| P6 retrieves from local sidecar JSON | It does not prove private LightRAG retrieval or raw marker preservation | Use vendored runtime and add app-boundary retrieval proof before evidence code |
| Runtime imports from `.references/code/lightrag/` after promotion | `.references/` is evidence only | Import/build from `vendor/lightrag/` |
| Pip-only `lightrag-hku` is runtime truth | ADR-002 rejects unowned runtime source | Use vendored editable package |
| P6 parses stored `blockIds` | Bypasses raw `CE_BLOCK` retrieval proof | Parse exactly one marker from retrieved hit text |
| Mapper accepts no-marker or multi-marker hits | Violates exact evidence principle | Discard ambiguous hits |
| Mapper uses fuzzy, source order, remote chunk id, or parser-native id fallback | Creates non-authoritative Evidence | Map only by `CE_BLOCK` Source Block id |
| P6 copies readiness checks | Duplicates P5 truth and drifts | Call `source_is_query_eligible()` |
| Evidence DTO includes ids, scores, hit text, runtime data, or full block content | Leaks private/restricted data | Snapshot only safe DTO fields |
| No eligible source and no grounded context share one error path | Breaks AC-003/AC-004 and client behavior | Use `409` for no eligible source, `200 no_grounded_context` for discarded hits |
| Route code lands before API-001 field-level patch | Silent contract drift | Patch contracts first |
| Source navigation is added in P6 | No opaque source-ref contract exists | Defer navigation to later phase |
| Durable Evidence table is added | F-006 explicitly avoids persistence | Return evidence-only DTOs |
| Browser sends retrieval mode/top-k/reranker | Violates thin-browser boundary | No retrieval controls in P6 |
| Traceability still marks P5 proof planned after gate closure | Evidence and register disagree | Update traceability with proof |

## Context And ADR Notes

`CONTEXT.md` does not need a change for this gate. It already defines Knowledge Domain, Source Document, Source Block, Evidence, LightRAG Runtime, and Query Eligibility in the needed product language.

No new ADR is needed for the recommended path. ADR-002 already decides that production native LightRAG runtime integration uses `vendor/lightrag/` as the editable source of truth.

A new ADR is needed only if the team rejects the vendored-runtime path and approves a materially different private runtime strategy, such as sidecar retrieval as product runtime truth.

## QA

- Readiness question IDs covered: A1, A2, A3, A4, B1, B2, B3, C1, C2, D1, D2, E1, E2, F1, F2, G1, G2, G3.
- Open decisions still blocking coding: P6 implementation remains blocked until API-001/F-006 contracts are patched and app-boundary retrieval is proven against the vendored runtime.
- Forbidden-string scan result: no secret values, token values, concrete runtime addresses, concrete host paths, stack traces, raw provider payloads, raw runtime hit payloads, or raw Source Block text are included. The document names forbidden categories only as exclusion rules.
- Output path written: `.devnotes/P5-post-impl-REVIEW/F-006-P6-reconciled-design-gates.md`.
- Style parity confirmed with exemplar sections: Scope, Sources Grilled, Product DNA Locks, Recommended Build Shape, A-G gates, Contract Patch Order, Red Flags, Context/ADR Notes.
