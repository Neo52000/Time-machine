import type { MinitelAction, MinitelPage } from "@time-machine/content-schema";
import type { MinitelCatalog } from "./catalog";
import { composeScreen, layoutPage } from "./layout";
import {
  COLS,
  center,
  fit,
  line,
  videotexInput,
  wrap,
  type Screen,
  type ScreenLine,
} from "./screen";

/**
 * Minitel session — a pure state machine. The UI feeds keys in and renders
 * the screen out; latency is expressed as a `pending` transition the UI
 * resolves after the configured delay (no timers here, so it is testable).
 */
export type FunctionKey =
  | "CONNEXION_FIN"
  | "SOMMAIRE"
  | "ANNULATION"
  | "RETOUR"
  | "REPETITION"
  | "GUIDE"
  | "CORRECTION"
  | "SUITE"
  | "ENVOI";

export type Phase = "idle" | "dialing" | "kiosk" | "service" | "loading";

export interface Pending {
  kind: "dial" | "load";
  ms: number;
  /** State to switch to once the delay elapsed. */
  next: Omit<SessionState, "pending">;
}

export interface ServiceLocation {
  serviceId: string;
  pageId: string;
  /** Screen index within a paginated page. */
  screen: number;
  /** Generated page (lookup results / echo) replacing the catalogue page. */
  generated?: MinitelPage;
}

export interface SessionState {
  phase: Phase;
  /** Machine date; services outside their window are unreachable. */
  selectedDate: string;
  /** Text typed since the last ENVOI. */
  input: string;
  kioskCode?: string;
  location?: ServiceLocation;
  history: ServiceLocation[];
  /** Transient line shown on the bottom row. */
  message?: string;
  /** Simulated minutes connected (real seconds elapsed are the UI's business). */
  connectedAt?: number;
  lastDisconnect?: { kioskCode: string; durationMs: number };
  pending?: Pending;
}

export interface SessionOptions {
  dialMs: number;
  loadMs: number;
}

export const DEFAULT_SESSION_OPTIONS: SessionOptions = { dialMs: 2200, loadMs: 450 };

export function createSession(selectedDate: string): SessionState {
  return { phase: "idle", selectedDate, input: "", history: [] };
}

function isAvailable(
  item: { availableFrom: string; availableUntil?: string },
  date: string,
): boolean {
  if (item.availableFrom > date) return false;
  if (item.availableUntil && item.availableUntil < date) return false;
  return true;
}

function withMessage(state: SessionState, message: string): SessionState {
  return { ...state, message, input: "" };
}

function loading(
  state: SessionState,
  next: Omit<SessionState, "pending">,
  ms: number,
): SessionState {
  return { ...state, phase: "loading", pending: { kind: "load", ms, next } };
}

/** Called by the UI once `pending.ms` elapsed. */
export function resolvePending(state: SessionState): SessionState {
  return state.pending ? { ...state.pending.next } : state;
}

export function typeChar(state: SessionState, char: string, catalog: MinitelCatalog): SessionState {
  if (state.pending) return state;
  const normalized = videotexInput(char).replace(/[^A-Z0-9 .'-]/g, "");
  if (!normalized) return state;
  const max = state.phase === "idle" ? 4 : currentInputMax(state, catalog);
  if (state.input.length >= max) return state;
  return { ...state, input: state.input + normalized, message: undefined };
}

function currentInputMax(state: SessionState, catalog: MinitelCatalog): number {
  if (state.phase === "kiosk") return 12;
  const page = currentPage(state, catalog);
  const input = page?.blocks.find((b) => b.type === "input");
  return input ? input.maxLength : 1;
}

export function currentPage(
  state: SessionState,
  catalog?: MinitelCatalog,
): MinitelPage | undefined {
  if (!state.location) return undefined;
  if (state.location.generated) return state.location.generated;
  return catalog?.getPage(state.location.pageId);
}

function go(
  state: SessionState,
  catalog: MinitelCatalog,
  target: ServiceLocation,
  options: SessionOptions,
  pushHistory = true,
): SessionState {
  const history =
    pushHistory && state.location ? [...state.history, state.location] : state.history;
  const next: Omit<SessionState, "pending"> = {
    ...state,
    phase: "service",
    input: "",
    message: undefined,
    location: target,
    history,
  };
  return loading(state, next, options.loadMs);
}

function normalizeKey(input: string): string {
  return input.trim().toUpperCase();
}

function foldForSearch(text: string): string {
  return videotexInput(text).replace(/[^A-Z0-9]/g, "");
}

function runAction(
  state: SessionState,
  catalog: MinitelCatalog,
  action: MinitelAction,
  options: SessionOptions,
  value: string,
): SessionState {
  const serviceId = state.location!.serviceId;
  switch (action.type) {
    case "goto":
      return go(state, catalog, { serviceId, pageId: action.pageId, screen: 0 }, options);
    case "echo": {
      const page = catalog.getPage(action.pageId)!;
      const generated: MinitelPage = {
        ...page,
        blocks: [
          ...page.blocks,
          { type: "blank" },
          { type: "text", lines: wrap(value || "(vide)"), color: "cyan" },
        ],
      };
      return go(state, catalog, { serviceId, pageId: page.id, screen: 0, generated }, options);
    }
    case "lookup": {
      const dataset = catalog.getDataset(action.dataset)!;
      const needle = foldForSearch(value);
      const matches = needle
        ? dataset.rows.filter((row) => foldForSearch(row[action.field] ?? "").startsWith(needle))
        : [];
      const lines =
        matches.length === 0
          ? ["Aucun abonne ne correspond.", "Verifiez l'orthographe puis ENVOI."]
          : matches.flatMap((row) => [
              ...action.columns.map((col, i) =>
                i === 0 ? (row[col] ?? "") : `  ${row[col] ?? ""}`,
              ),
              "",
            ]);
      const generated: MinitelPage = {
        id: `generated:${action.dataset}:${needle}`,
        serviceId,
        title: action.resultsTitle,
        blocks: [
          {
            type: "text",
            lines: [`${matches.length} reponse(s) pour ${value.trim().toUpperCase()}`],
            color: "yellow",
          },
          { type: "rule" },
          { type: "text", lines },
        ],
      };
      return go(state, catalog, { serviceId, pageId: generated.id, screen: 0, generated }, options);
    }
  }
}

export function pressKey(
  state: SessionState,
  key: FunctionKey,
  catalog: MinitelCatalog,
  options: SessionOptions = DEFAULT_SESSION_OPTIONS,
): SessionState {
  if (state.pending) return state;

  if (key === "CORRECTION") {
    return { ...state, input: state.input.slice(0, -1) };
  }
  if (key === "ANNULATION") {
    return { ...state, input: "", message: undefined };
  }

  switch (state.phase) {
    case "idle":
      return pressIdle(state, key, catalog, options);
    case "kiosk":
      return pressKiosk(state, key, catalog, options);
    case "service":
      return pressService(state, key, catalog, options);
    default:
      return state;
  }
}

function disconnect(state: SessionState): SessionState {
  return {
    phase: "idle",
    selectedDate: state.selectedDate,
    input: "",
    history: [],
    message: "Fin de communication",
    lastDisconnect: state.kioskCode
      ? { kioskCode: state.kioskCode, durationMs: state.connectedAt ?? 0 }
      : undefined,
  };
}

function pressIdle(
  state: SessionState,
  key: FunctionKey,
  catalog: MinitelCatalog,
  options: SessionOptions,
): SessionState {
  if (key !== "CONNEXION_FIN" && key !== "ENVOI") return state;
  const code = state.input.trim();
  const kiosk = catalog.getKiosk(code);
  if (!kiosk) return withMessage(state, "Numero inconnu. Tapez 3611, 3614 ou 3615");
  if (!isAvailable(kiosk, state.selectedDate)) {
    return withMessage(state, `Le ${code} n'est pas encore en service`);
  }
  const base: Omit<SessionState, "pending"> = {
    phase: "kiosk",
    selectedDate: state.selectedDate,
    input: "",
    kioskCode: code,
    history: [],
    connectedAt: 0,
    message: undefined,
  };
  if (kiosk.directServiceId) {
    const service = catalog.getService(kiosk.directServiceId)!;
    const next: Omit<SessionState, "pending"> = {
      ...base,
      phase: "service",
      location: { serviceId: service.id, pageId: service.homePageId, screen: 0 },
    };
    return { ...state, phase: "dialing", pending: { kind: "dial", ms: options.dialMs, next } };
  }
  return { ...state, phase: "dialing", pending: { kind: "dial", ms: options.dialMs, next: base } };
}

function pressKiosk(
  state: SessionState,
  key: FunctionKey,
  catalog: MinitelCatalog,
  options: SessionOptions,
): SessionState {
  if (key === "CONNEXION_FIN") return disconnect(state);
  if (key !== "ENVOI") return state;
  const mnemonic = normalizeKey(state.input);
  if (!mnemonic) return withMessage(state, "Tapez le code du service puis ENVOI");
  const service = catalog.findService(state.kioskCode!, mnemonic);
  if (!service) return withMessage(state, `Service ${mnemonic} inconnu sur le ${state.kioskCode}`);
  if (!isAvailable(service, state.selectedDate)) {
    return withMessage(state, `${mnemonic} n'existe pas encore a cette date`);
  }
  return go(
    state,
    catalog,
    { serviceId: service.id, pageId: service.homePageId, screen: 0 },
    options,
    false,
  );
}

function pressService(
  state: SessionState,
  key: FunctionKey,
  catalog: MinitelCatalog,
  options: SessionOptions,
): SessionState {
  const location = state.location!;
  const service = catalog.getService(location.serviceId)!;
  const page = currentPage(state, catalog);
  if (!page) return disconnect(state);
  const layout = layoutPage(page);

  switch (key) {
    case "CONNEXION_FIN":
      return disconnect(state);
    case "SOMMAIRE":
      return go(
        state,
        catalog,
        { serviceId: service.id, pageId: service.homePageId, screen: 0 },
        options,
      );
    case "GUIDE":
      return service.guidePageId
        ? go(
            state,
            catalog,
            { serviceId: service.id, pageId: service.guidePageId, screen: 0 },
            options,
          )
        : withMessage(state, "Sommaire: accueil  Retour: page precedente  Envoi: valider");
    case "REPETITION":
      return { ...state, input: "", message: undefined };
    case "SUITE":
      if (location.screen < layout.screens.length - 1) {
        return {
          ...state,
          location: { ...location, screen: location.screen + 1 },
          message: undefined,
        };
      }
      return withMessage(state, "Derniere page");
    case "RETOUR": {
      if (location.screen > 0) {
        return {
          ...state,
          location: { ...location, screen: location.screen - 1 },
          message: undefined,
        };
      }
      const previous = state.history.at(-1);
      if (!previous) return withMessage(state, "Debut du service");
      return loading(
        state,
        {
          ...state,
          phase: "service",
          input: "",
          message: undefined,
          location: previous,
          history: state.history.slice(0, -1),
        },
        options.loadMs,
      );
    }
    case "ENVOI": {
      const value = state.input;
      const input = page.blocks.find((b) => b.type === "input");
      const menu = page.blocks.find((b) => b.type === "menu");
      if (menu) {
        const item = menu.items.find((i) => i.key === normalizeKey(value));
        if (item) return runAction(state, catalog, item.action, options, value);
      }
      if (input) {
        if (!value.trim()) return withMessage(state, `${input.label} : saisie obligatoire`);
        return runAction(state, catalog, input.action, options, value);
      }
      return withMessage(
        state,
        value.trim() ? "Choix inconnu" : "Utilisez Sommaire, Retour ou Suite",
      );
    }
    default:
      return state;
  }
}

/** Render the current state as a 25-row screen. */
export function renderScreen(state: SessionState, catalog: MinitelCatalog): Screen {
  const cursor = "█";
  switch (state.phase) {
    case "idle": {
      const body: ScreenLine[] = [
        line(""),
        { text: center("TIME MACHINE - MINITEL 1B"), color: "cyan", inverse: false },
        line(""),
        ...wrap("Composez le numero du service sur le clavier puis pressez CONNEXION/FIN.").map(
          (t) => line(t),
        ),
        line(""),
        line("  3611  Annuaire electronique", "yellow"),
        line("  3614  Teletel 2 (services)", "yellow"),
        line("  3615  Teletel 3 (services)", "yellow"),
        line(""),
        line(`  Numero : ${state.input}${cursor}`, "white"),
      ];
      if (state.lastDisconnect) {
        const s = Math.round(state.lastDisconnect.durationMs / 1000);
        const mm = String(Math.floor(s / 60)).padStart(2, "0");
        const ss = String(s % 60).padStart(2, "0");
        body.push(
          line(""),
          line(
            `  Derniere communication : ${mm}:${ss} sur le ${state.lastDisconnect.kioskCode}`,
            "green",
          ),
        );
      }
      return composeScreen({
        status: fit(
          " REPOS" + " ".repeat(COLS - 6 - state.selectedDate.length - 1) + state.selectedDate,
        ),
        body,
        bottom: state.message ?? "Tapez le numero puis CONNEXION/FIN",
        bottomColor: state.message ? "red" : "green",
      });
    }
    case "dialing":
      return composeScreen({
        status: fit(" CONNEXION EN COURS"),
        body: [
          line(""),
          line(""),
          {
            text: center("... " + (state.input || state.kioskCode || "") + " ..."),
            color: "yellow",
            inverse: false,
          },
          line(""),
          ...wrap("Le modem 1200/75 bauds negocie la liaison. Patientez.").map((t) => line(t)),
        ],
        bottom: "",
      });
    case "kiosk": {
      const kiosk = catalog.getKiosk(state.kioskCode!)!;
      return composeScreen({
        status: fit(` ${kiosk.code}  ${kiosk.name}`),
        body: [
          line(""),
          ...wrap(kiosk.notice).map((t) => line(t, "cyan")),
          line(""),
          line("Code du service puis ENVOI", "yellow"),
          line(""),
          line(`  ${state.input}${cursor}`),
        ],
        bottom: state.message ?? "ENVOI: valider   CONNEXION/FIN: raccrocher",
        bottomColor: state.message ? "red" : "green",
      });
    }
    case "loading":
      return composeScreen({
        status: fit(" ..."),
        body: [line(""), line("Chargement...", "yellow")],
        bottom: "",
      });
    case "service": {
      const page = currentPage(state, catalog)!;
      const service = catalog.getService(state.location!.serviceId)!;
      const layout = layoutPage(page);
      const screenIndex = Math.min(state.location!.screen, layout.screens.length - 1);
      const body = layout.screens[screenIndex] ?? [];
      const pager = layout.screens.length > 1 ? ` ${screenIndex + 1}/${layout.screens.length}` : "";
      const statusText = ` ${service.kioskCode} ${service.mnemonic}  ${page.title}`;
      const status = fit(
        statusText.slice(0, COLS - pager.length) +
          " ".repeat(Math.max(0, COLS - statusText.length - pager.length)) +
          pager,
      );
      const bottom = state.message ?? `${layout.prompt ?? "Choix"} ${state.input}${cursor}`;
      return composeScreen({ status, body, bottom, bottomColor: state.message ? "red" : "green" });
    }
  }
}
