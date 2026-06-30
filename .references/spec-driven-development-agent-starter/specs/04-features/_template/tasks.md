---
id: F-###-TASKS
title: <feature task list>
status: draft
owner: <technical owner>
last_reviewed: <YYYY-MM-DD>
depends_on: [F-###, F-###-PLAN]
supersedes: []
---

# Task List — F-###

Tasks are implementation instructions, not a restatement of the specification.

## Task format

```text
- [ ] T-001 [layer] Action — expected outcome
  - Depends on: <task IDs or none>
  - Specs/contracts: <paths/IDs>
  - Verification: <test/check>
```

## Tasks

### Preparation

- [ ] T-001 [docs] Confirm or update affected contracts and feature links.
  - Depends on: none
  - Specs/contracts: `<paths>`
  - Verification: review against `spec.md`

### Implementation

- [ ] T-010 [backend] `<small behaviour change>`
  - Depends on: T-001
  - Specs/contracts: `<paths>`
  - Verification: `<test>`

- [ ] T-020 [frontend] `<small behaviour change>`
  - Depends on: T-010
  - Specs/contracts: `<paths>`
  - Verification: `<test>`

### Verification and evidence

- [ ] T-090 [tests] Execute documented test plan.
- [ ] T-091 [docs] Update acceptance and implementation evidence.
- [ ] T-092 [traceability] Update feature register and matrix.

## Task ordering rules

- Define contracts/migrations before dependent implementation.
- Put automated tests close to the task that changes behaviour.
- Do not hide a new requirement inside a task. Update `spec.md` first.
- Keep tasks independently reviewable where possible.
