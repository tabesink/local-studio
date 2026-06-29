# Executive Decision Summary

## Decision in one sentence

Build Context Engine as a dark-first Local Studio-inspired frontend shell over greenfield Context Engine APIs; reuse old Context Engine feature seams only after removing legacy browser authority and endpoint assumptions.

## Adopt now

```text
Local Studio dark visual language, compact spacing, sidebar/workbench hierarchy,
page states, dialog/drawer/form/list primitives, focus/keyboard behavior,
feature-first route composition.

Old Context Engine route concepts: app rail, settings dialog, domain selector,
sources table shape, upload dialog shape, chat/evidence layout seam.

Greenfield frontend rules: one cookie-first API transport, feature-local adapters,
DTO -> view-model mapping, server-truth refresh, resource-specific state.
```

## Adapt only after backend proof

```text
P2 provider/model/parser Settings -> replace legacy AI settings APIs.
P3 Domains/lifecycle -> server-derived status/actions only.
P4/P5 Sources -> domain-scoped admin source APIs and two-axis prep/index status.
P7 chat -> conversation-owned endpoint and exact SSE fixture.
P8 audit/diagnostics -> safe, redacted admin DTOs only.
```

## Keep as a future seam, not active behavior

```text
right evidence inspector
resizable workbench regions
knowledge graph renderer
authorized source navigation
command palette / keyboard shortcuts
conversation-history enhancements
```

## Reject

```text
old CE localStorage bearer credentials
legacy direct/ambiguous LightRAG behaviors
browser retrieval/provider/parser controls
Local Studio terminal, filesystem, agent, runtime/controller, plugin, recipe features
generic operations/workflow backend
raw logs/prompts/provider payload viewers
source opening/path construction before approved API contract
```

## Highest-risk mismatches

| Risk | Why it matters | Binding decision |
|---|---|---|
| Source navigation | F16/old CE is ahead of P6 and could expose private source detail. | Metadata-only panel now; authorized opaque source-view contract later. |
| SSE | F12 uses legacy route/events; P7 uses conversation turn route/events. | P0 contract fixture before stream implementation. |
| Runtime Settings | F07/F08 use legacy broad profiles; P2 intentionally narrows config. | Build one P2 runtime-settings adapter. |
| Documents | F09/F10 assume generic member library/operations. | Build admin domain-scoped Sources Library. |
| Operations | F15 assumes generic `/operations`. | Compose resource-specific read models only. |
| Graph | UI route exists but graph proxy is unproven. | Shell first; renderer waits for contract. |

## Recommended order

```text
F01 runtime foundation
-> F02 session
-> F03/F04 dark shell + General Settings
-> F07/F08 trusted settings
-> F06/F14 domains/lifecycle
-> F09/F10 sources/upload/preparation/index status
-> F11 + P6 evidence-ready chat shell
-> F12 P7 streaming chat
-> F13 graph after proxy proof
-> F16 real source navigation after separate proof
-> F15/F17 activity/audit/diagnostics
```

Read `02-master-reconciliation-matrix.md` before implementing any slice.
