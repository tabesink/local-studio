# System Context

```text
Browser
  |
  | cookie auth + typed HTTP/SSE
  v
Next.js Context Engine client
  |
  v
FastAPI
  |-- Postgres: users/domains/docs/jobs/operations/audit
  |-- Redis/worker: ingestion work
  |-- LightRAG: semantic retrieval/indexing/graph
  `-- Provider: synthesis/embeddings

Local Studio reference only
  |-- tokens/primitives/shell/settings patterns
  `-- agent/controller/runtime features: separate future docs
```
