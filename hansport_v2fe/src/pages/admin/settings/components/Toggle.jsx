export default function Toggle({ checked, onChange, label }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${checked ? "bg-brand-green" : "bg-surface-muted"}`}
      aria-label={label}
      aria-pressed={checked}
    >
      <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${checked ? "translate-x-6" : "translate-x-1"}`} />
    </button>
  );
}
