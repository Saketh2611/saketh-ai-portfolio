"use client";

import { useState } from "react";
import { api, ApiRequestError } from "@/lib/api";
import type { ExperienceDetail } from "@/types";

export function ExperienceForm({
  existingExperience,
  onSaved,
  onCancel,
}: {
  existingExperience?: ExperienceDetail;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const isEditMode = !!existingExperience;

  const [form, setForm] = useState({
    role_title: existingExperience?.role_title ?? "",
    company: existingExperience?.company ?? "",
    location: existingExperience?.location ?? "",
    start_date: existingExperience?.start_date ?? "",
    end_date: existingExperience?.end_date ?? "",
    short_description: existingExperience?.short_description ?? "",
    full_description: existingExperience?.full_description ?? "",
    tech_stack: existingExperience?.tech_stack.join(", ") ?? "",
    display_order: existingExperience?.display_order ?? 0,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    const payload = {
      role_title: form.role_title,
      company: form.company,
      location: form.location || undefined,
      start_date: form.start_date,
      end_date: form.end_date || undefined, // leave blank for "Present"
      short_description: form.short_description,
      full_description: form.full_description,
      tech_stack: form.tech_stack
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      display_order: Number(form.display_order) || 0,
    };

    try {
      if (isEditMode) {
        await api.updateExperience(existingExperience.id, payload);
      } else {
        await api.createExperience(payload);
      }
      onSaved();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Save failed.");
    } finally {
      setIsSaving(false);
    }
  }

  const inputClass =
    "mt-1.5 w-full rounded-lg border border-ink-border bg-ink px-4 py-2.5 text-sm text-paper focus:border-signal-gold/50";

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-xl border border-signal-gold/20 bg-ink-raised p-5"
    >
      <p className="font-mono text-xs uppercase tracking-wider text-signal-gold">
        {isEditMode ? `Editing: ${existingExperience.role_title}` : "New experience"}
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="font-mono text-xs text-paper-muted">Role title</span>
          <input
            value={form.role_title}
            onChange={(e) => update("role_title", e.target.value)}
            placeholder="Full Stack AI Engineer"
            className={inputClass}
            required
          />
        </label>

        <label className="block">
          <span className="font-mono text-xs text-paper-muted">Company</span>
          <input
            value={form.company}
            onChange={(e) => update("company", e.target.value)}
            placeholder="Startrit Infratech Pvt. Ltd."
            className={inputClass}
            required
          />
        </label>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <label className="block">
          <span className="font-mono text-xs text-paper-muted">Start date</span>
          <input
            value={form.start_date}
            onChange={(e) => update("start_date", e.target.value)}
            placeholder="Jan 2026"
            className={inputClass}
            required
          />
        </label>

        <label className="block">
          <span className="font-mono text-xs text-paper-muted">
            End date <span className="text-paper-faint">(blank = Present)</span>
          </span>
          <input
            value={form.end_date}
            onChange={(e) => update("end_date", e.target.value)}
            placeholder="July 2026"
            className={inputClass}
          />
        </label>

        <label className="block">
          <span className="font-mono text-xs text-paper-muted">Location</span>
          <input
            value={form.location}
            onChange={(e) => update("location", e.target.value)}
            placeholder="Hyderabad, India"
            className={inputClass}
          />
        </label>
      </div>

      <label className="block">
        <span className="font-mono text-xs text-paper-muted">
          Short description <span className="text-paper-faint">(shown on the card, ~1-2 sentences)</span>
        </span>
        <textarea
          value={form.short_description}
          onChange={(e) => update("short_description", e.target.value)}
          rows={2}
          maxLength={300}
          className={inputClass}
          required
        />
      </label>

      <label className="block">
        <span className="font-mono text-xs text-paper-muted">
          Full description{" "}
          <span className="text-paper-faint">
            (paste everything — this is what the chatbot reads and cites from)
          </span>
        </span>
        <textarea
          value={form.full_description}
          onChange={(e) => update("full_description", e.target.value)}
          rows={8}
          className={inputClass}
          required
        />
      </label>

      <label className="block">
        <span className="font-mono text-xs text-paper-muted">
          Tech stack <span className="text-paper-faint">(comma-separated)</span>
        </span>
        <input
          value={form.tech_stack}
          onChange={(e) => update("tech_stack", e.target.value)}
          placeholder="Python, FastAPI, AWS Bedrock, RAG"
          className={inputClass}
        />
      </label>

      <label className="block">
        <span className="font-mono text-xs text-paper-muted">Display order</span>
        <input
          type="number"
          value={form.display_order}
          onChange={(e) => update("display_order", Number(e.target.value))}
          className={inputClass}
        />
      </label>

      {error && <p className="font-mono text-xs text-red-400">{error}</p>}

      <div className="flex items-center gap-3 pt-1">
        <button
          type="submit"
          disabled={isSaving}
          className="rounded-lg bg-signal-gold px-5 py-2.5 font-mono text-sm font-medium text-paper transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {isSaving ? "Indexing…" : isEditMode ? "Save changes" : "Add experience"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="font-mono text-xs text-paper-muted hover:text-paper"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}