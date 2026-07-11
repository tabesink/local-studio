---
id: PRD-002
title: Target domain model
status: proposed
owner: Context Engine team
last_reviewed: 2026-07-02
depends_on: []
supersedes: []
---
# Target domain model

```text
User
  owns Conversations
Conversation
  owns ordered Turns
Turn
  records one current-turn Domain and zero or more Evidence items
Domain
  owns Sources and retrieval eligibility
Source
  has document/index lifecycle and evidence locators
PromptTemplate
  belongs to a permitted scope (initially user or global admin-managed; choose one)
```

## Required rules

- A turn’s selected `domain_id` scopes retrieval for that turn only.
- Past turns may provide bounded conversational context but may not broaden retrieval into their former domains.
- Evidence is generated and authorized by the server, never fabricated by the browser.
- Source/domain deletion follows the redaction policy in `03-contracts/data/conversation-history-v1.md`.
