"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import type { HistoricalEvent } from "@time-machine/content-schema";
import { ApiError, submitRecord } from "@/lib/apiClient";
import {
  ArrayField,
  CheckboxField,
  DateField,
  NumberField,
  TextAreaField,
  TextField,
} from "./fields";

const EMPTY: HistoricalEvent = {
  id: "",
  date: "",
  title: "",
  summary: "",
  category: [],
  importance: 3,
  experienceId: undefined,
  sourceIds: [],
  assetIds: [],
  needsResearch: false,
  published: false,
};

export function EventForm({ initial }: { initial?: HistoricalEvent }) {
  const router = useRouter();
  const isNew = !initial;
  const [record, setRecord] = useState<HistoricalEvent>(initial ?? EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const url = isNew ? "/api/events" : `/api/events/${record.id}`;
      await submitRecord(url, isNew ? "POST" : "PUT", record);
      router.push("/events");
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
        placeholder="google-founded"
      />
      <DateField
        label="Date"
        value={record.date}
        onChange={(date) => setRecord({ ...record, date })}
        required
      />
      <TextField
        label="Title"
        value={record.title}
        onChange={(title) => setRecord({ ...record, title })}
        required
      />
      <TextAreaField
        label="Summary"
        value={record.summary}
        onChange={(summary) => setRecord({ ...record, summary })}
        required
      />
      <ArrayField
        label="Category"
        value={record.category}
        onChange={(category) => setRecord({ ...record, category })}
        hint="e.g. web, search, world"
      />
      <NumberField
        label="Importance"
        value={record.importance}
        min={1}
        max={5}
        onChange={(n) =>
          setRecord({ ...record, importance: Math.min(5, Math.max(1, n)) as 1 | 2 | 3 | 4 | 5 })
        }
      />
      <TextField
        label="Experience id"
        hint="optional — links to an interactive experience"
        value={record.experienceId ?? ""}
        onChange={(experienceId) =>
          setRecord({ ...record, experienceId: experienceId || undefined })
        }
      />
      <ArrayField
        label="Source ids"
        value={record.sourceIds}
        onChange={(sourceIds) => setRecord({ ...record, sourceIds })}
        hint="ids from content/sources/sources.json"
      />
      <ArrayField
        label="Asset ids"
        value={record.assetIds ?? []}
        onChange={(assetIds) => setRecord({ ...record, assetIds })}
      />
      <CheckboxField
        label="Needs research"
        checked={record.needsResearch ?? false}
        onChange={(needsResearch) => setRecord({ ...record, needsResearch })}
        hint="set instead of guessing an unconfirmed date/detail"
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
