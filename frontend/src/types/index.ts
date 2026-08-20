// Mirrors backend/app/models/schemas.py — keep these in sync manually.
// There's no shared codegen step in this project; if you add a field on
// one side, add it here too.

export interface Profile {
  full_name: string;
  headline: string;
  summary: string;
  photo_url: string | null;
  resume_pdf_url: string | null;
  email: string | null;
  github_url: string | null;
  linkedin_url: string | null;
  phone: string | null;
  location: string | null;
  visible_summary: string;
}

export interface ProfileUpdate {
  full_name?: string;
  headline?: string;
  summary?: string;
  email?: string;
  github_url?: string;
  linkedin_url?: string;
  phone?: string;
  location?: string;
  visible_summary?: string;
}

export interface Project {
  id: string;
  title: string;
  github_url: string | null;
  live_url: string | null;
  short_description: string;
  tech_stack: string[];
  display_order: number;
}

export interface ProjectDetail extends Project {
  full_description: string;
  created_at: string;
}

export interface ProjectCreate {
  title: string;
  github_url?: string;
  live_url?: string;
  short_description: string;
  full_description: string;
  tech_stack: string[];
  display_order?: number;
}

export type ProjectUpdate = Partial<ProjectCreate>;

export interface ChatSource {
  title: string;
  url: string | null;
  source_type: "profile" | "project" | "resume_section";
}

export interface ChatResponse {
  answer: string;
  sources: ChatSource[];
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: ChatSource[];
  isLoading?: boolean;
}

export interface AdminStats {
  project_count: number;
  chunk_count: number;
  chunks_by_type: Record<string, number>;
  total_chat_queries: number;
}

export interface ApiError {
  detail: string;
}
