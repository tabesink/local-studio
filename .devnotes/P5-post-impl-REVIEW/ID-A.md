# ID-A - P5 indexing boundary and P6 evidence mapping (P6 blockers)

Working doc for the P5-to-P6 gate. Canonical patch targets: `context_engine/services/indexing.py`, `specs/04-features/F-005-lightrag-indexing-eligibility/implementation-log.md`, `specs/04-features/F-006-scoped-evidence-retrieval/spec.md`, `specs/03-contracts/api/context-engine-v1.md`, `specs/03-contracts/ai/grounded-answering.md`, and `specs/07-traceability/traceability-matrix.md`.

Sources grilled: AGENTS.md, README.md, constitution, CONTEXT.md, F-004 acceptance/implementation evidence, F-005 spec/plan/tasks/test-plan/acceptance/implementation log, F-006 spec/plan/tasks/test-plan/acceptance, API-001, DATA-001, AI-001, PROD-002/003/004, ARCH-002/003/004/005, QA-001/002/004, TRACE-001/002, `context_engine/services/indexing.py`, `context_engine/services/sources.py`, `context_engine/models.py`, `tests/test_lightrag_indexing.py`, and `.devnotes/P4-post-impl-REVIEW/`.

**Related docs**

| Doc | Scope |
| --- | --- |
| [ID-A-lightrag-client-boundary.md](./ID-A-lightrag-client-boundary.md) | whether P5 app indexing really feeds private LightRAG retrieval |
| [ID-A-vendored-lightrag-promotion.md](./ID-A-vendored-lightrag-promotion.md) | F-005 T-060 promotion of pinned LightRAG 1.4.16 into `vendor/lightrag/` |
| [ID-A-evidence-api-contract.md](./ID-A-evidence-api-contract.md) | P6 API DTO/error shape blockers |
| [ID-A-marker-mapping.md](./ID-A-marker-mapping.md) | strict `CE_BLOCK` parsing and mapper rules |

---

## Lean Winner

```text
Use the closed F-005 T-060 vendored runtime
+ promote pinned LightRAG 1.4.16 into vendor/lightrag/
+ repoint native proof/runtime imports and build paths to vendor/lightrag/
+ keep P5 source-owned index fields
+ keep source_is_query_eligible() as the only eligibility helper
+ implement P6 retrieval against native LightRAG hits containing CE_BLOCK markers
+ map hits to Source Blocks exactly
+ return only safe Evidence DTOs
```

This preserves the P5 data model while preventing P6 from building on a sidecar index that cannot produce real LightRAG retrieval hits.

---

## Rejected Alternatives

| Alternative | Reject because |
| --- | --- |
| Build P6 retrieval over local JSON sidecar records | P6 requires private LightRAG retrieval and raw hit marker parsing. |
| Import native runtime from `.references/code/lightrag/` | `.references/` is evidence only; ADR-002 requires editable runtime code under `vendor/lightrag/`. |
| Use pip-only `lightrag-hku` as runtime source | ADR-002 rejects pip-only runtime ownership because CE prompt/runtime edits must be version-controlled. |
| Copy P5 eligibility checks into retrieval code | DATA-001 and AI-001 say P6 must call `source_is_query_eligible()`. |
| Return Source Block ids to the browser for convenience | API-001 forbids source/block ids for member evidence without a later source-ref contract. |
| Fuzzy match retrieved text to Source Blocks | Constitution and AI-001 require exact `CE_BLOCK` identity. |
| Add a durable Evidence table in P6 | F-006 is evidence-only retrieval with no durable evidence table. |
| Add retrieval mode/top-k controls to the browser | F-006 forbids browser retrieval controls. |

---

## Grill Tree - Decisions Resolved Or Required

```text
Can P6 start coding?
  -> T-060 is closed; P6 can start after API-001 DTO shape and retrieval fixture scope are patched.

What is the concern?
  -> F-005 says private LightRAG indexing and ADR-002 says vendored runtime.
  -> App code currently uses LocalLightRAGIndexClient sidecar records.
  -> T-060 closed the vendored runtime promotion to vendor/lightrag/.
  -> P6 needs retrieve() hits with CE_BLOCK text.

Can P6 use source_is_query_eligible()?
  -> Yes. It exists and must remain the single source.

Can P6 return Source Block ids?
  -> No. API-001 forbids ids for member evidence until source-ref contract exists.

Can P6 invent missing DTO fields?
  -> No. Patch API-001 first.
```

---

## A1 - Client Boundary Patch

Current implementation review:

| Surface | Observation |
| --- | --- |
| `LocalLightRAGIndexClient` | Writes/reads/deletes private JSON records under the domain runtime directory. |
| Pinned fixture | Test imports native LightRAG and proves marker/idempotency behavior separately. |
| App worker | Uses `LocalLightRAGIndexClient`, not the native LightRAG fixture path. |
| T-060 | Closed: pinned LightRAG 1.4.16 promoted from reference evidence into `vendor/lightrag/`. |
| P6 risk | Retrieval still needs a native app-boundary fixture proving indexed corpus returns `CE_BLOCK` hits. |

Decision: P6 should not build retrieval over sidecar records. Use the closed T-060 vendored tree. Do not treat the sidecar index client as native retrieval; add the P6 app-boundary retrieval fixture before evidence mapping.

---

## A2 - API-001 P6 DTO Patch

API-001 currently lists `POST /domains/{domain_id}/evidence`, but P6 needs field-level shape before route code:

| Surface | Required decision |
| --- | --- |
| Request body | `question` field, length limits, strict unknown-field behavior. |
| Success body | Evidence array shape, stable safe labels, excerpt limits. |
| No eligible source | Exact `409` code/message. |
| No mapped hits | Exact `no_grounded_context` body and HTTP status. |
| Diagnostics | Safe request id only; no raw score/hit/path/runtime id. |

No public response should include `sourceBlockId`, `sourceDocumentId`, raw LightRAG id, raw score, storage path, runtime URL, prompt, provider payload, or full Source Block text.

---

## A3 - Marker Parser And Mapper

Parser rules:

```text
accept exactly one marker:
  [CE_BLOCK id=<source-block-id> order=<source-order>]

discard:
  no marker
  multiple markers
  malformed marker
  unknown Source Block id
  Source Block from another Knowledge Domain
  Source Document not query-eligible
  Source/Domain deleting
```

Mapper rules:

```text
raw hit -> marker -> SourceBlock -> SourceDocument -> source_is_query_eligible()
```

Do not use nearest text, source order alone, parser-native ids, remote chunk ids, or graph node ids as fallbacks.

---

## A4 - Traceability Patch

`specs/07-traceability/feature-register.md` marks F-005 implemented, but `specs/07-traceability/traceability-matrix.md` still lists P5 query eligibility / LightRAG proof rows as planned.

Decision: update the traceability matrix before claiming the P5 review gate is closed.

---

## Entity/Data Diagram

```text
domains
  |
  +-- source_documents
        index_state = ready
        index_generation/current request identity
        |
        +-- source_blocks
              id = CE_BLOCK identity

private LightRAG runtime
  |
  +-- retrieved raw hit text contains CE_BLOCK marker
        |
        v
P6 mapper returns safe Evidence DTO
```

---

## Junior Dev - Do This Order

1. Use the vendored LightRAG runtime promoted by F-005 T-060.
2. Resolve `LocalLightRAGIndexClient` vs native private LightRAG boundary.
3. Patch API-001 with exact P6 request/response/error DTOs.
4. Add fixture proving `CE_BLOCK` survives retrieval, not just indexing.
5. Implement pure strict marker parser tests.
6. Implement mapper tests for foreign/deleted/ineligible/malformed hits.
7. Implement private retrieval client wrapper.
8. Implement `POST /api/v1/domains/{domain_id}/evidence`.
9. Update OpenAPI snapshot, acceptance, implementation log, and traceability matrix.

---

## Red Flags In PR

- Retrieval reads local sidecar JSON instead of private LightRAG hits without contract patch.
- Runtime imports native LightRAG from `.references/code/lightrag/` after T-060 is supposed to be complete.
- Native runtime depends on pip-only `lightrag-hku` instead of the editable vendored tree.
- P6 copies `index_state == "ready"` conditions instead of calling `source_is_query_eligible()`.
- Evidence DTO returns Source Block ids, Source Document ids, raw score, raw hit text, or runtime ids.
- No marker or multi-marker hits are partially accepted.
- No eligible source and no mapped Evidence use the same error path.
- Traceability remains planned for P5 LightRAG proof while F-005 is marked implemented.

---

## Tests To Write

- Vendored import test: native LightRAG imports resolve from `vendor/lightrag/`, not `.references/` or pip-only install.
- Retrieval fixture: a native retrieve call returns hit text containing a `CE_BLOCK` marker from content indexed through the app boundary.
- Parser unit: accept exactly one valid marker; reject none/many/malformed.
- Mapper unit: discard unknown, foreign, deleted, and ineligible markers.
- API integration: member/admin can query available domain; unavailable/no eligible source returns contracted safe conflict.
- API snapshot: success and fallback responses exclude private ids, paths, raw payloads, scores, runtime URLs, and full raw source text.
- Traceability review: F-005 proof rows no longer say planned after implementation evidence exists.

Still needs ID-B only if the client boundary decision introduces a new runtime architecture or async retrieval contract.

Next grill session: patch API-001 for exact P6 DTOs, then prove app-boundary retrieval against `vendor/lightrag/`.
