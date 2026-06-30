---
id: F-###-TEST
title: <feature test plan>
status: draft
owner: <test/technical owner>
last_reviewed: <YYYY-MM-DD>
depends_on: [F-###, F-###-PLAN]
supersedes: []
---

# Test Plan — F-###

## Test scope

| Acceptance criterion / risk | Test level | Scenario | Expected result | Automation | Evidence location |
| --- | --- | --- | --- | --- | --- |
| AC-001 | Unit | `<scenario>` | `<result>` | yes/no | `<path/CI>` |
| AC-002 | Integration | `<scenario>` | `<result>` | yes/no | `<path/CI>` |
| AC-003 | UI/E2E/manual | `<scenario>` | `<result>` | yes/no | `<path/recording>` |

## Contract tests

| Contract | Provider/consumer | Compatibility scenario | Evidence |
| --- | --- | --- | --- |
| `<path>` | `<owner>` | `<scenario>` | `<test>` |

## Security/privacy checks

- [ ] Authorization passes for allowed role.
- [ ] Authorization denies prohibited role.
- [ ] Invalid/untrusted input handled safely.
- [ ] No sensitive values in expected logs/test artifacts.
- [ ] Retention/deletion requirements considered if data changes.

## AI evaluation checks (only where AI applies)

- [ ] Correct output structure/schema.
- [ ] Grounding/source policy respected.
- [ ] Unsafe or unsupported request behaviour evaluated.
- [ ] Cost/latency limits observed.
- [ ] Regression cases added to the evaluation set.

## Exit criteria

List the exact checks that must pass before the feature is complete.
