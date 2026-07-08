# ID-A - P10 carry-forward gates (junior dev explainer)

Parent links: [ID-A.md](./ID-A.md), [F-011-P11-readiness.md](./F-011-P11-readiness.md)

**Question:** What happens to the open-ended P10 items after the first runnable-stack gate?

### Decision

Keep them out of P11 by default. They are real work, but they are not wiki/Smart Composer work.

```text
Runtime Node
Node Environment
Logs
Usage Event / cost
storage summaries
Docker environment UI/API
worker service containers
Playwright for P10 stack proof
```

### Why

| Item | Current status | Recommended handling |
| --- | --- | --- |
| Runtime Node | Product term exists; DTOs/tables/routes missing. | Patch API-001/DATA-001 before UI/API. |
| Logs | P8 diagnostics exist in bounded form; rich log surfaces missing. | Define scoped redacted DTOs; no raw log tail. |
| Usage | Product term exists; measurements/cost source missing. | Backend-owned Usage Event contract with reported/estimated/unavailable labeling. |
| Storage summaries | No public summary contract. | Backend-computed aggregates only; no paths. |
| Docker environment UI/API | Node Environment term exists; lifecycle contract missing. | Contract approved engine/image/version/action/status model first. |
| Workers | Deferred from P10 first gate. | Add only current repo entrypoints and tests when acceptance requires. |
| Playwright | Not required for P10 AC-001 through AC-004. | Keep under F-009 AC-007 or P11 UI proof if UI ships. |
| Dirty worktree | Many unrelated files pre-existed. | Do not revert or normalize unrelated files. |
| `_tmp` smoke evidence | Local ignored evidence only. | Keep local or publish sanitized summary only. |

### Exact Contract Sketch

Before any working operator UI, patch:

| File | Must define |
| --- | --- |
| `specs/03-contracts/api/context-engine-v1.md` | routes, safe DTOs, role rules, errors, pagination/filtering |
| `specs/03-contracts/data/context-engine-data.md` | typed tables or computed-only formulas, lifecycle enums, ownership |
| `specs/05-quality/security-and-privacy.md` | data class and redaction rules if new surfaces appear |
| `specs/05-quality/observability.md` | safe log/audit fields and forbidden metadata |
| `specs/04-features/F-010-shared-node-operations/test-plan.md` | authz, safety, visual, import/network evidence |

### Recommendation By Item

| Item | Recommendation |
| --- | --- |
| Runtime Node | Next slice after P11 only if operator runtime visibility is prioritized. Start read-only. |
| Logs | Backend-scoped, redacted, bounded admin API. No raw container/host logs in browser. |
| Usage | Define server-recorded Usage Events; browser renders labels and totals only from API. |
| Storage summaries | Define safe aggregate DTOs; never expose storage targets or host paths. |
| Docker environments | Define Node Environment as an operator-managed recipe/lifecycle object; browser sees opaque ids and safe states only. |
| Workers | Add a worker service only when current source prep/index/delete/redaction tests need it through the runnable stack. |
| Playwright | Use for actual UI behavior and visual acceptance, not as a substitute for HTTP stack smoke. |

### What You Implement (Order)

1. Finish or accept P10 first-gate evidence as-is.
2. Choose one carry-forward surface only.
3. Patch F-010 plan/tasks/test-plan for that surface.
4. Patch API-001/DATA-001.
5. Add backend tests and migrations if needed.
6. Add frontend UI only after DTOs exist.
7. Add safety scan and visual/e2e proof.
8. Keep P11 wiki/composer work separate.

### Red Flags In PR

- P11 PR introduces Runtime Node, Logs, Usage, storage, or Docker environment routes.
- Browser computes cost/storage totals.
- Browser sees Docker/container/runtime/storage/provider target details.
- Logs include stack traces, prompts, answers, source text, evidence excerpts, provider payloads, or private targets.
- Worker service copies old queue/status/deployment-control behavior.
- Playwright is claimed as proof of migration/API readiness.
- `_tmp` smoke files are committed with local run details.
- Unrelated dirty worktree changes are reverted or reformatted.

### Tests

- Contract snapshot for any new operator route.
- Backend authz tests: Member denied, Administrator/operator allowed where specified.
- Redaction/safety fixture tests for DTOs/log output.
- Migration/fresh-upgrade tests for any new tables.
- Frontend import/network audit: Context Engine API only.
- Visual screenshots for any new UI surface.
- Compose audit if a worker or environment service is added.

### One-line summary

P10 open-ended items stay as explicit follow-up gates; do not smuggle them into P11 wiki/Smart Composer work.
