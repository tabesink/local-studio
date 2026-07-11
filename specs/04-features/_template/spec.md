---
id: F-###
title: <short feature name>
status: draft
owner: <delivery owner>
last_reviewed: <YYYY-MM-DD>
depends_on: []
contracts: []
business_rules: []
nfrs: []
supersedes: []
---

# F-### — <Short Feature Name>

## 1. Outcome

**User/problem:** `<who has what problem?>`  
**Desired outcome:** `<what becomes possible or better?>`  
**Why now:** `<business/operational reason>`  

## 2. Scope

### In scope

- `<behaviour>`

### Out of scope

- `<explicitly not included>`
- `<future capability intentionally deferred>`

## 3. Users and permissions

| Actor | May do | Preconditions | Must not do |
| --- | --- | --- | --- |
| `<role>` | `<actions>` | `<conditions>` | `<limits>` |

## 4. User stories

### US-001 — `<title>`

**As a** `<role>`  
**I want** `<action>`  
**So that** `<outcome>`

## 5. Behaviour rules

| ID | Rule | Source | Verification |
| --- | --- | --- | --- |
| FR-001 | `<MUST/MUST NOT rule>` | `<BR/WF/decision>` | `<test/acceptance>` |

## 6. Primary and exception flows

### Primary flow

1. `<actor action>`
2. `<system response>`
3. `<result>`

### Exceptions

| Condition | Required behaviour | User-visible result | Audit/observability |
| --- | --- | --- | --- |
| `<condition>` | `<behaviour>` | `<message/state>` | `<event/log/none>` |

## 7. Data and contracts

- **Reads:** `<entities/contracts>`
- **Writes:** `<entities/contracts>`
- **API/event/data/AI contracts:** `<paths>`
- **State changes:** `<before → after>`
- **Migration needed:** `<yes/no; link>`

## 8. Non-functional requirements

| NFR | Requirement for this feature | Verification |
| --- | --- | --- |
| `<NFR-ID>` | `<specific application>` | `<test/check>` |

## 9. Acceptance criteria

- [ ] AC-001: `<observable, testable completion condition>`
- [ ] AC-002: `<observable, testable completion condition>`
- [ ] AC-003: `<negative/error/permission condition>`

## 10. Open decisions

| ID | Decision needed | Why it blocks or shapes delivery | Owner | Due/trigger |
| --- | --- | --- | --- | --- |
| OD-001 | `<question>` | `<reason>` | `<role>` | `<date/condition>` |

## 11. Risks and assumptions

- **Risk:** `<risk>` → **mitigation:** `<action>`
- **Assumption:** `<assumption>` → **how to validate:** `<method>`
