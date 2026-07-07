import { ApiError, normalizeApiError } from "@/lib/api/errors";

type UnauthorizedHandler = (() => void) | null;

type RequestOptions = RequestInit & {
  handleUnauthorized?: boolean;
};

const API_PREFIX = "/api/v1";
let unauthorizedHandler: UnauthorizedHandler = null;

export function setUnauthorizedHandler(handler: UnauthorizedHandler) {
  unauthorizedHandler = handler;
}

export async function ceFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const url = contextEngineApiPath(path);
  const headers = new Headers(options.headers);

  if (!headers.has("Accept")) headers.set("Accept", "application/json");
  if (options.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      credentials: "include",
      headers,
    });
  } catch {
    throw new ApiError({
      status: 0,
      code: "network_error",
      message: "Context Engine API is unavailable.",
      requestId: null,
    });
  }

  if (response.status === 204) return undefined as T;

  const body = await readSafeJson(response);
  if (!response.ok) {
    const error = normalizeApiError(response.status, body);
    if (response.status === 401 && options.handleUnauthorized !== false) {
      unauthorizedHandler?.();
    }
    throw error;
  }

  return body as T;
}

export function contextEngineApiPath(path: string): string {
  const trimmed = path.trim();
  if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith("//")) {
    throw new ApiError({
      status: 0,
      code: "invalid_api_path",
      message: "Invalid API path.",
      requestId: null,
    });
  }

  const normalized = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return normalized.startsWith(API_PREFIX) ? normalized : `${API_PREFIX}${normalized}`;
}

async function readSafeJson(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return null;
  try {
    return await response.json();
  } catch {
    return null;
  }
}
