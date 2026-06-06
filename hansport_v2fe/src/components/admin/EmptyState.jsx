function EmptyContent({ icon = "inbox", title, description }) {
  return (
    <div className="flex flex-col items-center justify-center text-center text-text-muted">
      <span className="material-symbols-outlined" style={{ fontSize: 48 }}>{icon}</span>
      <p className="mt-2 font-semibold">{title}</p>
      {description && <p className="mt-1 text-xs">{description}</p>}
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
    <div className={className}>
      <EmptyContent icon={icon} title={title} description={description} />
    </div>
  );
}
