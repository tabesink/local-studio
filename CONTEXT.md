# Context Engine

Context Engine is an internal shared-workspace RAG product for administrator-curated knowledge domains, grounded answers, and traceable source evidence.

## Language

**Knowledge Domain**:
A curated retrieval boundary with its own private LightRAG runtime, source corpus, lifecycle, and query eligibility.
_Avoid_: Tenant, workspace, project, collection

**Source Document**:
An administrator-uploaded file that can be prepared, indexed, cited, and deleted as part of one Knowledge Domain.
_Avoid_: Asset, file record, document-management item

**Canonical Source**:
The Context Engine-owned normalized representation produced from a Source Document before LightRAG handoff.
_Avoid_: Parser output, Docling JSON, Reducto response

**Source Block**:
A stable citable unit inside a Canonical Source that can be mapped from retrieval output to user-visible evidence.
_Avoid_: Chunk when discussing product evidence, snippet when discussing storage identity

**Evidence**:
A mapped, authorized retrieval result that can be shown to a user and used as synthesis context.
_Avoid_: Search hit, raw LightRAG result, context blob

**Citation**:
A user-visible reference from an answer back to Evidence and its Source Document provenance.
_Avoid_: Link when the reference is not navigable, footnote when it has no source mapping

**LightRAG Runtime**:
A private per-domain retrieval engine process owned operationally by Context Engine and hidden from the browser.
_Avoid_: Public LightRAG API, tenant runtime, user runtime

**Query Eligibility**:
The server-side decision that a domain/source can be retrieved because lifecycle, indexing, deletion, and authorization checks all pass.
_Avoid_: Ready flag when more than indexing readiness is meant

**Conversation**:
A user-owned chat history container whose turns may each select a Knowledge Domain.
_Avoid_: Session, thread when ownership is unclear, team chat

**Turn**:
One user question and resulting grounded response attempt against exactly one Knowledge Domain.
_Avoid_: Message when the domain/retrieval boundary matters

**Redaction**:
Removal of derived answer and citation content from chat history after a source or domain hard delete, while preserving the user's original question.
_Avoid_: Soft delete, hide citation, archive

**Administrator**:
A user role allowed to manage domains, source documents, runtime settings, operations, and diagnostics.
_Avoid_: Operator when referring to in-app permissions

**Member**:
A standard authenticated user who can query available domains and manage only their own conversations.
_Avoid_: Viewer when write ownership of conversations matters

## Relationships

- A **Knowledge Domain** has zero or more **Source Documents**.
- A **Source Document** belongs to exactly one **Knowledge Domain**.
- A **Source Document** produces one **Canonical Source** for downstream handoff.
- A **Canonical Source** contains one or more **Source Blocks**.
- **Evidence** maps to one or more **Source Blocks** and never to raw LightRAG output alone.
- A **Citation** belongs to one answer and points back to **Evidence**.
- A **Conversation** belongs to exactly one **Member** or **Administrator** as owner.
- A **Turn** belongs to exactly one **Conversation** and records exactly one **Knowledge Domain**.
- A **LightRAG Runtime** belongs to exactly one **Knowledge Domain**.
- **Redaction** applies to **Turns** when cited sources or selected domains are deleted.

## Example dialogue

> **Dev:** "Can the chat answer a general question if the selected **Knowledge Domain** has no matching **Evidence**?"
> **Domain expert:** "No. Pilot chat is RAG-only. The **Turn** should report no grounded context or evidence-only fallback, not use general model knowledge."

> **Dev:** "If an admin deletes a **Source Document**, do we just hide its **Citation**?"
> **Domain expert:** "No. **Redaction** removes the derived answer and citations from any **Turn** that cited that source, while keeping the user's original question."

## Flagged ambiguities

- "Domain" means **Knowledge Domain**, not tenant, user workspace, or deployment environment.
- "Document" means **Source Document** when discussing product behavior; parser-native files and derived artifacts should use more precise names.
- "Parser profile" is not a pilot concept; the pilot stores frozen `parser_kind` and resolves current credentials privately.
- "Chat" means domain-scoped grounded chat for the pilot; general/domainless chat is deferred.
- "Hard delete" means retrieval is blocked and derived chat content is redacted, not merely that current source storage is removed.
