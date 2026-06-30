---
id: TRACE-001
title: Feature Register
status: approved
owner: Context Engine delivery coordinator
last_reviewed: 2026-06-30
depends_on: [GOV-001]
supersedes: []
---

# Feature Register

| Feature | Status | Outcome | Depends on | Spec | Plan | Test plan | Key contracts |
| --- | --- | --- | --- | --- | --- | --- | --- |
| F-000 | approved | shared product/architecture/contract spine | none | `specs/04-features/F-000-shared-contract/spec.md` | `specs/04-features/F-000-shared-contract/plan.md` | `specs/04-features/F-000-shared-contract/test-plan.md` | all specs |
| F-001 | approved | trusted API, DB, users, cookie sessions | F-000 | `specs/04-features/F-001-trusted-application-foundation/spec.md` | `specs/04-features/F-001-trusted-application-foundation/plan.md` | `specs/04-features/F-001-trusted-application-foundation/test-plan.md` | API-001, DATA-001 |
| F-002 | approved | runtime provider/model/parser config | F-001 | `specs/04-features/F-002-trusted-runtime-config/spec.md` | `specs/04-features/F-002-trusted-runtime-config/plan.md` | `specs/04-features/F-002-trusted-runtime-config/test-plan.md` | API-001, DATA-001 |
| F-003 | approved | Knowledge Domain lifecycle and private runtime | F-002 | `specs/04-features/F-003-knowledge-domains-runtime/spec.md` | `specs/04-features/F-003-knowledge-domains-runtime/plan.md` | `specs/04-features/F-003-knowledge-domains-runtime/test-plan.md` | API-001, DATA-001 |
| F-004 | approved | Source Document upload/preparation/canonical blocks | F-003 | `specs/04-features/F-004-source-documents-preparation/spec.md` | `specs/04-features/F-004-source-documents-preparation/plan.md` | `specs/04-features/F-004-source-documents-preparation/test-plan.md` | API-001, DATA-001 |
| F-005 | approved | LightRAG indexing and query eligibility | F-004 | `specs/04-features/F-005-lightrag-indexing-eligibility/spec.md` | `specs/04-features/F-005-lightrag-indexing-eligibility/plan.md` | `specs/04-features/F-005-lightrag-indexing-eligibility/test-plan.md` | API-001, DATA-001, AI-001 |
| F-006 | approved | evidence-only retrieval | F-005 | `specs/04-features/F-006-scoped-evidence-retrieval/spec.md` | `specs/04-features/F-006-scoped-evidence-retrieval/plan.md` | `specs/04-features/F-006-scoped-evidence-retrieval/test-plan.md` | API-001, AI-001 |
| F-007 | approved | grounded SSE chat and redaction | F-006 | `specs/04-features/F-007-grounded-streaming-chat/spec.md` | `specs/04-features/F-007-grounded-streaming-chat/plan.md` | `specs/04-features/F-007-grounded-streaming-chat/test-plan.md` | API-001, EVT-001, AI-001, DATA-001 |
| F-008 | approved | audit/log/tracing and pilot gate | F-007 | `specs/04-features/F-008-observability-pilot-gate/spec.md` | `specs/04-features/F-008-observability-pilot-gate/plan.md` | `specs/04-features/F-008-observability-pilot-gate/test-plan.md` | DATA-001, QA-003 |
| F-009 | approved | frontend delivery with Local Studio visual parity | F-001 through F-008 gates as needed | `specs/04-features/F-009-frontend-delivery/spec.md` | `specs/04-features/F-009-frontend-delivery/plan.md` | `specs/04-features/F-009-frontend-delivery/test-plan.md` | API-001, EVT-001, DESIGN |
