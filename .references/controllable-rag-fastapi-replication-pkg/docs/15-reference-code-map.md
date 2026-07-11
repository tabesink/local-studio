# 15 — Reference Code Map

Use upstream only as behavior reference. Copy no whole module without first splitting its responsibilities.

| Desired behavior | Upstream function / file | Target module |
|---|---|---|
| Load retrievers | `create_retrievers()` | `modules/retrieval/lightrag_adapter.py` |
| Retrieve facts | `retrieve_chunks_context_per_question()` | `RetrievalPort.retrieve(..., intent="fact")` |
| Retrieve overview | `retrieve_summaries_context_per_question()` | `RetrievalPort.retrieve(..., intent="overview")` |
| Retrieve exact excerpts | `retrieve_book_quotes_context_per_question()` | `RetrievalPort.retrieve(..., intent="verbatim")` |
| Filter evidence | `keep_only_relevant_content()` | `EvidenceDistiller` |
| Verify filtered evidence | `is_distilled_content_grounded_on_content()` | `EvidenceVerifier` |
| Plan | `create_plan_chain()` / `plan_step()` | `PlannerPort` |
| Normalize plan | `create_break_down_plan_chain()` | `PlanValidator` |
| Route a task | `create_task_handler_chain()` | `OperationRouter` |
| Replan | `create_replanner_chain()` | `Replanner` |
| Answerability gate | `create_can_be_answered_already_chain()` | `AnswerabilityChecker` |
| Answer and verify | `create_qualitative_answer_workflow_app()` | `AnswerWriter` + `AnswerGrounder` |
| Top-level graph | `create_agent()` | `AdvancedOrchestrator` |
| Graph visualizer | `simulate_agent.py` | SSE stages in `modules/chat/events.py` |

## Upstream sources

- [Core graph and chains](https://github.com/NirDiamant/Controllable-RAG-Agent/blob/main/functions_for_pipeline.py)
- [PDF and helper utilities](https://github.com/NirDiamant/Controllable-RAG-Agent/blob/main/helper_functions.py)
- [Streamlit visualization](https://github.com/NirDiamant/Controllable-RAG-Agent/blob/main/simulate_agent.py)
- [Tutorial notebook](https://github.com/NirDiamant/Controllable-RAG-Agent/blob/main/sophisticated_rag_agent_harry_potter.ipynb)
- [Demo compose](https://github.com/NirDiamant/Controllable-RAG-Agent/blob/main/docker-compose.yml)
