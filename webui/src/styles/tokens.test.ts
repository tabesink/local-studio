import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const tokensCss = readFileSync(resolve("src/styles/tokens.css"), "utf8");

describe("theme tokens", () => {
  it("defines dark and light theme selectors", () => {
    expect(tokensCss).toContain('html[data-theme="zai-dark"]');
    expect(tokensCss).toContain('html[data-theme="zai-light"]');
  });

  it("defines implementation and compatibility token aliases", () => {
    for (const token of [
      "--ui-bg",
      "--ui-fg",
      "--ui-panel",
      "--ui-rail",
      "--ui-border",
      "--ui-accent",
      "--bg",
      "--fg",
      "--surface",
      "--rail",
      "--border",
      "--accent",
      "--dim",
      "--ok",
      "--warn",
      "--err",
    ]) {
      expect(tokensCss).toContain(token);
    }
  });
});
