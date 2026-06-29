# Coding-Agent Execution Checklist

Use this checklist for every frontend feature PR.

## Before code

```text
[ ] Identify frontend slice and backend phase.
[ ] Read authority order from README.
[ ] Record reference source path and commit SHA if copying/adapting code.
[ ] Identify exact API endpoint, DTO, role, and status values.
[ ] Mark unknowns CONTRACT CAPTURE REQUIRED.
[ ] State whether use is Safe visual adoption, Safe structural adoption, Future seam, or Scope violation.
[ ] List loading / empty / error / unauthenticated / forbidden / success states.
[ ] List explicitly deferred controls.
```

## API adapter

```text
[ ] No raw fetch in component.
[ ] Feature-local API module owns route/payload.
[ ] Uses cookie credentials through common transport.
[ ] No browser Authorization bearer token.
[ ] Maps DTO to UI view model.
[ ] Maps typed safe API errors.
[ ] Does not expose raw upstream/private fields.
[ ] Abort / cleanup defined for long request or stream.
```

## UI

```text
[ ] Uses dark semantic tokens.
[ ] Reuses a primitive only when repeated elsewhere.
[ ] Visible focus and keyboard behavior tested.
[ ] Role-gated nav/control is a convenience only.
[ ] Destructive action has explicit confirmation.
[ ] Async state stays truthful until API refresh confirms result.
[ ] No invented progress/status/retry behavior.
```

## Security

```text
[ ] No secret, token, cookie, path, runtime URL, track ID, container ID, or raw provider payload rendered.
[ ] No client-selected model/provider/parser/retrieval settings unless explicitly approved by greenfield contract.
[ ] No source/open/path capability assumed from evidence label.
[ ] No direct browser call to LightRAG/controller/storage/provider.
[ ] Safe server error only; no raw exception display.
```

## Tests

```text
[ ] Adapter DTO mapping test.
[ ] Loading / empty / error / success test.
[ ] Member/admin/anonymous behavior test if protected.
[ ] Mutation pending/conflict/refresh test where relevant.
[ ] Response-shape assertion for private-field absence where relevant.
[ ] SSE split-frame/terminal/abort test where relevant.
[ ] Keyboard/focus test for dialog/drawer/list selection.
```

## Pull request template

```md
### Slice and backend dependency
- Frontend: F__
- Backend: P__

### Contract status
- [ ] Existing contract fixture linked:
- [ ] CONTRACT CAPTURE REQUIRED (explain):

### Reference adoption
- Old CE source:
- Local Studio source:
- Classification: Safe visual / Safe structural / Future seam / Rejected behavior removed

### Security boundary
- Browser receives:
- Browser must not receive:

### State coverage
- Loading:
- Empty:
- Error:
- Forbidden:
- Success:

### Tests
- [ ] unit
- [ ] component
- [ ] API integration fixture
- [ ] E2E where required
```
