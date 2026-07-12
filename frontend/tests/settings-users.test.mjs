import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");

function read(relativePath) {
  return readFileSync(join(root, relativePath), "utf8");
}

describe("Settings Users admin toggle", () => {
  it("uses a typed admin PATCH wrapper for account disabled state", () => {
    const api = read("src/features/settings-panel/api.ts");

    assert.match(api, /export async function updateUserDisabled/);
    assert.match(api, /`\/admin\/users\/\$\{userId\}`/);
    assert.match(api, /method: "PATCH"/);
    assert.match(api, /JSON\.stringify\(\{ isDisabled \}\)/);
    assert.equal(api.includes("fetch("), false);
  });

  it("renders Users as an admin Settings switch without enabling self-disable in the UI", () => {
    const panel = read("src/features/settings-panel/SettingsPanel.tsx");
    const sharedUi = read("src/_shared/ui/index.tsx");

    assert.match(panel, /label: "Users"/);
    assert.match(panel, /currentUserId=\{user\?\.id \?\? null\}/);
    assert.match(panel, /updateUserDisabled/);
    assert.match(panel, /ToggleSwitch/);
    assert.match(panel, /checked=\{enabled\}/);
    assert.match(sharedUi, /export function ToggleSwitch/);
    assert.match(sharedUi, /role="switch"/);
    assert.match(sharedUi, /aria-checked=\{checked\}/);
    assert.match(sharedUi, /rounded-full/);
    assert.match(panel, /row\.id === currentUserId/);
    assert.match(panel, /Current administrator cannot be disabled/);
    assert.match(panel, /StatusPill tone="danger">Disabled/);
    assert.match(panel, /StatusPill tone="good">Active/);
  });
});
