"use client";

import {
  Activity,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Cpu,
  DownloadCloud,
  HardDrive,
  LayoutDashboard,
  Loader2,
  MessageCircle,
  Rocket,
} from "lucide-react";
import {
  Alert,
  Button,
  Card,
  Checkbox,
  cx,
  FactGrid,
  SegmentedControl,
  SettingsGroup,
  SettingsNotice,
  StatusPill,
} from "../../../_shared/ui";
import {
  HARDWARE_CONFIRM_LABEL,
  RUNTIME_GROUP_DESCRIPTION,
  RUNTIME_GROUP_TITLE,
  SETUP_EYEBROW,
  SETUP_LOADING,
  SETUP_STEPS,
  SETUP_TITLE,
  WELCOME_BODY,
  WELCOME_HEADING,
} from "../constants";
import { useSetupWizard } from "../hooks/use-setup-wizard";
import type { SetupScenario } from "../types";

/* Setup wizard — mirrors features/setup/*: the /setup first-run flow with the
   numbered stepper and the exact six steps
   Welcome → Hardware → Model → Download → Launch → Benchmark. */

function formatBytes(bytes: number): string {
  if (bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const exp = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  const value = bytes / 1024 ** exp;
  return `${value >= 100 ? Math.round(value) : value.toFixed(1)} ${units[exp]}`;
}

export function SetupWizardDemo() {
  const setup = useSetupWizard();

  return (
    <main className="min-h-full overflow-y-auto bg-(--ui-bg) text-(--ui-fg)">
      {/* Demo-only fixture scenario switcher. */}
      <div className="flex items-center justify-center gap-2 border-b border-(--ui-border)/40 px-4 py-2 text-[length:var(--fs-sm)] text-(--ui-muted)">
        <span>Fixture scenario</span>
        <SegmentedControl<SetupScenario>
          size="sm"
          items={[
            { id: "happy-path", label: "Happy path" },
            { id: "controller-unreachable", label: "Controller offline" },
            { id: "download-failed", label: "Download fails" },
          ]}
          value={setup.scenario}
          onChange={setup.setScenario}
        />
      </div>

      <div className="mx-auto max-w-5xl px-6 py-10">
        {/* Shell header (setup-view.tsx). */}
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <div className="text-sm uppercase tracking-wider text-(--dim)">{SETUP_EYEBROW}</div>
            <h1 className="mt-1 text-2xl font-semibold text-(--fg)">{SETUP_TITLE}</h1>
          </div>
          {!setup.completed ? (
            <Button variant="secondary" size="sm" onClick={setup.skipSetup}>
              Skip for now
            </Button>
          ) : null}
        </div>

        {setup.completed ? (
          <Card padding="lg" className="space-y-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-(--hl2)" />
              <h2 className="text-lg font-medium">Setup complete</h2>
            </div>
            <p className="text-[length:var(--fs-base)] text-(--dim)">
              localStorage[&quot;local-studio-setup-complete&quot;] is now &quot;true&quot;. In the
              reference app you would land on Chat or the Dashboard; this demo can restart the
              flow instead.
            </p>
            <Button variant="secondary" size="sm" onClick={setup.restart}>
              Start over
            </Button>
          </Card>
        ) : (
          <>
            <SetupStepper step={setup.step} />

            {setup.loading ? (
              <Card padding="lg" className="mt-8 flex items-center gap-3 text-(--dim)">
                <Loader2 className="h-4 w-4 animate-spin" />
                {SETUP_LOADING}
              </Card>
            ) : setup.error ? (
              <div className="mt-8">
                <Alert variant="error">{setup.error}</Alert>
              </div>
            ) : (
              <div className="mt-8">
                {setup.step === 0 ? <StepWelcome setup={setup} /> : null}
                {setup.step === 1 ? <StepHardware setup={setup} /> : null}
                {setup.step === 2 ? <StepModel setup={setup} /> : null}
                {setup.step === 3 ? <StepDownload setup={setup} /> : null}
                {setup.step === 4 ? <StepLaunch setup={setup} /> : null}
                {setup.step === 5 ? <StepBenchmark setup={setup} /> : null}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}

type Setup = ReturnType<typeof useSetupWizard>;

/* Numbered progress stepper (setup-stepper.tsx). */
function SetupStepper({ step }: { step: number }) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1">
      {SETUP_STEPS.map((label, index) => (
        <div key={label} className="flex shrink-0 items-center gap-2">
          <div className="flex items-center gap-2">
            <span
              className={cx(
                "flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium",
                index === step
                  ? "bg-(--hl1) text-white"
                  : index < step
                    ? "bg-(--surface) text-(--fg)"
                    : "bg-(--surface) text-(--dim)",
              )}
            >
              {index + 1}
            </span>
            <span className={cx("text-sm", index === step ? "text-(--fg)" : "text-(--dim)")}>
              {label}
            </span>
          </div>
          {index < SETUP_STEPS.length - 1 ? (
            <ChevronRight className="h-4 w-4 text-(--border)" />
          ) : null}
        </div>
      ))}
    </div>
  );
}

/* Step 0 — Welcome. */
function StepWelcome({ setup }: { setup: Setup }) {
  const gpuCount = setup.diagnostics?.gpus.length ?? 0;
  return (
    <Card padding="lg" className="space-y-5">
      <div className="flex items-center gap-2">
        <Rocket className="h-5 w-5 text-(--hl1)" />
        <h2 className="text-lg font-medium">{WELCOME_HEADING}</h2>
      </div>
      <p className="text-[length:var(--fs-base)] leading-relaxed text-(--dim)">{WELCOME_BODY}</p>

      <div className="flex items-center justify-between gap-3 rounded-md border border-(--ui-border) bg-(--ui-hover)/30 px-3 py-2">
        <span className="text-[length:var(--fs-sm)] text-(--dim)">Setup target</span>
        <StatusPill tone={setup.diagnostics ? "good" : "default"}>
          {setup.diagnostics
            ? `${setup.diagnostics.platform} · ${setup.diagnostics.arch} · ${gpuCount} GPU`
            : "controller pending"}
        </StatusPill>
      </div>

      <label className="block">
        <div className="mb-1.5 text-[length:var(--fs-sm)] font-medium text-(--fg)">
          Controller models directory
        </div>
        <input
          value={setup.modelsDir}
          onChange={(event) => setup.setModelsDir(event.target.value)}
          placeholder="/mnt/llm_models"
          className="h-8 w-full rounded-md border border-(--ui-separator) bg-(--ui-bg) px-2.5 font-mono text-[length:var(--fs-base)] text-(--ui-fg) outline-none placeholder:text-(--ui-muted)/50 focus:border-(--ui-info)/50"
        />
        {setup.settings ? (
          <div className="mt-1.5 text-xs text-(--dim)">
            Controller config: {setup.settings.config_path}
          </div>
        ) : null}
      </label>

      <div className="flex justify-end">
        <Button
          variant="primary"
          size="sm"
          onClick={() => void setup.continueFromWelcome()}
          disabled={setup.savingSettings}
          icon={
            setup.savingSettings ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )
          }
        >
          Continue
        </Button>
      </div>
    </Card>
  );
}

/* Step 1 — Hardware. */
function StepHardware({ setup }: { setup: Setup }) {
  const diagnostics = setup.diagnostics;
  const gpuLine =
    diagnostics && diagnostics.gpus.length > 0
      ? diagnostics.gpus.map((gpu) => gpu.name).join(", ")
      : "No CUDA GPU detected";
  const vramLine =
    diagnostics && diagnostics.gpus.length > 0
      ? `${diagnostics.gpus.reduce((sum, gpu) => sum + gpu.memory_total_gb, 0)} GB total`
      : "CPU only";

  return (
    <div className="grid gap-6">
      <Card padding="lg" className="space-y-4">
        <div className="flex items-center gap-2">
          <Cpu className="h-5 w-5 text-(--hl1)" />
          <h2 className="text-lg font-medium">Hardware Check</h2>
        </div>
        <FactGrid
          columns={2}
          items={[
            { label: "CPU", value: diagnostics?.cpu_model ?? "unknown" },
            { label: "Memory", value: diagnostics ? `${diagnostics.memory_total_gb} GB` : "unknown" },
            { label: "GPU", value: gpuLine },
            { label: "VRAM", value: vramLine },
          ]}
        />
      </Card>

      <SettingsGroup title={RUNTIME_GROUP_TITLE} description={RUNTIME_GROUP_DESCRIPTION}>
        {setup.runtimeTargets.map((target) => (
          <div
            key={target.id}
            className="flex items-center justify-between gap-3 px-3.5 py-2.5 transition-colors hover:bg-(--ui-hover)/35"
          >
            <div className="min-w-0">
              <div className="text-[length:var(--fs-base)] font-medium text-(--ui-fg)">
                {target.label}
              </div>
              <div className="mt-0.5 truncate font-mono text-[length:var(--fs-sm)] text-(--ui-muted)">
                {target.detail}
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <StatusPill tone={target.installed ? "good" : "default"}>
                {target.installed ? "installed" : "not installed"}
              </StatusPill>
              {!target.installed && target.backend !== "mlx" ? (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => void setup.installRuntime(target)}
                  disabled={setup.installJob?.status === "running"}
                  icon={
                    setup.installJob?.backend === target.backend &&
                    setup.installJob.status === "running" ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <DownloadCloud className="h-3.5 w-3.5" />
                    )
                  }
                >
                  Install
                </Button>
              ) : null}
            </div>
          </div>
        ))}
      </SettingsGroup>

      {setup.installJob ? (
        <SettingsNotice tone={setup.installJob.status === "succeeded" ? "good" : "info"}>
          {setup.installJob.message}
        </SettingsNotice>
      ) : null}

      <Card padding="md" className="space-y-4">
        <div className="rounded-lg border border-(--ui-border) bg-(--ui-surface)/40 px-4 py-3">
          <Checkbox
            checked={setup.hardwareConfirmed}
            onChange={setup.setHardwareConfirmed}
            label={HARDWARE_CONFIRM_LABEL}
          />
        </div>
        <div className="flex justify-end">
          <Button
            variant="primary"
            size="sm"
            onClick={setup.continueFromHardware}
            disabled={!setup.hardwareConfirmed || setup.installJob?.status === "running"}
            icon={<ChevronRight className="h-3.5 w-3.5" />}
          >
            Continue
          </Button>
        </div>
      </Card>
    </div>
  );
}

/* Step 2 — Model. */
function StepModel({ setup }: { setup: Setup }) {
  return (
    <div className="space-y-6">
      <Card padding="lg" className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-sm uppercase tracking-wider text-(--dim)">Recommended</div>
            <h2 className="mt-1 text-lg font-medium">Pick a starter model</h2>
          </div>
          <StatusPill tone={setup.maxVramGb > 0 ? "info" : "default"}>
            {setup.maxVramGb > 0 ? `Detected VRAM: ${setup.maxVramGb} GB` : "CPU"}
          </StatusPill>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {setup.recommendations.map((recommendation) => (
            <Card key={recommendation.id} padding="md" className="space-y-2">
              <div className="text-[length:var(--fs-base)] font-medium text-(--fg)">
                {recommendation.name}
              </div>
              <div className="truncate font-mono text-[length:var(--fs-sm)] text-(--dim)">
                {recommendation.id}
              </div>
              <p className="text-[length:var(--fs-sm)] leading-relaxed text-(--dim)">
                {recommendation.description}
              </p>
              <div className="flex items-center justify-between gap-2 pt-1">
                <span className="font-mono text-[length:var(--fs-xs)] text-(--dim)">
                  {recommendation.size_gb} GB · {recommendation.min_vram_gb} GB VRAM
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => void setup.beginDownload(recommendation.id)}
                  icon={<DownloadCloud className="h-3.5 w-3.5" />}
                >
                  Download
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </Card>

      <Card padding="lg" className="space-y-4">
        <div>
          <div className="text-sm uppercase tracking-wider text-(--dim)">Manual</div>
          <h2 className="mt-1 text-lg font-medium">Download by model ID</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={setup.manualModelId}
            onChange={(event) => setup.setManualModelId(event.target.value)}
            placeholder="e.g. meta-llama/Llama-3.1-8B-Instruct"
            className="h-8 min-w-64 flex-1 rounded-md border border-(--ui-separator) bg-(--ui-bg) px-2.5 font-mono text-[length:var(--fs-base)] text-(--ui-fg) outline-none placeholder:text-(--ui-muted)/50 focus:border-(--ui-info)/50"
          />
          <Button
            variant="secondary"
            size="sm"
            disabled={!setup.manualModelId.trim()}
            onClick={() => void setup.beginDownload(setup.manualModelId.trim())}
          >
            Download
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setup.setStep(1)}
            icon={<ChevronLeft className="h-3.5 w-3.5" />}
          >
            Back
          </Button>
        </div>
      </Card>
    </div>
  );
}

/* Step 3 — Download. */
function StepDownload({ setup }: { setup: Setup }) {
  const download = setup.download;
  const total = download?.total_bytes ?? 0;
  const percent = download && total > 0 ? Math.round((download.downloaded_bytes / total) * 100) : 0;
  const complete = download?.status === "completed";

  return (
    <div className="space-y-6">
      <Card padding="lg" className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-sm uppercase tracking-wider text-(--dim)">Download</div>
            <h2 className="mt-1 text-lg font-medium">Fetching {setup.selectedModel ?? "model"}</h2>
          </div>
          <span className="text-[length:var(--fs-sm)] text-(--dim)">{download?.status ?? "queued"}</span>
        </div>

        {download ? (
          <>
            <div className="h-2 w-full overflow-hidden rounded-full bg-(--surface)">
              <div
                className="h-full rounded-full bg-(--hl1) transition-all"
                style={{ width: `${percent}%` }}
              />
            </div>
            <div className="flex items-center justify-between font-mono text-[length:var(--fs-sm)] text-(--dim)">
              <span>
                {formatBytes(download.downloaded_bytes)} / {formatBytes(total)}
              </span>
              <span>{percent}%</span>
            </div>
            {download.error ? (
              <div className="text-[length:var(--fs-sm)] text-(--err)">{download.error}</div>
            ) : null}
            <div className="flex gap-2">
              {download.status === "downloading" ? (
                <Button variant="secondary" size="sm" onClick={setup.pauseDownload}>
                  Pause
                </Button>
              ) : null}
              {download.status === "paused" || download.status === "failed" ? (
                <Button variant="secondary" size="sm" onClick={setup.resumeDownload}>
                  Resume
                </Button>
              ) : null}
              {download.status !== "completed" && download.status !== "canceled" ? (
                <Button variant="danger" size="sm" onClick={setup.cancelDownload}>
                  Cancel
                </Button>
              ) : null}
            </div>
          </>
        ) : (
          <p className="text-[length:var(--fs-base)] text-(--dim)">No active download yet.</p>
        )}
      </Card>

      <Card padding="lg" className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-2 text-[length:var(--fs-base)] text-(--dim)">
          {complete ? (
            <>
              <CheckCircle2 className="h-4 w-4 shrink-0 text-(--hl2)" />
              Model ready. Continue to configure the starter recipe and launch it.
            </>
          ) : (
            <>
              <HardDrive className="h-4 w-4 shrink-0" />
              Downloading to {setup.modelsDir}
            </>
          )}
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={setup.continueToLaunch}
          disabled={!complete}
          icon={<ChevronRight className="h-3.5 w-3.5" />}
        >
          Continue to Launch
        </Button>
      </Card>
    </div>
  );
}

/* Step 4 — Launch. */
function StepLaunch({ setup }: { setup: Setup }) {
  return (
    <Card padding="lg" className="space-y-5">
      <div className="flex items-center gap-2">
        <Rocket className="h-5 w-5 text-(--hl1)" />
        <h2 className="text-lg font-medium">Configure and Launch</h2>
      </div>
      <p className="text-[length:var(--fs-base)] leading-relaxed text-(--dim)">
        Local Studio will create a starter recipe for{" "}
        <strong className="text-(--fg)">{setup.selectedModel}</strong>, keep the safe local
        defaults, and launch it immediately.
      </p>
      <FactGrid
        variant="panel"
        columns={3}
        items={[
          { label: "Backend", value: "vLLM" },
          { label: "dtype", value: "auto", mono: true },
          { label: "KV cache dtype", value: "auto", mono: true },
          {
            label: "Review",
            value: "You can tune parallelism, context length, and memory later from Models.",
            span: "full",
          },
        ]}
      />
      {setup.starterRecipeId ? (
        <div className="font-mono text-[length:var(--fs-sm)] text-(--dim)">
          Starter recipe id: {setup.starterRecipeId}
        </div>
      ) : null}
      {setup.launchError ? <Alert variant="error">{setup.launchError}</Alert> : null}
      <div className="flex justify-end">
        <Button
          variant="primary"
          size="sm"
          onClick={() => void setup.launch()}
          disabled={setup.launching}
          icon={setup.launching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : undefined}
        >
          {setup.launching ? "Launching..." : "Configure & Launch"}
        </Button>
      </div>
    </Card>
  );
}

/* Step 5 — Benchmark. */
function StepBenchmark({ setup }: { setup: Setup }) {
  return (
    <Card padding="lg" className="space-y-5">
      <div className="flex items-center gap-2">
        <Activity className="h-5 w-5 text-(--hl1)" />
        <h2 className="text-lg font-medium">Benchmark the Running Model</h2>
      </div>
      <p className="text-[length:var(--fs-base)] leading-relaxed text-(--dim)">
        The model is ready. Run one explicit benchmark pass to confirm the device can serve real
        traffic before you drop into chat.
      </p>

      {setup.benchmarkResult ? (
        <div className="space-y-4">
          <Alert variant="success">Benchmark completed.</Alert>
          <FactGrid
            columns={4}
            items={[
              { label: "Prompt tokens", value: setup.benchmarkResult.prompt_tokens, mono: true },
              {
                label: "Completion tokens",
                value: setup.benchmarkResult.completion_tokens,
                mono: true,
              },
              { label: "Total time", value: `${setup.benchmarkResult.total_time_s}s`, mono: true },
              {
                label: "Generation TPS",
                value: setup.benchmarkResult.generation_tps,
                mono: true,
              },
            ]}
          />
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => void setup.runBenchmark()}
          disabled={setup.benchmarking}
          icon={setup.benchmarking ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : undefined}
        >
          {setup.benchmarking ? "Benchmarking..." : "Run Benchmark"}
        </Button>
        {setup.benchmarkAttempted ? (
          <>
            <Button
              variant="primary"
              size="sm"
              onClick={setup.finish}
              icon={<MessageCircle className="h-3.5 w-3.5" />}
            >
              Open Chat
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={setup.finish}
              icon={<LayoutDashboard className="h-3.5 w-3.5" />}
            >
              Open Dashboard
            </Button>
          </>
        ) : null}
      </div>
    </Card>
  );
}
