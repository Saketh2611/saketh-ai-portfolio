// Typed fetch wrapper for every backend call. Centralizing this means
// auth headers, base URL, and error parsing live in one place — no
// component reaches for raw fetch() directly.

import type {
  AdminStats,
  ChatResponse,
  Profile,
  ProfileUpdate,
  Project,
  ProjectCreate,
  ProjectDetail,
  ProjectUpdate,
  Experience,
  ExperienceCreate,
  ExperienceDetail,
  ExperienceUpdate,
} from "@/types";
import { getToken } from "@/lib/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

class ApiRequestError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "ApiRequestError";
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  auth: boolean = false
): Promise<T> {
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> | undefined),
  };

  // Only set Content-Type for JSON bodies — file uploads pass FormData,
  // which needs the browser to set its own multipart boundary header.
  if (options.body && !(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  if (auth) {
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (!res.ok) {
    let message = `Request failed with status ${res.status}`;
    try {
      const body = await res.json();
      message = body.detail || message;
    } catch {
      // response wasn't JSON — keep the generic message
    }
    throw new ApiRequestError(res.status, message);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// --- Public ---

export const api = {
  getProfile: () => request<Profile>("/api/profile"),

  getProjects: () => request<Project[]>("/api/projects"),

  getProject: (id: string) => request<ProjectDetail>(`/api/projects/${id}`),

  getResumeUrl: () => request<{ resume_url: string }>("/api/resume"),

  getExperiences: () => request<Experience[]>("/api/experiences"),

  getExperience: (id: string) => request<ExperienceDetail>(`/api/experiences/${id}`),

  sendChat: (query: string) =>
    request<ChatResponse>("/api/chat", {
      method: "POST",
      body: JSON.stringify({ query }),
    }),

  // --- Admin auth ---

  adminLogin: (password: string) =>
    request<{ access_token: string; token_type: string }>("/api/admin/login", {
      method: "POST",
      body: JSON.stringify({ password }),
    }),

  adminVerify: () => request<{ valid: boolean }>("/api/admin/verify", {}, true),

  // --- Admin profile ---

  updateProfile: (payload: ProfileUpdate) =>
    request<Profile>(
      "/api/admin/profile",
      { method: "PUT", body: JSON.stringify(payload) },
      true
    ),

  uploadPhoto: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return request<{ photo_url: string }>(
      "/api/admin/profile/photo",
      { method: "POST", body: formData },
      true
    );
  },

  uploadResumePdf: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return request<{ resume_pdf_url: string }>(
      "/api/admin/profile/resume",
      { method: "POST", body: formData },
      true
    );
  },

  addResumeSection: (section_title: string, content: string) =>
    request<{ status: string; total_chunks: number }>(
      "/api/admin/profile/resume-section",
      { method: "POST", body: JSON.stringify({ section_title, content }) },
      true
    ),

  // --- Admin projects ---

  getAdminProjects: () => request<ProjectDetail[]>("/api/admin/projects", {}, true),

  createProject: (payload: ProjectCreate) =>
    request<ProjectDetail>(
      "/api/admin/projects",
      { method: "POST", body: JSON.stringify(payload) },
      true
    ),

  updateProject: (id: string, payload: ProjectUpdate) =>
    request<ProjectDetail>(
      `/api/admin/projects/${id}`,
      { method: "PUT", body: JSON.stringify(payload) },
      true
    ),

  deleteProject: (id: string) =>
    request<void>(`/api/admin/projects/${id}`, { method: "DELETE" }, true),

  getAdminExperiences: () => request<ExperienceDetail[]>("/api/admin/experiences", {}, true),

  createExperience: (payload: ExperienceCreate) =>
    request<ExperienceDetail>(
      "/api/admin/experiences",
      { method: "POST", body: JSON.stringify(payload) },
      true
    ),

  updateExperience: (id: string, payload: ExperienceUpdate) =>
    request<ExperienceDetail>(
      `/api/admin/experiences/${id}`,
      { method: "PUT", body: JSON.stringify(payload) },
      true
    ),

  deleteExperience: (id: string) =>
    request<void>(`/api/admin/experiences/${id}`, { method: "DELETE" }, true),

  // --- Admin stats ---

  getStats: () => request<AdminStats>("/api/admin/stats", {}, true),
};

export { ApiRequestError };
