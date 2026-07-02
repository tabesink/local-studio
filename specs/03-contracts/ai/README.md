# AI Capability Contracts

Primary AI contract: `grounded-answering.md`.

AI behavior in the pilot is server-routed: narrow direct LLM for non-domain general chat, and CE-native advanced agentic domain RAG for Knowledge Domain questions. Evidence must map exactly from `CE_BLOCK` identity to eligible Source Blocks. Prompts, raw provider responses, raw LightRAG hits, planning text, and raw source text are restricted data and must not be exposed through browser APIs, logs, traces, or fixtures. F-007 does not use LangChain or LangGraph adapters.
