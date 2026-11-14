"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { SourceKindSchema, type SourceReference } from "@time-machine/content-schema";
import { ApiError, submitRecord } from "@/lib/apiClient";
import { SelectField, TextField } from "./fields";

const EMPTY: SourceReference = {
  id: "",
  label: "",
  // The weakest kind until an editor says otherwise.
  kind: "reference",
  url: undefined,
  publisher: undefined,
  accessedAt: undefined,
  notes: undefined,
};

export function SourceForm({ initial }: { initial?: SourceReference }) {
  const router = useRouter();
  const isNew = !initial;
  const [record, setRecord] = useState<SourceReference>(initial ?? EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const url = isNew ? "/api/sources" : `/api/sources/${record.id}`;
      await submitRecord(url, isNew ? "POST" : "PUT", record);
      router.push("/sources");
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="record-form" onSubmit={handleSubmit}>
      {error ? <div className="error-banner">{error}</div> : null}

      <TextField
        label="Id"
        value={record.id}
        onChange={(id) => setRecord({ ...record, id })}
        required
        disabled={!isNew}
        placeholder="src-wikipedia-lycos"
      />
      <TextField
        label="Label"
        value={record.label}
        onChange={(label) => setRecord({ ...record, label })}
        required
      />
      <SelectField
        label="Kind"
        hint="primary / institutional / press carry a date; reference and project do not"
        value={record.kind}
        options={SourceKindSchema.options}
        onChange={(kind) => setRecord({ ...record, kind: SourceKindSchema.parse(kind) })}
      />
      <TextField
        label="URL"
        value={record.url ?? ""}
        onChange={(url) => setRecord({ ...record, url: url || undefined })}
        placeholder="https://en.wikipedia.org/wiki/Lycos"
      />
      <TextField
        label="Publisher"
        value={record.publisher ?? ""}
        onChange={(publisher) => setRecord({ ...record, publisher: publisher || undefined })}
      />
      <TextField
        label="Accessed at"
        hint="YYYY-MM-DD"
        value={record.accessedAt ?? ""}
        onChange={(accessedAt) => setRecord({ ...record, accessedAt: accessedAt || undefined })}
      />
      <TextField
        label="Notes"
        value={record.notes ?? ""}
        onChange={(notes) => setRecord({ ...record, notes: notes || undefined })}
      />

      <div className="form-actions">
        <button className="button primary" type="submit" disabled={saving}>
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </form>
  );
}
