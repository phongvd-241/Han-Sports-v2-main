export default function AdminPageHeader({ title, description, actions }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-5 border-b border-surface-border mb-2">
      <div>
        <h2 className="text-2xl font-extrabold text-text-primary tracking-tight">{title}</h2>
        {description && <p className="text-sm text-text-muted mt-1.5 leading-relaxed">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2.5">{actions}</div>}
    </div>
  );
}
