# Document Map — How This Package Attaches to Existing Plans

## Placement

Place this folder beside existing implementation plans:

```text
docs/
  backend/
    00-cross-phase-alignment.md
    development-scafold.md
    p1-...md through p8-...md
  frontend/
    01_...md through 17_...md
  frontend-wiring/
    README.md
    01-canonical-guardrails.md
    ...
```

Do not rewrite greenfield plans merely to duplicate this package. Link to it from the top of each active frontend slice.

## Required link additions to existing plans

| Existing plan | Add this pointer | Why |
|---|---|---|
| `00-cross-phase-alignment.md` | `frontend-wiring/01-canonical-guardrails.md` | Makes browser/API authority visible to UI work. |
| `development-scafold.md` | `frontend-wiring/07-delivery-sequence-work-packets.md` | Aligns backend test gates with frontend release order. |
| `01_runtime_foundation.md` | `frontend-wiring/06-api-coordination-backlog.md#p0-foundation` | Avoids legacy auth/base-path drift. |
| `03_app_shell_role_nav_empty_settings.md` | `frontend-wiring/08-design-system-accessibility.md` | Establishes dark-first shell decision. |
| `06_settings_domains.md`, `14_lightrag_domain_lifecycle.md` | `frontend-wiring/03-contradictions-and-reconciliation.md#domain-lifecycle` | Prevents invented lifecycle states/actions. |
| `09_documents_library.md`, `10_document_upload_operations.md` | `frontend-wiring/03-contradictions-and-reconciliation.md#documents-vs-sources` | Replaces legacy generic-document assumptions with P4 sources. |
| `11_chat_route_shell.md`, `12_chat_sse_evidence.md` | `frontend-wiring/03-contradictions-and-reconciliation.md#chat-and-sse` | Resolves legacy stream route/event mismatch. |
| `16_workspace_context_source_nav.md` | `frontend-wiring/03-contradictions-and-reconciliation.md#source-navigation-timing` | Keeps metadata panel seam without premature source opening. |
| `17_audit_diagnostics.md` | `frontend-wiring/03-contradictions-and-reconciliation.md#diagnostics-and-observability` | Prevents raw log/Langfuse/proxy exposure. |

## Coding-agent instruction block

Copy this at the top of a slice-specific implementation task:

```text
Read Context Engine authority sources in this order:
1. CONTEXT.md
2. 00-cross-phase-alignment.md and development-scafold.md
3. relevant pN backend phase
4. relevant frontend slice
5. frontend-wiring package record for the slice

Treat old Context Engine and Local Studio as reference evidence only.
Never copy endpoint names, browser authority, lifecycle states, storage paths,
or security behavior from reference code without contract proof.

Before coding, identify:
- target user outcome;
- owning backend phase and state owner;
- exact API DTO/event fixture required;
- permitted Local Studio / old CE code seam;
- explicit out-of-scope controls;
- loading, empty, error, forbidden, and success states;
- contract test and browser test.
```
