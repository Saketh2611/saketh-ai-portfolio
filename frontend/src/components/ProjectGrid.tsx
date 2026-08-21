import Link from "next/link";
import type { Project } from "@/types";

export function ProjectCard({ project }: { project: Project }) {
  return (
    <div className="group relative flex flex-col rounded-2xl border border-ink-border bg-ink-surface p-6 transition-colors hover:border-signal-gold/50">
      <div className="absolute right-0 top-0 h-1 w-12 rounded-tr-2xl bg-signal-gold opacity-0 transition-opacity group-hover:opacity-100" />
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-display text-3xl tracking-wide text-paper">{project.title}</h3>
        {project.github_url && (
          <a
            href={project.github_url}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 pt-1 text-[11px] font-medium uppercase tracking-[0.16em] text-paper-muted transition-colors hover:text-signal-gold"
            aria-label={`${project.title} on GitHub`}
          >
            Code
          </a>
        )}
      </div>

      <p className="mt-3 flex-1 text-sm leading-relaxed text-paper-muted">
        {project.short_description}
      </p>

      {project.tech_stack.length > 0 && (
        <div className="mt-5 flex flex-wrap gap-1.5">
          {project.tech_stack.slice(0, 5).map((tech) => (
            <span
              key={tech}
              className="rounded-full border border-ink-border px-2.5 py-0.5 text-[11px] text-paper-muted"
            >
              {tech}
            </span>
          ))}
          {project.tech_stack.length > 5 && (
            <span className="px-2 py-0.5 text-[11px] text-paper-faint">
              +{project.tech_stack.length - 5}
            </span>
          )}
        </div>
      )}

      <Link
        href={`/projects/${project.id}`}
        className="mt-5 text-xs font-medium uppercase tracking-[0.18em] text-signal-gold"
      >
        Read more
      </Link>
    </div>
  );
}

export function ProjectGrid({ projects }: { projects: Project[] }) {
  if (projects.length === 0) {
    return (
      <p className="text-sm text-paper-faint">
        No projects indexed yet.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
      {projects.map((project) => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  );
}
