"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { api, ApiRequestError } from "@/lib/api";
import type { ProjectDetail } from "@/types";

export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    api
      .getProject(params.id)
      .then(setProject)
      .catch((err) => {
        if (err instanceof ApiRequestError && err.status === 404) {
          setNotFound(true);
        }
      });
  }, [params.id]);

  if (notFound) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-ink">
        <p className="font-mono text-sm text-paper-muted">Project not found.</p>
        <button
          onClick={() => router.push("/")}
          className="font-mono text-xs text-signal-gold hover:underline"
        >
          ← back home
        </button>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink">
        <p className="animate-pulse font-mono text-sm text-paper-muted">loading…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ink">
      <Navbar />
      <main className="mx-auto max-w-3xl px-6 py-16">
        <button
          onClick={() => router.push("/#projects")}
          className="mb-8 font-mono text-xs text-paper-muted hover:text-paper"
        >
          ← all projects
        </button>

        <h1 className="font-display text-3xl font-semibold text-paper">{project.title}</h1>

        <div className="mt-3 flex flex-wrap gap-3">
          {project.github_url && (
            <a
              href={project.github_url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-xs text-signal-teal hover:underline"
            >
              GitHub ↗
            </a>
          )}
          {project.live_url && (
            <a
              href={project.live_url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-xs text-signal-gold hover:underline"
            >
              Live Demo ↗
            </a>
          )}
        </div>

        {project.tech_stack.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-1.5">
            {project.tech_stack.map((tech) => (
              <span
                key={tech}
                className="rounded border border-ink-border px-2 py-0.5 font-mono text-[11px] text-signal-teal"
              >
                {tech}
              </span>
            ))}
          </div>
        )}

        <div className="mt-8 whitespace-pre-wrap text-sm leading-relaxed text-paper-muted">
          {project.full_description}
        </div>
      </main>
    </div>
  );
}
