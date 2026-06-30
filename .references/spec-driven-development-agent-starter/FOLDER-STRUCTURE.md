# Folder Structure

```text
repository/
├── AGENTS.md                                # Binding rules for coding agents and developers
├── README.md                                 # Product/repository entry point
├── FOLDER-STRUCTURE.md                      # This map
├── specs/
│   ├── README.md                             # How this specification system works
│   ├── 00-governance/
│   │   ├── constitution.md                   # Engineering/product principles and non-negotiables
│   │   ├── document-control.md               # Status, ownership, review, source-of-truth rules
│   │   ├── glossary.md                       # Canonical vocabulary
│   │   └── decision-log.md                   # Decisions that do not require a full ADR
│   ├── 01-product/
│   │   ├── product-brief.md                  # Product identity, users, outcomes, scope
│   │   ├── domain-model.md                   # Bounded contexts, entities, ownership
│   │   ├── business-rules.md                 # Canonical business rules
│   │   ├── roles-and-permissions.md          # Users, roles, actions, authorization
│   │   └── workflows/
│   │       └── README.md                     # One workflow document per important business flow
│   ├── 02-architecture/
│   │   ├── system-context.md                 # System boundary, actors, dependencies, C4 context
│   │   ├── component-boundaries.md           # Modules/services, responsibilities, dependencies
│   │   ├── data-ownership.md                 # System of record and lifecycle rules
│   │   ├── integration-flows.md              # Sync/async interactions and failure semantics
│   │   ├── non-functional-requirements.md    # Security, performance, reliability, compliance
│   │   └── decisions/
│   │       └── README.md                     # ADR instructions and ADR files
│   ├── 03-contracts/
│   │   ├── README.md                         # Contract conventions and compatibility rules
│   │   ├── api/
│   │   │   └── README.md                     # OpenAPI/HTTP contracts
│   │   ├── events/
│   │   │   └── README.md                     # AsyncAPI/event/message contracts
│   │   ├── data/
│   │   │   └── README.md                     # Persistent data/schema contracts
│   │   └── ai/
│   │       └── README.md                     # AI capability contracts, guardrails, evaluations
│   ├── 04-features/
│   │   ├── README.md                         # Feature folder rules
│   │   ├── _template/
│   │   │   ├── spec.md                       # What and why
│   │   │   ├── ux.md                         # User flow and UI state contract
│   │   │   ├── plan.md                       # How and architecture impact
│   │   │   ├── tasks.md                      # Ordered, testable implementation tasks
│   │   │   ├── test-plan.md                  # Test evidence and coverage
│   │   │   ├── acceptance.md                 # Formal completion checks
│   │   │   └── implementation-log.md         # Delivery evidence and known deltas
│   │   └── F-###-short-name/                 # One folder per vertical delivery slice
│   ├── 05-quality/
│   │   ├── test-strategy.md                  # Test layers, owners, minimum evidence
│   │   ├── security-and-privacy.md           # Security, privacy, data classification
│   │   ├── observability.md                  # Logs, metrics, traces, alerts, audit events
│   │   ├── performance-and-resilience.md     # Budgets, failure handling, degradation rules
│   │   └── ai-evaluation.md                  # Quality, safety, grounding, cost evaluations
│   ├── 06-delivery/
│   │   ├── environments.md                   # Environment parity, config, secret rules
│   │   ├── release-and-rollbacks.md          # Release gates, rollback and migration practice
│   │   └── runbooks/
│   │       └── README.md                     # Operational runbooks
│   ├── 07-traceability/
│   │   ├── feature-register.md               # Feature status and artifact links
│   │   ├── traceability-matrix.md            # Requirement-to-test-to-evidence links
│   │   └── change-log.md                     # Material specification changes
│   └── 99-archive/                           # Superseded docs only; never active source of truth
├── .agent/
│   ├── README.md                             # How to use agent instructions and prompts
│   ├── prompts/
│   │   ├── discover.md                       # Understand existing code and docs first
│   │   ├── specify.md                        # Produce/repair feature specification
│   │   ├── plan.md                           # Produce implementation plan
│   │   ├── implement.md                      # Implement approved tasks only
│   │   ├── verify.md                         # Verify code against specifications
│   │   └── converge.md                       # Find/close code-spec drift
│   └── checklists/
│       ├── spec-readiness.md                 # Gate before planning
│       ├── implementation-completion.md      # Gate before merge
│       └── pull-request-review.md            # Review consistency and evidence
└── .github/
    └── pull_request_template.md              # Optional PR template using SDD evidence
```

## Read order for a coding agent

1. `AGENTS.md`
2. `specs/00-governance/constitution.md`
3. The feature folder being changed
4. Contracts touched by that feature
5. Architecture and quality docs that govern the change
6. Existing code only after the intended behaviour is understood

## Why the folders are separated

- **Governance** defines how decisions are made.
- **Product** defines the business truth without framework details.
- **Architecture** defines system boundaries and ownership.
- **Contracts** define machine-consumable agreements across boundaries.
- **Features** define an implementable vertical slice.
- **Quality** defines proof obligations.
- **Delivery** defines how changes become safe production changes.
- **Traceability** connects requirements, code, tests, and evidence.
