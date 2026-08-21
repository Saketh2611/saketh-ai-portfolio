"use client";

import { useEffect, useState } from "react";
import { api, ApiRequestError } from "@/lib/api";
import type { ExperienceDetail } from "@/types";
import { ExperienceForm } from "./ExperienceForm";

export function ExperienceList() {
  const [experiences, setExperiences] = useState<ExperienceDetail[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [formMode, setFormMode] = useState<"none" | "create" | string>("none");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setIsLoading(true);
    try {
      const data = await api.getAdminExperiences();
      setExperiences(data);
      setError(null);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Failed to load experience.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Delete "${title}"? This removes it from the site and the chatbot's knowledge base. This can't be undone.`)) {
      return;
    }
    setDeletingId(id);
    try {
      await api.deleteExperience(id);
      setExperiences((prev) => prev.filter((e) => e.id !== id));
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Delete failed.");
    } finally {
      setDeletingId(null);
    }
  }

  function handleFormSaved() {
    setFormMode("none");
    refresh();
  }

  return (
    <div className="space-y-4">
      {formMode === "none" && (
        <button
          onClick={() => setFormMode("create")}
          className="rounded-lg border border-dashed border-ink-border px-4 py-2.5 font-mono text-xs text-paper-muted transition-colors hover:border-signal-gold/40 hover:text-signal-gold"
        >
          + Add experience
        </button>
      )}

      {formMode === "create" && (
        <ExperienceForm onSaved={handleFormSaved} onCancel={() => setFormMode("none")} />
      )}

      {error && <p className="font-mono text-xs text-red-400">{error}</p>}

      {isLoading ? (
        <p className="animate-pulse font-mono text-xs text-paper-faint">loading experience…</p>
      ) : experiences.length === 0 ? (
        <p className="font-mono text-xs text-paper-faint">
          No experience entries yet — add your first one above.
        </p>
      ) : (
        <div className="space-y-3">
          {experiences.map((exp) =>
            formMode === exp.id ? (
              <ExperienceForm
                key={exp.id}
                existingExperience={exp}
                onSaved={handleFormSaved}
                onCancel={() => setFormMode("none")}
              />
            ) : (
              <div
                key={exp.id}
                className="flex items-center justify-between gap-4 rounded-xl border border-ink-border bg-ink-surface p-4"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-sm font-semibold text-paper">
                    {exp.role_title}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-signal-teal">
                    {exp.company} · {exp.start_date} – {exp.end_date || "Present"}
                  </p>
                  <p className="mt-1 truncate text-xs text-paper-muted">
                    {exp.short_description}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    onClick={() => setFormMode(exp.id)}
                    className="rounded-lg border border-ink-border px-3 py-1.5 font-mono text-xs text-paper-muted hover:border-paper-faint hover:text-paper"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(exp.id, exp.role_title)}
                    disabled={deletingId === exp.id}
                    className="rounded-lg border border-red-900/40 px-3 py-1.5 font-mono text-xs text-red-400 hover:border-red-700 disabled:opacity-40"
                  >
                    {deletingId === exp.id ? "…" : "Delete"}
                  </button>
                </div>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}