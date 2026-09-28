import { expect, test, type Page } from "@playwright/test";

async function expectNoHorizontalScroll(page: Page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
}

for (const viewport of [
  { name: "phone", width: 375, height: 740 },
  { name: "wide screen", width: 1600, height: 900 },
]) {
  test(`the vertical timeline reads in one column on a ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto("/");
    await expect(page.getByTestId("timeline")).toBeVisible();
    await expectNoHorizontalScroll(page);

    // Chronological, top to bottom: 1981 is above the 1998 station, which is above 2022.
    const top = async (testId: string) => (await page.getByTestId(testId).boundingBox())!.y;
    const ibm = await top("timeline-event-ibm-pc-launch");
    const station = await top("timeline-era-1998");
    const chatgpt = await top("timeline-event-chatgpt-release");
    expect(ibm).toBeLessThan(station);
    expect(station).toBeLessThan(chatgpt);

    // Same x for every entry: a single column, whatever the width.
    const x = async (testId: string) => (await page.getByTestId(testId).boundingBox())!.x;
    expect(await x("timeline-event-ibm-pc-launch")).toBe(await x("timeline-event-chatgpt-release"));
  });
}

test("filters keep the machines, jump links reach them, sources are cited", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 740 });
  await page.goto("/");

  const google = page.getByTestId("timeline-event-google-founded");
  await expect(google).toContainText("4 septembre 1998");
  await google.getByText(/^Sources/).click();
  await expect(google.getByRole("link", { name: /Google/ })).toBeVisible();
  await expect(page.getByTestId("timeline-event-www-proposal")).toContainText("à vérifier");

  await page.getByTestId("filter-mobile").click();
  await expect(page.getByTestId("filter-mobile")).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByTestId("timeline-event-iphone-announced")).toBeVisible();
  await expect(page.getByTestId("timeline-event-google-founded")).toHaveCount(0);
  for (const id of ["1985", "1992", "1998", "2005"]) {
    await expect(page.getByTestId(`timeline-era-${id}`)).toHaveCount(1);
  }
  await page.getByTestId("filter-reset").click();
  await expect(page.getByTestId("timeline-event-google-founded")).toHaveCount(1);

  await page.getByTestId("era-jump-2005").click();
  await expect(page).toHaveURL(/#era-2005$/);
  await expect(page.getByTestId("era-marker-2005")).toBeInViewport();
});
