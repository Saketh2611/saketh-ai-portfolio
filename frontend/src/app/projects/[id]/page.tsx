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
        <p className="text-sm text-paper-muted">Project not found.</p>
        <button
          onClick={() => router.push("/")}
          className="text-xs uppercase tracking-[0.18em] text-signal-gold hover:underline"
        >
          Back home
        </button>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink">
        <p className="animate-pulse text-sm text-paper-muted">Loading</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ink">
      <Navbar />
      <main className="mx-auto max-w-3xl px-6 py-16">
        <button
          onClick={() => router.push("/#projects")}
          className="mb-8 text-xs uppercase tracking-[0.18em] text-paper-muted hover:text-paper"
        >
          All projects
        </button>

        <h1 className="font-display text-5xl tracking-wide text-paper">{project.title}</h1>
        <span className="mt-6 block h-px w-16 bg-paper/80" />

        <div className="mt-6 flex flex-wrap gap-4">
          {project.github_url && (
            <a
              href={project.github_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-medium uppercase tracking-[0.18em] text-paper-muted hover:text-signal-gold"
            >
              GitHub
            </a>
          )}
          {project.live_url && (
            <a
              href={project.live_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-medium uppercase tracking-[0.18em] text-signal-gold hover:underline"
            >
              Live Demo
            </a>
          )}
        </div>

        {project.tech_stack.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-1.5">
            {project.tech_stack.map((tech) => (
              <span
                key={tech}
                className="rounded-full border border-ink-border px-2.5 py-0.5 text-[11px] text-paper-muted"
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
