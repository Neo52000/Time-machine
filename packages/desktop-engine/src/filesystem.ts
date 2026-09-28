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

/**
 * Returns a new disk with one more text file (the seed disk is never
 * mutated). Used by the Narrative Engine's `create.file`: the parent
 * directory must already exist, and an existing path is left untouched so a
 * story can never overwrite the user's files.
 */
export function addTextFile(
  fs: VirtualFileSystem,
  file: { path: string; content: string; modifiedAt?: string },
): VirtualFileSystem {
  const path = normalizePath(file.path);
  const parent = getFile(fs, parentPath(path));
  if (!parent || !isDirectory(parent)) {
    throw new Error(`Cannot create "${path}": parent directory does not exist`);
  }
  if (getFile(fs, path)) return fs;
  const contentRef = `created:${path}`;
  const created: VirtualFile = {
    id: contentRef,
    path,
    name: path.slice(path.lastIndexOf("/") + 1),
    type: "text/plain",
    size: new TextEncoder().encode(file.content).length,
    contentRef,
    ...(file.modifiedAt ? { createdAt: file.modifiedAt, modifiedAt: file.modifiedAt } : {}),
  };
  return {
    ...fs,
    files: [...fs.files, created],
    contents: { ...fs.contents, [contentRef]: file.content },
  };
}

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
      "Cette machine simule un PC grand public de l'époque : processeur x86 à",
      "266 MHz, 32 Mo de RAM, écran 800x600 et un modem 56k pour le Web.",
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
      "http://www.altavista.com/",
      "http://www.yahoo.com/",
      "http://www.geocities.com/",
      "http://www.google.com/",
      "http://info.cern.ch/",
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

/** Seed disk for the 2005 machine. */
const fs2005: VirtualFileSystem = {
  root: "C:",
  files: [
    { id: "root", path: "/", name: "C:", type: DIRECTORY_TYPE },
    { id: "docs", path: "/Mes Documents", name: "Mes Documents", type: DIRECTORY_TYPE },
    { id: "music", path: "/Mes Documents/Ma Musique", name: "Ma Musique", type: DIRECTORY_TYPE },
    { id: "videos", path: "/Mes Documents/Mes Vidéos", name: "Mes Vidéos", type: DIRECTORY_TYPE },
    { id: "programs", path: "/Program Files", name: "Program Files", type: DIRECTORY_TYPE },
    {
      id: "readme",
      path: "/Mes Documents/LISEZMOI.txt",
      name: "LISEZMOI.txt",
      type: "text/plain",
      size: 420,
      contentRef: "readme-2005",
      modifiedAt: "2005-01-01T09:41:00Z",
    },
    {
      id: "favoris",
      path: "/Mes Documents/favoris.txt",
      name: "favoris.txt",
      type: "text/plain",
      size: 160,
      contentRef: "favoris-2005",
      modifiedAt: "2005-06-01T18:40:00Z",
    },
  ],
  contents: {
    "readme-2005": [
      "Bienvenue sur votre machine de 2005.",
      "",
      "Connexion ADSL permanente, écran plat 1024x768, et un Web qui devient",
      "social : blogs, messagerie instantanée, partage de vidéos.",
      "",
      "Time Browser n'affiche que ce qui existait fin 2005.",
    ].join("\n"),
    "favoris-2005": [
      "Mes sites favoris",
      "-----------------",
      "http://www.google.com/",
      "http://www.wikipedia.org/",
      "http://www.youtube.com/",
      "http://www.myspace.com/",
    ].join("\n"),
  },
};

/** Seed disk for the 1992 machine: DOS names, a BBS phone book, a download folder. */
const fs1992: VirtualFileSystem = {
  root: "C:",
  files: [
    { id: "root", path: "/", name: "C:", type: DIRECTORY_TYPE },
    { id: "docs", path: "/DOCS", name: "DOCS", type: DIRECTORY_TYPE },
    { id: "bbs", path: "/BBS", name: "BBS", type: DIRECTORY_TYPE },
    { id: "download", path: "/BBS/DOWNLOAD", name: "DOWNLOAD", type: DIRECTORY_TYPE },
    {
      id: "readme-1992",
      path: "/DOCS/LISEZMOI.TXT",
      name: "LISEZMOI.TXT",
      type: "text/plain",
      size: 540,
      contentRef: "readme-1992",
      modifiedAt: "1992-02-10T18:30:00Z",
    },
    {
      id: "bbs-list",
      path: "/BBS/ANNUAIRE.TXT",
      name: "ANNUAIRE.TXT",
      type: "text/plain",
      size: 380,
      contentRef: "bbs-list-1992",
      modifiedAt: "1992-01-20T21:05:00Z",
    },
    {
      id: "autoexec-1992",
      path: "/AUTOEXEC.BAT",
      name: "AUTOEXEC.BAT",
      type: "text/plain",
      size: 96,
      contentRef: "autoexec-1992",
    },
  ],
  contents: {
    "readme-1992": [
      "Bienvenue sur votre machine de 1992.",
      "",
      "Un PC familial : processeur x86 à 33 MHz, 4 Mo de mémoire, écran VGA",
      "640x480 et un modem 14 400 bit/s branché sur la ligne téléphonique.",
      "",
      "Le modem sert surtout à appeler des BBS : des serveurs tenus par des",
      "passionnés, avec forums, fichiers à télécharger et messagerie.",
      "Lancez « Terminal BBS » et choisissez un serveur dans l'annuaire.",
      "",
      "Le Web existe déjà, mais il ne compte qu'une poignée de sites :",
      "essayez info.cern.ch dans le Time Browser.",
      "",
      "Les BBS de cette machine sont fictifs.",
    ].join("\n"),
    "bbs-list-1992": [
      "ANNUAIRE DES BBS (fictif)",
      "-------------------------",
      "LE GRENIER NUMERIQUE   forums, fichiers, messagerie",
      "PIXEL CLUB             graphisme et images",
      "LA PASSERELLE          informations et petites annonces",
      "",
      "Tarif : communication téléphonique normale, à la durée.",
      "Pensez à raccrocher !",
    ].join("\n"),
    "autoexec-1992": ["@ECHO OFF", "PATH=C:\\TMDOS;C:\\BBS", "SET TEMP=C:\\TEMP"].join("\n"),
  },
};

const fileSystemsByMachine: Record<string, VirtualFileSystem> = {
  "pc-1992": fs1992,
  "pc-1998": fs1998,
  "pc-2005": fs2005,
};

/** Filesystem for a machine id; unknown machines get an empty disk. */
export function getFileSystem(machineId: string): VirtualFileSystem {
  return fileSystemsByMachine[machineId] ?? fsMinimal("C:");
}
