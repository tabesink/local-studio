---
title: "Knowledge Graphs settings parity polish - Plan"
date: 2026-07-11
artifact_contract: ce-unified-plan/v1
artifact_readiness: implementation-ready
product_contract_source: ce-brainstorm
execution: code
type: feat
topic: knowledge-graphs-settings-parity-polish
feature: F-009
related: [F-003, F-010]
supersedes_scope: none
prior_plan: docs/plans/2026-07-10-006-feature-domain-deploy-settings-ui-plan.md
product_contract_preservation: "Product Contract unchanged"
---

# Knowledge Graphs settings parity polish - Plan

## Goal Capsule

- **Objective:** Bring Settings → Knowledge Graphs to Local Studio Controllers visual density while keeping plan 006’s accordion structure and safe-field rules, and make backend-owned storage bars visibly work on expand.
- **Product authority:** F-009 owns the Settings surface; F-003 owns domain lifecycle APIs; F-010 owns admin `storageSummary`; DESIGN.md + Local Studio environment-controls Controllers pattern own density/grammar; plan 006 owns the Product Contract for structure and forbidden fields.
- **Open blockers:** None.
- **Execution:** `code`

---

## Product Contract

### Summary

Ship a Controllers-style visual polish pass on the existing Knowledge Graphs Settings group: same accordion rows, Deploy footer, and safe fields (no ports/URLs). Tighten density, typography, pills, expanded body, and footer spacing to match Controllers. Treat “storage bars visibly correct on expand” as a hard success gate—diagnose and fix if missing in the running app.

### Problem Frame

Plan 006 already delivered accordion Knowledge Graphs with Deploy and storage bars under safe-field rules. The annotated Controllers mockup still reads as the visual target for density and hierarchy, but this pass must not reopen forbidden infra fields. Storage bars exist in code on expand only; the operator may not see them yet, so visibility/correctness on expand is part of done—not a redesign of storage UX.

### Key Decisions

- **Visual delta only.** Keep the chevron accordion; use the canonical rounded `ToggleSwitch` for Start/Stop in the collapsed row and place quiet Delete inside expanded content. Create/deploy lives in a second SettingsGroup card below the accordion list (Name / id / embedding / Deploy).
- **Safe fields stay closed.** No ports, runtime URLs, container ids, API keys, or radio “active backend.” Visible group label remains **Knowledge Graphs** (not “LightRAG Containers”).
- **Parity polish, not redesign.** The collapsed row remains the single display location for Name/Id. Expansion shows only locked embedding configuration and storage, avoiding duplicate facts; nested storage chevrons and editable expanded fields remain deferred.
- **Storage visibility is success, not optional polish.** Expanded rows must show backend-owned `storageSummary` bars; if they do not appear in the running environment, fix wiring/rendering until they do.
- **Controllers is the density reference.** Match Local Studio environment-controls Controllers list feel (row height, muted chrome, pill weight, footer density), adapted to Knowledge Graphs content.
- **Canonical controls, Local Studio styling.** The surface imports from `@/components/ui` and uses shared `IconButton`, `ToggleSwitch`, `Input`, `Select`, `ProgressBar`, status, settings, and modal primitives. The Controllers accordion row remains the documented template adaptation until a general accordion primitive is justified.

### Actors

- **Administrator** — uses Settings Knowledge Graphs; judges Controllers-like density and sees storage on expand.
- **Backend** — continues to own lifecycle and `storageSummary` computation (unchanged contract intent).

### Key Flows

- F1. Expand and see configuration and storage
  - **Trigger:** Admin expands a Knowledge Graph row.
  - **Steps:** Chevron opens body → locked embedding detail → total storage bar from `storageSummary` with warning tone when near/exceeded.
  - **Outcome:** Storage is visibly present and trustworthy without ports/paths/URLs.

- F2. Controllers-density scan
  - **Trigger:** Admin views the Knowledge Graphs group next to Controllers grammar expectations.
  - **Steps:** Scan collapsed rows, expanded body, and Deploy footer for density/typography/pill/footer parity.
  - **Outcome:** Panel feels like Controllers family, not a looser admin card stack.

### Visualizations

```text
Settings → Knowledge Graphs (Controllers density; create is its own card)
┌ Knowledge Graphs ─────────────────────────────────────────┐
│ Lifecycle on backend. No Docker details in UI.            │
├───────────────────────────────────────────────────────────┤
│ ▸ Name              [running]                       (●)   │
│   id                                                      │
├───────────────────────────────────────────────────────────┤
│ ▾ Name              [stopped]                       (○)   │
│   Embedding model · locked                                 │
│   Storage  N of 5 GB                    [ok|warn|…]       │
│   [=========== total bar =================]               │
│                                                  Delete   │
└───────────────────────────────────────────────────────────┘
┌ New Knowledge Graph ──────────────────────────────────────┐
│ [Name] [id] [embedding ▾]                        [Deploy] │
└───────────────────────────────────────────────────────────┘

ON EXPAND: storage block required (hard success)
NEVER: port / URL / LightRAG Containers rename / radio active-backend
```

### Requirements

**Parity polish**

- R1. Knowledge Graphs Settings keeps plan 006 layout: one `SettingsGroup`, chevron accordion rows, Deploy footer with display name, id, and embedding profile.
- R2. Visual density (row height, gaps, chevron hit target, muted id subtitle, pill weight, expanded padding, Deploy stack spacing) matches Local Studio Controllers / environment-controls list grammar as adapted by DESIGN.md.
- R3. Visible group and nav label remain **Knowledge Graphs**.

**Storage visibility**

- R4. Expanding a domain row shows the Storage section with total usage/limit, one total bar, and a warning pill from `storageSummary.warning`.
- R5. If storage does not appear on expand in the running app, the pass diagnoses and fixes until R4 holds (contract and safe-field rules unchanged).
- R6. Storage values remain backend-owned `storageSummary` only; the browser never computes quota from paths or runtime targets.

**Safety (inherited, still binding)**

- R7. The browser never displays host ports, runtime URLs, container ids, Docker/compose targets, storage paths, or operator dumps on this surface.

### Scope Boundaries

**In scope**

- Controllers-style visual polish of the existing Knowledge Graphs Settings panel.
- Making expanded storage bars visibly correct under the existing `storageSummary` contract.
- DESIGN.md / Local Studio settings primitive alignment for density only.

**Deferred for later**

- Compact Add that reveals fields; form-like editable expanded Name/Id/Embedding chrome; nested storage breakdown chevron.
- Renaming the group to “LightRAG Containers.”
- Ports, auto URLs, API keys, radio active-backend, live polling, logs/diagnostics.

**Outside this product's identity**

- Showing domains as Controllers with reachable host URLs.
- Browser-owned storage or Docker inspection.

### Acceptance Examples

- AE1. Controllers-density parity
  - **Covers:** R1, R2, R3
  - **Given:** Admin opens Settings Knowledge Graphs with at least one domain.
  - **When:** Admin compares collapsed rows and Deploy footer to Controllers list density.
  - **Then:** Spacing, muted chrome, and pills read as Controllers family; label remains Knowledge Graphs; no ports/URLs.

- AE2. Storage on expand
  - **Covers:** R4, R5, R6, R7
  - **Given:** Admin domain DTO includes `storageSummary`.
  - **When:** Admin expands a row.
  - **Then:** Storage total/limit, total bar, and warning tone are visible from the DTO only; collapsed header still has no storage bar; no path/URL/port leakage.

### Success Criteria

- Side-by-side with Controllers, Knowledge Graphs no longer feels like a looser one-off Settings island.
- An Admin who expands a row can point at working storage bars without hunting.
- Plan 006 safe-field and structure decisions remain intact.

### Dependencies / Assumptions

- Plan 006 Product Contract remains the structural baseline.
- F-010 admin `storageSummary` (`ok` | `near_limit` | `exceeded`) remains the storage source.
- DESIGN.md and Local Studio environment-controls Controllers remain the density reference.
- Assumption: if storage is missing in a given environment, the gap is wiring/render/data readiness, not a need for new product fields.

### Outstanding Questions

**Resolve Before Planning**

- None.

**Deferred to Implementation**

- Exact Controllers token/spacing class deltas once compared side-by-side in the running Settings panel.
- Runtime root cause if expand shows no Storage block (stale API vs expand discovery vs zero-bar affordance) — diagnose from the running app, not invent new product fields.

### Sources / Research

- Prior plan: `docs/plans/2026-07-10-006-feature-domain-deploy-settings-ui-plan.md`
- Surface: `frontend/src/features/settings-panel/SettingsPanel.tsx` (Knowledge Graphs accordion + expand-only storage)
- Helpers: `frontend/src/features/settings-panel/domainSettingsHelpers.ts`
- Controllers density reference: `.reference-LS-frontend/templates/nextjs-feature-demos/features/environment-controls/components/environment-controls-demo.tsx`
- Contract: `specs/03-contracts/api/context-engine-v1.md` (`storageSummary`)
- Visual authority: `DESIGN.md` §8.5
- Annotated Controllers mockup (session asset) used as density inspiration only; port/URL annotations remain out of scope

---

## Planning Contract

### Key Technical Decisions

- **Extend DomainsSection in place.** Keep the Controllers-style custom flex rows (do not migrate domain rows to `SettingsRow` / `ListRow`); polish class recipes against the environment-controls Controllers demo.
- **Collapsed rows are mostly aligned; focus deltas on expanded body + Deploy footer.** Collapsed `px-3.5 py-2.5` / title / mono id already match Controllers; primary visual debt is the heavier storage card and the vertical `py-3` Deploy stack vs Controllers’ compact `flex-wrap gap-2 py-2.5` add footer.
- **Deploy stays Deploy, denser.** Compact footer spacing and wrap where possible without converting to Controllers’ Add-reveal or dropping the embedding select.
- **Storage visibility is UI/wiring, not new DTO fields.** Admin `storageSummary` is already always attached by `safe_domain_admin`; prefer expand-gate clarity, zero-usage affordance, and lighter chrome over backend contract changes unless the running stack proves a real API gap.
- **Tests stay static + helper-level.** Extend `frontend/tests/domains-settings.test.mjs` markers for expand/storage and forbidden tokens; keep `tests/test_domains.py` storageSummary pin; manual Settings expand smoke for AE1/AE2.

### Assumptions

- Admin list/detail responses in a current stack include `storageSummary`; “I don’t see storage” is most often expand-only placement, zero-width bars reading as empty, or a stale build — not a missing product field.
- No extract of `DomainsSection` to a new file is required unless file size becomes painful during polish.

### High-Level Technical Design

```text
Admin opens Settings → Knowledge Graphs
        │
        ├─ collapsed row (Controllers density)
        │     chevron · name · StatusPill · Start|Stop · Delete
        │
        ├─ expand (F1)
        │     safe facts → Storage block from storageSummary
        │     if block missing/unreadable → diagnose (R5) then fix
        │
        └─ Deploy footer (Controllers compact spacing; fields unchanged)
              Name · id · embedding ▾ · Deploy
```

### Sequencing

1. U1 — row + footer density
2. U2 — expanded storage visibility/readability (depends on U1 only for shared markup touch)
3. U3 — tests + verification evidence

---

## Implementation Units

### U1. Controllers density for collapsed rows and Deploy footer

- **Goal:** Make collapsed Knowledge Graph rows and the Deploy footer read as Controllers-family density without changing structure or safe fields.
- **Requirements:** R1, R2, R3, R7; AE1
- **Dependencies:** None
- **Files:**
  - Modify: `frontend/src/features/settings-panel/SettingsPanel.tsx` (`DomainsSection` collapsed row + Deploy footer)
  - Reference: `.reference-ls-frontend/templates/nextjs-feature-demos/features/environment-controls/components/environment-controls-demo.tsx`
  - Test: `frontend/tests/domains-settings.test.mjs`
- **Approach:** Diff collapsed row and footer spacing against Controllers (`px-3.5 py-2.5`, `gap-3` / `gap-2`, `h-7` controls). Tighten Deploy footer toward Controllers compact `flex-wrap gap-2 py-2.5` while keeping Name, id, embedding, and Deploy (no Add-reveal). Preserve Knowledge Graphs labels and forbidden-field absence.
- **Execution note:** Prefer visual smoke against Controllers grammar after class changes; unit tests mainly lock labels and structure markers.
- **Patterns to follow:** Controllers list row + add footer in environment-controls demo; DESIGN.md §8.5 Settings shell; existing `SettingsButton` / `SettingsInput` / `StatusPill` primitives.
- **Test scenarios:**
  - Covers AE1. Static panel scan still contains `Knowledge Graphs`, chevron/`aria-expanded`, `Deploy`, and does not contain `LightRAG Containers` or forbidden port/URL tokens.
  - Happy path: Deploy footer still requires name, id, and embedding before Deploy is enabled (`canDeployDomain` unchanged).
- **Verification:** Collapsed rows and Deploy footer match Controllers density in Settings; structure and labels unchanged.

### U2. Expanded body and storage visibility

- **Goal:** Expanded Knowledge Graph details feel Controllers-dense, and storage bars are obviously present and readable on expand (including zero-usage).
- **Requirements:** R2, R4, R5, R6, R7; F1; AE2
- **Dependencies:** U1 (same `DomainsSection` surface)
- **Files:**
  - Modify: `frontend/src/features/settings-panel/SettingsPanel.tsx` (expanded body + storage block)
  - Possibly modify: `frontend/src/features/settings-panel/domainSettingsHelpers.ts` (display-only tweaks if needed)
  - Reference: `frontend/src/features/domains/api.ts`, `context_engine/services/domains.py` (`safe_domain_storage_summary`)
  - Test: `frontend/tests/domains-settings.test.mjs`
- **Approach:** Tighten expanded fact-row padding and storage chrome so the Storage section is unmistakable. Show only the total bar and warning pill (`storageTone`) from `storageSummary`; omit component breakdown rows from this compact settings surface. If the running app still hides storage after polish, diagnose R5 causes (expand gate, DTO presence, render throw, zero-bar affordance) and fix wiring/render—do not add ports/URLs or browser-side quota math.
- **Execution note:** Smoke-first on expand in a running admin Settings session; then pin markers in the static test.
- **Patterns to follow:** Existing expand-only storage block; backend-owned `storageSummary` contract; Controllers muted mono metadata density.
- **Test scenarios:**
  - Covers AE2 / F1. Static scan asserts expand/storage markers (`storageSummary`, `storageLimitLabel`, bar width usage / component map) remain present; collapsed header path still has no storage markup outside the expanded branch.
  - Edge: zero totals still render Storage labels and bars (not a hidden section).
  - Safety: no path/URL/port/container tokens introduced in the Domains section.
- **Verification:** Expanding a domain shows Storage with total/limit, total bar, and warning pill from the DTO; manual smoke confirms AE2 in the running app.

### U3. Verification pins and feature evidence

- **Goal:** Automated pins and feature evidence prove Controllers polish did not reopen forbidden fields and that storage-on-expand remains contracted.
- **Requirements:** R3, R6, R7; AE1, AE2
- **Dependencies:** U1, U2
- **Files:**
  - Modify: `frontend/tests/domains-settings.test.mjs`
  - Possibly run/confirm: `tests/test_domains.py` (admin `storageSummary` test)
  - Update evidence as needed: `specs/04-features/F-009-frontend-delivery/implementation-log.md` (and acceptance/traceability only if status claims change)
- **Approach:** Extend frontend static/helper tests for density-safe markers and storage-on-expand signals. Re-run backend storageSummary pin if any backend touch occurred (expect none). Record manual Settings expand smoke for AE1/AE2 in F-009 evidence.
- **Execution note:** Prefer extending existing `domains-settings.test.mjs` over new Playwright unless manual smoke fails and needs automation.
- **Patterns to follow:** Existing domains-settings forbidden-token scan; F-009 implementation-log style from the 2026-07-11 Knowledge Graphs revision entry.
- **Test scenarios:**
  - Happy path: helpers for `storageLimitLabel` / `storageTone` / `clampStoragePercent` still pass.
  - Integration: panel source still wires `storageSummary` and `aria-expanded`; forbidden field tokens remain absent.
  - Regression: Knowledge Graphs label present; LightRAG Containers absent.
- **Verification:** Named frontend (and backend if touched) tests pass; F-009 evidence notes Controllers density polish + storage-on-expand smoke.

---

## Verification Contract

| Gate | Command / check | Applies to |
| --- | --- | --- |
| Frontend domains settings | `node --test frontend/tests/domains-settings.test.mjs` | U1–U3 |
| Backend storageSummary pin | `pytest tests/test_domains.py::test_admin_domain_dto_includes_safe_backend_storage_summary -q` | U2–U3 (confirm if backend unchanged) |
| Manual Settings smoke | Admin Settings → Knowledge Graphs: Controllers density scan + expand shows Storage bars | AE1, AE2, U1–U2 |

---

## Definition of Done

- [ ] U1–U3 complete with verification outcomes above
- [ ] Product Contract R1–R7 still hold; no ports/URLs/container fields; label remains Knowledge Graphs
- [ ] Expanded storage bars are visibly correct in a running admin session (AE2)
- [ ] Feature evidence updated for F-009 when claims change
- [ ] Plan 006 structural decisions unchanged

---

## Appendix

### Controllers vs current deltas (research)

| Area | Controllers reference | Current KG tendency |
| --- | --- | --- |
| Collapsed row | `px-3.5 py-2.5`, title + pill, mono subtitle | Already aligned |
| Footer | `flex-wrap gap-2 px-3.5 py-2.5` | Vertical `flex-col gap-2 py-3` |
| Storage | N/A on Controllers | Expand-only bordered card; zero bars can look “empty” |

### External research

Skipped — Controllers density and Settings markup are established locally; no unsettled external option set.
