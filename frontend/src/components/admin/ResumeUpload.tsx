"use client";

import { useRef, useState } from "react";
import { api, ApiRequestError } from "@/lib/api";

export function ResumeUpload({ currentResumeUrl }: { currentResumeUrl: string | null }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [resumeUrl, setResumeUrl] = useState(currentResumeUrl);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [sectionTitle, setSectionTitle] = useState("");
  const [sectionContent, setSectionContent] = useState("");
  const [isSavingSection, setIsSavingSection] = useState(false);
  const [sectionSaved, setSectionSaved] = useState<number | null>(null);

  async function handleFile(file: File) {
    if (file.type !== "application/pdf") {
      setError("Resume must be a PDF.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("Resume must be under 10MB.");
      return;
    }

    setError(null);
    setIsUploading(true);
    try {
      const { resume_pdf_url } = await api.uploadResumePdf(file);
      setResumeUrl(resume_pdf_url);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Upload failed.");
    } finally {
      setIsUploading(false);
    }
  }

  async function handleAddSection(e: React.FormEvent) {
    e.preventDefault();
    if (!sectionTitle.trim() || !sectionContent.trim()) return;

    setIsSavingSection(true);
    setError(null);
    try {
      const result = await api.addResumeSection(sectionTitle, sectionContent);
      setSectionSaved(result.total_chunks);
      setSectionTitle("");
      setSectionContent("");
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Failed to save section.");
    } finally {
      setIsSavingSection(false);
    }
  }

  const inputClass =
    "mt-1.5 w-full rounded-lg border border-ink-border bg-ink px-4 py-2.5 text-sm text-paper focus:border-signal-gold/50";

  return (
    <div className="space-y-6">
      {/* PDF upload */}
      <div>
        <label className="mb-2 block font-mono text-xs text-paper-muted">
          Resume PDF <span className="text-paper-faint">(downloadable link on the site)</span>
        </label>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={isUploading}
            className="rounded-lg border border-ink-border bg-ink px-4 py-2 font-mono text-xs text-paper hover:border-paper-faint disabled:opacity-50"
          >
            {isUploading ? "Uploading…" : resumeUrl ? "Replace PDF" : "Upload PDF"}
          </button>
          {resumeUrl && (
            <a
              href={resumeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-xs text-signal-teal hover:underline"
            >
              view current ↗
            </a>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
      </div>

      {/* Supplementary text sections */}
      <form onSubmit={handleAddSection} className="border-t border-ink-border pt-6">
        <p className="mb-1 font-mono text-xs text-paper-muted">
          Add supplementary content for the chatbot
        </p>
        <p className="mb-3 text-xs text-paper-faint">
          Things that aren&apos;t a &quot;project&quot; but you want the bot to know —
          scholastic achievements, positions of responsibility, etc. Each
          section you add here is additive, not a replacement.
        </p>

        <label className="block">
          <span className="font-mono text-xs text-paper-muted">Section title</span>
          <input
            value={sectionTitle}
            onChange={(e) => setSectionTitle(e.target.value)}
            placeholder="Scholastic Achievements"
            className={inputClass}
          />
        </label>

        <label className="mt-3 block">
          <span className="font-mono text-xs text-paper-muted">Content</span>
          <textarea
            value={sectionContent}
            onChange={(e) => setSectionContent(e.target.value)}
            rows={4}
            placeholder="Secured AIR 3,295 in JEE Advanced 2022. Solved 700+ DSA problems across LeetCode, GFG, CodeChef, HackerRank..."
            className={inputClass}
          />
        </label>

        <div className="mt-3 flex items-center gap-3">
          <button
            type="submit"
            disabled={isSavingSection || !sectionTitle.trim() || !sectionContent.trim()}
            className="rounded-lg border border-signal-teal/40 bg-signal-teal/10 px-4 py-2 font-mono text-xs text-signal-teal transition-colors hover:bg-signal-teal/20 disabled:opacity-40"
          >
            {isSavingSection ? "Indexing…" : "Add to knowledge base"}
          </button>
          {sectionSaved !== null && (
            <span className="font-mono text-xs text-signal-teal">
              ✓ indexed — {sectionSaved} total chunks
            </span>
          )}
        </div>
      </form>

      {error && <p className="font-mono text-xs text-red-400">{error}</p>}
    </div>
  );
}
