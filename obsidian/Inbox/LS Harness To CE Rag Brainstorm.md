---
type: inbox
status: draft
audience:
  - agent
  - junior-dev
tags:
  - type/inbox
  - status/draft
  - layer/rag
  - layer/agent
  - source/local-studio
---

# LS Harness To CE Rag Brainstorm

Scratch capture of ideation: borrow Local Studio’s modular agent-harness + middleware shape to enhance Context Engine basic/advanced RAG — without importing Pi/coding-agent runtime.

Parent: [[Inbox Index]].

**Promote later:** move settled options to [[Ideation Index]] or Architecture; do not treat this note as ADR truth.

---

## Compare / contrast (quick)

| Axis | Local Studio | Context Engine |
| --- | --- | --- |
| Product job | Coding agent workstation | Grounded domain Q&A |
| “RAG” | Not vector RAG — skills/plugins/attachments assembled into prompt | Real RAG — LightRAG → Evidence → citations |
| Loop | Open tool loop (fs, bash, browser, MCP) | Closed ops: retrieve_* / answer / verify |
| Context inject | Composer: `$skills` `@plugins` attachments | F-012: opaque composer refs + `PromptAssemblyService` |
| Orchestration | Pi SDK harness + extensions | CE-native `TurnOrchestrator` (+ planned middleware) |
| Middleware | Extensions/plugins around the agent | Spec’d: budget, allowlist, evidence safety, verifier, citation, SSE — static, server-owned |
| Who picks tools/mode | Browser can send skills/plugins/model/cwd | Browser sends message + domain + refs only |
| Streaming | Fire-and-forget turn + SSE seq cursor | Claim turn + SSE `stage/evidence/token/done` |
| Failure | Tool errors, compact, steer/queue | `no_grounded_context`, `evidence_only`, never ungrounded fallback |

```text
LOCAL STUDIO                         CONTEXT ENGINE
─────────────                        ──────────────
Composer assemble                    PromptAssemblyService (F-012)
   │                                    │
   ▼                                    ▼
Pi harness (tool loop)               TurnOrchestrator
   │                                    │
   ├─ read_file / bash / MCP            ├─ basic: 1× retrieve → answer
   └─ LLM                               └─ advanced: plan → retrieve* → replan → cite
   │                                    │
   ▼                                    ▼
JSONL + pi SSE                       Postgres turns + EVT-001 SSE
```

**Instinct:** LS has extra *layers* worth stealing. Wrong move = copy Pi/tools/cwd. Right move = copy the **modular harness shape** and plug CE’s RAG as **closed tools**.

---

## What CE already has vs missing

**Already CE-shaped (LS analogue):**

- Context assembly → F-012 `PromptAssemblyService`
- Orchestrator shell → `TurnOrchestrator`
- One retrieval port → P6 `RetrievalPort`
- Spec’d middleware list (mostly not fully extracted as attachable modules yet)
- Basic RAG live; advanced loop designed

**LS layers CE may want selectively:**

1. Explicit **tool registry** (named, attachable ops)
2. **Harness policy** that swaps basic vs advanced without rewriting the orchestrator
3. **Extension/middleware slots** as first-class modules (today: inline in `chat_turns.py`)
4. Compaction / steer / follow-up (coding-agent UX — mostly out of CE product scope)
5. Seq-cursor reconnect SSE (CE has replay-from-DB instead)

**Hard CE guardrails (do not break):**

- Middleware is **not** a browser plugin system
- No LangChain/LangGraph
- No open tools (fs/bash/web)
- Browser never selects retrieval mode/tools

---

## Ranked ideas (survivors)

### 1. Attachable RAG Tool Pack on CE harness (strongest)

Make `basic_rag` and `advanced_rag` **server-registered tools** the harness can call — not browser-picked.

```text
TurnHarness
  ├── middleware[]   (static: budget, allowlist, evidence_safety, verifier, cite, sse)
  ├── tools[]        (static: basic_rag, advanced_rag, answer_from_evidence, …)
  └── policy.rag_mode → which tool pack is enabled
```

- `basic_rag` tool = today’s single-hop retrieve→synthesize
- `advanced_rag` tool = plan/replan loop calling the same `RetrievalPort` with `fact|overview|verbatim`
- Intent gate still chooses `direct_llm` vs `domain_rag`; harness only runs inside `domain_rag`

### 2. Extract typed middleware chain from inline orchestrator

Extract:

`BudgetMW → AllowlistMW → EvidenceSafetyMW → VerifierMW → CitationMW → SseProjectorMW`

Same order always; unit-test each; advanced loop just runs more hops through the same chain.

### 3. Treat F-012 assembly as the “skill/plugin” layer

LS skills ≈ CE templates/refs. Don’t rebuild skill discovery from disk. Deepen F-012 as the only attachable *context* layer; keep RAG as the only attachable *knowledge* layer.

```text
LS:  skills + plugins + attachments  → prompt
CE:   template/source/wiki/evidence refs → PromptAssemblyService
      + RAG tools → Evidence
```

### 4. Policy-gated harness modes (not UI modes)

`policy.rag_mode = basic | advanced` (server config / feature flag). Same HTTP contract. Enables post-pilot advanced without browser knobs.

### 5. Safe “tool event” SSE (optional, later)

Borrow LS tool badges *visually*, but emit only safe CE stages (`retrieving`, `verifying`) — never tool names that imply fs/bash, never raw plan text.

---

## Rejected / weak

| Idea | Why reject |
| --- | --- |
| Port Pi SDK / coding-agent runtime | Wrong product; architecture review already said No |
| Browser-selected tools/middleware | Violates AI-001 / thin browser |
| Second vector store beside LightRAG | Explicitly rejected in CE design |
| LangGraph as the harness | DEC-008 forbids it for F-007 |
| Full steer/follow-up/compaction | Coding-agent UX; low value for grounded Q&A v1 |
| Expose LightRAG modes (`local/global/mix`) as tools | Browser/policy leak; CE owns one `naive` path today |

---

## Tentative target shape (idea #1)

```text
Browser: message + domainId + composerRefTokens
                │
                ▼
        Intent gate → direct_llm | domain_rag
                │
                ▼
        PromptAssemblyService          ← LS “composer context” analogue
                │
                ▼
        TurnHarness (modular)          ← LS “agent harness” analogue
           │
           ├─ Middleware chain (static)
           │
           └─ Tool: basic_rag  OR  advanced_rag
                    │
                    └─ RetrievalPort → P6 → LightRAG naive → Evidence
                           │
                           ▼
                    Synthesis + citation validate → EVT-001 SSE
```

**Tentative conclusion:** Steal LS’s modular harness + middleware composition + context assembly, not its coding tools. Give the harness basic_rag / advanced_rag as closed, server-owned tools.

---

## Open questions

- Promote this to Ideation and brainstorm requirements for idea #1 vs middleware-only (#2)?
- When does `policy.rag_mode=advanced` unlock relative to P7 acceptance?
- How much of LS SSE seq-cursor / steer UX is worth any CE contract change?

---

## Related

- [[Inbox Index]]
- [[Pi SDK Coding Agent Runtime]]
- [[Architecture Index]]
- [[Context Engine Index]]

## Repo sources

- `specs/03-contracts/ai/grounded-answering.md`
- `specs/02-architecture/component-boundaries.md`
- `specs/00-governance/decision-log.md` (DEC-008, DEC-009)
- `.devnotes/local-studio-templates/local-studio-context-pipline.md`
- `.devnotes/01-agent-workspace-LS-wiring-map.md`
- `.devnotes/features/advanced_rag_pipeline/README.md`
- `.references/review/local-studio/01-architecture-review.md`
- `context_engine/services/chat_turns.py`
