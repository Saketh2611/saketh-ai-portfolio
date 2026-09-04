import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { api, ApiRequestError } from "@/lib/api";
import type { ExperienceDetail } from "@/types";

type ExperiencePageProps = {
  params: { id: string };
};

async function getExperience(id: string): Promise<ExperienceDetail | null> {
  try {
    return await api.getExperience(id);
  } catch (error) {
    if (error instanceof ApiRequestError && error.status === 404) return null;
    throw error;
  }
}

export async function generateMetadata({ params }: ExperiencePageProps): Promise<Metadata> {
  const experience = await getExperience(params.id);

  if (!experience) {
    return {
      title: "Experience not found | Saketh Vaddiparthi",
      description: "The requested experience could not be found.",
    };
  }

  return {
    title: `${experience.role_title} at ${experience.company} | Saketh Vaddiparthi`,
    description: experience.short_description,
  };
}

export default async function ExperienceDetailPage({ params }: ExperiencePageProps) {
  let experience: ExperienceDetail | null = null;

  try {
    experience = await getExperience(params.id);
  } catch {
    experience = null;
  }

  if (!experience) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-ink">
        <p className="text-sm text-paper-muted">Experience not found.</p>
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
          href="/#experience"
          className="mb-8 text-xs uppercase tracking-[0.18em] text-paper-muted hover:text-paper"
        >
          All experience
        </Link>

        <h1 className="font-display text-5xl tracking-wide text-paper">{experience.role_title}</h1>
        <p className="mt-3 text-xs font-medium uppercase tracking-[0.18em] text-signal-gold">
          {experience.company} · {experience.start_date} – {experience.end_date || "Present"}
        </p>
        <span className="mt-6 block h-px w-16 bg-paper/80" />

        {experience.tech_stack.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-1.5">
            {experience.tech_stack.map((tech) => (
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
          {experience.full_description}
        </div>
      </main>
    </div>
  );
}
