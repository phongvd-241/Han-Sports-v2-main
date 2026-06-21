export default function StatusBadge({ label, className = "badge-blue" }) {
  const displayText = label || "N/A";
  return (
    <span 
      className={className} 
      role="status" 
      aria-label={`Trạng thái: ${displayText}`}
    >
      {displayText}
    </span>
  );
}

