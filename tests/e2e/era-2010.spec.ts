import { expect, test, type Page } from "@playwright/test";

async function bootPhone(page: Page) {
  await page.goto("/era/2010/desktop");
  await page.getByTestId("boot-screen").click();
  await expect(page.getByTestId("desktop")).toHaveAttribute("data-shell", "phone");
}

const toast = (page: Page, text: string) =>
  page.getByTestId("narrative-notification").filter({ hasText: text });

test("2010 boots a smartphone: home screen, 3G+, and Léa's first SMS", async ({ page }) => {
  await bootPhone(page);
  for (const app of ["sms", "camera", "store", "settings"]) {
    await expect(page.getByTestId(`app-${app}`)).toBeVisible();
  }
  await expect(page.getByTestId("phone-radio")).toHaveAttribute("data-radio", "mobile");
  await expect(toast(page, "Bienvenue en 2010")).toBeVisible();

  // Léa writes first; the home screen shows the unread badge.
  await expect(page.getByTestId("sms-badge")).toHaveText("1", { timeout: 10_000 });
  await page.getByTestId("app-sms").click();
  await page.getByTestId("sms-contact-lea").click();
  await expect(page.getByTestId("sms-thread")).toContainText("Envoie-moi une photo");
});

test("SMS: 160 characters, 70 with an ê, and long messages cost several SMS", async ({ page }) => {
  await bootPhone(page);
  await page.getByTestId("app-sms").click();
  await page.getByTestId("sms-contact-lea").click();
  const input = page.getByTestId("sms-input");
  const counter = page.getByTestId("sms-counter");

  await input.fill("Salut, ca va ?");
  await expect(counter).toHaveAttribute("data-encoding", "gsm7");
  await expect(counter).toContainText("146 / 160");
  await input.fill("On se voit à la fête ?");
  await expect(counter).toHaveAttribute("data-encoding", "ucs2");
  await expect(counter).toContainText("« ê »");
  await expect(counter).toContainText("48 / 70");

  await input.fill("a".repeat(200));
  await expect(counter).toHaveAttribute("data-segments", "2");
  await page.getByTestId("sms-send").click();
  await expect(page.getByTestId("sms-bubble").last()).toContainText("2 SMS");
  await expect(toast(page, "Premier SMS")).toBeVisible();
  await expect(toast(page, "Roman-fleuve")).toBeVisible();
  // No "is typing…" on SMS: the answer simply arrives.
  await expect(page.getByTestId("sms-thread")).toContainText("clapet", { timeout: 10_000 });
});

test("the store installs a game over 3G+, counted against the plan", async ({ page }) => {
  await bootPhone(page);
  await page.getByTestId("app-store").click();
  await expect(page.getByTestId("store-serpentin")).toContainText("2,3 Mo · 19,8 s en 3G+");
  await page.getByTestId("store-install-serpentin").click();
  await expect(page.getByTestId("store-open-serpentin")).toBeVisible({ timeout: 10_000 });
  await expect(toast(page, "Première appli")).toBeVisible();

  await page.getByTestId("phone-home").click();
  await page.getByTestId("app-settings").click();
  await expect(page.getByTestId("settings-data-used")).toContainText("2,3 Mo sur 500 Mo");

  await page.getByTestId("phone-home").click();
  await page.getByTestId("app-serpentin").click();
  await page.getByTestId("serpentin-start").click();
  await expect(page.getByTestId("serpentin-board")).toHaveAttribute("data-state", "playing");
});

test("photo: an MMS to Léa, then the full picture over Wi-Fi", async ({ page }) => {
  await bootPhone(page);
  await page.getByTestId("app-camera").click();
  await page.getByTestId("camera-shutter").click();
  await page.getByTestId("photo-1").click();
  await page.getByTestId("share-mms").click();
  await expect(page.getByTestId("share-progress")).toContainText("Photo envoyée à Léa");
  await expect(toast(page, "Photo envoyée")).toBeVisible();
  await expect(toast(page, "Reçu ta photo")).toBeVisible({ timeout: 10_000 });

  // Wi-Fi: faster, and free.
  await page.getByTestId("phone-home").click();
  await page.getByTestId("app-settings").click();
  await page.getByTestId("settings-wifi").check();
  await expect(page.getByTestId("phone-radio")).toHaveAttribute("data-radio", "wifi");
  await page.getByTestId("phone-home").click();
  await page.getByTestId("app-camera").click();
  await page.getByTestId("photo-1").click();
  await expect(page.getByTestId("share-upload")).toContainText("18,5 s en Wi-Fi");
  await page.getByTestId("share-upload").click();
  await expect(page.getByTestId("share-progress")).toContainText("Photo publiée", {
    timeout: 10_000,
  });
  await expect(toast(page, "Économe")).toBeVisible();

  // Airplane mode: nothing leaves the phone.
  await page.getByTestId("phone-home").click();
  await page.getByTestId("app-settings").click();
  await page.getByTestId("settings-airplane").check();
  await expect(page.getByTestId("phone-radio")).toHaveAttribute("data-radio", "none");
  await page.getByTestId("phone-home").click();
  await page.getByTestId("app-sms").click();
  await page.getByTestId("sms-contact-maman").click();
  await page.getByTestId("sms-input").fill("Je rentre");
  await page.getByTestId("sms-send").click();
  await expect(page.getByTestId("sms-error")).toContainText("mode avion");
});

test("the phone fits a phone screen without horizontal scrolling", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await bootPhone(page);
  const box = await page.getByTestId("desktop").boundingBox();
  expect(box).not.toBeNull();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(390);
  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(scrollWidth).toBeLessThanOrEqual(390);
});
