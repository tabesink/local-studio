import { expect, type Page, test } from "@playwright/test";

async function mockSession(page: Page) {
  await page.route("**/auth/me", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        id: "member-1",
        email: "member@example.test",
        display_name: "Member User",
        role: "member",
        is_active: true,
      }),
    });
  });
}

test("redirects the root into the default dark framed app shell", async ({ page }) => {
  await mockSession(page);
  await page.goto("/");

  await expect(page).toHaveURL(/\/chat$/);
  await expect(page.locator("html")).toHaveAttribute("data-theme", "zai-dark");
  await expect(page.getByTestId("app-shell")).toBeVisible();
  await expect(page.getByTestId("app-workframe")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Chat" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Switch to light theme" })).toBeVisible();
});

test("renders the framed app shell in the light theme", async ({ page }) => {
  await mockSession(page);
  await page.addInitScript(() => {
    window.localStorage.setItem("context-engine-theme", "zai-light");
  });

  await page.goto("/chat");

  await expect(page.locator("html")).toHaveAttribute("data-theme", "zai-light");
  await expect(page.getByTestId("app-shell")).toBeVisible();
  await expect(page.getByTestId("app-workframe")).toBeVisible();
  await expect(page.getByRole("button", { name: "Switch to dark theme" })).toBeVisible();
});
