import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { api, ApiRequestError } from "@/lib/api";
import type { ProjectDetail } from "@/types";

type ProjectPageProps = {
  params: { id: string };
};

async function getProject(id: string): Promise<ProjectDetail | null> {
  try {
    return await api.getProject(id);
  } catch (error) {
    if (error instanceof ApiRequestError && error.status === 404) return null;
    throw error;
  }
}

export async function generateMetadata({ params }: ProjectPageProps): Promise<Metadata> {
  const project = await getProject(params.id);

  if (!project) {
    return {
      title: "Project not found | Saketh Vaddiparthi",
      description: "The requested project could not be found.",
    };
  }

  return {
    title: `${project.title} | Saketh Vaddiparthi`,
    description: project.short_description,
  };
}

export default async function ProjectDetailPage({ params }: ProjectPageProps) {
  let project: ProjectDetail | null = null;

  try {
    project = await getProject(params.id);
  } catch {
    project = null;
  }

  if (!project) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-ink">
        <p className="text-sm text-paper-muted">Project not found.</p>
        <Link
          href="/"
          className="text-xs uppercase tracking-[0.18em] text-signal-gold hover:underline"
        >
          Back home
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ink">
      <Navbar />
      <main className="mx-auto max-w-3xl px-6 py-16">
        <Link
          href="/#projects"
          className="mb-8 text-xs uppercase tracking-[0.18em] text-paper-muted hover:text-paper"
        >
          All projects
        </Link>

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
