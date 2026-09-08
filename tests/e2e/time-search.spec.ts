import { expect, test } from "@playwright/test";

async function openBrowser(page: import("@playwright/test").Page, era: string) {
  await page.goto(`/era/${era}/desktop`);
  await page.getByTestId("boot-screen").click();
  await page.getByTestId("app-browser").dblclick();
  await expect(page.getByTestId("browser-home")).toBeVisible();
}

async function go(page: import("@playwright/test").Page, url: string) {
  await page.getByTestId("browser-address").fill(url);
  await page.getByTestId("browser-address").press("Enter");
}

test("Time Search 98: AltaVista returns dated results that navigate through the engine", async ({
  page,
}) => {
  await openBrowser(page, "1998");
  await go(page, "altavista.com");
  await page.getByTestId("page-search-input").fill("annuaire");
  await page.getByTestId("page-search-form").locator("button").click();

  const results = page.getByTestId("search-results");
  await expect(results).not.toHaveAttribute("data-count", "0");
  await expect(page.getByTestId("hit-site:yahoo-com")).toBeVisible();
  await expect(page.getByTestId("browser-status")).toContainText("Time Search 98");

  await page.getByTestId("hit-site:yahoo-com").getByRole("link").click();
  await expect(page.getByTestId("reconstruction")).toHaveAttribute(
    "data-page-id",
    "page-yahoo-1998-home",
  );
});

test("Time Search 98: a 1999 site is invisible in 1998, and a personal page is indexed", async ({
  page,
}) => {
  await openBrowser(page, "1998");
  await go(page, "http://www.altavista.com/cgi-bin/query?q=napster");
  await expect(page.getByTestId("search-results")).toHaveAttribute("data-count", "0");
  await expect(page.getByTestId("search-empty")).toContainText("napster");

  await go(page, "http://www.altavista.com/cgi-bin/query?q=%2Bmodem+56k");
  await expect(page.getByTestId("hit-page:page-geocities-1998-modem")).toBeVisible();
  await page.getByTestId("hit-page:page-geocities-1998-modem").getByRole("link").click();
  await expect(page.getByTestId("reconstruction")).toHaveAttribute(
    "data-page-id",
    "page-geocities-1998-modem",
  );
});

test("2005 machine: its own disk, favourites and reconstructions, with the 2005 provider", async ({
  page,
}) => {
  await openBrowser(page, "2005");
  // The 2005 machine boots on 01/01/2005: YouTube (first video 23/04/2005) is still in the future.
  await page.getByTestId("favorite-youtube.com").click();
  const notFound = page.getByTestId("temporal-404");
  await expect(notFound).toHaveAttribute("data-reason", "not-yet-online");
  await expect(notFound).toContainText("23/04/2005");

  await page.getByTestId("browser-home-button").click();
  await page.getByTestId("favorite-wikipedia.org").click();
  await expect(page.getByTestId("reconstruction")).toHaveAttribute(
    "data-page-id",
    "page-wikipedia-2005-home",
  );

  await page.getByTestId("page-search-input").fill("napster");
  await page.getByTestId("page-search-form").locator("button").click();
  await expect(page.getByTestId("search-results")).toHaveAttribute("data-count", "0");
  await expect(page.getByTestId("browser-status")).toContainText("Time Search 2005");

  await go(page, "google.com");
  await expect(page.getByTestId("reconstruction")).toHaveAttribute(
    "data-page-id",
    "page-google-2005-home",
  );
});
