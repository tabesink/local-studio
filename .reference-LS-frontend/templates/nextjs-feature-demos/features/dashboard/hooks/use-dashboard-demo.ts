"use client";

import { useState } from "react";
import { launchRecipe, runBenchmark } from "../api";
import { dashboardScenarios, recipeOptions, savedControllerSnapshots } from "../fixtures";
import type { DashboardScenario, DashboardSnapshot } from "../types";

export function useDashboardDemo() {
  const [scenario, setScenarioState] = useState<DashboardScenario>("running");
  const [snapshot, setSnapshot] = useState<DashboardSnapshot>(dashboardScenarios.running);
  const [benchmarking, setBenchmarking] = useState(false);
  const [launching, setLaunching] = useState(false);
  const [activeControllerUrl, setActiveControllerUrl] = useState(savedControllerSnapshots[0].url);

  function setScenario(next: DashboardScenario) {
    setScenarioState(next);
    setSnapshot(dashboardScenarios[next]);
  }

  async function onLaunch(recipeId: string) {
    const recipe = recipeOptions.find((option) => option.id === recipeId);
    setLaunching(true);
    setSnapshot((current) => ({
      ...current,
      lifecycleStatus: "starting",
      launchProgress: {
        stage: "launching",
        message: `Launching ${recipe?.name ?? recipeId}`,
        progress: 45,
      },
    }));
    await launchRecipe(recipeId);
    setSnapshot((current) => ({
      ...dashboardScenarios.running,
      logs: [...current.logs, `2026-07-08 07:46:12 INFO serving ${recipe?.name ?? recipeId}`],
    }));
    setLaunching(false);
  }

  async function onBenchmark() {
    setBenchmarking(true);
    await runBenchmark();
    setBenchmarking(false);
  }

  return {
    activeControllerUrl,
    benchmarking,
    controllers: savedControllerSnapshots,
    launching,
    onBenchmark,
    onLaunch,
    recipes: recipeOptions,
    scenario,
    setActiveControllerUrl,
    setScenario,
    snapshot,
  };
}
