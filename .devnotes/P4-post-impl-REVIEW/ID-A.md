# ID-A - LightRAG indexing contract and eligibility ownership (P5 blockers)

Working doc for F-005 T-001 through T-050. Canonical patch targets: `specs/03-contracts/data/context-engine-data.md`, `specs/03-contracts/api/context-engine-v1.md`, `specs/04-features/F-005-lightrag-indexing-eligibility/spec.md`, and the F-005 pinned fixture/evidence files.

Sources grilled: AGENTS.md, README.md, constitution, CONTEXT.md, F-004 acceptance/implementation/tests, F-005 spec/plan/tasks/test-plan, API-001, DATA-001, AI-001, ARCH-001 through ARCH-004, QA-001, QA-002, QA-004, TRACE-001/002, delivery runbooks, `context_engine/services/sources.py`, `context_engine/models.py`, `tests/test_sources.py`, `.devnotes/P4-parser-output-to-lightrag-data-shape-guide.md`, and relevant `.references/code/lightrag` / old Context Engine ingestion evidence.

**Related docs**

| Doc | Scope |
| --- | --- |
| [ID-A-lightrag-proof-fixture.md](./ID-A-lightrag-proof-fixture.md) | T-001 pinned runtime proof and stop condition |
| [ID-A-source-index-fields.md](./ID-A-source-index-fields.md) | DATA-001/API-001 P5 index field and DTO patch |
| [ID-A-render-lightrag-input.md](./ID-A-render-lightrag-input.md) | deterministic `CE_SOURCE`/`CE_BLOCK` render from Source Blocks |
| [ID-A-index-worker-and-delete-fences.md](./ID-A-index-worker-and-delete-fences.md) | submit/readiness/retry/cancel/delete state machine |
| [ID-A-query-eligibility.md](./ID-A-query-eligibility.md) | one `source_is_query_eligible()` helper |
| [ID-A-live-parser-sdk-followup.md](./ID-A-live-parser-sdk-followup.md) | live Docling/Reducto SDK gap: not P4 drift, pilot-prep follow-up |

---

## Lean Winner

```text
P5 contract patch first
+ pinned LightRAG fixture proof
+ index state fields on source_documents
+ deterministic render_lightrag_input()
+ one private LightRAG client
+ source-scoped generation/request-id fences
+ remote delete before local row removal
+ source_is_query_eligible() as the only query gate
```

This is the lowest-entropy path that satisfies F-005 without reopening P4 parser scope or inventing a second indexing system.

---

## Rejected Alternatives

| Alternative | Reject because |
| --- | --- |
| Start with a fake LightRAG client only | F-005 T-001 requires pinned runtime proof before business code. |
| Add `source_index_operations` history table | DATA-001 says index state fields live on `source_documents`; no index history/status mirror table. |
| Persist rendered LightRAG input | DATA-001 forbids persisted rendered input unless an approved spec changes it. |
| Reparse originals during indexing | P4 Source Blocks are canonical product truth. |
| Browser polls LightRAG directly | AGENTS and ARCH-001 forbid browser private-runtime access. |
| Copy old `SourceChunk` metadata shape | Greenfield Source Block identity is the evidence spine. |
| Make live parser SDK wiring part of P5 | P5 indexes whatever P4 prepared; parser SDK integration is pilot-prep follow-up. |
| Add Redis/RQ/Celery for index work | Constitution and F-005 out-of-scope reject new queue infrastructure. |

---

## Grill Tree - Decisions Resolved Or Required

```text
Can P5 start coding?
  -> No, not before pinned LightRAG proof fixture passes.

Where does index state live?
  -> source_documents.index_* fields only.
  -> DATA-001 lacks field-level detail today. Patch first.

What is submitted?
  -> Deterministic text rendered from source_blocks.
  -> CE_SOURCE and CE_BLOCK markers.
  -> No persisted rendered text.

How is duplicate remote content prevented?
  -> idempotent request id + generation fence + remote absence proof before retry.

How does delete work?
  -> Fence locally, delete remote if indexed/accepted, then remove local row/files.

Who decides query eligibility?
  -> source_is_query_eligible(source, domain), server-side only.
```

---

## A1 - Fixture Patch: Pinned LightRAG Proof

Before schema or service code, write a fixture that proves:

| Proof | Required result |
| --- | --- |
| Health | private runtime responds through backend-owned client only |
| Typed injection | embedding/provider config is injected server-side without exposing values |
| Submit | rendered text can be accepted with stable request id |
| Idempotency | repeating same request does not create duplicate remote content |
| Readiness | native ready can be observed and mapped to a safe state |
| Delete | remote content can be removed and absence verified |
| `CE_BLOCK` | marker survives enough for exact mapping after retrieval/readback |
| Delete-after-ready fence | late ready after delete/cancel cannot revive source eligibility |

If any row fails, mark F-005 blocked in `acceptance.md`.

---

## A2 - DATA-001 Patch: `source_documents.index_*`

Recommended fields, pending DATA-001 approval:

| Field | Rule |
| --- | --- |
| `index_state` | `not_requested`, `queued`, `submitting`, `accepted`, `ready`, `failed`, `cancelling`, `cancelled` |
| `index_generation` | nonnegative fence; increment before each queue/retry/cancel/delete fence |
| `index_request_id` | idempotent request id for current generation |
| `index_content_hash` | hash of rendered input; rendered input itself is not stored |
| `index_remote_document_id` | private remote identity if fixture requires it; never returned by public DTO |
| `index_error_code`, `index_error_message` | safe terminal failure details only |
| `index_lease_owner`, `index_lease_expires_at` | worker claim fields if no separate operation table is approved |
| `index_accepted_at`, `index_ready_at`, `index_updated_at` | lifecycle timestamps |

Do not add raw LightRAG payload columns, rendered text columns, generic metadata JSON, or index history tables.

---

## A3 - API-001 Patch: P5 Source DTOs And Actions

API-001 currently lists two P5 endpoints but does not define response DTOs or errors. Patch before route code.

| Endpoint/surface | Needed decision |
| --- | --- |
| `SourceAdminSummary` | Add safe `indexState`, optional safe index error, and readiness timestamps/counts if approved. |
| `POST .../index/retry` | Decide success body. Prefer `{ "source": SourceAdminSummary }` unless an operation object is approved. |
| `POST .../index/cancel` | Decide success body and terminal conflict behavior. |
| `DELETE .../sources/{source_id}` | Decide indexed-source behavior and status code after remote delete is required. |
| safe errors | `source_not_prepared`, `source_index_in_progress`, `source_index_not_ready`, `source_index_remote_unavailable`, `source_index_remote_failed`, `source_index_delete_failed`, `domain_state_conflict`. |

No response body may include private remote ids, runtime URL, rendered text, Source Block content, raw LightRAG hit/payload, provider payload, paths, or stack traces.

---

## A4 - Render Contract

`render_lightrag_input(source)` reads `source_blocks` ordered by `source_order` and emits deterministic text with:

```text
[CE_SOURCE schema=1 source_id=<source-id> sha256=<original-sha256>]

[CE_BLOCK id=<source-block-id> order=<source-order>]
<canonical block markdown>
```

Exact marker grammar is a contract. Patch F-005 spec before code if this shape changes.

Figure/image bytes are never submitted. Figure caption/alt text may be included only as Source Block text already owned by P4.

---

## A5 - Worker And Delete Fences

Single-source formulas:

```text
stale_index_result =
  source.index_generation != worker_generation
  OR source.index_request_id != worker_request_id
  OR source.state == "deleting"

ready_candidate =
  source.state == "prepared"
  AND source.index_state == "accepted"
  AND native_ready == true
  AND stale_index_result == false
```

Delete rule:

```text
if source has accepted/ready remote content:
  delete remote
  verify remote absence
then:
  delete local source rows/files
```

Do not hard-delete an indexed Source Document until remote delete succeeds or the feature explicitly records a blocked/compensating state.

---

## A6 - Query Eligibility Helper

P5 must implement one helper and later phases must call it:

```text
source_is_query_eligible(source, domain) =
  domain is available by P3 rules
  AND source.state == "prepared"
  AND source.index_state == "ready"
  AND source has current accepted generation
  AND no delete/cancel fence is active
```

P6 must not copy these conditions into retrieval code. Frontend must not copy them at all.

---

## Entity/Data Diagram

```text
domains
  |
  +-- source_documents
        id
        state
        preparation_generation
        index_state
        index_generation
        index_request_id
        index_content_hash
        index_* timestamps/errors/lease
        |
        +-- source_blocks
        +-- source_images

private LightRAG runtime
  |
  +-- remote indexed text keyed by source/generation/request identity
```

---

## Junior Dev - Do This Order

1. Patch API-001/DATA-001 and F-005 spec if marker/state details are missing.
2. Build pinned LightRAG proof fixture and record result.
3. Add migration/model fields for approved `index_*` shape.
4. Write render golden tests before worker code.
5. Extend P4 publish to queue index in the same transaction.
6. Add private LightRAG client interface and fake for state tests.
7. Implement worker submit/readiness/delete with generation fences.
8. Implement admin retry/cancel routes.
9. Implement `source_is_query_eligible()`.
10. Run F-005 test plan and update evidence/traceability.

---

## Red Flags In PR

- DATA-001 not patched but code adds `index_*` fields.
- Business code written before pinned LightRAG proof.
- Rendered LightRAG text persisted as a table/entity.
- Browser route/client knows runtime URL, remote id, provider key, or LightRAG payload.
- Source delete removes local row before remote indexed content is cleared.
- P6 eligibility logic is copied instead of calling the helper.
- Parser SDK integration is used to delay P5 even though P4 prepared data already exists.

---

## Tests To Write

- Pinned fixture: health, typed injection, idempotent submit, readiness, delete, `CE_BLOCK` preservation.
- Migration: fields/defaults/checks and no forbidden payload/path/rendered-text columns.
- Golden render: same Source Blocks produce same text/hash.
- Publish integration: P4 publish queues index atomically.
- Worker: submit accepted, ready transition, safe fail, timeout reconcile, retry no duplicate, cancel/delete late ready no-op.
- API: admin-only retry/cancel, safe DTO snapshot, OpenAPI snapshot.
- Eligibility: ready source in available domain passes; every missing condition fails.

---

## Still Needs Fixture / ADR

Required fixture: pinned LightRAG proof. No ADR needed unless the fixture forces a public contract break, a new runtime topology, or a table outside DATA-001.

---

## Next Grill Session

Run after T-001. Bring the fixture output, proposed DATA-001 patch, and exact API retry/cancel DTOs. If `CE_BLOCK` does not survive the pinned path, stop P5.
