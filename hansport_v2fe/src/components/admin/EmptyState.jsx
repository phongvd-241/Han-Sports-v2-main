function EmptyContent({ icon = "inbox", title, description }) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-6">
      <div className="w-16 h-16 rounded-full bg-surface-soft border border-surface-border flex items-center justify-center text-text-muted mb-4 shadow-sm">
        <span className="material-symbols-outlined" style={{ fontSize: 30 }}>{icon}</span>
      </div>
      <p className="font-bold text-text-primary text-base">{title}</p>
      {description && <p className="mt-1.5 text-sm text-text-muted max-w-sm leading-relaxed">{description}</p>}
    </div>
  );
}

export default function EmptyState({ colSpan, icon, title, description, className = "py-16" }) {
  if (colSpan) {
    return (
      <tr>
        <td colSpan={colSpan} className={`px-4 ${className}`}>
          <EmptyContent icon={icon} title={title} description={description} />
        </td>
      </tr>
    );
  }

  return (
    <div className={`card border-dashed border-2 bg-surface-soft/30 ${className}`}>
      <EmptyContent icon={icon} title={title} description={description} />
    </div>
  );
}
