---
id: QUAL-003
title: Observability and Audit Requirements
status: draft
owner: <engineering/operations owner>
last_reviewed: <YYYY-MM-DD>
depends_on: [ARCH-005]
supersedes: []
---

# Observability and Audit Requirements

## Goals

A maintainer must be able to answer:
1. Is the system healthy?
2. Is a user workflow succeeding?
3. Why did a request/job/agent action fail?
4. What changed and who/what initiated it?
5. Are costs, latency, and error rates within limits?

## Required signals

| Area | Logs | Metrics | Traces | Audit events | Alert |
| --- | --- | --- | --- | --- | --- |
| API | `<fields>` | `<metrics>` | `<span>` | `<events>` | `<threshold>` |
| Background job | `<fields>` | `<metrics>` | `<span>` | `<events>` | `<threshold>` |
| AI capability | `<safe inputs/outputs>` | `<cost/latency/errors>` | `<trace>` | `<actions>` | `<threshold>` |

## Correlation

Define correlation/request/job/session IDs and propagate them across each relevant boundary.

## Privacy rule

Logs and traces must never be the uncontrolled storage path for secrets, private source content, raw credentials, or full model prompts/responses where this conflicts with data policy.
