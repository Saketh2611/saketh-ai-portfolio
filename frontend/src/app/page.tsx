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

function firstName(fullName: string) {
  return fullName.trim().split(/\s+/)[0] || fullName;
}

function restOfName(fullName: string) {
  const parts = fullName.trim().split(/\s+/);
  return parts.slice(1).join(" ");
}

function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-black">
      <p className="animate-pulse text-sm text-paper-muted">Loading profile</p>
    </div>
  );
}

function ErrorScreen({ message }: { message: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-2 bg-black px-6 text-center">
      <p className="text-sm text-signal-gold">Couldn&apos;t reach the backend.</p>
      <p className="max-w-md text-xs text-paper-faint">{message}</p>
      <p className="mt-2 text-xs text-paper-faint">
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

  const given = firstName(profile.full_name);
  const family = restOfName(profile.full_name);

  return (
    <div className="min-h-screen bg-black">
      <Navbar />

      <section id="about" className="hero-stage relative overflow-hidden">
        <span className="absolute inset-y-8 left-0 w-1.5 overflow-hidden">
          <svg viewBox="0 0 8 400" className="h-full w-full" preserveAspectRatio="none" aria-hidden="true">
            <path
              d="M4 0 C 1 30 7 60 4 90 C 1 120 7 150 4 180 C 1 210 7 240 4 270 C 1 300 7 330 4 360 C 2 380 5 390 4 400"
              fill="none"
              stroke="#8ec6e6"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </svg>
        </span>
        <div className="orb pointer-events-none absolute -left-24 -top-28 h-64 w-64 opacity-80 sm:h-80 sm:w-80" />

        <div className="relative mx-auto grid min-h-[calc(100vh-72px)] max-w-6xl items-center gap-10 px-6 py-16 lg:grid-cols-2 lg:py-10">
          <div className="relative z-10 max-w-xl">
            <p className="text-4xl font-medium text-paper-muted sm:text-5xl">
              Hey! I&apos;m
            </p>
            <h1 className="mt-1 text-5xl font-extrabold leading-[1.05] tracking-tight text-paper sm:text-6xl lg:text-7xl">
              {given}
              {family ? (
                <>
                  <br />
                  {family}
                </>
              ) : null}
            </h1>

            <p className="mt-8 max-w-md font-mono text-[13px] leading-relaxed text-paper-muted sm:text-sm">
              {profile.visible_summary || profile.headline}
            </p>

            <a
              href="#projects"
              className="mt-10 inline-flex rounded-full bg-paper px-7 py-3 text-sm font-semibold text-black transition-opacity hover:opacity-90"
            >
              Look at my work!
            </a>
          </div>

          <IdentityStrip profile={profile} />
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-6">
        <section id="chat" className="py-16">
          <SectionEyebrow>Ask AI</SectionEyebrow>
          <p className="mb-6 max-w-xl text-sm text-paper-muted">
            Grounded in real projects and experience — ask anything about the work.
          </p>
          <ChatWidget />
        </section>

        <section id="experience" className="py-8 pb-20">
          <SectionEyebrow>Experience</SectionEyebrow>
          <ExperienceGrid experiences={experiences} />
        </section>

        <section id="projects" className="pb-20">
          <SectionEyebrow>Selected projects</SectionEyebrow>
          <ProjectGrid projects={projects} />
        </section>
      </main>

      <Footer profile={profile} />
    </div>
  );
}
