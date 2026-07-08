# ce-code-review — `ms-spec-driven`

**Scope:** Full branch diff vs `7ce1e457` (Initial commit → P11 implemented)  
**Stats:** 981 files · +164,408 / −28,278 lines  
**Mode:** Interactive (report only — no auto-apply in this run)  
**Verification:** `.venv/bin/pytest tests/` → **94 passed, 2 failed** · `frontend npm test` → **7 passed**

---

## Intent Summary

Greenfield Context Engine rebuild (P1–P11): trusted auth foundation, runtime config, knowledge domains, source prep/indexing, LightRAG integration, grounded chat/SSE, conversations, observability, wiki curation, and Next.js frontend shell replacing deleted `webui/`.

---

## Severity Summary

| P0 | P1 | P2 | P3 |
| --: | --: | --: | --: |
| 2 | 9 | 18 | 12 |

---

## P0 — Stop Before Merge

| # | Title | File | Autofix |
| --: | --- | --- | --- |
| **1** | Next.js API proxy never runs — `proxy.ts` is not `middleware.ts` | `frontend/src/proxy.ts` | `gated_auto` |
| **2** | Worker claim has no row lock — double-claim race on Postgres | `context_engine/services/domains.py:751` | `manual` |

### #1 — Dead API proxy (FE)

**Evidence:** Next.js only loads `src/middleware.ts`. Repo has `src/proxy.ts` with matcher `/api/v1/*` but no `middleware.ts`. All `ceFetch("/api/v1/...")` calls hit the Next router, not the backend.

**Fix:** Rename `proxy.ts` → `middleware.ts`. Update `next.config.ts` comment.

**Owner:** frontend

---

### #2 — Worker double-claim race (TST)

**Evidence:** `DomainDeleteWorker._claim_next_operation` and `SourceIndexWorker._claim_next_source` use plain `SELECT` then `UPDATE` + `commit` with no `with_for_update(skip_locked=True)`. Two worker processes can claim the same row.

**Fix:** Add `SELECT … FOR UPDATE SKIP LOCKED` on both claim queries.

**Owner:** backend

---

## P1 — Fix In This PR Or Explicitly Defer

| # | Title | File | Autofix |
| --: | --- | --- | --- |
| **3** | Delete worker returns `True` when domain row gone — op stuck RUNNING | `domains.py:695` | `gated_auto` |
| **4** | Domain redaction can be overwritten by in-flight stream | `chat_turns.py:1023` | `manual` |
| **5** | Wiki DTO emits `pageId` — contract requires `wikiPageId` | `wiki.py:175` | `gated_auto` |
| **6** | Wiki revision missing `publishedAt` / model has no `published_at` | `models.py`, `wiki.py:182` | `manual` |
| **7** | Wiki contribution DTO missing `publishedPageId`, `publishedRevisionId` | `wiki.py:140` | `gated_auto` |
| **8** | Wiki evidence ref DTO missing `id` field | `wiki.py:131` | `gated_auto` |
| **9** | Disabled users stay authenticated in frontend | `auth-store.ts:56` | `manual` |
| **10** | Migration 0007 downgrade drops `request_id` with no compensation | `migrations/.../0007_*.py:99` | `manual` |
| **11** | No test for delete-worker domain-gone path (blocks validating #3) | `tests/test_domains.py` | `manual` |

---

## P2 — Should Fix

| # | Title | File | Autofix |
| --: | --- | --- | --- |
| **12** | No login rate limiting | `routes.py:247` | `manual` |
| **13** | `samesite=none` not gated on `secure=True` | `config.py:44` | `gated_auto` |
| **14** | OpenAPI `/docs` exposed unauthenticated | `app.py:55` | `gated_auto` |
| **15** | No CORS policy on backend | `app.py` | `manual` |
| **16** | Wiki pages ordered by title, not newest update | `wiki.py:196` | `gated_auto` |
| **17** | Admin wiki contributions list has no pagination | `wiki.py:436` | `manual` |
| **18** | `ceFetch` sets `Content-Type: application/json` on FormData bodies | `client.ts:21` | `gated_auto` |
| **19** | Invalidated wiki evidence refs still expose labels | `wiki.py:131` | `gated_auto` |
| **20** | `is_absent` swallows exceptions → false delete failures | `indexing.py:497` | `gated_auto` |
| **21** | Index worker returns `True` when `request_id` is None — stuck SUBMITTING | `indexing.py:818` | `gated_auto` |
| **22** | SQLite skips wiki circular FK — integrity masked in dev/test | `migrations/.../0008_*.py:147` | `manual` |
| **23** | Audit check-constraint swap non-atomic on Postgres | `migrations/.../0008_*.py:80` | `manual` |
| **24** | `conversation_turns.domain_id` has no FK per spec | `migrations/.../0006_*.py:42` | `manual` |
| **25** | UniqueConstraint vs Index drift — autogenerate noise | `models.py:636` | `manual` |
| **26** | Wiki state columns missing `server_default` in migration | `migrations/.../0008_*.py:90` | `gated_auto` |
| **27** | Geist font never loaded — falls back to system-ui | `layout.tsx` | `gated_auto` |
| **28** | Settings dialog: no focus trap / Escape dismiss | `SettingsDialog.tsx:29` | `manual` |
| **29** | Density preference persisted but never applied | `SettingsDialog.tsx:99` | `gated_auto` |
| **30** | OpenAPI snapshot test failing (P11 wiki schemas added) | `tests/test_foundation_auth.py` | `gated_auto` |
| **31** | P4 boundary test failing — routes import lightrag diagnostics | `tests/test_sources.py:524` | `manual` |

---

## P3 — Advisory / Discretion

| # | Title | Autofix |
| --: | --- | --- |
| **32** | Login timing oracle (disabled/missing user) | `manual` |
| **33** | No secondary CSRF header (SameSite-only) | `advisory` |
| **34** | Proxy forwards client `X-Forwarded-For` unchanged | `advisory` |
| **35** | `seed_admin` rehashes password every startup | `gated_auto` |
| **36** | Invalid `session_cookie_samesite` env not validated | `gated_auto` |
| **37** | `provider_kind` path param lacks route-level enum | `gated_auto` |
| **38** | Extra `createdAt` on WikiPageSummary DTO | `advisory` |
| **39** | EVT-001 should document failed-turn replay as error events | `advisory` |
| **40** | User CASCADE delete destroys wiki contributions | `advisory` |
| **41** | Missing index on `domains.state` | `advisory` |
| **42** | `/forbidden` route unreachable from client | `advisory` |
| **43** | Login page flashes during idle bootstrap | `advisory` |

*(Additional P3 items from testing persona: silent-pass mocks in replay tests, SQLite-only concurrency proof, N×M eligibility queries, in-process LightRAG lock vs multi-worker — see raw persona notes.)*

---

## Thematic Triage Groups

### Theme A — Frontend API transport broken (#1, #18)

Root cause: middleware file naming + `ceFetch` Content-Type logic. **Blocks all browser ↔ backend traffic** and will break multipart uploads once proxy works.

### Theme B — Worker concurrency & lifecycle (#2, #3, #4, #20, #21)

Shared pattern: claim/finalize paths lack locks or terminal states. Highest prod risk on Postgres with multiple workers.

### Theme C — P11 wiki contract drift (#5–#8, #16–#19)

DTO field names, ordering, pagination, and redaction semantics diverge from `API-001` / `DATA-001`.

### Theme D — Auth hardening (#12–#15, #32–#37)

Rate limits, cookie config validation, docs exposure, CORS. Pilot-acceptable if backend port is network-isolated — document that assumption.

### Theme E — Migration safety (#10, #22–#26)

Downgrade compensation, SQLite FK gaps, constraint atomicity, spec FK drift.

### Theme F — Frontend polish & a11y (#9, #27–#29, #42–#43)

Session enforcement, DESIGN.md font parity, settings UX, dead routes.

---

## Test Evidence

```text
Backend:  94 passed · 2 failed
  FAILED test_openapi_snapshot_matches          → update snapshot after P11 wiki routes (#30)
  FAILED test_p4_source_services_do_not_import  → routes.py imports lightrag diagnostics (#31)

Frontend: 7 passed · 0 failed
```

**Note:** Frontend tests do not assert middleware/proxy wiring — #1 would not be caught by current suite.

---

## Residual Actionable Work

If none of the above are fixed in this pass:

| # | Sev | Autofix | Action |
| --: | --- | --- | --- |
| 1 | P0 | gated_auto | **Must fix** before any frontend E2E |
| 2 | P0 | manual | **Must fix** before multi-worker Postgres deploy |
| 3–11 | P1 | mixed | Fix or file tickets with `#N` refs |
| 12–31 | P2 | mixed | Schedule in pilot hardening sprint |
| 32–43 | P3 | mixed | Accept with durable record or defer |

---

## Protected Artifacts — Ignored

No reviewer findings targeted `docs/plans/*`, `docs/brainstorms/*`, or `docs/solutions/*` for deletion. N/A.

---

## Open Decisions

1. Is single-worker Postgres + network-isolated backend port the pilot deployment model? (Affects #2, #12, #14, #15 severity.)
2. Is SQLite FK skip for wiki circular ref an accepted dev-only limitation? (MIG-2)
3. Should `conversation_turns.domain_id` be FK-less post-delete by design? (MIG-4 — spec vs implementation)

---

## One-Line Summary

**Branch is feature-complete on paper but has two P0 blockers (dead frontend proxy, worker claim race) and a cluster of P11 wiki DTO contract drifts — fix #1–#8 before pilot browser testing.**
