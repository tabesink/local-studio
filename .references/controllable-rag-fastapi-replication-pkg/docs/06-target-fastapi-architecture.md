# 06 — Target FastAPI Architecture

## Deployable shape

```text
┌──────────────────┐     HTTPS / JSON + SSE     ┌─────────────────────────┐
│ Next.js chat shell├───────────────────────────►│ FastAPI                 │
│ thin UI only      │◄───────────────────────────┤  /api/v1/chat/*        │
└──────────────────┘                              │                         │
                                                   │ ChatTurnService         │
                                                   │  └─ AdvancedOrchestrator│
                                                   └──────┬─────────┬────────┘
                                                          │         │
                                      ┌───────────────────▼───┐ ┌───▼───────────────┐
                                      │ PostgreSQL             │ │ private retrieval │
                                      │ users/conversations/   │ │ runtime per domain│
                                      │ messages/evidence/     │ │ via one adapter   │
                                      │ audit traces           │ └───────────────────┘
                                      └────────────────────────┘
```

## Ownership

| Concern | Owner |
|---|---|
| Authentication, authorization, domain access | FastAPI boundary |
| Server model/retrieval policy | FastAPI configuration |
| Current turn execution | `AdvancedOrchestrator` |
| Retrieval calls | `RetrievalPort` adapter only |
| Evidence IDs, source mapping, citation validity | Evidence module |
| Conversation transcript and redaction | PostgreSQL repositories |
| Visual progress | SSE projection of safe execution stages |
| Parser/index lifecycle | admin/source-document module, outside chat turn |

## Request flow

```text
1. Authenticate user.
2. Authorize `domain_id`.
3. Create user message + turn record.
4. Load limited user-owned transcript for answer style/context only.
5. Run bounded advanced orchestration against current-turn domain.
6. Validate citations against returned evidence.
7. Persist assistant answer, evidence links, safe trace summary.
8. Emit `answer.completed` and close stream.
```

## Lean module boundaries

```text
app/
├── api/v1/chat.py                 HTTP + SSE only
├── modules/chat/                  request, service, orchestrator, events
├── modules/retrieval/             port + private runtime adapter
├── modules/evidence/              evidence DTOs, validation, grounding
├── modules/providers/             model gateway + server configuration
├── modules/conversations/         repositories and transcript policy
├── modules/sources/               admin ingest / deletion contracts
└── shared/                        ids, errors, clock, auth dependency types
```

## Rejected topology

```text
browser → separate agent server → queue → vector DB → tool microservices
```

No separate agent runtime, Redis, queue, WebSocket layer, or local fallback index is necessary for this scope.
