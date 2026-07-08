# ID-A - Smart Composer reference adaptation (junior dev explainer)

Parent links: [ID-A.md](./ID-A.md), [F-011-P11-readiness.md](./F-011-P11-readiness.md)

**Question:** What can a junior dev reuse from `.references/obsidian-smart-composer_impl_docs/`?

### Decision

Use the reference for UX and small reviewed presentation ideas only. Do not port runtime authority.

The package itself says Context Engine remains the system of record for identity, authorization, domains, documents, retrieval, provider configuration, chat turns, operations, and audit state.

### Why

| Reference capability | Use in Context Engine | Do not port |
| --- | --- | --- |
| Chat workspace interaction | Composer layout, cancellation affordance, evidence presentation ideas. | Obsidian host lifecycle. |
| Context tokens/mentions | UI pattern for selecting safe API-provided refs. | Vault file/block APIs or local scanning. |
| Citation/evidence components | Visual treatment after DTOs exist. | Private ids or raw source text. |
| Prompt templates | Interaction pattern if backend contract exists. | Browser/provider prompt compilation. |
| Diff/review ideas | Review workflow inspiration only. | Direct file apply or filesystem writes. |
| Response metadata | Safe summary display if API defines it. | Provider payloads, raw costs, raw model targets. |

### Source Evidence Fence

Allowed reference use:

```text
UI composition ideas
small presentational components after dependency removal
pure formatting/diff/parsing/test-pattern ideas after security review
```

Prohibited transfer:

```text
Obsidian App/Plugin/WorkspaceLeaf/ItemView/TFile/Notice/vault APIs
plugin data and local persistence paths
browser or desktop client provider calls
OAuth subscription-connect code
secrets/constants values
MCP tool execution or local process management
direct filesystem writes or apply behavior
local RAG/vector ownership
```

### Exact Adaptation Rule

```text
source idea
  -> classify as UX, pure helper, or runtime behavior
  -> keep UX/pure helper only if it fits F-011 contracts
  -> replace runtime behavior with Context Engine API/service ownership
  -> add attribution if source code is copied
```

### What You Implement (Order)

1. Read `SOURCE_PIN.md`, `COPYING_AND_ATTRIBUTION.md`, and the relevant source summary.
2. Confirm the F-011 spec allows the behavior.
3. Confirm API/DATA/AI/EVT contracts define the needed shape.
4. Rebuild with Context Engine components and typed API wrappers.
5. Copy source code only after MIT/license review and attribution.
6. Add tests proving the reference runtime boundary did not leak into the target.

### Red Flags In PR

- Imports or naming from Obsidian host APIs.
- Local DB/JSON/vault concepts become target persistence.
- Browser-side provider/client code appears.
- OAuth or subscription code appears.
- MCP/tool execution appears.
- Diff/apply writes files or source documents directly.
- Reference paths or source commit links are treated as active requirements.

### Tests

- Import audit for Obsidian, provider, filesystem, MCP, local DB/vector, and runtime host packages.
- Safety scan over copied/adapted code for credential-like constants.
- Frontend network audit proving same-origin Context Engine API only.
- UI tests proving reference UX works through approved DTOs, not local reference state.

### One-line summary

Smart Composer is reference evidence for interaction design; Context Engine must rebuild the behavior on its own contracts.
