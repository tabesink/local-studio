# ID-A - Smart Composer boundary (junior dev explainer)

Parent links: [ID-A.md](./ID-A.md), [F-011-P11-readiness.md](./F-011-P11-readiness.md)

**Question:** What is Smart Composer allowed to own in Context Engine?

### Decision

Smart Composer is a governed UI workflow over backend-owned Wiki Contributions. It is not an editor that writes files, calls providers, chooses prompts, chooses retrieval, or stores product truth in browser state.

```text
Browser edits fields
  -> API request
  -> FastAPI authz
  -> WikiContributionService
  -> Postgres
  -> safe DTO back to browser
```

### Why

| Bad path | Good path |
| --- | --- |
| Browser compiles final AI prompt. | Backend owns prompt construction if AI is approved. |
| Browser writes wiki page directly. | Browser submits contribution actions. |
| Browser stores durable draft truth. | Draft truth lives in `wiki_contributions`. |
| Browser passes private evidence/source ids. | Browser uses approved safe refs only. |
| Browser applies file diffs. | Publish creates immutable Wiki Revisions through API. |

Existing contracts already say the browser never talks to providers, LightRAG, Docker, storage paths, database, controller, runtime targets, or private payloads.

### Exact Flow Sketch

Manual drafting flow:

```text
open Smart Composer
  -> choose approved safe context refs
  -> create/update Wiki Contribution
  -> submit
  -> reviewer reads safe contribution DTO
  -> publish
  -> immutable Wiki Revision
  -> Wiki Page current_revision_id changes
```

AI-assisted drafting flow, only if AI-001 is patched:

```text
composer action request
  -> backend validates contribution/context/authz
  -> backend builds prompt from approved safe inputs
  -> backend calls trusted synthesis profile
  -> backend returns safe proposed text or safe failure
  -> user edits/submits contribution
```

Do not stream unless EVT-001 defines event names and terminal states.

### What You Implement (Order)

1. Implement manual contribution persistence first.
2. Add submit/review/publish state transitions.
3. Add immutable revisions.
4. Add redaction/delete behavior from DATA-001.
5. Add UI over typed DTOs.
6. Add AI assist only after AI-001 says exactly how.
7. Add streaming only after EVT-001 says exactly how.

### Red Flags In PR

- Component code imports AI/provider clients or prompt builders.
- Component code stores provider, model, retrieval, runtime, storage, or Docker target detail.
- Smart Composer sends raw conversation text, raw source text, raw prompt text, or raw API/SSE payload caches.
- Draft state exists only in local browser storage after a save.
- Publish endpoint accepts final page id plus arbitrary browser state without loading the contribution.
- UI hides admin controls but backend route has no 403 test.

### Tests

- Frontend import audit proves P11 UI imports only typed Context Engine API wrappers.
- Browser storage audit proves no token, prompt, question, answer, source text, evidence excerpt, provider value, or draft truth is stored outside the approved allowlist.
- Backend route test proves contribution create/update/submit/publish flows with HttpOnly session auth.
- Authz tests prove role boundaries.
- Safety tests prove safe DTOs omit private source/block ids and private runtime/provider details.

### One-line summary

Smart Composer is a frontend workflow for backend-owned Wiki Contributions, not a browser-owned provider/editor/runtime.
