import Link from "next/link";
import type { Experience } from "@/types";

function ExperienceCard({ experience }: { experience: Experience }) {
  return (
    <div className="group relative flex flex-col rounded-2xl border border-ink-border bg-ink-surface p-6 transition-colors hover:border-signal-gold/50">
      <div className="absolute bottom-0 right-0 h-10 w-10 rounded-br-2xl border-b-[6px] border-r-[6px] border-signal-gold opacity-0 transition-opacity group-hover:opacity-100" />
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-display text-3xl tracking-wide text-paper">{experience.role_title}</h3>
          <p className="mt-1 text-xs font-medium uppercase tracking-[0.18em] text-signal-gold">
            {experience.company}
          </p>
        </div>
        <span className="shrink-0 whitespace-nowrap pt-1 text-[11px] uppercase tracking-wider text-paper-faint">
          {experience.start_date} – {experience.end_date || "Present"}
        </span>
      </div>

      <p className="mt-3 flex-1 text-sm leading-relaxed text-paper-muted">
        {experience.short_description}
      </p>

      {experience.tech_stack.length > 0 && (
        <div className="mt-5 flex flex-wrap gap-1.5">
          {experience.tech_stack.slice(0, 5).map((tech) => (
            <span
              key={tech}
              className="rounded-full border border-ink-border px-2.5 py-0.5 text-[11px] text-paper-muted"
            >
              {tech}
            </span>
          ))}
          {experience.tech_stack.length > 5 && (
            <span className="px-2 py-0.5 text-[11px] text-paper-faint">
              +{experience.tech_stack.length - 5}
            </span>
          )}
        </div>
      )}

      <Link
        href={`/experiences/${experience.id}`}
        className="mt-5 text-xs font-medium uppercase tracking-[0.18em] text-signal-gold"
      >
        Read more
      </Link>
    </div>
  );
}

export function ExperienceGrid({ experiences }: { experiences: Experience[] }) {
  if (experiences.length === 0) {
    return (
      <p className="text-sm text-paper-faint">
        No experience entries yet.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {experiences.map((exp) => (
        <ExperienceCard key={exp.id} experience={exp} />
      ))}
    </div>
  );
}
