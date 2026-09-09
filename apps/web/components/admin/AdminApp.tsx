"use client";

import { useEffect, useState } from "react";
import {
  createItem,
  updateItem,
  deleteItem,
  publishItem,
  buildRightsQueue,
  type AdminState,
  type AdminCollectionKind,
  type AdminItem,
  type RightsQueueEntry,
} from "@time-machine/admin-engine";

const STORAGE_KEY = "time-machine-admin-state";

const KINDS: AdminCollectionKind[] = [
  "events",
  "sources",
  "snapshots",
  "minitelServices",
  "videoClips",
];

const KIND_LABELS: Record<AdminCollectionKind, string> = {
  events: "Événements",
  sources: "Sources",
  snapshots: "Snapshots",
  minitelServices: "Services Minitel",
  videoClips: "Clips vidéo",
};

const NEW_TEMPLATES: Record<AdminCollectionKind, string> = {
  events: JSON.stringify(
    {
      id: "",
      date: "YYYY-MM-DD",
      title: "",
      summary: "",
      category: [],
      importance: 3,
      sourceIds: [],
    },
    null,
    2,
  ),
  sources: JSON.stringify({ id: "", label: "" }, null, 2),
  snapshots: JSON.stringify(
    {
      id: "",
      websiteId: "",
      capturedAt: "YYYY-MM-DD",
      type: "reconstruction",
      contentRef: "",
      sourceIds: [],
      rightsStatus: "original",
    },
    null,
    2,
  ),
  minitelServices: JSON.stringify(
    {
      id: "",
      kioskCode: "3615",
      mnemonic: "",
      title: "",
      description: "",
      fictional: true,
      homePageId: "",
      availableFrom: "YYYY-MM-DD",
      sourceIds: [],
      rightsStatus: "original",
    },
    null,
    2,
  ),
  videoClips: JSON.stringify(
    {
      id: "",
      title: "",
      uploader: "",
      uploadDate: "YYYY-MM-DD",
      durationSeconds: 10,
      description: "",
      category: [],
      viewsAtLaunch: 0,
      visual: "zoo",
      sourceIds: [],
      rightsStatus: "original",
    },
    null,
    2,
  ),
};

function describeItem(kind: AdminCollectionKind, data: AdminItem["data"]): string {
  const d = data as Record<string, unknown>;
  switch (kind) {
    case "events":
      return String(d.title ?? "");
    case "sources":
      return String(d.label ?? "");
    case "snapshots":
      return `${String(d.websiteId ?? "")} — ${String(d.contentRef ?? "")}`;
    case "minitelServices":
      return `${String(d.title ?? "")} (${String(d.mnemonic ?? "")})`;
    case "videoClips":
      return String(d.title ?? "");
  }
}

function statusBadgeClass(status: AdminItem["status"]): string {
  if (status === "published") return "bg-emerald-900 text-emerald-300";
  if (status === "modified") return "bg-amber-900 text-amber-300";
  return "bg-sky-900 text-sky-300";
}

function severityBadgeClass(severity: RightsQueueEntry["severity"]): string {
  if (severity === "blocking") return "bg-red-900 text-red-300";
  if (severity === "review") return "bg-amber-900 text-amber-300";
  return "bg-sky-900 text-sky-300";
}

interface EditTarget {
  kind: AdminCollectionKind;
  id: string;
}

export function AdminApp({ initialState }: { initialState: AdminState }) {
  const [state, setState] = useState<AdminState>(initialState);
  const [activeTab, setActiveTab] = useState<AdminCollectionKind | "queue">("queue");
  const [edit, setEdit] = useState<EditTarget | null>(null);
  const [editText, setEditText] = useState("");
  const [editErrors, setEditErrors] = useState<string[]>([]);
  const [creatingKind, setCreatingKind] = useState<AdminCollectionKind | null>(null);
  const [createText, setCreateText] = useState("");
  const [createErrors, setCreateErrors] = useState<string[]>([]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setState(JSON.parse(raw) as AdminState);
    } catch {
      // ignore corrupted/unavailable local storage — the seed state stays in place
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // per-viewer convenience only; a full page still works without it
    }
  }, [state]);

  const openEdit = (kind: AdminCollectionKind, id: string) => {
    setActiveTab(kind);
    setEdit({ kind, id });
    setEditText(JSON.stringify(state[kind][id]?.data, null, 2));
    setEditErrors([]);
  };

  const closeEdit = () => {
    setEdit(null);
    setEditErrors([]);
  };

  const saveEdit = () => {
    if (!edit) return;
    let parsed: unknown;
    try {
      parsed = JSON.parse(editText);
    } catch (e) {
      setEditErrors([`JSON invalide : ${(e as Error).message}`]);
      return;
    }
    const patch = parsed as Record<string, unknown>;
    const result = updateItem(state, edit.kind, edit.id, patch);
    if (!result.ok) {
      setEditErrors(result.errors);
      return;
    }
    setState(result.state);
    closeEdit();
  };

  const remove = (kind: AdminCollectionKind, id: string) => {
    if (!window.confirm(`Supprimer ${kind}/${id} ?`)) return;
    const result = deleteItem(state, kind, id);
    if (!result.ok) {
      window.alert(result.errors.join("\n"));
      return;
    }
    setState(result.state);
  };

  const publish = (kind: AdminCollectionKind, id: string) => {
    const result = publishItem(state, kind, id);
    if (!result.ok) {
      window.alert(result.errors.join("\n"));
      return;
    }
    setState(result.state);
  };

  const startCreate = (kind: AdminCollectionKind) => {
    setActiveTab(kind);
    setCreatingKind(kind);
    setCreateText(NEW_TEMPLATES[kind]);
    setCreateErrors([]);
  };

  const submitCreate = () => {
    if (!creatingKind) return;
    let parsed: unknown;
    try {
      parsed = JSON.parse(createText);
    } catch (e) {
      setCreateErrors([`JSON invalide : ${(e as Error).message}`]);
      return;
    }
    const result = createItem(state, creatingKind, parsed);
    if (!result.ok) {
      setCreateErrors(result.errors);
      return;
    }
    setState(result.state);
    setCreatingKind(null);
    setCreateErrors([]);
  };

  const queue = buildRightsQueue(state);

  return (
    <div className="mx-auto max-w-5xl px-6 py-10 font-mono text-sm">
      <h1 className="mb-2 text-2xl font-bold tracking-wide text-white">Admin — Time Machine</h1>
      <p className="mb-6 max-w-2xl text-neutral-400">
        Brouillon de contenu par-dessus le catalogue statique (aucun backend pour l&apos;instant —
        voir <code>docs/roadmap.md</code>). Les changements sont conservés dans ce navigateur.
      </p>

      <nav className="mb-6 flex flex-wrap gap-2" data-testid="admin-tabs">
        <button
          type="button"
          onClick={() => setActiveTab("queue")}
          data-testid="admin-tab-queue"
          className={`rounded px-3 py-1.5 ${activeTab === "queue" ? "bg-white text-black" : "bg-neutral-800 text-neutral-300"}`}
        >
          File de révision des droits{queue.length > 0 ? ` (${queue.length})` : ""}
        </button>
        {KINDS.map((kind) => (
          <button
            key={kind}
            type="button"
            onClick={() => setActiveTab(kind)}
            data-testid={`admin-tab-${kind}`}
            className={`rounded px-3 py-1.5 ${activeTab === kind ? "bg-white text-black" : "bg-neutral-800 text-neutral-300"}`}
          >
            {KIND_LABELS[kind]}
          </button>
        ))}
      </nav>

      {activeTab === "queue" && (
        <section data-testid="admin-queue">
          {queue.length === 0 ? (
            <p className="text-neutral-500">
              Rien à réviser : aucun droit inconnu, aucune recherche en attente.
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {queue.map((entry) => (
                <li
                  key={`${entry.kind}-${entry.id}`}
                  data-testid={`admin-queue-entry-${entry.kind}-${entry.id}`}
                  className="rounded border border-neutral-800 bg-neutral-900 p-4"
                >
                  <div className="mb-1 flex items-center gap-2">
                    <span
                      className={`rounded px-2 py-0.5 text-xs uppercase ${severityBadgeClass(entry.severity)}`}
                    >
                      {entry.severity}
                    </span>
                    <span className="text-neutral-400">{KIND_LABELS[entry.kind]}</span>
                    <span className="font-bold text-white">{entry.id}</span>
                  </div>
                  <ul className="mb-2 list-inside list-disc text-neutral-400">
                    {entry.reasons.map((reason) => (
                      <li key={reason}>{reason}</li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    onClick={() => openEdit(entry.kind, entry.id)}
                    className="rounded bg-neutral-700 px-2 py-1 text-xs text-white hover:bg-neutral-600"
                  >
                    Corriger
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {KINDS.map(
        (kind) =>
          activeTab === kind && (
            <section key={kind} data-testid={`admin-table-${kind}`}>
              <div className="mb-3 flex justify-end">
                <button
                  type="button"
                  data-testid={`admin-new-toggle-${kind}`}
                  onClick={() => startCreate(kind)}
                  className="rounded bg-emerald-800 px-3 py-1.5 text-white hover:bg-emerald-700"
                >
                  + Nouvel élément
                </button>
              </div>

              {creatingKind === kind && (
                <div className="mb-4 rounded border border-emerald-800 bg-neutral-900 p-4">
                  <textarea
                    data-testid={`admin-new-json-${kind}`}
                    value={createText}
                    onChange={(e) => setCreateText(e.target.value)}
                    rows={10}
                    className="w-full rounded bg-black p-2 font-mono text-xs text-emerald-300"
                  />
                  {createErrors.length > 0 && (
                    <ul
                      data-testid={`admin-new-error-${kind}`}
                      className="mt-2 list-inside list-disc text-red-400"
                    >
                      {createErrors.map((err) => (
                        <li key={err}>{err}</li>
                      ))}
                    </ul>
                  )}
                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      data-testid={`admin-new-submit-${kind}`}
                      onClick={submitCreate}
                      className="rounded bg-emerald-700 px-3 py-1 text-white hover:bg-emerald-600"
                    >
                      Créer
                    </button>
                    <button
                      type="button"
                      onClick={() => setCreatingKind(null)}
                      className="rounded bg-neutral-700 px-3 py-1 text-white hover:bg-neutral-600"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              )}

              <ul className="flex flex-col gap-2">
                {Object.entries(state[kind]).map(([id, item]) => {
                  const data = item.data as Record<string, unknown>;
                  return (
                    <li
                      key={id}
                      data-testid={`admin-row-${kind}-${id}`}
                      className="rounded border border-neutral-800 bg-neutral-900 p-3"
                    >
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span
                          data-testid={`admin-status-${kind}-${id}`}
                          className={`rounded px-2 py-0.5 text-xs uppercase ${statusBadgeClass(item.status)}`}
                        >
                          {item.status}
                        </span>
                        {typeof data.rightsStatus === "string" && (
                          <span className="rounded bg-neutral-800 px-2 py-0.5 text-xs text-neutral-300">
                            {data.rightsStatus}
                          </span>
                        )}
                        {data.needsResearch === true && (
                          <span className="rounded bg-neutral-800 px-2 py-0.5 text-xs text-neutral-300">
                            needsResearch
                          </span>
                        )}
                        <span className="font-bold text-white">{id}</span>
                        <span className="text-neutral-400">{describeItem(kind, item.data)}</span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          data-testid={`admin-edit-${kind}-${id}`}
                          onClick={() => openEdit(kind, id)}
                          className="rounded bg-neutral-700 px-2 py-1 text-xs text-white hover:bg-neutral-600"
                        >
                          Modifier
                        </button>
                        <button
                          type="button"
                          data-testid={`admin-publish-${kind}-${id}`}
                          onClick={() => publish(kind, id)}
                          disabled={item.status === "published"}
                          className="rounded bg-sky-800 px-2 py-1 text-xs text-white hover:bg-sky-700 disabled:opacity-40"
                        >
                          Publier
                        </button>
                        <button
                          type="button"
                          data-testid={`admin-delete-${kind}-${id}`}
                          onClick={() => remove(kind, id)}
                          className="rounded bg-red-900 px-2 py-1 text-xs text-white hover:bg-red-800"
                        >
                          Supprimer
                        </button>
                      </div>

                      {edit?.kind === kind && edit.id === id && (
                        <div className="mt-3 border-t border-neutral-800 pt-3">
                          <textarea
                            data-testid={`admin-json-${kind}-${id}`}
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            rows={10}
                            className="w-full rounded bg-black p-2 font-mono text-xs text-emerald-300"
                          />
                          {editErrors.length > 0 && (
                            <ul
                              data-testid={`admin-error-${kind}-${id}`}
                              className="mt-2 list-inside list-disc text-red-400"
                            >
                              {editErrors.map((err) => (
                                <li key={err}>{err}</li>
                              ))}
                            </ul>
                          )}
                          <div className="mt-2 flex gap-2">
                            <button
                              type="button"
                              data-testid={`admin-save-${kind}-${id}`}
                              onClick={saveEdit}
                              className="rounded bg-sky-700 px-3 py-1 text-white hover:bg-sky-600"
                            >
                              Enregistrer
                            </button>
                            <button
                              type="button"
                              data-testid={`admin-cancel-${kind}-${id}`}
                              onClick={closeEdit}
                              className="rounded bg-neutral-700 px-3 py-1 text-white hover:bg-neutral-600"
                            >
                              Annuler
                            </button>
                          </div>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          ),
      )}
    </div>
  );
}
