import type { VirtualFile } from "@time-machine/content-schema";

/**
 * Virtual filesystem — an in-memory, read-only tree seeded per era. The
 * file manager, notepad, and terminal all read through these helpers so the
 * "disk" the user sees is consistent across apps.
 */
export interface VirtualFileSystem {
  root: string;
  files: VirtualFile[];
  /** Text contents addressed by `VirtualFile.contentRef`. */
  contents: Record<string, string>;
}

export const DIRECTORY_TYPE = "directory";

function normalizePath(path: string): string {
  if (path === "" || path === "/") return "/";
  const cleaned = path.replace(/\\/g, "/").replace(/\/+$/, "");
  return cleaned.startsWith("/") ? cleaned : `/${cleaned}`;
}

function parentPath(path: string): string {
  const normalized = normalizePath(path);
  if (normalized === "/") return "/";
  const idx = normalized.lastIndexOf("/");
  return idx <= 0 ? "/" : normalized.slice(0, idx);
}

export function isDirectory(file: VirtualFile): boolean {
  return file.type === DIRECTORY_TYPE;
}

export function getFile(fs: VirtualFileSystem, path: string): VirtualFile | undefined {
  const normalized = normalizePath(path);
  return fs.files.find((f) => normalizePath(f.path) === normalized);
}

/** Direct children of a directory, directories first, then alphabetical. */
export function listDirectory(fs: VirtualFileSystem, path: string): VirtualFile[] {
  const normalized = normalizePath(path);
  return fs.files
    .filter((f) => !f.hidden && parentPath(f.path) === normalized && normalizePath(f.path) !== "/")
    .sort((a, b) => {
      const dirDiff = Number(isDirectory(b)) - Number(isDirectory(a));
      return dirDiff !== 0 ? dirDiff : a.name.localeCompare(b.name, "fr");
    });
}

export function readTextFile(fs: VirtualFileSystem, path: string): string | undefined {
  const file = getFile(fs, path);
  if (!file || isDirectory(file) || !file.contentRef) return undefined;
  return fs.contents[file.contentRef];
}

export function joinPath(base: string, name: string): string {
  const normalized = normalizePath(base);
  return normalized === "/" ? `/${name}` : `${normalized}/${name}`;
}

export { normalizePath, parentPath };

/** Seed disk for the 1998 machine. Content is fictional but period-accurate. */
const fs1998: VirtualFileSystem = {
  root: "C:",
  files: [
    { id: "root", path: "/", name: "C:", type: DIRECTORY_TYPE },
    { id: "docs", path: "/Mes Documents", name: "Mes Documents", type: DIRECTORY_TYPE },
    { id: "programs", path: "/Program Files", name: "Program Files", type: DIRECTORY_TYPE },
    { id: "windows", path: "/Windows", name: "Windows", type: DIRECTORY_TYPE },
    { id: "temp", path: "/Temp", name: "Temp", type: DIRECTORY_TYPE },
    {
      id: "readme",
      path: "/Mes Documents/LISEZMOI.txt",
      name: "LISEZMOI.txt",
      type: "text/plain",
      size: 612,
      contentRef: "readme-1998",
      modifiedAt: "1998-03-14T09:12:00Z",
    },
    {
      id: "favoris",
      path: "/Mes Documents/favoris.txt",
      name: "favoris.txt",
      type: "text/plain",
      size: 188,
      contentRef: "favoris-1998",
      modifiedAt: "1998-06-02T18:40:00Z",
    },
    {
      id: "modem",
      path: "/Mes Documents/connexion-modem.txt",
      name: "connexion-modem.txt",
      type: "text/plain",
      size: 344,
      contentRef: "modem-1998",
      modifiedAt: "1998-01-20T21:05:00Z",
    },
    {
      id: "autoexec",
      path: "/autoexec.bat",
      name: "autoexec.bat",
      type: "text/plain",
      size: 96,
      contentRef: "autoexec",
      modifiedAt: "1998-01-05T10:00:00Z",
    },
    {
      id: "config",
      path: "/config.sys",
      name: "config.sys",
      type: "text/plain",
      size: 74,
      contentRef: "config",
      modifiedAt: "1998-01-05T10:00:00Z",
    },
    {
      id: "swap",
      path: "/win386.swp",
      name: "win386.swp",
      type: "application/octet-stream",
      size: 33554432,
      hidden: true,
    },
    {
      id: "browser-dir",
      path: "/Program Files/Time Browser",
      name: "Time Browser",
      type: DIRECTORY_TYPE,
    },
    {
      id: "browser-exe",
      path: "/Program Files/Time Browser/tbrowser.exe",
      name: "tbrowser.exe",
      type: "application/x-msdownload",
      size: 1_204_224,
      readonly: true,
    },
    {
      id: "win-exe",
      path: "/Windows/explorer.exe",
      name: "explorer.exe",
      type: "application/x-msdownload",
      size: 180_224,
      readonly: true,
    },
    {
      id: "win-notepad",
      path: "/Windows/notepad.exe",
      name: "notepad.exe",
      type: "application/x-msdownload",
      size: 52_736,
      readonly: true,
    },
  ],
  contents: {
    "readme-1998": [
      "Bienvenue sur votre machine de 1998.",
      "",
      "Cette machine simule un PC grand public de l'époque : Pentium II, 64 Mo",
      "de RAM, écran 800x600 et un modem 56k pour accéder au Web.",
      "",
      "Applications disponibles :",
      "  - Time Browser : naviguez sur le Web tel qu'il existait en 1998",
      "  - Explorateur  : parcourez le disque C:",
      "  - Bloc-notes   : ouvrez et lisez les fichiers texte",
      "  - Invite de commandes : tapez 'help' pour la liste des commandes",
      "  - Courrier     : consultez votre boîte aux lettres",
      "",
      "Aucun contenu n'est postérieur au 31 décembre 1998.",
    ].join("\n"),
    "favoris-1998": [
      "Mes sites favoris",
      "-----------------",
      "http://www.altavista.com",
      "http://www.yahoo.fr",
      "http://www.geocities.com",
      "http://www.multimania.com",
      "http://www.google.com   (nouveau, septembre)",
    ].join("\n"),
    "modem-1998": [
      "Connexion modem 56k",
      "",
      "1. Vérifier que la ligne téléphonique est libre.",
      "2. Lancer la connexion : le modem compose le numéro du fournisseur.",
      "3. Attendre le handshake (~20 secondes).",
      "4. Une fois connecté, ne pas décrocher le téléphone !",
      "",
      "Coût : communication locale, facturée à la minute.",
    ].join("\n"),
    autoexec: [
      "@ECHO OFF",
      "PATH=C:\\WINDOWS;C:\\WINDOWS\\COMMAND",
      "SET TEMP=C:\\TEMP",
      "MODE CON CP PREPARE=((850) C:\\WINDOWS\\COMMAND\\EGA.CPI)",
    ].join("\n"),
    config: ["DEVICE=C:\\WINDOWS\\HIMEM.SYS", "DOS=HIGH,UMB", "FILES=40", "BUFFERS=20"].join("\n"),
  },
};

const fsMinimal = (root: string): VirtualFileSystem => ({
  root,
  files: [{ id: "root", path: "/", name: root, type: DIRECTORY_TYPE }],
  contents: {},
});

const fileSystemsByMachine: Record<string, VirtualFileSystem> = {
  "pc-1998": fs1998,
};

/** Filesystem for a machine id; unknown machines get an empty disk. */
export function getFileSystem(machineId: string): VirtualFileSystem {
  return fileSystemsByMachine[machineId] ?? fsMinimal("C:");
}
