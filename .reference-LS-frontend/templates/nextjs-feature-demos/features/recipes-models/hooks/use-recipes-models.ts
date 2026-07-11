"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as api from "../api";
import { PINNED_RECIPES_STORAGE_KEY } from "../constants";
import { exploreGroupFixtures } from "../fixtures";
import type {
  Backend,
  ExploreModelGroup,
  LaunchProgress,
  ModelDownload,
  RecipesSection,
  RecipeWithStatus,
} from "../types";

function readPinnedIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(PINNED_RECIPES_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === "string") : [];
  } catch {
    return [];
  }
}

export function useRecipesModels() {
  const [section, setSection] = useState<RecipesSection>("recipes");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [recipes, setRecipes] = useState<RecipeWithStatus[]>([]);
  const [downloads, setDownloads] = useState<ModelDownload[]>([]);
  const [groups, setGroups] = useState<ExploreModelGroup[]>(exploreGroupFixtures);

  const [filter, setFilter] = useState("");
  const [exploreQuery, setExploreQuery] = useState("");
  const [exploreLoading, setExploreLoading] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  const [pinnedIds, setPinnedIds] = useState<string[]>(readPinnedIds);
  const [launchProgress, setLaunchProgress] = useState<LaunchProgress | null>(null);
  const [launching, setLaunching] = useState(false);

  const [editing, setEditing] = useState<RecipeWithStatus | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [deleting, setDeleting] = useState<RecipeWithStatus | null>(null);
  const [saving, setSaving] = useState(false);

  const launchToken = useRef(0);

  const load = useCallback(async (asRefresh = false) => {
    if (asRefresh) setRefreshing(true);
    const [{ recipes: recipeList }, { downloads: downloadList }] = await Promise.all([
      api.getRecipes(),
      api.getDownloads(),
    ]);
    setRecipes(recipeList);
    setDownloads(downloadList);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  /* Downloads poll (reference: useDownloads, 2500ms) — here a fixture tick
     that advances active downloads so progress text moves. */
  useEffect(() => {
    const timer = window.setInterval(() => {
      setDownloads((current) =>
        current.map((download) => {
          if (download.status !== "downloading" || !download.total_bytes) return download;
          const speed = download.speed_bytes_per_second ?? 90_000_000;
          const next = Math.min(download.total_bytes, download.downloaded_bytes + speed * 2.5);
          const done = next >= download.total_bytes;
          return {
            ...download,
            downloaded_bytes: next,
            status: done ? "completed" : "downloading",
            completed_at: done ? new Date().toISOString() : null,
            updated_at: new Date().toISOString(),
          };
        }),
      );
    }, 2500);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(PINNED_RECIPES_STORAGE_KEY, JSON.stringify(pinnedIds));
    } catch {
      /* storage unavailable */
    }
  }, [pinnedIds]);

  const runningRecipe = useMemo(
    () => recipes.find((recipe) => recipe.status === "running") ?? null,
    [recipes],
  );

  /* Pinned-first, then alphabetical; filter across name/path/served name. */
  const visibleRecipes = useMemo(() => {
    const needle = filter.trim().toLowerCase();
    const filtered = needle
      ? recipes.filter((recipe) =>
          [recipe.name, recipe.model_path, recipe.served_model_name ?? ""]
            .join(" ")
            .toLowerCase()
            .includes(needle),
        )
      : recipes;
    return [...filtered].sort((a, b) => {
      const aPinned = pinnedIds.includes(a.id) ? 0 : 1;
      const bPinned = pinnedIds.includes(b.id) ? 0 : 1;
      if (aPinned !== bPinned) return aPinned - bPinned;
      return a.name.localeCompare(b.name);
    });
  }, [recipes, filter, pinnedIds]);

  const togglePin = useCallback((recipeId: string) => {
    setPinnedIds((current) =>
      current.includes(recipeId)
        ? current.filter((id) => id !== recipeId)
        : [...current, recipeId],
    );
  }, []);

  const launch = useCallback(
    async (recipe: RecipeWithStatus) => {
      if (launching || runningRecipe) return;
      setLaunching(true);
      const token = ++launchToken.current;
      setRecipes((current) =>
        current.map((row) => (row.id === recipe.id ? { ...row, status: "starting" } : row)),
      );
      for await (const progress of api.launchRecipe(recipe)) {
        if (token !== launchToken.current) return;
        setLaunchProgress(progress);
        if (progress.stage === "ready") {
          setRecipes((current) =>
            current.map((row) => (row.id === recipe.id ? { ...row, status: "running" } : row)),
          );
        }
      }
      setLaunching(false);
      window.setTimeout(() => setLaunchProgress(null), 2600);
    },
    [launching, runningRecipe],
  );

  const stopActive = useCallback(async () => {
    if (!runningRecipe) return;
    const stoppingId = runningRecipe.id;
    await api.stopActiveModel();
    setRecipes((current) =>
      current.map((row) => (row.id === stoppingId ? { ...row, status: "stopped" } : row)),
    );
  }, [runningRecipe]);

  const openEditor = useCallback((recipe: RecipeWithStatus | null) => {
    setEditing(
      recipe ?? {
        id: `recipe-${Date.now().toString(36)}`,
        name: "",
        model_path: "",
        backend: "vllm",
        tensor_parallel_size: 1,
        pipeline_parallel_size: 1,
        max_model_len: 32768,
        gpu_memory_utilization: 0.9,
        kv_cache_dtype: "auto",
        max_num_seqs: 256,
        trust_remote_code: true,
        quantization: null,
        dtype: "auto",
        host: "0.0.0.0",
        port: 8000,
        served_model_name: null,
        env_vars: null,
        extra_args: {},
        status: "stopped",
      },
    );
    setEditorOpen(true);
  }, []);

  const patchEditing = useCallback((patch: Partial<RecipeWithStatus>) => {
    setEditing((current) => (current ? { ...current, ...patch } : current));
  }, []);

  const setEditingBackend = useCallback((backend: Backend) => {
    setEditing((current) => (current ? { ...current, backend } : current));
  }, []);

  const saveEditing = useCallback(async () => {
    if (!editing) return;
    setSaving(true);
    await api.saveRecipe(editing);
    setRecipes((current) => {
      const exists = current.some((row) => row.id === editing.id);
      return exists
        ? current.map((row) => (row.id === editing.id ? editing : row))
        : [...current, editing];
    });
    setSaving(false);
    setEditorOpen(false);
    setEditing(null);
  }, [editing]);

  const confirmDelete = useCallback(async () => {
    if (!deleting) return;
    await api.deleteRecipe(deleting.id);
    setRecipes((current) => current.filter((row) => row.id !== deleting.id));
    setDeleting(null);
  }, [deleting]);

  const runExploreSearch = useCallback(async (query: string) => {
    setExploreQuery(query);
    setExploreLoading(true);
    const { groups: results } = await api.searchModels(query);
    setGroups(results);
    setExploreLoading(false);
  }, []);

  const toggleGroup = useCallback((key: string) => {
    setExpandedGroups((current) => ({ ...current, [key]: !current[key] }));
  }, []);

  const downloadModel = useCallback(async (modelId: string) => {
    const { download } = await api.startDownload(modelId);
    setDownloads((current) =>
      current.some((row) => row.id === download.id) ? current : [download, ...current],
    );
  }, []);

  const downloadAction = useCallback(
    async (id: string, action: "pause" | "resume" | "cancel") => {
      if (action === "pause") await api.pauseDownload(id);
      if (action === "resume") await api.resumeDownload(id);
      if (action === "cancel") await api.cancelDownload(id);
      setDownloads((current) =>
        current.map((download) => {
          if (download.id !== id) return download;
          if (action === "pause") return { ...download, status: "paused" };
          if (action === "resume") return { ...download, status: "downloading", error: null };
          return { ...download, status: "canceled" };
        }),
      );
    },
    [],
  );

  return {
    section,
    setSection,
    loading,
    refreshing,
    reload: () => void load(true),

    recipes,
    visibleRecipes,
    runningRecipe,
    filter,
    setFilter,
    pinnedIds,
    togglePin,
    launch,
    launching,
    launchProgress,
    stopActive,

    editing,
    editorOpen,
    openEditor,
    closeEditor: () => {
      setEditorOpen(false);
      setEditing(null);
    },
    patchEditing,
    setEditingBackend,
    saveEditing,
    saving,
    deleting,
    setDeleting,
    confirmDelete,

    groups,
    exploreQuery,
    exploreLoading,
    runExploreSearch,
    expandedGroups,
    toggleGroup,
    downloadModel,

    downloads,
    downloadAction,
  };
}
