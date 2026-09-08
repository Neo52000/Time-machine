import { expect, test } from "@playwright/test";

test("homepage → select 1998 → loading → boot → desktop with era apps", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("WHEN DO YOU WANT TO GO?")).toBeVisible();

  await page.getByTestId("era-marker-1998").click();

  await expect(page).toHaveURL(/\/era\/1998\/loading/);
  await expect(page.getByTestId("loading-screen")).toBeVisible();

  await page.waitForURL(/\/era\/1998\/desktop/, { timeout: 5_000 });

  // Boot sequence is data-driven and skippable.
  await expect(page.getByTestId("boot-screen")).toBeVisible();
  await page.getByTestId("boot-screen").click();
  await expect(page.getByTestId("desktop")).toHaveAttribute("data-theme", "beige-crt-1998");

  const expectedApps = ["browser", "file-manager", "notepad", "terminal", "mail"];
  for (const appId of expectedApps) {
    await expect(page.getByTestId(`app-${appId}`)).toBeVisible();
  }

  // The clock shows the simulated era date, not today's.
  await expect(page.getByTestId("era-clock")).toHaveAttribute("title", /\/1998$/);
});

test("desktop 1998: open, focus, minimize, restore and close windows", async ({ page }) => {
  await page.goto("/era/1998/desktop");
  await page.getByTestId("boot-screen").click();

  // Double-click an icon opens a window and a taskbar button.
  await page.getByTestId("app-notepad").dblclick();
  const notepad = page.locator('[data-testid="window"][data-app-id="notepad"]');
  await expect(notepad).toBeVisible();
  await expect(notepad).toHaveAttribute("data-active", "true");
  await expect(page.getByTestId("task-notepad")).toBeVisible();

  // Start menu launches apps too.
  await page.getByTestId("start-button").click();
  await page.getByTestId("start-app-terminal").click();
  const terminal = page.locator('[data-testid="window"][data-app-id="terminal"]');
  await expect(terminal).toBeVisible();
  await expect(terminal).toHaveAttribute("data-active", "true");
  await expect(notepad).toHaveAttribute("data-active", "false");

  // Terminal runs commands against the virtual disk.
  await page.getByTestId("terminal-input").fill("dir");
  await page.getByTestId("terminal-input").press("Enter");
  await expect(page.getByTestId("terminal")).toContainText("Mes Documents");

  // Clicking a window focuses it.
  await notepad.getByTestId("window-titlebar").click();
  await expect(notepad).toHaveAttribute("data-active", "true");

  // Taskbar button minimizes the active window, then restores it.
  await page.getByTestId("task-notepad").click();
  await expect(notepad).toBeHidden();
  await page.getByTestId("task-notepad").click();
  await expect(notepad).toBeVisible();

  // Close removes the window and its taskbar button.
  await notepad.getByTestId("window-close").click();
  await expect(notepad).toHaveCount(0);
  await expect(page.getByTestId("task-notepad")).toHaveCount(0);
});

test("desktop 1998: file manager opens a text file in notepad", async ({ page }) => {
  await page.goto("/era/1998/desktop");
  await page.getByTestId("boot-screen").click();

  await page.getByTestId("app-file-manager").dblclick();
  await page.getByTestId("fm-entry-Mes Documents").dblclick();
  await expect(page.getByTestId("fm-path")).toHaveText("C:\\Mes Documents");
  await page.getByTestId("fm-entry-LISEZMOI.txt").dblclick();

  const notepad = page.locator('[data-testid="window"][data-app-id="notepad"]');
  await expect(notepad).toBeVisible();
  await expect(page.getByTestId("notepad-text")).toHaveValue(/machine de 1998/);
});
