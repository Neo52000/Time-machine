import { expect, test } from "@playwright/test";

test("homepage → select 1998 → loading → desktop placeholder", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("WHEN DO YOU WANT TO GO?")).toBeVisible();

  await page.getByTestId("era-marker-1998").click();

  await expect(page).toHaveURL(/\/era\/1998\/loading/);
  await expect(page.getByTestId("loading-screen")).toBeVisible();

  await page.waitForURL(/\/era\/1998\/desktop/, { timeout: 5_000 });

  const expectedApps = ["browser", "file-manager", "notepad", "terminal", "mail"];
  for (const appId of expectedApps) {
    await expect(page.getByTestId(`app-${appId}`)).toBeVisible();
  }
});
