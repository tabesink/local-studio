The following folders contain the reviews on reference codebases: the old context engine and original local-studio codebase. These are two different codebases, and the overall goal is to have junior dev and coding agents carryout a greenfield re-build of context engine while preserving the product identity (DNA of context engine) while heavily adopting uiux and design patterns (i.e, chat)    

.references/context_engine_frontend_review
.references/local_studio_frontend_review

The following folders container preliminary phase-by-phase implementation plans to achieve the goal/purpose:
    
    Clean greenfield implementation of Context Engine.

The implementation plans are intentionally high level. Each phase is a self-contained vertical slice with a clear outcome and test gate. Detailed architecture, APIs, schemas, storage layouts, and implementation tasks belong in separate phase leaf documents. 

    .references/context_engine_greenfield_refactor_plan/development-scafold.md   (Consider this to a the ground truth, the doc captuing the essence of the new context-engine rebuild direction)

    .references/context_engine_greenfield_refactor_plan/p1-trusted-application-foundation.md
    .references/context_engine_greenfield_refactor_plan/p2-admin-configs-runtime-settings.md
    .references/context_engine_greenfield_refactor_plan/p3-knowledge-domains-runtime-lifecycle.md
    .references/context_engine_greenfield_refactor_plan/p4-source-documents-canonical-preparation.md
    .references/context_engine_greenfield_refactor_plan/p5-lightRAG-indexing-query-eligibility.md
    .references/context_engine_greenfield_refactor_plan/p6-evidence-retrieval-source-navigation.md
    .references/context_engine_greenfield_refactor_plan/p7-query-routing-chat.md
    .references/context_engine_greenfield_refactor_plan/p8-observability.md


This scaffold is governed by the Context Engine ground truth, refere to:

    .references/context_engine_frontend_review
    .references/code/server  (old context-engine backend code)
    

Reference architectures may inform implementation patterns, but cannot change the product boundary, ownership model, or operating constraints.

    .references/code/lightrag  (provided is the external lightrag library WHICH we intend to copy into the server wholesale AND if required make minimal surgical modification)
    .references/frontend-api-reverse-engineering-review.md  (use this review to understand how the reference local-studio frontend features can be wired via an api layer - this api layer will be the same layer that facilitates context engine backend to frontend wiring)

Eensure tension between the implementation plans are resolved (step through design decisions with me); THEN run ALSO evaluate and refine these phase implementation plans as needed according through the following lenses: 

    .references/api-load-testing-security-launch-rediness-review.md
    .references/ce-systems-slices-review.md
    
YOUR OBJECTIVE: First reconcile tensions in the phase implemenation documentations to deliver clear alignment between the phases. Then refine the phase implemenations following review and development direction improvements based on systems slices and launch rediness reviews.  

NOTE: ultimately the fastapi context-engine server phase by phase implementation that is defiend in p1-p8 documentation is wired to the frontend (which we are building in parrallel); the aspects of the frontend that will be built is captured in these references. SEE EXTRA CONTEXT below (if needed): 

    .references/context_engine_frontend_review/slices/01_runtime_foundation.md
    .references/context_engine_frontend_review/slices/02_login_cookie_session.md
    .references/context_engine_frontend_review/slices/03_app_shell_role_nav_empty_settings.md
    .references/context_engine_frontend_review/slices/04_settings_general.md
    .references/context_engine_frontend_review/slices/05_settings_users.md
    .references/context_engine_frontend_review/slices/06_settings_domains.md
    .references/context_engine_frontend_review/slices/07_settings_model_provider.md
    .references/context_engine_frontend_review/slices/08_settings_document_parser.md
    .references/context_engine_frontend_review/slices/09_documents_library.md
    .references/context_engine_frontend_review/slices/10_document_upload_operations.md
    .references/context_engine_frontend_review/slices/11_chat_route_shell.md
    .references/context_engine_frontend_review/slices/12_chat_sse_evidence.md
    .references/context_engine_frontend_review/slices/13_knowledge_graph_workspace.md
    .references/context_engine_frontend_review/slices/14_lightrag_domain_lifecycle.md
    .references/context_engine_frontend_review/slices/15_operations_recovery.md
    .references/context_engine_frontend_review/slices/16_workspace_context_source_nav.md
    .references/context_engine_frontend_review/slices/17_audit_diagnostics.md   