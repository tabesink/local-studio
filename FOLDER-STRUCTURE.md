# Folder Structure

```text
repository/
├── AGENTS.md                         # Binding rules for coding agents and developers
├── README.md                         # Context Engine rebuild entry point and build order
├── CONTEXT.md                        # Canonical product vocabulary
├── DESIGN.md                         # Local Studio visual parity source of truth
├── REFERENCES.md                     # Read-only reference evidence map
├── FOLDER-STRUCTURE.md               # This map
├── specs/
│   ├── README.md                     # Specification conventions and read order
│   ├── 00-governance/                # constitution, document control, glossary, decision log
│   ├── 01-product/                   # product brief, domain model, business rules, roles
│   ├── 02-architecture/              # system context, boundaries, data ownership, flows, NFRs, ADRs
│   ├── 03-contracts/                 # API, SSE, data, and AI contracts
│   ├── 04-features/                  # P0-P9 phase feature folders
│   │   ├── F-000-shared-contract/
│   │   ├── F-001-trusted-application-foundation/
│   │   ├── F-002-trusted-runtime-config/
│   │   ├── F-003-knowledge-domains-runtime/
│   │   ├── F-004-source-documents-preparation/
│   │   ├── F-005-lightrag-indexing-eligibility/
│   │   ├── F-006-scoped-evidence-retrieval/
│   │   ├── F-007-grounded-streaming-chat/
│   │   ├── F-008-observability-pilot-gate/
│   │   └── F-009-frontend-delivery/
│   ├── 05-quality/                   # tests, security/privacy, observability, performance, AI eval
│   ├── 06-delivery/                  # environments, release/rollback, runbooks
│   ├── 07-traceability/              # feature register, traceability matrix, change log
│   └── 99-archive/                   # superseded docs only
├── .agent/                           # reusable agent prompts and checklists from the starter scaffold
└── .github/                          # spec-driven PR template
```

## Read Order For Coding Agents

1. `AGENTS.md`
2. `specs/00-governance/constitution.md`
3. `CONTEXT.md`
4. `DESIGN.md` for frontend work
5. the relevant P0-P9 feature folder in `specs/04-features/`
6. touched contracts in `specs/03-contracts/`
7. architecture, quality, delivery, and traceability docs as needed
8. existing code and tests

## Feature Folder Shape

Each phase feature contains:

- `spec.md`
- `ux.md`
- `plan.md`
- `tasks.md`
- `test-plan.md`
- `acceptance.md`
- `implementation-log.md`

`F-009-frontend-delivery/` also includes `frontend-slice-map.md` for the 17 ordered frontend slices.
