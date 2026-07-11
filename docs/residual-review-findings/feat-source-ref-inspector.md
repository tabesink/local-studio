# Known residuals — feat/source-ref-inspector

Source review: ce-code-review mode:agent against `docs/plans/2026-07-10-005-feature-source-ref-inspector-plan.md` (base `8bea10c`), 2026-07-11.

## Applied in follow-up

- **P1 Browser Back / AE3:** stamp jump-from turn with `history.pushState` before Library `router.push`; Playwright asserts `page.goBack()` restores `/chat?conversationId&turnId`.
- **P1 AE1 page assert:** when resolve returns `page`, e2e asserts URL `page` and pdf.js `data-page`.
- **P2 Missing deep-link source:** Library sets preview `unavailable` when citation `sourceId` is absent from the loaded list.

## Accepted residuals

| Item | Severity | Notes |
| --- | --- | --- |
| OpenAPI snapshot omits resolve 401/404/409 envelopes | P3 | Repo-wide FastAPI snapshot pattern; runtime + API-001 cover codes. |
| AE5 markdown Evidence→Library path not dedicated e2e | testing gap | Happy path accepts text preview when evidence cites markdown. |
| AE6 concurrent multi-member jump | testing gap | Backend proves sequential independent resolves; no dual-browser e2e. |
| Evidence Panel desktop+mobile dual DOM (CSS-hidden) | P3 | Scoped Playwright assertions; conditional unmount deferred. |
| Exact PDF page jump depends on `page_start` in seed evidence | product limit | Asserted when resolve returns page; otherwise open-at-start is correct. |
