# Environment Controls Demo Slice

Carbon copy of the API connection section: one saved-controller list where each row is a radio-dot activation row with name / mono URL / masked key + reveal / remove, an inline add row (name, URL, API key inputs at h-7), and a separate Connection group with Test and Save active actions plus a status pill.

Source guide: `docs/feature-parity/features/environment-controls.md`.

## Reference copy map

| This slice | Reference (`.references/local-studio/frontend/src`) |
| --- | --- |
| `components/environment-controls-demo.tsx` | `features/settings/api-connection-section.tsx` |
| `api/normalizeControllerUrl` | `lib/api/controllers.ts` |
| saved controllers model | `lib/api/controllers.ts` (`SavedController`) |
| Test/Save flow copy ("Connected", timeout message) | `api-connection-section.tsx` status strings |

Fixture-only: `testController` succeeds for local URLs and times out for `192.168.1.70` to demo the error state.
