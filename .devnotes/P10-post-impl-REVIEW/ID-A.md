# ID-A - P11 contract spine and carry-forward gates

Working doc for the P10-to-P11 gate. Canonical patch targets: `specs/04-features/F-011-knowledge-curation-workspace/`, `specs/03-contracts/api/context-engine-v1.md`, `specs/03-contracts/data/context-engine-data.md`, `specs/03-contracts/events/context-engine-sse-v1.md` if streaming is approved, `specs/03-contracts/ai/grounded-answering.md` if AI drafting/rewrite is approved, `specs/05-quality/security-and-privacy.md`, `specs/05-quality/observability.md`, and F-011 tests/evidence.

Sources grilled: AGENTS.md, README.md, constitution, CONTEXT.md, DESIGN.md, F-009 spec/acceptance/port contracts, F-010 spec/plan/tasks/test-plan/acceptance/implementation log, API-001, DATA-001, EVT-001, AI-001, ARCH-001, ARCH-002, QA-001, QA-002, QA-003, feature register, P10 implementation artifacts, and `.references/obsidian-smart-composer_impl_docs/`.

**Related docs**

| Doc | Scope |
| --- | --- |
| [F-011-P11-readiness.md](./F-011-P11-readiness.md) | Broad P11 readiness, blockers, build order, acceptance gate |
| [ID-A-contract-spine.md](./ID-A-contract-spine.md) | Feature package plus API/data/event/AI contract capture |
| [ID-A-smart-composer-boundary.md](./ID-A-smart-composer-boundary.md) | Backend-owned Smart Composer and wiki write boundary |
| [ID-A-reference-adaptation.md](./ID-A-reference-adaptation.md) | What may and may not be adapted from Smart Composer |
| [ID-A-p10-carry-forward-gates.md](./ID-A-p10-carry-forward-gates.md) | Runtime Node, Logs, Usage, storage, Docker, workers, Playwright |

---

## Lean Winner

```text
F-011 feature package first
+ API-001 safe routes
+ DATA-001 typed wiki tables
+ AI-001 only if generated/rewrite behavior exists
+ EVT-001 only if streaming behavior exists
+ backend-owned Wiki Contribution state machine
+ immutable Wiki Revision publish
+ thin Local Studio-parity UI
+ Smart Composer reference UX only
+ P10 node/log/usage/storage/Docker gates kept out
```

This protects the main product boundary: wiki curation is durable product state, not browser notes, not Obsidian vault mutation, and not a direct provider/editor surface.

---

## Rejected Alternatives

| Alternative | Reject because |
| --- | --- |
| Start coding from the empty F-011 folder | No acceptance criteria, no route/table shapes, no test plan. |
| Copy Obsidian Smart Composer runtime | Host APIs, vault persistence, provider calls, OAuth, MCP, local RAG, and filesystem writes are non-portable. |
| Store drafts only in browser state and call it product behavior | Durable writes must be backend-authorized Wiki Contributions. |
| Add generic JSON workflow blobs | DATA-001 rejects generic JSON/workflow drift without approved spec. |
| Let browser choose model, prompt, retrieval mode, or provider | Violates AI-001 and browser-thin boundary. |
| Store raw source text or raw Evidence in wiki tables | Violates QA-002 and existing safe DTO rules unless a later explicit contract approves safe excerpts. |
| Publish by overwriting the page row | Wiki Revision is immutable by product vocabulary. |
| Fold P10 Logs/Usage/Node/storage into P11 | They are carry-forward gates with different contracts and owners. |

---

## Grill Tree - Decisions Resolved

```text
Can P11 coding start now?
  -> No. The F-011 feature package is empty.

Is Smart Composer a direct port?
  -> No. It is adaptation evidence only.

Who owns durable wiki writes?
  -> FastAPI/services/Postgres through Wiki Contributions and Revisions.

Can the browser hold provider, prompt, retrieval, LightRAG, storage, Docker, or runtime details?
  -> No.

Does P11 need API-001 and DATA-001 patches?
  -> Yes. Routes, DTOs, tables, state machine, authz, conflicts, and redaction behavior are missing.

Does P11 need AI-001?
  -> Only if Smart Composer generates or rewrites content.

Does P11 need EVT-001?
  -> Only if contribution/composer operations stream.

Can P10 open-ended work be implemented as part of P11?
  -> Not by default. Keep it in P10 carry-forward gates.
```

---

## A1 - Feature Package Blocker

Required files before coding:

```text
specs/04-features/F-011-knowledge-curation-workspace/spec.md
specs/04-features/F-011-knowledge-curation-workspace/plan.md
specs/04-features/F-011-knowledge-curation-workspace/tasks.md
specs/04-features/F-011-knowledge-curation-workspace/test-plan.md
specs/04-features/F-011-knowledge-curation-workspace/acceptance.md
specs/04-features/F-011-knowledge-curation-workspace/implementation-log.md
specs/04-features/F-011-knowledge-curation-workspace/ux.md
```

Minimum spec decisions:

| Decision | Must say |
| --- | --- |
| roles | who drafts, submits, reviews, publishes, rejects, reads |
| state machine | draft -> submitted -> approved/published/rejected or approved alternatives |
| evidence traceability | what safe refs can be stored |
| revision immutability | how current page points to current revision |
| redaction/delete | what happens when supporting sources/domains are deleted |
| AI behavior | whether composer uses backend synthesis or manual-only drafting |
| UI scope | right panel, route, or review queue; visual acceptance |

---

## A2 - API/Data Contract Patch

Candidate contract targets to capture. These are not approved routes until API-001/DATA-001 are patched.

| Contract | Candidate shape |
| --- | --- |
| API-001 | list/read Wiki Pages, list/read/create/update/submit Wiki Contributions, review/publish/reject actions, safe errors |
| DATA-001 | `wiki_pages`, `wiki_revisions`, `wiki_contributions`, optional evidence-ref join table |
| QA-002 | safe DTO limits for curated content, references, titles, and review metadata |
| QA-003 | safe audit/log names and allowed metadata |

Do not implement from candidate names alone. Patch the contracts first.

---

## A3 - Smart Composer Boundary

Single source of truth:

```text
durable_wiki_write =
  authenticated API request
  + backend authz
  + contribution state transition
  + transactionally persisted Postgres row
  + safe audit/log metadata
```

Browser responsibilities:

| Browser may | Browser must not |
| --- | --- |
| render composer UI | call provider APIs |
| edit form fields | build final prompts |
| submit typed API requests | write source storage or files |
| display safe citations/evidence refs | persist raw Evidence/source text |
| show review status | decide authz or publish truth |

---

## A4 - P10 Carry-Forward Fence

Keep these out of P11 unless explicitly contracted:

```text
Runtime Node
Node Environment
scoped logs
usage/cost
storage summaries
Docker environment actions
worker service containers
P10 Playwright proof
```

Reason: P11 is wiki curation. The open P10 surfaces are operator/runtime features with different data, authz, and leakage risks.

---

## Single-Source Rules

```text
p11_coding_allowed =
  F-011 spec package exists
  AND API-001 patched for public routes
  AND DATA-001 patched for product state
  AND test-plan names proof for each acceptance criterion
```

```text
smart_composer_write_allowed =
  caller authenticated
  AND route authorized
  AND target contribution transition valid
  AND persisted by backend service
  AND no browser-private-service access
```

```text
wiki_revision_publish_allowed =
  contribution submitted or approved per contract
  AND evidence refs still authorized per contract
  AND no conflicting current revision transition
  AND publish writes immutable revision
```

---

## Entity/Data Diagram

```text
users
  -> wiki_contributions.created_by_user_id
  -> wiki_contributions.reviewed_by_user_id

wiki_pages
  -> current_revision_id -> wiki_revisions.id

wiki_revisions
  -> wiki_pages.id
  -> published_from_contribution_id
  -> safe evidence traceability rows

wiki_contributions
  -> optional target wiki_page_id
  -> draft/review state
  -> selected Turn/Evidence/Citation refs through approved safe ids
```

---

## Junior Dev - Do This Order

1. Say "blocked on F-011 feature package" before coding.
2. Write F-011 `spec.md` and `acceptance.md`.
3. Patch API-001 for one slice: contribution draft -> submit -> publish.
4. Patch DATA-001 with typed tables and state enums.
5. Patch AI-001 only if generated/rewrite behavior exists.
6. Patch EVT-001 only if streaming exists.
7. Add migrations and backend tests.
8. Add frontend wrappers and UI only after DTOs exist.
9. Add safety scan and visual/e2e evidence.
10. Leave P10 open-ended operator/runtime gates out of the PR.

---

## Red Flags In PR

- P11 code appears while `specs/04-features/F-011-knowledge-curation-workspace/` is still empty.
- API route names, DTO fields, or table names are implemented without contract patches.
- Browser code imports provider, LightRAG, Docker, storage, runtime, database, controller, or filesystem behavior.
- Smart Composer stores raw source text, raw prompts, raw answers, raw provider payloads, or private source/block ids.
- Wiki Page is overwritten directly instead of creating immutable revisions.
- Member/admin role behavior is enforced only by hidden UI.
- Obsidian `App`, vault, plugin lifecycle, OAuth, MCP, or direct apply behavior enters target code.
- P10 Logs/Usage/Runtime Node/storage work appears in a P11 PR without updated P10/F-011 contracts.

---

## Tests To Write

- Migration: fresh database upgrade creates P11 tables and constraints.
- API authz: unauthenticated gets 401; unauthorized Member gets 403 on review/publish.
- API state machine: create, update, submit, publish, reject, conflict, invalid transition.
- Revision immutability: publishing creates a new revision and does not mutate previous revision content.
- Redaction/delete: cited source/domain deletion follows the approved rule.
- Safety: DTOs/logs/audit/examples/screenshots contain no forbidden private data.
- Frontend: typed wrappers only, no raw fetch, no browser token persistence, no private-service imports.
- Visual: composer/review UI uses Local Studio parity if UI is shipped.

Still needs ID-B only after F-011 decides exact review/publish state names or introduces an AI streaming workflow.

Next grill session: write F-011 spec and API/DATA candidate contracts, then review for stop conditions before coding.
