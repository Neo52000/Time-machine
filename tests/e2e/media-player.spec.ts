import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/era/2005/desktop");
  await page.getByTestId("boot-screen").click();
  await page.getByTestId("app-media-player").dblclick();
  await expect(page.getByTestId("media-library")).toBeVisible();
});

test("the video library gates clips by the machine's date and plays an unlocked one", async ({
  page,
}) => {
  // "Me at the zoo" is dated 23/04/2005; the 2005 machine boots on 01/01/2005.
  await expect(page.getByTestId("video-locked-meatthezoo")).toBeVisible();
  await expect(page.getByTestId("video-meatthezoo")).toBeDisabled();
  await expect(page.getByTestId("video-meatthezoo")).toContainText("Disponible le 23/04/2005");

  await expect(page.getByTestId("video-hamster-skate")).toBeEnabled();
  await page.getByTestId("video-hamster-skate").click();

  await expect(page.getByTestId("media-screen")).toBeVisible();
  await expect(page.getByTestId("media-time")).toContainText("0:24");
  await expect(page.getByTestId("media-comments")).toContainText("rongeur_addict");

  await page.getByTestId("media-playpause").click();
  const before = await page.getByTestId("media-scrubber").inputValue();
  await page.waitForTimeout(700);
  const after = await page.getByTestId("media-scrubber").inputValue();
  expect(Number(after)).toBeGreaterThan(Number(before));

  await page.getByTestId("media-playpause").click(); // pause
  const paused = await page.getByTestId("media-scrubber").inputValue();
  await page.waitForTimeout(400);
  expect(await page.getByTestId("media-scrubber").inputValue()).toBe(paused);

  await page.getByTestId("media-back").click();
  await expect(page.getByTestId("media-library")).toBeVisible();
});
