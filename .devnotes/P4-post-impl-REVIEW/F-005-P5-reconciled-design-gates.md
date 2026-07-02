# F-005 / P5 Reconciled Design Gates

Status: review decision draft  
Feature: F-005 - LightRAG Indexing And Query Eligibility  
Date: 2026-07-02  
Method: grill-with-docs

## Scope

This document answers the "Questions MUST Answer Before Coding" in `.devnotes/P4-post-impl-REVIEW/F-005-P5-readiness.md`.

It is not implementation authority by itself. Before coding, patch the active contracts and feature docs named below, then implement only the approved F-005 vertical slice.

Canonical patch targets before business code:

- `specs/03-contracts/data/context-engine-data.md`
- `specs/03-contracts/api/context-engine-v1.md`
- `specs/03-contracts/ai/grounded-answering.md` only if the pinned LightRAG proof changes retrieval/evidence assumptions
- `specs/04-features/F-005-lightrag-indexing-eligibility/spec.md`
- `specs/04-features/F-005-lightrag-indexing-eligibility/plan.md`
- `specs/04-features/F-005-lightrag-indexing-eligibility/test-plan.md`
- `specs/04-features/F-005-lightrag-indexing-eligibility/acceptance.md`

User decisions already made: none supplied in this review turn.

## Sources Grilled

- `AGENTS.md`
- `README.md`
- `CONTEXT.md`
- `REFERENCES.md`
- `FOLDER-STRUCTURE.md`
- `specs/00-governance/constitution.md`
- `specs/02-architecture/component-boundaries.md`
- `specs/02-architecture/data-ownership.md`
- `specs/02-architecture/integration-flows.md`
- `specs/03-contracts/api/context-engine-v1.md`
- `specs/03-contracts/data/context-engine-data.md`
- `specs/03-contracts/ai/grounded-answering.md`
- `specs/04-features/F-004-source-documents-preparation/`
- `specs/04-features/F-005-lightrag-indexing-eligibility/`
- `specs/05-quality/security-and-privacy.md`
- `specs/05-quality/observability.md`
- `specs/05-quality/test-strategy.md`
- `specs/07-traceability/feature-register.md`
- `context_engine/models.py`
- `context_engine/services/sources.py`
- `tests/test_sources.py`
- `.devnotes/P4-post-impl-REVIEW/F-005-P5-readiness.md`
- `.devnotes/P4-post-impl-REVIEW/ID-A.md`
- `.devnotes/P4-post-impl-REVIEW/ID-A-lightrag-proof-fixture.md`
- `.devnotes/P4-post-impl-REVIEW/ID-A-source-index-fields.md`
- `.devnotes/P4-post-impl-REVIEW/ID-A-render-lightrag-input.md`
- `.devnotes/P4-post-impl-REVIEW/ID-A-index-worker-and-delete-fences.md`
- `.devnotes/P4-post-impl-REVIEW/ID-A-query-eligibility.md`
- `.devnotes/P4-post-impl-REVIEW/ID-A-live-parser-sdk-followup.md`
- `.devnotes/P3-post-impl-REVIEW/F-004-P4-reconciled-design-gates.md`

## Product DNA Locks

- Use canonical product terms: Knowledge Domain, Source Document, Canonical Source, Source Block, Evidence, Citation, LightRAG Runtime, Query Eligibility.
- P4 is closed around Source Document upload, preparation, canonical Source Blocks, local hard delete, and safe admin DTOs. Do not reopen P4 just because live parser SDK calls are still a pilot-prep follow-up.
- P5 creates the indexing bridge from prepared Source Blocks to private LightRAG runtimes. It owns deterministic render, index state, submit/readiness/delete, retry/cancel fences, and one query eligibility predicate.
- P5 does not create retrieval UI, Evidence cards, chat, local vector fallback, custom graph processing, parser SDK wiring, a second indexing stack, index history tables, query logs, or a generic jobs/workflow system.
- Backend owns LightRAG access, provider/embedding credential resolution, index lifecycle, remote cleanup, query eligibility, safe errors, and destructive state transitions.
- Browser receives safe Source Document lifecycle/index DTOs only. It never sees LightRAG URLs, remote ids, provider values, rendered input, Source Block content, raw LightRAG hits, provider payloads, storage paths, stack traces, or secrets.
- Exact `CE_BLOCK` identity is the evidence spine. If the pinned fixture cannot prove marker preservation, F-005 is blocked.
- Index truth lives on `source_documents.index_*` fields. Do not add `source_index_operations`, status mirror tables, persisted rendered input, generic JSON metadata, Redis/RQ/Celery, or event-bus plumbing.

## Recommended Build Shape

```text
P4 prepared Source Document
  source_documents(state=prepared)
  source_blocks(source_order, id, canonical_markdown, page, section)
        |
        v
render_lightrag_input(source)
  CE_SOURCE header
  CE_BLOCK marker per Source Block
  deterministic rendered hash only persisted
        |
        v
source_documents.index_* fields
  index_state
  index_generation
  index_request_id
  index_content_hash
  private remote identity if fixture requires it
  safe error/timestamp/lease fields
        |
        v
Index worker and private LightRAG client
  health / submit / readiness / delete / absence proof
  generation + request-id fences
        |
        v
source_is_query_eligible(source, domain)
  server-side predicate reused by P6/P7
```

## P4 Dependency Gate

| Gate | Decision |
| --- | --- |
| F-004 implemented | Accept as P5 dependency. `acceptance.md` records passing upload, duplicate, parser normalization, retry, cancel, delete, domain purge, and no-LightRAG evidence. |
| Source Blocks are canonical truth | Accept. P5 must index `source_blocks`, not original files or parser-native payloads. |
| P4 has no index fields | Correct. F-004 implementation log explicitly keeps P5 index fields and `CE_BLOCK` rendering out of P4. |
| P4 source delete is local only | Correct for P4. P5 must extend delete behavior for indexed/accepted remote content before local row removal. |
| Live parser SDK calls are stubbed | Not P4 drift. Track as pre-P8/pilot parser integration follow-up, not as a blocker for P5 indexing over prepared Source Blocks. |

## A. Contract / Data / API Gates

### A1. Exact `source_documents.index_*` fields, defaults, constraints, and generation semantics?

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| Add typed `index_*` fields on `source_documents` | Matches DATA-001 and keeps Source Document as lifecycle owner | Requires DATA-001 patch before migration | `index_state`, `index_generation`, `index_request_id` |
| Add `source_index_operations` table | Better history | Contract drift; DATA-001 rejects index history/status mirror tables | `source_index_operations(status, payload)` |
| Store index status in generic JSON | Fast to mutate | Leaky, untestable, violates typed contract posture | `source_documents.index_metadata` |

Recommendation: accepted Option 1. Patch DATA-001 first, then migration/model code.

Patch DATA-001 with:

```text
source_documents.index_state
  enum: not_requested | queued | submitting | accepted | ready | failed | cancelling | cancelled
  default: not_requested

source_documents.index_generation
  nonnegative integer stale-work fence
  default: 0
  increment before queue, retry, cancel, and delete fence

source_documents.index_request_id
  nullable stable idempotency key for the current generation
  required once a source is queued for indexing

source_documents.index_content_hash
  nullable SHA-256 of deterministic rendered LightRAG input
  rendered input itself is never persisted

source_documents.index_remote_document_id
  nullable private remote identity only if the pinned fixture proves one is needed
  never returned by API DTOs

source_documents.index_error_code
source_documents.index_error_message
  nullable safe terminal failure details only

source_documents.index_lease_owner
source_documents.index_lease_expires_at
  nullable worker claim fields

source_documents.index_accepted_at
source_documents.index_ready_at
source_documents.index_updated_at
  nullable lifecycle timestamps
```

Patch constraints/tests with:

```text
check index_state in approved enum
check index_generation >= 0
no rendered text column
no raw LightRAG payload column
no provider payload column
no generic metadata/config JSON column
no index history/status mirror table
```

Open decision: whether `index_remote_document_id` is needed. Owner: F-005 T-001 pinned fixture. If the private client can address remote content by request/source identity, omit this column.

### A2. Exact source summary fields for index state/error/readiness?

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| Extend `SourceAdminSummary` with safe index lifecycle fields | Small API delta, enough for admin status UI | Requires OpenAPI snapshot update | `indexState`, `indexReadyAt` |
| Return a separate index operation DTO | More narrative history | Implies a durable owner DATA-001 does not approve | `{ operation: ... }` |
| Expose private index fields | Debuggable | Violates QA-002 and API-001 safe DTO rules | `remoteDocumentId`, `indexRequestId` |

Recommendation: extend `SourceAdminSummary` only with safe index lifecycle fields.

Patch API-001 `SourceAdminSummary` with:

```json
{
  "indexState": "not_requested",
  "indexErrorCode": null,
  "indexErrorMessage": null,
  "indexAcceptedAt": null,
  "indexReadyAt": null,
  "indexUpdatedAt": null
}
```

Do not return:

```text
indexGeneration
indexRequestId
indexContentHash
indexRemoteDocumentId
indexLeaseOwner
indexLeaseExpiresAt
rendered text
Source Block canonical Markdown
raw LightRAG/provider payload
runtime URL
storage path
```

Recommendation: do not expose `queryEligible` in P5 unless API-001 explicitly captures it as backend-computed. P6/P7 must call `source_is_query_eligible()` server-side.

### A3. `index/retry` and `index/cancel` success bodies and safe error codes?

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| Return updated safe source summary | Matches source-owned index state | Less operation history | `{ "source": SourceAdminSummary }` |
| Return preparation operation DTO | Existing shape | Wrong owner; P4 prep operation is not index state | `{ "operation": SourcePreparationOperation }` |
| Return `204` only | Minimal | UI cannot refresh state without extra read | empty body |

Recommendation: return updated safe source summary. Do not invent an index operation DTO unless DATA-001 changes.

Patch API-001:

```text
POST /admin/domains/{domain_id}/sources/{source_id}/index/retry
  Administrator-only
  202 { "source": SourceAdminSummary }

POST /admin/domains/{domain_id}/sources/{source_id}/index/cancel
  Administrator-only
  200 { "source": SourceAdminSummary }
```

Patch safe errors:

```text
source_not_found
source_not_prepared
source_state_conflict
source_index_in_progress
source_index_not_requested
source_index_remote_unavailable
source_index_remote_failed
source_index_delete_failed
domain_not_found
domain_state_conflict
```

All messages must be bland and safe. No upstream error body, remote id, URL, request payload, source text, stack trace, or credential value may appear.

### A4. Does source delete remain `204`, or become async when remote delete is required?

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| Keep source delete synchronous from API view with remote cleanup before `204` | Minimal API change; preserves P4 route contract | Requires bounded remote delete/absence proof | `DELETE .../sources/{source_id}` -> `204` |
| Make source delete async with a new operation owner | Resilient for long remote cleanup | Needs new API/DATA owner not approved today | `202 { operation }` |
| Delete local rows first and clean remote later | Simple | Violates DATA ownership and AC-006 | orphaned remote content |

Recommendation: keep source delete `204` only when remote cleanup succeeds before local row/file removal. If the pinned fixture proves remote delete cannot be bounded safely, stop and patch API-001/F-005 to an async delete contract before implementation.

Patch API-001/F-005 spec with:

```text
DELETE /admin/domains/{domain_id}/sources/{source_id}
  if index_state indicates accepted/ready/possibly submitted content:
    fence local source/index generation
    delete remote content through private LightRAG client
    verify remote absence
    then delete local files, Source Blocks, Source Images, and Source Document row
  if remote cleanup fails:
    keep local source fenced
    return safe failure, do not delete local row
```

Patch source delete errors:

```text
source_index_in_progress
source_index_delete_failed
source_index_remote_unavailable
```

Domain delete remains async through the domain delete worker. P5 must extend that worker path to clear indexed remote content for each source before local purge.

### A5. Deterministic render schema version and hash field names?

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| Contract a small marker grammar now | Exact evidence path, golden-testable | Must be proven against LightRAG fixture | `CE_SOURCE`, `CE_BLOCK` |
| Let renderer choose ad hoc text | Fast | Evidence identity drift | arbitrary headings |
| Submit parser-native JSON | Keeps native metadata | Reopens P4 and leaks parser shape | Docling/Reducto JSON |

Recommendation: contract a deterministic v1 marker grammar and hash. Patch F-005 spec/DATA-001 before code.

Patch F-005 spec with:

```text
[CE_SOURCE schema=1 source_id=<source-id> sha256=<original-sha256>]

[CE_BLOCK id=<source-block-id> order=<source-order>]
<canonical_markdown>
```

Patch DATA-001 with:

```text
index_content_hash = SHA-256 over normalized render_lightrag_input() output
rendered LightRAG input is not persisted as a product entity
```

Renderer rules:

```text
read source_blocks only
order by source_order
normalize line endings
include every Source Block id exactly once
reject non-prepared or zero-block sources
do not include image bytes
do not call parsers
do not read original files
do not log or return rendered text
```

Open decision: whether page/section metadata belongs in the marker. Owner: F-005 T-001 fixture. Default recommendation is no page/section in marker v1; preserve the smallest grammar that proves `CE_BLOCK`.

## B. Runtime / Private Integration Gates

### B1. Which pinned LightRAG version/fixture proves the contract?

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| Pinned runtime fixture before schema/service code | Meets F-005 T-001 and stop condition | Requires runtime evidence first | fixture records safe pass/fail |
| Fake-only implementation first | Fast unit tests | Violates F-005 FR-001 | fake LightRAG client |
| Copy old reference runtime assumptions | Familiar | Reference is evidence only and uses old identities | old SourceChunk behavior |

Recommendation: T-001 is a hard gate. No migration or service code before pinned proof passes.

Patch F-005 test-plan/acceptance with a safe fixture record proving:

```text
health
typed provider/embedding injection
idempotent submit
native readiness observation
remote delete and absence verification
CE_BLOCK marker preservation
delete-after-ready or late-ready fence
```

Open decision: exact pinned LightRAG version/runtime fixture command. Owner: F-005 T-001. Record the version and safe outcome in `acceptance.md` and `implementation-log.md`.

### B2. Which private client method submits text and returns request/readiness identity?

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| One narrow private client interface | Testable and boundary-clean | Needs fixture-backed adapter | `submit_document(...)` |
| Call LightRAG directly from worker logic | Less abstraction | Harder tests; leaks runtime details into state machine | raw HTTP calls inline |
| Browser/client-side runtime calls | None | Forbidden by AGENTS and architecture | browser fetch to LightRAG |

Recommendation: one private LightRAG client behind backend/worker code only.

Patch F-005 plan with a narrow interface:

```text
health(domain_runtime) -> safe health result
submit_document(domain_runtime, request_id, rendered_text, content_hash) -> accepted result
readiness(domain_runtime, request_id or private remote id) -> pending | ready | failed
delete_document(domain_runtime, request_id or private remote id) -> deleted/absent
assert_absent(domain_runtime, request_id or private remote id) -> true | false
```

The accepted result may include a private remote identity if the fixture requires it. That identity is stored only in `source_documents.index_remote_document_id` if approved and is never returned by API DTOs.

### B3. How is typed embedding/provider credential injection proven without exposing values?

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| Resolve credentials server-side and assert behavior through fixture | Proves real integration without leaks | Needs safe fixture design | configured embedding used |
| Commit provider/runtime payloads for debugging | Easy diagnosis | Violates QA-002 | raw provider response |
| Let browser pass provider settings | Flexible | Forbidden trust boundary breach | client model controls |

Recommendation: prove injection by behavior and safe metadata only. Do not record secret values, runtime URLs, provider payloads, or raw error text.

Patch F-005 test-plan:

```text
fixture proves a private runtime receives configured provider/embedding settings
fixture evidence records only safe booleans, provider kind/model metadata if already public-safe, request id, and outcome
no credential value, ciphertext, endpoint URL, runtime URL, provider payload, source text, stack trace, or raw LightRAG payload in fixtures/logs
```

### B4. What is the remote delete primitive and how is absence verified?

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| Delete by current request/remote identity and verify absence | Required for AC-006/AC-007 | Needs fixture support | delete then readback absent |
| Mark local cancelled only | Fast | Leaves remote content queryable | local fence only |
| Delete all domain content | Strong cleanup | Too broad, risks unrelated source loss | domain-wide wipe |

Recommendation: delete only the current source/generation remote content, then verify absence before local deletion or retry.

Patch F-005 spec/test-plan:

```text
remote delete target = current index_request_id or approved private remote id
absence proof required before:
  source local hard delete
  domain source purge
  retry after accepted/ready/uncertain timeout
late ready after absence/fence must not mark ready
```

Open decision: exact LightRAG delete/readback primitive. Owner: T-001 pinned fixture.

## C. Worker / Concurrency / Idempotency Gates

### C1. Claim fields live on `source_documents` or a narrow helper table?

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| Claim fields on `source_documents.index_*` | Matches DATA-001; no extra owner | Less history | `index_lease_owner` |
| Narrow helper table | Cleaner leases | Contract does not approve it | `source_index_claims` |
| Generic job table | Reusable | Explicitly rejected | `jobs` |

Recommendation: claim fields live on `source_documents`.

Patch DATA-001:

```text
index_lease_owner nullable string
index_lease_expires_at nullable timestamp
claimable states: queued, submitting with expired lease, accepted with due readiness check if implemented through same lease path
```

Patch tests for claim/lease/stale worker behavior.

### C2. How is idempotent request id generated from source id/generation/hash?

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| Deterministic request id from source, generation, content hash | Idempotent and reproducible | Requires render hash before queue/submit | `ce-index:<source>:<gen>:<hash>` |
| Random UUID per submit attempt | Simple | Retries can duplicate remote content | new UUID on retry |
| Source id only | Stable | Different generations collide | `source_id` |

Recommendation: deterministic id over source id, index generation, and rendered content hash.

Patch F-005 spec:

```text
index_request_id = deterministic idempotency key for one source/index_generation/index_content_hash
same request id retried after timeout must not duplicate remote content
new generation may only be queued after old remote content is absent or proved never accepted
```

Exact string format can be private, but tests must prove stable generation and hash behavior.

### C3. Which states are active for retry/cancel conflict checks?

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| Explicit state transition table | Testable, contract-owned | Needs contract patch | queued -> submitting -> accepted |
| Infer from timestamps | Fewer fields | Ambiguous under failure | `ready_at is null` |
| Let API retry any non-ready state | Easy | Duplicates/fence bugs | retry while submitting |

Recommendation: patch F-005 spec with explicit transitions and active states.

Patch state flow:

```text
not_requested -> queued -> submitting -> accepted -> ready
accepted/ready/failed/cancelled -> queued on retry after remote absence proof
queued/submitting/accepted/ready -> cancelling -> cancelled on cancel/delete fence
submitting/accepted -> failed on safe native failure
```

Active/conflict states:

```text
active index work: queued | submitting | accepted | cancelling
retry allowed: failed | cancelled | ready | accepted only after remote absence proof
cancel allowed: queued | submitting | accepted | ready
query-ready only: ready and eligible by helper
```

Open decision: whether retry from `ready` is allowed in P5. Recommendation: allow admin retry only after remote absence proof and new generation queue, because it is the explicit repair path without auto-repair.

### C4. How does timeout reconcile without duplicate remote content?

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| Reconcile by request id/readiness/absence before new generation | Meets AC-007 | More tests | timeout then status/readback |
| Blindly submit again with new id | Simple | Duplicates remote content | duplicate index |
| Treat timeout as failed forever | Safe but unrecoverable | Bad admin UX | manual DB fix |

Recommendation: timeout is an uncertain state; reconcile before retry.

Patch worker/test-plan:

```text
on submit/readiness timeout:
  keep current generation fenced
  use same index_request_id for retry of same generation
  check native readiness or remote absence
  only create new generation after old remote content is absent
```

Tests must simulate timeout, repeated submit, and retry without duplicate remote content.

## D. Delete / Destructive-State Gates

### D1. Source delete sequence when index state is accepted/ready?

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| Fence, remote delete, verify absence, then local delete | Meets data ownership and AC-006 | Requires robust remote failure handling | accepted -> cancelling -> delete remote -> local purge |
| Local delete first | Easy | Orphaned restricted indexed content | row gone, remote remains |
| Block delete for indexed sources | Safe but unusable | Admin cannot remove content | 409 forever |

Recommendation: fence first, remote delete second, local purge last.

Patch service rules:

```text
source delete:
  increment index_generation or set delete fence before remote call
  mark index_state = cancelling when remote content may exist
  commit fence outside long remote transaction
  call private LightRAG delete
  verify absence
  delete files/blocks/images/source row
  if remote delete fails, keep source fenced and return safe error
```

No local row removal before remote absence for accepted/ready content.

### D2. Domain delete sequence across many indexed sources?

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| Extend domain delete worker to clean indexed sources before local purge | Matches existing async domain delete | Needs resumable per-source loop | delete domain -> remote cleanup per source |
| Domain-wide runtime wipe only | Fast | May skip per-source absence proof | drop runtime |
| Cascade local rows first | Easy | Violates retention/delete rule | orphaned remote data |

Recommendation: domain delete worker owns multi-source remote cleanup, then calls local P4 purge.

Patch F-005 plan/test-plan:

```text
domain delete worker:
  domain already fenced by P3 deleting state/control_generation
  for each source with possible remote index content:
    fence source index generation
    delete current remote content
    verify absence
  only after all indexed sources are absent:
    purge local source files/blocks/images/rows
    continue domain runtime cleanup and hard delete
```

Failure behavior: domain remains fenced/deleting, safe operation failure is recorded, and rerun resumes cleanup.

### D3. Late ready after cancel/delete writes zero rows?

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| Generation/request/source-state guard on every worker result | Simple and exact | Must be applied consistently | worker no-op on mismatch |
| Trust worker lease only | Fewer checks | Lease expiry races | late ready commits |
| Delete remote and hope no callback arrives | Hope is not a fence | Stale update risk | ready after delete |

Recommendation: every submit/readiness/failure result must match generation, request id, and source state.

Patch worker formula:

```text
worker_result_is_current =
  source.index_generation == worker_generation
  AND source.index_request_id == worker_request_id
  AND source.state == "prepared"
  AND source.index_state not in ("cancelling", "cancelled")

if false:
  write zero ready/readiness rows
```

Tests must prove late ready after cancel, source delete, and domain delete does not revive eligibility.

## E. Storage / Private Data Gates

### E1. Rendered LightRAG input is never persisted; where is only the hash stored?

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| Store only hash on `source_documents` | Meets DATA-001 and reproducibility | Re-render needed for retry | `index_content_hash` |
| Persist rendered input | Easier debugging | Forbidden by DATA-001 and QA-002 | `rendered_lightrag_input` |
| Store rendered input in logs/fixtures | No schema change | Worse leak | stdout/snapshot text |

Recommendation: store only `index_content_hash`; render on demand from Source Blocks.

Patch DATA-001/test-plan:

```text
index_content_hash is allowed
rendered LightRAG input text is forbidden in DB columns, API DTOs, logs, traces, snapshots, and fixtures
```

### E2. How are Source Block contents kept out of logs/snapshots?

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| Safe DTO/log scans plus targeted renderer tests | Matches QA-002 and existing P4 posture | Needs disciplined fixtures | forbidden string scan |
| Allow admin debug payloads | Convenient | Violates restricted data class | canonicalMarkdown in DTO |
| Rely on code review only | Cheap | Weak evidence | manual inspection |

Recommendation: expand P4 safe-scan pattern for P5 index fields and renderer.

Patch F-005 test-plan:

```text
safe DTO scan covers source list/detail, index retry/cancel, OpenAPI snapshot, and safe failure payloads
safe log scan covers LightRAG submit/readiness/delete failures
fixtures use synthetic non-sensitive Source Blocks
no canonicalMarkdown/sourceText/rendered input/raw LightRAG/provider payload/path/url/secret/stack trace
```

## F. Authz / Roles Gates

### F1. Index retry/cancel Administrator-only?

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| Administrator-only P5 index actions | Matches API-001 phase catalog | Members cannot self-repair source index | admin route |
| Member retry/cancel | None for pilot | Breaks lifecycle ownership | member route |
| Browser direct retry against LightRAG | None | Forbidden | runtime URL |

Recommendation: `index/retry` and `index/cancel` are Administrator-only routes under `/admin/domains/...`.

Patch API-001 and tests:

```text
Members receive 403
Unauthenticated requests receive 401
Unknown source/domain returns safe 404 only after authz path is satisfied
```

### F2. Member query path calls eligibility later, never index routes?

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| P6/P7 call one backend predicate | Single truth | Requires helper exported cleanly | `source_is_query_eligible()` |
| Frontend computes queryability | Fast UI | Duplicates protected logic | `indexState === "ready"` |
| Retrieval trusts raw LightRAG hit | Simple | Can cite deleted/ineligible source | unmapped hit |

Recommendation: implement one server-side helper in P5 and require later retrieval/chat phases to call it.

Patch F-005 spec:

```text
source_is_query_eligible(source, domain) =
  domain is available by P3 rules
  AND source.state == "prepared"
  AND source.index_state == "ready"
  AND source index generation is current
  AND no delete/cancel fence is active
```

Patch F-006/F-007 later only when those phases start: retrieval must discard raw hits from ineligible sources even if LightRAG returns them.

## G. Test / Evidence Gates

### G1. T-001 pinned fixture proves health, secret injection, submit, readiness, delete, `CE_BLOCK` preservation?

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| Required blocking fixture | Satisfies FR-001 and AGENTS stop condition | Slower start | pinned proof |
| Mark as manual TODO | Flexible | Not delivery evidence | pending |
| Fake proof only | Fast | Cannot prove LightRAG contract | fake client |

Recommendation: hard stop if fixture fails. Update `acceptance.md` as blocked with owner and missing proof.

Required fixture evidence:

```text
health pass
typed injection pass
idempotent submit pass
native readiness pass
delete/absence pass
CE_BLOCK preservation pass
late ready after delete/cancel ignored pass
```

### G2. Golden render tests prove deterministic text/hash?

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| Exact golden tests for render text and hash | Catches marker drift | Must update intentionally on grammar change | fixture string |
| Hash-only test | Less brittle | Can miss marker/content mistakes | hash exists |
| No renderer test | Fast | Evidence identity risk | none |

Recommendation: exact golden render tests before worker code.

Tests:

```text
same Source Blocks produce same rendered text/hash
block order/content changes hash
every Source Block id appears exactly once
empty/non-prepared source is rejected safely
render output is not logged, persisted, or returned
```

### G3. OpenAPI snapshot captures P5 retry/cancel and source summary fields?

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| Update OpenAPI snapshot with API-001 patch | Contract evidence | Needs intentional snapshot churn | `tests/snapshots/...` |
| Route code without snapshot | Faster | Silent contract drift | untracked DTO |
| Reuse P4 source route shapes unchanged | Minimal | Missing index state fields | no index fields |

Recommendation: update API-001 first, route schema second, OpenAPI snapshot third.

Snapshot must show:

```text
SourceAdminSummary index fields
POST .../index/retry
POST .../index/cancel
safe error envelope
no private index/request/remote/rendered fields
```

### G4. Safe DTO/log scan covers index fields and LightRAG failures?

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| Automated forbidden-field/value scan | Reuses P4 pattern | Needs fixture discipline | forbidden key list |
| Manual review only | Cheap | Weak proof | reviewer note |
| Store raw failures for debugging | Convenient | Violates QA-002 | upstream body |

Recommendation: automated scan is required.

Extend forbidden list for P5:

```text
secret
credential
ciphertext
path
storage
url
runtime
remoteDocumentId
indexRequestId
indexContentHash
indexGeneration
indexLeaseOwner
parserPayload
providerPayload
lightragPayload
canonicalMarkdown
rawText
sourceText
rendered
prompt
stack
traceback
```

## Contract Patch Order For Junior Dev

1. Patch DATA-001 with index fields, defaults, constraints, and forbidden omissions.
2. Patch API-001 with safe source index DTO fields, retry/cancel responses, delete semantics, and safe errors.
3. Patch F-005 spec with render grammar, client proof gate, state transitions, delete rules, and query eligibility helper.
4. Patch F-005 plan/test-plan with fixture, migration, renderer, worker, API, safe DTO/log, and delete evidence.
5. Build T-001 pinned LightRAG proof fixture and record safe evidence.
6. Only after T-001 passes, add migration/model fields.
7. Implement `render_lightrag_input()` with golden tests.
8. Extend P4 publish to queue index atomically in the same DB unit.
9. Implement private LightRAG client and worker state machine with generation/request fences.
10. Implement admin retry/cancel routes and safe DTO snapshots.
11. Implement `source_is_query_eligible()` and table-driven tests.
12. Run F-005 test plan and update acceptance, implementation log, OpenAPI snapshot, and feature register.

## Red Flags In PR

- Migration or service code lands before T-001 pinned LightRAG proof.
- DATA-001/API-001 are not patched before code adds `index_*` fields or routes.
- New index history/status mirror table, generic job table, Redis/RQ/Celery, event bus, workflow engine, or parser profile framework appears.
- Rendered LightRAG input, Source Block canonical Markdown, raw source text, raw LightRAG/provider payload, runtime URL, storage path, remote id, request id, stack trace, or secret appears in DTOs/logs/fixtures.
- P5 reparses original files or calls Docling/Reducto instead of indexing P4 Source Blocks.
- Retry creates a new generation before old remote content is absent or proved never accepted.
- Source/domain delete removes local rows before remote indexed content is absent.
- Worker marks ready without matching source state, index generation, and index request id.
- Frontend or P6 copies query eligibility conditions instead of using backend truth.
- Live parser SDK work is mixed into P5 indexing.

## Acceptance Gates

| AC | Reconciled gate |
| --- | --- |
| AC-001 | P4 publish inserts Source Blocks and queues index in one DB unit with current generation/request/hash. |
| AC-002 | Native LightRAG ready transitions only current generation/request to `ready`. |
| AC-003 | Native fail records only safe `index_error_code`/`index_error_message`. |
| AC-004 | Retry uses new generation only after remote absence or proof old submit never accepted. |
| AC-005 | Cancel/delete fences late ready and stale worker writes. |
| AC-006 | Source/domain delete clears remote content before local row/file removal. |
| AC-007 | Timeout/retry fixture and worker tests prove no duplicate remote content. |

## Open Decisions / Stops

- Open decision: exact pinned LightRAG version, fixture command, and private delete/readiness primitives. Owner: F-005 T-001.
- Open decision: whether `index_remote_document_id` is necessary. Owner: T-001 fixture result.
- Open decision: whether page/section metadata is included in marker grammar. Recommendation is no for v1 unless fixture proves it is needed and safe.
- Stop condition: if `CE_BLOCK` preservation, idempotent submit, readiness, deletion, or typed secret injection proof fails, mark F-005 blocked in `acceptance.md` and do not implement business code.
- Stop condition: if remote delete cannot be bounded for synchronous source delete, patch API-001/F-005 to an async source delete contract before code.
- Stop condition: if any API shape needed by frontend is not captured in OpenAPI/runtime fixtures, do not wire frontend behavior.
