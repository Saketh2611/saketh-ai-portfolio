"use client";

import { useEffect, useState } from "react";
import { api, ApiRequestError } from "@/lib/api";
import type { ProjectDetail } from "@/types";
import { ProjectForm } from "./ProjectForm";

export function ProjectList() {
  const [projects, setProjects] = useState<ProjectDetail[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [formMode, setFormMode] = useState<"none" | "create" | string>("none"); // string = editing project id
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setIsLoading(true);
    try {
      const data = await api.getAdminProjects();
      setProjects(data);
      setError(null);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Failed to load projects.");
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
      await api.deleteProject(id);
      setProjects((prev) => prev.filter((p) => p.id !== id));
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
          + Add project
        </button>
      )}

      {formMode === "create" && (
        <ProjectForm onSaved={handleFormSaved} onCancel={() => setFormMode("none")} />
      )}

      {error && <p className="font-mono text-xs text-red-400">{error}</p>}

      {isLoading ? (
        <p className="animate-pulse font-mono text-xs text-paper-faint">loading projects…</p>
      ) : projects.length === 0 ? (
        <p className="font-mono text-xs text-paper-faint">
          No projects yet — add your first one above.
        </p>
      ) : (
        <div className="space-y-3">
          {projects.map((project) =>
            formMode === project.id ? (
              <ProjectForm
                key={project.id}
                existingProject={project}
                onSaved={handleFormSaved}
                onCancel={() => setFormMode("none")}
              />
            ) : (
              <div
                key={project.id}
                className="flex items-center justify-between gap-4 rounded-xl border border-ink-border bg-ink-surface p-4"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-sm font-semibold text-paper">
                    {project.title}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-paper-muted">
                    {project.short_description}
                  </p>
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {project.tech_stack.slice(0, 4).map((t) => (
                      <span
                        key={t}
                        className="font-mono text-[10px] text-signal-teal"
                      >
                        {t}
                        {","}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    onClick={() => setFormMode(project.id)}
                    className="rounded-lg border border-ink-border px-3 py-1.5 font-mono text-xs text-paper-muted hover:border-paper-faint hover:text-paper"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(project.id, project.title)}
                    disabled={deletingId === project.id}
                    className="rounded-lg border border-red-900/40 px-3 py-1.5 font-mono text-xs text-red-400 hover:border-red-700 disabled:opacity-40"
                  >
                    {deletingId === project.id ? "…" : "Delete"}
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
