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

## Evaluation

Required checks include exact mapping, no-grounded-context behavior, citation validation, redaction behavior, unsafe payload exclusion, latency/cost metadata capture where safe, and regression cases for adversarial questions that ask for unsupported claims.
