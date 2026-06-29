import { expect, type Page, test } from "@playwright/test";

type MockRole = "member" | "admin";

async function mockSession(page: Page, role: MockRole) {
  await page.route("**/auth/me", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        id: `${role}-1`,
        email: `${role}@example.test`,
        display_name: role === "admin" ? "Admin User" : "Member User",
        role,
        is_active: true,
      }),
    });
  });
}

async function expectFramedWorkspace(page: Page) {
  const shell = page.getByTestId("app-shell");
  const frame = page.getByTestId("app-workframe");
  const rail = page.getByTestId("side-rail");
  const canvas = page.getByTestId("app-work-canvas");

  await expect(shell).toBeVisible();
  await expect(frame).toBeVisible();
  await expect(rail).toBeVisible();
  await expect(canvas).toBeVisible();

  const frameBox = await frame.boundingBox();
  const railBox = await rail.boundingBox();
  const canvasBox = await canvas.boundingBox();

  expect(frameBox).not.toBeNull();
  expect(railBox).not.toBeNull();
  expect(canvasBox).not.toBeNull();

  if (frameBox && railBox && canvasBox) {
    expect(frameBox.x).toBeGreaterThan(0);
    expect(frameBox.y).toBeGreaterThan(0);
    expect(railBox.x).toBeGreaterThanOrEqual(frameBox.x);
    expect(railBox.width).toBeLessThanOrEqual(64);
    expect(canvasBox.x).toBeGreaterThanOrEqual(railBox.x + railBox.width - 1);
  }
}

test("member sees compact framed shell nav and member settings only", async ({ page }) => {
  await mockSession(page, "member");
  await page.goto("/chat");

  await expectFramedWorkspace(page);
  await expect(page.getByRole("link", { name: "Chat" })).toHaveAttribute("aria-current", "page");
  await expect(page.getByRole("link", { name: "Documents" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Knowledge Graph" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Operations" })).toHaveCount(0);
  await expect(page.getByTestId("chat-route")).toBeVisible();

  await page.getByRole("button", { name: "Open settings" }).click();
  await expect(page.getByRole("dialog", { name: "Settings" })).toBeVisible();
  await expect(page.getByRole("button", { name: "General" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Users" })).toHaveCount(0);
});

test("admin sees operations and admin settings sections", async ({ page }) => {
  await mockSession(page, "admin");
  await page.goto("/operations");

  await expectFramedWorkspace(page);
  await expect(page.getByRole("link", { name: "Operations" })).toHaveAttribute("aria-current", "page");
  await expect(page.getByRole("heading", { name: "Operations" })).toBeVisible();

  await page.getByRole("button", { name: "Open settings" }).click();
  await expect(page.getByRole("button", { name: "Users" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Domains" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Providers" })).toBeVisible();
});

test("member direct operations route renders forbidden inside the framed shell", async ({ page }) => {
  await mockSession(page, "member");
  await page.goto("/operations");

  await expect(page).toHaveURL(/\/operations$/);
  await expectFramedWorkspace(page);
  await expect(page.getByRole("heading", { name: "Forbidden" })).toBeVisible();
});

test("settings opens from keyboard, closes on escape, and restores focus", async ({ page }) => {
  await mockSession(page, "member");
  await page.goto("/documents");

  const settings = page.getByRole("button", { name: "Open settings" });
  await settings.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog", { name: "Settings" })).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "Settings" })).toHaveCount(0);
  await expect(settings).toBeFocused();
});

test("primary routes render route-owned work surfaces inside the frame", async ({ page }) => {
  await mockSession(page, "member");

  for (const [route, testId] of [
    ["/chat", "chat-route"],
    ["/documents", "documents-route"],
    ["/graph", "graph-route"],
    ["/database-visualize", "graph-route"],
  ] as const) {
    await page.goto(route);
    await expectFramedWorkspace(page);
    await expect(page.getByTestId(testId)).toBeVisible();
  }
});

test("theme toggle changes shell theme without overlapping chrome", async ({ page }) => {
  await mockSession(page, "member");
  await page.goto("/graph");

  await expect(page.locator("html")).toHaveAttribute("data-theme", "zai-dark");
  await page.getByRole("button", { name: "Switch to light theme" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "zai-light");

  const title = await page.getByRole("heading", { name: "Knowledge Graph" }).boundingBox();
  const rail = await page.getByTestId("side-rail").boundingBox();

  expect(title).not.toBeNull();
  expect(rail).not.toBeNull();

  if (title && rail) {
    expect(title.x).toBeGreaterThan(rail.x + rail.width);
  }
});
