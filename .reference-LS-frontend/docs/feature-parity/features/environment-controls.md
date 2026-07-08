# Feature: Environment Controls

## Purpose

Environment controls own controller URL, API key, voice defaults, saved controller rows, active controller switching, connection testing, and persistence. They appear primarily inside the Settings `Connection` section and influence dashboard/controller requests.

## Current Code Map

- `features/settings/api-connection-section.tsx`: saved controllers list, add/edit/remove/activate rows, test/save buttons.
- `features/settings/use-settings.ts`: merges server settings with local backend URL/API key, test/save/load logic.
- `lib/api/connection.ts`: active backend URL localStorage/cookie, runtime API key, backend changed event.
- `lib/api/controllers.ts`: saved controllers storage, normalization, changed event.
- `lib/api/core.ts`: browser proxy headers `X-Backend-Url`, `X-Backend-Strict`, `Authorization`.
- `app/api/settings/route.ts`: GET/POST server settings.
- `lib/services/settings-service.ts`: read/write/mask `api-settings.json`.

## User Workflow

1. Settings loads `/api/settings`.
2. Hook merges server settings with `localstudio_backend_url` and runtime/local controller API key.
3. User adds a controller row with optional name and API key.
4. Row is normalized and stored in `local-studio.controllers`.
5. User activates a row. The app writes active backend URL, sets runtime API key, posts `/api/settings`, and dispatches storage/backend events.
6. User clicks Test. A temporary API client probes `GET /status` through `/api/proxy` with override headers.
7. User clicks Save active. Local settings persist first, then server settings are saved. Config reload follows when a backend URL exists.

Loading: API settings row shows loading status. Empty: "No controllers yet. Add one below." Error: test/save status shows error text, invalid server save returns `{ error }`. Final UI: selected radio row becomes active and status pill shows connected/error/unknown.

## UI/UX Parity Notes

- Controllers are a single list, not separate environments.
- Active row selected by radio/dot and URL match.
- Secret inputs support reveal/hide per row.
- Add row uses inline compact inputs and Add button.
- Test and Save active buttons sit in a separate `Connection` group.
- Save can succeed locally even if server persistence fails.

## ASCII Mockup

```txt
+ Controllers ---------------------------------------------+
| (o) homelab      http://192.168.1.70:8080   **** [eye][x] |
| ( ) laptop       http://127.0.0.1:8080      none [eye][x] |
| name... | url...                         | key... | Add   |
+----------------------------------------------------------+
  every controller is saved in one list

+ Connection ----------------------------------------------+
| Active connection check            Connected [Test][Save] |
+----------------------------------------------------------+
```

## Proposed Folder Structure

```txt
features/environment-controls/
  components/
  hooks/
  api/
  types/
  fixtures/
  constants/
  index.ts
```

## Components

- `EnvironmentControlsDemo`: entry with fixture-backed saved controllers.
- `ControllerList`: renders active, editable, removable rows.
- `ControllerRow`: name/url/key inputs, reveal/hide, radio activation.
- `AddControllerRow`: draft inputs and add button.
- `ConnectionCheckRow`: test/save buttons and status message.

## API Contracts

| Endpoint | Method | Source | Request | Response | Error/Auth |
| --- | --- | --- | --- | --- | --- |
| `/api/settings` | GET | `app/api/settings/route.ts` | none | masked settings view | 500 `{ error, details }` |
| `/api/settings` | POST | `app/api/settings/route.ts` | `{ backendUrl?, apiKey?, voiceUrl?, voiceModel? }` | `{ success: true, ...maskedSettings }` | `requireApiAccess`; 400 invalid URL; 500 save error |
| `/status` via `/api/proxy` | GET | `use-settings.ts`, `lib/api/system.ts` | override headers | status payload | 10s timeout, no retries for test |

Browser proxy headers from `lib/api/core.ts`:

- `X-Backend-Url`: selected backend.
- `X-Backend-Strict: 1`: avoid fallback when selected backend is unreachable.
- `Authorization: Bearer <key>`: runtime/saved key.
- `X-Backend-Suppress-Auth: 1`: explicit empty override key.

## State Model

- Local React: draft row, revealed secrets, testing/saving/status message.
- Browser localStorage: `local-studio.controllers`, `localstudio_backend_url`.
- Browser cookie: `localstudio_backend_url`.
- Runtime module variable: active API key.
- Server file: `<dataDir>/api-settings.json` stores persisted defaults.

## Types / Schemas

```ts
export interface SavedController {
  url: string;
  apiKey?: string;
  name?: string;
}

export interface ApiSettings {
  backendUrl: string;
  apiKey: string;
  voiceUrl: string;
  voiceModel: string;
}

export type ConnectionStatus = "unknown" | "connected" | "error";
```

## Implementation Steps

1. Implement `normalizeControllerUrl` exactly: trim, remove trailing slash, strip `/v1`.
2. Build controller storage helpers with URL de-dupe.
3. Load server settings and merge with local active values.
4. Render saved rows, draft row, and test/save controls.
5. Mock status probe and server save in the demo API.
6. Show local-save fallback when remote save fails.

## Copy / Modify Map

- Copy storage semantics from `lib/api/controllers.ts` and `lib/api/connection.ts`.
- Copy row behavior from `api-connection-section.tsx`.
- Reuse settings primitives from `ui/settings.tsx`.
- Modify real API client to fixture-backed `probeController` and `saveSettings` for demos.

## Acceptance Criteria

- Add, activate, edit, reveal/hide, remove, test, and save flows work.
- Duplicate URLs de-dupe after normalization.
- Masked keys are not overwritten unless a real key is supplied.
- Test uses a loading state and returns connected/error.
- Auth/header behavior is documented.

## Anti-Overengineering Notes

Do not add environment profiles, account-scoped secrets, remote secret stores, or multi-user policy. The reference is local-controller oriented.
