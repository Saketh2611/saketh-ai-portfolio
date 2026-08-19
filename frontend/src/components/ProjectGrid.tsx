import Link from "next/link";
import type { Project } from "@/types";

export function ProjectCard({ project }: { project: Project }) {
  return (
    <div className="group flex flex-col rounded-xl border border-ink-border bg-ink-surface p-5 transition-colors hover:border-signal-gold/30">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-display text-lg font-semibold text-paper">{project.title}</h3>
        {project.github_url && (
          <a
            href={project.github_url}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 font-mono text-xs text-paper-muted transition-colors hover:text-signal-teal"
            aria-label={`${project.title} on GitHub`}
          >
            ↗ code
          </a>
        )}
      </div>

      <p className="mt-2 flex-1 text-sm leading-relaxed text-paper-muted">
        {project.short_description}
      </p>

      {project.tech_stack.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {project.tech_stack.slice(0, 5).map((tech) => (
            <span
              key={tech}
              className="rounded border border-ink-border px-2 py-0.5 font-mono text-[11px] text-signal-teal"
            >
              {tech}
            </span>
          ))}
          {project.tech_stack.length > 5 && (
            <span className="px-2 py-0.5 font-mono text-[11px] text-paper-faint">
              +{project.tech_stack.length - 5}
            </span>
          )}
        </div>
      )}

      <Link
        href={`/projects/${project.id}`}
        className="mt-4 font-mono text-xs text-signal-gold opacity-0 transition-opacity group-hover:opacity-100"
      >
        read more →
      </Link>
    </div>
  );
}

export function ProjectGrid({ projects }: { projects: Project[] }) {
  if (projects.length === 0) {
    return (
      <p className="font-mono text-sm text-paper-faint">
        No projects indexed yet.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {projects.map((project) => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  );
}
