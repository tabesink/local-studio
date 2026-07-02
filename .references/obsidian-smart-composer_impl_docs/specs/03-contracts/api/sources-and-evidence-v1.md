---
id: API-EVD-001
title: Sources and evidence v1
status: proposed
owner: Context Engine team
last_reviewed: 2026-07-02
depends_on: []
supersedes: []
---
# Sources and evidence v1

## Proposed endpoints

```http
GET /api/v1/domains
GET /api/v1/domains/{domainId}/sources?query=<text>&limit=20
GET /api/v1/domains/{domainId}/sources/{sourceId}
GET /api/v1/domains/{domainId}/evidence/{referenceId}
```

## DTOs

```ts
type SourceSummary = {
  id: string
  title: string
  sourcePath?: string
  status: 'ready' | 'processing' | 'failed' | 'deleting'
}

type EvidenceItem = {
  referenceId: string
  sourceId: string
  documentTitle: string
  sourcePath?: string
  chunkId?: string
  locator?: { page?: number; heading?: string; start?: number; end?: number }
  excerpt: string
}

type Citation = { referenceId: string; ordinal: number }
```

`excerpt` is an authorized, bounded display snippet. Do not return full private documents merely to make a browser mention menu work.

## Source references

- source context/mention UX: `src/types/mentionable.ts`, `src/components/chat-view/chat-input/`
- evidence display: `src/components/chat-view/SimilaritySearchResults.tsx`
- inline citations: `src/components/chat-view/MarkdownReferenceBlock.tsx`
