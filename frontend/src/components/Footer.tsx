import type { Profile } from "@/types";

export function Footer({ profile }: { profile: Profile }) {
  return (
    <footer id="resume" className="border-t border-ink-border">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:justify-between sm:text-left">
          <div>
            <p className="font-display text-sm font-semibold text-paper">
              {profile.full_name}
            </p>
            <p className="mt-1 font-mono text-xs text-paper-muted">
              {[profile.email, profile.phone, profile.location].filter(Boolean).join(" · ")}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4">
            {profile.github_url && (
              <a
                href={profile.github_url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-xs text-paper-muted transition-colors hover:text-signal-teal"
              >
                GitHub ↗
              </a>
            )}
            {profile.linkedin_url && (
              <a
                href={profile.linkedin_url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-xs text-paper-muted transition-colors hover:text-signal-teal"
              >
                LinkedIn ↗
              </a>
            )}
            {profile.resume_pdf_url && (
              <a
                href={profile.resume_pdf_url}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg bg-signal-gold px-4 py-2 font-mono text-xs font-medium text-ink transition-opacity hover:opacity-90"
              >
                Download Resume
              </a>
            )}
          </div>
        </div>

        <p className="mt-8 text-center font-mono text-[11px] text-paper-faint">
          This site is itself a deployed RAG application — FastAPI, pgvector, BGE-M3, Groq.
        </p>
      </div>
    </footer>
  );
}
