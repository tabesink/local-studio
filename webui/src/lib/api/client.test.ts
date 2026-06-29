import { describe, expect, it, vi } from "vitest";

import { createApiClient } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";

describe("createApiClient", () => {
  it("sends credentials with every request", async () => {
    const fetchImpl = vi.fn(async () =>
      Response.json({ ok: true }, { status: 200 }),
    );
    const client = createApiClient({
      baseUrl: "https://api.example.test",
      fetchImpl,
    });

    await client.request("/health");

    expect(fetchImpl).toHaveBeenCalledWith(
      "https://api.example.test/health",
      expect.objectContaining({ credentials: "include" }),
    );
  });

  it("returns JSON payloads", async () => {
    const client = createApiClient({
      baseUrl: "https://api.example.test",
      fetchImpl: async () => Response.json({ ok: true }, { status: 200 }),
    });

    await expect(client.request("/health")).resolves.toEqual({ ok: true });
  });

  it("normalizes non-JSON HTTP failures", async () => {
    const client = createApiClient({
      baseUrl: "https://api.example.test",
      fetchImpl: async () =>
        new Response("offline", {
          status: 503,
          headers: { "content-type": "text/plain" },
        }),
    });

    await expect(client.request("/health")).rejects.toMatchObject({
      kind: "http",
      status: 503,
      message: "API request failed.",
      details: "offline",
    });
  });

  it("normalizes network failures", async () => {
    const client = createApiClient({
      baseUrl: "https://api.example.test",
      fetchImpl: async () => {
        throw new TypeError("failed to fetch");
      },
    });

    await expect(client.request("/health")).rejects.toMatchObject({
      kind: "network",
      message: "Unable to reach the API.",
    });
  });

  it("normalizes abort failures", async () => {
    const client = createApiClient({
      baseUrl: "https://api.example.test",
      fetchImpl: async () => {
        throw new DOMException("cancelled", "AbortError");
      },
    });

    await expect(client.request("/health")).rejects.toMatchObject({
      kind: "abort",
      message: "Request was cancelled.",
    });
  });

  it("normalizes invalid JSON responses", async () => {
    const client = createApiClient({
      baseUrl: "https://api.example.test",
      fetchImpl: async () =>
        new Response("{", {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
    });

    await expect(client.request("/health")).rejects.toBeInstanceOf(ApiError);
    await expect(client.request("/health")).rejects.toMatchObject({
      kind: "parse",
      message: "API returned invalid JSON.",
      status: 200,
    });
  });
});
