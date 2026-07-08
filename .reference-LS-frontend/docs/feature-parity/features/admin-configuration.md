# Feature: Admin / Configuration Panels

## Purpose

Admin/configuration panels cover operational configuration that is not basic user preference: runtime engines, services/system facts, MCP/plugins, skills/setup checks, and controller/server configuration. They appear across Settings > System/Plugins/Skills/Setup, `/plugins`, and `/server`.

## Current Code Map

- `features/settings/system-settings-section.tsx`: services, URLs, controller state, network, storage, hardware, compatibility.
- `features/settings/engines-section.tsx`: runtime targets, jobs, backend install/update actions.
- `features/settings/runtime-targets.tsx`: target/runtime UI helpers.
- `features/plugins/plugins-page.tsx`: MCP server manager page and settings section.
- `features/plugins/*`: installed servers, manual server, curated search, connections, config JSON panel.
- `features/settings/agent-settings-sections.tsx`: archived chats, skills, setup checks.
- `features/logs/server-view.tsx`: controller/server observability and API docs.
- `lib/api/studio.ts`, `lib/api/system.ts`: runtime/provider/settings endpoints.

## User Workflow

1. Admin opens Settings > System, Plugins, Skills, Setup, `/plugins`, or `/server`.
2. System section shows live controller config when available, fallback rows otherwise.
3. Engines load runtime targets/jobs and expose install/update/cancel actions.
4. Plugins load MCP servers/catalogue/config, then enable/disable/remove/tag/manual-add/save-config.
5. Curated plugin OAuth opens provider start URL and polls server list for completion.
6. Skills/setup sections load local skills or setup checks and display status rows.

Loading: section-level loading and status pills. Empty: fallback rows and "detecting" messages. Error: settings notices or row-level guidance. Final UI: grouped dense admin rows, not a generic admin dashboard.

## UI/UX Parity Notes

- Admin panels reuse Settings `ListGroup`/`ListRow` grammar.
- `/plugins` can render as a full page, but the same manager also embeds in settings mode.
- MCP config JSON uses a compact textarea panel.
- Runtime jobs should use status pills/progress rows, not modal workflows.
- `/server` is the observability console; do not duplicate it inside settings.

## ASCII Mockup

```txt
Settings > System
+ Controller state ------------------- live/fallback -------+
| Config status            Loaded from controller            |
+ Network ---------------------------------------------------+
| Host | Controller port | Inference port | API key          |
+ Storage ---------------------------------------------------+
| Models | Data | Database                                  |
+ Hardware --------------------------------------------------+
| Platform | GPU types | CUDA | ROCm | GPU count             |

Plugins
+ Connections ----------------------------------------------+
+ Installed servers ----------------------------------------+
+ Add manual server ----------------------------------------+
+ MCP JSON config ------------------------------------------+
+ Browse curated -------------------------------------------+
```

## Proposed Folder Structure

```txt
features/admin-configuration/
  components/
  hooks/
  api/
  types/
  fixtures/
  constants/
  index.ts
```

## Components

- `AdminConfigurationDemo`: tabs for System, Engines, Plugins, Skills, Setup.
- `SystemFactsPanel`: config/compatibility/service rows.
- `EnginesPanel`: runtime backends, targets, jobs.
- `PluginsManagerPanel`: installed/manual/config/curated panels.
- `SkillsPanel`: local skills rows.
- `SetupChecksPanel`: first-run checks rows.

## API Contracts

| Endpoint | Method | Source | Request | Response | Error/Auth |
| --- | --- | --- | --- | --- | --- |
| `/config` | GET | `lib/api/system.ts` | none | `ConfigData` | fallback rows on failure |
| `/compat` | GET | `lib/api/system.ts` | none | `CompatibilityReport` | may be null |
| `/runtime/targets` | GET | `lib/api/studio.ts` | none | `{ targets: RuntimeTarget[] }` | normalized error |
| `/runtime/jobs` | GET | `lib/api/studio.ts` | none | `{ jobs: EngineJob[] }` | normalized error |
| `/runtime/jobs` | POST | `lib/api/studio.ts` | backend/type/command args | `{ job: EngineJob }` | normalized error |
| `/runtime/jobs/{id}/cancel` | POST | `lib/api/studio.ts` | path id | `{ job: EngineJob }` | normalized error |
| `/runtime/{backend}` | GET | `lib/api/studio.ts` | backend path | runtime backend info | vllm/sglang/llamacpp/mlx |
| `/runtime/{backend}/upgrade` | POST | `lib/api/studio.ts` | command/version payload | runtime job response | normalized error |
| `/api/mcp/servers?includeDisabled=1` | GET | `features/plugins/plugins-page.tsx` | query | `ServersPayload` | local API error |
| `/api/mcp/servers` | POST | `features/plugins/plugins-page.tsx` | action payload | `ServersPayload` | local API error |
| `/api/agent/skills` | GET | `agent-settings-sections.tsx` | none | skills payload | local API error |
| `/api/agent/setup-checks` | GET | `agent-settings-sections.tsx` | none | checks payload | local API error |

## State Model

- Local React: selected admin tab, loading/error, busy action id, drafts for manual/config fields.
- Server data: config, compatibility, runtime targets/jobs, plugin servers/catalogue/config.
- Polling: plugin OAuth completion polls every 1500ms up to about 40 iterations.
- No global admin store in reference.

## Types / Schemas

```ts
export type AdminTab = "system" | "engines" | "plugins" | "skills" | "setup";

export interface EngineJob {
  id: string;
  backend: "vllm" | "sglang" | "llamacpp" | "mlx";
  status: "queued" | "running" | "success" | "error" | "cancelled";
  message?: string;
}

export interface McpServer {
  id: string;
  name: string;
  command?: string;
  enabled: boolean;
  tags?: string[];
}
```

## Implementation Steps

1. Build fixture tabs for system, engines, plugins, skills, setup.
2. Implement grouped settings rows for system facts.
3. Add runtime jobs and backend action fixtures.
4. Add plugin manager fixture actions: enable, remove, tags, manual add, save config.
5. Add skills/setup rows with status pills.
6. Keep `/server` documentation linked to logs-observability instead of duplicating viewer code.

## Copy / Modify Map

- Copy grouping from `system-settings-section.tsx`.
- Copy plugin manager behavior from `plugins-page.tsx`.
- Copy runtime endpoint names from `lib/api/studio.ts`.
- Modify OAuth/polling into a fixture status for demos.

## Acceptance Criteria

- System fallback/live rows render.
- Engine job states and cancel/update actions are visible.
- Plugin enable/remove/tag/manual/config flows work against fixtures.
- Skills/setup check panels show empty/error/success states.
- No broad RBAC/admin framework is added.

## Anti-Overengineering Notes

Do not create a generic admin console, RBAC system, plugin marketplace, or runtime installer framework. Keep explicit panels for the known Local Studio operations.
