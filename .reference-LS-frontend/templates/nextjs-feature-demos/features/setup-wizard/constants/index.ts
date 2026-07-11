/* Literal step labels from setup-view/utils.ts. Order matters: Launch is
   step 4, Benchmark is the final step 5. */
export const SETUP_STEPS = ["Welcome", "Hardware", "Model", "Download", "Launch", "Benchmark"];

export const SETUP_COMPLETE_STORAGE_KEY = "local-studio-setup-complete";

/* Shell copy (setup-view.tsx). */
export const SETUP_EYEBROW = "Setup Wizard";
export const SETUP_TITLE = "Local Studio Desktop";
export const SETUP_LOADING = "Preparing your setup...";
export const CONTROLLER_UNREACHABLE_ERROR =
  "The controller is unreachable, so setup cannot start. Start it with `cd controller && bun src/main.ts` and reload this page.";

/* Welcome step copy (step-welcome.tsx). */
export const WELCOME_HEADING = "Welcome to Local Studio";
export const WELCOME_BODY =
  "This desktop wizard configures the active controller. Model files, runtime checks, and downloads happen on that controller, while this Mac stays the control surface.";

/* Hardware confirmation checkbox label (step-hardware.tsx). */
export const HARDWARE_CONFIRM_LABEL =
  "I confirmed this hardware summary matches the device I am onboarding, and the models directory has room for model downloads.";

export const RUNTIME_GROUP_TITLE = "Runtime setup";
export const RUNTIME_GROUP_DESCRIPTION =
  "Controller-managed Python environments for guided inference on the active target.";
