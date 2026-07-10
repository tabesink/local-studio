---
title: "Source-ref inspector - Plan"
date: 2026-07-10
artifact_contract: ce-unified-plan/v1
artifact_readiness: implementation-ready
product_contract_source: ce-brainstorm
execution: code
feature: F-009
topic: source-ref-inspector
product_contract_preservation: "changed: R1 — clarified that Evidence rows never carry source/block ids; resolve may return Library-safe sourceId already used by member list/preview (matches confirmed KTD-1)"
deepened: 2026-07-10
---

# Source-ref inspector - Plan

## Goal Capsule

- **Objective:** Let Members verify grounded answers by opening the cited Source Document in Library (PDF page jump via pdf.js when known; text/unsupported otherwise) and returning seamlessly to the Evidence turn they left.
- **Product authority:** F-009 slice 16 owns evidence→source navigation and Library deep-link UX; API-001 / DATA-001 own the opaque source-ref resolve contract; F-004 owns Source Block page metadata; document preview blob already exists under F-009 / API-001 member preview.
- **Open blockers:** None. Resolve key, return-state encoding, and pdf.js packaging are resolved in Planning Contract.
- **Execution:** `code`

---

## Product Contract

### Summary

Ship opaque evidence→source navigation: from the Evidence Panel selected row, resolve whether the source is still readable, then open Library on that document. PDFs use a shared pdf.js Library viewer and jump to the evidence page when page metadata exists. Non-PDFs open Library preview or unsupported state without page jump. Unavailable sources fail closed in chat. Return uses an explicit Back to chat control plus browser Back, restoring the jump-from turn.

### Problem Frame

Grounded chat already shows turn-scoped Evidence excerpts, but Members cannot open the underlying Source Document to verify context. F-009 blocks evidence→source navigation until an opaque source-ref contract exists. Public Evidence DTOs intentionally omit private source/block ids. Library member list + preview already ships; PDF preview still uses a native browser object and cannot reliably jump to a page.

### Key Decisions

- **Resolve before navigate.** Clicking Open in Library asks the backend whether this evidence still maps to a readable source; only then leave chat. Matches fail-closed and concurrent multi-user safety without server jump sessions.
- **Leave chat for Library, not an in-chat PDF drawer.** One shared preview surface; citation jump reuses Library.
- **pdf.js upgrades Library PDF preview for everyone.** Citation jump and normal Library open share one viewer; no dual-path PDF stack.
- **Return to the jump-from turn.** Back to chat (button primary) and browser Back both restore the same conversation and the Evidence turn the user left—even if that turn is not the newest.
- **Client return state only.** No server-side jump session, lock, or sticky mode. Concurrent users are independent read-only resolvers and preview readers.
- **Evidence Panel selected row only.** Label: Open in Library. Citation chips and a Source inspector tab are deferred.
- **Non-PDF opens Library anyway.** Text/markdown use stored original preview; docx/other show unsupported; no page jump.
- **Unavailable stays in chat.** Deleted, redacted, unauthorized, or otherwise unresolvable sources disable the action or show Source unavailable; never navigate into a dead-end Library state.
- **Missing page metadata.** PDF still opens; viewer starts at the beginning; page hint is omitted.

### Actors

- **Member** — opens Library from Evidence; previews sources they can already see for that domain; returns to the jump-from turn.
- **Administrator** — same navigation and preview; retains existing Library mutation controls when not in a citation-return chrome path.
- **Backend** — authorizes resolve from public evidence ref identity; projects safe navigation metadata (including page when known); never exposes private source/block ids, paths, or runtime targets.

### Key Flows

- F1. Open PDF at evidence page
  - **Trigger:** Member selects an Evidence row with a resolvable PDF source and known page.
  - **Steps:** Open in Library → resolve succeeds → Library opens that source in pdf.js at the page → Member reads → Back to chat or browser Back → same conversation and jump-from turn with Evidence usable again.
  - **Outcome:** Seamless verify loop without private ids in the browser.

- F2. Open non-PDF source
  - **Trigger:** Resolvable text/markdown or unsupported type.
  - **Steps:** Resolve succeeds → Library shows text preview or unsupported state → same Back behavior; no page jump.
  - **Outcome:** Consistent leave/return path for all source types.

- F3. Source unavailable
  - **Trigger:** Deleted, redacted, unauthorized, or otherwise unresolvable evidence.
  - **Steps:** Resolve fails in chat → control disabled or Source unavailable → user remains on chat.
  - **Outcome:** No stranded Library navigation.

- F4. Concurrent readers
  - **Trigger:** Multiple authenticated domain readers open the same source via citation jump or Library.
  - **Steps:** Independent resolve and preview reads; no exclusive lock or shared jump session.
  - **Outcome:** Production-safe multi-user read path.

### Requirements

**Navigation and trust**

- R1. Members can open the Source Document behind a selected Evidence row without Evidence payloads or browser-invented refs exposing Source Block ids, storage paths, or runtime targets. Evidence rows never carry source/block ids; after successful resolve, Library may use `sourceId` already used by member list/preview.
- R2. The product must resolve readability before leaving chat; unavailable sources fail closed in chat with a disabled control or safe Source unavailable state.
- R3. Open in Library appears only on the selected Evidence Panel detail (not every list row, not citation chips, not a Source tab in v1).
- R4. When page metadata exists for a PDF, Library opens that PDF at that page; when missing, the PDF opens at the start without inventing a page.

**Library preview**

- R5. Library PDF preview uses pdf.js for all PDF opens (citation jump and ordinary Library selection share the same viewer).
- R6. Non-PDF resolvable sources open Library preview using the existing stored-original preview behavior (plain/markdown as readable text; unsupported types show unsupported).
- R7. Multiple users may resolve and preview the same source concurrently; the product must not serialize or lock citation jumps.

**Return path**

- R8. While in a citation jump, Library shows an explicit Back to chat control as the primary return affordance.
- R9. Browser Back must also restore the jump-from conversation and turn when history was pushed for the jump.
- R10. Return restores the Evidence turn the user jumped from, even when that turn is older than the conversation’s newest turn.

**Safety and contracts**

- R11. API responses, logs, and client errors for resolve/navigation must not expose private ids, paths, credentials, raw source beyond approved excerpts already shown in Evidence, or provider/LightRAG payloads.
- R12. API-001 (and F-009 acceptance) must capture the opaque source-ref resolve contract and deep-link behavior before or with implementation; Playwright proves Evidence → Library page jump → Back to turn.

### Scope Boundaries

**In scope**

- Opaque resolve-before-navigate from public Evidence identity.
- Evidence Panel Open in Library control with page hint when known.
- Library deep-link that selects the source, loads preview, and applies PDF page jump when applicable.
- pdf.js upgrade for Library PDF preview (shared).
- Back to chat button + browser Back restoring jump-from turn.
- Fail-closed unavailable handling in chat.
- Playwright click-through for the happy path and unavailable path.

**Deferred for later**

- Citation chips that jump to Library.
- Source inspector tab / in-chat figure-table asset cards.
- Docx (or other Office) inline preview.
- Download/export controls.
- In-chat PDF drawer as an alternative to Library.
- Embedding durable nav handles on every Evidence DTO at stream time (resolve-on-click is the chosen shape).

**Outside this product's identity**

- Browser-constructed refs from paths or private ids.
- Browser-side RAG or a second retrieval stack.
- Server-owned jump sessions, checkout locks, or cross-user citation state.

### Acceptance Examples

- AE1. Given a grounded turn with PDF evidence and known page, when the Member clicks Open in Library, Library shows that PDF at that page.
- AE2. Given the Member is on Library from a citation jump, when they click Back to chat, chat restores the same conversation and the jump-from turn.
- AE3. Given the Member is on Library from a citation jump, when they use browser Back, the same turn restore occurs.
- AE4. Given evidence whose source was deleted or redacted, when the Member views that row, Open in Library is unavailable and chat is not left.
- AE5. Given resolvable markdown evidence, when the Member opens Library, the stored markdown/text preview appears and Back still returns to the jump-from turn.
- AE6. Given two Members jump to the same PDF concurrently, both previews succeed without locking each other out.
- AE7. Opening a PDF from ordinary Library selection (no citation) also uses pdf.js (shared viewer).

### Success Criteria

- F-009 slice 16 source-ref gate closes: opaque contract captured, Evidence → Library → Back proven in Playwright, acceptance updated.
- Members can verify grounded answers against the real Source Document without private id leakage.
- Library PDF viewing is page-capable for citation jumps and ordinary opens alike.

### Dependencies / Assumptions

- Member Library list + preview blob routes already exist (`GET /domains/{domain_id}/sources`, `GET .../preview`); this slice builds on them rather than re-shipping preview authz.
- Source Blocks may carry `page_start` / `page_end` privately; resolve may project a safe page when present.
- Domain visibility / eligibility rules for reading sources match existing member preview authority.
- Exact resolve URL shape, opaque token/handle format, and Library query-param names are planning decisions under the no-private-id constraint.

### Outstanding Questions

**Resolved in Planning Contract**

- Resolve key and response shape → KTD-1.
- Client return / deep-link encoding → KTD-2.
- pdf.js packaging and page jump → KTD-3.
- R1 vs Library-visible `sourceId` clarification → KTD-1 note.

---

## Planning Contract

### Key Technical Decisions

- KTD-1. **Resolve by public evidence ref id; return Library-safe navigation DTO.** Add an authenticated resolve route keyed by `conversation_turn_evidence_refs.id` (already the public opaque Evidence `id`). On success return only fields Library already needs: `domainId`, `sourceId` (Source Document id — already exposed on member list/preview), optional `page` (from `source_blocks.page_start` when present), and safe labels for chrome. Never return `source_block_id`, storage paths, or runtime targets. On failure return a safe unavailable/forbidden envelope and keep the user in chat. **R1 clarification:** “no private source document ids on Evidence” remains; Library navigation may carry `sourceId` because member list/preview already does — do not put block ids or storage paths in URLs.
- KTD-2. **Client history deep-link + return state (no server jump session).** From chat: after successful resolve, `router.push` to `/documents` with query params for domain, source, optional page, and return (`conversationId`, `turnId`). Library reads params to select domain/source, load preview, apply page, and show Back to chat. Back to chat and browser Back both land on `/chat` with conversation + turn restore (extend chat shell to accept those query params once). Prefer `history.push` so browser Back works; do not invent server-side jump tokens.
- KTD-3. **Shared pdf.js Library viewer.** Replace native `<object>` PDF preview in Library with pdf.js (or pdfjs-dist) for all PDF opens. Citation jump passes `page`; ordinary row select opens at page 1 / last scroll default. Keep existing blob fetch + revoke lifecycle; text/markdown paths unchanged.
- KTD-4. **Contract-first.** Patch API-001 (and F-009 gate language / slice map) before or with the resolve route. OpenAPI snapshot updates with the new path. DATA-001 needs delivery notes only if projecting page — no new tables.
- KTD-5. **Authz mirrors member preview + turn ownership.** Resolve requires current session; evidence ref must belong to a conversation the caller can read; mapped source must still exist and pass the same domain-available gate as member preview; redacted evidence refs fail closed as unavailable.
- KTD-6. **Fail-closed UX before navigation.** Evidence Panel calls resolve on click (or preflight when selection changes). Only navigate on success. Show disabled / “Source unavailable” on failure; never push Library with a doomed deep-link.

### High-Level Technical Design

```mermaid
sequenceDiagram
  participant User
  participant Chat as Evidence Panel
  participant API as CE API
  participant Lib as Library UI

  User->>Chat: Select evidence, Open in Library
  Chat->>API: Resolve evidenceRefId (cookie)
  alt Resolvable
    API-->>Chat: domainId, sourceId, page?
    Chat->>Lib: push /documents?domain&source&page&return…
    Lib->>API: GET .../preview (existing)
    API-->>Lib: PDF/text bytes
    Lib->>Lib: pdf.js page jump or text/unsupported
    User->>Lib: Back to chat / browser Back
    Lib->>Chat: /chat?conversation&turn
    Chat->>Chat: load conversation, select turn
  else Unavailable
    API-->>Chat: Safe unavailable
    Chat->>Chat: Stay on chat; show unavailable
  end
```

**Authz matrix (planning):**

| Caller | Resolve | Preview | Jump lock |
|---|---|---|---|
| Member, owns/can read turn, domain available, source present | Allowed | Existing preview | None |
| Member, redacted/deleted/unauthorized | Denied (safe) | N/A | N/A |
| Concurrent Members same source | Independent | Concurrent OK | None |

### Assumptions

- Public Evidence `id` is sufficient as the opaque resolve key; a second composer-style nav token is unnecessary for v1.
- Returning `sourceId` on resolve is acceptable because member Library list already exposes Source Document ids for preview.
- Chat restore can load conversation by id and select turn by id using existing `loadConversation` / `selectTurn` seams once query params exist.
- pdf.js worker/assets packaging follows Next.js static-asset conventions already used in the frontend app; exact package choice is an implementation detail within KTD-3.

### Sequencing

1. U1 contract capture (API-001 / F-009 gate language)
2. U2 backend resolve endpoint + tests
3. U3 Library pdf.js + deep-link + Back chrome
4. U4 Evidence Panel Open in Library + chat return restore
5. U5 Playwright + OpenAPI + acceptance / traceability

---

## Implementation Units

### U1. Capture opaque source-ref resolve contract

**Goal:** Close the F-009 slice 16 contract gate so resolve route shape, authz, DTO fields, errors, and deep-link rules are approved before code.

**Requirements:** R1, R2, R11, R12

**Dependencies:** None

**Files:**
- Modify: `specs/03-contracts/api/context-engine-v1.md`
- Modify: `specs/03-contracts/data/context-engine-data.md` (delivery notes only — page projection from existing `source_blocks`)
- Modify: `specs/04-features/F-009-frontend-delivery/spec.md`
- Modify: `specs/04-features/F-009-frontend-delivery/frontend-slice-map.md`
- Modify: `specs/04-features/F-009-frontend-delivery/tasks.md`
- Modify: `specs/04-features/F-009-frontend-delivery/context-panel-tabs.md` (gate note only)
- Modify: `specs/04-features/F-009-frontend-delivery/test-plan.md`

**Approach:**
- Document resolve route keyed by public evidence ref id; success DTO: `domainId`, `sourceId`, optional `page`, safe labels; forbidden: block ids, paths, runtime targets, raw source beyond existing Evidence excerpt rules.
- Document fail-closed error codes (unavailable / forbidden) without leaking whether a private FK still exists after delete when that would violate existing redaction posture — prefer uniform unavailable for redacted/missing.
- State Library deep-link may use `domainId`/`sourceId`/`page` plus return conversation/turn ids; browser never invents source ids from Evidence rows without resolve.
- Flip F-009 “blocked until contract” language to point at the captured contract.

**Patterns to follow:** API-001 member preview catalog prose; composer-ref opacity language (`refToken` must not encode readable private ids); P7 public evidence id rules.

**Test scenarios:**
- Test expectation: none for this unit alone — verified by U2 OpenAPI/integration and U5 acceptance. Reviewer checks route, authz, and forbidden-field clauses are present.

**Verification:** API-001 lists the resolve route; F-009 slice 16 is no longer “blocked until contract exists.”

---

### U2. Backend evidence→source resolve

**Goal:** Implement resolve-before-navigate: given a public evidence ref id, return Library-safe navigation metadata or a safe unavailable failure.

**Requirements:** R1, R2, R4, R7, R11; F3, F4; AE4, AE6

**Dependencies:** U1

**Files:**
- Modify: `context_engine/api/routes.py`
- Modify: `context_engine/services/chat_turns.py` and/or new small service module under `context_engine/services/`
- Modify: `context_engine/services/sources.py` (reuse domain-available / source existence helpers)
- Create or modify: `tests/test_source_ref_resolve.py` (or extend `tests/test_grounded_streaming_chat.py` / `tests/test_sources.py`)
- Modify: OpenAPI snapshot under `tests/snapshots/`

**Approach:**
- Load evidence ref by public id; enforce conversation read authz for the caller; reject when `redacted_at` is set or private source/block mapping cannot be resolved to an existing Source Document.
- Join Source Document + Source Block for optional `page_start`; apply same domain-available gate as member preview.
- Return camelCase safe DTO only; forbidden-field scan in tests.
- No new tables; no jump-session rows; concurrent calls are independent reads.

**Execution note:** Start with failing integration tests for success (PDF with page), success (text, no page), redacted unavailable, deleted source unavailable, and forbidden-field scan.

**Patterns to follow:** `_public_evidence_refs` / redaction omission; `read_source_preview` authz; composer_ref fail-closed `409`/`unavailable` style safe errors.

**Test scenarios:**
- Happy: authenticated owner resolves non-redacted evidence → `domainId`, `sourceId`, `page` when `page_start` present.
- Happy: markdown source → resolve succeeds with null/omitted `page`.
- Edge: missing `page_start` → success without inventing page.
- Error: redacted evidence → safe unavailable; no navigation fields.
- Error: source hard-deleted / missing → safe unavailable.
- Error: other user’s conversation evidence → forbidden/unavailable without leaking.
- Safety: response JSON never contains `source_block_id`, storage path, runtime URL, or raw excerpt beyond approved labels.
- Integration: two sequential resolves for same evidence both succeed (no lock).

**Verification:** Focused pytest green; OpenAPI snapshot includes resolve; safety scan clean on new DTO.

---

### U3. Library pdf.js viewer + citation deep-link chrome

**Goal:** Upgrade Library PDF preview to pdf.js for all opens, and honor deep-link query params for domain/source/page plus Back to chat chrome when return params are present.

**Requirements:** R5–R9; F1, F2; AE1, AE5, AE7

**Dependencies:** U1 (contract for deep-link semantics); preview routes already exist

**Files:**
- Modify: `frontend/src/features/documents/DocumentsPage.tsx`
- Modify: `frontend/src/features/documents/api.ts` (if needed for types only)
- Create: pdf viewer helper/component under `frontend/src/features/documents/` (e.g. `PdfPreview.tsx`)
- Modify: `frontend/package.json` / lockfile for pdf.js dependency
- Modify: `frontend/tests/e2e/documents-preview.spec.ts` (shared viewer still works for ordinary open)
- Optional unit: `frontend/tests/` for query-param parsing helpers

**Approach:**
- Replace `<object type="application/pdf">` with pdf.js rendering of the existing blob/object URL; support initial page from query or prop.
- On mount, read search params: select domain + source, fetch preview, apply page for PDF; show Back to chat when return conversation/turn present.
- Back to chat navigates to `/chat` with conversation + turn restore params; keep history so browser Back works.
- Preserve blob revoke on switch/unmount; text/unsupported paths unchanged.
- Ordinary Library selection (no citation params) still uses pdf.js (AE7).

**Patterns to follow:** Existing preview state machine and revoke lifecycle in `DocumentsPage.tsx`; member vs admin mutation split; Playwright documents preview fixtures.

**Test scenarios:**
- Happy: deep-link with PDF + page renders pdf.js at that page (component or e2e).
- Happy: ordinary row select PDF uses pdf.js (no citation params).
- Happy: text/markdown deep-link shows text preview; Back chrome present when return params set.
- Edge: PDF deep-link without page opens at start.
- Error: unsupported type shows unsupported; Back still available when return params set.
- Edge: revoke object URL on source switch / unmount still holds.

**Verification:** Typecheck/build pass; documents preview e2e still green; manual or e2e proof of page jump when fixture has page metadata.

---

### U4. Evidence Panel Open in Library + chat turn restore

**Goal:** Wire selected Evidence detail to resolve-then-navigate, and teach `/chat` to restore conversation + jump-from turn from return params.

**Requirements:** R2–R4, R8–R10; F1–F3; AE1–AE4

**Dependencies:** U2, U3

**Files:**
- Modify: `frontend/src/features/chat-shell/EvidencePanel.tsx`
- Modify: `frontend/src/features/chat-shell/use-chat-shell.ts`
- Modify: `frontend/src/features/chat-shell/api.ts` (resolve wrapper)
- Modify: `frontend/src/features/chat-shell/ChatShell.tsx` (pass handlers if needed)
- Modify: `frontend/src/app/chat/page.tsx` (search-param bootstrap if required)
- Modify: `frontend/tests/chat.test.mjs`

**Approach:**
- On selected detail, show Open in Library; optional page hint from last successful resolve or omit until resolve returns page.
- Click → resolve API → on success push Library deep-link with return conversationId + turnId (selected/active evidence turn); on failure stay put with unavailable state.
- On `/chat` load with conversation + turn params: load that conversation, `selectTurn` to jump-from turn, open Evidence Panel when evidence exists.
- Do not add citation chips or Source tab.

**Patterns to follow:** Existing `selectTurn` / `selectEvidence` / panel auto-open; cookie `ceFetch` wrappers; fail-closed client error normalization.

**Test scenarios:**
- Happy: resolve success builds Library URL with domain, source, optional page, return ids (unit).
- Happy: chat bootstrap with conversation+turn selects that turn (unit).
- Error: resolve failure does not navigate (unit).
- Edge: Open in Library only on selected detail, not every list row (unit).

**Verification:** Frontend unit tests green; typecheck/build pass.

---

### U5. Playwright proof + acceptance / traceability closeout

**Goal:** Prove Evidence → Library page jump → Back to turn, and unavailable stays in chat; record F-009 acceptance and feature-register updates.

**Requirements:** R12; AE1–AE7

**Dependencies:** U2, U3, U4

**Files:**
- Create or modify: `frontend/tests/e2e/` source-ref / citation-jump spec
- Modify: `specs/04-features/F-009-frontend-delivery/acceptance.md`
- Modify: `specs/04-features/F-009-frontend-delivery/implementation-log.md`
- Modify: `specs/07-traceability/feature-register.md`
- Modify: `specs/07-traceability/change-log.md` (if required by repo convention)
- Ensure OpenAPI snapshot committed from U2

**Approach:**
- Against runnable stack: seed/use grounded turn with PDF evidence that has page metadata when possible; click Open in Library; assert pdf viewer / page; Back to chat; assert same turn selected.
- Separate case: redacted/unavailable evidence does not leave chat.
- Ordinary Library PDF open still works (shared viewer).
- Update acceptance criteria and register: slice 16 source-ref gate closed; note remaining graph gaps if still open.

**Execution note:** Prefer smoke/runtime Playwright against compose stack over pure mocks for the jump/return path.

**Test scenarios:**
- Covers AE1 / AE2: Evidence → PDF page → Back to jump-from turn.
- Covers AE3: browser Back restores turn (if automatable; else explicit manual evidence note).
- Covers AE4: unavailable stays in chat.
- Covers AE5: markdown path if fixture available.
- Covers AE7: ordinary Library PDF uses pdf.js.
- Safety: no private block ids in network JSON for resolve (assert on response keys).

**Verification:** Playwright green for citation jump; acceptance.md and feature-register updated; forbidden-field posture unchanged.

---

## Verification Contract

| Gate | Command / check | Covers |
|---|---|---|
| Contract present | Review API-001 resolve section + F-009 gate language | U1 |
| Backend tests | `pytest` targeting source-ref resolve tests | U2, U5 |
| OpenAPI snapshot | Snapshot includes resolve; forbidden-field review | U2 |
| Frontend unit/typecheck | `frontend` unit tests + `npm run typecheck` / build | U3, U4 |
| Playwright citation jump | e2e against compose stack | U5; AE1–AE4, AE7 |
| Safety | Forbidden-field checks on resolve DTO and client errors | U2, U5 |

---

## Definition of Done

- Opaque resolve contract captured; F-009 slice 16 no longer blocked on “missing contract.”
- Resolve endpoint fail-closed for redacted/missing/unauthorized; success returns only Library-safe fields.
- Evidence Panel Open in Library resolve-then-navigates; unavailable never leaves chat.
- Library uses pdf.js for all PDFs; citation deep-link jumps to page when known; Back to chat + browser Back restore jump-from turn.
- Playwright proves happy path and unavailable path; acceptance + feature-register updated.
- Deferred items (citation chips, Source tab, docx viewer, download, in-chat PDF drawer) remain explicitly out of scope.

---

## Appendix

### Sources & Research

- Product contract: `docs/plans/2026-07-10-005-feature-source-ref-inspector-plan.md` (this file; enriched from ce-brainstorm)
- Preview prerequisite: `docs/plans/2026-07-10-004-feature-document-pdf-preview-plan.md`
- Design gate notes: `.devnotes/P8-post-impl-REVIEW/ID-A-documents-preview-and-source-ref.md`
- Evidence Panel wiring: `.devnotes/02-evidence-panel-wiring-map.md`
- Contracts: `specs/03-contracts/api/context-engine-v1.md`, `specs/03-contracts/data/context-engine-data.md`
- Feature: `specs/04-features/F-009-frontend-delivery/`
- Patterns: `context_engine/services/composer_refs.py` (opacity), `context_engine/services/chat_turns.py` (public evidence ids), `frontend/src/features/documents/DocumentsPage.tsx` (preview)
