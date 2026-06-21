const VARIANT_CLASS = {
  default: "text-text-muted hover:bg-surface-muted hover:text-text-primary focus-visible:ring-slate-400",
  primary: "text-brand-blue hover:bg-brand-blue-light focus-visible:ring-brand-blue",
  danger: "text-danger hover:bg-red-50 focus-visible:ring-red-500",
};

export default function IconButton({
  icon,
  label,
  variant = "default",
  disabled = false,
  onClick,
  type = "button",
  className = "",
}) {
  if (!label) {
    console.warn(`[Accessibility Warning] IconButton with icon "${icon}" is missing a required "label" prop for aria-label.`);
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label || `${icon} button`}
      className={`p-2 rounded-xl transition-all duration-150 active:scale-95 disabled:opacity-35 disabled:cursor-not-allowed disabled:active:scale-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${VARIANT_CLASS[variant] || VARIANT_CLASS.default} ${className}`}
    >
      <span className="material-symbols-outlined" style={{ fontSize: 18, display: "block" }}>{icon}</span>
    </button>
  );
}

