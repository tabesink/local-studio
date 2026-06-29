export type ApiFailureKind =
  | "http"
  | "network"
  | "abort"
  | "parse"
  | "unknown";

export class ApiError extends Error {
  readonly kind: ApiFailureKind;
  readonly status?: number;
  readonly details?: unknown;

  constructor({
    kind,
    message,
    status,
    details,
  }: {
    kind: ApiFailureKind;
    message: string;
    status?: number;
    details?: unknown;
  }) {
    super(message);
    this.name = "ApiError";
    this.kind = kind;
    this.status = status;
    this.details = details;
  }
}

export function normalizeFetchError(error: unknown): ApiError {
  if (error instanceof ApiError) {
    return error;
  }

  if (
    typeof DOMException !== "undefined" &&
    error instanceof DOMException &&
    error.name === "AbortError"
  ) {
    return new ApiError({
      kind: "abort",
      message: "Request was cancelled.",
    });
  }

  if (error instanceof TypeError) {
    return new ApiError({
      kind: "network",
      message: "Unable to reach the API.",
    });
  }

  return new ApiError({
    kind: "unknown",
    message: "Unexpected API failure.",
    details: error,
  });
}
