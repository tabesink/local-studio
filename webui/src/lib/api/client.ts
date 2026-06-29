import { getPublicEnv } from "@/lib/config/env";
import { ApiError, normalizeFetchError } from "@/lib/api/errors";

export type ApiClientOptions = {
  baseUrl?: string;
  fetchImpl?: typeof fetch;
};

export type ApiRequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
};

export type ApiClient = {
  request: <T>(path: string, options?: ApiRequestOptions) => Promise<T>;
};

function toUrl(baseUrl: string, path: string) {
  return new URL(path, baseUrl).toString();
}

async function readBody(response: Response) {
  const contentType = response.headers.get("content-type") ?? "";

  if (response.status === 204) {
    return null;
  }

  if (!contentType.includes("application/json")) {
    const text = await response.text();
    return text.length > 0 ? text : null;
  }

  try {
    return await response.json();
  } catch (error) {
    throw new ApiError({
      kind: "parse",
      message: "API returned invalid JSON.",
      status: response.status,
      details: error,
    });
  }
}

export function createApiClient(options: ApiClientOptions = {}): ApiClient {
  const baseUrl = options.baseUrl ?? getPublicEnv().NEXT_PUBLIC_API_BASE_URL;
  const fetchImpl = options.fetchImpl ?? fetch;

  return {
    async request<T>(path: string, requestOptions: ApiRequestOptions = {}) {
      const { headers, body, ...init } = requestOptions;
      const requestHeaders = new Headers(headers);

      if (body !== undefined && !requestHeaders.has("content-type")) {
        requestHeaders.set("content-type", "application/json");
      }

      try {
        const response = await fetchImpl(toUrl(baseUrl, path), {
          ...init,
          headers: requestHeaders,
          body: body === undefined ? undefined : JSON.stringify(body),
          credentials: "include",
        });
        const payload = await readBody(response);

        if (!response.ok) {
          throw new ApiError({
            kind: "http",
            status: response.status,
            message:
              typeof payload === "object" &&
              payload !== null &&
              "message" in payload &&
              typeof payload.message === "string"
                ? payload.message
                : "API request failed.",
            details: payload,
          });
        }

        return payload as T;
      } catch (error) {
        throw normalizeFetchError(error);
      }
    },
  };
}

export function getApiClient() {
  return createApiClient();
}
