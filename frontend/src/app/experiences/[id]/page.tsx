"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { api, ApiRequestError } from "@/lib/api";
import type { ExperienceDetail } from "@/types";

export default function ExperienceDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [experience, setExperience] = useState<ExperienceDetail | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    api
      .getExperience(params.id)
      .then(setExperience)
      .catch((err) => {
        if (err instanceof ApiRequestError && err.status === 404) {
          setNotFound(true);
        }
      });
  }, [params.id]);

  if (notFound) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-ink">
        <p className="text-sm text-paper-muted">Experience not found.</p>
        <button
          onClick={() => router.push("/")}
          className="text-xs uppercase tracking-[0.18em] text-signal-gold hover:underline"
        >
          Back home
        </button>
      </div>
    );
  }

  if (!experience) {
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
          onClick={() => router.push("/#experience")}
          className="mb-8 text-xs uppercase tracking-[0.18em] text-paper-muted hover:text-paper"
        >
          All experience
        </button>

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
