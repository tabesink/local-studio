# Spec-Driven Pull Request Review Checklist

## Product and scope

- [ ] PR names the feature ID and links the active spec.
- [ ] Behaviour matches approved scope and acceptance criteria.
- [ ] No undocumented product decisions or scope expansion.

## Architecture and contracts

- [ ] Touched boundaries and ownership remain clear.
- [ ] API/event/data/AI contract changes are versioned/documented.
- [ ] Backward compatibility or migration is addressed.
- [ ] No unnecessary framework, service, abstraction, configuration, or dependency was added.

## Quality and delivery

- [ ] Tests prove critical behaviour and failure cases.
- [ ] Authorization/security/privacy concerns are addressed.
- [ ] Operational observability is adequate.
- [ ] Migration and rollback are safe.
- [ ] Acceptance/implementation/traceability docs contain actual evidence.

## Review result

- [ ] Approve
- [ ] Request changes
- [ ] Block pending product/architecture decision
