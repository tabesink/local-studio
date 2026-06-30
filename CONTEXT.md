# Context Engine Vocabulary

Context Engine is an internal shared-workspace RAG product for administrator-curated Knowledge Domains, grounded answers, and traceable source evidence.

## Canonical Terms

| Term | Meaning | Avoid |
| --- | --- | --- |
| Knowledge Domain | A curated retrieval boundary with its own private LightRAG runtime, source corpus, lifecycle, and query eligibility. | tenant, workspace, project, collection |
| Source Document | An administrator-uploaded file that can be prepared, indexed, cited, and deleted as part of one Knowledge Domain. | asset, file record, document-management item |
| Canonical Source | Context Engine-owned normalized representation produced from a Source Document before LightRAG handoff. | parser output, Docling JSON, Reducto response |
| Source Block | A stable citable unit inside a Canonical Source that can be mapped from retrieval output to user-visible evidence. | chunk when discussing product evidence |
| Evidence | A mapped, authorized retrieval result that can be shown to a user and used as synthesis context. | search hit, raw LightRAG result, context blob |
| Citation | A user-visible reference from an answer back to Evidence and Source Document provenance. | link when not navigable, footnote without source mapping |
| LightRAG Runtime | A private per-domain retrieval engine process owned by Context Engine and hidden from the browser. | public LightRAG API, tenant runtime |
| Query Eligibility | Server-side decision that a domain/source can be retrieved because lifecycle, indexing, deletion, and authorization checks all pass. | ready flag when more than indexing readiness is meant |
| Conversation | A user-owned chat history container whose turns may each select one Knowledge Domain. | session, team chat |
| Turn | One user question and resulting grounded response attempt against exactly one Knowledge Domain. | message when domain/retrieval boundary matters |
| Redaction | Removal of derived answer/citation content after source or domain hard delete while preserving the original user question. | soft delete, hide citation, archive |
| Administrator | User role allowed to manage domains, source documents, runtime settings, operations, and diagnostics. | operator when referring to app permissions |
| Member | Standard authenticated user who can query available domains and manage their own conversations. | viewer when conversation ownership matters |

## Relationships

- A Knowledge Domain has zero or more Source Documents.
- A Source Document belongs to exactly one Knowledge Domain.
- A Source Document produces one Canonical Source for downstream handoff.
- A Canonical Source contains one or more Source Blocks.
- Evidence maps to Source Blocks and never to raw LightRAG output alone.
- A Citation belongs to one answer and points back to current-turn Evidence.
- A Conversation belongs to exactly one Member or Administrator.
- A Turn belongs to exactly one Conversation and exactly one Knowledge Domain.
- A LightRAG Runtime belongs to exactly one Knowledge Domain.
- Redaction applies to Turns when cited sources or selected domains are deleted.

## Product Locks

- Pilot chat is RAG-only. There is no general/domainless branch.
- Parser profile is not a pilot product concept. Upload freezes `parser_kind`; credentials resolve privately at runtime.
- Domain means Knowledge Domain, not tenant or deployment environment.
- Hard delete fences retrieval first and removes or redacts derived state, not only current storage files.
