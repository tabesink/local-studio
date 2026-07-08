import type { Backend, RecipeEditorTab, RecipesSection } from "../types";

/* Sidebar sections — literal ids/labels/descriptions from
   recipes-content-view.tsx MODEL_SECTIONS. Icons are attached in the
   component layer (Compass / HardDrive / Download). */
export const MODEL_SECTIONS: Array<{
  id: RecipesSection;
  label: string;
  description: string;
}> = [
  {
    id: "explore",
    label: "Search Models",
    description: "Base model search; derivatives expand under family",
  },
  {
    id: "recipes",
    label: "Current Running Models",
    description: "Local launch recipes, running state, engine actions",
  },
  {
    id: "downloads",
    label: "Downloads",
    description: "Download queue, progress, retry, cancel",
  },
];

/* Engine badge styling — node-taxonomy tokens per backend, same mapping as
   engineNodeStyle() in the reference. */
export const ENGINE_LABELS: Record<Backend, string> = {
  vllm: "vLLM",
  sglang: "SGLang",
  llamacpp: "llama.cpp",
  mlx: "MLX",
};

export const ENGINE_STYLES: Record<Backend, { bg: string; fg: string }> = {
  vllm: { bg: "bg-(--color-command-node)", fg: "text-(--color-command-node-foreground)" },
  sglang: { bg: "bg-(--color-file-node)", fg: "text-(--color-file-node-foreground)" },
  llamacpp: { bg: "bg-(--color-skill-node)", fg: "text-(--color-skill-node-foreground)" },
  mlx: { bg: "bg-(--color-subagent-node)", fg: "text-(--color-subagent-node-foreground)" },
};

export const RECIPE_EDITOR_TABS: Array<{ id: RecipeEditorTab; label: string }> = [
  { id: "general", label: "General" },
  { id: "model", label: "Model" },
  { id: "resources", label: "Resources" },
  { id: "performance", label: "Performance" },
  { id: "features", label: "Features" },
  { id: "environment", label: "Environment" },
  { id: "command", label: "Command" },
];

/* MLX drops Resources/Performance (engine-capabilities.ts). */
export const ENGINE_TABS: Record<Backend, RecipeEditorTab[]> = {
  vllm: ["general", "model", "resources", "performance", "features", "environment", "command"],
  sglang: ["general", "model", "resources", "performance", "features", "environment", "command"],
  llamacpp: ["general", "model", "resources", "performance", "features", "environment", "command"],
  mlx: ["general", "model", "features", "environment", "command"],
};

export const EXPLORE_TASKS = [
  { value: "text-generation", label: "Text generation" },
  { value: "image-text-to-text", label: "Vision LM" },
  { value: "any", label: "Any task" },
];

export const EXPLORE_LIBRARIES = [
  { value: "safetensors", label: "Safetensors" },
  { value: "gguf", label: "GGUF" },
  { value: "mlx", label: "MLX" },
  { value: "any", label: "Any library" },
];

export const EXPLORE_SORTS = [
  { value: "downloads", label: "Most downloads" },
  { value: "likes", label: "Most likes" },
  { value: "lastModified", label: "Recently updated" },
];

export const PINNED_RECIPES_STORAGE_KEY = "local-studio-pinned-recipes";

/* Zero-recipes template rows (RecipesTable TEMPLATE_ROWS). */
export const TEMPLATE_ROWS = [
  { name: "vLLM default", description: "backend vLLM · tp/pp 1/1", status: "template" },
  { name: "SGLang server", description: "backend SGLang · metrics ready", status: "template" },
  { name: "llama.cpp local", description: "backend llama.cpp · local path", status: "template" },
];
