import { expect, test, type Page, type Response } from "@playwright/test";
import { loginAsAdmin, logout, sendChatMessage } from "./helpers/auth";
import { E2E_DOMAIN_QUESTION, readSeedInfo } from "./helpers/stack-seed";

test.describe.configure({ mode: "serial" });

/** Keys that must never appear on opaque source-ref resolve JSON (fail-closed). */
const FORBIDDEN_RESOLVE_KEYS = [
  "source_block_id",
  "sourceBlockId",
  "sourceblockid",
  "storage_path",
  "storagePath",
  "storagepath",
  "runtime_url",
  "runtimeUrl",
  "runtimeurl",
];

async function waitForStreamSettled(page: Page) {
  const assistant = page.getByTestId("assistant-turn").last();
  await expect(assistant).toBeVisible({ timeout: 90_000 });
  await expect(page.getByTestId("chat-streaming")).toHaveAttribute("data-streaming", "false", {
    timeout: 90_000,
  });
  await expect(assistant).not.toContainText("Streaming...");
  return assistant;
}

async function openDomainEvidencePanel(page: Page) {
  const seed = readSeedInfo();
  await loginAsAdmin(page);
  await page.getByLabel("Knowledge Domain").selectOption({ label: seed.displayName });
  await sendChatMessage(page, E2E_DOMAIN_QUESTION);
  await waitForStreamSettled(page);

  const evidence = page.getByRole("complementary", { name: "Evidence" });
  await expect(evidence).toBeVisible({ timeout: 120_000 });
  const rows = evidence.getByRole("listitem");
  await expect(rows.first()).toBeVisible({ timeout: 60_000 });
  expect(await rows.count()).toBeGreaterThanOrEqual(1);
  return evidence;
}

function collectKeys(value: unknown, into: Set<string>) {
  if (value === null || typeof value !== "object") return;
  if (Array.isArray(value)) {
    for (const child of value) collectKeys(child, into);
    return;
  }
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    into.add(key);
    collectKeys(child, into);
  }
}

function assertSafeResolvePayload(payload: unknown) {
  const keys = new Set<string>();
  collectKeys(payload, keys);
  for (const forbidden of FORBIDDEN_RESOLVE_KEYS) {
    expect(keys.has(forbidden), `resolve JSON must not include key ${forbidden}`).toBe(false);
  }
  // Path-like top-level keys (never invent private ids; only assert absence).
  expect(keys.has("path"), "resolve JSON must not include key path").toBe(false);
}

function isSourceResolveResponse(response: Response): boolean {
  return (
    response.request().method() === "GET" &&
    /\/api\/v1\/evidence-refs\/[^/]+\/source(?:\?|$)/.test(response.url())
  );
}

test.describe("F-009 source-ref inspector", () => {
  test("AE1/AE2: Evidence → Library preview → Back to jump-from turn", async ({ page }) => {
    const evidence = await openDomainEvidencePanel(page);
    await evidence.getByRole("listitem").first().click();

    const openInLibrary = evidence.getByTestId("open-in-library");
    await expect(openInLibrary).toBeVisible();
    await expect(openInLibrary).toBeEnabled();

    const resolveResponsePromise = page.waitForResponse(isSourceResolveResponse, { timeout: 60_000 });
    await openInLibrary.click();
    const resolveResponse = await resolveResponsePromise;
    expect(resolveResponse.ok()).toBeTruthy();
    const resolveJson = (await resolveResponse.json()) as unknown;
    assertSafeResolvePayload(resolveJson);

    await expect(page).toHaveURL(/\/documents\?/, { timeout: 30_000 });
    const url = new URL(page.url());
    expect(url.pathname).toBe("/documents");
    expect(url.searchParams.get("domainId")).toBeTruthy();
    expect(url.searchParams.get("sourceId")).toBeTruthy();
    expect(url.searchParams.get("conversationId")).toBeTruthy();
    expect(url.searchParams.get("turnId")).toBeTruthy();

    const conversationId = url.searchParams.get("conversationId")!;
    const turnId = url.searchParams.get("turnId")!;

    await expect(page.getByTestId("documents-back-to-chat-chrome")).toBeVisible();
    await expect(page.getByTestId("documents-preview-panel")).toBeVisible({ timeout: 60_000 });

    const pdfPreview = page.getByTestId("documents-pdf-preview");
    const textPreview = page.getByTestId("documents-text-preview");
    const pdfVisible = await pdfPreview.isVisible().catch(() => false);
    if (pdfVisible) {
      await expect(pdfPreview).toHaveAttribute("data-pdfjs", "true");
      await expect(pdfPreview.locator("canvas")).toBeVisible({ timeout: 60_000 });
    } else {
      await expect(textPreview).toBeVisible({ timeout: 60_000 });
    }

    await page.getByTestId("documents-back-to-chat").click();
    await expect(page).toHaveURL(
      new RegExp(`/chat\\?.*conversationId=${conversationId}.*turnId=${turnId}`),
    );

    const evidenceAfter = page.getByRole("complementary", { name: "Evidence" });
    await expect(evidenceAfter).toBeVisible({ timeout: 60_000 });
    const rowsAfter = evidenceAfter.getByRole("listitem");
    await expect(rowsAfter.first()).toBeVisible({ timeout: 30_000 });
    await rowsAfter.first().click();
    await expect(evidenceAfter.getByTestId("open-in-library")).toBeVisible();
    await expect(evidenceAfter.getByTestId("evidence-selected-detail")).toBeVisible();

    await logout(page);
  });

  test("AE4: unavailable source stays on chat", async ({ page }) => {
    const evidence = await openDomainEvidencePanel(page);
    await evidence.getByRole("listitem").first().click();
    await expect(evidence.getByTestId("open-in-library")).toBeVisible();

    await page.route("**/evidence-refs/*/source", async (route) => {
      await route.fulfill({
        status: 404,
        contentType: "application/json",
        body: JSON.stringify({
          error: {
            code: "source_ref_unavailable",
            message: "Source reference is unavailable.",
          },
        }),
      });
    });

    await evidence.getByTestId("open-in-library").click();
    await expect(evidence.getByTestId("source-unavailable")).toBeVisible({ timeout: 30_000 });
    await expect(page).toHaveURL(/\/chat/);
    expect(page.url()).not.toMatch(/\/documents/);
    await expect(evidence).toBeVisible();

    await logout(page);
  });
});
