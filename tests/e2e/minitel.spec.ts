import { expect, test } from "@playwright/test";

test("1985 boots straight into a Minitel: dial 3615, open DEMO, navigate, hang up", async ({
  page,
}) => {
  await page.goto("/era/1985/desktop");
  await page.getByTestId("boot-screen").click();

  // No desktop for this machine: the Minitel is the whole screen.
  await expect(page.getByTestId("desktop")).toHaveAttribute("data-shell", "terminal");
  await expect(page.getByTestId("app-list")).toHaveCount(0);
  const minitel = page.getByTestId("minitel");
  await expect(minitel).toHaveAttribute("data-phase", "idle");
  const screen = page.getByTestId("minitel-screen");
  await expect(screen).toContainText("1985");

  // Dial with the physical keyboard, connect with the on-screen key.
  await screen.click();
  await page.keyboard.type("3615");
  await page.getByTestId("mt-key-CONNEXION_FIN").click();
  await expect(minitel).toHaveAttribute("data-phase", "dialing");
  await expect(minitel).toHaveAttribute("data-phase", "kiosk", { timeout: 10_000 });
  await expect(screen).toContainText("Teletel 3");

  // Service mnemonic + ENVOI (Enter), then a menu choice.
  await page.keyboard.type("DEMO");
  await page.keyboard.press("Enter");
  await expect(minitel).toHaveAttribute("data-phase", "service", { timeout: 10_000 });
  await expect(screen).toContainText("3615 DEMO");
  await expect(screen).toContainText("GUIDE TIME MACHINE");

  await page.keyboard.type("2");
  await page.getByTestId("mt-key-ENVOI").click();
  await expect(screen).toContainText("NAVIGUER AVEC LES TOUCHES", { timeout: 10_000 });

  await page.getByTestId("mt-key-RETOUR").click();
  await expect(screen).toContainText("GUIDE TIME MACHINE", { timeout: 10_000 });

  // Unknown choice shows an error on the bottom row; ANNULATION clears the input.
  await page.keyboard.type("9");
  await page.keyboard.press("Enter");
  await expect(screen).toContainText("Choix inconnu");

  // Hang up: back to the idle screen with the call summary.
  await page.keyboard.press("End");
  await expect(minitel).toHaveAttribute("data-phase", "idle");
  await expect(screen).toContainText("Derniere communication");
});

test("3611 connects directly to the directory and looks up a fictional subscriber", async ({
  page,
}) => {
  await page.goto("/era/1985/desktop");
  await page.getByTestId("boot-screen").click();
  const screen = page.getByTestId("minitel-screen");
  await screen.click();
  await page.keyboard.type("3611");
  await page.keyboard.press("End");
  await expect(screen).toContainText("ANNUAIRE ELECTRONIQUE", { timeout: 10_000 });

  await page.keyboard.type("martin");
  await page.keyboard.press("Enter");
  await expect(screen).toContainText("2 reponse(s) pour MARTIN", { timeout: 10_000 });
  await expect(screen).toContainText("MARTIN Paul");

  // A service that opens in 1990 is unreachable in 1985.
  await page.keyboard.press("End");
  await page.keyboard.type("3615");
  await page.keyboard.press("End");
  await expect(screen).toContainText("Teletel 3", { timeout: 10_000 });
  await page.keyboard.type("FUTUR");
  await page.keyboard.press("Enter");
  await expect(screen).toContainText("n'existe pas encore");
});
