import { describe, expect, it } from "vitest";

import { parseCurrentUser } from "@/features/auth/session";

describe("parseCurrentUser", () => {
  it("normalizes backend snake_case fields to frontend camelCase", () => {
    expect(
      parseCurrentUser({
        id: "user-1",
        email: "member@example.com",
        display_name: "Member User",
        role: "member",
        is_active: true,
      }),
    ).toEqual({
      id: "user-1",
      email: "member@example.com",
      displayName: "Member User",
      role: "member",
      isActive: true,
    });
  });

  it("rejects unknown roles", () => {
    expect(() =>
      parseCurrentUser({
        id: "user-2",
        email: "viewer@example.com",
        role: "viewer",
        is_active: true,
      }),
    ).toThrow();
  });
});
