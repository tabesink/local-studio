"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import * as api from "../api";
import { SETUP_COMPLETE_STORAGE_KEY } from "../constants";
import type {
  BenchmarkResult,
  EngineJob,
  ModelRecommendation,
  RuntimeTargetRow,
  SetupDownload,
  SetupScenario,
  StudioDiagnostics,
  StudioSettings,
} from "../types";

/* Mirrors use-setup.ts: a plain numeric `step` state (0 Welcome → 5 Benchmark),
   REST-style calls with interval polling, completion persisted to
   localStorage["local-studio-setup-complete"]. */
export function useSetupWizard() {
  const [scenario, setScenario] = useState<SetupScenario>("happy-path");
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [settings, setSettings] = useState<StudioSettings | null>(null);
  const [diagnostics, setDiagnostics] = useState<StudioDiagnostics | null>(null);
  const [recommendations, setRecommendations] = useState<ModelRecommendation[]>([]);
  const [runtimeTargets, setRuntimeTargets] = useState<RuntimeTargetRow[]>([]);
  const [maxVramGb, setMaxVramGb] = useState(0);

  const [modelsDir, setModelsDir] = useState("/mnt/llm_models");
  const [savingSettings, setSavingSettings] = useState(false);
  const [hardwareConfirmed, setHardwareConfirmed] = useState(false);
  const [installJob, setInstallJob] = useState<EngineJob | null>(null);

  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [manualModelId, setManualModelId] = useState("");
  const [download, setDownload] = useState<SetupDownload | null>(null);

  const [launching, setLaunching] = useState(false);
  const [launchError, setLaunchError] = useState<string | null>(null);
  const [starterRecipeId, setStarterRecipeId] = useState<string | null>(null);

  const [benchmarking, setBenchmarking] = useState(false);
  const [benchmarkResult, setBenchmarkResult] = useState<BenchmarkResult | null>(null);
  const [benchmarkAttempted, setBenchmarkAttempted] = useState(false);
  const [completed, setCompleted] = useState(false);

  const downloadTimer = useRef<number | null>(null);

  const load = useCallback(async (activeScenario: SetupScenario) => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.loadSetupData(activeScenario);
      setSettings(data.settings);
      setDiagnostics(data.diagnostics);
      setRecommendations(data.recommendations);
      setRuntimeTargets(data.runtimeTargets);
      setMaxVramGb(data.maxVramGb);
      setModelsDir(data.settings.effective.models_dir);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : String(loadError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(scenario);
  }, [load, scenario]);

  /* Download progress tick (reference polls GET /studio/downloads @2000ms). */
  useEffect(() => {
    if (!download || download.status !== "downloading") return;
    const failMidway = scenario === "download-failed";
    downloadTimer.current = window.setInterval(() => {
      setDownload((current) => {
        if (!current || current.status !== "downloading") return current;
        const next = Math.min(
          current.total_bytes,
          current.downloaded_bytes + current.total_bytes * 0.09,
        );
        if (failMidway && next / current.total_bytes >= 0.4) {
          return {
            ...current,
            downloaded_bytes: next,
            status: "failed",
            error:
              "401 Unauthorized: gated repo requires an accepted license and a valid HF token.",
          };
        }
        return {
          ...current,
          downloaded_bytes: next,
          status: next >= current.total_bytes ? "completed" : "downloading",
        };
      });
    }, 900);
    return () => {
      if (downloadTimer.current !== null) window.clearInterval(downloadTimer.current);
    };
  }, [download?.status, download?.id, scenario, download]);

  const markComplete = useCallback(() => {
    try {
      window.localStorage.setItem(SETUP_COMPLETE_STORAGE_KEY, "true");
    } catch {
      /* storage unavailable */
    }
  }, []);

  const continueFromWelcome = useCallback(async () => {
    setSavingSettings(true);
    const next = await api.saveModelsDir(modelsDir);
    setSettings(next);
    setSavingSettings(false);
    setStep(1);
  }, [modelsDir]);

  const installRuntime = useCallback(async (target: RuntimeTargetRow) => {
    setInstallJob({
      id: `job-${target.backend}`,
      backend: target.backend,
      type: "install",
      status: "running",
      message: `Installing ${target.label} runtime on the active target...`,
    });
    /* Reference polls GET /runtime/jobs/{id} at 1s then 3s. */
    await new Promise((resolve) => setTimeout(resolve, 2400));
    setInstallJob((current) =>
      current ? { ...current, status: "succeeded", message: `${target.label} runtime installed.` } : current,
    );
    setRuntimeTargets((current) =>
      current.map((row) =>
        row.id === target.id
          ? { ...row, installed: true, detail: `venv managed by controller · ${row.label} ready` }
          : row,
      ),
    );
  }, []);

  const continueFromHardware = useCallback(() => {
    if (!hardwareConfirmed) return;
    setStep(2);
  }, [hardwareConfirmed]);

  const beginDownload = useCallback(
    async (modelId: string) => {
      setSelectedModel(modelId);
      const { download: started } = await api.startDownload(modelId, modelsDir);
      setDownload(started);
      setStep(3);
    },
    [modelsDir],
  );

  const pauseDownload = useCallback(() => {
    setDownload((current) => (current ? { ...current, status: "paused" } : current));
  }, []);

  const resumeDownload = useCallback(() => {
    setDownload((current) =>
      current ? { ...current, status: "downloading", error: null } : current,
    );
  }, []);

  const cancelDownload = useCallback(() => {
    setDownload((current) => (current ? { ...current, status: "canceled" } : current));
  }, []);

  const continueToLaunch = useCallback(() => {
    if (download?.status !== "completed") return;
    setStep(4);
  }, [download?.status]);

  const launch = useCallback(async () => {
    if (!selectedModel) return;
    setLaunching(true);
    setLaunchError(null);
    try {
      const result = await api.configureAndLaunch(selectedModel);
      setStarterRecipeId(result.recipeId);
      markComplete();
      setStep(5);
    } catch (launchFailure) {
      setLaunchError(launchFailure instanceof Error ? launchFailure.message : String(launchFailure));
    } finally {
      setLaunching(false);
    }
  }, [selectedModel, markComplete]);

  const runBenchmark = useCallback(async () => {
    setBenchmarking(true);
    const { benchmark } = await api.runBenchmark();
    setBenchmarkResult(benchmark);
    setBenchmarkAttempted(true);
    setBenchmarking(false);
  }, []);

  const skipSetup = useCallback(() => {
    markComplete();
    setCompleted(true);
  }, [markComplete]);

  const finish = useCallback(() => {
    markComplete();
    setCompleted(true);
  }, [markComplete]);

  const restart = useCallback(() => {
    setCompleted(false);
    setStep(0);
    setHardwareConfirmed(false);
    setSelectedModel(null);
    setManualModelId("");
    setDownload(null);
    setInstallJob(null);
    setLaunchError(null);
    setStarterRecipeId(null);
    setBenchmarkResult(null);
    setBenchmarkAttempted(false);
  }, []);

  return {
    scenario,
    setScenario: (next: SetupScenario) => {
      setScenario(next);
      restart();
    },
    step,
    setStep,
    loading,
    error,

    settings,
    diagnostics,
    recommendations,
    runtimeTargets,
    maxVramGb,

    modelsDir,
    setModelsDir,
    savingSettings,
    continueFromWelcome,

    hardwareConfirmed,
    setHardwareConfirmed,
    installJob,
    installRuntime,
    continueFromHardware,

    selectedModel,
    manualModelId,
    setManualModelId,
    beginDownload,

    download,
    pauseDownload,
    resumeDownload,
    cancelDownload,
    continueToLaunch,

    launching,
    launchError,
    starterRecipeId,
    launch,

    benchmarking,
    benchmarkResult,
    benchmarkAttempted,
    runBenchmark,

    completed,
    skipSetup,
    finish,
    restart,
  };
}
