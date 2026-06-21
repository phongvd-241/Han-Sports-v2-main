export default function AdminMetricCard({ icon, label, value, hint, tone = "blue" }) {
  const toneClass = {
    blue: "bg-brand-blue-light text-brand-blue border-brand-blue/25",
    green: "bg-brand-green-light text-brand-green border-brand-green/25",
    teal: "bg-brand-teal-light text-brand-teal border-brand-teal/25",
    amber: "bg-amber-50 text-amber-600 border-amber-300",
    danger: "bg-red-50 text-danger border-red-300",
  }[tone] || "bg-brand-blue-light text-brand-blue border-brand-blue/25";

  return (
    <div className="card p-4 flex items-center gap-3.5 hover:-translate-y-1.5 hover:shadow-card-hover transition-all duration-300 ease-smooth">
      <div className={`w-11 h-11 rounded-xl border flex items-center justify-center flex-shrink-0 ${toneClass}`}>
        <span className="material-symbols-outlined" style={{ fontSize: 22 }}>{icon}</span>
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">{label}</p>
        <p className="text-lg font-extrabold text-text-primary truncate mt-0.5">{value}</p>
        {hint && <p className="text-xs text-text-muted mt-0.5 truncate">{hint}</p>}
      </div>
    </div>
  );
}
