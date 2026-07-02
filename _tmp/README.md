# P6/P7 Agent Context Pack

Curated copy of specs and contracts for **F-006 Scoped Evidence Retrieval (P6)** and **F-007 Grounded Streaming Chat (P7)**. Use as context when surgically adapting advanced chat streaming from another codebase.

**Source of truth remains the live repo paths** under `specs/` — this folder is a snapshot for handoff, not an authority fork.

## Suggested Reading Order

1. `AGENTS.md` — agent operating contract and stop conditions
2. `CONTEXT.md` — domain language (Evidence, Conversation, Turn, Citation, redaction)
3. `specs/00-governance/constitution.md` — non-negotiable boundaries
4. `specs/04-features/F-006-scoped-evidence-retrieval/spec.md` — evidence-only retrieval (P6)
5. `specs/04-features/F-007-grounded-streaming-chat/spec.md` — grounded SSE chat (P7)
6. `specs/03-contracts/events/context-engine-sse-v1.md` — **EVT-001** SSE event ordering (critical for streaming fold)
7. `specs/03-contracts/ai/grounded-answering.md` — **AI-001** RAG-only guardrails, eligibility, fallbacks
8. `specs/03-contracts/api/context-engine-v1.md` — **API-001** routes and safe DTO rules
9. `specs/03-contracts/data/context-engine-data.md` — **DATA-001** tables, `CE_BLOCK`, query eligibility
10. Feature `plan.md`, `tasks.md`, `test-plan.md`, `acceptance.md` for each phase

## Phase Outcomes

| Phase | Feature | Outcome |
| --- | --- | --- |
| P6 | F-006 | Domain-scoped evidence retrieval **without synthesis** |
| P7 | F-007 | Durable RAG-only conversations and **Context Engine SSE** |

## Streaming Fold Checklist

When adapting external chat streaming code, enforce these contracts:

- **RAG-only**: no general/domainless chat branch (AI-001, F-007 FR-001)
- **SSE ordering**: `evidence` → `token`* → exactly one terminal `done` or `error` (EVT-001)
- **Evidence before tokens**: P7 reuses P6 retrieval callable; never stream answer before evidence
- **Idempotency**: every turn requires `domain_id` + `client_request_id`; duplicate returns existing result
- **Concurrency**: one running turn per conversation (409 on second)
- **Safe payloads**: no raw prompt, provider payload, LightRAG hit, paths, secrets, source/block IDs (QA-002)
- **Fallbacks**: no evidence → `no_grounded_context`; provider failure after evidence → `evidence_only`
- **Cancel**: client disconnect aborts upstream stream and clears running state
- **Redaction**: source/domain hard delete redacts derived answer/citations, keeps user question

## Key Endpoints (API-001 phase table)

| Phase | Route |
| --- | --- |
| P6 | `POST /domains/{domain_id}/evidence` |
| P7 | Conversation CRUD + turn SSE route (exact paths to be captured at implementation) |

Note: P7 conversation/turn route shapes and DTO field lists are **not fully specified** in API-001 yet — patch the contract before implementing public fields.

## Dependencies Included

| File | Why |
| --- | --- |
| `specs/04-features/F-005-lightrag-indexing-eligibility-spec.md` | P6 depends on `source_is_query_eligible()` and `CE_BLOCK` marker preservation |
| `specs/05-quality/security-and-privacy.md` | QA-002 redaction rules for all public surfaces |
| `specs/04-features/F-009-frontend-slice-map-chat.md` | Frontend slices 11–12 (chat shell + SSE evidence) when folding UI |
| `obsidian/P6 Evidence Retrieval/` | Junior-dev retrieval flow and safe DTO examples |
| `guidelines/coding-agent-guidelines.md` | Layer boundaries and streaming patterns |

## Contents

```
.devnotes/_tmp/
├── README.md                          (this file)
├── AGENTS.md
├── CONTEXT.md
├── guidelines/
│   └── coding-agent-guidelines.md
├── obsidian/
│   ├── P6 Evidence Retrieval/
│   └── P7 Grounded Streaming Chat/
└── specs/
    ├── 00-governance/constitution.md
    ├── 03-contracts/
    │   ├── api/context-engine-v1.md
    │   ├── events/context-engine-sse-v1.md
    │   ├── ai/grounded-answering.md
    │   └── data/context-engine-data.md
    ├── 04-features/
    │   ├── F-005-lightrag-indexing-eligibility-spec.md
    │   ├── F-006-scoped-evidence-retrieval/   (full folder)
    │   ├── F-007-grounded-streaming-chat/     (full folder)
    │   └── F-009-frontend-slice-map-chat.md
    └── 05-quality/security-and-privacy.md
```

## Not Included (intentionally)

- P5 full implementation docs (only spec excerpt for eligibility/markers)
- P8 observability, P9 full frontend spec
- Reference code under `.references/code/`
- Live codebase (`context_engine/` services)

Add those separately if the adapting agent needs runtime patterns from this repo or the old Context Engine reference.
