# Context Engine — Phase 6: Scoped Evidence Retrieval + Source Navigation

**Status:** Greenfield implementation plan
**Build style:** API-first. One retrieval path. Low entropy.
**Depends on:** Phase 1 auth; Phase 3 domains; Phase 4 canonical source model; Phase 5 private LightRAG indexing + query eligibility.

---

# 0. Goal

User queries one active domain.

System returns only evidence mapped to one exact authorized `SourceBlock`.

User opens focused safe source view.

No answer synthesis.

```text
Phase 5

prepared source
  -> private LightRAG handoff
  -> native ready
  -> query eligible

Phase 6

user question
  -> server resolves active domain + eligible source
  -> private LightRAG retrieval
  -> exact SourceBlock mapping
  -> evidence cards
  -> opaque source refs
  -> authorized source view

Phase 7

mapped evidence
  -> bounded synthesis context
  -> generated answer
  -> citations
```

---

# 1. Final Decisions

```text
LightRAG
  = only semantic + graph retrieval owner.

Context Engine
  = domain eligibility owner.
  = source eligibility owner.
  = raw-hit validation owner.
  = evidence mapping owner.
  = source navigation owner.

Browser
  = submits question.
  = receives mapped evidence only.
  = opens opaque refs only.
  = never selects source/document.
  = never accesses LightRAG.
```

No:

```text
local semantic search
local BM25
local vector DB
local navigation search
hybrid merge
retrieval strategy/router framework
browser retrieval mode
browser top-k
browser reranker
browser document filters
browser LightRAG URL
browser workspace IDs
document tree
full document browser
raw original-file download
saved searches
query history
evidence/citation persistence
LLM synthesis
SSE
automatic retry
new worker
new queue
new status table
```

---

# 2. Scope

## Build

```text
one member evidence-query endpoint
one server-side query-target resolver
one private LightRAG retrieve method
one strict raw-hit mapper
one opaque encrypted source ref
one focused source-view route
one safe linked-asset route
minimal evidence UI
safe retrieval diagnostics
```

## Do not build

```text
answer generation
prompt assembly
chat history
citations in generated prose
cross-domain retrieval
cross-source retrieval
source selection
generic source navigator
document management UI
asset gallery
download original source
retrieval profiles
retrieval config UI
fallback retrieval
automatic provider switch
automatic retrieval retry
```

---

# 3. Core Rule

```text
LightRAG raw hit
  != evidence.

Mapped raw hit
  + exact SourceBlock identity
  + target source match
  + current source eligibility
  -> evidence.

Evidence
  -> user-visible.
  -> source-viewable.
  -> Phase 7 synthesis-eligible.
  -> Phase 7 citable.

Anything else
  -> discard.
```

```text
Unmapped
  -> discard.

Ambiguous
  -> discard.

Wrong source
  -> discard.

Deleted source
  -> discard.

Failed source
  -> discard.

Inactive domain
  -> reject query.

Document-only identity
  -> discard.

Fuzzy text match
  -> never map.

Nearest block match
  -> never map.
```

---

# 4. Preconditions From Earlier Phases

## 4.1 Phase 4 source model

Phase 4 provides:

```text
SourceDocument
  -> immutable prepared source.

SourceBlock
  -> stable UUID.
  -> source_id.
  -> ordinal.
  -> canonical text/Markdown.
  -> optional section/page metadata.

SourceAsset
  -> source_id.
  -> optional block_id.
  -> validated safe display artifact.
```

Rule:

```text
Prepared source content never mutates in place.

Changed source
  -> new source generation / new SourceDocument.
  -> old source fenced then deleted.

Stable SourceBlock UUID
  -> valid while source exists.
```

## 4.2 Phase 5 eligibility

Reuse Phase 5 function directly.

```python
source_is_query_eligible(source, domain)
```

No copied conditions.

Phase 6 query allowed only when:

```text
domain running
+ domain available
+ domain not deleting
+ source state=prepared
+ source index_state=ready
+ source no cancel/delete fence
```

## 4.3 One-source rule

Current product scope:

```text
one active source
per domain.
```

Browser selects domain only.

Browser never selects source or document.

---

# 5. Provenance Contract

Phase 6 blocked until pinned LightRAG contract proves exact block identity survives retrieval.

## 5.1 Required Phase 5 render marker

Phase 5 deterministic LightRAG input must render each block:

```text
[CE_BLOCK id=<source-block-uuid>]

<canonical block Markdown>
```

Example:

```text
[CE_SOURCE id=source-uuid schema=1]

[CE_BLOCK id=0d0cce75-58f9-4f64-b695-77e26165154e]
Inspection required after every 50,000 cycles.
```

## 5.2 Required retrieval proof

```text
prepared source
  -> deterministic render
  -> LightRAG submit
  -> native ready
  -> retrieval query
  -> returned raw hit retains one exact CE_BLOCK marker
  -> local SourceBlock resolves
```

Must prove:

```text
1. Returned raw hit contains exactly one CE_BLOCK marker.

2. Marker maps to one local SourceBlock.

3. SourceBlock belongs to active target source.

4. Marker survives LightRAG chunking/retrieval.

5. Deleted source no longer produces mapped evidence.

6. Old/stale remote hit cannot map after source fence/delete.
```

Not accepted:

```text
remote document ID only
remote chunk ID only
LightRAG file path
LightRAG metadata path
fuzzy text match
nearest block match
section-only match
page-only match
model-generated source ID
```

Rule:

```text
Raw hit contains zero CE_BLOCK markers
  -> discard.

Raw hit contains multiple CE_BLOCK markers
  -> discard.

Marker does not resolve exact target-source block
  -> discard.
```

No fallback.

---

# 6. Runtime Shape

```text
+--------+
| Member |
+--------+
    |
    | question
    v
+--------------------------------+
| Context Engine API             |
| - auth                         |
| - query target                 |
| - LightRAG retrieve            |
| - strict evidence map          |
| - opaque source refs           |
| - source view                  |
+--------------------------------+
       |                  |
       | PostgreSQL       | private network
       v                  v
+----------------+   +----------------------+
| Canonical      |   | Private LightRAG     |
| source model   |   | domain runtime       |
| - source       |   | - semantic retrieval |
| - blocks       |   | - graph retrieval    |
| - sections     |   +----------------------+
| - pages        |
| - assets       |
+----------------+
```

Rules:

```text
Browser
  -> Context Engine API only.

API
  -> private LightRAG runtime only.

Browser
  -> never receives raw LightRAG hit.

Browser
  -> never receives source ID.
  -> never receives block ID.
  -> never receives asset ID.
  -> never receives storage path.
  -> never receives LightRAG ID.
```

---

# 7. Canonical Ownership

| Concern                   | Canonical owner                      |
| ------------------------- | ------------------------------------ |
| User auth                 | Phase 1 application auth             |
| Domain availability       | Phase 3 domain service               |
| Source lifecycle          | Phase 4 source service               |
| Query eligibility         | Phase 5 `source_is_query_eligible()` |
| Runtime endpoint          | Phase 3 runtime resolver             |
| Semantic/graph retrieval  | LightRAG                             |
| Raw hit parsing           | Phase 5 `LightRAGClient.retrieve()`  |
| Raw hit acceptance        | Phase 6 `map_hit()`                  |
| Canonical source location | Phase 4 source model                 |
| Opaque ref encryption     | Existing app encryption helper       |
| Source navigation         | `source/navigation.py`               |
| Evidence response         | `retrieval/evidence.py`              |

No duplicate owner.

---

# 8. Lean Module Layout

```text
backend/
├── app/
│   ├── source/
│   │   ├── lightrag_client.py
│   │   ├── repository.py
│   │   ├── indexing.py
│   │   └── navigation.py
│   │
│   ├── retrieval/
│   │   └── evidence.py
│   │
│   ├── api/v1/
│   │   └── evidence.py
│   │
│   ├── schemas/
│   │   └── evidence.py
│   │
│   └── tests/
│       ├── unit/
│       ├── integration/
│       ├── contract/
│       └── compose/
│
└── client/
    └── src/
        └── features/
            ├── evidence-query/
            └── source-view/
```

## 8.1 Ownership

```text
source/lightrag_client.py
  -> Phase 5 submit/readiness/delete.
  -> Phase 6 retrieve.

retrieval/evidence.py
  -> QueryTarget.
  -> resolve_query_target().
  -> parse_block_marker().
  -> map_hit().
  -> query_evidence().

source/navigation.py
  -> make_source_ref().
  -> open_source_ref().
  -> build_source_view().
  -> make_asset_ref().
  -> stream_asset().

api/v1/evidence.py
  -> three HTTP routes.

schemas/evidence.py
  -> request/response DTOs only.
```

No:

```text
retrieval_engine/
strategy/
router/
hybrid_merger/
query_policy/
evidence_repository/
citation_repository/
query_history_repository/
source_ref_table/
source_ref_repository/
source_view_service/
adapter protocol/
plugin framework/
```

---

# 9. Query Target Resolution

Create one lightweight internal object.

```python
@dataclass(frozen=True)
class QueryTarget:
    domain_id: UUID
    source_id: UUID
    runtime_url: str
```

Create one function.

```python
def resolve_query_target(
    *,
    user: AuthenticatedUser,
    domain_id: UUID,
) -> QueryTarget:
    ...
```

Flow:

```text
1. Require authenticated user.

2. Load domain.

3. Verify:
   domain exists
   domain running
   domain available
   domain not deleting

4. Resolve current active source.

5. Call:
   source_is_query_eligible(source, domain).

6. Resolve private runtime URL.

7. Return QueryTarget.
```

No source ID from browser.

No document ID from browser.

No browser filter.

## 9.1 Failure contract

| Condition                        | HTTP | Code                       |
| -------------------------------- | ---: | -------------------------- |
| Missing/invalid session          |  401 | `authentication_required`  |
| Unknown domain                   |  404 | `domain_not_available`     |
| Stopped/inactive/deleting domain |  404 | `domain_not_available`     |
| Domain has no source             |  409 | `no_query_eligible_source` |
| Source not prepared/index-ready  |  409 | `no_query_eligible_source` |
| Source cancelled/deleting/failed |  409 | `no_query_eligible_source` |

Rule:

```text
Member route fails closed.

Cannot confirm active eligible source
  -> no retrieval.
```

---

# 10. LightRAG Retrieval

Extend existing Phase 5 concrete client.

```python
class LightRAGClient:
    def submit(...): ...
    def readiness(...): ...
    def delete(...): ...

    def retrieve(
        self,
        *,
        runtime_url: str,
        question: str,
        raw_hit_limit: int,
    ) -> list[RawLightRAGHit]:
        ...
```

No second query client.

No adapter protocol.

No fallback endpoint.

## 10.1 Raw hit model

```python
@dataclass(frozen=True)
class RawLightRAGHit:
    text: str
```

Do not preserve unused remote fields.

Do not expose raw hit outside retrieval module.

Do not persist raw hit.

## 10.2 Client responsibility

```text
private runtime URL
+ one pinned LightRAG endpoint
+ one pinned retrieval mode
+ request serialization
+ bounded timeout
+ response parsing
+ typed upstream error mapping
```

Client does not own:

```text
auth
domain scope
source eligibility
evidence mapping
source navigation
browser DTOs
retry
fallback
```

## 10.3 Server constants

```python
QUESTION_MAX_CHARS = 4_000
RAW_HIT_LIMIT = 12
EVIDENCE_LIMIT = 8
EVIDENCE_EXCERPT_MAX_CHARS = 1_200
LIGHTRAG_RETRIEVAL_TIMEOUT_SECONDS = 15
```

No DB retrieval profile.

No browser override.

No domain retrieval config.

No feature flag.

## 10.4 Upstream failure contract

| Condition                        | HTTP | Code                         |
| -------------------------------- | ---: | ---------------------------- |
| LightRAG timeout                 |  503 | `retrieval_unavailable`      |
| LightRAG unreachable             |  503 | `retrieval_unavailable`      |
| Runtime unhealthy                |  503 | `retrieval_unavailable`      |
| Invalid upstream response        |  502 | `retrieval_invalid_response` |
| Pinned endpoint contract failure |  502 | `retrieval_contract_error`   |

No automatic retry.

User submits another question.

No durable job.

No cleanup.

---

# 11. Strict Evidence Mapping

Create pure functions.

```python
def parse_block_marker(raw_text: str) -> UUID | None:
    ...

def map_hit(
    *,
    target: QueryTarget,
    raw_hit: RawLightRAGHit,
) -> MappedEvidence | None:
    ...
```

`MappedEvidence` remains internal.

```python
@dataclass(frozen=True)
class MappedEvidence:
    evidence_id: str
    source_ref: str

    document_title: str
    source_label: str
    section_title: str | None
    page_start: int | None
    page_end: int | None

    excerpt: str

    source_id: UUID
    block_id: UUID
    canonical_block_text: str
    asset_refs: tuple[str, ...]
```

Private fields:

```text
source_id
block_id
canonical_block_text
```

Browser DTO excludes private fields.

## 11.1 Mapping algorithm

```text
For each raw hit:

1. Parse exact CE_BLOCK marker.

2. No marker
   -> discard.

3. Multiple markers
   -> discard.

4. Load SourceBlock by marker ID.

5. No block
   -> discard.

6. Verify:
   block.source_id == target.source_id.

7. Re-load source/domain current state.

8. Call:
   source_is_query_eligible(source, domain).

9. Not eligible
   -> discard.

10. Build canonical local location:
    block
    + section title when known
    + page range when known
    + assets linked to block.

11. Build excerpt from canonical block text.
    Never raw LightRAG text.

12. Mint opaque source ref.

13. Return mapped evidence.
```

## 11.2 Deduplication

```text
Same SourceBlock appears in many raw hits
  -> retain first upstream result only.

Mapped evidence order
  -> retained raw LightRAG order.

Return max EVIDENCE_LIMIT.
```

No score normalization.

No client-visible score.

No reranker.

## 11.3 All hits rejected

```text
Raw hits exist
+ no valid map
  -> HTTP 200.
  -> kind=no_grounded_context.
```

No upstream detail exposed.

---

# 12. Evidence Query Flow

Create one orchestration function.

```python
def query_evidence(
    *,
    user: AuthenticatedUser,
    domain_id: UUID,
    question: str,
) -> EvidenceQueryResult:
    ...
```

Flow:

```text
question
  -> resolve_query_target()
  -> LightRAGClient.retrieve()
  -> map_hit() each raw hit
  -> dedupe
  -> return mapped evidence
  -> or return no_grounded_context
```

Pseudo-code:

```python
def query_evidence(*, user, domain_id, question):
    target = resolve_query_target(user=user, domain_id=domain_id)

    raw_hits = lightrag_client.retrieve(
        runtime_url=target.runtime_url,
        question=question,
        raw_hit_limit=RAW_HIT_LIMIT,
    )

    evidence_by_block: dict[UUID, MappedEvidence] = {}

    for raw_hit in raw_hits:
        evidence = map_hit(target=target, raw_hit=raw_hit)

        if evidence is None:
            continue

        evidence_by_block.setdefault(evidence.block_id, evidence)

        if len(evidence_by_block) == EVIDENCE_LIMIT:
            break

    return build_evidence_result(
        target=target,
        evidence=list(evidence_by_block.values()),
    )
```

No:

```text
local search.
fallback search.
secondary LightRAG endpoint.
automatic retry.
background job.
query persistence.
```

---

# 13. Opaque Source References

Use existing application authenticated encryption helper.

Do not create new database table.

Do not create dedicated encryption key unless Phase 1/2 has no application encryption key.

## 13.1 Source ref payload

```text
version
purpose=source_view
domain_id
source_id
block_id
expires_at
```

Output:

```text
s1.<encrypted-authenticated-payload>
```

Rules:

```text
Source ref does not expose:
  source ID
  block ID
  section ID
  page ID
  asset ID
  workspace ID
  storage path
  LightRAG ID
  filesystem path.

TTL
  = 30 minutes.

No user ID inside ref.
Shared trusted corpus makes user-binding unnecessary.

Ref
  != authorization.

Every open
  -> authenticate user.
  -> decrypt/verify ref.
  -> re-check current source/domain eligibility.
```

## 13.2 No generation field

Do not include source index generation.

Reason:

```text
Prepared source immutable.

Changed source
  -> new source + new block IDs.

Delete/cancel/state change
  -> current eligibility check blocks old ref.
```

---

# 14. Source Navigation

Source navigation opens exact mapped block.

Not a document browser.

Not local search.

Create functions.

```python
def make_source_ref(...): ...
def open_source_ref(...): ...
def build_source_view(...): ...
```

## 14.1 Open flow

```text
GET source ref
  -> require authenticated user
  -> decrypt + verify expiry
  -> verify purpose=source_view
  -> resolve_query_target(domain_id)
  -> target.source_id == ref.source_id
  -> load ref block
  -> block.source_id == target.source_id
  -> build focused source view
```

Failure:

```text
invalid ref
expired ref
tampered ref
inactive domain
deleted source
failed source
wrong source
missing block

  -> 404 source_not_available
```

One generic 404 prevents state leakage.

## 14.2 Focused source view

Return:

```text
document title
location label
focus block
one prior block
one next block
linked source assets
```

Rules:

```text
Prior/next block
  -> same section only.

No section
  -> focus block only.

No unrestricted source dump.

No full document tree.

No arbitrary block route.

No original-file route.

No raw LightRAG chunk.
```

## 14.3 Safe block content

```text
Return Phase 4 canonical text/Markdown only.

Browser Markdown renderer:
  HTML disabled.
  Script disabled.
  Unsafe URL schemes rejected.
```

Do not render raw uploaded HTML.

---

# 15. Source Assets

Asset route exists only for assets linked from a focused source view.

```text
GET /api/v1/source-assets/{asset_ref}
```

## 15.1 Asset ref payload

```text
version
purpose=source_asset
domain_id
source_id
asset_id
expires_at
```

Output:

```text
a1.<encrypted-authenticated-payload>
```

## 15.2 Asset open flow

```text
asset ref
  -> require authenticated user
  -> decrypt/verify
  -> resolve_query_target(domain_id)
  -> source match
  -> asset belongs to target source
  -> asset linked to allowed block/section
  -> stream safe artifact.
```

Rules:

```text
No direct asset ID route.

No raw storage URL.

No public static mount.

No original PDF/file download.

Use:
  Cache-Control: private, no-store
  X-Content-Type-Options: nosniff

Serve only Phase 4 validated display artifact types.
```

Failure:

```text
invalid/expired/foreign/missing asset ref
  -> 404 source_not_available
```

---

# 16. Member API

All routes:

```python
CurrentUser = Depends(require_authenticated_user)
```

| Method | Route                                  | Purpose                                               |
| ------ | -------------------------------------- | ----------------------------------------------------- |
| `POST` | `/api/v1/domains/{domain_id}/evidence` | Query one active domain. Return mapped evidence only. |
| `GET`  | `/api/v1/source-views/{source_ref}`    | Open one authorized mapped block.                     |
| `GET`  | `/api/v1/source-assets/{asset_ref}`    | Stream one authorized linked asset.                   |

No `/retrieve`.

No `/query`.

No legacy duplicate path.

No direct LightRAG proxy.

## 16.1 Evidence request

```python
class EvidenceQueryRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    question: Annotated[str, StringConstraints(
        strip_whitespace=True,
        min_length=1,
        max_length=QUESTION_MAX_CHARS,
    )]
```

Request:

```json
{
  "question": "What inspection interval applies to fatigue test 3?"
}
```

Rejected browser fields:

```text
sourceId
documentId
blockId
topK
mode
reranker
model
provider
runtimeUrl
LightRAG URL
debug
```

Extra fields:

```text
-> HTTP 422.
```

## 16.2 Evidence response

```json
{
  "kind": "evidence",
  "domain": {
    "id": "fatigue",
    "name": "Fatigue"
  },
  "evidence": [
    {
      "evidenceId": "e1",
      "excerpt": "Inspection required after every 50,000 cycles.",
      "sourceRef": "s1.opaque-value",
      "documentTitle": "Fatigue Manual",
      "sourceLabel": "Results > Fatigue Test 3 · Page 12",
      "sectionTitle": "Fatigue Test 3",
      "pageStart": 12,
      "pageEnd": 12,
      "assetRefs": [
        {
          "label": "Figure 4",
          "assetRef": "a1.opaque-value"
        }
      ]
    }
  ]
}
```

No grounded context:

```json
{
  "kind": "no_grounded_context",
  "domain": {
    "id": "fatigue",
    "name": "Fatigue"
  },
  "evidence": []
}
```

Never return:

```text
sourceId
documentId
blockId
sectionId
assetId
workspaceNodeId
sourcePath
storagePath
LightRAG URL
LightRAG track ID
LightRAG chunk ID
raw metadata
raw retrieval text
raw score
provider config
```

## 16.3 Source view response

```json
{
  "documentTitle": "Fatigue Manual",
  "locationLabel": "Results > Fatigue Test 3 · Page 12",
  "focusBlock": "Inspection required after every 50,000 cycles.",
  "before": "The test begins after baseline measurement.",
  "after": "Record inspection outcome in test log.",
  "assets": [
    {
      "label": "Figure 4",
      "assetRef": "a1.opaque-value"
    }
  ]
}
```

---

# 17. Browser Vertical Slice

Build smallest useful member UI.

```text
Available-domain selector
  -> Phase 3 available domains only.

Question field
  -> POST evidence request.

Evidence cards
  -> canonical excerpt.
  -> source label.
  -> Open source action.

Source side panel
  -> GET source view.
  -> focused source content.
  -> linked safe assets.
```

No:

```text
assistant answer bubble
fake synthesis
chat history
document tree
document browser
saved searches
query history
retrieval controls
source selection
client eligibility state
localStorage persistence
```

## 17.1 Browser state

```text
selectedDomainId
typedQuestion
evidenceResult
openSourceRef
sourceView
```

Rules:

```text
Memory only.

Reload
  -> clear.

No localStorage.

No persisted query history.
```

## 17.2 UI state contract

| State                    | UI behavior                                            |
| ------------------------ | ------------------------------------------------------ |
| Domain unavailable       | Show safe unavailable message. Clear current evidence. |
| No query-eligible source | Show “Domain content not ready.”                       |
| Retrieval unavailable    | Show safe temporary failure. User may submit again.    |
| No grounded context      | Show “No mapped source evidence found.”                |
| Evidence result          | Show cards. No answer text.                            |
| Source ref unavailable   | Close panel. Show “Source no longer available.”        |

---

# 18. Database and Storage

## 18.1 No Phase 6 persistence

```text
No Phase 6 tables.

No evidence table.

No citation table.

No query history table.

No source-ref table.

No asset-ref table.
```

Evidence remains request-scoped.

Refs expire without cleanup.

## 18.2 Reuse existing records

```text
domains
source_documents
source_blocks
source_sections
source_pages
source_assets
Phase 5 index state fields
```

## 18.3 Required lookup support

Phase 4 must support:

```text
SourceBlock lookup by ID.
SourceBlock ownership check by source_id.
Ordered adjacent block lookup by source_id + section + ordinal.
Asset lookup by source_id + block_id.
```

Check actual query plans first.

Add only missing narrow indexes.

Expected likely indexes:

```sql
CREATE INDEX ix_source_blocks_source_section_ordinal
ON source_blocks (source_id, section_id, ordinal);

CREATE INDEX ix_source_assets_source_block
ON source_assets (source_id, block_id);
```

No migration unless actual Phase 4 schema lacks needed index.

---

# 19. Reliability and Concurrency

## 19.1 Query behavior

```text
Evidence query
  = short request.
  = no durable job.
  = no write workflow.
  = no queue.

Client disconnect
  -> request ends.
  -> no cleanup required.

LightRAG timeout
  -> typed 503.
  -> user submits again.
```

## 19.2 Concurrent indexing/deletion

Retrieval must re-check eligibility after remote retrieval.

```text
Query starts
  -> target eligible.

Index/delete/stop happens during remote retrieval
  -> map_hit re-checks eligibility.
  -> evidence discarded.

Source ref opens later
  -> eligibility re-checked again.
  -> stale source view denied.
```

Rule:

```text
Remote retrieval result alone
  never proves present access eligibility.
```

## 19.3 No query lock

```text
Read-only retrieval
  -> no per-domain query lock.

Phase 5 worker
  owns remote mutation serialization.

Phase 6
  owns no remote mutation.
```

---

# 20. Logging

Log safe operational facts.

```text
request_id
actor_id
domain_id
source_id
question_char_count
raw_hit_count
mapped_evidence_count
discard_count_by_reason
retrieval_duration_ms
upstream_status_category
source_view_result
```

Never log:

```text
raw question
full retrieved text
full source content
source ref
asset ref
raw LightRAG payload
remote IDs
storage paths
cookies
tokens
provider secrets
```

No raw query/audit table.

No analytics platform.

---

# 21. Configuration

Add one setting only.

```dotenv
LIGHTRAG_RETRIEVAL_TIMEOUT_SECONDS=15
```

Use code constants:

```python
QUESTION_MAX_CHARS = 4_000
RAW_HIT_LIMIT = 12
EVIDENCE_LIMIT = 8
EVIDENCE_EXCERPT_MAX_CHARS = 1_200
SOURCE_REF_TTL_SECONDS = 1_800
```

No:

```text
browser top-k
browser mode
browser reranker
cache settings
retry settings
poll settings
fallback URLs
feature flags
search engine list
```

---

# 22. Build Order

## Step 0 — Prove provenance

```text
Pin LightRAG image.

Run real container fixture.

Prove:
  CE_BLOCK marker survives retrieval.
  one raw hit -> one exact local block.
  foreign marker rejected.
  deleted source cannot map.
```

Block Phase 6 if fixture fails.

Do not add fuzzy mapper.

Do not add fallback retrieval.

## Step 1 — Extend existing LightRAG client

```text
Add retrieve() to Phase 5 LightRAGClient.

One endpoint.
One mode.
One timeout.
One raw text result type.
```

## Step 2 — Query target resolver

```text
Implement QueryTarget.

Implement resolve_query_target().

Reuse source_is_query_eligible().
```

## Step 3 — Strict mapper

```text
Implement parse_block_marker().

Implement map_hit().

Canonical local excerpt only.

Dedupe by SourceBlock ID.
```

## Step 4 — Opaque refs + source view

```text
Implement encrypted source refs.

Implement focused block source view.

Implement asset refs + safe stream.
```

## Step 5 — API

```text
POST evidence query.

GET source view.

GET source asset.

Typed failures.
OpenAPI docs.
```

## Step 6 — Browser slice

```text
Domain selector.

Question input.

Evidence cards.

Source side panel.
```

## Step 7 — Remove old paths

```text
No direct retrieve endpoint.

No local semantic retrieval.

No hybrid merge.

No local navigation search.

No browser retrieval controls.

No direct source/document/asset ID routes.
```

## Step 8 — Proof

```text
Unit tests.

PostgreSQL integration tests.

Real LightRAG contract fixture.

Browser E2E happy path.

Security response-shape test.
```

---

# 23. Test Gate

Must pass:

```text
Active domain + ready source
  -> user query
  -> mapped evidence
  -> user opens source view.

Raw hit missing CE_BLOCK
  -> discarded.

Raw hit with multiple CE_BLOCK markers
  -> discarded.

Raw hit with unknown block marker
  -> discarded.

Raw hit with block from foreign source
  -> discarded.

All raw hits discarded
  -> HTTP 200 no_grounded_context.

Domain stops after evidence response
  -> source ref returns 404 source_not_available.

Source deleted after evidence response
  -> source ref returns 404 source_not_available.

Source changes from ready to cancelling during retrieval
  -> raw result discarded.

Tampered source ref
  -> 404 source_not_available.

Expired source ref
  -> 404 source_not_available.

Foreign/expired asset ref
  -> 404 source_not_available.

Request injects:
  sourceId
  documentId
  topK
  mode
  reranker
  model
  provider
  runtimeUrl
  -> HTTP 422.

Response contains no:
  source IDs
  block IDs
  asset IDs
  storage paths
  workspace IDs
  LightRAG IDs
  raw retrieval payload.

No local semantic retrieval.

No hybrid merger.

No evidence/citation/query-history persistence.
```

---

# 24. Definition of Done

```text
One member evidence-query route exists.

One server-side QueryTarget resolver owns eligibility.

One existing LightRAG client owns private retrieval.

Only exact SourceBlock maps become evidence.

Unmapped/ambiguous/foreign hits never reach browser.

Browser gets opaque refs only.

Every source open re-checks current eligibility.

Deleted, failed, inactive, stale, unmapped, or foreign content cannot retrieve, open, cite, or reach Phase 7 synthesis.

Source navigation resolves exact block only.

No local search.

No synthesis.

No local fallback.

No browser retrieval controls.

No new persistence except proven missing indexes.
```

## Final Boundary

```text
Phase 5

prepared source
  -> private LightRAG handoff
  -> native ready
  -> query eligible

Phase 6

eligible source
  -> scoped LightRAG retrieval
  -> exact block mapping
  -> opaque source ref
  -> focused authorized source view

Phase 7

mapped evidence
  -> bounded synthesis context
  -> streamed answer
  -> citations
```
