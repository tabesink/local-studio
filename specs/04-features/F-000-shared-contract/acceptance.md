---
id: F-000
title: Shared Contract Acceptance Evidence
status: implemented
owner: Context Engine delivery team
last_reviewed: 2026-06-30
depends_on: []
supersedes: []
---


# F-000 - Acceptance Evidence

Status: implemented.

| Criterion | Evidence | Result | Notes |
| --- | --- | --- | --- |
| AC-001 | `rg -n "TO[D]O|TB[D]|FIXM[E]|PLACEHOLDE[R]|template placeholde[r]|changem[e]|lore[m]|fill i[n]" .` | pass | Command returned exit code 1 with no matches; active docs have no starter placeholder residue. |
| AC-002 | `rg --files .`; `sed -n '1,260p' specs/07-traceability/feature-register.md` | pass | Every F-000 through F-009 `spec.md`, `plan.md`, and `test-plan.md` path listed in the feature register is present in the repository file listing. |
| AC-003 | `rg -n "Source Of Truth|Use this precedence|Reference material|source-of-truth precedence|reference-material status|conflict" README.md AGENTS.md REFERENCES.md specs/00-governance specs/04-features/F-000-shared-contract` | pass | Source precedence and reference-material status are documented in `README.md`, `AGENTS.md`, `REFERENCES.md`, `specs/00-governance/document-control.md`, and F-000. |

## Completion Rule

Do not mark this feature implemented until every criterion has real command output, snapshot, screenshot, fixture, review note, or runbook evidence.
