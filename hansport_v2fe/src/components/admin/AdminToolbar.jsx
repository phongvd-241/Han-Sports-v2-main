export default function AdminToolbar({ children, className = "" }) {
  return (
    <div className={`flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between py-1.5 ${className}`}>
      {children}
    </div>
  );
}
