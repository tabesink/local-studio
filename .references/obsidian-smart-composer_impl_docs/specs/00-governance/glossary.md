---
id: GOV-003
title: Glossary
status: approved
owner: Context Engine team
last_reviewed: 2026-07-02
depends_on: []
supersedes: []
---
# Glossary

| Term | Meaning |
|---|---|
| Source reference | Smart Composer code at the pinned commit; not target authority. |
| Domain | Context Engine retrieval and source lifecycle boundary. |
| Current-turn domain | The only domain permitted to inform a particular answer. |
| Evidence | Server-authorized source/chunk reference returned for an answer. |
| Mention / context token | A selected source, evidence fragment, or UI context item displayed by the composer. It is not raw prompt assembly in the browser. |
| Turn | One user question plus its server-generated answer/evidence/result. |
| Conversation | User-owned ordered set of turns; a conversation may cross domains one turn at a time. |
| Proposed contract | Exact intended HTTP/SSE schema pending Context Engine owner approval. |
| Change proposal | A reviewable diff generated for a source body; never direct filesystem write. |
