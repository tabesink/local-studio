# Reconciled Delivery Sequence and Work Packets

## Sequence overview

```text
foundation
-> cookie session
-> dark shell
-> safe settings
-> domain lifecycle
-> sources + preparation/index state
-> evidence-ready chat shell
-> P7 streaming chat
-> graph shell after proxy proof
-> authorized source navigation after separate proof
-> audit/diagnostics
```

## WP-01 — Runtime and Contract Base

| Field | Plan |
|---|---|
| Frontend slices | F01 |
| Backend prerequisite | P1 error/request-ID contract |
| Reference use | Local Studio app error/page-state patterns; old CE transport structure only |
| Avoid | old CE bearer/localStorage; broad provider/global stores |
| API gate | Base URL, versioning, error DTO, cookie transport |
| Visible outcome | Dark route shell can safely load/fail. |
| Test gate | Client normalization, cookie credentials, root error/not-found/loading, type compile. |

## WP-02 — Login and Authenticated Shell

| Field | Plan |
|---|---|
| Frontend slices | F02, F03, F04 |
| Backend prerequisite | P1 auth/session/current user |
| Reference use | old CE login/session visual shape; old CE SettingsDialog a11y; Local Studio dark shell/sidebar |
| Avoid | token persistence, local-only logout, incomplete admin filtering |
| API gate | P1 login/me/logout and cookie/CSRF policy |
| Visible outcome | User logs in, sees dark shell; Settings General works. |
| Test gate | Reload session; no storage token; member/admin nav matrix; keyboard dialog behavior. |

## WP-03 — Trusted Settings

| Field | Plan |
|---|---|
| Frontend slices | F07, F08; F05 read-only list only if P1 list exists |
| Backend prerequisite | P2 runtime settings |
| Reference use | old CE form/list geometry; Local Studio settings density |
| Avoid | provider test/discovery, base URLs, generic config JSON, parser profiles, user CRUD without API |
| API gate | P2 safe runtime-settings fixture |
| Visible outcome | Admin sees/configures safe known-provider/model/parser settings. |
| Test gate | Secrets absent; P2 validation field mapping; member 403; no external provider browser calls. |

## WP-04 — Knowledge Domains and Lifecycle

| Field | Plan |
|---|---|
| Frontend slices | F06, F14 |
| Backend prerequisite | P3 domain registry/lifecycle |
| Reference use | old CE domain cards; Local Studio status/action density |
| Avoid | repair/recreate, Docker controls, runtime URLs/details |
| API gate | P3 status/action/202/deletion fixture |
| Visible outcome | Admin sees domains, starts/stops/deletes safely. |
| Test gate | Active operation conflict; deletion remains pending until backend removal; member forbidden. |

## WP-05 — Sources, Preparation, and Index Eligibility

| Field | Plan |
|---|---|
| Frontend slices | F09, F10 |
| Backend prerequisite | P4 then P5 |
| Reference use | old CE documents table/upload dialog; Local Studio list/detail/right panel pattern |
| Avoid | generic document library, fake percentages, generic operations endpoint, member original download |
| API gate | P4 source upload/list/detail/outline + P5 safe index state |
| Visible outcome | Admin uploads source, sees preparation and separate index truth. |
| Test gate | multipart, source lifecycle status distinction, bounded polling, 202 delete, no source path exposure. |

## WP-06 — Evidence-Ready Chat Shell

| Field | Plan |
|---|---|
| Frontend slices | F11; metadata portion of F16 |
| Backend prerequisite | P3 available domains, P5 eligibility, P6 evidence, P7 conversations planned |
| Reference use | old CE chat composition/domain selector; Local Studio dark workbench/readability |
| Avoid | retrieval controls, source selectors, general chat, full source navigation |
| API gate | available domains + P6 safe evidence response + P7 conversation contract decision |
| Visible outcome | User selects available domain, sees setup/no-source/evidence state without fabricated answer. |
| Test gate | unavailable/no-ready source safe states; evidence response lacks private IDs; metadata-only panel. |

## WP-07 — Grounded Streaming Chat

| Field | Plan |
|---|---|
| Frontend slices | F12 |
| Backend prerequisite | P7 SSE fixture |
| Reference use | old CE parser/reducer concepts; Local Studio stable stream UX |
| Avoid | old endpoint/events, raw provider output, reconnect, browser provider config |
| API gate | exact P7 event specification and fixtures |
| Visible outcome | Owned conversation streams grounded answer or evidence-only/no-context terminal state. |
| Test gate | evidence first; split event frame; duplicate request; abort; terminal-state lock; redacted history. |

## WP-08 — Graph, Activity, Diagnostics

| Field | Plan |
|---|---|
| Frontend slices | F13, F15, F17 |
| Backend prerequisite | future graph proxy; P3/P4/P5 resource history; P8 audit/diagnostics |
| Reference use | Local Studio inspector/list visuals; old CE graph route concept |
| Avoid | raw LightRAG/raw logs/browser controller access/generic operations backend |
| API gate | graph DTO; resource-specific list adapters; P8 audit/diagnostic DTO |
| Visible outcome | Safe graph shell, admin Activity composition, audit/diagnostics. |
| Test gate | keyboard graph fallback; no raw logs; admin-only; safe redaction. |

## WP-09 — Later Authorized Source Navigation

| Field | Plan |
|---|---|
| Frontend slices | real F16 behavior only |
| Backend prerequisite | distinct approved source-view/asset contract after P6/P7 stability |
| Reference use | old CE source inspector layout; Local Studio right detail panel |
| Avoid | source path construction, full document browser, storage URLs |
| API gate | opaque authorized handle, safe source detail DTO, deletion/redaction checks |
| Visible outcome | User opens only authorized, safe source detail. |
| Test gate | no cross-domain/missing/deleted source view; asset authorization; audit if required. |
