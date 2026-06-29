# Old Context Engine v1 — Retention / Adaptation / Removal Map

| Old CE area | Observed current behavior | Keep | Adapt | Remove | Reason | Target replacement |
|---|---|---:|---:|---:|---|---|
| API client | `client/src/lib/api/client.ts` combines cookie credentials with localStorage bearer token / Authorization header | transport/error normalization | yes | bearer storage/header branch | P1 opaque cookie session is authority | one `apiRequest()` with cookie credentials and typed errors |
| Auth API | `client/src/lib/api/auth.ts` expects `access_token`; logout is local-only | route wrapper idea | yes | token DTO/local-only logout | P1 login does not return token; logout revokes server session | P1 versioned auth adapter |
| App layout / rail | `AppLayout`, `AppPageFrame`, `AppSideRail` | route grouping / active route logic | yes | light visual base / incomplete role assumptions | Local Studio dark-first visual decision; backend role truth | dark application shell, canonical nav config |
| Settings dialog | `SettingsDialog` with Radix focus restore, General/Users/Domains/Provider/Parser sections | a11y dialog mechanics | yes | current admin filtering rules | old filtering does not fully match greenfield admin policy | role-filtered dark dialog/sheet coordinator |
| Users admin UI | old users API/UI surfaces | table/form structure | later | assumed CRUD now | P1 only proves list; greenfield user writes deferred | read-only list then approved management slice |
| AI/provider settings | legacy `ai-settings` and provider secret APIs | dense list/editor composition | yes | arbitrary base URL, secret names, broad profile config, network test/validate flow | P2 intentionally narrows trusted configuration | `RuntimeSettingsPanel` for known provider kinds and model profiles |
| Parser settings | legacy parser profile/settings behavior | panel geometry/status copy | yes | profiles/config JSON/test assumptions | P2 one active parser kind, no P2 provider call | active parser selector + safe Reducto config status |
| Domains/lifecycle | domain cards/actions | list/detail/action visual seam | yes | direct runtime info and repair/recreate controls | P3 server-controlled low-entropy lifecycle | P3 lifecycle adapter + explicit delete dialog |
| Documents library | generic documents list/status | table density/status badge | yes | generic member list and `/documents` contract | P4 source documents are domain-scoped/admin-only | Sources Library adapter |
| Upload / operations | upload progress/polling patterns | dialog + bounded polling | yes | generic operation table/route; fake percent | P4/P5 resource-specific state and no generic ops backend | source preparation/index status UI |
| Chat shell | `LightRagChatShell`, composer, messages | screen composition, message stability | yes | direct LightRAG / legacy endpoint behavior | P7 conversation-owned RAG-only stream | P7 conversation feature |
| Retrieval settings popover | query controls such as mode/top-k/reranker | no | no | yes | Browser cannot control provider/retrieval settings | none |
| SSE handler | sources/completion/evidence terminal processing | reducer/parser separation | yes | route/event names/assumed payload | P7 contract differs | typed P7 stream adapter after fixture |
| Evidence/source inspector | side panel and source navigation concepts | metadata panel structure | yes | source path, full source/open, asset assumptions | P6 prohibits source navigation/content access | metadata-only `EvidencePanel` seam |
| Knowledge graph route | `database-visualize` concept | route shell | later | direct graph assumptions | Greenfield graph proxy unproven | API-neutral graph shell after contract |
| Audit/log UI | legacy logs/operations concepts | dense support table | later | raw logs/provider internals | P8 safe audit/diagnostics only | P8 audit + capped diagnostics pages |
| Tokens/theme | white/light-neutral styles | spacing/radius habits only | yes | light-first visual default | target decision is dark-first Local Studio parity | token layer with dark semantic vars |

## Mandatory legacy removals

```text
context_engine_access_token localStorage key
Authorization bearer composition in browser client
access_token / refresh token UI assumptions
local-only logout
browser retrieval-settings controls
browser-visible provider model overrides
raw source/path/asset navigation
legacy generic /operations contract assumptions
unbounded source/log viewers
```

## Suggested migration sequence for old CE code

```text
1. Extract visual-only component markup and a11y behavior.
2. Delete API imports and store dependencies.
3. Replace with feature-local Context Engine view model props.
4. Reintroduce typed greenfield API wrapper only after contract fixture exists.
5. Add security response-shape tests before rendering sensitive detail.
```
