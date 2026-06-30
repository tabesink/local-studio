---
id: RUN-001
title: Pilot Launch Runbook
status: approved
owner: Context Engine operations team
last_reviewed: 2026-06-30
depends_on: [DEL-002, QA-003]
supersedes: []
---

# Pilot Launch Runbook

Before a 5-10 user internal pilot:

1. Confirm P1-P8 acceptance evidence is complete.
2. Run fresh database migration from empty.
3. Run compose smoke and private runtime health checks.
4. Run full e2e flow: auth, domain, upload, prepare, index, evidence, chat, delete, redaction.
5. Confirm browser storage has no auth token.
6. Confirm audit events and safe logs are emitted for admin/security actions.
7. Confirm Langfuse, if enabled, captures metadata only and outages do not block product behavior.
8. Confirm P9 visual checks for dark/light desktop and narrow viewport.
9. Record open limitations and support contacts.
