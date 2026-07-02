# ID-A - Evidence API contract (junior dev explainer)

Parent: [ID-A.md](./ID-A.md)

Related docs: `specs/04-features/F-006-scoped-evidence-retrieval/spec.md`, `specs/03-contracts/api/context-engine-v1.md`, `specs/03-contracts/ai/grounded-answering.md`, `specs/05-quality/security-and-privacy.md`.

**Question:** Can the P6 route be implemented from the current endpoint catalog alone?

### Decision

No. API-001 names `POST /domains/{domain_id}/evidence`, but P6 still needs exact request, response, and fallback shapes before code.

This is a contract gap, not an implementation detail.

### Why

| Missing shape | Risk |
| --- | --- |
| Request body | Browser/client and backend may disagree on `question` naming, strictness, and limits. |
| Evidence DTO | Developers may expose ids, raw scores, raw hit text, or too much Source Block content. |
| No eligible source response | P6 AC-003 requires a safe `409`, but exact envelope/code must be named. |
| No mapped evidence response | P6 AC-004 requires `no_grounded_context`, but body/status must be named. |

### Exact Contract Sketch

Patch API-001 before route code. Keep fields safe and minimal:

```text
POST /api/v1/domains/{domain_id}/evidence

Request:
  question: string

Response:
  evidence: safe Evidence DTO[]
  result: evidence_found | no_grounded_context
  requestId: safe request id if already part of the envelope pattern
```

Open decision: exact field names, excerpt limits, source label fields, and fallback status/body.

Forbidden in response: Source Block id, Source Document id, raw LightRAG id, raw score, raw hit, path, runtime URL, provider payload, prompt, stack trace, full canonical Markdown.

### Implement Order

1. Patch API-001 with exact P6 route body, success DTO, and fallback/errors.
2. Add OpenAPI snapshot expectations.
3. Implement route validation and authz.
4. Return only mapper-produced safe DTOs.

### Red Flags In PR

- Route code lands before API-001 has P6 field-level shape.
- Evidence DTO includes ids because the frontend might need navigation later.
- `no eligible source` and `no grounded context` collapse to one generic error.
- Raw score or raw hit payload appears in snapshots.

### Tests

- OpenAPI snapshot captures the P6 route.
- DTO snapshot proves no forbidden fields appear.
- Member call to available domain succeeds when Evidence exists.
- No eligible source returns the exact contracted `409`.
- All hits discarded returns the exact contracted `no_grounded_context` body.

### One-line summary

Name the P6 API shape before coding it; Evidence DTOs are product contracts.
