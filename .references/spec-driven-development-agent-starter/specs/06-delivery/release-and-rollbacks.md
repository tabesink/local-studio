---
id: DEL-002
title: Release and Rollback Policy
status: draft
owner: <release owner>
last_reviewed: <YYYY-MM-DD>
depends_on: [DEL-001, QUAL-001, QUAL-003]
supersedes: []
---

# Release and Rollback Policy

## Release gates

- [ ] Feature acceptance evidence complete.
- [ ] Contract compatibility reviewed.
- [ ] Required migrations verified.
- [ ] Security/privacy review complete for changed risk surface.
- [ ] Observability dashboards/logs/alerts available.
- [ ] Rollback or compensation step documented.
- [ ] Owner and release window known.

## Rollback categories

| Change type | Rollback action | Data impact | Decision owner |
| --- | --- | --- | --- |
| Stateless code | `<deploy previous version>` | `<none>` | `<owner>` |
| Additive schema | `<code rollback + keep schema>` | `<notes>` | `<owner>` |
| Destructive migration | `<restore/compensate>` | `<notes>` | `<owner>` |
| AI prompt/model policy | `<revert version/config>` | `<notes>` | `<owner>` |

## Post-release review

State required observation window, expected signals, and escalation action.
