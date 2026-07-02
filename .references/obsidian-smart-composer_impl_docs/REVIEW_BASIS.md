# Review Basis and Applied Checklist

This package applies the supplied review and specification-driven guidance as follows.

| Supplied guidance | Applied in this package |
|---|---|
| Senior Software Architect Review — API Load Testing, Security, Reliability, and Launch Readiness | `specs/05-quality/`, F-010, release runbook, typed error/security/operational requirements. |
| Context Engine — Independent Systems-Slices Review | server ownership, per-turn domain rule, conversation-history/redaction decision, private retrieval/provider boundary, 5–10 user pilot target. |
| Frontend + API Reverse-Engineering and Modular Rebuild Review Prompt | verified-source map, source/target classification, route/feature boundaries, contract catalog, UI state requirements, vertical slices. |
| Agent Operating Contract | root `AGENTS.md`, per-feature documentation, work packets, evidence requirements. |
| Folder Structure / Spec-Driven Development Starter | `specs/00` through `specs/07` package layout, status/front matter, traceability. |

## Review method

- Static, commit-pinned inspection of selected Smart Composer source paths.
- No claim that unexecuted runtime behaviours are verified.
- Target Next.js/FastAPI contracts are marked proposed until the Context Engine owner approves or maps them to existing routes.
