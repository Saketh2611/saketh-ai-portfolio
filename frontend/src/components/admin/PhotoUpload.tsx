"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { api, ApiRequestError } from "@/lib/api";

const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export function PhotoUpload({
  currentPhotoUrl,
  onUploaded,
}: {
  currentPhotoUrl: string | null;
  onUploaded: (url: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(currentPhotoUrl);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function validate(file: File): string | null {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return "Photo must be JPEG, PNG, or WebP.";
    }
    if (file.size > MAX_BYTES) {
      return "Photo must be under 5MB.";
    }
    return null;
  }

  async function handleFile(file: File) {
    const validationError = validate(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setPreview(URL.createObjectURL(file)); // instant local preview while uploading
    setIsUploading(true);

    try {
      const { photo_url } = await api.uploadPhoto(file);
      setPreview(photo_url);
      onUploaded(photo_url);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Upload failed.");
      setPreview(currentPhotoUrl); // revert preview on failure
    } finally {
      setIsUploading(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  return (
    <div>
      <label className="mb-2 block font-mono text-xs text-paper-muted">
        Profile photo
      </label>

      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`flex cursor-pointer items-center gap-4 rounded-xl border-2 border-dashed p-5 transition-colors ${
          isDragging
            ? "border-signal-gold bg-signal-gold/5"
            : "border-ink-border hover:border-paper-faint"
        }`}
      >
        {preview ? (
          <Image
            src={preview}
            alt="Profile preview"
            width={64}
            height={64}
            className="h-16 w-16 rounded-full object-cover"
            unoptimized // local blob: URLs during preview aren't next/image-optimizable
          />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-ink-raised text-xs uppercase tracking-wider text-paper-muted">
            Photo
          </div>
        )}

        <div className="flex-1">
          <p className="text-sm text-paper">
            {isUploading
              ? "Uploading…"
              : preview
              ? "Click or drag to replace"
              : "Click or drag a photo here"}
          </p>
          <p className="mt-0.5 font-mono text-[11px] text-paper-faint">
            JPEG, PNG, or WebP — up to 5MB
          </p>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(",")}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />

      {error && <p className="mt-2 font-mono text-xs text-red-400">{error}</p>}
    </div>
  );
}
