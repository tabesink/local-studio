# ID-A - Parser adapters (junior dev explainer)

Parent: [ID-A.md](./ID-A.md)

**Question:** How should Docling and Reducto be wired safely in P4?

### Decision

Parser adapters are private worker dependencies. They return `PreparedSource` only. They never return provider-native payloads to API routes, never persist parser request/response bodies, and never expose credentials, parser URLs, or raw provider failure text.

`parser_kind` is frozen on `source_documents` at upload from `runtime_settings.active_parser_kind`. Retry uses the frozen value, even if global settings changed later.

### Why

| Bad | Good |
| --- | --- |
| route calls parser directly | worker calls parser after operation claim |
| retry uses current parser setting | retry uses frozen `parser_kind` |
| Reducto payload stored for convenience | Reducto payload normalized then discarded |
| raw parser exception shown in API | safe `error_code` and message on operation |
| parser profile config copied into source row | resolver supplies private config at runtime |

### Exact Flow

```text
Upload:
  active_parser_kind = runtime_settings.active_parser_kind
  source_documents.parser_kind = active_parser_kind

Worker:
  source = claim source operation
  parser_kind = source.parser_kind
  if parser_kind == docling:
      run Docling adapter
  if parser_kind == reducto:
      resolve Reducto credential privately
      run Reducto adapter
  normalize to PreparedSource
  validate
  publish
```

### Safe Failure Contract

Map adapter failures to operation fields:

| Failure | Public operation code |
| --- | --- |
| parser not configured | `parser_not_ready` |
| unsupported file | `source_file_unsupported` |
| provider auth failure | `parser_auth_failed` |
| provider network failure | `parser_unavailable` |
| malformed provider response | `parser_malformed_response` |
| canonical validation failed | `source_preparation_invalid` |

Names are recommendations until API-001 is patched.

### Vs Old Reference

Old code has good adapter lessons: Docling and Reducto both normalize into a local model, Reducto errors get typed, and a finalizer validates chunks. Old code also keeps parser metadata, provider job id, asset provider URL metadata, and document chunks around. Greenfield P4 must keep only the canonical Source Block contract.

### Implement Order

```text
1. Add adapter protocol returning PreparedSource.
2. Add fake Docling adapter fixture.
3. Add fake Reducto adapter fixture.
4. Add TrustedRuntimeResolver parser resolution for worker.
5. Add safe exception mapping.
6. Add tests that retry preserves frozen parser_kind.
```

### Red Flags In PR

- `source_documents` stores parser config JSON.
- Operation error includes raw provider response or stack trace.
- API examples mention parser URLs or task ids.
- Retry reads current `activeParserKind`.
- Browser can select Reducto credentials or parser endpoint directly.

### Tests

- Upload freezes `parserKind`.
- Changing runtime setting after upload does not change retry parser.
- Reducto not configured produces safe failed operation.
- Adapter raw exception text is not returned in API response.
- Parser native payload is not persisted.

### One-line Summary

Parser adapters are private translators into PreparedSource; frozen parser kind and safe error mapping are the guardrails.
