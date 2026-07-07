import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const root = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const src = join(root, "src");

function read(relativePath) {
  return readFileSync(join(root, relativePath), "utf8");
}

function walk(dir) {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    if (entry === "node_modules" || entry === ".next") return [];
    if (statSync(path).isDirectory()) return walk(path);
    return [path];
  });
}

function sourceFiles() {
  return walk(src).filter((file) => /\.(ts|tsx|css)$/.test(file));
}

describe("F-009 foundation", () => {
  it("defines the foundation route map", () => {
    for (const route of [
      "src/app/page.tsx",
      "src/app/login/page.tsx",
      "src/app/chat/page.tsx",
      "src/app/documents/page.tsx",
      "src/app/database-visualize/page.tsx",
      "src/app/forbidden/page.tsx",
    ]) {
      assert.equal(existsSync(join(root, route)), true, route);
    }
  });

  it("keeps direct fetch isolated to the shared API client", () => {
    const offenders = sourceFiles()
      .filter((file) => !file.endsWith(join("src", "lib", "api", "client.ts")))
      .filter((file) => /\bfetch\s*\(/.test(readFileSync(file, "utf8")))
      .map((file) => relative(root, file));
    assert.deepEqual(offenders, []);
  });

  it("keeps browser storage behind the explicit allowlist", () => {
    const storage = read("src/lib/storage.ts");
    for (const key of ["ce.theme", "ce.density", "ce.railCollapsed", "ce.panelWidths", "ce.lastRouteGroup"]) {
      assert.match(storage, new RegExp(`"${key}"`));
    }
    const offenders = sourceFiles()
      .filter((file) => !file.endsWith(join("src", "lib", "storage.ts")))
      .filter((file) => /\b(localStorage|sessionStorage)\b/.test(readFileSync(file, "utf8")))
      .map((file) => relative(root, file));
    assert.deepEqual(offenders, []);
  });

  it("does not introduce browser token handling", () => {
    const combined = sourceFiles().map((file) => readFileSync(file, "utf8")).join("\n");
    for (const forbidden of ["access_token", "Authorization", "Bearer ", "sessionStorage"]) {
      assert.equal(combined.includes(forbidden), false, forbidden);
    }
  });

  it("constrains API calls to Context Engine API paths", () => {
    const client = read("src/lib/api/client.ts");
    assert.match(client, /const API_PREFIX = "\/api\/v1"/);
    assert.match(client, /\^https\?:\\\/\\\//);
    assert.match(client, /credentials: "include"/);
  });

  it("normalizes errors to the API-001 safe envelope", () => {
    const errors = read("src/lib/api/errors.ts");
    for (const field of ["code", "message", "requestId", "fields"]) {
      assert.match(errors, new RegExp(field));
    }
    assert.equal(errors.includes("raw"), false);
  });

  it("preserves CE rail order", () => {
    const rail = read("src/components/layout/AppSideRail.tsx");
    const order = ["Chat", "Documents", "Knowledge graph", "Settings", "Logout"].map((label) =>
      rail.indexOf(`aria-label="${label}"`),
    );
    assert.deepEqual(
      [...order].sort((a, b) => a - b),
      order,
      `rail order was ${order.join(",")}`,
    );
    assert.equal(order.every((index) => index >= 0), true);
  });
});
