# Context Engine — P6: Scoped Evidence Retrieval + Source Navigation (caveman)

**Goal:** User queries one active domain. Server returns only evidence mapped to one exact authorized SourceBlock. User opens focused safe source view. No answer synthesis.
**Depends:** P1 auth, P3 domains, P4 canonical source model, P5 indexing + eligibility.
**Reads:** P0 (eligibility one-scope §13; exact mapping §13; deletion §10; limits §14; logs §16).
**Style:** caveman.

---

## 0. Model reconciliation (read first)

ce-p6 draft assumed P4 tables `source_sections`, `source_pages`, `source_assets`, `block.section_id`, `block.ordinal`. **P4 plan I wrote uses a flatter model.** Map P6 onto it:

```text
draft term        -> actual P4 (p4-source-preparation-plan.md)
block.ordinal     -> source_blocks.source_order
section title     -> source_blocks.section_path (string[]; last element = section title)
page range        -> source_blocks.page_start / page_end
SourceAsset       -> source_images (FK source_block_id)
source_sections   -> none (derive from section_path)
source_pages      -> none (page fields on block)
```

No new section/page/asset tables. DRY: section + page already live on the block. "Asset" = source image.

---

## 1. Flow

```text
P5: prepared source -> private LightRAG handoff -> native ready -> query eligible
P6: question -> resolve active domain + eligible source -> private LightRAG retrieval
    -> exact SourceBlock mapping -> evidence cards -> opaque source refs -> authorized source view
P7: mapped evidence -> bounded synthesis -> answer -> citations
```

---

## 2. Final decisions

```text
LightRAG = only semantic + graph retrieval owner.
CE       = domain eligibility + source eligibility + raw-hit validation + evidence mapping + navigation owner.
Browser  = submits question, receives mapped evidence only, opens opaque refs only,
           never selects source/document, never accesses LightRAG.
```

No: local semantic search/BM25/vector DB/navigation search, hybrid merge, strategy/router framework, browser retrieval mode/top-k/reranker/filters/LightRAG URL/workspace IDs, document tree, full-document browser, raw original download, saved searches, query history, evidence/citation persistence, LLM synthesis, SSE, auto retry, new worker/queue/status table.

---

## 3. Scope

Build: one member evidence-query endpoint, one server query-target resolver, one private LightRAG retrieve method, one strict raw-hit mapper, one opaque encrypted source ref, one focused source-view route, one safe linked-asset (image) route, minimal evidence UI, safe diagnostics.

Do not build: answer generation, prompt assembly, chat history, citations-in-prose, cross-domain/cross-source retrieval, source selection, generic navigator, doc-management UI, asset gallery, original download, retrieval profiles/config UI, fallback retrieval, auto provider switch, auto retry.

---

## 4. Core rule

```text
LightRAG raw hit != evidence.
mapped raw hit + exact SourceBlock identity + owning source in target domain + current eligibility -> evidence.
evidence -> user-visible, source-viewable, P7 synthesis-eligible, P7 citable.
anything else -> discard.
```

```text
unmapped -> discard. ambiguous -> discard. wrong source -> discard. deleted source -> discard.
failed source -> discard. inactive domain -> reject query. document-only identity -> discard.
fuzzy text match -> never map. nearest block match -> never map.
```

---

## 5. Preconditions from earlier phases

### P4 source model

```text
SourceDocument -> immutable prepared source.
SourceBlock    -> stable UUID, source_id, source_order, canonical Markdown, optional section_path + page range.
source image   -> source_id, source_block_id, validated safe display artifact.
```

Prepared content never mutates in place. Changed source -> new SourceDocument + new block UUIDs -> old fenced then deleted. Stable SourceBlock UUID valid while source exists.

### P5 eligibility — reuse directly (P0 §13)

```python
source_is_query_eligible(source, domain)
```

No copied conditions. Query allowed only when: domain running + available + not deleting + source prepared + index_state=ready + no cancel/delete fence.

### Multi-source rule (review correction)

A domain holds **many** source documents (P4 permits it; P5 indexes each independently). There is no "active source." So:

```text
one selected domain
  -> many possible source documents
  -> only currently query-eligible sources may map to evidence
```

Browser selects the **domain** only — never a source or document. There is no `active_source_id`, no browser source selector, no source filter in the request, no document-selection state, no extra table. Scope = the domain's private LightRAG runtime; safety = per-hit source ownership + eligibility re-check (§12).

---

## 6. Provenance contract

**P6 blocked until pinned LightRAG fixture proves exact block identity survives retrieval.**

P5 render marker (already in p5 plan §8):

```text
[CE_SOURCE id=source-uuid schema=1 sha256=...]
[CE_BLOCK id=<source-block-uuid> order=.. page=.. section="..."]
<canonical block Markdown>
```

Retrieval proof:

```text
prepared source -> deterministic render -> submit -> native ready -> retrieval query
  -> returned raw hit retains exactly one CE_BLOCK marker -> local SourceBlock resolves.
```

Must prove: (1) raw hit has exactly one CE_BLOCK marker, (2) marker maps to one local block, (3) block's owning source belongs to the target domain, (4) marker survives LightRAG chunking/retrieval, (5) deleted source produces no mapped evidence, (6) stale remote hit can't map after fence/delete.

Not accepted: remote document/chunk ID only, LightRAG file/metadata path, fuzzy/nearest/section-only/page-only match, model-generated source ID.

```text
raw hit zero markers -> discard. multiple markers -> discard. marker not resolving target block -> discard.
```

No fallback.

---

## 7. Runtime shape

```text
Member -> CE API (auth, query target, LightRAG retrieve, strict map, opaque refs, source view)
  -> Postgres (source_documents, source_blocks, source_images)
  -> private network -> private LightRAG domain runtime (semantic + graph retrieval)
```

Browser -> CE API only. API -> private LightRAG runtime only. Browser never receives: raw hit, source ID, block ID, asset/image ID, storage path, LightRAG ID.

---

## 8. Canonical ownership

| Concern | Owner |
|---|---|
| user auth | P1 |
| domain availability | P3 domain service |
| source lifecycle | P4 source service |
| query eligibility | P5 source_is_query_eligible() |
| runtime endpoint | P3 runtime resolver |
| semantic/graph retrieval | LightRAG |
| raw hit parsing | P5 LightRAGClient.retrieve() |
| raw hit acceptance | P6 map_hit() |
| canonical source location | P4 source model |
| opaque ref encryption | existing app encryption helper (P2 SecretCipher or equivalent) |
| source navigation | source/navigation.py |
| evidence response | retrieval/evidence.py |

No duplicate owner.

---

## 9. Module layout

```text
backend/app/
├── source/{lightrag_client.py, repository.py, indexing.py, navigation.py}
├── retrieval/evidence.py
├── api/v1/evidence.py
├── schemas/evidence.py
└── tests/{unit/, integration/, contract/, compose/}
client/src/features/{evidence-query/, source-view/}
```

```text
source/lightrag_client.py -> P5 submit/readiness/delete + P6 retrieve.
retrieval/evidence.py     -> QueryTarget, resolve_query_target(), parse_block_marker(), map_hit(), query_evidence().
source/navigation.py      -> make_source_ref(), open_source_ref(), build_source_view(), make_asset_ref(), stream_asset().
api/v1/evidence.py        -> three HTTP routes.
schemas/evidence.py       -> request/response DTOs only.
```

No: retrieval_engine/, strategy/, router/, hybrid_merger/, query_policy/, evidence_repository/, citation_repository/, query_history_repository/, source_ref_table/repository, source_view_service/, adapter protocol, plugin framework.

---

## 10. Query target resolution

`QueryTarget` carries the domain + runtime only — NO `source_id` (there is no single active source; §4):

```python
@dataclass(frozen=True)
class QueryTarget:
    domain_id: UUID
    runtime_url: str

def resolve_query_target(*, user: AuthenticatedUser, domain_id: UUID) -> QueryTarget: ...
```

```text
1. require authenticated user.
2. load domain.
3. verify domain exists + running + available + not deleting.
4. require at least one currently query-eligible source in the domain (else 409 no_query_eligible_source).
5. resolve private runtime URL.
6. return QueryTarget.
```

Per-hit eligibility (which exact source owns each hit, and is it still eligible) is checked in `map_hit` (§12), not here. The resolver only proves the domain is queryable and has ≥1 eligible source.

No source/document ID from browser. No browser filter.

Failure (fail closed):

| Condition | HTTP | Code |
|---|---|---|
| missing/invalid session | 401 | authentication_required |
| unknown / stopped / inactive / deleting domain | 404 | domain_not_available |
| domain has zero query-eligible sources | 409 | no_query_eligible_source |

Resolver checks the domain has ≥1 eligible source (not which one). Per-source state (prepared/ready vs deleted/failed/cancelling) is enforced per hit in map_hit (§12). Cannot confirm any eligible source -> no retrieval.

---

## 11. LightRAG retrieval (extend P5 client)

```python
class LightRAGClient:
    def submit(...): ...
    def readiness(...): ...
    def delete(...): ...
    def retrieve(self, *, runtime_url: str, question: str, raw_hit_limit: int) -> list[RawLightRAGHit]: ...
```

No second query client, no adapter protocol, no fallback endpoint.

```python
@dataclass(frozen=True)
class RawLightRAGHit:
    text: str
```

Don't preserve unused remote fields. Don't expose raw hit outside retrieval module. Don't persist raw hit.

Client owns: private runtime URL + one pinned endpoint + one pinned retrieval mode + serialization + bounded timeout + parsing + typed upstream-error mapping. Client does NOT own: auth, domain scope, source eligibility, evidence mapping, navigation, browser DTOs, retry, fallback.

Server constants:

```python
QUESTION_MAX_CHARS = 4_000
RAW_HIT_LIMIT = 12
EVIDENCE_LIMIT = 8
EVIDENCE_EXCERPT_MAX_CHARS = 1_200
LIGHTRAG_RETRIEVAL_TIMEOUT_SECONDS = 15
```

No DB retrieval profile, browser override, domain retrieval config, feature flag.

Upstream failure:

| Condition | HTTP | Code |
|---|---|---|
| LightRAG timeout/unreachable, runtime unhealthy | 503 | retrieval_unavailable |
| invalid upstream response | 502 | retrieval_invalid_response |
| pinned endpoint contract failure | 502 | retrieval_contract_error |

No auto retry — user submits another question. No durable job, no cleanup.

---

## 12. Strict evidence mapping

```python
def parse_block_marker(raw_text: str) -> UUID | None: ...
def map_hit(*, target: QueryTarget, raw_hit: RawLightRAGHit) -> MappedEvidence | None: ...
```

```python
@dataclass(frozen=True)
class MappedEvidence:
    evidence_id: str
    source_ref: str
    document_title: str
    source_label: str
    section_title: str | None      # from section_path[-1]
    page_start: int | None
    page_end: int | None
    excerpt: str
    source_id: UUID                # private
    block_id: UUID                 # private
    canonical_block_text: str      # private
    asset_refs: tuple[str, ...]
```

Browser DTO excludes private fields (source_id, block_id, canonical_block_text).

Algorithm:

```text
per raw hit:
1. parse exact CE_BLOCK marker.
2. no marker -> discard. 3. multiple markers -> discard.
4. load SourceBlock by marker ID. 5. no block -> discard.
6. load the OWNING source document (block.source_id) + domain.
7. verify owning_source.domain_id == target.domain_id (cross-domain hit -> discard).
8. source_is_query_eligible(owning_source, domain). 9. not eligible (deleted/failed/cancelling/wrong domain) -> discard.
10. build canonical local location: block + section_path[-1] when known + page range when known + linked source images.
11. build excerpt from canonical block text. NEVER raw LightRAG text.
12. mint opaque source ref.
13. return mapped evidence.
```

Dedup: same SourceBlock in many hits -> keep first upstream result. Order = retained LightRAG order. Return max EVIDENCE_LIMIT. No score normalization, no client-visible score, no reranker.

All hits rejected: raw hits exist + no valid map -> HTTP 200, kind=no_grounded_context. No upstream detail exposed.

---

## 13. Evidence query flow

```python
def query_evidence(*, user, domain_id, question) -> EvidenceQueryResult:
    target = resolve_query_target(user=user, domain_id=domain_id)
    raw_hits = lightrag_client.retrieve(runtime_url=target.runtime_url, question=question, raw_hit_limit=RAW_HIT_LIMIT)
    evidence_by_block: dict[UUID, MappedEvidence] = {}
    for raw_hit in raw_hits:
        ev = map_hit(target=target, raw_hit=raw_hit)
        if ev is None: continue
        evidence_by_block.setdefault(ev.block_id, ev)
        if len(evidence_by_block) == EVIDENCE_LIMIT: break
    return build_evidence_result(target=target, evidence=list(evidence_by_block.values()))
```

No local search, fallback search, secondary endpoint, auto retry, background job, query persistence.

---

## 14. Opaque source references

Use existing app authenticated-encryption helper. No new DB table. No dedicated key unless P1/P2 has none.

Payload:

```text
version, purpose=source_view, domain_id, source_id, block_id, expires_at
```

Output: `s1.<encrypted-authenticated-payload>`

Ref does not expose: source/block/section/page/asset/workspace IDs, storage path, LightRAG ID, filesystem path. TTL = 30 min. No user ID inside ref (shared trusted corpus). **Ref != authorization.**

```text
every open -> authenticate user -> decrypt/verify ref -> re-check current source/domain eligibility.
```

No generation field: prepared source immutable; changed source -> new block IDs; delete/cancel/state change -> current eligibility check blocks old ref.

---

## 15. Source navigation

Opens exact mapped block. Not a document browser, not local search.

```python
def make_source_ref(...): ...
def open_source_ref(...): ...
def build_source_view(...): ...
```

Open flow:

```text
GET source ref -> require auth -> decrypt + verify expiry -> verify purpose=source_view
  -> resolve_query_target(ref.domain_id)            (proves domain queryable for this user)
  -> load ref block -> verify block.source_id == ref.source_id
  -> load owning source -> verify owning_source.domain_id == ref.domain_id
  -> source_is_query_eligible(owning_source, domain)
  -> build focused source view.
```

The ref still pins the exact `domain_id` + `source_id` + `block_id` (it is per-block). Validation is against the ref's own source, re-checked for current eligibility — not against a single domain "active source."

Failure (invalid/expired/tampered ref, inactive domain, deleted/failed/wrong source, missing block) -> `404 source_not_available`. One generic 404 prevents state leakage.

Focused view returns: document title, location label, focus block, one prior block, one next block, linked source images.

```text
prior/next block -> same section_path only. no section -> focus block only.
no unrestricted dump, no full tree, no arbitrary block route, no original-file route, no raw LightRAG chunk.
```

Adjacent block = same source_id + same section_path + nearest source_order below/above. (Index supports it — §19.)

Safe block content: P4 canonical Markdown only. Browser Markdown renderer: HTML disabled, script disabled, unsafe URL schemes rejected. Never render raw uploaded HTML.

---

## 16. Source assets (images)

Asset route exists only for images linked from a focused source view.

```text
GET /api/v1/source-assets/{asset_ref}
```

Payload: `version, purpose=source_asset, domain_id, source_id, asset_id (= source_image id), expires_at`. Output `a1.<payload>`.

```text
asset ref -> require auth -> decrypt/verify -> resolve_query_target(domain_id) -> source match
  -> image belongs to ref.source_id -> owning source in ref.domain_id + eligible -> image linked to allowed block/section -> stream safe artifact.
```

No direct asset ID route, no raw storage URL, no public static mount, no original file download. Headers: `Cache-Control: private, no-store`, `X-Content-Type-Options: nosniff`. Serve only P4 validated image MIME types. Invalid/expired/foreign/missing -> `404 source_not_available`.

---

## 17. Member API

All routes `CurrentUser = Depends(require_authenticated_user)`.

```text
POST /api/v1/domains/{domain_id}/evidence   query active domain, mapped evidence only
GET  /api/v1/source-views/{source_ref}      open one authorized mapped block
GET  /api/v1/source-assets/{asset_ref}      stream one authorized linked image
```

No /retrieve, no /query, no legacy duplicate, no LightRAG proxy.

Request:

```python
class EvidenceQueryRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    question: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=QUESTION_MAX_CHARS)]
```

Rejected browser fields (extra -> 422): sourceId, documentId, blockId, topK, mode, reranker, model, provider, runtimeUrl, LightRAG URL, debug.

Evidence response:

```json
{"kind":"evidence","domain":{"id":"fatigue","name":"Fatigue"},
 "evidence":[{"evidenceId":"e1","excerpt":"Inspection required after every 50,000 cycles.",
   "sourceRef":"s1.opaque-value","documentTitle":"Fatigue Manual",
   "sourceLabel":"Results > Fatigue Test 3 · Page 12","sectionTitle":"Fatigue Test 3",
   "pageStart":12,"pageEnd":12,
   "assetRefs":[{"label":"Figure 4","assetRef":"a1.opaque-value"}]}]}
```

No grounded context:

```json
{"kind":"no_grounded_context","domain":{"id":"fatigue","name":"Fatigue"},"evidence":[]}
```

Never return: sourceId, documentId, blockId, sectionId, assetId, workspaceNodeId, sourcePath, storagePath, LightRAG URL/track ID/chunk ID, raw metadata, raw retrieval text, raw score, provider config.

Source view response:

```json
{"documentTitle":"Fatigue Manual","locationLabel":"Results > Fatigue Test 3 · Page 12",
 "focusBlock":"Inspection required after every 50,000 cycles.",
 "before":"The test begins after baseline measurement.","after":"Record inspection outcome in test log.",
 "assets":[{"label":"Figure 4","assetRef":"a1.opaque-value"}]}
```

---

## 18. Browser vertical slice

Smallest useful member UI:

```text
available-domain selector -> P3 available domains only.
question field -> POST evidence.
evidence cards -> canonical excerpt + source label + Open source action.
source side panel -> GET source view -> focused content + linked safe images.
```

No assistant answer bubble, fake synthesis, chat history, doc tree/browser, saved searches, query history, retrieval controls, source selection, client eligibility state, localStorage.

Browser state (memory only, reload clears, no localStorage): selectedDomainId, typedQuestion, evidenceResult, openSourceRef, sourceView.

UI state contract:

| State | UI |
|---|---|
| domain unavailable | safe message, clear evidence |
| no query-eligible source | "Domain content not ready." |
| retrieval unavailable | safe temporary failure, may resubmit |
| no grounded context | "No mapped source evidence found." |
| evidence result | cards, no answer text |
| source ref unavailable | close panel, "Source no longer available." |

---

## 19. DB + storage

No P6 tables. No evidence/citation/query-history/source-ref/asset-ref table. Evidence request-scoped. Refs expire without cleanup.

Reuse: source_documents, source_blocks, source_images, P5 index state fields, domains.

Required lookups (P4 must support): block by ID; block ownership by source_id; ordered adjacent block by source_id + section_path + source_order; image by source_id + source_block_id. Check actual query plans first; add only missing narrow indexes. Likely:

```sql
CREATE INDEX ix_source_blocks_source_order ON source_blocks (source_id, source_order);
CREATE INDEX ix_source_images_source_block ON source_images (source_id, source_block_id);
```

(section_path is array — adjacent lookup filters in service after ordered fetch by source_order, or add GIN/expression index only if a plan proves need.) No migration unless P4 schema lacks needed index.

---

## 20. Reliability + concurrency

```text
evidence query = short request, no durable job, no write workflow, no queue.
client disconnect -> request ends, no cleanup. LightRAG timeout -> typed 503, user resubmits.
```

Re-check eligibility after remote retrieval:

```text
query starts -> target eligible.
index/delete/stop during remote retrieval -> map_hit re-checks -> evidence discarded.
source ref opens later -> eligibility re-checked -> stale source view denied.
```

Remote retrieval result alone never proves present access eligibility.

No query lock: read-only retrieval -> no per-domain query lock. P5 worker owns remote mutation serialization. P6 owns no remote mutation.

---

## 21. Logging (P0 §16)

Log safe facts: request_id, actor_id, domain_id, source_id, question_char_count, raw_hit_count, mapped_evidence_count, discard_count_by_reason, retrieval_duration_ms, upstream_status_category, source_view_result.

Never log: raw question, full retrieved text, full source content, source ref, asset ref, raw LightRAG payload, remote IDs, storage paths, cookies, tokens, provider secrets. No raw query/audit table. No analytics platform.

---

## 22. Config

```dotenv
LIGHTRAG_RETRIEVAL_TIMEOUT_SECONDS=15
```

Code constants: QUESTION_MAX_CHARS=4000, RAW_HIT_LIMIT=12, EVIDENCE_LIMIT=8, EVIDENCE_EXCERPT_MAX_CHARS=1200, SOURCE_REF_TTL_SECONDS=1800.

No browser top-k/mode/reranker, cache/retry/poll settings, fallback URLs, feature flags, search-engine list.

---

## 23. Build order

```text
Step 0 prove provenance: pin image, real container fixture — CE_BLOCK survives retrieval,
  one hit -> one exact local block, foreign marker rejected, deleted source can't map.
  Block P6 if fixture fails. No fuzzy mapper. No fallback retrieval.
Step 1 extend LightRAG client: add retrieve() — one endpoint, one mode, one timeout, one raw-text type.
Step 2 query target resolver: QueryTarget, resolve_query_target(), reuse source_is_query_eligible().
Step 3 strict mapper: parse_block_marker(), map_hit(), canonical local excerpt only, dedupe by block ID.
Step 4 opaque refs + source view: encrypted source refs, focused block view, asset refs + safe stream.
Step 5 API: POST evidence, GET source view, GET source asset, typed failures, OpenAPI.
Step 6 browser slice: domain selector, question input, evidence cards, source side panel.
Step 7 remove old paths: no direct retrieve endpoint, no local semantic retrieval, no hybrid merge,
  no local navigation search, no browser retrieval controls, no direct source/document/asset ID routes.
Step 8 proof: unit, Postgres integration, real LightRAG contract fixture, browser E2E happy path, security response-shape test.
```

---

## 24. Test gate

```text
active domain + ready source -> query -> mapped evidence -> open source view.
domain with MULTIPLE eligible sources -> one query returns evidence from more than one source document.
domain where one source is ready and another is failed/deleting -> only the eligible source maps; no active-source state.
domain with zero eligible sources -> 409 no_query_eligible_source (before any stream/retrieval).
raw hit missing CE_BLOCK -> discarded. multiple markers -> discarded. unknown block marker -> discarded.
block from foreign domain -> discarded. all hits discarded -> 200 no_grounded_context.
domain stops after evidence response -> source ref 404 source_not_available.
source deleted after evidence response -> source ref 404.
source ready->cancelling during retrieval -> raw result discarded.
tampered/expired source ref -> 404. foreign/expired asset ref -> 404.
request injects sourceId/documentId/topK/mode/reranker/model/provider/runtimeUrl -> 422.
response contains no source/block/asset IDs, storage paths, workspace IDs, LightRAG IDs, raw payload.
no local semantic retrieval. no hybrid merger. no evidence/citation/query-history persistence.
```

---

## 25. Definition of done

```text
One member evidence-query route. One server QueryTarget resolver owns eligibility.
One existing LightRAG client owns private retrieval. Only exact SourceBlock maps become evidence.
Unmapped/ambiguous/foreign hits never reach browser. Browser gets opaque refs only.
Every source open re-checks current eligibility.
Deleted/failed/inactive/stale/unmapped/foreign content cannot retrieve, open, cite, or reach P7.
Source navigation resolves exact block only. No local search. No synthesis. No fallback.
No browser retrieval controls. No new persistence except proven missing indexes.
```

## Final boundary

```text
P5: prepared source -> private LightRAG handoff -> native ready -> query eligible.
P6: eligible source -> scoped LightRAG retrieval -> exact block mapping -> opaque source ref -> focused authorized source view.
P7: mapped evidence -> bounded synthesis context -> streamed answer -> citations.
```
