# AI Capability Contracts

AI behaviour is a product boundary. It must be specified and evaluated instead of being left as an unversioned prompt.

Suggested file name: `AI-###-short-name.md`.

## Required sections

```md
---
id: AI-001
title: <capability>
status: draft
owner: <role>
model_policy: <provider/model selection rule>
---

# AI-001 — <capability>

## User outcome and non-goals
## Inputs and output schema
## Context/grounding sources and precedence
## Allowed tools and permissions
## Prompt/instruction policy
## Model/provider policy
## Guardrails and refusal behaviour
## Human confirmation/escalation rules
## Reliability: timeouts, retries, degraded behaviour
## Privacy/security/data handling
## Observability and audit evidence
## Evaluation set, metrics, pass thresholds
## Cost/token budget
## Change/version policy
```

## Rules

- Do not put secrets, private keys, or unrestricted sensitive data in prompts.
- Separate stable system policy from feature-specific instruction and runtime user input.
- State whether the model may act, propose, or only answer.
- Define grounded-answer expectations: citations, source restrictions, uncertainty, and “I do not know” behaviour.
- Record the evaluation set and pass threshold before declaring the capability complete.
