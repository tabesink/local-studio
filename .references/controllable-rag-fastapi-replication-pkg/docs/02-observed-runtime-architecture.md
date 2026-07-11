# 02 — Observed Runtime Architecture

## Runtime components

```text
                 ┌──────────────────────────────┐
                 │ Streamlit / PyVis visualizer │
                 │  simulate_agent.py           │
                 └──────────────┬───────────────┘
                                │ streams graph state
                                ▼
┌────────────────────────────────────────────────────────────────┐
│ LangGraph `create_agent()`                                     │
│                                                                │
│ anonymize → plan → de-anonymize → refine plan → task handler  │
│                 ▲                              │               │
│                 │                         tool branch          │
│                 │                  ┌───────┼────────┐          │
│                 │                  ▼       ▼        ▼          │
│                 │               chunks  summaries  quotes      │
│                 │                  └───────┼────────┘          │
│                 │                          ▼                   │
│                 └──── answerability ← replan ← answer          │
│                                           │                      │
│                                      final answer                │
└──────────────────────────┬─────────────────────────────────────┘
                           │
                           ▼
       ┌───────────────────────────────────────────────────┐
       │ FAISS stores + OpenAI embeddings                    │
       │ chunks | chapter summaries | extracted quotes       │
       └───────────────────────────────────────────────────┘
```

## What the graph is doing

**OBSERVED:**

1. Replaces named entities in the question with variables.
2. Plans using the anonymized question.
3. Restores original named entities in the plan.
4. Refines each plan step into one of four allowed operations: retrieve chunks, retrieve summaries, retrieve quotes, or answer from accumulated context.
5. LLM task handler chooses one operation for the next step.
6. Retrieval passes through a separate “keep only relevant content” and grounding loop.
7. After each operation, the agent replans and asks whether the original question is answerable from accumulated context.
8. It creates and grounds a final answer only after the answerability gate accepts the context.

**OBSERVED source:** [`create_agent()` and helper nodes](https://github.com/NirDiamant/Controllable-RAG-Agent/blob/main/functions_for_pipeline.py)

## Important state fields

```text
question                 original user question
anonymized_question      entity-neutral planning question
mapping                  variable → original entity map
plan                     remaining executable tasks
past_steps               attempted tasks
query_to_retrieve_or_answer
curr_context             task-local answer context
aggregated_context       untyped concatenated evidence/intermediate answers
tool                     selected operation
response                 final graph result
curr_state               visualization stage label
```

**INFERRED:** `curr_state` is display-only. The Streamlit app uses it to highlight nodes and display plan/past steps/context; it is not a durable execution protocol.
