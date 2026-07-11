---
id: ARCH-001
title: System Context
status: approved
owner: Context Engine architecture team
last_reviewed: 2026-06-30
depends_on: [GOV-001, PROD-001]
supersedes: []
---

# System Context

## Target Shape

```text
Browser
  -> Context Engine API
     -> Postgres
     -> private source storage
     -> one worker process
     -> private domain controller
     -> one private LightRAG runtime per Knowledge Domain
     -> configured provider/parser services
```

## Trust Boundaries

| Boundary | In/Out | Data | Trust | Rule |
| --- | --- | --- | --- | --- |
| Browser -> API | in | session cookie, DTOs, SSE requests | untrusted client | validate/authz every request |
| API -> Postgres | both | product state | trusted service | migrations and repositories own schema |
| API/worker -> storage | both | originals, derived files | trusted private | no browser paths |
| API/worker -> controller | both | private lifecycle commands | trusted internal | token-auth internal only |
| Controller -> Docker/runtime | both | runtime lifecycle | private infra | no API Docker socket |
| API/worker -> providers/parsers | both | bounded source/prompt payloads | external dependency | secret injection only server-side |
| API/worker -> LightRAG | both | indexed text, retrieval calls | private runtime | no browser access |
| API -> Langfuse optional | out | safe metadata only | external/optional | disabled by default, outage non-blocking |

## Explicitly Outside Boundary

- multi-tenant platform policy;
- per-document ACL expansion;
- generic workflow engine;
- plugin runtime;
- web browsing or agent tools;
- offline sync/cache;
- public LightRAG API;
- model playground.
