"use client";

import { useMemo, useState } from "react";
import {
  Check,
  ChevronDown,
  ChevronRight,
  Compass,
  Copy,
  Download,
  DownloadCloud,
  ExternalLink,
  HardDrive,
  MoreVertical,
  Pause,
  Play,
  Plus,
  RefreshCw,
  Save,
  Search,
  Square,
  X,
} from "lucide-react";
import {
  Button,
  cx,
  Drawer,
  DrawerBody,
  DrawerFooter,
  DrawerHeader,
  ModelButton,
  ModelInput,
  ModelRow,
  ModelSection,
  ModelStatus,
  ModelValue,
  SegmentedControl,
  SettingsLayout,
  Tabs,
  UiModal,
  UiModalHeader,
  type SectionNavItem,
} from "../../../_shared/ui";
import {
  ENGINE_LABELS,
  ENGINE_STYLES,
  ENGINE_TABS,
  EXPLORE_LIBRARIES,
  EXPLORE_SORTS,
  EXPLORE_TASKS,
  MODEL_SECTIONS,
  RECIPE_EDITOR_TABS,
  TEMPLATE_ROWS,
} from "../constants";
import { detectedVramGb } from "../fixtures";
import { useRecipesModels } from "../hooks/use-recipes-models";
import type {
  Backend,
  ExploreModelGroup,
  ExploreVariant,
  ModelDownload,
  RecipeEditorTab,
  RecipesSection,
  RecipeWithStatus,
} from "../types";

/* Recipes / Models — mirrors features/recipes/recipes-content/*: the /recipes
   route ("Models" in the sidebar) with Search Models / Current Running Models /
   Downloads sections, recipe rows on the model-page grammar, a right-drawer
   recipe editor, and a centered delete confirmation. */

const SECTION_ICONS: Record<RecipesSection, React.ReactNode> = {
  explore: <Compass className="h-3.5 w-3.5" />,
  recipes: <HardDrive className="h-3.5 w-3.5" />,
  downloads: <Download className="h-3.5 w-3.5" />,
};

function formatBytes(bytes: number | null | undefined): string {
  if (!bytes || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const exp = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  const value = bytes / 1024 ** exp;
  return `${value >= 100 ? Math.round(value) : value.toFixed(1)} ${units[exp]}`;
}

function formatCount(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return String(value);
}

function EngineBadge({ backend }: { backend: Backend }) {
  const style = ENGINE_STYLES[backend];
  return (
    <span
      className={cx(
        "inline-flex h-5 shrink-0 items-center rounded-md px-1.5 text-[length:var(--fs-2xs)] font-medium",
        style.bg,
        style.fg,
      )}
    >
      {ENGINE_LABELS[backend]}
    </span>
  );
}

export function RecipesModelsDemo() {
  const model = useRecipesModels();

  const statusText = model.loading
    ? "syncing recipes"
    : model.refreshing
      ? "refreshing"
      : model.recipes.length > 0
        ? `${model.recipes.length} configured`
        : "stable defaults";

  const sections: SectionNavItem<RecipesSection>[] = MODEL_SECTIONS.map((section) => ({
    ...section,
    icon: SECTION_ICONS[section.id],
  }));

  return (
    <div className="relative min-h-full bg-(--ui-bg)">
      <SettingsLayout<RecipesSection>
        sections={sections}
        activeSection={model.section}
        title="Models"
        eyebrow="Model library"
        status={statusText}
        loading={model.refreshing || model.loading}
        onReload={model.reload}
        onSelectSection={model.setSection}
        refreshLabel="Refresh models"
      >
        {model.section === "recipes" ? <RecipesTab model={model} /> : null}
        {model.section === "explore" ? <ExploreTab model={model} /> : null}
        {model.section === "downloads" ? <DownloadsTab model={model} /> : null}
      </SettingsLayout>

      {model.editorOpen && model.editing ? <RecipeEditorDrawer model={model} /> : null}

      {model.deleting ? (
        <UiModal isOpen onClose={() => model.setDeleting(null)} maxWidth="max-w-md">
          <UiModalHeader title="Delete Recipe" onClose={() => model.setDeleting(null)} />
          <div className="px-6 py-4 text-[length:var(--fs-base)] text-(--ui-fg)/85">
            Are you sure you want to delete &quot;{model.deleting.name}&quot;?
          </div>
          <div className="flex justify-end gap-2 border-t border-(--ui-border) px-6 py-4">
            <Button variant="secondary" size="sm" onClick={() => model.setDeleting(null)}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" onClick={() => void model.confirmDelete()}>
              Delete
            </Button>
          </div>
        </UiModal>
      ) : null}
    </div>
  );
}

type Model = ReturnType<typeof useRecipesModels>;

/* ───────────────────── Current Running Models ───────────────────── */

function RecipesTab({ model }: { model: Model }) {
  const activeName =
    model.runningRecipe?.served_model_name ?? model.runningRecipe?.name ?? null;
  return (
    <div className="space-y-8">
      <ModelSection title="Models">
        <ModelRow
          label="Search recipes"
          control={
            <div className="relative">
              <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-(--ui-muted)" />
              <ModelInput
                value={model.filter}
                onChange={model.setFilter}
                placeholder="Search recipes, paths, served names"
                className="pl-7"
              />
            </div>
          }
          status={
            <ModelStatus tone="default">
              {model.filter ? `${model.visibleRecipes.length} rows` : "defaults"}
            </ModelStatus>
          }
          actions={
            <ModelButton tone="primary" onClick={() => model.openEditor(null)}>
              <Plus className="h-3.5 w-3.5" />
              New
            </ModelButton>
          }
        />
        <ModelRow
          label="Active model"
          value={
            activeName ? (
              <ModelValue mono>{activeName}</ModelValue>
            ) : (
              <ModelValue dim>No active launch</ModelValue>
            )
          }
          status={
            <ModelStatus tone={activeName ? "good" : "default"}>
              {activeName ? "live" : "idle"}
            </ModelStatus>
          }
          actions={
            activeName ? (
              <ModelButton tone="danger" onClick={() => void model.stopActive()} title="Stop">
                <Square className="h-3.5 w-3.5" />
                Stop
              </ModelButton>
            ) : undefined
          }
        >
          {model.launchProgress?.message ? (
            <div className="font-mono text-[length:var(--fs-xs)] text-(--ui-muted)">
              {model.launchProgress.message}
            </div>
          ) : null}
        </ModelRow>
      </ModelSection>

      <ModelSection title="Launch recipes">
        {model.loading ? (
          <ModelRow
            label="Controller sync"
            description="Loading controller recipe rows…"
            status={<ModelStatus tone="info">syncing</ModelStatus>}
          />
        ) : model.visibleRecipes.length === 0 && !model.filter ? (
          TEMPLATE_ROWS.map((row) => (
            <ModelRow
              key={row.name}
              label={row.name}
              description={row.description}
              value={<ModelValue mono dim>{row.description}</ModelValue>}
              status={<ModelStatus tone="default">template</ModelStatus>}
              actions={
                <ModelButton tone="primary" onClick={() => model.openEditor(null)}>
                  <Plus className="h-3.5 w-3.5" />
                  Use
                </ModelButton>
              }
            />
          ))
        ) : model.visibleRecipes.length === 0 ? (
          <ModelRow
            label="No matches"
            description={`No exact match for "${model.filter}".`}
            status={<ModelStatus tone="default">0 rows</ModelStatus>}
          />
        ) : (
          model.visibleRecipes.map((recipe) => <RecipeRow key={recipe.id} recipe={recipe} model={model} />)
        )}
      </ModelSection>
    </div>
  );
}

function RecipeRow({ recipe, model }: { recipe: RecipeWithStatus; model: Model }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const modelName = recipe.served_model_name ?? recipe.model_path.split("/").pop() ?? "";
  const context =
    recipe.max_model_len > 0 ? `${formatCount(recipe.max_model_len)} ctx` : "ctx auto";
  const running = recipe.status === "running";
  const tone =
    recipe.status === "running"
      ? ("good" as const)
      : recipe.status === "starting"
        ? ("info" as const)
        : recipe.status === "error"
          ? ("danger" as const)
          : ("default" as const);
  const launchLocked = model.launching || Boolean(model.runningRecipe && !running);
  const pinned = model.pinnedIds.includes(recipe.id);

  return (
    <ModelRow
      label={recipe.name}
      description={`${modelName} · ${context}`}
      value={
        <div className="flex min-w-0 items-center gap-2">
          <EngineBadge backend={recipe.backend} />
          <span className="truncate font-mono text-[length:var(--fs-sm)] text-(--ui-muted)">
            tp/pp {recipe.tensor_parallel_size}/{recipe.pipeline_parallel_size}
          </span>
          {recipe.quantization ? (
            <span className="rounded bg-(--surface-2) px-1.5 py-0.5 text-[length:var(--fs-2xs)] text-(--dim)">
              {recipe.quantization}
            </span>
          ) : null}
        </div>
      }
      status={<ModelStatus tone={tone}>{recipe.status}</ModelStatus>}
      actions={
        <>
          {running ? (
            <ModelButton tone="danger" onClick={() => void model.stopActive()} title="Stop">
              <Square className="h-3.5 w-3.5" />
            </ModelButton>
          ) : (
            <ModelButton
              tone="primary"
              onClick={() => void model.launch(recipe)}
              disabled={launchLocked}
              title={
                model.launching
                  ? "A launch is already in progress."
                  : model.runningRecipe
                    ? "Stop the running model before launching another recipe."
                    : "Launch"
              }
            >
              <Play className="h-3.5 w-3.5" />
            </ModelButton>
          )}
          <div className="relative">
            <ModelButton onClick={() => setMenuOpen((open) => !open)} title="More">
              <MoreVertical className="h-3.5 w-3.5" />
            </ModelButton>
            {menuOpen ? (
              <div className="absolute right-0 top-7 z-20 w-48 overflow-hidden rounded-md border border-(--ui-border) bg-(--color-menu) py-1 shadow-lg">
                <MenuItem
                  label={pinned ? "Unpin" : "Pin"}
                  onClick={() => {
                    model.togglePin(recipe.id);
                    setMenuOpen(false);
                  }}
                />
                <MenuItem
                  label="Edit"
                  onClick={() => {
                    model.openEditor(recipe);
                    setMenuOpen(false);
                  }}
                />
                <MenuItem label="Attach to local agents…" onClick={() => setMenuOpen(false)} />
                <div className="mt-1 border-t border-(--ui-border) pt-1">
                  <MenuItem
                    label="Delete recipe..."
                    destructive
                    onClick={() => {
                      model.setDeleting(recipe);
                      setMenuOpen(false);
                    }}
                  />
                </div>
              </div>
            ) : null}
          </div>
        </>
      }
    />
  );
}

function MenuItem({
  label,
  onClick,
  destructive = false,
}: {
  label: string;
  onClick: () => void;
  destructive?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        "block w-full px-3 py-1.5 text-left text-[length:var(--fs-sm)] transition-colors",
        destructive
          ? "text-(--color-destructive) hover:bg-(--color-destructive)/10"
          : "text-(--ui-fg)/85 hover:bg-(--ui-hover)",
      )}
    >
      {label}
    </button>
  );
}

/* ───────────────────────── Search Models ───────────────────────── */

function ExploreTab({ model }: { model: Model }) {
  const [task, setTask] = useState(EXPLORE_TASKS[0].value);
  const [library, setLibrary] = useState(EXPLORE_LIBRARIES[0].value);
  const [sort, setSort] = useState(EXPLORE_SORTS[0].value);
  const [pool, setPool] = useState<string>("");

  const poolGb = pool.trim() ? Number(pool) : detectedVramGb;

  return (
    <div className="space-y-8">
      <ModelSection title="Explore controls">
        <ModelRow
          label="Search Hugging Face"
          control={
            <div className="relative">
              <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-(--ui-muted)" />
              <ModelInput
                value={model.exploreQuery}
                onChange={(value) => void model.runExploreSearch(value)}
                placeholder="Search Hugging Face models"
                className="pl-7"
              />
            </div>
          }
          actions={
            <ModelButton title="Refresh results" onClick={() => void model.runExploreSearch(model.exploreQuery)}>
              <RefreshCw className={cx("h-3.5 w-3.5", model.exploreLoading ? "animate-spin" : "")} />
            </ModelButton>
          }
        />
        <ModelRow
          label="Filters"
          control={
            <div className="flex flex-wrap items-center gap-3">
              <ExploreSelect label="Task" value={task} onChange={setTask} options={EXPLORE_TASKS} />
              <ExploreSelect
                label="Library"
                value={library}
                onChange={setLibrary}
                options={EXPLORE_LIBRARIES}
              />
              <ExploreSelect label="Sort" value={sort} onChange={setSort} options={EXPLORE_SORTS} />
            </div>
          }
        />
        <ModelRow
          label="VRAM pool"
          description="Estimates compare model weights against this budget."
          control={
            <ModelInput value={pool} onChange={setPool} placeholder={`${detectedVramGb}`} className="w-24" />
          }
          status={<ModelStatus tone="default">{pool.trim() ? `${pool} GB` : "auto"}</ModelStatus>}
          actions={
            pool.trim() ? (
              <ModelButton onClick={() => setPool("")} title="Reset to detected VRAM">
                Auto
              </ModelButton>
            ) : undefined
          }
        />
      </ModelSection>

      <ModelSection title="Model results">
        {model.groups.length === 0 ? (
          <ModelRow
            label="No results"
            description={`No exact match yet for "${model.exploreQuery}".`}
            status={<ModelStatus tone="default">fallback</ModelStatus>}
          />
        ) : (
          model.groups.map((group) => (
            <ExploreGroupRows key={group.key} group={group} model={model} poolGb={poolGb} />
          ))
        )}
      </ModelSection>
    </div>
  );
}

function ExploreSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <label className="flex items-center gap-1.5">
      <span className="text-[length:var(--fs-xs)] text-(--color-foreground-subtle)">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-7 rounded-md border border-(--ui-separator) bg-(--ui-bg) px-1.5 text-[length:var(--fs-sm)] text-(--ui-fg) outline-none focus:border-(--ui-info)/50"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function ExploreGroupRows({
  group,
  model,
  poolGb,
}: {
  group: ExploreModelGroup;
  model: Model;
  poolGb: number;
}) {
  const expanded = Boolean(model.expandedGroups[group.key]);
  return (
    <>
      <ExploreModelRow
        variant={group.lead}
        model={model}
        poolGb={poolGb}
        fits={group.fits}
        isLead
        expandable={group.variants.length > 0}
        expanded={expanded}
        onToggle={() => model.toggleGroup(group.key)}
      />
      {expanded
        ? group.variants.map((variant) => (
            <ExploreModelRow
              key={variant.modelId}
              variant={variant}
              model={model}
              poolGb={poolGb}
              fits={variant.needGb <= poolGb}
              className="pl-6"
            />
          ))
        : null}
    </>
  );
}

function ExploreModelRow({
  variant,
  model,
  poolGb,
  fits,
  isLead = false,
  expandable = false,
  expanded = false,
  onToggle,
  className,
}: {
  variant: ExploreVariant;
  model: Model;
  poolGb: number;
  fits: boolean;
  isLead?: boolean;
  expandable?: boolean;
  expanded?: boolean;
  onToggle?: () => void;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const stateTone =
    variant.state === "local"
      ? ("good" as const)
      : variant.state === "downloading" || variant.state === "starting"
        ? ("info" as const)
        : variant.state === "failed"
          ? ("danger" as const)
          : variant.state === "paused"
            ? ("warning" as const)
            : ("default" as const);

  return (
    <ModelRow
      className={className}
      label={variant.modelId}
      description={`~${variant.needGb.toFixed(1)} / ${poolGb} GB · ${formatCount(variant.downloads)} downloads · ${formatCount(variant.likes)} likes`}
      highlight={fits ? "success" : "none"}
      value={
        <ModelValue mono dim>
          {variant.quant ?? (isLead ? "original" : "derivative")}
        </ModelValue>
      }
      status={<ModelStatus tone={stateTone}>{variant.state}</ModelStatus>}
      actions={
        <>
          {expandable ? (
            <ModelButton onClick={onToggle} title={expanded ? "Collapse variants" : "Expand variants"}>
              {expanded ? (
                <ChevronDown className="h-3.5 w-3.5" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5" />
              )}
            </ModelButton>
          ) : null}
          <ModelButton
            onClick={() => {
              void navigator.clipboard?.writeText(variant.modelId).catch(() => undefined);
              setCopied(true);
              window.setTimeout(() => setCopied(false), 1200);
            }}
            title="Copy model id"
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          </ModelButton>
          {variant.state === "remote" ? (
            <ModelButton tone="primary" onClick={() => void model.downloadModel(variant.modelId)}>
              <DownloadCloud className="h-3.5 w-3.5" />
              Download
            </ModelButton>
          ) : null}
          <ModelButton title="Open on Hugging Face">
            <ExternalLink className="h-3.5 w-3.5" />
          </ModelButton>
        </>
      }
    />
  );
}

/* ─────────────────────────── Downloads ─────────────────────────── */

function downloadProgressText(download: ModelDownload): string {
  const total = download.total_bytes ?? 0;
  const progress = total > 0 ? Math.round((download.downloaded_bytes / total) * 100) : 0;
  const parts = [`${formatBytes(download.downloaded_bytes)} / ${formatBytes(total)} · ${progress}%`];
  if (download.status === "downloading" && download.speed_bytes_per_second) {
    parts.push(`${formatBytes(download.speed_bytes_per_second)}/s`);
  }
  if (download.status === "completed" && download.completed_at) {
    parts.push(`done ${new Date(download.completed_at).toLocaleTimeString()}`);
  }
  return parts.join(" · ");
}

function DownloadsTab({ model }: { model: Model }) {
  return (
    <ModelSection title="Downloads">
      {model.downloads.length === 0 ? (
        <ModelRow
          label="No downloads"
          description="Queue is empty"
          value={<ModelValue dim>Click Download from Search Models to populate this section.</ModelValue>}
          status={<ModelStatus tone="default">idle</ModelStatus>}
        />
      ) : (
        model.downloads.map((download) => {
          const tone =
            download.status === "failed"
              ? ("danger" as const)
              : download.status === "downloading"
                ? ("info" as const)
                : download.status === "completed"
                  ? ("good" as const)
                  : download.status === "paused"
                    ? ("warning" as const)
                    : ("default" as const);
          return (
            <ModelRow
              key={download.id}
              label={download.model_id}
              description={`${download.source ?? "Hugging Face"} · ${download.target_dir}`}
              value={<ModelValue mono>{downloadProgressText(download)}</ModelValue>}
              status={<ModelStatus tone={tone}>{download.status}</ModelStatus>}
              actions={
                <>
                  {download.status === "downloading" ? (
                    <ModelButton
                      onClick={() => void model.downloadAction(download.id, "pause")}
                      title="Pause"
                    >
                      <Pause className="h-3.5 w-3.5" />
                    </ModelButton>
                  ) : null}
                  {download.status === "paused" || download.status === "failed" ? (
                    <ModelButton
                      tone="primary"
                      onClick={() => void model.downloadAction(download.id, "resume")}
                      title="Retry"
                    >
                      <Play className="h-3.5 w-3.5" />
                      Retry
                    </ModelButton>
                  ) : null}
                  {download.status !== "completed" && download.status !== "canceled" ? (
                    <ModelButton
                      tone="danger"
                      onClick={() => void model.downloadAction(download.id, "cancel")}
                      title="Cancel"
                    >
                      <X className="h-3.5 w-3.5" />
                    </ModelButton>
                  ) : null}
                </>
              }
            >
              {download.error ? (
                <div className="text-[length:var(--fs-sm)] text-(--err)">{download.error}</div>
              ) : null}
            </ModelRow>
          );
        })
      )}
    </ModelSection>
  );
}

/* ───────────────────────── Recipe editor ───────────────────────── */

function RecipeEditorDrawer({ model }: { model: Model }) {
  const recipe = model.editing!;
  const isNew = !model.recipes.some((row) => row.id === recipe.id);
  const [tab, setTab] = useState<RecipeEditorTab>("general");
  const tabs = useMemo(
    () =>
      RECIPE_EDITOR_TABS.filter((entry) => ENGINE_TABS[recipe.backend].includes(entry.id)).map(
        (entry) => ({ id: entry.id, label: entry.label }),
      ),
    [recipe.backend],
  );

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <button
        type="button"
        aria-label="Close editor"
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={model.closeEditor}
      />
      <Drawer width={880} className="relative z-10 h-full">
        <DrawerHeader
          title={isNew ? "New recipe" : recipe.name}
          badge={<EngineBadge backend={recipe.backend} />}
          onClose={model.closeEditor}
        />
        <DrawerBody className="space-y-4">
          {/* Summary card: identity + engine choice. */}
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-(--ui-border) bg-(--ui-surface)/60 p-4">
            <div className="min-w-0">
              <div className="truncate text-[length:var(--fs-lg)] font-medium text-(--ui-fg)">
                {recipe.name || "Untitled recipe"}
              </div>
              <div className="mt-0.5 truncate font-mono text-[length:var(--fs-sm)] text-(--ui-muted)">
                {recipe.model_path || "No model path yet"}
              </div>
            </div>
            <div className="shrink-0">
              <div className="mb-1 text-[length:var(--fs-xs)] uppercase tracking-[0.12em] text-(--ui-muted)">
                Engine
              </div>
              <SegmentedControl<Backend>
                size="sm"
                items={[
                  { id: "vllm", label: "vLLM" },
                  { id: "sglang", label: "SGLang" },
                  { id: "llamacpp", label: "llama.cpp" },
                  { id: "mlx", label: "MLX" },
                ]}
                value={recipe.backend}
                onChange={(backend) => {
                  model.setEditingBackend(backend);
                  if (!ENGINE_TABS[backend].includes(tab)) setTab("general");
                }}
              />
            </div>
          </div>

          <Tabs<RecipeEditorTab> variant="pill" items={tabs} activeTab={tab} onSelectTab={setTab} />

          {tab === "general" ? (
            <div className="space-y-3">
              <EditorField label="Recipe Name *">
                <ModelInput
                  value={recipe.name}
                  onChange={(name) => model.patchEditing({ name })}
                  placeholder="My launch recipe"
                />
              </EditorField>
              <EditorField label="Model Path *">
                <ModelInput
                  value={recipe.model_path}
                  onChange={(model_path) => model.patchEditing({ model_path })}
                  placeholder="/mnt/llm_models/..."
                />
              </EditorField>
              <div className="grid grid-cols-2 gap-3">
                <EditorField label="Host">
                  <ModelInput
                    value={recipe.host}
                    onChange={(host) => model.patchEditing({ host })}
                    placeholder="0.0.0.0"
                  />
                </EditorField>
                <EditorField label="Port">
                  <ModelInput
                    value={String(recipe.port)}
                    onChange={(port) => model.patchEditing({ port: Number(port) || 0 })}
                    placeholder="8000"
                  />
                </EditorField>
              </div>
              <EditorField label="Served Model Name">
                <ModelInput
                  value={recipe.served_model_name ?? ""}
                  onChange={(value) => model.patchEditing({ served_model_name: value || null })}
                  placeholder="model name exposed on /v1/models"
                />
              </EditorField>
            </div>
          ) : (
            <SimplifiedEditorTab tab={tab} recipe={recipe} model={model} />
          )}
        </DrawerBody>
        <DrawerFooter status={isNew ? "Creating new recipe" : `Editing ${recipe.name}`}>
          <Button variant="ghost" size="sm" onClick={model.closeEditor}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => void model.saveEditing()}
            disabled={model.saving || !recipe.name || !recipe.model_path}
            icon={
              model.saving ? (
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Save className="h-3.5 w-3.5" />
              )
            }
          >
            {model.saving ? "Saving..." : "Save recipe"}
          </Button>
        </DrawerFooter>
      </Drawer>
    </div>
  );
}

function EditorField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="mb-1 text-[length:var(--fs-sm)] text-(--ui-muted)">{label}</div>
      {children}
    </label>
  );
}

/* Non-general tabs render the representative field groups; the reference has
   ~130 editor fields — see docs/feature-parity/recipes-models.md for the map. */
function SimplifiedEditorTab({
  tab,
  recipe,
  model,
}: {
  tab: RecipeEditorTab;
  recipe: RecipeWithStatus;
  model: Model;
}) {
  if (tab === "resources") {
    return (
      <div className="grid grid-cols-2 gap-3">
        <EditorField label="Tensor Parallel Size">
          <ModelInput
            value={String(recipe.tensor_parallel_size)}
            onChange={(value) => model.patchEditing({ tensor_parallel_size: Number(value) || 1 })}
          />
        </EditorField>
        <EditorField label="Pipeline Parallel Size">
          <ModelInput
            value={String(recipe.pipeline_parallel_size)}
            onChange={(value) => model.patchEditing({ pipeline_parallel_size: Number(value) || 1 })}
          />
        </EditorField>
        <EditorField label="GPU Memory Utilization">
          <ModelInput
            value={String(recipe.gpu_memory_utilization)}
            onChange={(value) =>
              model.patchEditing({ gpu_memory_utilization: Number(value) || 0.9 })
            }
          />
        </EditorField>
        <EditorField label="KV Cache dtype">
          <ModelInput
            value={recipe.kv_cache_dtype}
            onChange={(kv_cache_dtype) => model.patchEditing({ kv_cache_dtype })}
          />
        </EditorField>
      </div>
    );
  }
  if (tab === "model") {
    return (
      <div className="grid grid-cols-2 gap-3">
        <EditorField label="Max Model Length">
          <ModelInput
            value={String(recipe.max_model_len)}
            onChange={(value) => model.patchEditing({ max_model_len: Number(value) || 0 })}
          />
        </EditorField>
        <EditorField label="dtype">
          <ModelInput
            value={recipe.dtype ?? "auto"}
            onChange={(dtype) => model.patchEditing({ dtype })}
          />
        </EditorField>
        <EditorField label="Quantization">
          <ModelInput
            value={recipe.quantization ?? ""}
            onChange={(value) => model.patchEditing({ quantization: value || null })}
            placeholder="awq, gptq, Q4_K_M..."
          />
        </EditorField>
        <EditorField label="Max Num Seqs">
          <ModelInput
            value={String(recipe.max_num_seqs)}
            onChange={(value) => model.patchEditing({ max_num_seqs: Number(value) || 0 })}
          />
        </EditorField>
      </div>
    );
  }
  if (tab === "command") {
    return (
      <div className="rounded-md border border-(--ui-border) bg-(--ui-surface)/50 p-3 font-mono text-[length:var(--fs-sm)] leading-relaxed text-(--ui-fg)/80">
        {ENGINE_LABELS[recipe.backend].toLowerCase().replace(".", "")} serve {recipe.model_path || "<model_path>"}{" "}
        --host {recipe.host} --port {recipe.port} --tensor-parallel-size {recipe.tensor_parallel_size}{" "}
        --max-model-len {recipe.max_model_len}
        {recipe.served_model_name ? ` --served-model-name ${recipe.served_model_name}` : ""}
      </div>
    );
  }
  return (
    <div className="rounded-md border border-(--ui-border) bg-(--ui-hover)/30 px-3 py-2 text-[length:var(--fs-sm)] text-(--ui-muted)">
      {tab === "performance"
        ? "Scheduler, speculative decoding, and throughput knobs live here in the reference (tab-performance.tsx)."
        : tab === "features"
          ? "Tool calling, reasoning parsers, and chat template options live here in the reference (tab-features.tsx)."
          : "Environment variables and visible-devices strings live here in the reference (tab-environment.tsx)."}
    </div>
  );
}
