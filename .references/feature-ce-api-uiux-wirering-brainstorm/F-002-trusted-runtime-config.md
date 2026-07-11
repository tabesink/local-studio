# F-002 — Trusted Runtime Config

**Phase P2 · Admin API · UI slices 07–08**

## Outcome

Admin configures providers, model profiles, parser — secrets stay server-side.

## API Surface

| Method | Route | Purpose |
| --- | --- | --- |
| GET | `/admin/runtime-settings` | safe status snapshot |
| PUT | `/admin/runtime-settings/providers/{kind}` | rotate credential |
| POST/PATCH/DELETE | `/admin/runtime-settings/model-profiles/*` | CRUD profiles |
| PATCH | `/admin/runtime-settings` | active synthesis + parser kind |

Providers: `openai`, `bedrock`, `ollama`, `reducto` (parser-only for reducto).

## DTO Rule

```text
Safe response:  isConfigured, profile metadata, isDefault
Never expose:   credential, ciphertext, base_url, paths
```

## UI Wiring

```text
Settings dialog
├── Model & Provider  (slice 07)  ← SettingsLayout + SettingsRow
└── Document Parser   (slice 08)  ← parser kind select + status
```

| Control | LS pattern |
| --- | --- |
| Provider rows | `ui/settings.tsx` → `SettingsRow` |
| Secret input | masked/password field; submit rotates server-side |
| Profile table | `ui/table.tsx` dense rows, mono model names |
| Active parser | `ui/select.tsx` or segmented control |

## States

| Provider | UI shows |
| --- | --- |
| not configured | neutral pill + "Configure" |
| configured | good pill; no secret value |
| embedding in use | disabled edit on locked profile |

## Never

- render credential in UI after save
- test-connection button (out of scope P2)
- client-side provider validation network calls

## Spec

`specs/04-features/F-002-trusted-runtime-config/spec.md`
