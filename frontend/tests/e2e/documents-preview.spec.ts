import { expect, test } from "@playwright/test";
import { loginAsAdmin, loginAsMember, logout } from "./helpers/auth";
import {
  E2E_PREVIEW_MARKDOWN_NAME,
  E2E_PREVIEW_PDF_NAME,
  readSeedInfo,
} from "./helpers/stack-seed";

test.describe.configure({ mode: "serial" });

async function openLibrary(page: import("@playwright/test").Page) {
  const seed = readSeedInfo();
  await page.goto("/documents");
  await expect(page.getByRole("heading", { name: "Source Documents" })).toBeVisible();
  await page.getByLabel("Knowledge Domain").selectOption({ label: seed.displayName });
}

async function selectSourceByFilename(page: import("@playwright/test").Page, filename: string) {
  const row = page.locator(`[data-filename="${filename}"]`).first();
  await expect(row).toBeVisible({ timeout: 60_000 });
  await row.click();
  await expect(page.getByTestId("documents-preview-panel")).toBeVisible();
}

test.describe("F-009 documents source preview", () => {
  test("admin opens Library and sees markdown text preview", async ({ page }) => {
    await loginAsAdmin(page);
    await openLibrary(page);
    await expect(page.getByTestId("documents-upload-button")).toBeVisible();
    await selectSourceByFilename(page, E2E_PREVIEW_MARKDOWN_NAME);
    await expect(page.getByTestId("documents-text-preview")).toBeVisible({ timeout: 60_000 });
    await expect(page.getByTestId("documents-text-preview")).toContainText(/startup|lockout|E2E/i);
    await expect(page.getByTestId("documents-admin-actions")).toBeVisible();
    await logout(page);
  });

  test("admin opens PDF preview object", async ({ page }) => {
    await loginAsAdmin(page);
    await openLibrary(page);
    await selectSourceByFilename(page, E2E_PREVIEW_PDF_NAME);
    await expect(page.getByTestId("documents-pdf-preview")).toBeVisible({ timeout: 60_000 });
    await expect(page.getByTestId("documents-pdf-preview")).toHaveAttribute("type", "application/pdf");
    await logout(page);
  });

  test("member lists and previews without mutation controls", async ({ page }) => {
    await loginAsMember(page);
    await openLibrary(page);
    await expect(page.getByTestId("documents-upload-button")).toHaveCount(0);
    await selectSourceByFilename(page, E2E_PREVIEW_MARKDOWN_NAME);
    await expect(page.getByTestId("documents-text-preview")).toBeVisible({ timeout: 60_000 });
    await expect(page.getByTestId("documents-admin-actions")).toHaveCount(0);
    await expect(page.getByTestId("documents-member-readonly")).toBeAttached();
    await expect(page.getByRole("button", { name: "Delete" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Retry preparation" })).toHaveCount(0);
    await logout(page);
  });
});
