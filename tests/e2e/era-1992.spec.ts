import { expect, test, type Page } from "@playwright/test";

async function bootBbs(page: Page) {
  await page.goto("/era/1992/desktop");
  await page.getByTestId("boot-screen").click();
  await page.getByTestId("app-bbs").dblclick();
}

async function login(page: Page) {
  const screen = page.getByTestId("bbs-screen");
  await page.getByTestId("bbs-dial-grenier").click();
  await expect(screen).toHaveAttribute("data-phase", "dialing");
  await expect(screen).toContainText("ATDT 100000192");
  // The 14 400 bit/s handshake plays, then the board answers.
  await expect(screen).toHaveAttribute("data-phase", "login", { timeout: 15_000 });
  await expect(screen).toContainText("CONNECT 14400");
  const input = page.getByTestId("bbs-input");
  await input.fill("Voyageur");
  await input.press("Enter");
  await expect(screen).toContainText("bonjour Voyageur");
  return { screen, input };
}

test("1992 boots a VGA desktop with a BBS terminal and a one-site Web", async ({ page }) => {
  await page.goto("/era/1992/desktop");
  await page.getByTestId("boot-screen").click();
  await expect(page.getByTestId("desktop")).toHaveAttribute("data-theme", "vga-grey-1992");
  for (const app of ["bbs", "browser", "file-manager", "notepad", "terminal"]) {
    await expect(page.getByTestId(`app-${app}`)).toBeVisible();
  }
  await expect(page.getByTestId("narrative-notification").first()).toContainText(
    "Bienvenue en 1992",
  );

  await page.getByTestId("app-browser").dblclick();
  await page.getByTestId("browser-address").fill("info.cern.ch");
  await page.getByTestId("browser-go").click();
  await expect(page.getByTestId("reconstruction")).toHaveAttribute(
    "data-page-id",
    "page-info-cern-ch-1991-home",
  );
  await page.getByTestId("browser-address").fill("yahoo.com");
  await page.getByTestId("browser-go").click();
  await expect(page.getByTestId("temporal-404")).toHaveAttribute("data-reason", "not-yet-online");
});

test("call a BBS: read the forum, download a file, hang up", async ({ page }) => {
  await bootBbs(page);
  const { screen, input } = await login(page);

  await input.fill("F");
  await input.press("Enter");
  await input.fill("2");
  await input.press("Enter");
  await expect(screen).toContainText("Qui a déjà vu le World Wide Web");
  await input.fill("Q");
  await input.press("Enter");
  await input.fill("Q");
  await input.press("Enter");

  // Files: the download time is computed on the 14 400 bit/s modem.
  await input.fill("T");
  await input.press("Enter");
  await input.fill("2");
  await input.press("Enter");
  await expect(screen).toContainText(/MODEM144\.ZIP — 12 Ko \(8,\d s à 14/);
  await input.fill("T");
  await input.press("Enter");
  await expect(page.getByTestId("bbs-download")).toContainText("MODEM144.ZIP reçu", {
    timeout: 10_000,
  });
  await expect(
    page.getByTestId("narrative-notification").filter({ hasText: "Fichier reçu" }),
  ).toBeVisible();

  // The file is really on the disk.
  await page.getByTestId("app-file-manager").dblclick();
  await page.getByTestId("fm-entry-BBS").getByRole("button").dblclick();
  await page.getByTestId("fm-entry-DOWNLOAD").getByRole("button").dblclick();
  await expect(page.getByTestId("fm-entry-MODEM144.ZIP")).toBeVisible();

  // Goodbye hangs up the modem.
  await page.getByTestId("task-bbs").click();
  await input.fill("Q");
  await input.press("Enter");
  await input.fill("Q");
  await input.press("Enter");
  await input.fill("G");
  await input.press("Enter");
  await expect(screen).toHaveAttribute("data-phase", "offline");
  await expect(page.getByTestId("tray-modem")).toHaveAttribute("data-phase", "offline");
});

test("one phone line: busy while online, NO CARRIER when the tray hangs up", async ({ page }) => {
  await bootBbs(page);
  await login(page);
  // Hanging up from the tray drops the call.
  await page.getByTestId("tray-modem").click();
  await expect(page.getByTestId("bbs-screen")).toHaveAttribute("data-phase", "offline");
  await expect(page.getByTestId("bbs-screen")).toContainText("NO CARRIER");

  // Connect by hand from the tray, then try to call: the line is busy.
  await page.getByTestId("tray-modem").click();
  await expect(page.getByTestId("tray-modem")).toHaveAttribute("data-phase", "online", {
    timeout: 15_000,
  });
  await page.getByTestId("bbs-dial-pixelclub").click();
  await expect(page.getByTestId("bbs-busy")).toContainText("Ligne occupée");
});
