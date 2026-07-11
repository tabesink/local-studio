---
id: ARCH-005
title: Adaptation non-functional requirements
status: proposed
owner: Context Engine team
last_reviewed: 2026-07-02
depends_on: []
supersedes: []
---
# Non-functional requirements

| Area | Minimum requirement |
|---|---|
| Security | Cookie-authenticated same-origin API; no browser provider keys; typed errors; server authorization for every resource. |
| Privacy | Never log raw prompt, raw answer, raw source blocks, provider secrets, session tokens, or filesystem/runtime paths. |
| Reliability | SSE cancellation is clean; failed turn settles to a typed status; retry never duplicates a persisted turn. |
| Retrieval integrity | Current turn retrieves only selected domain; evidence must correspond to server result. |
| Concurrency | One running turn per conversation; domain/provider limits enforced server-side. |
| Performance | Validate against 5–10 concurrent-user target before pilot; use measured thresholds, not invented targets. |
| Accessibility | Keyboard-operable composer, dialogs, navigation, focus restoration, and screen-reader labels. |
| Observability | Request ID, turn ID, domain ID, safe result code, and elapsed time on server events/logs. |
