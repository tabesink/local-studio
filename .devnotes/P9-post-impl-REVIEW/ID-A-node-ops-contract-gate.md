# ID-A - Node ops contract gate (junior dev explainer)

Parent links: [ID-A.md](./ID-A.md), [F-010-P10-readiness.md](./F-010-P10-readiness.md)

**Question:** Can P10 implement Logs, Usage, Runtime Node, Docker environments, or storage dashboards after the runnable stack?

### Decision

Only after contracts. The first P10 gate is the runnable stack. Rich operator surfaces require API-001 and DATA-001 patches before frontend work.

Blocked surfaces:

```text
Runtime Node status
Node Environment status/actions
scoped logs
usage/cost
storage summaries
operator dashboard aggregates
```

### Why

| Bad path | Good path |
| --- | --- |
| Show raw logs and filter later. | Contract safe log DTOs first. |
| Let browser compute cost/storage. | Backend computes or labels values as reported/estimated/unavailable. |
| Use Docker/container IDs in URLs. | Browser selects backend-authorized opaque IDs only. |
| Reuse Local Studio node controls directly. | Adapt visual grammar only after Context Engine contracts exist. |
| Add generic JSON status blobs. | Define typed DTOs/enums and tests. |

P10 scope says the governed home for shared-mode node operations exists now, but implementation of richer surfaces waits for captured API/data contracts.

### Exact Contract Sketch

Before UI, patch:

| File | Must define |
| --- | --- |
| `specs/03-contracts/api/context-engine-v1.md` | routes, DTOs, pagination/filtering, role rules, safe errors |
| `specs/03-contracts/data/context-engine-data.md` | tables or computed-only formulas, lifecycle enums, ownership |
| `specs/05-quality/security-and-privacy.md` | redaction/safety limits if new data class appears |
| `specs/04-features/F-010-shared-node-operations/test-plan.md` | authz, safety, visual, import/network evidence |

DTOs must not expose:

```text
Docker endpoint or target detail
raw runtime/controller target
database target
storage path
provider credential/payload
raw prompt/source/answer text
raw stack trace
```

### Implement Order

1. Finish runnable stack `T-010` through `T-070`.
2. Write API-001/DATA-001 patches for one operator surface only.
3. Add backend service/DTO tests.
4. Add authz/audit tests.
5. Add frontend wrappers and UI.
6. Add import/network audit proving browser talks only to Context Engine API.
7. Add visual screenshots if UI is implemented.

### Red Flags In PR

- UI appears before API/data contract patches.
- Browser code imports Docker, filesystem, provider, database, runtime, controller, or storage clients.
- Logs include raw exception text, raw payloads, prompts, source text, answer text, provider payloads, or private targets.
- Cost/storage numbers are calculated only in browser state.
- Node IDs are raw container names, host targets, ports, or paths.
- Member can see operator controls or infer hidden infrastructure details.

### Tests

- Contract snapshot: OpenAPI captures the new route and DTO shape.
- Backend authz: member gets 403; admin/operator path succeeds.
- Safety fixtures: no raw private targets, stack traces, prompt/source/answer text, or provider payloads.
- Frontend import/network audit: no private-service clients, only `/api/v1`.
- Visual checks: Local Studio compact rows/tables/right detail panels for any shipped operator UI.

### One-line summary

P10 may own node operations, but the browser gets no Logs/Usage/Node UI until typed safe contracts exist.
