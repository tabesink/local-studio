---
id: GOV-003
title: Glossary
status: approved
owner: Context Engine delivery team
last_reviewed: 2026-07-02
depends_on: [GOV-001]
supersedes: []
---

# Glossary

Use `CONTEXT.md` as the short-form vocabulary reference. This glossary is the spec-owned version.

| Term | Definition | Avoid | Owner |
| --- | --- | --- | --- |
| Knowledge Domain | Curated retrieval boundary with a private LightRAG runtime, source corpus, lifecycle, and query eligibility. | tenant, workspace, collection | backend/domain |
| Source Document | Admin-uploaded file belonging to one Knowledge Domain and eligible for preparation, indexing, citation, and deletion. | generic file asset | documents |
| Canonical Source | Context Engine-normalized representation produced from a Source Document before LightRAG handoff. | parser-native payload | documents |
| Source Block | Stable citable unit with a Source Document owner and source order. | raw chunk | evidence |
| Evidence | Authorized mapped retrieval result safe for display and synthesis context. | raw hit | retrieval |
| Citation | User-visible reference from an answer to current-turn Evidence. | unsupported footnote | chat |
| Query Eligibility | Server predicate that proves a Source Document may be retrieved for a selected Knowledge Domain. | ready flag | indexing |
| Conversation | User-owned chat history container whose turns may be domain-grounded or narrow direct LLM general chat. | session | chat |
| Turn | One user question and response attempt; domain-grounded turns record exactly one Knowledge Domain, direct LLM turns record none. | generic message | chat |
| Redaction | Removal of derived answer/citations after source or domain hard delete while preserving the user question. | archive | chat/data |
| Administrator | User allowed to manage domains, sources, settings, operations, and diagnostics. | operator | auth |
| Member | Authenticated user allowed to query available domains and own conversations. | viewer | auth |
