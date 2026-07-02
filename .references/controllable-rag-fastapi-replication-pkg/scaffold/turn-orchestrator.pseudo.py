"""Pseudocode only — copy the shape, not this file verbatim."""

async def run_advanced_turn(state: TurnState) -> AsyncIterator[TurnProgress | TurnOutcome]:
    yield stage("planning")
    state.plan = await planner.create_executable_plan(state.question)
    validate_plan(state.plan, policy)

    for step_no, step in enumerate(state.plan, start=1):
        if state.budget.exhausted():
            return insufficiency("turn_budget_exhausted", state)

        operation = await router.choose(
            step=step,
            original_question=state.question,
            vetted_evidence=state.evidence,
            allowed_operations=policy.allowed_operations,
        )
        validate_operation(operation)

        if operation.kind in {"fact", "overview", "verbatim"}:
            yield stage("retrieving")
            raw = await retrieval.retrieve(
                domain_id=state.domain_id,
                query=operation.query,
                intent=operation.kind,
                policy=policy.retrieval,
            )
            bundle = evidence.prepare(raw, token_limit=state.budget.evidence_tokens_left)
            vetted = await verifier.distill_and_verify_once(operation.query, bundle)
            state.add_evidence(vetted)
            yield evidence_ready(vetted.safe_citations())
        else:
            # Intermediate answers are non-authoritative until final citation validation.
            state.add_derived_fact(await answer_writer.answer_from_vetted_evidence(step, state.evidence))

        yield stage("verifying")
        if await answerability_checker.is_answerable(state.question, state.evidence, state.derived_facts):
            break
        state.plan = await replanner.remaining_steps(state)

    yield stage("answering")
    answer = await answer_writer.final_answer(state.question, state.evidence, state.derived_facts)
    citation_validator.require_supported_claims(answer, state.evidence)

    verdict = await answer_grounder.verify_once(answer, state.evidence)
    if not verdict.accepted:
        answer = await answer_writer.repair_once(answer, state.evidence)
        citation_validator.require_supported_claims(answer, state.evidence)

    return completed(answer, state.evidence, state.safe_trace())
