# 03 — Observed Ingestion and Indexes

## Upstream tutorial pipeline

```text
PDF
 │ `PyPDF2` extraction
 ▼
chapter regex split
 ├── chapter documents
 │    └── LLM summaries → summary FAISS store
 ├── text chunks       → chunk FAISS store
 └── quoted spans      → quote FAISS store
```

**OBSERVED:** `helper_functions.py` splits PDF text using a `CHAPTER ...` regex and extracts typographic-quote spans. The README says chapters are summarized and encoded into separate vector stores. The runtime loads the prebuilt stores rather than indexing during a chat turn.

## Why it is tutorial-specific

- Chapter regex assumes one book’s formatting.
- Quote extraction relies on curly quotes and a minimum character count.
- Three FAISS directories are local artifacts with no domain, document, user, deletion, or authorization metadata.
- The runtime enables `allow_dangerous_deserialization=True` when loading FAISS files.

## Target translation

**PROPOSED:** document ingestion belongs to the existing source-document pipeline. The advanced agent receives only typed `EvidenceRef` records from `RetrievalPort`.

```text
Admin ingest
  → parser
  → canonical source/document/section metadata
  → approved private retrieval runtime
  → evidence references returned at query time
```

**REJECTED:** do not recreate three FAISS stores merely to imitate upstream. Retain three **logical retrieval intents** only when the retrieval runtime can honor them:

| Upstream store | Target intent | Expected evidence |
|---|---|---|
| chunks | `fact` | specific supporting passages |
| summaries | `overview` | section/document scope |
| quotes | `verbatim` | exact excerpt candidates |

A target adapter may map all three intents to one domain-scoped retrieval endpoint while preserving typed evidence and server-owned policy.

**Sources:** [`helper_functions.py`](https://github.com/NirDiamant/Controllable-RAG-Agent/blob/main/helper_functions.py), [upstream README](https://github.com/NirDiamant/Controllable-RAG-Agent#how-it-works)
