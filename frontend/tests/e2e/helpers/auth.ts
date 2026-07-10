import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";
import { loadStackEnv, requireAdminCredentials } from "./env";
import { assertNoAuthTokensInBrowserStorage, expectChatShellReady } from "./storage";

export async function loginAsAdmin(page: Page) {
  const { username, password } = requireAdminCredentials(loadStackEnv());
  await page.goto("/login");
  await page.locator("#username").fill(username);
  await page.locator("#password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expectChatShellReady(page);
  await assertNoAuthTokensInBrowserStorage(page);
}

export async function logout(page: Page) {
  const logoutButton = page.getByRole("button", { name: "Logout" });
  if (!(await logoutButton.isVisible().catch(() => false))) {
    const openNav = page.getByLabel("Open navigation menu");
    if (await openNav.isVisible().catch(() => false)) {
      await openNav.click();
    }
  }
  await page.getByRole("button", { name: "Logout" }).click();
  await expect(page).toHaveURL(/\/login/);
  await assertNoAuthTokensInBrowserStorage(page);
}

export async function sendChatMessage(page: Page, message: string) {
  const composer = page.getByPlaceholder(/Ask anything/);
  await composer.fill(message);
  await page.getByTestId("composer-send").click();
}
