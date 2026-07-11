# Residual review findings — feat/document-pdf-preview

Source review: focused generalPurpose review of `65fabce9..HEAD` against
`docs/plans/2026-07-10-004-feature-document-pdf-preview-plan.md` (2026-07-10).

Verdict was **ship** (no P0/P1 actionable findings). The following P2 items were
accepted as known residuals after a small follow-up fix for delete/domain-switch
races in `DocumentsPage.tsx`.

## Accepted residuals

| Severity | File | Title | Notes |
| --- | --- | --- | --- |
| P2 | `tests/snapshots/f008_openapi.json` | OpenAPI preview 200 typed as JSON | Runtime returns binary/text with stored Content-Type + `Cache-Control: private, no-store`. FastAPI snapshot still documents `application/json` for the 200. Follow-up: annotate route media types and regenerate snapshot. |
| P2 | `tests/test_sources.py` | Coverage gaps vs API-001 | Missing explicit unauthenticated 401, `domain_runtime_unavailable` 502, path scrub on error headers, and E2E member PDF (member path asserts markdown only). Docx/missing-file/path scrub on body already covered. |
| P2 | plan residual | Browser PDF chrome may allow save | Accepted by product plan; no Download control / no attachment disposition. |

## Residual risks (non-blocking)

- Preview reuses evidence `domain_available` (runtime health) per KTD-2.
- OSError `__cause__` chains may still carry filesystem paths into verbose server exception logs; API envelopes remain bland.
- Full originals up to the 25 MiB upload cap are buffered in server `Response` and client blob/text state.
