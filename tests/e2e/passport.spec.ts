import { expect, test } from "@playwright/test";

test("stamps earned on a machine land in the homepage passport, and stay", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("passport-count")).toContainText("0 /");
  await expect(page.getByTestId("passport-stamp-w98-chercheur")).toHaveAttribute(
    "data-earned",
    "false",
  );

  await page.goto("/era/1998/desktop");
  await page.getByTestId("boot-screen").click();
  await page.getByTestId("app-browser").dblclick();
  await page.getByTestId("browser-address").fill("altavista.com");
  await page.getByTestId("browser-go").click();
  await page.getByTestId("page-search-input").fill("modem");
  await page.getByTestId("page-search-form").locator("button").click();
  const toasts = page.getByTestId("narrative-notification");
  await expect(toasts.filter({ hasText: "Chercheur" })).toBeVisible();
  await expect(toasts.filter({ hasText: "Première connexion" })).toBeVisible();

  await page.goto("/");
  await expect(page.getByTestId("passport-stamp-w98-chercheur")).toHaveAttribute(
    "data-earned",
    "true",
  );
  await expect(page.getByTestId("passport-count")).toContainText("2 /");
  await expect(page.getByTestId("era-stamps-1998")).toContainText("2/5");

  // Back on the machine: an earned stamp is not celebrated twice.
  await page.goto("/era/1998/desktop");
  await page.getByTestId("boot-screen").click();
  await page.getByTestId("app-browser").dblclick();
  await page.getByTestId("browser-address").fill("altavista.com");
  await page.getByTestId("browser-go").click();
  await expect(page.getByTestId("reconstruction")).toBeVisible();
  await expect(toasts.filter({ hasText: "Première connexion" })).toHaveCount(0);
});

test("2005: Julie reacts to a Wikipedia visit, and a video earns a stamp", async ({ page }) => {
  await page.goto("/era/2005/desktop");
  await page.getByTestId("boot-screen").click();
  await page.getByTestId("app-browser").dblclick();
  await page.getByTestId("browser-address").fill("wikipedia.org");
  await page.getByTestId("browser-go").click();
  const toasts = page.getByTestId("narrative-notification");
  await expect(toasts.filter({ hasText: "Nouveau message de Julie" })).toBeVisible();

  await page.getByTestId("app-messenger").dblclick();
  await page.getByTestId("contact-julie").click();
  await expect(page.getByTestId("messenger-log")).toContainText(
    "encyclopédie en ligne que tout le monde peut modifier",
  );

  await page.getByTestId("app-media-player").dblclick();
  await page.getByTestId("video-hamster-skate").click();
  await page.getByTestId("media-playpause").click();
  await expect(toasts.filter({ hasText: "Séance vidéo" })).toBeVisible();
});

test("a returning visitor with every 1998 stamp gets the reward wallpaper at boot", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const ids = [
      "w98-premiere-connexion",
      "w98-trop-tot",
      "w98-chercheur",
      "w98-archeologue",
      "w98-carnet",
    ];
    window.localStorage.setItem(
      "time-machine-passport",
      JSON.stringify(Object.fromEntries(ids.map((id) => [id, 1]))),
    );
  });
  await page.goto("/era/1998/desktop");
  await page.getByTestId("boot-screen").click();
  await expect(page.getByTestId("desktop")).toHaveAttribute("data-wallpaper", "#3a2a6a");
  await expect(
    page.getByTestId("narrative-notification").filter({ hasText: "Époque complétée" }),
  ).toBeVisible();
});
