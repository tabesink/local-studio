# ID-A - Live parser SDK follow-up (junior dev explainer)

Parent: [ID-A.md](./ID-A.md)

**Question:** Does P4 need live Docling/Reducto SDK calls before it can be considered complete?

### Decision

No. P4 is correctly complete without live Docling/Reducto SDK calls.

P4 shipped two parser layers:

| Layer | Status | Role |
| --- | --- | --- |
| Normalizers | done | map native Docling/Reducto-shaped payloads to `PreparedSource` |
| Runtime adapters | stub | worker entry points; today they fall back to simple UTF-8 text preparation |

This is a known pilot-prep gap, not P4 drift. Add a new explicit follow-up slice before P8/Staging to wire live parser calls into the existing adapter functions.

### Evidence

| Claim | Evidence |
| --- | --- |
| P4 test plan allows synthetic parser fixtures | `specs/04-features/F-004-source-documents-preparation/test-plan.md` |
| AC-003 is satisfied by normalizer fixtures | `test_docling_and_reducto_fixtures_normalize_to_same_prepared_source_shape` |
| P4 implementation log says live external parser calls are not required evidence | `specs/04-features/F-004-source-documents-preparation/implementation-log.md` |
| Worker calls adapters, not normalizers directly | `SourcePreparationWorker.run_once()` in `context_engine/services/sources.py` |
| Current default adapters use simple text preparation | `docling_adapter()` and `reducto_adapter()` in `context_engine/services/sources.py` |

### Why

| Bad | Good |
| --- | --- |
| reopen P4 because SDKs are stubbed | record pilot-prep gap |
| make P5 own parser SDK integration | P5 indexes prepared Source Blocks |
| persist parser-native payloads to debug SDK wiring | normalize then discard |
| let browser choose parser/runtime details | backend resolves parser kind/credential |

### Practical Impact

Plain text and markdown-like uploads can prepare through `_simple_text_prepared_source()`.

Real PDFs, DOCX files, and images can upload and store, but preparation will not produce proper structural blocks/tables/figures until the adapters call live parser SDK/API paths and feed results through the existing normalizers.

Reducto credential resolution is already wired through `_resolve_parser_credential()`. The missing piece is the private API/SDK call before `normalize_reducto_parse_response(...)`.

### Follow-up Slice

Suggested title:

```text
F-004 follow-up or pre-P8 parser integration:
Wire live parser SDK calls into docling_adapter / reducto_adapter; add pinned parser fixture proof.
```

Scope:

```text
docling_adapter:
  original bytes -> Docling SDK/API parse
  native document export -> normalize_docling_document(...)

reducto_adapter:
  decrypted Reducto credential -> Reducto SDK/API parse
  native response -> normalize_reducto_parse_response(...)

tests:
  pinned non-sensitive parser fixtures
  safe error mapping
  no parser payload persistence
  no credential/path/url exposure
```

### Implement Order

```text
1. Add live Docling parser client behind `docling_adapter()`.
2. Feed native Docling output into `normalize_docling_document(...)`.
3. Add live Reducto parser client behind `reducto_adapter()`.
4. Reuse `_resolve_parser_credential()` for Reducto only.
5. Feed native Reducto output into `normalize_reducto_parse_response(...)`.
6. Keep existing `PreparedSource` validator and publish path unchanged.
7. Add pinned non-sensitive parser fixture proof and safe failure tests.
```

### When It Blocks

| Milestone | Live parser needed? |
| --- | --- |
| P4 closure | no |
| P5 indexing | no, P5 can index whatever P4 prepared |
| P8 pilot gate | yes, for meaningful real-document rehearsal |
| Staging/Pilot | yes where real parser behavior is required |

### Red Flags In PR

- P5 implementation tries to call Docling/Reducto directly.
- Parser SDK output is persisted as JSON.
- Reducto credential appears in logs, fixtures, DTOs, or errors.
- Adapter returns parser-native blocks instead of `PreparedSource`.
- Follow-up claims pilot readiness without real parser fixture proof.

### Tests

- Live/pinned Docling fixture normalizes to `PreparedSource`.
- Live/pinned Reducto fixture normalizes to same semantics.
- Parser auth/unavailable/malformed failures map to safe operation errors.
- No parser task id, URL, provider payload, path, credential, or raw parser body is persisted/exposed.
- Existing P4 synthetic normalizer tests remain.

### One-line Summary

P4 proved the canonical parser boundary; live parser SDK wiring is required before pilot, not before P4 closure or P5 indexing.
