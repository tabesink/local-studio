# Context Engine — Frontend Wiring + Reference Reconciliation Package

**Prepared:** 2026-06-29  
**Purpose:** Companion package for greenfield backend plans `p1`–`p8` and frontend slices `01`–`17`.  
**Audience:** Junior developers, senior reviewers, coding agents.  
**Build stance:** API-first, dark-first workstation UI, KISS/YAGNI/DRY.

## Why this package exists

The existing plans describe backend phases and frontend slices separately. Old Context Engine v1 and Local Studio contain useful UI code, but both are reference evidence—not authority. This package makes the wiring explicit:

```text
Greenfield backend truth
  -> API contract gate
  -> feature API adapter
  -> mapped frontend view model
  -> dark-first UI component
  -> role / state / failure test
```

It prevents three recurring mistakes:

1. Copying a useful-looking reference component that violates Context Engine authority or scope.
2. Building a screen against legacy endpoint or status assumptions.
3. Treating a hidden UI control as authorization, lifecycle orchestration, or source access.

## Read order

1. `00-executive-decision-summary.md`
2. `01-canonical-guardrails.md`
3. `02-master-reconciliation-matrix.md`
4. `03-contradictions-and-reconciliation.md`
5. `06-api-coordination-backlog.md`
6. `07-delivery-sequence-work-packets.md`
7. `11-explicit-reject-list.md`
8. Feature-specific reference maps as implementation begins.

## Authority order

```text
1. CONTEXT.md product terminology and boundary
2. 00-cross-phase-alignment.md + development-scafold.md
3. Backend phase plans p1 through p8
4. Frontend slices 01 through 17
5. Old Context Engine v1 code
6. Local Studio code
```

When documents conflict, do not compromise by merging behaviors. Follow the higher source, record the conflict, and add a contract gate when needed.

## Package layout

| File | Use |
|---|---|
| `00-executive-decision-summary.md` | Decisions, major conflicts, and recommended order. |
| `01-canonical-guardrails.md` | Non-negotiable browser/API/runtime/product rules. |
| `02-master-reconciliation-matrix.md` | Per-slice backend/API/reference/UI mapping. |
| `03-contradictions-and-reconciliation.md` | Resolved tensions and target decisions. |
| `04-local-studio-adoption-map.md` | What to borrow, defer, or reject from Local Studio. |
| `05-old-context-engine-retention-removal.md` | What to retain/adapt/remove from old CE v1. |
| `06-api-coordination-backlog.md` | Contract gates, owners, blockers, safe temporary UI. |
| `07-delivery-sequence-work-packets.md` | Recommended frontend delivery sequence and test gates. |
| `08-design-system-accessibility.md` | Dark-first target visual system and interaction rules. |
| `09-coding-agent-execution-checklist.md` | Repeatable implementation checklist. |
| `10-source-evidence-index.md` | Input documents and reference-code evidence map. |
| `11-explicit-reject-list.md` | Pilot scope and security patterns that must not be copied. |
| `wiring-manifest.yaml` | Machine-readable mapping for agents/tooling. |

## Reference-language legend

Use these tags in every implementation PR, design note, and coding-agent task:

- **[OBSERVED]** directly present in a plan or reference code.
- **[INFERRED]** reasonable interpretation; validate before wiring production behavior.
- **[PROPOSED BACKEND BOUNDARY]** desired Context Engine contract, not proof it exists.
- **[CONTEXT ENGINE ADAPTATION]** approved reuse pattern after scope reduction.
- **[OPEN QUESTION]** unresolved; do not hard-code.
- **CONTRACT CAPTURE REQUIRED** endpoint/event/DTO/runtime fixture must be proven before implementation.

## Core outcome

```text
Use Local Studio for dark workstation visual language and frontend module discipline.
Use old Context Engine for Context Engine-specific screen concepts and component seams.
Use greenfield backend plans for authority, API ownership, scope, lifecycle state, and security.
```
