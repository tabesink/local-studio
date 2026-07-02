# LangGraph / LangChain Agent Wiring — Links for Coding Agents

**Purpose:** quick reference when wiring `create_react_agent` / `create_agent` patterns into CE chat orchestration.  
**CE constraint:** pilot is RAG-only (AI-001). Domain retrieval = P6 callable as a **closed tool set** — not open web search unless product explicitly approves.

---

## Start Here (docs index)

| Resource | URL | Use |
| --- | --- | --- |
| LangChain docs index | https://docs.langchain.com/llms.txt | discover all pages |
| LangGraph Python docs | https://docs.langchain.com/oss/python/langgraph/ | graphs, streaming, state |
| LangChain Python docs | https://docs.langchain.com/oss/python/langchain/ | agents, tools, middleware |

**Context7 library IDs** (for MCP `query-docs`):

```text
/langchain-ai/langgraph
/websites/langchain_oss_python_langgraph
/websites/reference_langchain_python_langgraph
```

---

## API Reality Check (2026)

```text
OLD (deprecated)     create_react_agent   from langgraph.prebuilt
CURRENT (use this)   create_agent         from langchain.agents
```

`create_react_agent` still documented for migration context only. New CE code should target `create_agent`.

| Topic | Link |
| --- | --- |
| `create_agent` reference | https://reference.langchain.com/python/langchain/agents/create_agent |
| LangGraph v1 migration (`create_react_agent` → `create_agent`) | https://docs.langchain.com/oss/python/migrate/langgraph-v1 |
| LangGraph v1 release notes | https://docs.langchain.com/oss/python/releases/langgraph-v1 |
| LangChain v1 release notes | https://docs.langchain.com/oss/python/releases/langchain-v1 |
| Deprecated `create_react_agent` API ref | https://reference.langchain.com/python/langgraph.prebuilt/chat_agent_executor/create_react_agent |
| Sample repo (create_agent pattern) | https://github.com/langchain-samples/assistants-demo |

---

## create_agent — Minimal Wiring

```python
from langchain.agents import create_agent
from langchain.tools import tool

@tool
def retrieve_overview(domain_id: str, query: str) -> str:
    """Retrieve grounded evidence from the selected Knowledge Domain."""
    # Call CE RetrievalPort / F-006 callable — NOT raw LightRAG from here
    ...

agent = create_agent(
    model="openai:gpt-4.1-mini",          # server-resolved via F-002 in CE
    tools=[retrieve_overview],            # closed enum — see README policy
    system_prompt="Answer only from retrieved evidence.",
)
```

| Topic | Link |
| --- | --- |
| Agents overview | https://docs.langchain.com/oss/python/langchain/agents |
| Tools | https://docs.langchain.com/oss/python/langchain/tools |
| `@tool` decorator | https://docs.langchain.com/oss/python/langchain/tools/#create-tools |

---

## Middleware (budgets, guardrails, HITL)

Use middleware instead of forking `create_agent` when you need hooks.

| Topic | Link |
| --- | --- |
| Middleware overview | https://docs.langchain.com/oss/python/langchain/middleware/overview |
| Custom middleware | https://docs.langchain.com/oss/python/langchain/middleware/custom |
| Blog: middleware harness | https://www.langchain.com/blog/how-middleware-lets-you-customize-your-agent-harness |

**CE mapping:**

```text
wrap_tool_call     → enforce RetrievalPort-only, domain authz, budget counters
before_model       → inject bounded transcript excerpt (prior user Q only)
after_model        → citation / grounding check before streaming to browser
PIIMiddleware      → redact secrets before model (QA-002 alignment)
```

---

## StateGraph — Custom Orchestrator (controllable RAG shape)

When `create_agent` is too generic, build explicit graph nodes (matches reference pkg control flow).

| Topic | Link |
| --- | --- |
| LangGraph quickstart (StateGraph + tool loop) | https://docs.langchain.com/oss/python/langgraph/quickstart |
| Graph API overview | https://docs.langchain.com/oss/python/langgraph/graph-api |
| Functional API (`@entrypoint` while-loop) | https://docs.langchain.com/oss/python/langgraph/quickstart#functional-api |
| Conditional edges | https://docs.langchain.com/oss/python/langgraph/graph-api#conditional-edges |
| `Command` from tools (update state + route) | https://docs.langchain.com/oss/python/langgraph/graph-api#return-from-tools |

```text
CE advanced mode nodes (conceptual):
  plan → route → retrieve_tool → verify → replan? → final_answer
```

**Integration plan default:** plain Python `while` loop in `orchestrator.py` first (see `01-orchestrator-sequence.md`). Adopt StateGraph only if you need checkpointing / HITL interrupts.

---

## Streaming → CE SSE (EVT-001)

Agent streams must be **projected** to safe product events — never raw LangGraph debug to browser.

| Topic | Link |
| --- | --- |
| LangGraph streaming | https://docs.langchain.com/oss/python/langgraph/streaming |
| LangChain agent streaming | https://docs.langchain.com/oss/python/langchain/streaming |
| `get_stream_writer` (custom progress) | https://reference.langchain.com/python/langgraph/config/get_stream_writer |

```text
LangGraph stream_mode          CE SSE (EVT-001)
─────────────────────          ─────────────────
messages (tokens)         →    event: token
custom (stage/progress)   →    event: stage (optional patch) OR server log only
tool results / updates    →    event: evidence (mapped Evidence DTO)
terminal                  →    event: done | error
```

Use `stream_mode=["updates", "messages", "custom"]` server-side; map in `chat/events.py`.

---

## Web Search Tools (reference only — NOT pilot default)

Open web search conflicts with CE pilot RAG-only guardrail (AI-001) unless explicitly approved.

| Topic | Link |
| --- | --- |
| Tavily provider | https://docs.langchain.com/oss/python/integrations/providers/tavily |
| TavilySearch tool | https://docs.langchain.com/oss/python/integrations/tools/tavily_search |
| TavilyExtract tool | https://docs.langchain.com/oss/python/integrations/tools/tavily_extract |
| TavilyCrawl tool | https://docs.langchain.com/oss/python/integrations/tools/tavily_crawl |
| Tavily API docs | https://docs.tavily.com/documentation/api-reference/endpoint/search |

```python
# Reference pattern only — do NOT wire into CE pilot without spec change
from langchain_tavily import TavilySearch
from langchain.agents import create_agent

search = TavilySearch(max_results=5)
agent = create_agent(model, [search])
```

**If ever approved:** web search would be a separate tool alongside domain `RetrievalPort` tools, with server policy gating and no browser key exposure.

---

## Packages (Python)

```bash
pip install langgraph langchain langchain-openai
# web search (optional, not CE pilot):
pip install langchain-tavily
```

| Package | Docs |
| --- | --- |
| `langgraph` | https://pypi.org/project/langgraph/ |
| `langchain` | https://pypi.org/project/langchain/ |
| `langchain-openai` | https://docs.langchain.com/oss/python/integrations/chat/openai |
| `langchain-tavily` | https://docs.langchain.com/oss/python/integrations/providers/tavily |

---

## CE Wiring Cheat Sheet

```text
┌─────────────────────────────────────────────────────────────┐
│  ChatTurnService (FastAPI)                                   │
│    └─ chooses: plain orchestrator | create_agent | StateGraph│
└───────────────────────────┬─────────────────────────────────┘
                            │
         tools (closed set) │
                            ▼
              ┌─────────────────────────┐
              │ retrieve_fact           │
              │ retrieve_overview       │──► RetrievalPort ──► F-006 callable
              │ retrieve_verbatim       │
              │ answer_from_evidence    │──► synthesis gateway (F-002)
              └─────────────────────────┘

FORBIDDEN tools in pilot:
  ✗ tavily / open web
  ✗ direct LightRAG client
  ✗ browser-supplied domain override mid-loop
```

**Recommended path for CE:**

1. **Pilot (F-007):** plain `orchestrator.py` loop — no LangGraph dependency required.
2. **Advanced mode eval:** try `create_agent` with RetrievalPort tools + middleware budgets.
3. **Only if needed:** custom `StateGraph` for HITL / checkpoint resume (post-pilot).

---

## Related CE Docs

- `README.md` — integration plan + rejected additions
- `01-orchestrator-sequence.md` — direct vs advanced sequences
- `02-chat-shell-wiring.md` — SSE → UI mapping
- `.references/controllable-rag-fastapi-replication-pkg/docs/04-query-control-graph.md`
- `specs/03-contracts/ai/grounded-answering.md` — RAG-only guardrails
