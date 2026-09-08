"use client";

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import {
  createEraClock,
  eraNow,
  formatEraDate,
  formatEraTime,
  getFile,
  isDirectory,
  joinPath,
  listDirectory,
  normalizePath,
  parentPath,
  readTextFile,
} from "@time-machine/desktop-engine";
import type { AppProps } from "./types";

function dosPath(root: string, path: string): string {
  return `${root}${path === "/" ? "\\" : path.replace(/\//g, "\\")}`;
}

export function TerminalApp({ era, fs, closeSelf }: AppProps) {
  const [lines, setLines] = useState<string[]>([
    `Time Machine DOS [Version ${era.dateStart.slice(0, 4)}]`,
    "(C) Time Machine. Tapez 'help' pour la liste des commandes.",
    "",
  ]);
  const [cwd, setCwd] = useState("/");
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState<number | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const clockRef = useRef(createEraClock(era.dateStart));

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [lines]);

  function run(raw: string): string[] {
    const [cmd = "", ...args] = raw.trim().split(/\s+/);
    const arg = args.join(" ");
    switch (cmd.toLowerCase()) {
      case "":
        return [];
      case "help":
        return [
          "Commandes disponibles :",
          "  DIR / LS        Liste le contenu du dossier courant",
          "  CD <dossier>    Change de dossier (CD .. pour remonter)",
          "  TYPE / CAT <f>  Affiche un fichier texte",
          "  DATE, TIME      Date et heure de la machine",
          "  VER             Version du système",
          "  ECHO <texte>    Affiche le texte",
          "  CLS             Efface l'écran",
          "  EXIT            Ferme l'invite",
        ];
      case "dir":
      case "ls": {
        const entries = listDirectory(fs, cwd);
        return [
          ` Répertoire de ${dosPath(fs.root, cwd)}`,
          "",
          ...entries.map((f) =>
            isDirectory(f)
              ? `${"<REP>".padEnd(12)} ${f.name}`
              : `${String(f.size ?? 0).padStart(12)} ${f.name}`,
          ),
          `${entries.length} objet(s)`,
        ];
      }
      case "cd": {
        if (!arg || arg === "\\" || arg === "/") {
          setCwd("/");
          return [];
        }
        if (arg === "..") {
          setCwd(parentPath(cwd));
          return [];
        }
        const target =
          arg.startsWith("/") || arg.startsWith("\\") ? normalizePath(arg) : joinPath(cwd, arg);
        const file = getFile(fs, target);
        if (!file || !isDirectory(file)) return ["Dossier introuvable."];
        setCwd(normalizePath(target));
        return [];
      }
      case "type":
      case "cat": {
        if (!arg) return ["Syntaxe : TYPE <fichier>"];
        const target = arg.startsWith("/") ? arg : joinPath(cwd, arg);
        const content = readTextFile(fs, target);
        return content === undefined ? ["Fichier introuvable."] : content.split("\n");
      }
      case "date":
        return [`La date actuelle est : ${formatEraDate(eraNow(clockRef.current))}`];
      case "time":
        return [`L'heure actuelle est : ${formatEraTime(eraNow(clockRef.current))}`];
      case "ver":
        return [`Time Machine OS — machine ${era.machine.id}, ${era.label}`];
      case "echo":
        return [arg];
      case "cls":
        setLines([]);
        return [];
      case "exit":
        closeSelf();
        return [];
      default:
        return [`'${cmd}' n'est pas reconnu en tant que commande interne ou externe.`];
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const prompt = `${dosPath(fs.root, cwd)}>`;
    const output = run(input);
    setLines((prev) =>
      input.trim().toLowerCase() === "cls" ? [] : [...prev, `${prompt}${input}`, ...output, ""],
    );
    if (input.trim()) setHistory((h) => [...h, input]);
    setHistoryIdx(null);
    setInput("");
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowUp" && history.length) {
      e.preventDefault();
      const idx = historyIdx === null ? history.length - 1 : Math.max(0, historyIdx - 1);
      setHistoryIdx(idx);
      setInput(history[idx] ?? "");
    } else if (e.key === "ArrowDown" && historyIdx !== null) {
      e.preventDefault();
      const idx = historyIdx + 1;
      if (idx >= history.length) {
        setHistoryIdx(null);
        setInput("");
      } else {
        setHistoryIdx(idx);
        setInput(history[idx] ?? "");
      }
    }
  }

  return (
    <div
      className="tm-terminal flex h-full flex-col overflow-auto p-1 font-mono text-xs"
      onClick={() => inputRef.current?.focus()}
      data-testid="terminal"
    >
      <pre className="whitespace-pre-wrap">{lines.join("\n")}</pre>
      <form onSubmit={onSubmit} className="flex">
        <span>{dosPath(fs.root, cwd)}&gt;</span>
        <input
          ref={inputRef}
          className="flex-1 bg-transparent outline-none"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          autoFocus
          spellCheck={false}
          autoComplete="off"
          aria-label="Ligne de commande"
          data-testid="terminal-input"
        />
      </form>
      <div ref={bottomRef} />
    </div>
  );
}
