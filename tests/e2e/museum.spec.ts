import { expect, test } from "@playwright/test";

test("the museum has a gallery per era, built from sourced content", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("home-museum").click();
  await expect(page).toHaveURL(/\/museum$/);
  for (const id of ["1985", "1992", "1998", "2005", "2010"]) {
    await expect(page.getByTestId(`museum-gallery-${id}`)).toBeVisible();
  }

  await page.getByTestId("museum-gallery-1998").click();
  const gallery = page.getByTestId("museum-gallery");
  await expect(gallery).toContainText("1998 — Le Web grand public");

  // The machine comes from the Computer Engine's profile.
  await expect(page.getByTestId("museum-machine")).toContainText("modem 56 kbit/s");
  await expect(page.getByTestId("museum-machine")).toContainText("32 Mo");

  // Events are dated and sourced; uncertain ones say so.
  const google = page.getByTestId("museum-event-google-founded");
  await expect(google).toContainText("4 septembre 1998");
  await expect(google).toContainText("Sources");
  await expect(page.getByTestId("museum-event-first-web-server")).toContainText("à vérifier");
  // Sourcing quality is shown, not implied.
  await expect(page.getByTestId("museum-coverage")).toContainText(/\d+\/\d+ dates et sites/);

  // Only what was online in 1998.
  await expect(page.getByTestId("museum-site-altavista-com")).toBeVisible();
  await expect(page.getByTestId("museum-site-napster-com")).toHaveCount(0);

  // A gallery leads straight to its machine.
  await page.getByTestId("museum-boot").click();
  await expect(page).toHaveURL(/\/era\/1998\/(loading|desktop)$/);
});

test("an unknown gallery is a 404", async ({ page }) => {
  const response = await page.goto("/museum/1492");
  expect(response?.status()).toBe(404);
});
