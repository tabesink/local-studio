"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cx, SegmentedControl } from "../../../_shared/ui";
import { useDashboardDemo } from "../hooks/use-dashboard-demo";
import type { ControllerSnapshot, DashboardScenario, GPU, RecipeOption } from "../types";

const scenarioItems: Array<{ id: DashboardScenario; label: string }> = [
  { id: "running", label: "Running" },
  { id: "idle", label: "Idle" },
  { id: "launching", label: "Launching" },
  { id: "offline", label: "Offline" },
  { id: "no-gpu", label: "No GPU" },
];

/* Dashboard — one continuous operator sheet. No outer card; section rhythm,
   hairlines, compact telemetry, and quiet density do the work. Mirrors
   features/dashboard/control-panel/control-panel-v2.tsx. */
export function DashboardDemo() {
  const dash = useDashboardDemo();
  const { snapshot } = dash;
  const isRunning = Boolean(snapshot.process);
  const modelName =
    snapshot.process?.served_model_name ??
    (snapshot.lifecycleStatus === "starting" ? "Starting model..." : "No model loaded");

  return (
    <main className="min-h-full overflow-y-auto overflow-x-hidden bg-(--bg) text-(--fg)">
      <div className="mx-auto w-full max-w-[86rem] px-3 pt-2 pb-8">
        {/* Demo-only scenario switcher */}
        <div className="flex items-center justify-end gap-2 py-2">
          <span className="text-[length:var(--fs-xs)] text-(--dim)/70">fixture scenario</span>
          <SegmentedControl size="sm" items={scenarioItems} value={dash.scenario} onChange={dash.setScenario} />
        </div>

        <ControllerMatrix
          controllers={dash.controllers}
          activeUrl={dash.activeControllerUrl}
          onActivate={dash.setActiveControllerUrl}
        />

        {/* Status section */}
        <section className="px-2 pt-2 pb-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 text-[length:var(--fs-sm)] tracking-[0.04em]">
                <span
                  className={cx(
                    "inline-flex h-1.5 w-1.5 shrink-0",
                    isRunning ? "bg-(--fg)" : "bg-(--dim)/55",
                    snapshot.lifecycleStatus === "starting" ? "animate-pulse bg-(--dim)" : "",
                  )}
                />
                <span className="inline-block w-[5.75rem] font-medium uppercase tracking-[0.14em] text-(--dim)">
                  {isRunning ? "Active" : "Standby"}
                </span>
                {!snapshot.connected ? <Tag tone="err">offline</Tag> : null}
                {snapshot.process?.backend ? <Tag>{snapshot.process.backend}</Tag> : null}
                {snapshot.platformKind ? <Tag>{snapshot.platformKind}</Tag> : null}
                {snapshot.inferencePort ? (
                  <span className="font-mono text-[length:var(--fs-xs)] tabular-nums text-(--dim)/70">
                    :{snapshot.inferencePort}
                  </span>
                ) : null}
              </div>
              <h1
                className="mt-1.5 truncate text-[length:var(--fs-3xl)] font-semibold leading-tight tracking-[-0.01em] text-(--fg)"
                title={modelName}
              >
                {modelName}
              </h1>
            </div>
            <div className="flex items-center gap-1.5">
              <ModelsDropdown
                recipes={dash.recipes}
                launching={dash.launching}
                onLaunch={dash.onLaunch}
              />
              <ActionBtn label="Logs" onClick={() => undefined} />
              <ActionBtn
                label={dash.benchmarking ? "Run" : "Bench"}
                onClick={dash.onBenchmark}
                disabled={dash.benchmarking || !isRunning}
              />
            </div>
          </div>

          {/* Metric strip — six even mono columns separated by hairline rules. */}
          <dl className="mt-5 grid w-full grid-cols-2 border-b border-(--border)/40 pb-5 sm:grid-cols-3 lg:grid-cols-6">
            <MetricCell
              label="gen"
              value={snapshot.metrics ? snapshot.metrics.generationTps.toFixed(1) : "0"}
              unit="tok/s"
            />
            <MetricCell
              label="prefill"
              value={snapshot.metrics ? snapshot.metrics.prefillTps.toFixed(0) : "0"}
              unit="tok/s"
            />
            <MetricCell
              label="ttft"
              value={snapshot.metrics ? String(snapshot.metrics.ttftMs) : "0"}
              unit="ms"
            />
            <MetricCell
              label="requests"
              value={snapshot.metrics ? String(snapshot.metrics.requests) : "0"}
            />
            <MetricCell
              label="cache hit"
              value={snapshot.metrics ? `${snapshot.metrics.cacheHitPct.toFixed(1)}` : "0"}
              unit="%"
            />
            <MetricCell
              label="kv cache"
              value={snapshot.metrics ? `${snapshot.metrics.kvCachePct.toFixed(1)}` : "0"}
              unit="%"
            />
          </dl>

          {/* Runtime facts */}
          <dl className="mt-3 grid gap-2 font-mono text-[length:var(--fs-xs)] text-(--dim) sm:grid-cols-4">
            <RuntimeMetric label="backend" value={snapshot.process?.backend ?? "—"} />
            <RuntimeMetric label="pid" value={snapshot.process ? String(snapshot.process.pid) : "—"} />
            <RuntimeMetric
              label="port"
              value={snapshot.process ? String(snapshot.process.port) : "—"}
            />
            <RuntimeMetric label="platform" value={snapshot.platformKind ?? "—"} />
          </dl>
        </section>

        <GpuSection gpus={snapshot.gpus} />

        <ActivityStrip logs={snapshot.logs} />
      </div>

      {/* Launch toast during model startup. */}
      {snapshot.launchProgress ? (
        <div className="fixed bottom-4 right-4 z-50 w-80 rounded-lg border border-(--border) bg-(--color-popover) p-3 shadow-[var(--composer-shadow)]">
          <div className="flex items-center justify-between gap-2">
            <span className="truncate text-[length:var(--fs-sm)] font-medium text-(--fg)">
              {snapshot.launchProgress.message}
            </span>
            <span className="font-mono text-[length:var(--fs-xs)] text-(--dim)">
              {snapshot.launchProgress.stage}
            </span>
          </div>
          <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-(--dim)/15">
            <div
              className="h-full rounded-full bg-(--fg)/60 transition-[width] duration-300"
              style={{ width: `${snapshot.launchProgress.progress ?? 20}%` }}
            />
          </div>
        </div>
      ) : null}
    </main>
  );
}

/* Controller matrix — only appears when more than one controller exists. */
function ControllerMatrix({
  controllers,
  activeUrl,
  onActivate,
}: {
  controllers: ControllerSnapshot[];
  activeUrl: string;
  onActivate: (url: string) => void;
}) {
  if (controllers.length <= 1) return null;
  const online = controllers.filter((controller) => controller.online).length;

  return (
    <section className="mb-3 border-b border-(--border)/35 pb-3">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="font-mono text-[length:var(--fs-2xs)] font-medium uppercase tracking-[0.18em] text-(--dim)/75">
          controllers live
        </div>
        <div className="text-[length:var(--fs-xs)] text-(--dim)/70">
          {online}/{controllers.length} online
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {controllers.map((controller) => {
          const active = controller.url === activeUrl;
          const state = controller.authRequired
            ? "auth"
            : controller.online
              ? controller.running
                ? "running"
                : "idle"
              : "offline";
          const dotClass = controller.online
            ? controller.running
              ? "bg-(--hl2)"
              : "bg-(--dim)"
            : controller.authRequired
              ? "bg-(--hl3)"
              : "bg-(--err)";
          return (
            <button
              key={controller.url}
              type="button"
              onClick={() => onActivate(controller.url)}
              title={controller.url}
              className={cx(
                "group inline-flex h-7 min-w-0 max-w-full shrink-0 items-center gap-2 whitespace-nowrap rounded-md border px-2 text-left text-[length:var(--fs-sm)] transition",
                active
                  ? "border-(--accent)/60 bg-(--accent)/10 text-(--fg)"
                  : "border-(--border)/55 bg-(--surface)/40 text-(--dim) hover:border-(--border) hover:text-(--fg)",
              )}
            >
              <span className={cx("h-1.5 w-1.5 shrink-0 rounded-full", dotClass)} aria-hidden />
              <span className="max-w-[10rem] truncate font-medium text-(--fg)">
                {controller.name ?? controller.url}
              </span>
              <span className="font-mono text-[length:var(--fs-2xs)] uppercase tracking-wide text-(--dim)">
                {state}
              </span>
              <span className="font-mono text-[length:var(--fs-2xs)] text-(--dim)">
                {controller.gpuCount}× gpu
              </span>
              <span className="max-w-[14rem] truncate text-[length:var(--fs-xs)] text-(--dim)">
                {controller.online
                  ? (controller.model ?? "no model")
                  : controller.authRequired
                    ? "auth required"
                    : "unreachable"}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

/* GPU section — one aggregate summary row plus optional expanded rows. */
function GpuSection({ gpus }: { gpus: GPU[] }) {
  const [expanded, setExpanded] = useState(true);
  const sorted = [...gpus].sort((a, b) => b.memoryTotalGb - a.memoryTotalGb);
  const totalUsed = sorted.reduce((sum, gpu) => sum + gpu.memoryUsedGb, 0);
  const totalCap = sorted.reduce((sum, gpu) => sum + gpu.memoryTotalGb, 0);
  const totalPower = sorted.reduce((sum, gpu) => sum + gpu.powerW, 0);
  const totalPowerLimit = sorted.reduce((sum, gpu) => sum + gpu.powerLimitW, 0);
  const avgUtil = sorted.length
    ? sorted.reduce((sum, gpu) => sum + gpu.utilizationPct, 0) / sorted.length
    : 0;
  const maxTemp = sorted.length ? Math.max(...sorted.map((gpu) => gpu.tempC)) : 0;
  const memPct = totalCap > 0 ? Math.min(100, Math.max(0, (totalUsed / totalCap) * 100)) : 0;

  return (
    <section className="mt-4 border-t border-(--border)/40 px-2 pt-3 pb-5">
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        className="group flex w-full items-center gap-4 text-left"
        aria-expanded={expanded}
        disabled={sorted.length === 0}
      >
        <div className="flex shrink-0 items-baseline gap-2">
          <span className="text-[length:var(--fs-xs)] font-medium uppercase tracking-[0.18em] text-(--dim)">
            GPUs
          </span>
          <span className="font-mono text-[length:var(--fs-xs)] tabular-nums text-(--dim)/65">
            {sorted.length}
          </span>
        </div>

        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          <div className="h-[3px] min-w-[5rem] max-w-[18rem] flex-1 overflow-hidden rounded-[var(--rad-2xs)] bg-(--dim)/15">
            <div
              className="h-full rounded-[var(--rad-2xs)] bg-(--fg)/55 transition-[width] duration-300"
              style={{ width: `${memPct}%` }}
            />
          </div>
          <span className="font-mono text-[length:var(--fs-sm)] tabular-nums text-(--fg)/85">
            {totalUsed.toFixed(1)}
            <span className="text-(--dim)/65">/{totalCap.toFixed(0)}G</span>
          </span>
        </div>

        <div className="hidden items-baseline gap-5 font-mono text-[length:var(--fs-sm)] tabular-nums sm:flex">
          <Aggregate label="util" value={`${Math.round(avgUtil)}%`} />
          <Aggregate label="temp" value={maxTemp > 0 ? `${Math.round(maxTemp)}°` : "—"} />
          <Aggregate
            label="pwr"
            value={`${Math.round(totalPower)}${totalPowerLimit > 0 ? `/${Math.round(totalPowerLimit)}` : ""}W`}
          />
        </div>

        {sorted.length > 0 ? (
          <span
            aria-hidden
            className={cx(
              "ml-1 font-mono text-[length:var(--fs-xs)] text-(--dim)/55 transition-transform group-hover:text-(--dim)",
              expanded ? "rotate-90" : "",
            )}
          >
            ›
          </span>
        ) : null}
      </button>

      {expanded && sorted.length > 0 ? (
        <div className="mt-3 space-y-1">
          {sorted.map((gpu) => (
            <GpuRow key={gpu.id} gpu={gpu} />
          ))}
        </div>
      ) : null}
    </section>
  );
}

function GpuRow({ gpu }: { gpu: GPU }) {
  const memPct =
    gpu.memoryTotalGb > 0
      ? Math.min(100, Math.max(0, (gpu.memoryUsedGb / gpu.memoryTotalGb) * 100))
      : 0;
  return (
    <div className="flex items-center gap-3 py-0.5 font-mono text-[length:var(--fs-sm)] tabular-nums">
      <span className="w-8 shrink-0 text-(--fg)/85">G{gpu.id}</span>
      <span
        className="min-w-0 flex-1 truncate text-[length:var(--fs-xs)] text-(--dim)/75"
        title={gpu.name}
      >
        {gpu.name}
      </span>
      <div className="flex w-[8rem] shrink-0 items-center gap-2">
        <div className="h-[2px] flex-1 overflow-hidden rounded-[var(--rad-2xs)] bg-(--dim)/15">
          <div className="h-full bg-(--fg)/45" style={{ width: `${memPct}%` }} />
        </div>
        <span className="text-(--fg)/80">
          {gpu.memoryUsedGb.toFixed(1)}
          <span className="text-(--dim)/55">/{gpu.memoryTotalGb.toFixed(0)}G</span>
        </span>
      </div>
      <span className="w-9 shrink-0 text-right text-(--dim)">{Math.round(gpu.utilizationPct)}%</span>
      <span className="w-7 shrink-0 text-right text-(--dim)">
        {gpu.tempC > 0 ? `${Math.round(gpu.tempC)}°` : "—"}
      </span>
      <span className="w-14 shrink-0 text-right text-(--dim)">
        {gpu.powerW > 0 ? `${Math.round(gpu.powerW)}/${Math.round(gpu.powerLimitW)}W` : "—"}
      </span>
    </div>
  );
}

/* Activity strip — bordered mono controller log tail with max height. */
function ActivityStrip({ logs }: { logs: string[] }) {
  const tail = logs.slice(-120);
  return (
    <section className="border-t border-(--border)/40 px-2 pt-4 pb-5">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="font-mono text-[length:var(--fs-2xs)] font-medium uppercase tracking-[0.18em] text-(--dim)/75">
          Controller logs
        </div>
        <div className="text-[length:var(--fs-xs)] text-(--dim)/70">{tail.length} lines</div>
      </div>
      <div className="max-h-[34rem] min-h-[18rem] overflow-y-auto border border-(--border)/45 bg-(--surface)/40 p-3 font-mono text-[length:var(--fs-xs)] leading-5 text-(--dim)/80">
        {tail.length > 0 ? (
          tail.map((line, index) => (
            <div key={`${index}-${line}`} className="truncate">
              {line.replace(/^\[[^\]]+\]\s*/, "").slice(0, 180)}
            </div>
          ))
        ) : (
          <div>0 log lines</div>
        )}
      </div>
    </section>
  );
}

function ModelsDropdown({
  recipes,
  launching,
  onLaunch,
}: {
  recipes: RecipeOption[];
  launching: boolean;
  onLaunch: (recipeId: string) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        disabled={launching}
        className="inline-flex h-7 items-center gap-1.5 rounded-[var(--rad-2xs)] border border-(--border)/70 px-2.5 font-mono text-[length:var(--fs-xs)] uppercase tracking-[0.12em] text-(--dim) transition-colors hover:border-(--border) hover:bg-(--fg)/5 hover:text-(--fg) disabled:cursor-not-allowed disabled:opacity-30"
        aria-expanded={open}
      >
        {launching ? "Launching" : "Launch"}
        <ChevronDown className="h-3 w-3" />
      </button>
      {open ? (
        <div className="absolute right-0 top-8 z-50 w-64 rounded-lg border border-(--border) bg-(--color-popover) py-1 shadow-[var(--composer-shadow)]">
          {recipes.map((recipe) => (
            <button
              key={recipe.id}
              type="button"
              onClick={() => {
                setOpen(false);
                void onLaunch(recipe.id);
              }}
              className="flex w-full items-center justify-between gap-2 px-3 py-1.5 text-left text-[length:var(--fs-sm)] text-(--fg) transition-colors hover:bg-(--hover)"
            >
              <span className="truncate">{recipe.name}</span>
              <span className="flex shrink-0 items-center gap-1.5 font-mono text-[length:var(--fs-2xs)] uppercase text-(--dim)">
                {recipe.backend}
                {recipe.running ? <span className="h-1.5 w-1.5 rounded-full bg-(--ok)" /> : null}
              </span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function MetricCell({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div className="min-w-0 overflow-hidden border-r border-(--border)/40 pr-2 pl-3 first:pl-0 last:border-r-0 sm:pr-4 sm:pl-5">
      <dt className="truncate font-mono text-[length:var(--fs-2xs)] font-medium uppercase tracking-[0.18em] text-(--dim)/75">
        {label}
      </dt>
      <dd className="mt-1 flex min-w-0 items-baseline gap-1 font-mono text-[length:var(--fs-2xl)] leading-none tabular-nums text-(--fg)">
        <span className="truncate" title={value}>
          {value}
        </span>
        {unit ? <span className="shrink-0 text-[length:var(--fs-xs)] text-(--dim)">{unit}</span> : null}
      </dd>
    </div>
  );
}

function RuntimeMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-0 items-baseline justify-between gap-2 border-t border-(--border)/25 pt-1">
      <dt className="truncate uppercase tracking-[0.12em]">{label}</dt>
      <dd className="truncate text-(--fg)">{value}</dd>
    </div>
  );
}

function Aggregate({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-baseline gap-1.5">
      <span className="text-[length:var(--fs-2xs)] uppercase tracking-[0.14em] text-(--dim)/55">
        {label}
      </span>
      <span className="text-(--fg)/85">{value}</span>
    </span>
  );
}

function Tag({ tone, children }: { tone?: "err"; children: ReactNode }) {
  const cls =
    tone === "err" ? "border-(--err)/60 text-(--err)" : "border-(--border)/70 text-(--dim)";
  return (
    <span
      className={cx(
        "border px-1.5 py-[1px] font-mono text-[length:var(--fs-2xs)] uppercase tracking-[0.14em]",
        cls,
      )}
    >
      {children}
    </span>
  );
}

function ActionBtn({
  label,
  onClick,
  disabled,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className="h-7 rounded-[var(--rad-2xs)] border border-(--border)/70 px-2.5 font-mono text-[length:var(--fs-xs)] uppercase tracking-[0.12em] text-(--dim) transition-colors hover:border-(--border) hover:bg-(--fg)/5 hover:text-(--fg) disabled:cursor-not-allowed disabled:opacity-30"
    >
      {label}
    </button>
  );
}
