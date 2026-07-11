import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const root = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");

async function loadDeepLinkModule() {
  const moduleUrl = pathToFileURL(join(root, "src/features/documents/libraryDeepLink.ts")).href;
  return import(moduleUrl);
}

describe("Library deep-link query params (U3 / KTD-2)", () => {
  it("parses domainId, sourceId, page, and return conversationId/turnId", async () => {
    const { parseLibraryDeepLink, hasChatReturn, buildChatReturnHref, resolvePdfInitialPage } =
      await loadDeepLinkModule();

    const link = parseLibraryDeepLink(
      new URLSearchParams({
        domainId: "manuals",
        sourceId: "src_1",
        page: "3",
        conversationId: "conv_1",
        turnId: "turn_9",
      }),
    );

    assert.deepEqual(link, {
      domainId: "manuals",
      sourceId: "src_1",
      page: 3,
      conversationId: "conv_1",
      turnId: "turn_9",
    });
    assert.equal(hasChatReturn(link), true);
    assert.equal(buildChatReturnHref("conv_1", "turn_9"), "/chat?conversationId=conv_1&turnId=turn_9");
    assert.equal(resolvePdfInitialPage(link.page), 3);
  });

  it("treats missing or invalid page as open-at-start", async () => {
    const { parseLibraryDeepLink, parsePageParam, resolvePdfInitialPage, hasChatReturn } =
      await loadDeepLinkModule();

    assert.equal(parsePageParam(null), null);
    assert.equal(parsePageParam(""), null);
    assert.equal(parsePageParam("0"), null);
    assert.equal(parsePageParam("-1"), null);
    assert.equal(parsePageParam("1.5"), null);
    assert.equal(parsePageParam("abc"), null);
    assert.equal(parsePageParam("2"), 2);

    const noPage = parseLibraryDeepLink(
      new URLSearchParams({
        domainId: "manuals",
        sourceId: "src_1",
      }),
    );
    assert.equal(noPage.page, null);
    assert.equal(resolvePdfInitialPage(noPage.page), 1);
    assert.equal(hasChatReturn(noPage), false);
  });

  it("requires both conversationId and turnId for Back to chat chrome", async () => {
    const { parseLibraryDeepLink, hasChatReturn } = await loadDeepLinkModule();
    assert.equal(
      hasChatReturn(parseLibraryDeepLink(new URLSearchParams({ conversationId: "c1" }))),
      false,
    );
    assert.equal(hasChatReturn(parseLibraryDeepLink(new URLSearchParams({ turnId: "t1" }))), false);
  });

  it("DocumentsPage wires pdf.js viewer and deep-link param names", () => {
    const page = readFileSync(join(root, "src/features/documents/DocumentsPage.tsx"), "utf8");
    assert.match(page, /PdfPreview/);
    assert.doesNotMatch(page, /<object[\s\S]*application\/pdf/);
    assert.match(page, /documents-back-to-chat/);
    assert.match(page, /parseLibraryDeepLink/);

    const helper = readFileSync(join(root, "src/features/documents/libraryDeepLink.ts"), "utf8");
    for (const name of ["domainId", "sourceId", "page", "conversationId", "turnId"]) {
      assert.match(helper, new RegExp(`"${name}"|get\\("${name}"\\)|${name}:`));
    }

    const preview = readFileSync(join(root, "src/features/documents/PdfPreview.tsx"), "utf8");
    assert.match(preview, /pdfjs-dist/);
    assert.match(preview, /data-pdfjs="true"/);
    assert.match(preview, /data-testid="documents-pdf-preview"/);
  });
});
