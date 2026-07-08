import { withMockLatency } from "../../../_shared/api";
import { defaultPreferences, defaultTokens } from "../fixtures";
import type { UiPreferences } from "../types";

export async function loadUserPreferences() {
  return withMockLatency({ preferences: defaultPreferences, tokens: defaultTokens }, 120);
}

export async function saveUserPreferences(preferences: UiPreferences) {
  return withMockLatency({ success: true, preferences }, 120);
}
