"use client";

import { useState } from "react";
import { api, ApiRequestError } from "@/lib/api";
import type { Profile } from "@/types";

export function ProfileForm({
  profile,
  onSaved,
}: {
  profile: Profile;
  onSaved: (updated: Profile) => void;
}) {
  const [form, setForm] = useState({
    full_name: profile.full_name,
    headline: profile.headline,
    summary: profile.summary,
    email: profile.email ?? "",
    github_url: profile.github_url ?? "",
    linkedin_url: profile.linkedin_url ?? "",
    phone: profile.phone ?? "",
    location: profile.location ?? "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saved" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSaveState("idle");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      const updated = await api.updateProfile(form);
      onSaved(updated);
      setSaveState("saved");
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Save failed.");
      setSaveState("error");
    } finally {
      setIsSaving(false);
    }
  }

  const inputClass =
    "mt-1.5 w-full rounded-lg border border-ink-border bg-ink px-4 py-2.5 text-sm text-paper focus:border-signal-gold/50";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="font-mono text-xs text-paper-muted">Full name</span>
          <input
            value={form.full_name}
            onChange={(e) => update("full_name", e.target.value)}
            className={inputClass}
            required
          />
        </label>

        <label className="block">
          <span className="font-mono text-xs text-paper-muted">
            Headline <span className="text-paper-faint">(e.g. &quot;AI Engineer | GenAI | ML | Backend&quot;)</span>
          </span>
          <input
            value={form.headline}
            onChange={(e) => update("headline", e.target.value)}
            className={inputClass}
          />
        </label>
      </div>

      <label className="block">
        <span className="font-mono text-xs text-paper-muted">
          Summary <span className="text-paper-faint">(feeds the chatbot — describe your background in a few sentences)</span>
        </span>
        <textarea
          value={form.summary}
          onChange={(e) => update("summary", e.target.value)}
          rows={5}
          className={inputClass}
        />
      </label>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="font-mono text-xs text-paper-muted">Email</span>
          <input
            type="email"
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
            className={inputClass}
          />
        </label>
        <label className="block">
          <span className="font-mono text-xs text-paper-muted">Phone</span>
          <input
            value={form.phone}
            onChange={(e) => update("phone", e.target.value)}
            className={inputClass}
          />
        </label>
        <label className="block">
          <span className="font-mono text-xs text-paper-muted">GitHub URL</span>
          <input
            value={form.github_url}
            onChange={(e) => update("github_url", e.target.value)}
            className={inputClass}
            placeholder="https://github.com/username"
          />
        </label>
        <label className="block">
          <span className="font-mono text-xs text-paper-muted">LinkedIn URL</span>
          <input
            value={form.linkedin_url}
            onChange={(e) => update("linkedin_url", e.target.value)}
            className={inputClass}
            placeholder="https://linkedin.com/in/username"
          />
        </label>
        <label className="block sm:col-span-2">
          <span className="font-mono text-xs text-paper-muted">Location</span>
          <input
            value={form.location}
            onChange={(e) => update("location", e.target.value)}
            className={inputClass}
            placeholder="Hyderabad, India"
          />
        </label>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={isSaving}
          className="rounded-lg bg-signal-gold px-5 py-2.5 font-mono text-sm font-medium text-ink transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {isSaving ? "Saving…" : "Save profile"}
        </button>
        {saveState === "saved" && (
          <span className="font-mono text-xs text-signal-teal">✓ saved</span>
        )}
        {error && <span className="font-mono text-xs text-red-400">{error}</span>}
      </div>
    </form>
  );
}
