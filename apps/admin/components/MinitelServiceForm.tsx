"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { RightsStatusSchema, type MinitelService } from "@time-machine/content-schema";
import { ApiError, submitRecord } from "@/lib/apiClient";
import {
  ArrayField,
  CheckboxField,
  DateField,
  SelectField,
  TextAreaField,
  TextField,
} from "./fields";

const RIGHTS_OPTIONS = RightsStatusSchema.options;

const EMPTY: MinitelService = {
  id: "",
  kioskCode: "",
  mnemonic: "",
  title: "",
  description: "",
  fictional: true,
  homePageId: "",
  guidePageId: undefined,
  availableFrom: "",
  availableUntil: undefined,
  sourceIds: [],
  rightsStatus: "original",
  needsResearch: false,
  published: false,
};

export function MinitelServiceForm({ initial }: { initial?: MinitelService }) {
  const router = useRouter();
  const isNew = !initial;
  const [record, setRecord] = useState<MinitelService>(initial ?? EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const url = isNew ? "/api/minitel-services" : `/api/minitel-services/${record.id}`;
      await submitRecord(url, isNew ? "POST" : "PUT", record);
      router.push("/minitel-services");
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
        placeholder="annuaire"
      />
      <TextField
        label="Kiosk code"
        value={record.kioskCode}
        onChange={(kioskCode) => setRecord({ ...record, kioskCode })}
        required
        placeholder="3615"
        hint="4 digits"
      />
      <TextField
        label="Mnemonic"
        value={record.mnemonic}
        onChange={(mnemonic) => setRecord({ ...record, mnemonic: mnemonic.toUpperCase() })}
        required
        placeholder="DEMO"
        hint="uppercase A-Z/0-9, typed after the kiosk connects"
      />
      <TextField
        label="Title"
        value={record.title}
        onChange={(title) => setRecord({ ...record, title })}
        required
      />
      <TextAreaField
        label="Description"
        value={record.description}
        onChange={(description) => setRecord({ ...record, description })}
        required
      />
      <CheckboxField
        label="Fictional"
        checked={record.fictional}
        onChange={(fictional) => setRecord({ ...record, fictional })}
        hint="clearly fictional services are the default"
      />
      <TextField
        label="Home page id"
        value={record.homePageId}
        onChange={(homePageId) => setRecord({ ...record, homePageId })}
        required
        placeholder="demo-home"
      />
      <TextField
        label="Guide page id"
        value={record.guidePageId ?? ""}
        onChange={(guidePageId) => setRecord({ ...record, guidePageId: guidePageId || undefined })}
        hint="optional — shown by the GUIDE key"
      />
      <DateField
        label="Available from"
        value={record.availableFrom}
        onChange={(availableFrom) => setRecord({ ...record, availableFrom })}
        required
      />
      <DateField
        label="Available until"
        value={record.availableUntil ?? ""}
        onChange={(availableUntil) =>
          setRecord({ ...record, availableUntil: availableUntil || undefined })
        }
        hint="optional — YYYY-MM-DD"
      />
      <ArrayField
        label="Source ids"
        value={record.sourceIds}
        onChange={(sourceIds) => setRecord({ ...record, sourceIds })}
        hint="ids from content/sources/sources.json"
      />
      <SelectField
        label="Rights status"
        value={record.rightsStatus}
        options={RIGHTS_OPTIONS}
        onChange={(rightsStatus) =>
          setRecord({ ...record, rightsStatus: rightsStatus as MinitelService["rightsStatus"] })
        }
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
        hint="cannot be saved true while needs-research is set or rights status is unknown"
      />

      <div className="form-actions">
        <button className="button primary" type="submit" disabled={saving}>
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </form>
  );
}
