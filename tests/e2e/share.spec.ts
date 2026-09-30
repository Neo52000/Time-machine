import { expect, test } from "@playwright/test";

test("a passport becomes a link that shows its stamps to anyone", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.addInitScript(() => {
    // Force the clipboard path: headless Chromium's share support varies.
    Object.defineProperty(navigator, "share", { value: undefined });
    localStorage.setItem(
      "time-machine-passport",
      JSON.stringify({ "w98-chercheur": 1, "m-bal": 2 }),
    );
  });

  await page.goto("/");
  await expect(page.getByTestId("passport-count")).toContainText("2 /");
  await page.getByTestId("passport-share").click();
  await expect(page.getByTestId("passport-share-status")).toContainText("Lien copié");
  const url = await page.evaluate(() => navigator.clipboard.readText());
  // Catalogue order, stamp ids only.
  expect(new URL(url).pathname).toBe("/passport/m-bal.w98-chercheur");

  const visitor = await context.browser()!.newPage();
  await visitor.goto(new URL(url).pathname);
  await expect(visitor.getByTestId("shared-passport-count")).toContainText("2 /");
  await expect(visitor.getByTestId("shared-stamp-m-bal")).toBeVisible();
  await expect(visitor.getByTestId("shared-stamp-w98-chercheur")).toBeVisible();
  const image = await visitor.locator('meta[property="og:image"]').getAttribute("content");
  expect(image).toContain("/passport/m-bal.w98-chercheur/opengraph-image");
  await visitor.getByTestId("shared-passport-start").click();
  await expect(visitor).toHaveURL(/\/$/);
  await visitor.close();
});

test("an empty or unknown passport code is a 404", async ({ page }) => {
  const res = await page.goto("/passport/nothing.here");
  expect(res?.status()).toBe(404);
});

test("no share button before the first stamp", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("passport-count")).toContainText("0 /");
  await expect(page.getByTestId("passport-share")).toHaveCount(0);
});
