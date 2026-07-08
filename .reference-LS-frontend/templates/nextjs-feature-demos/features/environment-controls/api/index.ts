import { delay, withMockLatency } from "../../../_shared/api";
import { apiConnectionSettings, controllerEntries } from "../fixtures";
import type { ApiConnectionSettings, ControllerEntry } from "../types";

export function normalizeControllerUrl(url: string): string {
  const trimmed = url.trim().replace(/\/+$/, "");
  if (!trimmed) return "";
  try {
    const parsed = new URL(trimmed);
    parsed.pathname = parsed.pathname.replace(/\/v1\/?$/i, "") || "/";
    parsed.search = "";
    parsed.hash = "";
    return parsed.toString().replace(/\/+$/, "");
  } catch {
    return trimmed.replace(/\/v1\/?$/i, "").replace(/\/+$/, "");
  }
}

export async function loadEnvironmentSettings() {
  return withMockLatency({ settings: apiConnectionSettings, controllers: controllerEntries }, 200);
}

export async function testController(url: string) {
  await delay(300);
  const normalized = normalizeControllerUrl(url);
  if (!normalized) return { status: "error" as const, message: "Missing API URL" };
  if (normalized.includes("192.168.1.70")) return { status: "error" as const, message: "Request timeout after 10000ms" };
  return { status: "connected" as const, message: "Connected" };
}

export async function saveEnvironmentSettings(settings: ApiConnectionSettings, controllers: ControllerEntry[]) {
  await delay(250);
  return { success: true, settings, controllers };
}
