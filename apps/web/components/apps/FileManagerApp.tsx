"use client";

import { useState } from "react";
import {
  isDirectory,
  joinPath,
  listDirectory,
  normalizePath,
  parentPath,
} from "@time-machine/desktop-engine";
import type { VirtualFile } from "@time-machine/content-schema";
import type { AppProps } from "./types";

function formatSize(size?: number): string {
  if (size === undefined) return "";
  if (size < 1024) return `${size} o`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} Ko`;
  return `${(size / (1024 * 1024)).toFixed(1)} Mo`;
}

function typeLabel(file: VirtualFile): string {
  if (isDirectory(file)) return "Dossier";
  if (file.type === "text/plain") return "Document texte";
  if (file.type === "application/x-msdownload") return "Application";
  return "Fichier";
}

export function FileManagerApp({ fs, payload, openApp }: AppProps) {
  const initial = typeof payload.path === "string" ? payload.path : "/";
  const [path, setPath] = useState(normalizePath(initial));
  const [selected, setSelected] = useState<string | null>(null);
  const entries = listDirectory(fs, path);

  function activate(file: VirtualFile) {
    if (isDirectory(file)) {
      setPath(normalizePath(file.path));
      setSelected(null);
    } else if (file.type === "text/plain") {
      openApp("notepad", { path: file.path });
    }
  }

  const displayPath = `${fs.root}${path === "/" ? "\\" : path.replace(/\//g, "\\")}`;

  return (
    <div className="flex h-full flex-col">
      <div className="tm-toolbar flex items-center gap-2 px-2 py-1">
        <button
          className="tm-btn"
          type="button"
          disabled={path === "/"}
          onClick={() => {
            setPath(parentPath(path));
            setSelected(null);
          }}
        >
          ↑ Dossier parent
        </button>
        <span className="text-xs">Adresse</span>
        <span className="tm-input flex-1 truncate font-mono text-xs" data-testid="fm-path">
          {displayPath}
        </span>
      </div>
      <div className="tm-app-body flex-1 overflow-auto">
        <table className="w-full border-collapse text-xs">
          <thead className="tm-table-head sticky top-0">
            <tr>
              <th className="px-2 py-1 text-left">Nom</th>
              <th className="px-2 py-1 text-right">Taille</th>
              <th className="px-2 py-1 text-left">Type</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((file) => {
              const isSelected = selected === file.id;
              return (
                <tr
                  key={file.id}
                  data-testid={`fm-entry-${file.name}`}
                  className="cursor-default select-none"
                  style={
                    isSelected
                      ? { background: "var(--tm-selection)", color: "var(--tm-title-text)" }
                      : undefined
                  }
                  onClick={() => setSelected(file.id)}
                  onDoubleClick={() => activate(file)}
                  onKeyDown={(e) => e.key === "Enter" && activate(file)}
                  tabIndex={0}
                >
                  <td className="px-2 py-0.5">
                    <span className="mr-1" aria-hidden>
                      {isDirectory(file) ? "📁" : file.type === "text/plain" ? "📄" : "▪"}
                    </span>
                    {file.name}
                  </td>
                  <td className="px-2 py-0.5 text-right">{formatSize(file.size)}</td>
                  <td className="px-2 py-0.5">{typeLabel(file)}</td>
                </tr>
              );
            })}
            {entries.length === 0 && (
              <tr>
                <td className="px-2 py-2 text-[var(--tm-text-muted)]" colSpan={3}>
                  Dossier vide
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="tm-statusbar px-2 py-0.5 text-xs">
        {entries.length} objet(s) — {joinPath(path, "")}
      </div>
    </div>
  );
}
