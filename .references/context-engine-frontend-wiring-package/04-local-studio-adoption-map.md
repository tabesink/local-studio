# Local Studio Adoption Map

**Reference position:** Local Studio is a visual and frontend-structure reference. Its local workstation/controller/agent scope is not Context Engine scope.

| Local Studio capability / pattern | Reference evidence | Value to Context Engine | Safe current adaptation | Future-compatible seam only | Must reject | Why / decision |
|---|---|---|---|---|---|---|
| Dark root layout / typography | `frontend/src/app/layout.tsx` uses dark theme and Geist/Geist Mono | High | Adopt dark-first root token strategy and compact typography | Theme preference only after product approval | No | Visual system does not change API authority. |
| Feature-first source layout | `frontend/src/app`, `src/features`, `src/hooks`, `src/lib`, `src/ui` | High | Adopt thin route shells + feature modules + narrow shared UI folder | None | No | Matches target frontend shape. |
| Left sidebar | `frontend/src/features/shell/left-sidebar.tsx` | High | Use labeled dark desktop sidebar, responsive compact form, stable active state | User-persisted collapse later | No runtime/model controls | CE navigation is smaller and role-aware. |
| Settings screen composition | `frontend/src/features/settings/*` | High | Reuse section hierarchy, forms, status copy density, responsive sheet behavior | URL-addressable sub-section later | Provider/runtime controller settings assumptions | P2 owns trusted settings, not Local Studio controller. |
| UI primitives | `frontend/src/ui/*`: alerts, drawer, modal, form fields, list, page state, right detail panel, markdown content | High | Port/adapt primitives after semantic/a11y/dependency audit | Shared primitive library grows only with duplicate use | Blind bulk copy | Keep UI package narrow; retain accessible semantics. |
| Page states / error box | `src/ui/page-state`, `error-box` | High | Standardize loading/empty/error/forbidden surfaces | None | No | Direct fit for F01 onward. |
| Right detail panel | `src/ui/right-detail-panel` | Medium | Use as evidence metadata inspector, source admin detail, activity detail drawer | Authorized source view only after contract | Full filesystem/source browser | P6 only permits metadata now. |
| Chat composer / message presentation | local chat/workbench patterns | Medium | Borrow dark spacing, composer placement, pending/cancel affordance, message stability | Conversation UX enhancements after P7 | Agent/tool execution UI, browser search, model selector | P7 is RAG-only and server-routed. |
| Streaming visual state | local async UI patterns | Medium | Stable assistant frame; restrained streaming affordance | Animation polish later | Raw runtime/proxy stream semantics | P7 event contract controls state. |
| Resizable panes | shell/workbench interactions | Low-Medium | CSS-capable layout seam only; default stable widths | User resize persistence only after real need | Mandatory 3-pane framework | Avoid preference store / extra layout state now. |
| Command palette | navigation/search patterns if present | Low | None in pilot | Context navigation command surface after keyboard needs proven | Runtime commands / terminal commands | Avoid adding command framework without a user flow. |
| Session/history UI | local session/workspace patterns | Low-Medium | P7-owned conversation list/history only | Better history navigation after P7 proof | Shared sessions, agent sessions, workspace state | Conversations belong to one user. |
| Terminal / shell | local workstation capability | None | None | None | Yes | Direct scope violation and security risk. |
| Filesystem browser | local workstation capability | None | None | Later authorized source viewer is not filesystem browse | Yes | Browser must not see paths/storage. |
| Agent runtime / recipes / plugins | local product features | None | None | Future product decision outside pilot | Yes | Pilot is not agent system / plugin marketplace. |
| Model runtime management / controller | Local Studio controller architecture | None | None | No | Yes | CE P2/P3 private resolver/controller boundary differs completely. |
| Runtime logs / app logs panels | Local Studio logs feature | Low | Safe table/inspector visuals for P8 only | More admin diagnostics after P8 | Raw log tail / controller data | P8 caps/redacts diagnostics. |
| Markdown renderer | `src/ui/markdown-content` style pattern | Medium | Adopt only after sanitizer/security review | Rich rendering later | Raw HTML renderer | Chat answer rendering must never trust provider HTML. |
| Accessibility / focus behavior | modal/drawer/form primitives | High | Reuse focus trap, keyboard navigation, labels, error associations | Expanded keyboard shortcuts later | None | High value, low scope risk. |

## Implementation rule

Use the following classification in code review:

```text
SAFE VISUAL ADOPTION
  token, spacing, typography, layout, primitive semantics.

SAFE STRUCTURAL ADOPTION
  feature folder, shallow routes, local hook/controller, mapped view models.

FUTURE SEAM
  component boundary exists but no behavior is enabled until an API contract exists.

SCOPE VIOLATION
  behavior changes product boundary, browser authority, runtime ownership, or data exposure.
```

## Local Studio copy discipline

Before lifting a component:

1. Pin the Local Studio commit SHA.
2. Record source path and license/provenance check.
3. Remove imports tied to controller, agent, terminal, filesystem, local model lifecycle, or server proxy behavior.
4. Replace API calls with feature-local Context Engine adapters.
5. Re-test keyboard/focus behavior in CE shell.
6. Confirm no new browser authority or data exposure appears.
