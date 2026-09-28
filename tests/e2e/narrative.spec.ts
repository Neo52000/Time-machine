import { expect, test, type Page } from "@playwright/test";

/** Records every narrative trigger that fires (NarrativeProvider's DOM event). */
async function captureStory(page: Page) {
  await page.addInitScript(() => {
    const fired: string[] = [];
    (window as unknown as { __tmStory: string[] }).__tmStory = fired;
    document.addEventListener("tm:narrative", (e) =>
      fired.push((e as CustomEvent<{ id: string }>).detail.id),
    );
  });
}

const story = (page: Page) =>
  page.evaluate(() => (window as unknown as { __tmStory: string[] }).__tmStory);

test("1998: the story greets the user, explains a temporal 404 and writes a travel log", async ({
  page,
}) => {
  await captureStory(page);
  await page.goto("/era/1998/desktop");
  await page.getByTestId("boot-screen").click();

  const toasts = page.getByTestId("narrative-notification");
  await expect(toasts.filter({ hasText: "Bienvenue en 1998" })).toBeVisible();

  // A site that does not exist yet: the explanation names it.
  await page.getByTestId("app-browser").dblclick();
  await page.getByTestId("browser-address").fill("www.napster.com");
  await page.getByTestId("browser-address").press("Enter");
  await expect(toasts.filter({ hasText: "napster.com n'existe pas encore" })).toBeVisible();

  // Visit + search + open a document, in any order, releases the travel log.
  await page.getByTestId("browser-address").fill("altavista.com");
  await page.getByTestId("browser-go").click();
  await page.getByTestId("page-search-input").fill("modem");
  await page.getByTestId("page-search-form").locator("button").click();
  await expect(page.getByTestId("search-results")).toBeVisible();
  expect(await story(page)).not.toContain("explorer-1998");

  await page.getByTestId("app-terminal").dblclick();
  const terminalInput = page.getByTestId("terminal-input");
  await terminalInput.fill("cd Mes Documents");
  await terminalInput.press("Enter");
  await terminalInput.fill("type LISEZMOI.txt");
  await terminalInput.press("Enter");
  await expect(toasts.filter({ hasText: "Carnet de voyage.txt" })).toBeVisible();
  expect(await story(page)).toEqual(
    expect.arrayContaining(["welcome-1998", "not-yet-online", "explorer-1998"]),
  );

  // The file really is on the virtual disk, readable by every app.
  await page.getByTestId("app-file-manager").dblclick();
  await page.getByTestId("fm-entry-Mes Documents").getByRole("button").dblclick();
  await page.getByTestId("fm-entry-Carnet de voyage.txt").getByRole("button").dblclick();
  await expect(page.getByTestId("notepad-text")).toHaveValue(/CARNET DE VOYAGE — 1998/);

  // Balloons can be dismissed by hand.
  const log = toasts.filter({ hasText: "Carnet de voyage.txt" });
  await log.getByRole("button").click();
  await expect(log).toHaveCount(0);
});

test("1985: opening a Minitel service is a story beat on the full-screen shell", async ({
  page,
}) => {
  await captureStory(page);
  await page.goto("/era/1985/desktop");
  await page.getByTestId("boot-screen").click();
  await page.getByTestId("minitel-screen").click();
  await page.keyboard.type("3615");
  await page.getByTestId("mt-key-CONNEXION_FIN").click();
  await expect(page.getByTestId("minitel")).toHaveAttribute("data-phase", "kiosk", {
    timeout: 10_000,
  });
  await page.keyboard.type("DEMO");
  await page.keyboard.press("Enter");
  await expect(
    page.getByTestId("narrative-notification").filter({ hasText: "Service ouvert" }),
  ).toContainText("3615 demo", {
    timeout: 10_000,
  });
  expect(await story(page)).toEqual(
    expect.arrayContaining(["minitel-first-service", "stamp-m-premier-service"]),
  );
});
