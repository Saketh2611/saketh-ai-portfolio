import Link from "next/link";
import type { Experience } from "@/types";

function ExperienceCard({ experience }: { experience: Experience }) {
  return (
    <div className="group flex flex-col rounded-xl border border-ink-border bg-ink-surface p-5 transition-colors hover:border-signal-gold/30">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-display text-lg font-semibold text-paper">{experience.role_title}</h3>
          <p className="font-mono text-xs text-signal-teal">{experience.company}</p>
        </div>
        <span className="shrink-0 whitespace-nowrap font-mono text-[11px] text-paper-faint">
          {experience.start_date} – {experience.end_date || "Present"}
        </span>
      </div>

      <p className="mt-2 flex-1 text-sm leading-relaxed text-paper-muted">
        {experience.short_description}
      </p>

      {experience.tech_stack.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {experience.tech_stack.slice(0, 5).map((tech) => (
            <span
              key={tech}
              className="rounded border border-ink-border px-2 py-0.5 font-mono text-[11px] text-signal-teal"
            >
              {tech}
            </span>
          ))}
          {experience.tech_stack.length > 5 && (
            <span className="px-2 py-0.5 font-mono text-[11px] text-paper-faint">
              +{experience.tech_stack.length - 5}
            </span>
          )}
        </div>
      )}

      <Link
        href={`/experiences/${experience.id}`}
        className="mt-4 font-mono text-xs text-signal-gold opacity-0 transition-opacity group-hover:opacity-100"
      >
        read more →
      </Link>
    </div>
  );
}

export function ExperienceGrid({ experiences }: { experiences: Experience[] }) {
  if (experiences.length === 0) {
    return (
      <p className="font-mono text-sm text-paper-faint">
        No experience entries yet.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {experiences.map((exp) => (
        <ExperienceCard key={exp.id} experience={exp} />
      ))}
    </div>
  );
}