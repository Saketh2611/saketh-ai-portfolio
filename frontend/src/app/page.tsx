"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { IdentityStrip } from "@/components/IdentityStrip";
import { ChatWidget } from "@/components/ChatWidget";
import { ProjectGrid } from "@/components/ProjectGrid";
import { SectionEyebrow } from "@/components/SectionEyebrow";
import { Footer } from "@/components/Footer";
import { api } from "@/lib/api";
import type { Profile, Project } from "@/types";

function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-ink">
      <p className="animate-pulse font-mono text-sm text-paper-muted">
        loading profile…
      </p>
    </div>
  );
}

function ErrorScreen({ message }: { message: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-2 bg-ink px-6 text-center">
      <p className="font-mono text-sm text-red-400">Couldn&apos;t reach the backend.</p>
      <p className="max-w-md font-mono text-xs text-paper-faint">{message}</p>
      <p className="mt-2 font-mono text-xs text-paper-faint">
        Check that NEXT_PUBLIC_API_URL points to a running backend.
      </p>
    </div>
  );
}

export default function HomePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([api.getProfile(), api.getProjects()])
      .then(([profileData, projectsData]) => {
        setProfile(profileData);
        setProjects(projectsData);
      })
      .catch((err) => setError(err.message || "Unknown error"));
  }, []);

  if (error) return <ErrorScreen message={error} />;
  if (!profile) return <LoadingScreen />;

  return (
    <div className="min-h-screen bg-ink">
      <Navbar />

      <main className="mx-auto max-w-5xl px-6">
        {/* Identity + Chat hero */}
        <section id="about" className="flex flex-col gap-10 py-16 sm:py-24">
          <IdentityStrip profile={profile} />

          {profile.summary && (
            <p className="max-w-2xl text-sm leading-relaxed text-paper-muted">
              {profile.summary}
            </p>
          )}

          <ChatWidget />
        </section>

        {/* Projects */}
        <section id="projects" className="py-16">
          <SectionEyebrow>source:project</SectionEyebrow>
          <ProjectGrid projects={projects} />
        </section>

        {/* Experience anchor — points back to the chat, since experience
            detail lives in the RAG knowledge base rather than a second
            static list that could drift out of sync with it. */}
        <section id="experience" className="py-16">
          <SectionEyebrow>source:experience</SectionEyebrow>
          <p className="max-w-xl text-sm leading-relaxed text-paper-muted">
            Full experience detail — role by role, what was built, what
            stack — lives in the chat above. Ask{" "}
            <span className="font-mono text-signal-teal">
              &quot;walk me through his work experience&quot;
            </span>{" "}
            for the complete picture with sources.
          </p>
        </section>
      </main>

      <Footer profile={profile} />
    </div>
  );
}
