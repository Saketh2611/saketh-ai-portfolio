export function SectionEyebrow({ children }: { children: string }) {
  return (
    <div className="mb-8">
      <p className="eyebrow mb-3">{children}</p>
      <span className="block h-px w-16 bg-paper/80" />
    </div>
  );
}
