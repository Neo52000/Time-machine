"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { deleteRecord } from "@/lib/apiClient";

export function DeleteButton({ url, label = "Delete" }: { url: string; label?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function handleClick() {
    if (!confirm("Delete this record? This cannot be undone.")) return;
    setBusy(true);
    try {
      await deleteRecord(url);
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Delete failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button type="button" className="button danger" onClick={handleClick} disabled={busy}>
      {busy ? "Deleting…" : label}
    </button>
  );
}
