"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiRequestError } from "@/lib/api";
import { setToken } from "@/lib/auth";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const { access_token } = await api.adminLogin(password);
      setToken(access_token);
      router.push("/admin/dashboard");
    } catch (err) {
      setError(
        err instanceof ApiRequestError
          ? err.message
          : "Couldn't reach the backend — check it's running."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink px-6">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-xl border border-ink-border bg-ink-surface p-8"
      >
        <p className="font-mono text-xs uppercase tracking-wider text-signal-teal">
          admin
        </p>
        <h1 className="mt-2 font-display text-xl font-semibold text-paper">
          Sign in to manage content
        </h1>

        <label className="mt-6 block">
          <span className="font-mono text-xs text-paper-muted">Password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
            required
            className="mt-1.5 w-full rounded-lg border border-ink-border bg-ink px-4 py-2.5 text-sm text-paper focus:border-signal-gold/50"
          />
        </label>

        {error && <p className="mt-3 font-mono text-xs text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={isSubmitting || !password}
          className="mt-6 w-full rounded-lg bg-signal-gold py-2.5 font-mono text-sm font-medium text-ink transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isSubmitting ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
