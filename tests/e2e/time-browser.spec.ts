import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/era/1998/desktop");
  await page.getByTestId("boot-screen").click();
  await page.getByTestId("app-browser").dblclick();
  await expect(page.getByTestId("browser-home")).toBeVisible();
});

test("Time Browser resolves a 1998 reconstruction and runs its search form", async ({ page }) => {
  await page.getByTestId("browser-address").fill("altavista.com");
  await page.getByTestId("browser-go").click();

  const reconstruction = page.getByTestId("reconstruction");
  await expect(reconstruction).toHaveAttribute("data-page-id", "page-altavista-1998-home");
  await expect(page.getByTestId("browser-address")).toHaveValue("http://altavista.com/");
  await expect(page.getByTestId("browser-status")).toContainText("Reconstitution");

  await page.getByTestId("page-search-input").fill("modem 56k");
  await page.getByTestId("page-search-form").locator("button").click();
  await expect(reconstruction).toHaveAttribute("data-page-id", "page-altavista-1998-search");
  await expect(page.getByTestId("search-results")).toContainText("modem 56k");
  await expect(page.getByTestId("browser-address")).toHaveValue(/cgi-bin\/query\?q=modem\+56k/);

  // Cross-site link inside a reconstruction, then back/forward.
  await page.getByTestId("browser-back").click();
  await page.getByRole("link", { name: "Yahoo! — l'annuaire" }).click();
  await expect(reconstruction).toHaveAttribute("data-page-id", "page-yahoo-1998-home");
  await page.getByTestId("browser-back").click();
  await expect(reconstruction).toHaveAttribute("data-page-id", "page-altavista-1998-home");
  await page.getByTestId("browser-forward").click();
  await expect(reconstruction).toHaveAttribute("data-page-id", "page-yahoo-1998-home");
});

test("Time Browser shows a temporal 404 for a site that does not exist yet", async ({ page }) => {
  await page.getByTestId("browser-address").fill("www.napster.com");
  await page.getByTestId("browser-address").press("Enter");

  const notFound = page.getByTestId("temporal-404");
  await expect(notFound).toHaveAttribute("data-reason", "not-yet-online");
  await expect(notFound).toContainText("Napster");
  await expect(notFound).toContainText("Lancement de Napster");
  await expect(page.getByTestId("browser-status")).toContainText("404 temporelle");
});

test("Time Browser falls back to documents and cards, never the real network", async ({ page }) => {
  await page.getByTestId("browser-address").fill("lycos.com");
  await page.getByTestId("browser-address").press("Enter");
  await expect(page.getByTestId("document-card")).toContainText("Lancement de Lycos");

  await page.getByTestId("browser-address").fill("amazon.com");
  await page.getByTestId("browser-address").press("Enter");
  await expect(page.getByTestId("website-card")).toContainText("Amazon.com");

  await page.getByTestId("browser-home-button").click();
  await page.getByTestId("favorite-info.cern.ch").click();
  await expect(page.getByTestId("reconstruction")).toHaveAttribute(
    "data-page-id",
    "page-info-cern-ch-1991-home",
  );
});
