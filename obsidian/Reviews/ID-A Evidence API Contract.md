---
type: id-a
phase: P6
feature: F-006
status: active
layer:
  - api
contract: API-001
spec: specs/04-features/F-006-scoped-evidence-retrieval/spec.md
audience: junior-dev
lifecycle: review
tags:
  - phase/p6
  - feature/f-006
  - type/id-a
  - review/id-a
  - contract/api
  - layer/api
  - status/active
---

# ID-A — Evidence API Contract

Parent: [[P6 Index]]

**Question:** Can the P6 route be implemented from the current endpoint catalog alone?

### Decision

No. API-001 lists `POST /domains/{domain_id}/evidence`, but P6 still needs **field-level** request, success, and fallback shapes before route code. Patch API-001 first.

This note resolves **A1** (request), **A3** (no eligible source), and **A4** (no mapped evidence). **A2** (Evidence card fields and limits) lives in [[ID-A Safe Evidence DTO]].

### Why

| Missing shape | Risk |
| --- | --- |
| Request body | Client and backend disagree on field names, strictness, limits |
| Success body | Developers expose ids, scores, raw hits, or full block text |
| No eligible source | P6 AC-003 needs a safe distinct `409`, not a generic error |
| No mapped evidence | P6 AC-004 needs `no_grounded_context`, not empty 404 or generic 200 |

---

## A1 — Request body

**Use `question` only.** Strict DTO. Unknown fields → `422`.

```json
POST /api/v1/domains/{domain_id}/evidence

{ "question": "What inspection interval applies?" }
```

| Rule | Value |
| --- | --- |
| Required field | `question: string` (non-empty after trim) |
| Max length | `QUESTION_MAX_CHARS = 4000` (server-owned) |
| Unknown fields | Rejected → `422 validation_error` |
| Browser controls | **None** — no `mode`, `top_k`, `document_ids`, `query`, etc. |

**Do not port** old CE retrieve body (`query`, retrieval mode, top-k, document filters). Query eligibility is server-side via `source_is_query_eligible()`, not a request field.

### A1 validation errors

| Case | Status | `error.code` |
| --- | --- | --- |
| Missing/blank `question` | 422 | `validation_error` |
| `question` over 4000 chars | 422 | `validation_error` |
| Unknown JSON fields | 422 | `validation_error` |
| Domain slug invalid | 422 | `validation_error` |

Use global envelope: `{ "error": { "code", "message", "requestId", "fields?" } }`.

Domain lifecycle conflicts (deleting domain, unavailable domain) use existing **P3** codes such as `domain_state_conflict` — not mixed with evidence-specific fallbacks.

---

## A2 — Success Evidence DTO

See [[ID-A Safe Evidence DTO]] for `evidenceId`, `excerpt`, `sourceLabel`, limits, and forbidden fields.

Success when at least one hit maps:

```json
{
  "kind": "evidence",
  "evidence": [
    {
      "evidenceId": "ev-01",
      "excerpt": "Inspection required after every 50,000 cycles.",
      "sourceLabel": "Fatigue Manual — Inspection — p.12"
    }
  ]
}
```

| Constant | Value |
| --- | --- |
| `RAW_HIT_LIMIT` | 12 |
| `EVIDENCE_LIMIT` | 8 |
| `EVIDENCE_EXCERPT_MAX_CHARS` | 1200 |

---

## A3 — No query-eligible source (`409`)

When the domain is available for the call but **zero** Source Documents pass `source_is_query_eligible()`:

```json
HTTP 409

{
  "error": {
    "code": "no_query_eligible_source",
    "message": "No query-eligible sources are available for this domain.",
    "requestId": "<safe-request-id>"
  }
}
```

| Distinction | Meaning |
| --- | --- |
| `no_query_eligible_source` | Domain reachable; nothing indexed/ready/eligible to query |
| `no_grounded_context` (A4) | Eligible sources exist; retrieval ran but **every hit was discarded** |

Do **not** return a success body with empty `evidence` for A3. That collapses two different product outcomes.

P6 AC-003: no eligible source → contracted safe `409`.

---

## A4 — No mapped evidence (`200`)

When at least one source is query-eligible, private retrieve runs, but **all raw hits are discarded** (no marker, bad marker, foreign block, ineligible source, etc.):

```json
HTTP 200

{
  "kind": "no_grounded_context",
  "evidence": []
}
```

| Distinction | HTTP | Body |
| --- | --- | --- |
| Mapped hits found | 200 | `kind: "evidence"`, `evidence[1..8]` |
| Hits discarded after retrieve | 200 | `kind: "no_grounded_context"`, `evidence: []` |
| No eligible sources at all | 409 | A3 error envelope only |

P6 AC-004: all hits discarded → `no_grounded_context` (not an error status).

P7 chat reuses the same mapper; SSE terminal may also emit `no_grounded_context` when synthesis has nothing to ground on.

---

## Full route matrix

```text
POST /api/v1/domains/{domain_id}/evidence
  { "question": "..." }

-> 401/403        auth failure (global)
-> 422            validation_error (A1)
-> 409            domain_state_conflict / domain_operation_in_progress (P3)
-> 409            no_query_eligible_source (A3)
-> 200            kind=evidence, evidence[1..8] (A2)
-> 200            kind=no_grounded_context, evidence=[] (A4)
-> 503/504        safe retrieval timeout/unavailable (patch exact code in API-001)
```

---

## Forbidden in every success response

```text
sourceBlockId, sourceDocumentId
raw LightRAG id, raw score, raw hit text
storage paths, runtime URLs
provider payload, prompt, stack trace
full canonical Source Block markdown (untruncated)
```

---

## Implementation order

```text
1. Patch API-001 with A1 request, A2 EvidenceItem, A3 409, A4 200 fallback.
2. Add OpenAPI snapshot for POST .../evidence.
3. Implement strict request validation (question only).
4. Wire authz: member + admin on available domains.
5. Return only mapper-produced safe DTOs.
6. Separate A3 (409) from A4 (200 no_grounded_context) in service + tests.
```

---

## Red flags in PR

- Route lands before API-001 field-level patch
- Request accepts `query` or browser retrieval knobs
- Evidence DTO includes ids "for future navigation"
- `no_query_eligible_source` and `no_grounded_context` share one code path
- Raw score or raw hit appears in snapshots
- Empty `200` used when no eligible sources exist

---

## Tests

- OpenAPI snapshot captures P6 route request + all response variants
- DTO snapshot proves no forbidden fields
- Strict body: unknown field → 422; blank question → 422
- Member on available domain with eligible source → 200 `kind=evidence`
- No eligible source → 409 `no_query_eligible_source` (exact envelope)
- All hits discarded → 200 `kind=no_grounded_context`, `evidence: []`
- A3 and A4 are not interchangeable in integration tests

### One-line summary

Patch API-001 before coding P6: **`question` in**, safe **`kind` + evidence[]** out, **`409 no_query_eligible_source`** when nothing is eligible, **`200 no_grounded_context`** when retrieval maps nothing.

## Related

- [[ID-A Safe Evidence DTO]]
- [[P6 Evidence And Asset Delivery]]
- [[ID-A Query Eligibility]]
- [[P6 Index]]

## Repo sources

- `.devnotes/P5-post-impl-REVIEW/ID-A-evidence-api-contract.md`
- `.devnotes/P5-post-impl-REVIEW/F-006-P6-readiness.md` (A1, A3, A4)
- `.references/context_engine_fullstack_impl_docs/phase_plan/P6_scoped_evidence_retrieval.md`
- `specs/04-features/F-006-scoped-evidence-retrieval/spec.md`
- `specs/03-contracts/api/context-engine-v1.md`
