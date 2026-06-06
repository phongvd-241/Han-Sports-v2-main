const VARIANT_CLASS = {
  default: "text-text-muted hover:bg-surface-muted hover:text-text-primary",
  primary: "text-brand-blue hover:bg-brand-blue-light",
  danger: "text-danger hover:bg-red-50",
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
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className={`p-1.5 rounded-lg transition-all disabled:opacity-35 disabled:cursor-not-allowed ${VARIANT_CLASS[variant] || VARIANT_CLASS.default} ${className}`}
    >
      <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{icon}</span>
    </button>
  );
}
