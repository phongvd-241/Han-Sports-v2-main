export default function PreviewPanel({ title, children }) {
  return (
    <aside className="rounded-xl border border-surface-border bg-surface-soft p-4">
      <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3">{title}</p>
      {children}
    </aside>
  );
}
