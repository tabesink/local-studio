---
id: DATA-CONV-001
title: Conversation persistence and redaction v1
status: proposed
owner: Context Engine team
last_reviewed: 2026-07-02
depends_on: []
supersedes: []
---
# Conversation persistence and redaction v1

## Proposed persistence

```sql
conversations (
  id uuid primary key,
  owner_user_id uuid not null,
  title text not null,
  created_at timestamptz not null,
  updated_at timestamptz not null
);

conversation_turns (
  id uuid primary key,
  conversation_id uuid not null references conversations(id),
  ordinal integer not null,
  domain_id uuid not null,
  request_id uuid not null,
  question text not null,
  answer text nullable,
  status text not null,
  model_profile_id text nullable,
  citations_json jsonb not null default '[]',
  cited_source_ids uuid[] not null default '{{}}',
  created_at timestamptz not null,
  completed_at timestamptz nullable
);

create unique index one_running_turn_per_conversation
on conversation_turns (conversation_id)
where status = 'running';
```

## State

```text
created → running → completed
                 ↘ failed
                 ↘ cancelled
```

## Deletion/redaction target decision

- Source deleted: block future retrieval immediately; mark affected answer/evidence content redacted while preserving the original user question and safe audit linkage.
- Domain deleted: redact all affected turns; the conversation remains but deleted-domain turns cannot be resumed or queried.
- The exact retention period and whether answers are physically purged require product/privacy approval before production.

No client-only deletion can satisfy this policy.
