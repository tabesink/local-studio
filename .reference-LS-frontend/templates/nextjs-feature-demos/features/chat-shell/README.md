# Chat Shell Demo Slice

Carbon copy of the chat pane: h-10 header with session title, git branch, and model; block-based timeline (user pills right-aligned, assistant text / italic thinking / bordered tool blocks left-aligned at thread width); the lifted charcoal composer on composer tokens (`--composer-radius: 18px`, `--composer-shadow`, `--composer-w` max width) with attach / queue / model picker / round send controls; the mono `cwd | git | tokens` status bar; and an error banner with Retry.

Source guide: `docs/feature-parity/features/chat-shell.md`.

## Reference copy map

| This slice | Reference (`.references/local-studio/frontend/src`) |
| --- | --- |
| pane header + error banner | `features/chat/chat-pane.tsx` |
| timeline blocks | `features/chat/timeline.tsx` |
| composer frame + footer | `features/chat/agent-composer-frame.tsx` |
| composer geometry tokens | `--composer-*` in `app/styles/globals/tokens.css` |

Streaming is simulated by `subscribeMockRuntimeEvents` in `api/`; no SSE backend.
