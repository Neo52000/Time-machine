import { describe, expect, it } from "vitest";
import { createMinitelCatalog } from "./catalog";
import { minitelCatalog } from "./content";
import { BODY_ROWS, layoutPage } from "./layout";
import { COLS, ROWS, center, fit, videotexInput, wrap } from "./screen";
import {
  createSession,
  currentPage,
  pressKey,
  renderScreen,
  resolvePending,
  typeChar,
  type FunctionKey,
  type SessionState,
} from "./session";

const cat = minitelCatalog;
const opts = { dialMs: 10, loadMs: 5 };

function type(state: SessionState, text: string): SessionState {
  return [...text].reduce((s, c) => typeChar(s, c, cat), state);
}
function press(state: SessionState, key: FunctionKey): SessionState {
  return pressKey(state, key, cat, opts);
}
/** Press a key and resolve the latency it produced, if any. */
function pressNow(state: SessionState, key: FunctionKey): SessionState {
  return resolvePending(press(state, key));
}
function connectTo(code: string, mnemonic?: string, date = "1985-06-01"): SessionState {
  let s = pressNow(type(createSession(date), code), "CONNEXION_FIN");
  if (mnemonic) s = pressNow(type(s, mnemonic), "ENVOI");
  return s;
}

describe("screen helpers", () => {
  it("fits, centres and wraps to 40 columns", () => {
    expect(fit("abc")).toHaveLength(COLS);
    expect(fit("x".repeat(60))).toHaveLength(COLS);
    expect(center("HELLO").trimEnd().length).toBeGreaterThan(5);
    for (const l of wrap(
      "Le Minitel affiche quarante colonnes sur vingt-cinq lignes en mode texte.",
    )) {
      expect(l.length).toBeLessThanOrEqual(COLS);
    }
  });

  it("folds typed characters like a videotex keyboard", () => {
    expect(videotexInput("démo été")).toBe("DEMO ETE");
  });
});

describe("catalogue", () => {
  it("loads the seed content with referential integrity", () => {
    expect(cat.kiosks.map((k) => k.code)).toEqual(["3611", "3614", "3615"]);
    expect(cat.findService("3615", "DEMO")?.title).toContain("Time Machine");
    for (const s of cat.services) expect(s.fictional).toBe(true);
  });

  it("rejects a page linking outside its service", () => {
    const stray = { ...cat.getPage("temps-home")!, serviceId: "demo" };
    expect(() =>
      createMinitelCatalog({
        kiosks: cat.kiosks,
        services: cat.services,
        pages: cat.pages.map((p) => (p.id === stray.id ? stray : p)),
        datasets: cat.datasets,
        sources: [],
      }),
    ).toThrow(/unknown source|links outside its service/);
  });
});

describe("layout", () => {
  it("paginates long pages and never exceeds the body height", () => {
    const layout = layoutPage(cat.getPage("demo-chrono")!);
    expect(layout.screens.length).toBeGreaterThan(1);
    for (const screen of layout.screens) expect(screen.length).toBeLessThanOrEqual(BODY_ROWS);
  });

  it("exposes the prompt of input pages", () => {
    expect(layoutPage(cat.getPage("annuaire-home")!).prompt).toBe("Nom :");
    expect(layoutPage(cat.getPage("demo-home")!).prompt).toBeUndefined();
  });
});

describe("session: dialling and kiosks", () => {
  it("renders a 25-row idle screen with the machine date", () => {
    const screen = renderScreen(createSession("1985-03-15"), cat);
    expect(screen).toHaveLength(ROWS);
    for (const l of screen) expect(l.text).toHaveLength(COLS);
    expect(screen[0]!.text).toContain("1985-03-15");
  });

  it("limits the number to 4 digits and rejects unknown numbers", () => {
    const s = type(createSession("1985-06-01"), "36159");
    expect(s.input).toBe("3615");
    const bad = press(type(createSession("1985-06-01"), "3699"), "CONNEXION_FIN");
    expect(bad.phase).toBe("idle");
    expect(bad.message).toMatch(/inconnu/);
  });

  it("dials with latency, then lands on the kiosk prompt", () => {
    const dialing = press(type(createSession("1985-06-01"), "3615"), "CONNEXION_FIN");
    expect(dialing.phase).toBe("dialing");
    expect(dialing.pending).toMatchObject({ kind: "dial", ms: 10 });
    const kiosk = resolvePending(dialing);
    expect(kiosk.phase).toBe("kiosk");
    expect(kiosk.kioskCode).toBe("3615");
    expect(renderScreen(kiosk, cat)[0]!.text).toContain("Teletel 3");
  });

  it("keys are ignored while a transition is pending", () => {
    const dialing = press(type(createSession("1985-06-01"), "3615"), "CONNEXION_FIN");
    expect(press(dialing, "ENVOI")).toBe(dialing);
    expect(typeChar(dialing, "A", cat)).toBe(dialing);
  });

  it("refuses a kiosk that is not in service at the machine date", () => {
    const s = press(type(createSession("1984-06-01"), "3615"), "CONNEXION_FIN");
    expect(s.phase).toBe("idle");
    expect(s.message).toMatch(/pas encore/);
  });

  it("direct kiosks (3611) connect straight to their service", () => {
    const s = connectTo("3611");
    expect(s.phase).toBe("service");
    expect(s.location?.serviceId).toBe("annuaire");
  });
});

describe("session: services and navigation", () => {
  it("reaches a service by mnemonic and shows its home page", () => {
    const s = connectTo("3615", "DEMO");
    expect(s.phase).toBe("service");
    expect(currentPage(s, cat)?.id).toBe("demo-home");
    expect(renderScreen(s, cat)[0]!.text).toContain("3615 DEMO");
  });

  it("reports unknown, empty and not-yet-open services", () => {
    const kiosk = pressNow(type(createSession("1985-06-01"), "3615"), "CONNEXION_FIN");
    expect(press(type(kiosk, "NOPE"), "ENVOI").message).toMatch(/inconnu/);
    expect(press(kiosk, "ENVOI").message).toMatch(/Tapez le code/);
    expect(press(type(kiosk, "FUTUR"), "ENVOI").message).toMatch(/pas encore/);
  });

  it("menu choice + ENVOI navigates, RETOUR and SOMMAIRE come back", () => {
    let s = connectTo("3615", "DEMO");
    s = pressNow(type(s, "2"), "ENVOI");
    expect(currentPage(s, cat)?.id).toBe("demo-touches");
    s = pressNow(s, "RETOUR");
    expect(currentPage(s, cat)?.id).toBe("demo-home");
    s = pressNow(type(s, "3"), "ENVOI");
    s = pressNow(s, "SOMMAIRE");
    expect(currentPage(s, cat)?.id).toBe("demo-home");
    expect(pressNow(type(s, "9"), "ENVOI").message).toMatch(/Choix inconnu/);
  });

  it("SUITE / RETOUR page through a long page before leaving it", () => {
    let s = connectTo("3615", "DEMO");
    s = pressNow(type(s, "4"), "ENVOI");
    expect(s.location?.screen).toBe(0);
    expect(renderScreen(s, cat)[0]!.text).toMatch(/1\/2/);
    s = press(s, "SUITE");
    expect(s.location?.screen).toBe(1);
    expect(press(s, "SUITE").message).toMatch(/Derniere/);
    s = press(s, "RETOUR");
    expect(s.location?.screen).toBe(0);
    s = pressNow(s, "RETOUR");
    expect(currentPage(s, cat)?.id).toBe("demo-home");
  });

  it("GUIDE shows the service guide, CORRECTION and ANNULATION edit the input", () => {
    let s = connectTo("3615", "DEMO");
    s = pressNow(s, "GUIDE");
    expect(currentPage(s, cat)?.id).toBe("demo-guide");
    s = type(s, "12");
    expect(s.input).toBe("1"); // menu-less page: single-character input
    s = press(s, "CORRECTION");
    expect(s.input).toBe("");
    s = press(type(connectTo("3611"), "DUP"), "ANNULATION");
    expect(s.input).toBe("");
  });

  it("lookup: prefix search over a dataset, accent-insensitive", () => {
    let s = connectTo("3611");
    s = pressNow(type(s, "dupont"), "ENVOI");
    const page = currentPage(s, cat)!;
    expect(page.title).toBe("Reponses");
    const text = renderScreen(s, cat)
      .map((l) => l.text)
      .join("\n");
    expect(text).toContain("2 reponse(s)");
    expect(text).toContain("DUPONT Marie");
    expect(text).toContain("43 55 12 34");
    const none = pressNow(type(pressNow(s, "RETOUR"), "ZZZ"), "ENVOI");
    expect(
      renderScreen(none, cat)
        .map((l) => l.text)
        .join("\n"),
    ).toContain("Aucun abonne");
    expect(press(connectTo("3611"), "ENVOI").message).toMatch(/obligatoire/);
  });

  it("echo: a typed message is shown on the confirmation page", () => {
    let s = connectTo("3614", "BAL");
    s = pressNow(type(s, "2"), "ENVOI");
    s = pressNow(type(s, "salut 1985"), "ENVOI");
    expect(
      renderScreen(s, cat)
        .map((l) => l.text)
        .join("\n"),
    ).toContain("SALUT 1985");
  });

  it("CONNEXION/FIN hangs up and returns to the idle screen", () => {
    const s = press(connectTo("3615", "TEMPS"), "CONNEXION_FIN");
    expect(s.phase).toBe("idle");
    expect(s.lastDisconnect?.kioskCode).toBe("3615");
    expect(
      renderScreen(s, cat)
        .map((l) => l.text)
        .join("\n"),
    ).toContain("Derniere communication");
  });
});
