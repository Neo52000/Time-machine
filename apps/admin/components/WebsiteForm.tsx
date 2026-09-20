"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import type { HistoricalWebsite } from "@time-machine/content-schema";
import { ApiError, submitRecord } from "@/lib/apiClient";
import { ArrayField, CheckboxField, DateField, TextAreaField, TextField } from "./fields";

const EMPTY: HistoricalWebsite = {
  id: "",
  domain: "",
  title: "",
  description: undefined,
  category: [],
  availableFrom: "",
  availableUntil: undefined,
  sourceIds: [],
  relatedEventIds: [],
  needsResearch: false,
  published: false,
};

export function WebsiteForm({ initial }: { initial?: HistoricalWebsite }) {
  const router = useRouter();
  const isNew = !initial;
  const [record, setRecord] = useState<HistoricalWebsite>(initial ?? EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const url = isNew ? "/api/websites" : `/api/websites/${record.id}`;
      await submitRecord(url, isNew ? "POST" : "PUT", record);
      router.push("/websites");
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
        placeholder="lycos-com"
      />
      <TextField
        label="Domain"
        value={record.domain}
        onChange={(domain) => setRecord({ ...record, domain })}
        required
        placeholder="lycos.com"
      />
      <TextField
        label="Title"
        value={record.title}
        onChange={(title) => setRecord({ ...record, title })}
        required
      />
      <TextAreaField
        label="Description"
        value={record.description ?? ""}
        onChange={(description) => setRecord({ ...record, description: description || undefined })}
        rows={2}
      />
      <ArrayField
        label="Category"
        value={record.category}
        onChange={(category) => setRecord({ ...record, category })}
      />
      <DateField
        label="Available from"
        value={record.availableFrom}
        onChange={(availableFrom) => setRecord({ ...record, availableFrom })}
        required
      />
      <DateField
        label="Available until"
        hint="optional — leave blank if still online"
        value={record.availableUntil ?? ""}
        onChange={(availableUntil) =>
          setRecord({ ...record, availableUntil: availableUntil || undefined })
        }
      />
      <ArrayField
        label="Source ids"
        value={record.sourceIds}
        onChange={(sourceIds) => setRecord({ ...record, sourceIds })}
      />
      <ArrayField
        label="Related event ids"
        value={record.relatedEventIds ?? []}
        onChange={(relatedEventIds) => setRecord({ ...record, relatedEventIds })}
        hint="shown when the site isn't reachable yet at the selected date"
      />
      <CheckboxField
        label="Needs research"
        checked={record.needsResearch ?? false}
        onChange={(needsResearch) => setRecord({ ...record, needsResearch })}
      />
      <CheckboxField
        label="Published"
        checked={record.published}
        onChange={(published) => setRecord({ ...record, published })}
        hint="cannot be saved true while needs-research is set"
      />

      <div className="form-actions">
        <button className="button primary" type="submit" disabled={saving}>
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </form>
  );
}
