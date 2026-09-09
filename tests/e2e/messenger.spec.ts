import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/era/2005/desktop");
  await page.getByTestId("boot-screen").click();
  await page.getByTestId("app-messenger").dblclick();
  await expect(page.getByTestId("messenger-contacts")).toBeVisible();
});

test("Messenger shows contact presence and plays a scripted conversation", async ({ page }) => {
  await expect(page.getByTestId("contact-julie")).toContainText("en ligne");
  await expect(page.getByTestId("contact-marc")).toContainText("hors ligne");
  await expect(page.getByTestId("contact-marc")).toBeDisabled(); // no conversation of his own

  await page.getByTestId("contact-julie").click();
  await expect(page.getByTestId("messenger-typing")).toBeVisible();
  await expect(page.getByTestId("message-j1")).toContainText("Salut ! T'es la ?", {
    timeout: 3000,
  });
  await expect(page.getByTestId("message-j5")).toContainText("a plus tard", { timeout: 10_000 });
  await expect(page.getByTestId("messenger-typing")).toHaveCount(0);

  // Background presence: Marc comes online after 5s even with Julie's chat open.
  await expect(page.getByTestId("contact-marc")).toContainText("en ligne", { timeout: 8000 });
});

test("Messenger lets the user send a message into the open conversation", async ({ page }) => {
  await page.getByTestId("contact-servicemsn").click();
  await expect(page.getByTestId("message-s1")).toBeVisible({ timeout: 3000 });

  await page.getByTestId("messenger-input").fill("Salut !");
  await page.getByTestId("messenger-send").click();
  await expect(page.getByTestId("messenger-log")).toContainText("Moi : Salut !");
  await expect(page.getByTestId("messenger-input")).toHaveValue("");
});
