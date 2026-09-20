"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import {
  RightsStatusSchema,
  SnapshotTypeSchema,
  type HistoricalSnapshot,
} from "@time-machine/content-schema";
import { ApiError, submitRecord } from "@/lib/apiClient";
import { ArrayField, CheckboxField, DateField, SelectField, TextField } from "./fields";

const RIGHTS_OPTIONS = RightsStatusSchema.options;
const TYPE_OPTIONS = SnapshotTypeSchema.options;

const EMPTY: HistoricalSnapshot = {
  id: "",
  websiteId: "",
  capturedAt: "",
  type: "screenshot",
  contentRef: "",
  sourceIds: [],
  rightsStatus: "unknown",
  published: false,
};

export function SnapshotForm({ initial }: { initial?: HistoricalSnapshot }) {
  const router = useRouter();
  const isNew = !initial;
  const [record, setRecord] = useState<HistoricalSnapshot>(initial ?? EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const url = isNew ? "/api/snapshots" : `/api/snapshots/${record.id}`;
      await submitRecord(url, isNew ? "POST" : "PUT", record);
      router.push("/snapshots");
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
        placeholder="snap-lycos-1998"
      />
      <TextField
        label="Website id"
        value={record.websiteId}
        onChange={(websiteId) => setRecord({ ...record, websiteId })}
        required
        placeholder="lycos-com"
      />
      <DateField
        label="Captured at"
        value={record.capturedAt}
        onChange={(capturedAt) => setRecord({ ...record, capturedAt })}
        required
      />
      <SelectField
        label="Type"
        value={record.type}
        options={TYPE_OPTIONS}
        onChange={(type) => setRecord({ ...record, type: type as HistoricalSnapshot["type"] })}
      />
      <TextField
        label="Content ref"
        value={record.contentRef}
        onChange={(contentRef) => setRecord({ ...record, contentRef })}
        required
        hint="reconstruction page id, archive URL, or asset filename"
      />
      <ArrayField
        label="Source ids"
        value={record.sourceIds}
        onChange={(sourceIds) => setRecord({ ...record, sourceIds })}
      />
      <SelectField
        label="Rights status"
        value={record.rightsStatus}
        options={RIGHTS_OPTIONS}
        onChange={(rightsStatus) =>
          setRecord({ ...record, rightsStatus: rightsStatus as HistoricalSnapshot["rightsStatus"] })
        }
      />
      <CheckboxField
        label="Published"
        checked={record.published}
        onChange={(published) => setRecord({ ...record, published })}
        hint='cannot be saved true while rights status is "unknown"'
      />

      <div className="form-actions">
        <button className="button primary" type="submit" disabled={saving}>
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </form>
  );
}
