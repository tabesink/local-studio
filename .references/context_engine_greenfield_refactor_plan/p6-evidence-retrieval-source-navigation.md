# Context Engine — Phase 6: Scoped Evidence Retrieval

**Status:** Greenfield implementation plan
**Build style:** API-first. One retrieval path. Low entropy.
**Depends on:** Phase 1 auth; Phase 3 domains; Phase 4 canonical source model; Phase 5 private LightRAG indexing + query eligibility.

---

# 0. Goal

User queries one active domain.

System returns only evidence mapped to one exact authorized `SourceBlock`.

No source navigation. No answer synthesis.

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
  -> safe evidence cards

Later Phase 7

mapped evidence
  -> bounded synthesis context
  -> streamed answer
  -> evidence citations

Later separate slice

mapped evidence
  -> authorized source navigation
```

Phase 6 traceability means:

```text
Evidence shown to user
  -> internally maps to exact local SourceBlock
  -> shows safe source label
  -> can later support citation/navigation.

Phase 6 does not let user open source content.
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
  = safe evidence-card owner.

Browser
  = submits question.
  = receives mapped evidence only.
  = never selects source/document.
  = never accesses LightRAG.
  = never opens source content in Phase 6.
```

No:

```text
source navigation
source refs
asset refs
source-view routes
asset routes
document browser
document tree
original-file download
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
safe evidence cards
minimal evidence-only UI
safe retrieval diagnostics
```

## Explicitly deferred

```text
LLM synthesis
streaming
citations in generated prose
source navigation
source panel
source previews
linked figures/tables/images
document management UI
cross-domain retrieval
cross-source retrieval
browser source selection
retrieval config UI
local fallback retrieval
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
  -> shown with safe source label.
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
```

Rule:

```text
Prepared source content never mutates in place.

Changed source
  -> new SourceDocument.
  -> new SourceBlock IDs.
  -> old source fenced then deleted.
```

## 4.2 Phase 5 eligibility

Reuse Phase 5 function directly.

```python
source_is_query_eligible(source, domain)
```

No copied eligibility conditions.

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

Current scope:

```text
one active source
per domain.
```

Browser selects domain only.

Browser never selects source or document.

---

# 5. Provenance Contract

Phase 6 blocked until pinned LightRAG contract proves exact block identity survives retrieval.

## 5.1 Phase 5 render marker

Phase 5 deterministic LightRAG input renders each block:

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
  -> raw hit retains one exact CE_BLOCK marker
  -> local SourceBlock resolves
```

Must prove:

```text
1. Raw hit contains exactly one CE_BLOCK marker.

2. Marker maps to one local SourceBlock.

3. SourceBlock belongs to active target source.

4. Marker survives LightRAG chunking/retrieval.

5. Deleted source no longer produces mapped evidence.

6. Delayed/stale remote hit cannot map after source fence/delete.
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
| - safe evidence response       |
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
│   │   └── indexing.py
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
            └── evidence-query/
```

Ownership:

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

api/v1/evidence.py
  -> one HTTP route.

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
source_navigation/
source_view_service/
adapter protocol/
plugin framework/
```

---

# 9. Query Target Resolution

Create one small internal object.

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

4. Resolve active domain source.

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
Cannot prove active eligible source
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
    source_label: str
    excerpt: str

    source_id: UUID
    block_id: UUID
    canonical_block_text: str
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

10. Build source label:
    document title
    + section title when known
    + page label when known.

11. Build excerpt from canonical block text.
    Never raw LightRAG text.

12. Return mapped evidence.
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

    evidence_by_block = {}

    for raw_hit in raw_hits:
        evidence = map_hit(target=target, raw_hit=raw_hit)

        if evidence is None:
            continue

        evidence_by_block.setdefault(evidence.block_id, evidence)

        if len(evidence_by_block) == EVIDENCE_LIMIT:
            break

    return build_evidence_result(
        evidence=list(evidence_by_block.values()),
    )
```

No:

```text
local search
fallback search
secondary LightRAG endpoint
automatic retry
background job
query persistence
```

---

# 13. Member API

All routes:

```python
CurrentUser = Depends(require_authenticated_user)
```

| Method | Route                                  | Purpose                                           |
| ------ | -------------------------------------- | ------------------------------------------------- |
| `POST` | `/api/v1/domains/{domain_id}/evidence` | Query active domain. Return mapped evidence only. |

No `/retrieve`.

No `/query`.

No duplicate legacy route.

No source route.

No asset route.

No direct LightRAG proxy.

## 13.1 Evidence request

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

Rejected fields:

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
debug
```

Extra fields:

```text
-> HTTP 422.
```

## 13.2 Evidence response

```json
{
  "kind": "evidence",
  "evidence": [
    {
      "evidenceId": "e1",
      "excerpt": "Inspection required after every 50,000 cycles.",
      "sourceLabel": "Fatigue Manual · Fatigue Test 3 · Page 12"
    }
  ]
}
```

No grounded context:

```json
{
  "kind": "no_grounded_context",
  "evidence": []
}
```

`evidenceId`:

```text
response-local.
not persistent.
not source locator.
later Phase 7 citation anchor.
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

---

# 14. Browser Vertical Slice

Build minimum member surface.

```text
Available-domain selector
  -> Phase 3 available domains only.

Question field
  -> POST evidence request.

Evidence list
  -> canonical excerpt.
  -> safe source label.
  -> no Open source action.
```

No:

```text
assistant answer bubble
fake synthesis
chat history
source panel
document tree
document browser
saved searches
query history
retrieval controls
source selection
client eligibility state
localStorage persistence
```

## 14.1 Browser state

```text
selectedDomainId
typedQuestion
evidenceResult
```

Rules:

```text
Memory only.

Reload
  -> clear.

No localStorage.

No persisted query history.
```

## 14.2 UI state contract

| State                    | UI behavior                                    |
| ------------------------ | ---------------------------------------------- |
| Domain unavailable       | Show safe unavailable message. Clear evidence. |
| No query-eligible source | Show “Domain content not ready.”               |
| Retrieval unavailable    | Show temporary failure. User may submit again. |
| No grounded context      | Show “No mapped source evidence found.”        |
| Evidence result          | Show evidence cards. No answer text.           |

---

# 15. Database and Storage

## 15.1 No Phase 6 persistence

```text
No Phase 6 tables.

No evidence table.

No citation table.

No query-history table.

No source-ref table.

No asset-ref table.
```

Evidence remains request-scoped.

## 15.2 Reuse existing records

```text
domains
source_documents
source_blocks
source_sections
source_pages
Phase 5 index state fields
```

## 15.3 Required lookup support

Phase 4 must support:

```text
SourceBlock lookup by ID.
SourceBlock ownership check by source_id.
SourceBlock source label fields:
  document title
  section title
  page number/range.
```

Check actual query plan first.

Add only missing narrow indexes.

Likely only if needed:

```sql
CREATE INDEX ix_source_blocks_source_id
ON source_blocks (source_id);
```

No migration unless Phase 4 schema lacks equivalent support.

---

# 16. Reliability and Concurrency

## 16.1 Query behavior

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

## 16.2 Concurrent indexing/deletion

Re-check eligibility after remote retrieval.

```text
Query starts
  -> target eligible.

Index/delete/stop happens during remote retrieval
  -> map_hit re-checks eligibility.
  -> evidence discarded.
```

Rule:

```text
Remote retrieval result alone
  never proves current access eligibility.
```

## 16.3 No query lock

```text
Read-only retrieval
  -> no per-domain query lock.

Phase 5 worker
  owns remote mutation serialization.

Phase 6
  owns no remote mutation.
```

---

# 17. Logging

Log safe facts only.

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
```

Never log:

```text
raw question
full retrieved text
full source content
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

# 18. Configuration

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

# 19. Build Order

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

Failure:

```text
Fixture fails
  -> Phase 6 blocked.

Do not add fuzzy mapper.
Do not add local fallback.
```

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

## Step 4 — API

```text
POST evidence query.

Typed failures.

OpenAPI docs.
```

## Step 5 — Browser slice

```text
Domain selector.

Question input.

Evidence cards.

No source-navigation action.
```

## Step 6 — Remove old paths

```text
No direct retrieve endpoint.

No local semantic retrieval.

No hybrid merge.

No local navigation search.

No browser retrieval controls.

No direct source/document/asset routes.
```

## Step 7 — Proof

```text
Unit tests.

PostgreSQL integration tests.

Real LightRAG contract fixture.

Browser E2E happy path.

Security response-shape test.
```

---

# 20. Test Gate

Must pass:

```text
Active domain + ready source
  -> user query
  -> mapped evidence cards.

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

Domain stops during retrieval
  -> raw result discarded.

Source deleted during retrieval
  -> raw result discarded.

Source changes ready -> cancelling during retrieval
  -> raw result discarded.

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
  storage paths
  workspace IDs
  LightRAG IDs
  raw retrieval payload.

No local semantic retrieval.

No hybrid merger.

No evidence/citation/query-history persistence.
```

---

# 21. Definition of Done

```text
One member evidence-query route exists.

One server-side QueryTarget resolver owns eligibility.

One existing LightRAG client owns private retrieval.

Only exact SourceBlock maps become evidence.

Unmapped/ambiguous/foreign hits never reach browser.

Browser receives safe evidence labels only.

Deleted, failed, inactive, stale, unmapped, or foreign content cannot reach evidence output or future Phase 7 synthesis.

No source navigation.

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
  -> safe evidence cards

Phase 7

mapped evidence
  -> bounded synthesis context
  -> streamed answer
  -> citations

Later source-navigation slice

mapped evidence
  -> authorized source view
```
