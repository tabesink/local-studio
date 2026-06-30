---
id: QUAL-001
title: Test Strategy
status: draft
owner: <engineering/test owner>
last_reviewed: <YYYY-MM-DD>
depends_on: [GOV-001, ARCH-005]
supersedes: []
---

# Test Strategy

## Test layers

| Layer | Purpose | Required for | Owner | Typical evidence |
| --- | --- | --- | --- | --- |
| Unit | Domain/use-case rules | Business rules, validation, calculations | Component owner | Test suite |
| Integration | Boundary behaviour | DB, queue, external adapter, provider | Component owner | Test suite |
| Contract | Provider/consumer compatibility | API, event, AI tool/schema | Boundary owner | Contract test |
| UI/E2E | User journey | Critical user workflows | Feature owner | Browser test |
| Security | Abuse and authorization checks | Privileged/sensitive workflows | Security + feature owner | Test/review |
| Performance | Budget validation | High-load/background flows | Engineering owner | Load test |
| Manual acceptance | Human UX/operational validation | Subjective/physical/external flows | Feature/product owner | Checklist |

## Minimum proof rule

Every feature acceptance criterion must map to at least one verification row. High-risk behaviour needs more than one layer.

## Test data rules

- Use synthetic, anonymized, or approved fixture data.
- Do not expose customer or production secrets in test files, CI output, screenshots, or prompts.
- Keep fixtures small and deliberate; name the behaviour they prove.
