import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { pathToFileURL } from "node:url";

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
  return walk(src).filter((file) => /\.(ts|tsx)$/.test(file));
}

describe("F-012 chat via LS chat-shell", () => {
  it("routes /chat through the chat-shell feature module", () => {
    const page = read("src/app/chat/page.tsx");
    assert.match(page, /features\/chat-shell\/ChatShell/);
    assert.match(page, /force-dynamic/);
  });

  it("keeps chat network calls behind the slice adapter and shared SSE wrappers", () => {
    const api = read("src/features/chat-shell/api.ts");
    assert.match(api, /"\/composer-refs:discover"/);
    assert.match(api, /composerRefTokens/);
    assert.match(api, /postSse/);

    const offenders = sourceFiles()
      .filter((file) => !file.endsWith(join("src", "lib", "api", "client.ts")))
      .filter((file) => !file.endsWith(join("src", "lib", "api", "sse.ts")))
      .filter((file) => /\bfetch\s*\(/.test(readFileSync(file, "utf8")))
      .map((file) => relative(root, file));
    assert.deepEqual(offenders, []);
  });

  it("translates EVT-001 SSE events into LS timeline blocks", () => {
    const hook = read("src/features/chat-shell/use-chat-shell.ts");
    for (const event of ['"stage"', '"token"', '"evidence"', '"done"', '"error"']) {
      assert.match(hook, new RegExp(`event\\.event === ${event}`));
    }
    const component = read("src/features/chat-shell/ChatShell.tsx");
    assert.match(component, /acceptedRefs/);
    assert.match(component, /Evidence/);
    assert.match(component, /SegmentedControl/);
  });

  it("does not port uncontracted Local Studio agent controls", () => {
    const combined = ["src/features/chat-shell/ChatShell.tsx", "src/features/chat-shell/use-chat-shell.ts"]
      .map(read)
      .join("\n");
    for (const forbidden of ["abort(", "modelId", "browserToolEnabled", "cwd", "terminal"]) {
      assert.equal(combined.includes(forbidden), false, forbidden);
    }
  });

  it("renders evidence in the turn-scoped Evidence Panel, not as timeline blocks", () => {
    const panel = read("src/features/chat-shell/EvidencePanel.tsx");
    assert.match(panel, /citationLabel/);
    assert.match(panel, /sourceLabel/);
    assert.match(panel, /excerpt/);
    assert.match(panel, /onSelectEvidence/);
    assert.equal(/\bfetch\s*\(/.test(panel), false, "Evidence Panel must not fetch");

    const component = read("src/features/chat-shell/ChatShell.tsx");
    assert.match(component, /<EvidencePanel/);
    assert.match(component, /panelEvidence/);

    const types = read("src/features/chat-shell/types.ts");
    assert.equal(types.includes('kind: "evidence"'), false, "evidence is not a timeline block kind");
  });

  it("scopes the panel to the current or selected turn and auto-opens on evidence", () => {
    const hook = read("src/features/chat-shell/use-chat-shell.ts");
    assert.match(hook, /selectedTurnId/);
    assert.match(hook, /selectTurn/);
    assert.match(hook, /panelEvidence/);
    assert.match(hook, /setPanelOpen\(true\)/);
    // No private source identifiers or session-ledger port in panel state.
    for (const forbidden of ["sourceBlockId", "documentId", "chunkId", "sessionContextLedger", "pinned"]) {
      assert.equal(hook.includes(forbidden), false, forbidden);
    }
    const panel = read("src/features/chat-shell/EvidencePanel.tsx");
    for (const forbidden of ["sourceBlockId", "documentId", "chunkId", "thumbnailUrl", "assetId"]) {
      assert.equal(panel.includes(forbidden), false, forbidden);
    }
  });

  it("owns composer picker state in the hook and submits opaque ref tokens only", () => {
    const hook = read("src/features/chat-shell/use-chat-shell.ts");
    assert.match(hook, /mentionQuery/);
    assert.match(hook, /lastIndexOf\("@"/);
    assert.match(hook, /composerRefTokens: refs\.map\(\(ref\) => ref\.refToken\)/);
    assert.equal(hook.includes("template.body"), false);
    assert.equal(hook.includes("sourceText"), false);
  });

  it("resolves evidence source refs then builds Library deep-links with return ids", async () => {
    const api = read("src/features/chat-shell/api.ts");
    assert.match(api, /resolveEvidenceSourceRef/);
    assert.match(api, /\/evidence-refs\/\$\{evidenceRefId\}\/source/);
    assert.match(api, /ceFetch/);

    const { buildLibraryDeepLinkHref } = await import(
      pathToFileURL(join(root, "src/features/documents/libraryDeepLink.ts")).href
    );

    const withPage = buildLibraryDeepLinkHref({
      domainId: "manuals",
      sourceId: "src_1",
      page: 12,
      conversationId: "conv_1",
      turnId: "turn_9",
    });
    assert.equal(
      withPage,
      "/documents?domainId=manuals&sourceId=src_1&conversationId=conv_1&turnId=turn_9&page=12",
    );

    const withoutPage = buildLibraryDeepLinkHref({
      domainId: "manuals",
      sourceId: "src_1",
      page: null,
      conversationId: "conv_1",
      turnId: "turn_9",
    });
    assert.equal(
      withoutPage,
      "/documents?domainId=manuals&sourceId=src_1&conversationId=conv_1&turnId=turn_9",
    );
    assert.equal(withoutPage.includes("page="), false);
  });

  it("opens Library only from selected Evidence detail and stays put on resolve failure", () => {
    const panel = read("src/features/chat-shell/EvidencePanel.tsx");
    assert.match(panel, /Open in Library/);
    assert.match(panel, /evidence-selected-detail/);
    assert.match(panel, /open-in-library/);
    assert.match(panel, /Source unavailable/);
    assert.match(panel, /onOpenInLibrary/);
    assert.equal(/\bfetch\s*\(/.test(panel), false, "Evidence Panel must not fetch");

    /* Control is only in the selected detail section, not list rows. */
    const detailStart = panel.indexOf('data-testid="evidence-selected-detail"');
    assert.ok(detailStart > 0, "selected detail section required");
    const listSection = panel.slice(0, detailStart);
    assert.equal(
      listSection.includes('data-testid="open-in-library"'),
      false,
      "list rows must not offer Open in Library",
    );
    assert.equal(panel.slice(detailStart).includes('data-testid="open-in-library"'), true);
    assert.equal((panel.match(/data-testid="open-in-library"/g) ?? []).length, 1);

    const hook = read("src/features/chat-shell/use-chat-shell.ts");
    assert.match(hook, /openEvidenceInLibrary/);
    assert.match(hook, /resolveEvidenceSourceRef/);
    assert.match(hook, /buildLibraryDeepLinkHref/);
    assert.match(hook, /setSourceUnavailable\(true\)/);
    assert.match(hook, /return null/);

    const component = read("src/features/chat-shell/ChatShell.tsx");
    assert.match(component, /onOpenInLibrary/);
    assert.match(component, /openEvidenceInLibrary/);
    assert.match(component, /router\.push\(href\)/);
    assert.match(component, /if \(href\) router\.push/);
    assert.equal(component.includes("citation chip"), false);
    assert.equal(component.includes("Source tab"), false);
  });

  it("bootstraps /chat return params by loading conversation and selecting the jump-from turn", () => {
    const hook = read("src/features/chat-shell/use-chat-shell.ts");
    assert.match(hook, /loadConversation = useCallback\(async \(conversationId: string, options\?: \{ turnId\?/);
    assert.match(hook, /setSelectedTurnId\(restoreTurn\.id\)/);
    assert.match(hook, /setPanelOpen\(restoreTurn\.evidence\.length > 0\)/);

    const component = read("src/features/chat-shell/ChatShell.tsx");
    assert.match(component, /useSearchParams/);
    assert.match(component, /conversationId/);
    assert.match(component, /turnId/);
    assert.match(component, /loadConversation\(conversationId, \{ turnId \}\)/);
  });
});
