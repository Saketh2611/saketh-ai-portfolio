// JWT storage for the admin session. localStorage is acceptable here
// since this is a single-admin app with no sensitive multi-tenant data
// at stake beyond "can edit my own portfolio" — the standard XSS caveat
// of localStorage-stored tokens applies, but the blast radius of a leak
// is "someone edits my portfolio," not "someone accesses other users'
// private data."

const TOKEN_KEY = "saketh_ai_admin_token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null; // SSR guard
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export function isLoggedIn(): boolean {
  return getToken() !== null;
}
