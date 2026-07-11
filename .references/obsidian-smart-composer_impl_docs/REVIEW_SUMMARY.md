# Review Summary

## Verdict

**Conditional adaptation go.** Smart Composer has a valuable compositional feature set for Context Engine: contextual chat, source selection, stream cancellation, evidence presentation, history, prompt templates, and response metadata. Its runtime architecture is fundamentally different from the intended shared, authenticated Context Engine application, so copying the plugin as an implementation base would be unsafe and overly coupled.

## Keep as reference

- Chat workspace interaction patterns.
- Composer and context-token UX.
- Cancellation and partial answer rendering.
- Citation/evidence layout patterns.
- Conversation list/history UX.
- Templates and model-result metadata display.
- Diff review visual ideas only after target editable-document decisions exist.

## Replace

- Plugin lifecycle and Obsidian views → Next.js App Router.
- Local history/PGlite/JSON/vector persistence → FastAPI/PostgreSQL.
- Local vault/RAG/prompt compilation → Context Engine domain retrieval/orchestration.
- Direct provider clients → server provider runtime.
- Local status/index commands → admin source/operation status API.

## Exclude

- MCP, arbitrary tool execution, subscription OAuth, browser provider credentials, local model configuration, vault scanning, direct file writes, and second RAG stack.

## Highest-risk blockers before feature work

1. Confirm and approve the Context Engine session/domain/chat/openAPI contracts.
2. Approve user-owned conversation persistence and source/domain redaction semantics.
3. Keep Smart Composer provider/OAuth/secret material out of all target paths.
4. Decide whether Context Engine ever supports editable sources before building Apply-like UI.
5. Run a visual/runtime source capture before claiming UI parity.

## Review limitations

Static source was inspected at the pinned commit. The plugin was not run in an Obsidian desktop host during this review. Treat keyboard, drag/drop, rendering, CSS, and provider/tool edge cases as runtime-verification items.
