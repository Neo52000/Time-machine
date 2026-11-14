import { expect, test } from "@playwright/test";

const TEST_SOURCE_ID = "e2e-test-source";

test("a source is filed with its kind, defaulting to the weakest one", async ({ page }) => {
  await page.goto("/sources/new");
  await expect(page.getByTestId("field-kind")).toHaveValue("reference");

  await page.getByTestId("field-id").fill(TEST_SOURCE_ID);
  await page.getByTestId("field-label").fill("E2E press release");
  await page.getByTestId("field-kind").selectOption("primary");
  await page.getByTestId("field-url").fill("https://example.org/press");
  await page.getByRole("button", { name: "Save" }).click();
  await page.waitForURL("/sources");

  await expect(page.getByTestId(`source-kind-${TEST_SOURCE_ID}`)).toHaveText("primary");

  page.once("dialog", (dialog) => dialog.accept());
  await page
    .getByTestId(`source-row-${TEST_SOURCE_ID}`)
    .getByRole("button", { name: "Delete" })
    .click();
  await expect(page.getByTestId(`source-row-${TEST_SOURCE_ID}`)).toHaveCount(0);
});
