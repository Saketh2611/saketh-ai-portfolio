// The small mono label above each major section ("── source:project").
// This isn't decorative numbering — it deliberately mirrors the actual
// source_type values in the backend's chunks table, so the label is
// literally true to how that section's content is stored and retrieved.

export function SectionEyebrow({ children }: { children: string }) {
  return <p className="eyebrow mb-4">{children}</p>;
}
