export default function StatusBadge({ label, className = "badge-blue" }) {
  return <span className={className}>{label}</span>;
}
