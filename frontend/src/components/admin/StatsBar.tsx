"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { AdminStats } from "@/types";

export function StatsBar() {
  const [stats, setStats] = useState<AdminStats | null>(null);

  useEffect(() => {
    api.getStats().then(setStats).catch(() => {
      // Non-critical — the dashboard works fine without stats, so a
      // failure here shouldn't block or clutter the rest of the page.
    });
  }, []);

  if (!stats) return null;

  const items = [
    { label: "projects", value: stats.project_count },
    { label: "chunks indexed", value: stats.chunk_count },
    { label: "recruiter questions asked", value: stats.total_chat_queries },
  ];

  return (
    <div className="flex flex-wrap gap-6 rounded-xl border border-ink-border bg-ink-surface px-5 py-4">
      {items.map((item) => (
        <div key={item.label}>
          <p className="font-display text-2xl font-semibold text-signal-gold">
            {item.value}
          </p>
          <p className="font-mono text-[11px] uppercase tracking-wider text-paper-muted">
            {item.label}
          </p>
        </div>
      ))}
    </div>
  );
}
