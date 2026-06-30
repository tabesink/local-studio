---
id: QUAL-005
title: AI Evaluation Strategy
status: draft
owner: <AI capability owner>
last_reviewed: <YYYY-MM-DD>
depends_on: [QUAL-001, QUAL-002, QUAL-003]
supersedes: []
---

# AI Evaluation Strategy

## Applicability

Complete this only for features that use language models, retrieval, tool calling, classification, extraction, generation, or automated decision support.

## Evaluation dimensions

| Dimension | Question | Metric / rubric | Threshold | Dataset owner | Cadence |
| --- | --- | --- | --- | --- | --- |
| Task quality | Does it achieve the user outcome? | `<metric>` | `<threshold>` | `<owner>` | `<cadence>` |
| Grounding | Are claims supported by permitted sources? | `<metric>` | `<threshold>` | `<owner>` | `<cadence>` |
| Safety | Does it follow refusal/guardrail policy? | `<metric>` | `<threshold>` | `<owner>` | `<cadence>` |
| Reliability | Does it meet schema/tool constraints? | `<metric>` | `<threshold>` | `<owner>` | `<cadence>` |
| Cost/latency | Is operation within budget? | `<metric>` | `<threshold>` | `<owner>` | `<cadence>` |

## Evaluation dataset

- Dataset location: `<path/system>`
- Case categories: `<normal, edge, adversarial, regression>`
- Expected-answer/rubric ownership: `<owner>`
- Sensitive-data policy: `<rules>`
- Change control: add regression cases for every material production failure.

## Release gate

Define which thresholds must pass before a model, prompt, retrieval policy, tool policy, or provider change may ship.
