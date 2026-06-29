import { describe, expect, it } from "vitest";

import {
  filterNavigationItems,
  filterSettingsSections,
  isAdminOnlyPath,
  isRouteActive,
} from "@/features/navigation/navigation";

describe("navigation role filtering", () => {
  it("shows members the base workspace nav without operations", () => {
    expect(filterNavigationItems("member").map((item) => item.label)).toEqual([
      "Chat",
      "Documents",
      "Knowledge Graph",
    ]);
  });

  it("shows admins the base workspace nav plus operations", () => {
    expect(filterNavigationItems("admin").map((item) => item.label)).toEqual([
      "Chat",
      "Documents",
      "Knowledge Graph",
      "Operations",
    ]);
  });

  it("filters admin settings sections for members", () => {
    expect(filterSettingsSections("member").map((section) => section.label)).toEqual(["General"]);
    expect(filterSettingsSections("admin").map((section) => section.label)).toEqual([
      "General",
      "Users",
      "Domains",
      "Providers",
    ]);
  });

  it("sets active state from the current pathname", () => {
    expect(isRouteActive("/documents/abc", "/documents")).toBe(true);
    expect(isRouteActive("/database-visualize", "/graph")).toBe(true);
    expect(isRouteActive("/operations", "/documents")).toBe(false);
  });

  it("identifies admin-only routes centrally", () => {
    expect(isAdminOnlyPath("/operations")).toBe(true);
    expect(isAdminOnlyPath("/operations/123")).toBe(true);
    expect(isAdminOnlyPath("/graph")).toBe(false);
  });
});
