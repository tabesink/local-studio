# F-006 / P6 - Scoped Evidence Retrieval

Goal: let an authenticated user ask one Knowledge Domain question and receive safe Evidence cards without synthesis.

Not in P6: answer synthesis, SSE, chat history, query persistence, source navigation, source/document selector UI, browser retrieval tuning, local fallback retrieval, durable Evidence table.

---

## Big Picture

```text
Member/Admin
  |
  v
POST /api/v1/domains/{domain_id}/evidence
  |
  +-- resolve selected Knowledge Domain
  +-- find eligible Source Documents through source_is_query_eligible()
  +-- private LightRAG retrieve()
  +-- strict CE_BLOCK marker parser
  +-- exact Source Block mapper
  |
  v
safe Evidence DTOs

Browser never sees LightRAG hits, source/block ids, runtime URLs, paths, prompts, or raw source text.
```

P6 is not "search UI." P6 is the proof that retrieval can map raw runtime hits back to Context Engine-owned Source Blocks without fuzzy identity.

---

## What Evidence Means Here

Evidence is a mapped, authorized retrieval result. It is not raw LightRAG output.

For P6, Evidence must come from:

```text
retrieved hit -> exactly one CE_BLOCK marker -> SourceBlock row -> eligible Source Document
```

Anything else is discarded. No marker, multiple markers, unknown marker, foreign domain/source, deleting source, ineligible source, or fuzzy mapping requirement means no Evidence from that hit.

---

## P5 Dependency Gate

| Gate | Current review result |
| --- | --- |
| F-005 status | Feature register and F-005 docs say implemented. |
| Index fields | Present on `source_documents`; no index history table found. |
| P4 publish queues index | F-005 acceptance points to `tests/test_lightrag_indexing.py`. |
| Query eligibility helper | Present as `source_is_query_eligible()` in `context_engine/services/indexing.py`. |
| Pinned LightRAG fixture | Test exists, but app worker path uses `LocalLightRAGIndexClient` sidecar records instead of native LightRAG writes. |
| T-060 vendored runtime promotion | Closed in F-005 T-060: pinned LightRAG 1.4.16 is promoted into `vendor/lightrag/`, with native proof imports repointed to the vendored tree. |
| Traceability | `feature-register.md` says F-005 implemented; `traceability-matrix.md` still marks P5 proof/query eligibility as planned. |

Decision: T-060 is closed. P6 can use `vendor/lightrag/` as the native runtime source, but still must prove app-boundary retrieval returns raw hits with exact `CE_BLOCK` markers before evidence mapping lands.

---

## Build Order From `tasks.md`

```text
T-000  read AGENTS, CONTEXT, contracts, and F-006
T-060  closed: vendored LightRAG promotion completed in F-005
T-010  implement query target resolver and domain availability checks
T-020  implement private retrieval client wrapper
T-030  implement strict marker parser and Source Block mapper
T-040  implement POST /api/v1/domains/{domain_id}/evidence
T-050  add private callable for P7 reuse
T-900  run test-plan.md
T-910  update acceptance, implementation log, traceability
```

Do not begin T-020/T-030 until the ID-A client/indexing boundary is resolved.

---

## Layer Ownership

| Layer | Owns | Must not own |
| --- | --- | --- |
| API route | authz, request validation, safe response/errors | LightRAG internals, raw hit payloads |
| Retrieval service | domain resolver, eligibility filtering, Evidence DTO mapping | synthesis, chat persistence |
| LightRAG client | private retrieve call and safe timeout handling | product state truth, DTO shape |
| Marker parser | strict `CE_BLOCK` extraction | fuzzy/nearest matching |
| Mapper | Source Block lookup and eligibility enforcement | browser-visible private ids |
| Frontend | later rendering of safe DTOs only | query eligibility logic, runtime access |

---

## Questions MUST Answer Before Coding

### A. Contract/data/API blockers

| # | Question | Owner patch |
| --- | --- | --- |
| A1 | Exact request/response body for `POST /domains/{domain_id}/evidence`? | API-001 |
| A2 | Safe Evidence DTO field names, excerpt bounds, and source label shape? | API-001 |
| A3 | Error code for no eligible source: exact `409` payload? | API-001 |
| A4 | Error code/body for zero mapped Evidence: exact `no_grounded_context` shape? | API-001 |

### B. Runtime/private integration blockers

| # | Question | Owner patch |
| --- | --- | --- |
| B1 | Does P6 retrieval use the vendored LightRAG runtime path promoted by F-005 T-060? | ID-A + ADR-002 + F-005 tasks |
| B2 | What private retrieve method returns raw hit text containing preserved `CE_BLOCK` markers? | F-006 implementation + fixture |
| B3 | How are LightRAG timeout/unavailable failures made safe? | API-001 + QA-002 |

### C. Worker/concurrency/idempotency blockers

| # | Question | Owner patch |
| --- | --- | --- |
| C1 | Can retrieval race with cancel/delete? | F-006 tests call P5 eligibility helper. |
| C2 | Is readiness current by generation/request identity? | P5 helper remains single source. |

### D. Delete/destructive-state blockers

| # | Question | Owner patch |
| --- | --- | --- |
| D1 | Deleted or cancelling source hit appears in LightRAG results. What happens? | Discard hit; mapper test. |
| D2 | Domain delete starts during retrieval. What happens? | Domain unavailable conflict or discarded hits. |

### E. Storage/private data blockers

| # | Question | Owner patch |
| --- | --- | --- |
| E1 | Are Evidence excerpts allowed to include bounded Source Block text? | API-001 must state field/limit. |
| E2 | Are Source Block ids ever returned? | No, unless a later source-ref contract approves them. |

### F. Authz/roles blockers

| # | Question | Owner patch |
| --- | --- | --- |
| F1 | Members may call evidence for available domains only. | API route/service tests. |
| F2 | Administrators may also call evidence, but index/admin routes remain admin-only. | Authz tests. |

### G. Test/evidence blockers

| # | Question | Owner patch |
| --- | --- | --- |
| G1 | Fixture proves `CE_BLOCK` survives retrieval, not just indexing/storage. | F-006 AC-001. |
| G2 | Mapper discards no marker, multi-marker, unknown, foreign, deleted, and ineligible hits. | F-006 mapper tests. |
| G3 | DTO snapshot excludes private ids, paths, runtime URLs, raw hits, and scores. | F-006 API tests. |

---

## Acceptance Criteria As Definition Of Done

| AC | Done means |
| --- | --- |
| AC-001 | A fixture proves retrieved runtime hit text still contains usable `CE_BLOCK` identity. |
| AC-002 | Active domain with at least one eligible ready source returns safe Evidence. |
| AC-003 | No eligible source returns the contracted safe `409`. |
| AC-004 | All raw hits discarded returns the contracted `no_grounded_context` response. |
| AC-005 | Foreign, deleted, and ineligible markers are discarded. |
| AC-006 | Response excludes private ids, paths, raw payloads, runtime URLs, and raw scores. |

---

## What Junior Dev Should Read

1. `AGENTS.md`
2. `CONTEXT.md`
3. `specs/04-features/F-005-lightrag-indexing-eligibility/acceptance.md`
4. `specs/04-features/F-006-scoped-evidence-retrieval/`
5. `specs/03-contracts/api/context-engine-v1.md`
6. `specs/03-contracts/ai/grounded-answering.md`
7. `specs/03-contracts/data/context-engine-data.md`
8. `context_engine/services/indexing.py`
9. `tests/test_lightrag_indexing.py`
10. `.devnotes/P5-post-impl-REVIEW/ID-A.md`

---

## Practical Start Checklist

- Resolve ID-A before implementation.
- Use the F-005 T-060 vendored LightRAG runtime at `vendor/lightrag/`; do not import native runtime code from `.references/` or pip-only installs.
- Patch API-001 with exact P6 request/response/error DTOs if missing.
- Add retrieval fixture before service code.
- Implement marker parser as a pure unit with strict rejection cases.
- Reuse `source_is_query_eligible()`; do not copy readiness conditions.
- Keep raw hit payloads and Source Block ids out of public DTOs.
- Update acceptance, implementation log, traceability matrix, and OpenAPI snapshot.

---

## Reference Comparison

| Question | Reference answer | Greenfield delta |
| --- | --- | --- |
| Can retrieval use remote/runtime chunk identity? | Old systems often expose retriever-native chunks. | No. Greenfield maps exact `CE_BLOCK` to Source Block. |
| Can browser tune retrieval mode/top-k? | Reference UIs may expose knobs. | No browser retrieval controls in P6. |
| Can missing mapped hits fall back to general answer? | Some chat products do this. | No. P6 returns no grounded context. |
| Can Evidence expose source/block ids? | Old navigation may rely on ids. | No member source-ref contract exists yet. |

One-line summary: P6 is ready to plan, but not ready to code until the P5 app indexing boundary can feed native retrieval or the contracts explicitly accept a different private runtime strategy.
