import { expect, test } from "@playwright/test";

test("the terminal reports the machine profile and the browser times pages on its link", async ({
  page,
}) => {
  await page.goto("/era/1998/desktop");
  await page.getByTestId("boot-screen").click();

  await page.getByTestId("app-terminal").dblclick();
  const input = page.getByTestId("terminal-input");
  await input.fill("sysinfo");
  await input.press("Enter");
  const terminal = page.getByTestId("terminal");
  await expect(terminal).toContainText("Time Machine OS 98");
  await expect(terminal).toContainText("Processeur x86 266 MHz");
  await input.fill("mem");
  await input.press("Enter");
  await expect(terminal).toContainText("Mémoire totale : 32 Mo");

  await page.getByTestId("app-browser").dblclick();
  await expect(page.getByTestId("browser-home")).toContainText("via modem 56 kbit/s");
  await page.getByTestId("browser-address").fill("altavista.com");
  await page.getByTestId("browser-go").click();
  await expect(page.getByTestId("browser-status")).toContainText(
    /chargée en [\d,]+ (ms|s) \(modem 56 kbit\/s\)/,
  );
});

test("the 2005 machine is on broadband, not a modem", async ({ page }) => {
  await page.goto("/era/2005/desktop");
  await page.getByTestId("boot-screen").click();
  await page.getByTestId("app-browser").dblclick();
  await expect(page.getByTestId("browser-home")).toContainText("via ADSL 2 Mbit/s");
});
