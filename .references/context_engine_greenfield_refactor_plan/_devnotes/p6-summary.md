# Phase 6 Summary — Evidence Retrieval (Junior Dev)

**Depends on:** P1 auth, P3 domains, P4 source model, P5 LightRAG indexing + eligibility.

---

## What user gets

Member picks **domain** → types **question** → sees **evidence cards** (excerpt + safe source label).

**Not in P6:**
- No AI answer / synthesis (P7)
- No open source / navigation / previews
- No source/doc picker in browser
- No chat history, saved searches, query history

One domain → one active source. Server picks source. Browser never sees source/block IDs.

---

## Core flow

```text
question
  -> auth + resolve active domain + eligible source
  -> private LightRAG retrieve (semantic + graph)
  -> map each raw hit -> exact SourceBlock via CE_BLOCK marker
  -> dedupe, cap at 8 cards
  -> safe response (excerpt + sourceLabel only)
```

**Golden rule:** LightRAG raw hit ≠ evidence. Only hit with **exactly one** `[CE_BLOCK id=<uuid>]` marker that maps to eligible local block → evidence. Everything else → discard.

Never fuzzy match. Never nearest block. Never document-only ID.

---

## Who owns what

| Layer | Owns |
| --- | --- |
| LightRAG | Semantic/graph retrieval only |
| Context Engine API | Auth, eligibility, mapping, safe response |
| Browser | Submit question, show cards — nothing else |

Browser never talks to LightRAG. Never gets raw hits, IDs, paths, scores.

---

## API

**One route:** `POST /api/v1/domains/{domain_id}/evidence`

**Request:** `{ "question": "..." }` only (max 4000 chars). Extra fields → 422.

**Response success:**
```json
{ "kind": "evidence", "evidence": [{ "evidenceId": "e1", "excerpt": "...", "sourceLabel": "Doc · Section · Page 12" }] }
```

**No matches (still 200):**
```json
{ "kind": "no_grounded_context", "evidence": [] }
```

**Errors:** 401 auth, 404 bad domain, 409 no eligible source, 502/503 LightRAG fail. No auto-retry.

---

## Backend modules

```text
source/lightrag_client.py     — add retrieve() to P5 client
retrieval/evidence.py         — QueryTarget, resolve_query_target(), parse_block_marker(), map_hit(), query_evidence()
api/v1/evidence.py            — one HTTP route
schemas/evidence.py           — DTOs
client/features/evidence-query/ — minimal UI slice
```

**Constants (server-only, no browser override):**
- Raw hits: 12 max
- Evidence returned: 8 max
- Excerpt: 1200 chars max
- LightRAG timeout: 15s

**map_hit() checks:**
1. Parse one CE_BLOCK marker
2. Load SourceBlock by UUID
3. Block belongs to target source
4. Re-check `source_is_query_eligible()` (race-safe)
5. Excerpt from **canonical block text**, not raw LightRAG text
6. Dedupe by block_id, keep LightRAG order

---

## UI slice

State (memory only, reload clears): `selectedDomainId`, `typedQuestion`, `evidenceResult`

| State | Show |
| --- | --- |
| Domain down | Unavailable msg |
| Source not ready | "Domain content not ready." |
| LightRAG fail | Temp failure, retry allowed |
| No mapped hits | "No mapped source evidence found." |
| Evidence | Cards only — no answer bubble |

---

## DB / persistence

**No new P6 tables.** No evidence/citation/query history storage. Evidence = request-scoped.

Reuse: domains, source_documents, source_blocks. Maybe add index on `source_blocks(source_id)` if missing.

---

## Build order

0. **Prove provenance** — CE_BLOCK survives LightRAG retrieval in real fixture. Block P6 if fails.
1. Extend `LightRAGClient.retrieve()`
2. `QueryTarget` + `resolve_query_target()` (reuse P5 eligibility fn)
3. `parse_block_marker()` + `map_hit()` + dedupe
4. POST evidence API + typed errors
5. Browser: domain picker, question input, evidence cards
6. Remove old retrieve/local-search/hybrid/browser-control paths
7. Tests: unit, PG integration, LightRAG contract, E2E, security shape

---

## Done when

- One evidence route, one resolver, one LightRAG retrieve path
- Only exact SourceBlock maps reach browser
- Response has no sourceId/blockId/paths/LightRAG IDs
- No synthesis, navigation, local search, fallback, persistence
- All test gate cases pass (discard bad hits, 422 on injected params, race during retrieval)

---

## Phase boundaries

```text
P5: source indexed → query eligible
P6: question → mapped evidence cards        ← you are here
P7: evidence → streamed answer + citations
Later: evidence → authorized source view
```
