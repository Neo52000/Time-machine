"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import {
  RightsStatusSchema,
  VideoVisualSchema,
  type VideoClip,
} from "@time-machine/content-schema";
import { ApiError, submitRecord } from "@/lib/apiClient";
import {
  ArrayField,
  CheckboxField,
  DateField,
  NumberField,
  SelectField,
  TextAreaField,
  TextField,
} from "./fields";

const RIGHTS_OPTIONS = RightsStatusSchema.options;
const VISUAL_OPTIONS = VideoVisualSchema.options;

const EMPTY: VideoClip = {
  id: "",
  title: "",
  uploader: "",
  uploadDate: "",
  durationSeconds: 20,
  description: "",
  category: [],
  viewsAtLaunch: 0,
  visual: "zoo",
  relatedEventId: undefined,
  sourceIds: [],
  rightsStatus: "original",
  needsResearch: false,
  published: false,
};

export function VideoClipForm({ initial }: { initial?: VideoClip }) {
  const router = useRouter();
  const isNew = !initial;
  const [record, setRecord] = useState<VideoClip>(initial ?? EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const url = isNew ? "/api/video-clips" : `/api/video-clips/${record.id}`;
      await submitRecord(url, isNew ? "POST" : "PUT", record);
      router.push("/video-clips");
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
        placeholder="meatthezoo"
      />
      <TextField
        label="Title"
        value={record.title}
        onChange={(title) => setRecord({ ...record, title })}
        required
      />
      <TextField
        label="Uploader"
        value={record.uploader}
        onChange={(uploader) => setRecord({ ...record, uploader })}
        required
      />
      <DateField
        label="Upload date"
        value={record.uploadDate}
        onChange={(uploadDate) => setRecord({ ...record, uploadDate })}
        required
      />
      <NumberField
        label="Duration seconds"
        value={record.durationSeconds}
        min={1}
        onChange={(durationSeconds) => setRecord({ ...record, durationSeconds })}
      />
      <TextAreaField
        label="Description"
        value={record.description}
        onChange={(description) => setRecord({ ...record, description })}
        required
      />
      <ArrayField
        label="Category"
        value={record.category}
        onChange={(category) => setRecord({ ...record, category })}
        hint="e.g. histoire, web"
      />
      <NumberField
        label="Views at launch"
        value={record.viewsAtLaunch}
        min={0}
        onChange={(viewsAtLaunch) => setRecord({ ...record, viewsAtLaunch })}
      />
      <SelectField
        label="Visual"
        value={record.visual}
        options={VISUAL_OPTIONS}
        onChange={(visual) => setRecord({ ...record, visual: visual as VideoClip["visual"] })}
        hint="original placeholder animation, never real footage"
      />
      <TextField
        label="Related event id"
        value={record.relatedEventId ?? ""}
        onChange={(relatedEventId) =>
          setRecord({ ...record, relatedEventId: relatedEventId || undefined })
        }
        hint="optional — links to content/events/events.json"
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
          setRecord({ ...record, rightsStatus: rightsStatus as VideoClip["rightsStatus"] })
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
