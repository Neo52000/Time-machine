import { expect, test } from "@playwright/test";

const TEST_EVENT_ID = "e2e-test-event";

test.describe.configure({ mode: "serial" });

test("create a needs-research draft, then clear it and publish", async ({ page }) => {
  await page.goto("/events/new");

  await page.getByTestId("field-id").fill(TEST_EVENT_ID);
  await page.getByTestId("field-date").fill("2000-01-01");
  await page.getByTestId("field-title").fill("E2E Test Event");
  await page.getByTestId("field-summary").fill("Created by the admin e2e test.");
  await page.getByTestId("field-needs-research").check();

  await page.getByRole("button", { name: "Save" }).click();
  await page.waitForURL("/events");

  await expect(page.getByTestId(`event-row-${TEST_EVENT_ID}`)).toBeVisible();
  await expect(page.getByTestId(`event-status-${TEST_EVENT_ID}`)).toContainText("Needs research");

  // Open it back up: the research flag round-tripped.
  await page.getByRole("link", { name: "E2E Test Event" }).click();
  await expect(page.getByTestId("field-needs-research")).toBeChecked();

  // Clear the blocker and publish — this must now succeed.
  await page.getByTestId("field-needs-research").uncheck();
  await page.getByTestId("field-published").check();
  await page.getByRole("button", { name: "Save" }).click();
  await page.waitForURL("/events");

  await expect(page.getByTestId(`event-status-${TEST_EVENT_ID}`)).toContainText("Published");

  // Cleanup so repeated local runs against a reused dev server start clean.
  page.once("dialog", (dialog) => dialog.accept());
  await page
    .getByTestId(`event-row-${TEST_EVENT_ID}`)
    .getByRole("button", { name: "Delete" })
    .click();
  await expect(page.getByTestId(`event-row-${TEST_EVENT_ID}`)).toHaveCount(0);
});

test("refuses to publish while still flagged needs-research", async ({ page }) => {
  await page.goto("/events/new");

  await page.getByTestId("field-id").fill("e2e-test-blocked-event");
  await page.getByTestId("field-date").fill("2000-01-01");
  await page.getByTestId("field-title").fill("E2E Blocked Event");
  await page.getByTestId("field-summary").fill("Should be rejected.");
  await page.getByTestId("field-needs-research").check();
  await page.getByTestId("field-published").check();

  await page.getByRole("button", { name: "Save" }).click();

  // Rejected: still on the form, with the reason surfaced to the editor.
  await expect(page).toHaveURL("/events/new");
  await expect(page.locator(".error-banner")).toContainText(/needing research/i);
});

test("refuses to publish a snapshot with unknown rights status", async ({ page }) => {
  await page.goto("/snapshots/new");

  await page.getByTestId("field-id").fill("e2e-test-blocked-snapshot");
  await page.getByTestId("field-website-id").fill("altavista-com");
  await page.getByTestId("field-captured-at").fill("1998-01-01");
  await page.getByTestId("field-content-ref").fill("placeholder.png");
  await page.getByTestId("field-rights-status").selectOption("unknown");
  await page.getByTestId("field-published").check();

  await page.getByRole("button", { name: "Save" }).click();

  await expect(page).toHaveURL("/snapshots/new");
  await expect(page.locator(".error-banner")).toContainText(/rights status is "unknown"/i);
});

test("creates a minitel service draft and lists it", async ({ page }) => {
  await page.goto("/minitel-services/new");

  await page.getByTestId("field-id").fill("e2e-test-minitel-service");
  await page.getByTestId("field-kiosk-code").fill("3615");
  await page.getByTestId("field-mnemonic").fill("E2E");
  await page.getByTestId("field-title").fill("E2E Test Service");
  await page.getByTestId("field-description").fill("Created by the admin e2e test.");
  await page.getByTestId("field-home-page-id").fill("e2e-home");
  await page.getByTestId("field-available-from").fill("1985-01-01");

  await page.getByRole("button", { name: "Save" }).click();
  await page.waitForURL("/minitel-services");

  await expect(page.getByTestId("minitel-service-row-e2e-test-minitel-service")).toBeVisible();

  page.once("dialog", (dialog) => dialog.accept());
  await page
    .getByTestId("minitel-service-row-e2e-test-minitel-service")
    .getByRole("button", { name: "Delete" })
    .click();
  await expect(page.getByTestId("minitel-service-row-e2e-test-minitel-service")).toHaveCount(0);
});

test("creates a video clip draft and lists it", async ({ page }) => {
  await page.goto("/video-clips/new");

  await page.getByTestId("field-id").fill("e2e-test-video-clip");
  await page.getByTestId("field-title").fill("E2E Test Clip");
  await page.getByTestId("field-uploader").fill("e2e");
  await page.getByTestId("field-upload-date").fill("2005-01-01");
  await page.getByTestId("field-description").fill("Created by the admin e2e test.");

  await page.getByRole("button", { name: "Save" }).click();
  await page.waitForURL("/video-clips");

  await expect(page.getByTestId("video-clip-row-e2e-test-video-clip")).toBeVisible();

  page.once("dialog", (dialog) => dialog.accept());
  await page
    .getByTestId("video-clip-row-e2e-test-video-clip")
    .getByRole("button", { name: "Delete" })
    .click();
  await expect(page.getByTestId("video-clip-row-e2e-test-video-clip")).toHaveCount(0);
});
