import EmptyState from "./EmptyState";
import Pagination from "./Pagination";

export default function DataTable({
  columns,
  children,
  loading = false,
  isEmpty = false,
  emptyIcon = "inbox",
  emptyTitle = "Không có dữ liệu",
  emptyDescription,
  skeletonRows = 6,
  page,
  totalPages,
  onPageChange,
  className = "",
  framed = true,
}) {
  const colSpan = columns.length;

  const content = (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-surface-muted text-text-muted text-xs uppercase tracking-wider">
              {columns.map((column) => (
                <th key={column.key || column.label} className={column.className || "px-4 py-3 text-left"}>
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-border">
            {loading ? (
              [...Array(skeletonRows)].map((_, row) => (
                <tr key={row}>
                  {columns.map((column) => (
                    <td key={column.key || column.label} className="px-4 py-3">
                      <div className={`skeleton rounded ${column.skeletonClassName || "h-7"}`} />
                    </td>
                  ))}
                </tr>
              ))
            ) : isEmpty ? (
              <EmptyState colSpan={colSpan} icon={emptyIcon} title={emptyTitle} description={emptyDescription} />
            ) : children}
          </tbody>
        </table>
      </div>

      {typeof page === "number" && (
        <Pagination page={page} totalPages={totalPages || 1} onPageChange={onPageChange} />
      )}
    </>
  );

  return (
    <div className={`${framed ? "card overflow-hidden" : ""} ${className}`}>
      {content}
    </div>
  );
}
