import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/admin");
  await expect(page.getByTestId("admin-queue")).toBeVisible();
});

test("the rights review queue surfaces seeded needsResearch items", async ({ page }) => {
  await expect(page.getByTestId("admin-queue-entry-minitelServices-annuaire")).toBeVisible();
  await expect(page.getByTestId("admin-queue-entry-minitelServices-annuaire")).toContainText(
    "research",
  );
  await expect(page.getByTestId("admin-queue-entry-videoClips-meatthezoo")).toBeVisible();

  await page
    .getByTestId("admin-queue-entry-minitelServices-annuaire")
    .getByText("Corriger")
    .click();
  await expect(page.getByTestId("admin-json-minitelServices-annuaire")).toBeVisible();
});

test("creates a source, then an event referencing it, and publishes the event", async ({
  page,
}) => {
  await page.getByTestId("admin-tab-sources").click();
  await page.getByTestId("admin-new-toggle-sources").click();
  await page
    .getByTestId("admin-new-json-sources")
    .fill(JSON.stringify({ id: "src-e2e-test", label: "Source de test e2e" }));
  await page.getByTestId("admin-new-submit-sources").click();
  await expect(page.getByTestId("admin-row-sources-src-e2e-test")).toBeVisible();

  await page.getByTestId("admin-tab-events").click();
  await page.getByTestId("admin-new-toggle-events").click();
  await page.getByTestId("admin-new-json-events").fill(
    JSON.stringify({
      id: "evt-e2e-test",
      date: "2000-01-01",
      title: "Evenement e2e",
      summary: "Cree par un test e2e",
      category: ["test"],
      importance: 1,
      sourceIds: ["src-e2e-test"],
    }),
  );
  await page.getByTestId("admin-new-submit-events").click();
  await expect(page.getByTestId("admin-row-events-evt-e2e-test")).toBeVisible();
  await expect(page.getByTestId("admin-status-events-evt-e2e-test")).toContainText("draft");

  await page.getByTestId("admin-publish-events-evt-e2e-test").click();
  await expect(page.getByTestId("admin-status-events-evt-e2e-test")).toContainText("published");
});

test("refuses to publish an asset left at unknown rights", async ({ page }) => {
  await page.getByTestId("admin-tab-videoClips").click();
  await page.getByTestId("admin-new-toggle-videoClips").click();
  await page.getByTestId("admin-new-json-videoClips").fill(
    JSON.stringify({
      id: "clip-e2e-unknown",
      title: "Clip douteux",
      uploader: "e2e",
      uploadDate: "2005-06-01",
      durationSeconds: 5,
      description: "...",
      category: ["test"],
      viewsAtLaunch: 0,
      visual: "zoo",
      sourceIds: [],
      rightsStatus: "unknown",
    }),
  );
  await page.getByTestId("admin-new-submit-videoClips").click();
  await expect(page.getByTestId("admin-row-videoClips-clip-e2e-unknown")).toBeVisible();

  let dialogMessage = "";
  page.once("dialog", async (dialog) => {
    dialogMessage = dialog.message();
    await dialog.accept();
  });
  await page.getByTestId("admin-publish-videoClips-clip-e2e-unknown").click();
  await expect.poll(() => dialogMessage).toContain("unknown");
  await expect(page.getByTestId("admin-status-videoClips-clip-e2e-unknown")).toContainText("draft");
});

test("refuses to delete a source still referenced by another item", async ({ page }) => {
  await page.getByTestId("admin-tab-sources").click();

  let dialogMessage = "";
  page.on("dialog", async (dialog) => {
    if (dialog.type() === "confirm") {
      dialogMessage = "";
      await dialog.accept();
      return;
    }
    dialogMessage = dialog.message();
    await dialog.accept();
  });

  await page.getByTestId("admin-delete-sources-src-wikipedia-minitel").click();
  await expect.poll(() => dialogMessage).toContain("still referenced by");
  await expect(page.getByTestId("admin-row-sources-src-wikipedia-minitel")).toBeVisible();
});
