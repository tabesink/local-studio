# Target File Tree

```text
app/
├── main.py
├── api/
│   └── v1/
│       └── chat.py
├── modules/
│   ├── chat/
│   │   ├── contracts.py          # request, SSE, outcome DTOs
│   │   ├── service.py            # transaction + stream coordinator
│   │   ├── orchestrator.py       # request-scoped bounded loop
│   │   ├── planning.py           # PlannerPort, PlanValidator, Replanner
│   │   ├── routing.py            # closed tool/intent router
│   │   ├── events.py             # safe SSE projection
│   │   └── policy.py             # budgets / runtime policy
│   ├── retrieval/
│   │   ├── ports.py              # RetrievalPort protocol
│   │   └── lightrag_adapter.py   # only retrieval runtime boundary
│   ├── evidence/
│   │   ├── contracts.py          # EvidenceRef, EvidenceBundle
│   │   ├── distiller.py
│   │   ├── grounding.py
│   │   └── citations.py
│   ├── providers/
│   │   ├── ports.py
│   │   └── configured_gateway.py
│   ├── conversations/
│   │   ├── models.py
│   │   ├── repository.py
│   │   └── transcript_policy.py
│   └── sources/
│       └── evidence_activity.py  # deletion/redaction lookup
├── persistence/
│   └── session.py
└── shared/
    ├── auth.py
    ├── errors.py
    └── ids.py

tests/
├── unit/
│   ├── test_orchestrator.py
│   ├── test_evidence.py
│   └── test_sse_events.py
├── integration/
│   └── test_chat_turn_stream.py
└── fixtures/
    └── advanced_rag_cases.jsonl
```

## Only one external-retrieval import location

```text
modules/retrieval/lightrag_adapter.py
```

No other route, service, repository, or UI module calls the retrieval runtime directly.
