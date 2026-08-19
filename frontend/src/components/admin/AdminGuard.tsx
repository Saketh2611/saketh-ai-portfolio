"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiRequestError } from "@/lib/api";
import { clearToken, isLoggedIn } from "@/lib/auth";

/**
 * Wraps any admin page. Checks for a token on mount, verifies it against
 * the backend (not just "does a token exist" — an expired token would
 * pass a local-only check and then 401 on the first real request), and
 * redirects to /admin/login if it's missing or invalid.
 */
export function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [status, setStatus] = useState<"checking" | "authorized">("checking");

  useEffect(() => {
    if (!isLoggedIn()) {
      router.replace("/admin/login");
      return;
    }

    api
      .adminVerify()
      .then(() => setStatus("authorized"))
      .catch((err) => {
        if (err instanceof ApiRequestError && err.status === 401) {
          clearToken();
        }
        router.replace("/admin/login");
      });
  }, [router]);

  if (status === "checking") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink">
        <p className="animate-pulse font-mono text-sm text-paper-muted">
          checking session…
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
