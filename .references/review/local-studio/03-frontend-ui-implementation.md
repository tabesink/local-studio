\
# 03 — Frontend, UI, and Implementation

## 13. Lean frontend architecture

### Target tree

```text
client/src/
├── app/
│   ├── domains/[domainId]/chat/
│   ├── domains/[domainId]/library/
│   ├── domains/[domainId]/graph/
│   ├── settings/
│   └── admin/
├── components/
│   ├── ui/
│   └── layout/
├── features/
│   ├── auth/
│   ├── domains/
│   ├── query/
│   ├── library/
│   ├── graph/
│   ├── ingestion/
│   ├── providers/
│   └── operations/
├── lib/
│   ├── api/
│   │   ├── generated.ts
│   │   ├── http.ts
│   │   └── errors.ts
│   └── stream/
│       └── parse-sse.ts
└── stores/
    └── ui-preferences.ts
```

### Folder rule

| Folder | Job | May own | Must not own |
|---|---|---|---|
| `app` | Route composition | route params, page composition | HTTP details, business rules |
| `components/ui` | Shared visual primitives | DOM/accessibility/variant behavior | domain data |
| `components/layout` | shell/sidebar/panel | local layout state | FastAPI business state |
| `features/*` | one product capability | feature state, view models | unrelated capability code |
| `lib/api` | typed HTTP | request/response/error mapping | React rendering |
| `lib/stream` | SSE parser | frames -> typed events | UI components |
| `stores/ui-preferences` | theme/sidebar only | non-secret browser preferences | auth, documents, chat history |

### File rule

```text
Page calls feature component.
Feature calls feature API module.
Feature API module calls shared http client.
Shared http client knows cookies/errors/CSRF.
No page calls fetch directly.
```

### Do not add now

```text
features/agent
features/terminal
features/filesystem
features/sessions
lib/plugin-system
lib/event-bus
lib/tool-registry
```

When future capability becomes real:

```text
One feature folder.
One API module.
One route group.
One FastAPI domain module.
One explicit model group.
One test suite.
```

---

## 14. Route and navigation plan

```text
Context Engine
├── Domain selector
├── Query
├── Library
├── Graph
├── Settings
│   ├── Account
│   └── Appearance
└── Admin [admin only]
    ├── Domains
    ├── Ingestion
    ├── Operations
    ├── Providers
    └── Users
```

| Route | Audience | Main job | Primary data | Detail panel |
|---|---|---|---|---|
| `/` | Signed-in | Select/redirect active domain | domains | No |
| `/domains/[id]/chat` | Member/admin | Grounded RAG question | current turn/evidence | citation/source/chunk |
| `/domains/[id]/library` | Member/admin | Browse documents | documents | document/chunk/job |
| `/domains/[id]/graph` | Member/admin | Explore graph | graph nodes/edges | node/evidence |
| `/settings/account` | Member/admin | Account/preferences | CurrentUser | No |
| `/settings/appearance` | Member/admin | Theme/scale if retained | UI preferences | No |
| `/admin/domains` | Admin | Lifecycle | domains/operations | domain metadata |
| `/admin/ingestion` | Admin | Jobs | ingestion jobs | diagnostics/log |
| `/admin/operations` | Admin | Admin audit/activity | operations | operation payload/log |
| `/admin/providers` | Admin | Provider/models | provider config | test/status |
| `/admin/users` | Admin | User admin | users | user detail |

### Route access

```text
Client nav gate = usability.
FastAPI role dependency = security.
Both required.
```

Member path to `/admin/*`:

```text
client asks session/me
-> role not admin
-> redirect to forbidden page or nearest allowed route
-> direct API call still gets 403
```

---

## 15. Visual parity implementation rules

Use attached `design.md` as Context Engine UI source of truth. Local Studio source remains visual reference.

### Required visual grammar

```text
Default = zai-dark.
Light = zai-light match.
Fonts = Geist / Geist Mono.
Sidebar = 224px expanded / 48px collapsed.
Rows = 24px or 28px.
Controls = 28px where primitive supports it.
Radius base = 7px.
Space rhythm = 4px.
Shell = left rail | center canvas | optional right detail panel.
Primary action = high-contrast monochrome.
```

### Local Studio token values

| Token role | Dark | Light |
|---|---|---|
| Root | `#0f0f0f` | `#f4f5f5` |
| Header | `#101010` | `#fbfbfb` |
| Panel | `#111111` | `#fbfbfb` |
| Sidebar | `#191919` | `#eceeee` |
| Card | `#202020` | `#fbfbfb` |
| Popover | `#222222` | `#fbfbfb` |
| Input | `#242424` | `#fbfbfb` |
| Border | `#ffffff14` | `#0d0d0d1a` |
| Foreground | `#e7e7e7` | dark foreground token |
| Primary | `#ffffff` | `#000000` |

Use `--ui-*` aliases. Do not hard-code these values per feature.

### Primitive first

```text
Button
Input
Select
Textarea
FormField
Tabs
SegmentedControl
Table
ListGroup
Modal
Drawer
RightDetailPanel
ProgressBar
ErrorBox
StatusDot
StatusPill
```

### Product mapping

| Context Engine screen | Local Studio pattern | Data difference |
|---|---|---|
| Domain list | Sidebar/list row | Domain status, embedding profile |
| Query | Agent composer/thread | RAG question/evidence, not agent tools |
| Evidence | Right detail panel | document/chunk/asset |
| Library | Dense table/list | documents/jobs |
| Upload | Compact modal | parser + ingestion state |
| Graph | Work canvas + detail panel | graph node/evidence |
| Providers | Settings rows | FastAPI profiles/secrets |
| Operations | Table + detail panel | admin records/logs |

### Do not do

```text
No blue SaaS primary buttons.
No dashboard card grid.
No decorative gradients.
No page-level shadows.
No full-pill default controls.
No feature-owned design tokens.
No generic shadcn colors/radius.
No oversized titles.
No terminal-looking UI until terminal exists.
No fake session history.
```

---

## 16. Vertical-slice implementation plan

### Phase 0 — Evidence baseline and contract map

**Goal**

Confirm runtime reality before change.

**Scope**

```text
Run Docker Compose.
Record exact SHAs.
List routes/OpenAPI.
Test current auth, retrieve, document, job, graph flows.
Capture baseline screenshots.
```

**Do not build**

```text
No refactor.
No visual rewrite.
```

**Acceptance**

```text
Current behavior documented.
Known gaps labeled verified/unverified.
```

**Junior note**

Do not start UI migration from assumptions.

---

### Phase 1 — Cookie auth and role contract

**Goal**

Remove browser token storage.

**Backend**

```text
Session cookie.
CSRF guard.
/session/me.
Role dependencies.
Canonical error envelope.
```

**Frontend**

```text
Delete token persistence.
credentials: include.
Bootstrap user from session/me.
Admin nav gate.
Forbidden route state.
```

**Do not build**

```text
No new user role system.
No auth provider abstraction.
```

**Acceptance**

```text
docker compose up creates seed admin.
Admin login succeeds.
Member fixture login succeeds.
Member gets 403 from admin API.
Admin navigation hidden for member.
Direct admin URL forbidden/redirected.
No credential in localStorage/sessionStorage.
```

---

### Phase 2 — Local Studio tokens, primitives, shell

**Goal**

One visual foundation.

**Frontend**

```text
Port/adapt tokens.
Port required primitives.
Migrate AppLayout/sidebar/page frame/right detail panel.
```

**Backend**

```text
None.
```

**Do not build**

```text
No page rewrite yet.
No new token system.
```

**Acceptance**

```text
Existing routes still work.
Dark/light match token rules.
Shell matches rail/canvas/panel grammar.
```

---

### Phase 3 — Typed streaming chat + evidence panel

**Goal**

One real RAG turn stream.

**Backend**

```text
New typed SSE endpoint.
Reuse retrieval/evidence mapping.
Provider stream integration.
Disconnect handling.
```

**Frontend**

```text
Replace JSON pseudo-stream adapter.
One parse-sse module.
Feature-local turn state.
Composer/thread/evidence panel.
AbortController stop.
```

**Do not build**

```text
No conversations.
No agent runtime.
No WebSocket.
No tool events.
```

**Acceptance**

```text
Text renders incrementally.
Evidence appears.
Citation opens detail panel.
Stop aborts stream.
Failure is typed/recoverable.
```

---

### Phase 4 — Library, upload, ingestion

**Goal**

Preserve document workflow. Restyle it.

**Backend**

```text
Normalize document/job responses.
Upload returns document + job.
Pagination contract adapter.
```

**Frontend**

```text
Library table.
Upload modal.
Job status/progress.
Document/chunk/job panel.
```

**Do not build**

```text
No document filesystem.
No bulk workflow unless current requirement.
```

---

### Phase 5 — Graph parity

**Goal**

Preserve graph. Match workspace visual system.

**Backend**

```text
Domain-scoped graph response.
Explicit labels/filter contract.
```

**Frontend**

```text
Graph canvas stays.
Replace chrome/details with shared primitives.
```

**Do not build**

```text
No new graph algorithm.
No visualization rewrite without defect/need.
```

---

### Phase 6 — Providers, operations, admin

**Goal**

Compact admin workbench.

**Backend**

```text
Normalize provider/operation models.
No secrets returned after save.
Lifecycle schema cleanup.
```

**Frontend**

```text
Settings rows.
Operations table.
Right detail inspection.
```

**Do not build**

```text
No provider marketplace.
No analytics dashboard.
```

---

### Phase 7 — Contract cleanup and regression

**Goal**

Remove duplicate paths. Stop drift.

**Scope**

```text
Deprecate old retrieve path after migration.
Delete dead client adapters.
OpenAPI type generation CI.
Visual regression CI or release gate.
```

**Acceptance**

```text
One query API.
One auth transport.
One token system.
One SSE parser.
```

---

### Phase 8 — Future capability decision gate

**Goal**

Decide. Do not build.

| Capability | Start only when | Required before code |
|---|---|---|
| Agent runtime | Named multi-step tool workflow | Tool policy, run model, audit, budget, cancellation |
| Terminal | Controlled execution product requirement | Isolation, allowlist, network/FS policy, security review |
| Artifact system | Durable generated output requirement | Workspace storage/retention/access policy |
| Sessions | Approved history/retention use case | Privacy, delete/export, authorization, retention policy |

---

## 17. Junior developer do / do not guide

### Add evidence field

**Do**

```text
Pydantic model
-> OpenAPI generation
-> TypeScript generated type
-> feature API module
-> feature UI
-> test
```

**Do not**

```text
Add field only in React.
Infer from response text.
Put server truth in Zustand.
```

### Add a future tool event

**Do**

```text
Approved agent requirement
-> AgentRun model
-> tool authorization
-> typed event
-> server test
-> parser update
-> small UI status row
```

**Do not**

```text
Add tool_call?: any now.
Add generic event UI now.
```

### Add terminal

**Do**

```text
Security review
-> isolated execution runtime
-> allowlist
-> per-run auth
-> audit
-> resource limits
-> cancel
-> typed events
-> UI
```

**Do not**

```python
subprocess.run(user_input, shell=True)
```

### Add conversation history

**Do**

```text
Approved retention requirement
-> Session/Turn models
-> access policy
-> delete/export policy
-> storage migration
-> UI
```

**Do not**

```text
Persist every question "for future".
```

### Add UI component

**Do**

```text
Check token.
Check primitive.
Check Local Studio pattern.
Add narrow variant only if reused.
```

**Do not**

```text
Create local color/radius system.
Wrap every row in card.
Use blue default button.
```

---

## 18. Tests and visual regression

### Backend

```text
pytest auth cookie/session tests
CSRF tests
role 403 tests
OpenAPI snapshot/change test
SSE event order test
SSE failure test
client disconnect test
lifecycle transition test
document/job authorization test
provider secret masking test
```

### Frontend/E2E

```text
Admin login.
Member login.
No browser credential storage.
Member cannot see admin nav.
Member direct admin route forbidden.
Query delta rendering.
Stop query.
Citation detail panel.
Upload/job progress.
Graph node detail.
```

### Visual snapshots

```text
1440x900 dark:
chat, library, graph, settings, admin

1440x900 light:
chat, library, settings

1280x800 dark:
shell/table/detail density

narrow width:
sidebar/drawer/composer changed surfaces
```

Review:

```text
font
control height
row density
surface stack
border contrast
radius
rail width
right panel width
status tone
accidental generic shadcn styling
```

---

## 19. Risks, non-goals, deferred decisions

### Risks

| Risk | Control |
|---|---|
| Cookie auth breaks cross-origin dev | Use same-origin `/api` proxy. Test CORS/cookies. |
| CSRF omitted | Add origin + CSRF protection before cookie migration complete. |
| Proxy buffers SSE | Disable buffering. Test first delta timing. |
| Provider ignores disconnect | Measure. Add server cancel only if needed. |
| Old/new API overlap drifts | Migration table. Delete legacy adapter in Phase 7. |
| Local Studio source copied without license check | Verify license/NOTICE before port. Preserve required notices. |
| Domain authorization differs by route | Central FastAPI dependency. Route tests. |

### Non-goals

```text
No Local Studio controller.
No Pi agent runtime.
No Electron.
No terminal.
No host filesystem UI.
No WebSocket.
No agent/session persistence.
No plugin framework.
No broad rewrite.
No visual redesign.
```

### Deferred decisions

```text
Member domain assignment rules.
Archive vs permanent delete semantics.
Exact provider cancellation behavior.
Whether chats ever persist.
Whether future artifacts use object storage or workspace volume.
Whether snapshots run CI or release gate.
```

---

## 20. Future capability decision gate

### Agent runtime readiness

All true before code:

```text
[ ] Approved named user workflow.
[ ] Tool list.
[ ] Tool permissions.
[ ] Run model.
[ ] Timeout/cancel.
[ ] Budget/cost rule.
[ ] Audit retention.
[ ] Security review.
[ ] API events.
[ ] Test plan.
```

### Terminal readiness

```text
[ ] Real controlled execution need.
[ ] Isolated runtime selected.
[ ] No host filesystem exposure.
[ ] Command allowlist.
[ ] Network policy.
[ ] CPU/memory/time limits.
[ ] Output cap.
[ ] Secret redaction.
[ ] Per-run auth/audit.
[ ] Cancel/cleanup.
[ ] Security review.
```

### Artifact/filesystem readiness

```text
[ ] Real generated artifact need.
[ ] Workspace model approved.
[ ] Storage chosen.
[ ] Access model.
[ ] Retention/delete/export policy.
[ ] Artifact model separate from Document.
[ ] Security/content policy.
```

### Session persistence readiness

```text
[ ] User value defined.
[ ] Retention duration.
[ ] Access policy.
[ ] Delete/export.
[ ] Admin audit decision.
[ ] Sensitive data policy.
[ ] DB migration.
[ ] API contract.
[ ] Test plan.
```

### Final rule

```text
Checklist incomplete -> capability stays future-only.
```
