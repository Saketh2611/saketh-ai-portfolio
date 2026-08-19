"use client";

import { useState } from "react";
import { api, ApiRequestError } from "@/lib/api";
import type { ProjectDetail } from "@/types";

export function ProjectForm({
  existingProject,
  onSaved,
  onCancel,
}: {
  existingProject?: ProjectDetail;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const isEditMode = !!existingProject;

  const [form, setForm] = useState({
    title: existingProject?.title ?? "",
    github_url: existingProject?.github_url ?? "",
    live_url: existingProject?.live_url ?? "",
    short_description: existingProject?.short_description ?? "",
    full_description: existingProject?.full_description ?? "",
    tech_stack: existingProject?.tech_stack.join(", ") ?? "",
    display_order: existingProject?.display_order ?? 0,
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
      title: form.title,
      github_url: form.github_url || undefined,
      live_url: form.live_url || undefined,
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
        await api.updateProject(existingProject.id, payload);
      } else {
        await api.createProject(payload);
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
        {isEditMode ? `Editing: ${existingProject.title}` : "New project"}
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="font-mono text-xs text-paper-muted">Title</span>
          <input
            value={form.title}
            onChange={(e) => update("title", e.target.value)}
            className={inputClass}
            required
          />
        </label>

        <label className="block">
          <span className="font-mono text-xs text-paper-muted">GitHub link</span>
          <input
            value={form.github_url}
            onChange={(e) => update("github_url", e.target.value)}
            placeholder="https://github.com/you/project"
            className={inputClass}
          />
        </label>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="font-mono text-xs text-paper-muted">Live demo link (optional)</span>
          <input
            value={form.live_url}
            onChange={(e) => update("live_url", e.target.value)}
            placeholder="https://your-deployed-project.com"
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
      </div>

      <label className="block">
        <span className="font-mono text-xs text-paper-muted">
          Short description <span className="text-paper-faint">(shown on the project card, ~1-2 sentences)</span>
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
          placeholder="Python, FastAPI, FAISS, pgvector, Docker"
          className={inputClass}
        />
      </label>

      {error && <p className="font-mono text-xs text-red-400">{error}</p>}

      <div className="flex items-center gap-3 pt-1">
        <button
          type="submit"
          disabled={isSaving}
          className="rounded-lg bg-signal-gold px-5 py-2.5 font-mono text-sm font-medium text-ink transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {isSaving ? "Indexing…" : isEditMode ? "Save changes" : "Add project"}
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
