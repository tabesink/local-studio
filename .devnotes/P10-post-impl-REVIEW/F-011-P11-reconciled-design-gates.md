# F-011 / P11 Reconciled Design Gates

Status: review decision draft  
Feature: F-011 - Knowledge Curation Workspace  
Date: 2026-07-07  
Method: grill-with-docs

## Scope

This document answers the "Questions MUST Answer Before Coding" in `.devnotes/P10-post-impl-REVIEW/F-011-P11-readiness.md`.

It is not implementation authority by itself. Before coding, patch the source-of-truth files named below and get the feature/contract deltas reviewed.

Canonical patch targets:

- `specs/04-features/F-011-knowledge-curation-workspace/spec.md`
- `specs/04-features/F-011-knowledge-curation-workspace/plan.md`
- `specs/04-features/F-011-knowledge-curation-workspace/tasks.md`
- `specs/04-features/F-011-knowledge-curation-workspace/test-plan.md`
- `specs/04-features/F-011-knowledge-curation-workspace/acceptance.md`
- `specs/04-features/F-011-knowledge-curation-workspace/ux.md`
- `specs/03-contracts/api/context-engine-v1.md`
- `specs/03-contracts/data/context-engine-data.md`

Conditional patch targets:

- `specs/03-contracts/ai/grounded-answering.md` only if Smart Composer generates, rewrites, or evaluates wiki text.
- `specs/03-contracts/events/context-engine-sse-v1.md` only if P11 streams composer/review/publish progress.
- `specs/05-quality/security-and-privacy.md` only if P11 adds new public/safe data classes beyond existing QA-002 rules.
- `specs/05-quality/observability.md` only if P11 adds new audit/log names or diagnostic surfaces.

User decisions already made: none for P11. The P10 first-gate decisions remain accepted and fenced: Runtime Node, Logs, Usage, storage summaries, Docker environment UI/API, worker containers, and P10 Playwright proof do not move into P11 by default.

## Sources Grilled

- `AGENTS.md`
- `README.md`
- `specs/00-governance/constitution.md`
- `CONTEXT.md`
- `DESIGN.md`
- `specs/02-architecture/system-context.md`
- `specs/02-architecture/component-boundaries.md`
- `specs/03-contracts/api/context-engine-v1.md`
- `specs/03-contracts/data/context-engine-data.md`
- `specs/03-contracts/events/context-engine-sse-v1.md`
- `specs/03-contracts/ai/grounded-answering.md`
- `specs/05-quality/security-and-privacy.md`
- `specs/05-quality/observability.md`
- `specs/05-quality/test-strategy.md`
- `specs/07-traceability/feature-register.md`
- `specs/04-features/F-009-frontend-delivery/spec.md`
- `specs/04-features/F-009-frontend-delivery/acceptance.md`
- `specs/04-features/F-009-frontend-delivery/ce-client-port-and-parity.md`
- `specs/04-features/F-009-frontend-delivery/context-panel-tabs.md`
- `specs/04-features/F-010-shared-node-operations/spec.md`
- `specs/04-features/F-010-shared-node-operations/plan.md`
- `specs/04-features/F-010-shared-node-operations/tasks.md`
- `specs/04-features/F-010-shared-node-operations/test-plan.md`
- `specs/04-features/F-010-shared-node-operations/acceptance.md`
- `specs/04-features/F-010-shared-node-operations/implementation-log.md`
- `specs/04-features/F-011-knowledge-curation-workspace/` empty folder state
- `.devnotes/P10-post-impl-REVIEW/F-011-P11-readiness.md`
- `.devnotes/P10-post-impl-REVIEW/ID-A.md`
- `.devnotes/P10-post-impl-REVIEW/ID-A-contract-spine.md`
- `.devnotes/P10-post-impl-REVIEW/ID-A-smart-composer-boundary.md`
- `.devnotes/P10-post-impl-REVIEW/ID-A-reference-adaptation.md`
- `.devnotes/P10-post-impl-REVIEW/ID-A-p10-carry-forward-gates.md`
- `.devnotes/P3-post-impl-REVIEW/F-004-P4-reconciled-design-gates.md`
- `.references/obsidian-smart-composer_impl_docs/README.md`
- `.references/obsidian-smart-composer_impl_docs/SOURCE_PIN.md`
- `.references/obsidian-smart-composer_impl_docs/COPYING_AND_ATTRIBUTION.md`
- `.references/obsidian-smart-composer_impl_docs/REVIEW_SUMMARY.md`
- `.references/obsidian-smart-composer_impl_docs/specs/02-architecture/source-to-target-adaptation.md`

## Product DNA Locks

- Use canonical product terms: Wiki Page, Wiki Revision, Wiki Contribution, Smart Composer, Evidence, Citation, Turn, Knowledge Domain, Source Document, Redaction, Administrator, Member.
- P11 creates a governed wiki curation workspace on top of authorized Evidence, Citations, Wiki Contributions, and immutable Wiki Revisions.
- P11 does not create Runtime Node, Node Environment, Logs, Usage, storage summary, Docker environment, worker-service, or P10 Playwright surfaces.
- Smart Composer is a governed UI workflow over backend-owned Wiki Contributions. It is not the main chat editor, a browser-owned wiki writer, a provider prompt surface, or a filesystem apply tool.
- FastAPI owns authz, contribution state transitions, publish, review, redaction/delete behavior, AI prompt construction if approved, safe DTO projection, audit/log metadata, and persistence.
- Browser owns rendering, local form interaction, and typed Context Engine API calls only. It never talks to providers, LightRAG, storage, Docker, runtime targets, database, controller, host paths, or private source/block ids.
- Wiki Revision is immutable. Do not overwrite a published revision to edit a page.
- Wiki Contribution is durable product state. Do not treat local browser storage as the source of truth.
- `.references/obsidian-smart-composer_impl_docs/` is evidence only. Do not port Obsidian host APIs, vault persistence, local RAG, direct provider calls, OAuth, MCP, local DB/JSON authority, or direct filesystem writes.
- KISS/YAGNI: no generic workflow engine, generic JSON state machine, Redis/RQ/Celery, plugin framework, event bus, second retrieval stack, or broad apply/diff system unless an approved spec requires it now.

## Recommended Build Shape

```text
P11 first vertical slice, recommended

F-011 feature package
  -> acceptance and task order
  -> role/state/redaction decisions

API-001
  -> safe Wiki Page reads
  -> safe Wiki Contribution create/update/submit
  -> admin review/publish/reject actions
  -> safe errors and role rules

DATA-001
  -> wiki_pages
  -> wiki_revisions
  -> wiki_contributions
  -> optional typed evidence traceability join
  -> closed contribution/page states
  -> revision immutability constraints

FastAPI service layer
  -> WikiContributionService
  -> WikiPublishService
  -> optional SmartComposerAssistService only after AI-001 patch
  -> no direct browser private-service access

Next.js P11 UI
  -> Local Studio-parity composer/review surface
  -> typed API wrappers only
  -> no durable draft truth in browser storage
  -> no provider, prompt, retrieval, storage, runtime, Docker, or private id controls
```

## A. Contract / Data / API Gates

### A1. What are the approved P11 acceptance criteria?

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| Option 1: write F-011 feature package before coding | Matches AGENTS workflow and stops invented behavior | Delays implementation | `spec.md`, `plan.md`, `tasks.md`, `test-plan.md`, `acceptance.md`, `ux.md` |
| Option 2: infer criteria from `README.md` roadmap line | Fast | Too vague for code, tests, roles, routes, and data | "wiki library and Smart Composer" only |
| Option 3: implement from Smart Composer reference package | Rich behavior source | Ports non-portable Obsidian/runtime/provider behavior | local vault composer clone |

Recommendation: Option 1. P11 coding is blocked until the F-011 feature package exists.

Patch F-011 spec with:

```text
Outcome:
  governed wiki curation workspace
  backend-owned Wiki Contributions
  immutable Wiki Revisions
  safe Wiki Page reads
  Smart Composer UI over approved DTOs

Out of scope:
  Obsidian runtime/vault/provider/MCP/filesystem behavior
  P10 Runtime Node/Logs/Usage/storage/Docker work
  browser-owned wiki writes
  uncontracted source navigation
```

Patch F-011 acceptance with proof rows for:

```text
contracts patched
migration/fresh upgrade
authz and role gates
contribution state machine
revision immutability
redaction/delete behavior
safety scan
frontend visual/e2e if UI ships
```

Open decision: exact P11 acceptance criteria remain unresolved until F-011 docs are created. Owner patch target: `specs/04-features/F-011-knowledge-curation-workspace/acceptance.md`.

### A2. What routes create, read, submit, review, publish, and reject Wiki Contributions?

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| Option 1: contract minimal contribution workflow routes | Smallest useful vertical slice, testable | Still needs role/state details | create, update, submit, publish, reject |
| Option 2: build full wiki/admin/composer API at once | Fewer later patches | High drift and large blast radius | pages, revisions, templates, assist, export, review queue all together |
| Option 3: no API, browser-local drafts only | Fast UI prototype | Violates durable backend-owned product state | local draft cache |

Recommendation: Option 1. Patch API-001 for one minimal P11 workflow before implementation.

Patch API-001 with candidate route set:

```text
GET    /wiki/pages
GET    /wiki/pages/{page_id}
GET    /wiki/pages/{page_id}/revisions
GET    /wiki/contributions
POST   /wiki/contributions
GET    /wiki/contributions/{contribution_id}
PATCH  /wiki/contributions/{contribution_id}
POST   /wiki/contributions/{contribution_id}:submit
POST   /admin/wiki/contributions/{contribution_id}:publish
POST   /admin/wiki/contributions/{contribution_id}:reject
```

Patch API-001 DTO rules:

```text
safe page summary
safe page detail
safe revision summary/detail
safe contribution summary/detail
safe review action response
canonical error envelope
no private source/block ids in public DTOs
no raw Evidence, raw source text, prompts, provider payloads, storage targets, runtime targets, or stack traces
```

Open decision: exact route names and admin/member split are not approved until API-001 is patched.

### A3. What tables own Wiki Pages, Wiki Revisions, and Wiki Contributions?

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| Option 1: typed wiki tables with closed enums | Matches DATA-001 discipline and revision immutability | Requires migration and constraints | `wiki_pages`, `wiki_revisions`, `wiki_contributions` |
| Option 2: one generic JSON document table | Quick and flexible | Duplicates truth, hides state machine, weak tests | `wiki_items.payload` |
| Option 3: store wiki as files/source documents | Reuses storage ideas | Confuses Wiki Page with Source Document and risks filesystem writes | markdown files |

Recommendation: Option 1. DATA-001 must own typed tables and state enums before code.

Patch DATA-001 with candidate tables:

```text
wiki_pages
  id
  slug or stable_key
  title
  state
  current_revision_id nullable FK wiki_revisions.id
  created_at
  updated_at

wiki_revisions
  id
  wiki_page_id FK wiki_pages.id
  revision_number
  title
  body
  published_from_contribution_id FK wiki_contributions.id
  published_by_user_id FK users.id
  published_at
  created_at

wiki_contributions
  id
  target_wiki_page_id nullable FK wiki_pages.id
  title
  body
  state
  created_by_user_id FK users.id
  reviewed_by_user_id nullable FK users.id
  created_at
  updated_at
  submitted_at nullable
  reviewed_at nullable
```

Patch DATA-001 constraints:

```text
unique(wiki_page_id, revision_number)
check contribution state in approved closed set
check page state in approved closed set
published revisions are immutable by service and test contract
current_revision_id changes only through publish service
```

Open decision: exact `state` enum values and slug/stable-key policy remain F-011/DATA-001 decisions.

### A4. What safe evidence/citation references may a contribution store?

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| Option 1: store only approved safe turn/evidence/citation refs | Traceable without exposing private source/block ids | Needs API/DATA contract detail | turn-scoped evidence ref id |
| Option 2: store private Source Document and Source Block ids directly | Easy backend joins | Violates public/private evidence boundary if exposed | source block FK in DTO |
| Option 3: store raw source excerpts in contribution rows | Good offline context | Restricted data and redaction risk | copied source paragraph |

Recommendation: Option 1. Store typed safe refs or backend-private join rows only after API-001/DATA-001 define them.

Patch DATA-001 with one of:

```text
wiki_contribution_evidence_refs
  id
  contribution_id FK wiki_contributions.id
  turn_id nullable FK conversation_turns.id
  safe_evidence_ref_id or approved source_ref
  citation_label nullable safe string
  created_at
```

or:

```text
contribution evidence traceability is deferred
P11 v1 stores no durable evidence refs
UI may prefill context but publish does not claim evidence traceability
```

Patch API-001 with:

```text
allowed input ref shapes
safe output ref shapes
authorization checks for every supplied ref
behavior when a ref is no longer authorized or redacted
```

Open decision: P11 must choose between traceable evidence refs in v1 or no durable evidence traceability in v1. Owner patch targets: DATA-001 and API-001.

### A5. Does Smart Composer generate/rewrite text through AI?

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| Option 1: manual drafting first, AI assist deferred | Lowest risk and no new AI contract | Less Smart Composer value in v1 | user edits contribution body manually |
| Option 2: backend-owned AI assist after AI-001 patch | Useful and contract-safe | Requires prompt/model/failure tests | rewrite draft from approved context |
| Option 3: browser-owned AI/provider prompt flow | Fast to prototype | Violates AI-001 and QA-002 | component calls provider |

Recommendation: Option 1 for the first P11 coding slice unless the team explicitly patches AI-001. Option 2 is acceptable only after AI-001 captures the behavior. Option 3 is rejected.

Patch F-011 spec with:

```text
P11 v1 Smart Composer is manual drafting unless AI-001 is patched.
No browser model/provider/prompt/retrieval controls.
```

If choosing AI assist, patch AI-001 with:

```text
operation names
approved inputs
prompt ownership
model/profile resolution
context limits
safe failure modes
no raw prompt or provider payload in API/SSE/log/trace/fixture/screenshot evidence
mocked provider tests
```

Open decision: whether P11 v1 includes AI assist. Owner patch target: `specs/03-contracts/ai/grounded-answering.md`.

### A6. Is any P11 operation streamed?

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| Option 1: no P11 streaming in first slice | Simpler API, fewer fixtures, easier tests | No live generation/progress UI | normal JSON responses |
| Option 2: stream only AI assist after EVT-001 patch | Better UX for generation | Needs event order/replay/terminal contract | `composer.stage`, `composer.done` |
| Option 3: reuse P7 turn stream shape | Familiar | Semantically wrong for wiki workflow | chat `token` events for contribution publish |

Recommendation: Option 1 unless AI assist or long-running publish work is approved. Option 2 only after EVT-001 patch. Option 3 is rejected.

Patch F-011 spec with:

```text
P11 first contribution workflow uses normal JSON request/response.
Streaming is deferred unless EVT-001 is patched.
```

If streaming is approved, patch EVT-001 with:

```text
event names
payload shapes
ordering
terminal events
retry/replay behavior
auth and pre-stream error behavior
forbidden payload fields
fixture transcript requirements
```

Open decision: P11 streaming is deferred until the feature spec and EVT-001 require it.

## B. Runtime / Controller / Private Integration Gates

### B1. Does any browser-visible P11 field expose provider, prompt, storage, LightRAG, runtime, Docker, or private source/block ids?

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| Option 1: no browser-visible private fields | Matches AGENTS, GOV-001, ARCH-002, QA-002 | Requires backend-owned mapping and safe DTOs | safe contribution DTO |
| Option 2: expose opaque safe refs only after contract | Enables traceability | Needs validation and redaction rules | approved evidence ref |
| Option 3: expose raw ids/targets for debug | Easy debugging | Security/privacy violation | private source block id |

Recommendation: Option 1 for all P11 DTOs, with Option 2 only when API-001/DATA-001 define the ref contract. Option 3 is rejected.

Patch API-001 safe DTO rule:

```text
P11 DTOs never expose:
  provider target or payload
  prompt text
  storage target
  LightRAG target or raw hit
  runtime or Docker target
  database target
  private Source Document or Source Block ids
  raw Evidence
  raw source text
  stack trace
  credential material
```

Patch F-011 test-plan with:

```text
DTO safety scan over API responses, OpenAPI examples, logs, traces, screenshots, and acceptance evidence.
```

### B2. Does Smart Composer use existing P7 Evidence and Turn state only through backend services?

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| Option 1: backend services validate selected safe refs | Preserves P7 evidence boundary | Requires service helpers and authz tests | API validates contribution context refs |
| Option 2: frontend reuses local SSE evidence state as durable truth | Fast UI | Loses auth/redaction guarantees | browser posts cached evidence text |
| Option 3: Smart Composer calls retrieval directly | Fresh context | Adds second retrieval path and violates boundary | component retrieval request with private params |

Recommendation: Option 1. Smart Composer may read selected context only through backend-authorized APIs and approved safe refs.

Patch API-001 with:

```text
contribution create/update may accept only approved safe context refs
backend validates caller authorization for each ref
backend rejects missing, redacted, unauthorized, or stale refs with safe error codes
```

Patch DATA-001 with:

```text
if refs are persisted, define typed join rows and delete/redaction behavior
if refs are not persisted in v1, state that explicitly
```

### B3. Does P11 need a new retrieval path?

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| Option 1: no new retrieval path | Matches AI-001 single retrieval boundary and avoids second stack | Composer uses already authorized context only | selected Evidence refs |
| Option 2: backend service reuses existing P6/P7 retrieval only after spec patch | Possible future enhancement | Needs clear AI/evidence contract | suggest related evidence |
| Option 3: browser or composer uses direct LightRAG/local RAG | Fast reference parity | Explicitly forbidden | Smart Composer local RAG |

Recommendation: Option 1 for P11 first slice. Option 2 is a later explicit feature. Option 3 is rejected.

Patch F-011 spec with:

```text
P11 v1 does not add a retrieval path.
Smart Composer consumes approved existing Evidence/Citation/Turn refs only.
```

Patch AI-001 only if the team later wants composer-initiated retrieval:

```text
retrieval entry point
allowed intents
budget
authz
safe evidence projection
no browser retrieval controls
```

## C. Worker / Concurrency / Idempotency Gates

### C1. Is contribution submit/review/publish synchronous or worker-backed?

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| Option 1: synchronous DB transaction for v1 | Simple, testable, no new worker | Long AI/document operations must be deferred | publish contribution to revision |
| Option 2: P11-specific worker after contract | Handles long-running work | Needs current entrypoint, leases, tests, acceptance need | async AI assist |
| Option 3: reuse old worker/status patterns | Looks complete | Stale and out of scope | old status-poller |

Recommendation: Option 1 for manual draft/submit/publish. Add worker only if F-011 explicitly introduces long-running work and tests current repo entrypoints.

Patch F-011 plan with:

```text
manual contribution create/update/submit/publish are synchronous DB-backed actions
no worker service is required for the first P11 contribution workflow
```

If worker is later required, patch DATA-001/test-plan with:

```text
lease fields
claim/retry rules
safe operation DTO
fresh worker entrypoint
compose/runbook proof if included in stack
```

### C2. What prevents two reviewers from publishing conflicting revisions?

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| Option 1: transactional publish with row lock/version check | Strong and local to DB | Needs repository tests | lock page, insert revision, update current revision |
| Option 2: best-effort last write wins | Easy | Breaks review integrity | second publish overwrites current pointer |
| Option 3: browser-side disable while publishing | Nice UX | Not concurrency control | disabled button |

Recommendation: Option 1. Publish must be a single backend transaction with conflict detection.

Patch DATA-001 with:

```text
wiki_pages.current_revision_id
wiki_revisions.revision_number unique per page
wiki_contributions.state closed enum
publish uses transaction and locks or version-checks target page/contribution
invalid stale publish returns safe conflict
```

Patch API-001 errors with:

```text
wiki_contribution_conflict
wiki_contribution_state_conflict
wiki_page_conflict
```

### C3. Are publish requests idempotent by contribution id or explicit client request id?

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| Option 1: idempotent by contribution terminal state | Simple for publish, avoids extra key | Requires deterministic replay response | re-publish published contribution returns existing revision |
| Option 2: explicit client request id | Stronger retry semantics | More fields and uniqueness rules | `clientRequestId` |
| Option 3: not idempotent | Simple | Duplicate revisions on retry | double submit |

Recommendation: Option 1 for publish in v1. Use contribution id plus terminal state. Add explicit client request id only if API-001 says create/update/AI assist needs it.

Patch API-001 with:

```text
Publishing an already published contribution returns the existing safe publish result.
Publishing a rejected, draft, unauthorized, stale, or conflicting contribution returns a safe state/conflict error.
```

Patch DATA-001 with:

```text
wiki_revisions.published_from_contribution_id unique
```

Open decision: whether draft create/update needs explicit client request id. Owner patch target: API-001.

### C4. Are drafts autosaved? If yes, who owns conflict resolution and retention?

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| Option 1: explicit save/update only in first slice | Smallest surface, clear state | Less polished UX | Save draft button |
| Option 2: autosave through same PATCH contract | Better UX | Needs debounce, version, conflict, retention rules | autosave draft body |
| Option 3: browser-local autosave as durable draft | Fast | Violates product truth boundary | local storage draft |

Recommendation: Option 1 for P11 v1. Option 2 only after F-011/API-001 define version/conflict semantics. Option 3 is rejected.

Patch F-011 spec with:

```text
P11 v1 uses explicit create/update actions for Wiki Contributions.
Browser-local autosave is not durable product truth.
```

If autosave is approved, patch API-001/DATA-001 with:

```text
draft version or updated_at precondition
conflict error
retention policy
browser storage limits
```

## D. Delete / Redaction / Destructive-State Gates

### D1. What happens to a Wiki Contribution when its cited Source Document or Knowledge Domain is deleted?

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| Option 1: mark affected draft/submitted contributions blocked-needs-review | Preserves user work and prevents unsafe publish | Needs state and tests | `blocked` or `needs_review` |
| Option 2: hard-delete affected contributions | Simple privacy posture | Data loss and surprise | delete drafts |
| Option 3: ignore source/domain delete | Easy | Publishes stale/untraceable claims | publish after source deletion |

Recommendation: Option 1, but exact state name is open. Contributions with invalidated refs must not publish until reviewed or refs are removed.

Patch DATA-001 with:

```text
contribution state or validation rule for invalidated evidence refs
delete/redaction hook behavior for source/domain deletion
publish precondition rejects invalidated refs
```

Patch API-001 with:

```text
safe error code:
  wiki_contribution_context_unavailable
```

Open decision: exact contribution state name and transition path after source/domain deletion. Owner patch target: DATA-001.

### D2. What happens to a published Wiki Revision when supporting Evidence is redacted?

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| Option 1: keep immutable revision but flag/withdraw page current status through new revision or page state | Preserves audit history and blocks unsafe active display | Needs page/revision state policy | page current revision becomes withdrawn |
| Option 2: mutate old revision body/refs | Quick removal | Violates revision immutability | edit published row |
| Option 3: do nothing | Simple | Unsafe stale published knowledge | stale citation |

Recommendation: Option 1. Published revisions stay immutable. Current-page visibility and citation availability must change through page state or a new revision/action defined by DATA-001.

Patch DATA-001 with:

```text
revision immutable rule
page state or current revision withdrawal/supersession rule
redaction hook for revisions with invalidated refs
```

Patch API-001 with:

```text
safe page/revision DTO behavior when evidence is invalidated
no raw redacted content exposure
```

Open decision: whether redaction creates a new revision, marks page unavailable, or marks evidence refs invalid while keeping page visible. Owner patch targets: F-011 spec and DATA-001.

### D3. Are Wiki Pages deletable, archived, or superseded only by revisions?

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| Option 1: no hard delete in first slice; archive/unpublish decision deferred | Avoids destructive scope | Requires clear "not implemented" state | no delete route |
| Option 2: archive page through closed state | Useful admin control | Needs authz/audit/redaction tests | `archived` page state |
| Option 3: hard delete page/revisions | Simple cleanup | High audit/data-loss risk | delete page row |

Recommendation: Option 1 for the first P11 slice unless product explicitly needs archive. Do not add hard delete.

Patch F-011 spec with:

```text
P11 v1 does not hard-delete Wiki Pages or Wiki Revisions.
Archive/unpublish is deferred unless DATA-001/API-001 define states and tests.
```

If archive is approved, patch DATA-001/API-001 with:

```text
page state enum
archive route
authz/audit rules
safe list/read behavior
rollback or restore policy
```

## E. Storage / Private Data Gates

### E1. Is wiki content stored as safe curated text, and what size limits apply?

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| Option 1: store curated wiki title/body with limits | Clear product state and testable | Need size/format decisions | Markdown-like body |
| Option 2: store raw source snippets as body | Quick draft fidelity | Restricted data and redaction risk | copied source text |
| Option 3: store files/attachments as wiki content | Flexible | Storage contract missing | uploaded markdown files |

Recommendation: Option 1. Wiki content is curated authored text, not raw source storage. Define limits before code.

Patch DATA-001 with:

```text
title length
body length
body format
allowed content policy
normalization rules
```

Patch API-001 with validation errors:

```text
wiki_title_invalid
wiki_body_invalid
wiki_body_too_large
```

Open decision: exact body format and size limits. Owner patch targets: F-011 spec, API-001, DATA-001.

### E2. Are source excerpts stored in wiki tables?

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| Option 1: no raw source excerpts in v1 wiki tables | Safest and aligned with QA-002 | Less trace context in DB | safe evidence refs only |
| Option 2: approved safe excerpts only after explicit contract | Better review context | Needs redaction and size rules | curated excerpt field |
| Option 3: store raw Evidence/source text | Easy reconstruction | Forbidden restricted data exposure | source paragraph snapshot |

Recommendation: Option 1. Option 2 only after API-001/DATA-001/QA-002 explicitly define safe excerpts. Option 3 is rejected.

Patch DATA-001 with:

```text
P11 v1 wiki tables do not persist raw source text or raw Evidence.
Evidence traceability, if present, stores approved safe refs only.
```

Patch safety scan with:

```text
fail source text sentinel strings in DTOs, logs, traces, fixtures, screenshots, and acceptance evidence
```

### E3. Are exports or attachments supported?

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| Option 1: no exports/attachments in first slice | Keeps storage boundary small | Less feature-rich | no export button |
| Option 2: read-only export after API/storage contract | Useful later | Needs content type, authz, audit, safety | export wiki page |
| Option 3: browser/file-system attachment handling | Fast reference parity | Violates storage/filesystem boundary | direct apply/download path |

Recommendation: Option 1. Exports and attachments are deferred.

Patch F-011 spec with:

```text
P11 v1 does not support wiki exports or attachments.
```

If later approved, patch API-001/DATA-001/QA-002 with:

```text
export route
content type
authorization
audit/log rules
private storage behavior
safe filename/title policy
no browser paths
```

## F. Authz / Roles Gates

### F1. Can Members create private contributions, or only Administrators?

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| Option 1: Members may draft/submit own contributions, Admins review/publish | Matches collaborative curation | Needs role tests and ownership rules | member creates draft |
| Option 2: Administrators only for all P11 writes | Simpler and safer first slice | Less member curation value | admin-only composer |
| Option 3: any authenticated user can publish | Fast workflow | Violates review/publish governance | member publish |

Recommendation: Option 1 if product wants curation from Members; Option 2 if the team wants the smallest safe implementation. Option 3 is rejected.

Open decision: choose Member draft/submit or Administrator-only v1. Owner patch targets: F-011 spec and API-001.

Patch API-001 with selected rule:

```text
create/update own draft: Member and Administrator, or Administrator-only
submit: owner while draft, or Administrator-only
review/publish/reject: Administrator only unless role model changes
```

### F2. Who can submit, review, publish, reject, archive, or delete?

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| Option 1: closed action/role matrix | Testable and clear | Requires spec detail | submit/review/publish table |
| Option 2: infer from UI hidden controls | Quick | Not security | disabled buttons |
| Option 3: broad admin/member checks only | Simple | Too coarse for workflow transitions | all admins can all actions, members none |

Recommendation: Option 1. Patch API-001 with an explicit action/role/state matrix.

Patch API-001 with:

```text
action: create draft
allowed roles/states

action: update draft
allowed roles/states/ownership

action: submit
allowed roles/states/ownership

action: publish
allowed roles/states

action: reject
allowed roles/states

action: archive/delete
deferred unless explicitly approved
```

Patch F-011 test-plan with:

```text
401 unauthenticated tests
403 wrong-role tests
404/403 resource ownership tests as policy decides
invalid transition tests
```

### F3. Can a Member read another user's draft?

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| Option 1: no, drafts are owner/private; Admins can review submitted drafts | Strong privacy and simple member rule | Review visibility starts after submit | owner-only draft |
| Option 2: Members can read all drafts in same domain | Collaborative | Needs workspace/ACL model not approved | shared drafts |
| Option 3: drafts are fully public | Simple | Privacy and moderation risk | all drafts listed |

Recommendation: Option 1.

Patch API-001 with:

```text
draft contribution read:
  owner only
  Administrator only if admin review policy allows draft inspection

submitted contribution read:
  owner
  Administrator reviewers

published revision/page read:
  authenticated users according to page visibility policy
```

Open decision: whether Administrators can read private drafts before submission. Owner patch target: API-001.

## G. Test / Evidence Gates

### G1. What migration tests prove wiki tables from a fresh database?

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| Option 1: fresh Alembic upgrade plus schema/constraint tests | Strong DATA-001 evidence | Requires migration work | test from empty DB |
| Option 2: rely on ORM model tests only | Fast | Misses migration order/constraints | model create only |
| Option 3: manual DB inspection | Flexible | Weak repeatability | reviewer note |

Recommendation: Option 1.

Patch F-011 test-plan with:

```text
fresh database migrates to head
wiki tables exist
closed enum constraints enforced
unique revision constraints enforced
published_from_contribution uniqueness enforced
foreign key behavior verified
```

### G2. What API tests prove 401/403, safe DTOs, conflict handling, and publish immutability?

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| Option 1: route/service integration tests for the full state machine | Strong acceptance evidence | More tests up front | create -> submit -> publish |
| Option 2: happy-path API tests only | Faster | Misses workflow/security bugs | publish only |
| Option 3: frontend tests only | User-visible | Does not prove backend authority | hidden buttons |

Recommendation: Option 1.

Patch F-011 test-plan with:

```text
unauthenticated -> 401
wrong role -> 403
owner/non-owner draft read behavior
create draft
update draft
submit
publish
reject
invalid transition
duplicate publish idempotency
conflicting publish
published revision immutable
safe DTO scan
```

### G3. What safety scan proves no prompts, raw source text, raw answers, private ids, provider payloads, paths, stack traces, runtime targets, or credentials leak?

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| Option 1: automated scan over DTO examples, logs, traces, fixtures, screenshots, and acceptance evidence | Strong and repeatable | Needs allowlist for policy words | safety scan script |
| Option 2: code review only | Flexible | Weak evidence | reviewer reads files |
| Option 3: scan frontend only | Easy | Misses API/log/fixture leaks | bundle scan |

Recommendation: Option 1.

Patch F-011 test-plan/safety tooling with:

```text
scan targets:
  API responses
  OpenAPI examples/snapshots
  log fixtures
  trace fixtures if any
  SSE fixtures if any
  frontend screenshots if any
  acceptance evidence

fail concrete values for:
  credentials
  token-looking values
  raw prompts
  raw source text
  raw answers
  raw provider payloads
  raw LightRAG hits
  private source/block ids
  storage targets
  runtime or Docker targets
  stack traces
  host paths
```

### G4. What frontend screenshots prove Local Studio visual parity for the composer/review workflow?

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| Option 1: screenshots only if P11 ships UI | Right-sized evidence | No visual proof for backend-only slice | composer/review matrix |
| Option 2: require Playwright before contracts | Strong UI discipline | Premature before routes/DTOs exist | screenshot empty mocks |
| Option 3: skip visual evidence for shipped UI | Faster | Violates DESIGN/F-009 precedent | no screenshots |

Recommendation: Option 1. If P11 ships UI, run visual/e2e checks. If P11 is contract/backend-only, no screenshots are required yet.

Patch F-011 ux/test-plan with screenshot matrix if UI ships:

```text
desktop dark
desktop light
compact desktop dark
narrow viewport
composer draft
submitted/review state
publish/reject state
permission denied state
empty state
error/conflict state
```

Patch frontend tests with:

```text
typed API wrappers only
no raw fetch in components
no browser token persistence
no private-service imports
no raw source/prompt/provider/runtime values in UI
```

## Contract Patch Order For Junior Dev

1. Stop implementation. Record that F-011 is not ready for coding while the feature folder is empty.
2. Write `specs/04-features/F-011-knowledge-curation-workspace/spec.md` with outcome, scope, roles, workflow, out-of-scope, and acceptance links.
3. Write `acceptance.md`, `plan.md`, `tasks.md`, `test-plan.md`, and `ux.md`.
4. Patch API-001 with the minimal contribution workflow routes, DTOs, safe errors, role/action matrix, and safe ref rules.
5. Patch DATA-001 with `wiki_pages`, `wiki_revisions`, `wiki_contributions`, constraints, closed states, and redaction/delete behavior.
6. Decide whether Members can draft/submit. Patch F-011/API-001 before writing code.
7. Decide evidence traceability shape. Patch API-001/DATA-001 before writing code.
8. Decide AI assist. If yes, patch AI-001 before writing code; otherwise document manual-only v1.
9. Decide streaming. If yes, patch EVT-001 before writing code; otherwise document JSON-only v1.
10. Add migrations and backend tests.
11. Implement backend routes/services/repositories.
12. Add frontend wrappers and UI only after DTOs exist.
13. Add safety scan and visual/e2e evidence if UI ships.
14. Update F-011 acceptance, implementation log, and feature register after verification.

## Red Flags In PR

| Red flag | Why it is bad | Junior-dev rule |
| --- | --- | --- |
| P11 code appears while F-011 feature docs are empty | No approved behavior or acceptance criteria. | Patch the feature package first. |
| API routes or DTO fields appear before API-001 changes | Silent contract drift. | Contract first, code second. |
| Wiki tables or enums appear before DATA-001 changes | Data truth is not approved. | Patch DATA-001 before migrations. |
| Browser stores durable drafts in local storage | Product truth moves to untrusted client. | Durable draft truth lives in `wiki_contributions`. |
| Browser calls provider, LightRAG, storage, Docker, runtime, database, controller, or filesystem APIs | Violates browser-thin boundary. | Components use typed Context Engine API wrappers only. |
| Smart Composer includes model, prompt, retrieval, or provider controls | Backend owns AI behavior. | Patch AI-001 before any AI assist. |
| Published Wiki Revision rows are mutated | Violates revision immutability. | Create new revisions and move current pointer through publish service. |
| Raw Evidence/source text is persisted in wiki tables | Restricted data and redaction risk. | Store curated text and approved safe refs only. |
| Private Source Block ids appear in public DTOs | Violates evidence privacy boundary. | Use approved safe refs only. |
| Obsidian vault, plugin, OAuth, MCP, local RAG, or direct apply code enters target implementation | Reference runtime is non-portable. | Rebuild UX over Context Engine contracts. |
| P10 Runtime Node/Logs/Usage/storage/Docker work appears in P11 | Out-of-phase scope and different risk profile. | Keep P10 carry-forward gates separate. |
| Worker/queue infrastructure appears without F-011 acceptance need | Overbuilt infrastructure. | Use synchronous DB transactions first. |
| Member/admin differences rely on hidden UI only | Backend authz is missing. | Add route tests for 401/403 and ownership. |
| Safety scan covers only frontend code | Leaks often appear in API fixtures, logs, screenshots, and acceptance evidence. | Scan all public/evidence artifacts. |

## Context And ADR Notes

`CONTEXT.md` does not need a patch for the terms themselves. It already defines Wiki Page, Wiki Revision, Wiki Contribution, Smart Composer, Runtime Node, Node Environment, Usage Event, and the browser/backend boundaries.

An ADR is not needed before the F-011 contract capture pass. The recommended decisions are governed by AGENTS, GOV-001, ARCH-002, QA-002, API-001, DATA-001, AI-001, EVT-001, F-009, F-010, and the P11 review package.

Consider an ADR only if P11 chooses a hard-to-reverse alternative, such as a new worker platform, generic workflow system, second retrieval stack, browser-side AI/runtime control, filesystem-backed wiki storage, or broad source-apply feature.

## QA

- Readiness question IDs covered: A1, A2, A3, A4, A5, A6, B1, B2, B3, C1, C2, C3, C4, D1, D2, D3, E1, E2, E3, F1, F2, F3, G1, G2, G3, G4.
- Open decisions still blocking coding: F-011 acceptance criteria; exact API route/DTO names; exact DATA-001 table fields/enums; evidence traceability shape; AI assist yes/no; streaming yes/no; Member draft/submit rights; Administrator access to private drafts; redaction behavior for published pages; body format and size limits.
- Forbidden-string scan result: no concrete token value, working credential, host path, raw stack trace, raw source text, prompt/answer payload, runtime target, storage target, Docker target, or provider payload should appear. Policy words and route/table names are intentional.
- Output path written: `.devnotes/P10-post-impl-REVIEW/F-011-P11-reconciled-design-gates.md`.
- Style parity confirmed: Scope, Sources Grilled, Product DNA Locks, Recommended Build Shape, A-G gates, Contract Patch Order, Red Flags, Context/ADR Notes, QA.
