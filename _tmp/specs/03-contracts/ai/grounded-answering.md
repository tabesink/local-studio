---
id: AI-001
title: Grounded Evidence And Answering
status: approved
owner: Context Engine retrieval and chat team
last_reviewed: 2026-06-30
depends_on: [API-001, EVT-001, DATA-001]
supersedes: []
---

# Grounded Evidence And Answering

## Capability

Context Engine answers one user question against one selected Knowledge Domain by retrieving exact mapped Evidence, then synthesizing a grounded answer with citations or returning a safe fallback.

## Guardrails

- No general/domainless chat in the pilot.
- No classifier branch that bypasses retrieval.
- No prior assistant answers in the prompt.
- No browser model/provider/prompt/retrieval controls.
- Prompt uses current-turn Evidence and bounded prior user questions only.
- Citations must reference current-turn evidence IDs.
- Provider failure after evidence returns evidence-only fallback, not raw provider error.

## Indexing And Eligibility Precondition

Before evidence retrieval or grounded answering can use a Source Document, P5 must prove that private LightRAG indexing preserves exact Context Engine Source Block identity through `CE_BLOCK` markers. If the pinned LightRAG fixture cannot prove marker preservation, idempotent submit, native readiness, delete/absence proof, and typed provider-secret injection without unsafe fixture data, F-005 is blocked.

Retrieval and chat phases must call the backend `source_is_query_eligible(source, domain)` predicate and discard any raw LightRAG hit from a source that fails it. Frontend code must not compute query eligibility, and Evidence mapping must not fall back to fuzzy, nearest, parser-native, or remote-runtime chunk identity.

## Evaluation

Required checks include exact `CE_BLOCK` mapping, source query eligibility, no-grounded-context behavior, citation validation, redaction behavior, unsafe payload exclusion, latency/cost metadata capture where safe, and regression cases for adversarial questions that ask for unsupported claims.
