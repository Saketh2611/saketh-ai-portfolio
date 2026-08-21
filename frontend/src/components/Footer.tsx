import type { Profile } from "@/types";

export function Footer({ profile }: { profile: Profile }) {
  return (
    <footer id="resume" className="border-t border-ink-border bg-ink">
      <div className="mx-auto max-w-6xl px-6 py-14">
        <div className="flex flex-col items-start justify-between gap-8 sm:flex-row sm:items-end">
          <div>
            <p className="font-display text-4xl tracking-wide text-paper">
              {profile.full_name}
            </p>
            <p className="mt-2 max-w-md text-sm text-paper-muted">
              {[profile.email, profile.phone, profile.location].filter(Boolean).join("  ·  ")}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-5">
            {profile.github_url && (
              <a
                href={profile.github_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-medium uppercase tracking-[0.2em] text-paper-muted transition-colors hover:text-paper"
              >
                GitHub
              </a>
            )}
            {profile.linkedin_url && (
              <a
                href={profile.linkedin_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-medium uppercase tracking-[0.2em] text-paper-muted transition-colors hover:text-paper"
              >
                LinkedIn
              </a>
            )}
            {profile.resume_pdf_url && (
              <a
                href={profile.resume_pdf_url}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-md bg-signal-gold px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.16em] text-paper transition-opacity hover:opacity-90"
              >
                Download Resume
              </a>
            )}
          </div>
        </div>

        <p className="mt-12 text-xs text-paper-faint">
          This site is itself a deployed RAG application — FastAPI, pgvector, BGE-M3, Groq.
        </p>
      </div>
    </footer>
  );
}
