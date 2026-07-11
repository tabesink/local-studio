import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const root = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");

async function loadHelpers() {
  const moduleUrl = pathToFileURL(join(root, "src/features/settings-panel/domainSettingsHelpers.ts")).href;
  return import(moduleUrl);
}

describe("Domain settings helpers (F-009 deploy)", () => {
  it("accepts and rejects domain ids per backend slug pattern", async () => {
    const { isValidDomainId } = await loadHelpers();

    assert.equal(isValidDomainId("ab"), true);
    assert.equal(isValidDomainId("fatigue"), true);
    assert.equal(isValidDomainId("ops-notes"), true);
    assert.equal(isValidDomainId("a_b"), true);
    assert.equal(isValidDomainId("a1"), true);

    assert.equal(isValidDomainId(""), false);
    assert.equal(isValidDomainId("a"), false);
    assert.equal(isValidDomainId("-ab"), false);
    assert.equal(isValidDomainId("Ab"), false);
    assert.equal(isValidDomainId("has space"), false);
    assert.equal(isValidDomainId("a".repeat(64)), false);
  });

  it("filters embedding profiles and prefers isDefault", async () => {
    const { filterEmbeddingProfiles, defaultEmbeddingProfileId, canDeployDomain } = await loadHelpers();

    const profiles = [
      { id: "syn", name: "Synth", profileKind: "synthesis", isDefault: true },
      { id: "emb-a", name: "Emb A", profileKind: "embedding", isDefault: false },
      { id: "emb-b", name: "Emb B", profileKind: "embedding", isDefault: true },
    ];

    const embedding = filterEmbeddingProfiles(profiles);
    assert.deepEqual(
      embedding.map((p) => p.id),
      ["emb-a", "emb-b"],
    );
    assert.equal(defaultEmbeddingProfileId(profiles), "emb-b");
    assert.equal(defaultEmbeddingProfileId([{ id: "x", profileKind: "synthesis", isDefault: true }]), null);

    assert.equal(
      canDeployDomain({
        id: "ops-notes",
        displayName: "Ops",
        embeddingProfileId: "emb-b",
        hasEmbeddingProfiles: true,
      }),
      true,
    );
    assert.equal(
      canDeployDomain({
        id: "ops-notes",
        displayName: "Ops",
        embeddingProfileId: "emb-b",
        hasEmbeddingProfiles: false,
      }),
      false,
    );
    assert.equal(
      canDeployDomain({
        id: "X",
        displayName: "Ops",
        embeddingProfileId: "emb-b",
        hasEmbeddingProfiles: true,
      }),
      false,
    );
    assert.equal(
      canDeployDomain({
        id: "ops-notes",
        displayName: "  ",
        embeddingProfileId: "emb-b",
        hasEmbeddingProfiles: true,
      }),
      false,
    );
  });

  it("deployDomain: success, create_failed, and start_failed_keep without delete", async () => {
    const { deployDomain } = await loadHelpers();

    const successCalls = { create: 0, start: 0, delete: 0 };
    const success = await deployDomain(
      { id: "ops-notes", displayName: "Ops Notes", embeddingProfileId: "emb-1" },
      {
        createDomain: async (input) => {
          successCalls.create += 1;
          assert.equal(input.id, "ops-notes");
          return { id: input.id };
        },
        startDomain: async (domainId) => {
          successCalls.start += 1;
          assert.equal(domainId, "ops-notes");
        },
      },
    );
    assert.equal(success.kind, "success");
    assert.deepEqual(successCalls, { create: 1, start: 1, delete: 0 });

    const createFail = await deployDomain(
      { id: "ops-notes", displayName: "Ops", embeddingProfileId: "emb-1" },
      {
        createDomain: async () => {
          throw new Error("create blocked");
        },
        startDomain: async () => {
          throw new Error("start should not run");
        },
      },
    );
    assert.equal(createFail.kind, "create_failed");
    assert.equal(createFail.error instanceof Error && createFail.error.message, "create blocked");

    let startCalled = false;
    const startFail = await deployDomain(
      { id: "kept", displayName: "Kept", embeddingProfileId: "emb-1" },
      {
        createDomain: async () => ({ id: "kept" }),
        startDomain: async () => {
          startCalled = true;
          throw new Error("start failed");
        },
      },
    );
    assert.equal(startCalled, true);
    assert.equal(startFail.kind, "start_failed_keep");
    assert.equal(startFail.error instanceof Error && startFail.error.message, "start failed");
  });

  it("maps busy labels and Start XOR Stop from state", async () => {
    const { busyLabel, primaryLifecycleAction, domainTone, shouldRequestDelete } = await loadHelpers();

    assert.equal(busyLabel("start"), "starting");
    assert.equal(busyLabel("stop"), "stopping");
    assert.equal(busyLabel("delete"), "deleting");
    assert.equal(busyLabel("deploy"), "deploying");

    assert.equal(primaryLifecycleAction("running"), "stop");
    assert.equal(primaryLifecycleAction("stopped"), "start");
    assert.equal(primaryLifecycleAction("error"), "start");
    assert.equal(primaryLifecycleAction("deleting"), null);

    assert.equal(domainTone("running"), "good");
    assert.equal(domainTone("error"), "danger");
    assert.equal(domainTone("stopped"), "default");

    assert.equal(shouldRequestDelete(false), false);
    assert.equal(shouldRequestDelete(true), true);
  });

  it("maps embedding labels and accordion expand toggle", async () => {
    const { embeddingProfileLabel, nextExpandedDomainId } = await loadHelpers();

    const profiles = [
      { id: "emb-a", name: "Emb A", profileKind: "embedding", isDefault: false },
      { id: "emb-b", name: "  Emb B  ", profileKind: "embedding", isDefault: true },
    ];

    assert.equal(embeddingProfileLabel("emb-b", profiles), "Emb B");
    assert.equal(embeddingProfileLabel("missing", profiles), "missing");
    assert.equal(embeddingProfileLabel("", profiles), "Locked");
    assert.equal(embeddingProfileLabel(null, profiles), "Locked");

    assert.equal(nextExpandedDomainId(null, "a"), "a");
    assert.equal(nextExpandedDomainId("a", "a"), null);
    assert.equal(nextExpandedDomainId("a", "b"), "b");
  });

  it("Domains Settings UI uses UiModal delete, accordion, and omits operator field tokens", async () => {
    const { FORBIDDEN_DOMAIN_UI_FIELD_TOKENS } = await loadHelpers();

    const panel = readFileSync(join(root, "src/features/settings-panel/SettingsPanel.tsx"), "utf8");
    const domainsApi = readFileSync(join(root, "src/features/domains/api.ts"), "utf8");

    assert.match(panel, /UiModal/);
    assert.match(panel, /deployDomain/);
    assert.match(panel, /Deploy/);
    assert.match(panel, /ChevronDown/);
    assert.match(panel, /aria-expanded/);
    assert.match(panel, /embeddingProfileLabel/);
    assert.match(panel, /nextExpandedDomainId/);
    assert.match(panel, /· locked/);
    assert.doesNotMatch(panel, /window\.confirm/);

    // DomainsSection should not render both Start and Stop on the same row template
    assert.match(panel, /primaryLifecycleAction/);

    // Scan Domains UI surface only — helpers may list forbidden tokens for this guard.
    for (const token of FORBIDDEN_DOMAIN_UI_FIELD_TOKENS) {
      assert.equal(
        panel.includes(token),
        false,
        `Domains Settings UI must not include operator field token ${token}`,
      );
    }

    // Safe admin DTO fields remain the client seam — no infra keys on AdminDomain type
    assert.match(domainsApi, /export type AdminDomain/);
    for (const token of ["hostPort", "host_port", "containerId", "runtimeUrl", "baseUrl"]) {
      assert.equal(domainsApi.includes(token), false, `AdminDomain API must not expose ${token}`);
    }
  });
});
