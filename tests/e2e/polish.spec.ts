import { expect, test, type Page } from "@playwright/test";

interface AudioLog {
  event: string;
  cueId: string;
  segments: number;
}

/** Records every cue the AudioProvider resolves, whether or not it is audible. */
async function captureAudio(page: Page) {
  await page.addInitScript(() => {
    const log: AudioLog[] = [];
    (window as unknown as { __tmAudio: AudioLog[] }).__tmAudio = log;
    document.addEventListener("tm:audio", (e) => log.push((e as CustomEvent<AudioLog>).detail));
  });
}

function audioLog(page: Page): Promise<AudioLog[]> {
  return page.evaluate(() => (window as unknown as { __tmAudio: AudioLog[] }).__tmAudio);
}

test.describe("keyboard-only desktop", () => {
  test("windows cycle, minimize, maximize and close from the keyboard", async ({ page }) => {
    await page.goto("/era/1998/desktop");
    await page.getByTestId("boot-screen").click();

    // Open two apps with the keyboard: focus an icon, arrow down, Enter.
    await page.getByTestId("app-notepad").focus();
    await page.keyboard.press("Enter");
    const notepad = page.locator('[data-testid="window"][data-app-id="notepad"]');
    await expect(notepad).toHaveAttribute("data-active", "true");
    await expect(notepad).toHaveAttribute("role", "dialog");
    await expect(notepad).toHaveAttribute("aria-labelledby", /-title$/);

    await page.getByTestId("app-terminal").focus();
    await page.keyboard.press("ArrowDown");
    await expect(page.getByTestId("app-mail")).toBeFocused();
    await page.keyboard.press("Enter");
    const mail = page.locator('[data-testid="window"][data-app-id="mail"]');
    await expect(mail).toHaveAttribute("data-active", "true");
    await expect(notepad).toHaveAttribute("data-active", "false");

    // Ctrl+Alt+→ cycles in taskbar order, wrapping around.
    await page.keyboard.press("Control+Alt+ArrowRight");
    await expect(notepad).toHaveAttribute("data-active", "true");
    await page.keyboard.press("Control+Alt+ArrowLeft");
    await expect(mail).toHaveAttribute("data-active", "true");

    // Ctrl+Alt+M minimizes the active window; cycling brings it back.
    await page.keyboard.press("Control+Alt+m");
    await expect(mail).toBeHidden();
    await expect(page.getByTestId("task-mail")).toHaveAttribute("aria-pressed", "false");
    await page.keyboard.press("Control+Alt+ArrowRight");
    await expect(mail).toBeVisible();
    await expect(mail).toHaveAttribute("data-active", "true");

    // The title bar is focusable: arrows move, Enter maximizes.
    const titlebar = mail.getByTestId("window-titlebar");
    const before = await mail.evaluate((el) => parseInt(el.style.left, 10));
    await titlebar.focus();
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowRight");
    await expect.poll(() => mail.evaluate((el) => parseInt(el.style.left, 10))).toBe(before + 16);
    await page.keyboard.press("Control+Alt+Enter");
    await expect(mail).toHaveCSS("left", "0px");

    // Ctrl+Alt+X closes the active window; the other one becomes active.
    await page.keyboard.press("Control+Alt+x");
    await expect(mail).toHaveCount(0);
    await expect(notepad).toHaveAttribute("data-active", "true");
  });

  test("the start menu is a keyboard menu and lists the shortcuts", async ({ page }) => {
    await page.goto("/era/1998/desktop");
    await page.getByTestId("boot-screen").click();

    await page.keyboard.press("Control+Alt+s");
    await expect(page.getByTestId("start-menu")).toBeVisible();
    await expect(page.getByTestId("start-app-browser")).toBeFocused();
    await page.keyboard.press("ArrowDown");
    await expect(page.getByTestId("start-app-file-manager")).toBeFocused();
    await page.keyboard.press("End");
    await expect(page.getByTestId("start-shutdown")).toBeFocused();
    await expect(page.getByTestId("start-shortcuts")).toContainText("Ctrl+Alt+X fermer");

    await page.keyboard.press("Escape");
    await expect(page.getByTestId("start-menu")).toHaveCount(0);
    await expect(page.getByTestId("start-button")).toBeFocused();
  });
});

test.describe("reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("loading and boot collapse to a short, static sequence", async ({ page }) => {
    await page.goto("/era/1998/loading");
    const loading = page.getByTestId("loading-screen");
    await expect(loading).toHaveAttribute("data-reduced-motion", "true");
    await page.waitForURL(/\/era\/1998\/desktop/, { timeout: 3_000 });

    const boot = page.getByTestId("boot-screen");
    await expect(boot).toHaveAttribute("data-reduced-motion", "true");
    // Every boot line is present at once instead of trickling in.
    await expect(boot.locator("div")).toHaveCount(10);
    await expect(page.getByTestId("desktop")).toBeVisible({ timeout: 5_000 });
  });
});

test.describe("audio", () => {
  test("the Minitel dial plays the modem handshake and the mute persists", async ({ page }) => {
    await captureAudio(page);
    await page.goto("/era/1985/desktop");
    await page.getByTestId("boot-screen").click();
    const desktop = page.getByTestId("desktop");
    await expect(desktop).toHaveAttribute("data-audio-enabled", "true");
    await expect
      .poll(() => audioLog(page))
      .toContainEqual({
        event: "boot",
        cueId: "minitel-power",
        segments: 2,
      });

    await page.getByTestId("minitel-screen").click();
    await page.keyboard.type("3615");
    await page.getByTestId("mt-key-CONNEXION_FIN").click();
    await expect
      .poll(() => audioLog(page))
      .toContainEqual({
        event: "dial",
        cueId: "modem-handshake-v23",
        segments: 22,
      });
    await expect(page.getByTestId("minitel")).toHaveAttribute("data-phase", "kiosk", {
      timeout: 10_000,
    });
    await expect(page.getByTestId("minitel-status")).toContainText("Connecté au kiosque 3615");
    await expect
      .poll(() => audioLog(page))
      .toContainEqual({
        event: "connect",
        cueId: "minitel-carrier",
        segments: 1,
      });

    // Mute: cues still resolve (observable), but nothing is scheduled.
    await page.getByTestId("audio-toggle").click();
    await expect(desktop).toHaveAttribute("data-audio-enabled", "false");
    await page.getByTestId("mt-key-CONNEXION_FIN").click();
    await expect(page.getByTestId("minitel")).toHaveAttribute("data-phase", "idle");
    await expect
      .poll(() => audioLog(page))
      .toContainEqual({
        event: "disconnect",
        cueId: "minitel-hangup",
        segments: 0,
      });

    await page.reload();
    await page.getByTestId("boot-screen").click();
    await expect(page.getByTestId("audio-toggle")).toHaveAttribute("aria-pressed", "false");
  });

  test("a 1998 machine sounds windows opening and closing, not the modem", async ({ page }) => {
    await captureAudio(page);
    await page.goto("/era/1998/desktop");
    await page.getByTestId("boot-screen").click();
    await page.getByTestId("app-notepad").dblclick();
    await expect
      .poll(() => audioLog(page))
      .toContainEqual({
        event: "window-open",
        cueId: "pc-window-open",
        segments: 2,
      });
    await page.getByTestId("window-close").click();
    await expect
      .poll(() => audioLog(page))
      .toContainEqual({
        event: "window-close",
        cueId: "pc-window-close",
        segments: 2,
      });
    expect((await audioLog(page)).some((e) => e.event === "dial")).toBe(false);
  });
});

test.describe("analytics", () => {
  test("consent is asked once, events stay local and show up in the admin", async ({ page }) => {
    await page.goto("/");
    const banner = page.getByTestId("consent-banner");
    await expect(banner).toBeVisible();
    await page.getByTestId("consent-accept").click();
    await expect(banner).toHaveCount(0);

    await page.getByTestId("era-marker-1998").click();
    await page.waitForURL(/\/era\/1998\/desktop/, { timeout: 5_000 });
    await page.getByTestId("boot-screen").click();
    await page.getByTestId("app-notepad").dblclick();
    await expect(page.locator('[data-testid="window"][data-app-id="notepad"]')).toBeVisible();

    // A full navigation flushes the queue into the browser's local sink.
    await page.goto("/admin");
    await page.getByTestId("admin-tab-analytics").click();
    await expect(page.getByTestId("analytics-consent")).toHaveText("accordé");
    await expect(page.getByTestId("analytics-count-era.selected")).toContainText("1");
    await expect(page.getByTestId("analytics-count-boot.completed")).toBeVisible();
    await expect(page.getByTestId("analytics-count-app.opened")).toBeVisible();

    // Tabs are a real tablist: arrows move the selection.
    await page.getByTestId("admin-tab-analytics").focus();
    await page.keyboard.press("ArrowRight");
    await expect(page.getByTestId("admin-tab-queue")).toHaveAttribute("aria-selected", "true");

    await page.goto("/");
    await expect(page.getByTestId("consent-banner")).toHaveCount(0);
  });

  test("declining keeps every event out of storage", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("consent-decline").click();
    await page.getByTestId("era-marker-1998").click();
    await page.waitForURL(/\/era\/1998\/desktop/, { timeout: 5_000 });
    await page.getByTestId("boot-screen").click();

    await page.goto("/admin");
    await page.getByTestId("admin-tab-analytics").click();
    await expect(page.getByTestId("analytics-consent")).toHaveText("refusé");
    await expect(page.getByTestId("analytics-empty")).toBeVisible();
  });
});

test("the Messenger log is a live region and the file manager is keyboard-operable", async ({
  page,
}) => {
  await page.goto("/era/2005/desktop");
  await page.getByTestId("boot-screen").click();
  await page.getByTestId("app-messenger").dblclick();
  await page.getByTestId("contact-julie").click();
  await expect(page.getByTestId("messenger-log")).toHaveAttribute("role", "log");
  await expect(page.getByTestId("messenger-log")).toHaveAttribute("aria-live", "polite");

  await page.getByTestId("app-file-manager").dblclick();
  const entry = page.getByTestId("fm-entry-Mes Documents").getByRole("button");
  await entry.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByTestId("fm-path")).toContainText("Mes Documents");
});
