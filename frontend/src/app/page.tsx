"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { IdentityStrip } from "@/components/IdentityStrip";
import { ChatWidget } from "@/components/ChatWidget";
import { ProjectGrid } from "@/components/ProjectGrid";
import { ExperienceGrid } from "@/components/ExperienceGrid";
import { SectionEyebrow } from "@/components/SectionEyebrow";
import { Footer } from "@/components/Footer";
import { api } from "@/lib/api";
import type { Profile, Project, Experience } from "@/types";

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
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([api.getProfile(), api.getProjects(), api.getExperiences()])
      .then(([profileData, projectsData, experiencesData]) => {
        setProfile(profileData);
        setProjects(projectsData);
        setExperiences(experiencesData);
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

          {profile.visible_summary && (
            <p className="max-w-2xl text-sm leading-relaxed text-paper-muted">
              {profile.visible_summary}
            </p>
          )}

          <ChatWidget />
        </section>

        {/* Experience */}
        <section id="experience" className="py-16">
          <SectionEyebrow>source:experience</SectionEyebrow>
          <ExperienceGrid experiences={experiences} />
        </section>

        {/* Projects */}
        <section id="projects" className="py-16">
          <SectionEyebrow>source:project</SectionEyebrow>
          <ProjectGrid projects={projects} />
        </section>
      </main>

      <Footer profile={profile} />
    </div>
  );
}