"use client";

import { useState } from "react";
import { readTextFile } from "@time-machine/desktop-engine";
import type { AppProps } from "./types";

export function NotepadApp({ fs, payload }: AppProps) {
  const path = typeof payload.path === "string" ? payload.path : undefined;
  const initial = path ? (readTextFile(fs, path) ?? "") : "";
  const [text, setText] = useState(initial);
  const [wrap, setWrap] = useState(true);
  const dirty = text !== initial;

  return (
    <div className="flex h-full flex-col">
      <div className="tm-menubar flex gap-3 px-2 py-0.5 text-xs">
        <span className="opacity-60">Fichier</span>
        <span className="opacity-60">Edition</span>
        <button type="button" className="hover:underline" onClick={() => setWrap((w) => !w)}>
          {wrap ? "☑" : "☐"} Retour à la ligne
        </button>
      </div>
      <textarea
        className="tm-textarea flex-1 resize-none p-2 font-mono text-sm outline-none"
        data-testid="notepad-text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        spellCheck={false}
        wrap={wrap ? "soft" : "off"}
        aria-label={path ?? "Sans titre"}
      />
      <div className="tm-statusbar px-2 py-0.5 text-xs">
        {path ? `${fs.root}${path.replace(/\//g, "\\")}` : "Sans titre"}
        {dirty ? " (modifié — disque en lecture seule)" : ""}
      </div>
    </div>
  );
}
