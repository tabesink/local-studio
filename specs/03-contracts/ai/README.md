# AI Capability Contracts

Primary AI contract: `grounded-answering.md`.

AI behavior in the pilot is domain-scoped and RAG-only. Evidence must map exactly from `CE_BLOCK` identity to eligible Source Blocks. Prompts, raw provider responses, raw LightRAG hits, and raw source text are restricted data and must not be exposed through browser APIs, logs, traces, or fixtures.
