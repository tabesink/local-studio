# Phase Plan Index

Audience: coding agents, junior devs, reviewers.

Purpose: one clean phase path from two plan sets. Old docs still useful. This layer decides what wins.

## Read Order

1. `CONTEXT.md`
2. This index
3. `phase_plan/P0_shared_contract.md`
4. `phase_plan/P1_trusted_application_foundation.md` through `P8_observability_pilot_gate.md`
5. `phase_plan/P9_frontend_delivery.md`
6. Existing `slices/*.md` when building frontend routes

## Source Precedence

When docs conflict:

1. `CONTEXT.md` vocabulary wins.
2. `impl_plans_v1/00-cross-phase-alignment.md` wins.
3. `impl_plans_v1/development-scafold.md` wins.
4. These new phase docs win as reviewer reconciliation.
5. v1 phase leaf docs provide implementation detail.
6. v0 docs and devnotes provide critique/evidence only.
7. Local Studio/reference code provides UI evidence only, not product authority.

## Resolved Tensions

| Tension | Decision |
| --- | --- |
| Browser authority vs backend authority | Browser talks only to Context Engine API. FastAPI owns auth, config, lifecycle, retrieval, evidence, chat. |
| JWT/localStorage vs cookie session | Use opaque HttpOnly cookie session. No browser token persistence. |
| Generic jobs/workflows vs resource-owned state | No generic workflow table. Use `domain_operations`, `source_preparation_operations`, `source_documents.index_state`, `conversation_turns`, `audit_events`. |
| Parser profile/revision vs parser snapshot | Store only `parser_kind` on upload. Retry keeps same kind, resolves current credential privately. |
| Embedding mutable until first index vs immutable at domain create | Immutable at domain create. Wrong profile means delete empty domain and recreate. |
| Runtime config files vs typed secret injection | No `domain.env`, generated Compose, plaintext DB copy. API resolves typed config; controller injects at runtime start only. |
| P6 source navigation vs evidence only | P6 returns mapped evidence cards only. Source navigation is later frontend/backend slice. |
| P6 one active source vs many domain sources | Query selected domain. Map any hit whose owning Source Document is currently query-eligible. No browser source selector. |
| P7 direct/general chat vs RAG-only | Pilot chat is RAG-only. No domainless/general branch. No classifier bypass. |
| P7 stateless turn vs durable conversation | Use durable user-owned conversations and turns. Needed for inspectability and redaction. |
| Redaction with general turns | Since pilot has no general turns, source delete redacts cited turns; domain delete redacts turns for that domain. User question stays. |
| P8 query logs vs turn/audit state | No `query_logs` table. `conversation_turns` own chat state. `audit_events` own admin/security audit. |
| P8 Langfuse inside core compose | No. Langfuse optional, off by default, separately operated or managed, metadata-only. |
| Local Studio product vs UI foundation | Adopt visual shell/tokens/patterns only. Do not port agent runtime, terminal, controller, Electron, session replay. |

## Critical Locks

Step with human only at these junctions:

1. **P5 LightRAG proof fails**: if `CE_BLOCK` marker, idempotent submit, delete, readiness, or secret injection cannot be proven against pinned LightRAG, stop. Pick: upstream patch, alternate metadata contract, or phase redesign.
2. **Provider secret injection shape changes**: if LightRAG needs credentials before or after process start in unsafe way, stop. No persisted secrets just to make it work.
3. **Source navigation enters pilot early**: if product needs source viewer before P7/P9 late slice, define opaque source-ref contract first.
4. **Conversation retention policy matters**: if business wants formal retention, legal hold, export, or team sharing, do not hide it in P7. New product decision.
5. **Langfuse query-text capture**: default off. Turning on needs operator data-policy approval.
6. **Frontend wires unknown API**: capture OpenAPI/runtime fixtures first. Do not guess field shape.

## Global Gates

- No phase starts by reworking previous contracts.
- No browser route talks to LightRAG, Docker, storage, DB, provider, controller, or Langfuse.
- No secret, token, raw source text, raw prompt, raw answer, raw LightRAG hit, path, runtime URL, stack trace, or provider payload in API/logs/traces.
- No new infra unless phase doc names it.
- Every phase has migration/test/OpenAPI evidence before done.

