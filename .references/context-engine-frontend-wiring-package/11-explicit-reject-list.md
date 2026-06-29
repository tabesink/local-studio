# Explicit Reject List — Context Engine Internal Pilot

Do not copy, expose, or create these patterns while implementing the current pilot.

## Browser authority violations

```text
browser bearer-token persistence
browser direct LightRAG URL/request
browser direct domain-controller/Docker request
browser direct provider/parser/storage/database request
browser-selected provider/model/embedding/parser/prompt/retrieval controls
browser source-path construction
browser direct asset/storage URL handling
```

## Product scope violations

```text
agent runtime
terminal / shell execution
filesystem browser
local model lifecycle controller
plugin/recipe marketplace
general or domainless chat
cross-domain retrieval
team/shared conversations
chat memory vector store
local semantic/BM25/vector fallback
unrestricted document management system
```

## Architecture violations

```text
generic operations/workflow table
event bus/outbox/Kafka
Redis/RQ/Celery added for browser convenience
second vector/graph/retrieval engine
browser-side transition state machine for domain lifecycle
automatic repair/recreate/regenerate/purge UX
automatic provider failover
unbounded polling or reconnect loop
```

## Security / observability violations

```text
raw secrets/ciphertext in DTO/UI/log
cookie/token/password display or persistence
raw prompt/evidence/source/parser/provider payload view
raw LightRAG hit / remote ID / runtime URL view
container ID / workspace path / database name view
raw stack trace / full log tail view
Langfuse browser SDK, dashboard proxy, or key exposure
```

## UX dishonesty violations

```text
fake upload/index percentage
invented domain/source lifecycle state
source Open action without API contract
answer shown before terminal result/evidence mapping
citations fabricated from labels or raw model text
color-only status
optimistic hard delete when backend returns 202
```

## Code-review rule

A proposed feature matching this file is rejected unless an approved product decision updates:

```text
CONTEXT.md
00-cross-phase-alignment.md
development-scafold.md
relevant backend phase plan
relevant frontend wiring record
```
