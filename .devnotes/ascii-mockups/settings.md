# Settings

Status: implementation handoff draft.

## Purpose

Global settings dialog split by ownership: personal, users, domains, providers, parser. Secrets stay server-side.

## Specs

- `specs/04-features/F-001-trusted-application-foundation/spec.md`
- `specs/04-features/F-002-trusted-runtime-config/spec.md`
- `specs/04-features/F-003-knowledge-domains-runtime/spec.md`
- `specs/04-features/F-004-source-documents-preparation/spec.md`
- `specs/04-features/F-009-frontend-delivery/frontend-slice-map.md` slices 04-08
- `specs/03-contracts/api/context-engine-v1.md`
- `DESIGN.md`

## Reference Targets

- `.references/ce-local-studio/webui/src/features/settings/SettingsDialog.tsx`
- `.references/feature-ce-api-uiux-wirering-brainstorm/F-002-trusted-runtime-config.md`
- `.references/feature-ce-api-uiux-wirering-brainstorm/F-003-knowledge-domains-runtime.md`
- `.references/code/local-studio-codebase/frontend/src/ui/settings.tsx`
- `.references/code/local-studio-codebase/frontend/src/ui/status.tsx`

## Wiring Pack Notes

```text
slice 04 -> general preferences
slice 05 -> users
slice 06 -> domains
slice 07 -> model/provider masked secret rows
slice 08 -> parser settings
slice 14 -> domain lifecycle confirm modal
```

## ASCII Mockup

```text
SettingsDialog
+----------------------+------------------------------------------------------+
| Settings             | Providers                                            |
| general              | status: refreshed 12:04                              |
| users*               |------------------------------------------------------|
| domains*             | Runtime provider rows                                |
| providers*        >  | OpenAI        configured      [Rotate secret]        |
| parser*              | Bedrock       not configured  [Rotate secret]        |
| reserved: nodes x    | Ollama        local/no secret [View]                 |
|                      | Reducto       configured      [Rotate secret]        |
|                      |------------------------------------------------------|
|                      | Active synthesis profile                             |
|                      | [select profile.........................] [Save]     |
+----------------------+------------------------------------------------------+

Domain settings section:
+-------------------------------------------------------------+
| Domains                                      [+ Create]      |
| running  fatigue-analysis     emb: openai-embedding-default |
| stopped  field-manuals        emb: openai-embedding-default |
| deleting old-domain           delete queued                 |
+-------------------------------------------------------------+
```

`*` admin-only. Members see personal settings only.

## Wiring

| Section | API |
| --- | --- |
| General | local UI preferences only unless a contract adds persistence |
| Users | `GET /api/v1/admin/users` |
| Providers/model profiles/parser | `GET /api/v1/admin/runtime-settings`, P2 mutation routes |
| Domains | `GET /api/v1/admin/domains`, lifecycle routes |
| Parser active kind | `PATCH /api/v1/admin/runtime-settings` |

Provider credential rotation:

```text
PUT /api/v1/admin/runtime-settings/providers/{provider_kind}
body: { credential }
response: providerKind + isConfigured only
```

Domain lifecycle:

```text
GET /api/v1/admin/domains/{domain_id}/status for active operations
POST start/stop complete synchronously
DELETE returns queued delete operation
available is computed by backend and never stored in UI
```

## Parity Rules

- Use `SettingsLayout`, `SettingsGroup`, `SettingsRow`, `SettingsFactRows`, `SettingsButton`.
- Values like model ids, profile ids, domain slugs, timestamps use Mono.
- Provider status uses `StatusPill`; secret rows show configured/not configured, never secret text.
- Admin/member gating is visible in UI but backend remains authority.
- Keep dialog compact; no full settings route unless optional compat route is explicitly chosen.

## Do Not Wire

- No credential display, ciphertext, provider payload, base URL, runtime URL, host path, Docker target, or runtime port.
- No browser provider/model discovery sync.
- No browser-selected arbitrary model outside seeded/approved catalog.
- No F-010 node/workspace controls as active P9 settings.
