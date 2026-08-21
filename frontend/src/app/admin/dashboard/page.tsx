"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminGuard } from "@/components/admin/AdminGuard";
import { PhotoUpload } from "@/components/admin/PhotoUpload";
import { ProfileForm } from "@/components/admin/ProfileForm";
import { ResumeUpload } from "@/components/admin/ResumeUpload";
import { ProjectList } from "@/components/admin/ProjectList";
import { ExperienceList } from "@/components/admin/ExperienceList";   {/* ADD THIS LINE */}
import { StatsBar } from "@/components/admin/StatsBar";
import { api } from "@/lib/api";
import { clearToken } from "@/lib/auth";
import type { Profile } from "@/types";

function DashboardContent() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    api.getProfile().then(setProfile);
  }, []);

  function handleLogout() {
    clearToken();
    router.push("/admin/login");
  }

  return (
    <div className="min-h-screen bg-ink pb-24">
      <header className="sticky top-0 z-10 border-b border-ink-border bg-ink/90 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-wider text-signal-teal">admin</p>
            <h1 className="font-display text-lg font-semibold text-paper">Manage your portfolio</h1>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-xs text-paper-muted hover:text-paper"
            >
              view live site ↗
            </a>
            <button
              onClick={handleLogout}
              className="font-mono text-xs text-paper-muted hover:text-red-400"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-10 px-6 py-10">
        <StatsBar />

        <section>
          <h2 className="mb-4 font-mono text-xs uppercase tracking-wider text-paper-muted">
            ── Photo
          </h2>
          {profile && (
            <PhotoUpload
              currentPhotoUrl={profile.photo_url}
              onUploaded={(url) => setProfile((p) => (p ? { ...p, photo_url: url } : p))}
            />
          )}
        </section>

        <section>
          <h2 className="mb-4 font-mono text-xs uppercase tracking-wider text-paper-muted">
            ── Profile & summary
          </h2>
          {profile && <ProfileForm profile={profile} onSaved={setProfile} />}
        </section>

        <section>
          <h2 className="mb-4 font-mono text-xs uppercase tracking-wider text-paper-muted">
            ── Resume
          </h2>
          {profile && <ResumeUpload currentResumeUrl={profile.resume_pdf_url} />}
        </section>

        {/* ADD THIS ENTIRE SECTION — place it before or after Projects, your call */}
        <section>
          <h2 className="mb-4 font-mono text-xs uppercase tracking-wider text-paper-muted">
            ── Experience
          </h2>
          <p className="mb-4 text-xs text-paper-faint">
            Add each role — company, dates, and the full write-up. It gets
            chunked and indexed into the chatbot&apos;s knowledge base
            automatically, and appears on the live site immediately.
          </p>
          <ExperienceList />
        </section>

        <section>
          <h2 className="mb-4 font-mono text-xs uppercase tracking-wider text-paper-muted">
            ── Projects
          </h2>
          <p className="mb-4 text-xs text-paper-faint">
            Paste a GitHub link and the full project write-up — it gets
            chunked and indexed into the chatbot&apos;s knowledge base
            automatically, and appears on the live site immediately.
          </p>
          <ProjectList />
        </section>
      </main>
    </div>
  );
}

export default function AdminDashboardPage() {
  return (
    <AdminGuard>
      <DashboardContent />
    </AdminGuard>
  );
}