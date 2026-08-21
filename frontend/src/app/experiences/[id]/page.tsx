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
        <p className="font-mono text-sm text-paper-muted">Experience not found.</p>
        <button
          onClick={() => router.push("/")}
          className="font-mono text-xs text-signal-gold hover:underline"
        >
          ← back home
        </button>
      </div>
    );
  }

  if (!experience) {
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
          onClick={() => router.push("/#experience")}
          className="mb-8 font-mono text-xs text-paper-muted hover:text-paper"
        >
          ← all experience
        </button>

        <h1 className="font-display text-3xl font-semibold text-paper">{experience.role_title}</h1>
        <p className="mt-2 font-mono text-sm text-signal-teal">
          {experience.company} · {experience.start_date} – {experience.end_date || "Present"}
        </p>

        {experience.tech_stack.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-1.5">
            {experience.tech_stack.map((tech) => (
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
          {experience.full_description}
        </div>
      </main>
    </div>
  );
}