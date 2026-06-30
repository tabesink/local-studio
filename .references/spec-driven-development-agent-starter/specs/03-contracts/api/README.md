# API Contracts

Store OpenAPI documents, endpoint specs, or equivalent structured contracts here.

Recommended layout:

```text
api/
├── identity-v1.yaml
├── knowledge-v1.yaml
├── shared-errors.md
└── README.md
```

Each operation must define:
- purpose and feature IDs;
- authentication/authorization;
- request/response schemas;
- validation and error model;
- pagination/filter/sort semantics;
- idempotency for write operations;
- rate and payload limits where relevant;
- version/deprecation behaviour;
- observability/audit requirements.

## Error minimum

Errors should have a stable machine-readable code, safe user-facing message, correlation/request identifier where applicable, and documented retry guidance.
