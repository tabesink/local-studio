import { describe, expect, it } from "vitest";

import { parsePublicEnv } from "@/lib/config/env";

describe("parsePublicEnv", () => {
  it("rejects a missing public API URL with a safe message", () => {
    expect(() => parsePublicEnv({})).toThrow("Public API URL is required.");
  });

  it("rejects an invalid public API URL with a safe message", () => {
    expect(() =>
      parsePublicEnv({ NEXT_PUBLIC_API_BASE_URL: "not-a-url" }),
    ).toThrow("Public API URL must be a valid absolute URL.");
  });

  it("accepts a valid public API URL", () => {
    expect(
      parsePublicEnv({ NEXT_PUBLIC_API_BASE_URL: "https://api.example.test" }),
    ).toEqual({ NEXT_PUBLIC_API_BASE_URL: "https://api.example.test" });
  });
});
