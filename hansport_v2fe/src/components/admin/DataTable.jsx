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
  mobileCardRenderer = null,
  items = [],
}) {
  const colSpan = columns.length;
  const showMobileCards = typeof mobileCardRenderer === "function" && Array.isArray(items);

  const content = (
    <>
      {/* Viewport Desktop/Tablet (Table View) */}
      <div className={showMobileCards ? "hidden md:block overflow-x-auto" : "block overflow-x-auto"}>
        <table className="w-full text-sm" aria-busy={loading}>
          <thead>
            <tr className="bg-slate-50/75 border-b border-surface-border text-text-secondary text-xs uppercase tracking-wider">
              {columns.map((column) => (
                <th key={column.key || column.label} scope="col" className={column.className || "px-5 py-3.5 text-left font-semibold"}>
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-border">
            {loading ? (
              [...Array(skeletonRows)].map((_, row) => (
                <tr key={row} className="animate-pulse">
                  {columns.map((column) => (
                    <td key={column.key || column.label} className="px-5 py-4">
                      <div className={`skeleton rounded-md ${column.skeletonClassName || "h-6 w-full"}`} />
                    </td>
                  ))}
                </tr>
              ))
            ) : isEmpty ? (
              <EmptyState colSpan={colSpan} icon={emptyIcon} title={emptyTitle} description={emptyDescription} className="py-20" />
            ) : children}
          </tbody>
        </table>
      </div>

      {/* Viewport Mobile (Card View) */}
      {showMobileCards && (
        <div className="block md:hidden divide-y divide-surface-border">
          {loading ? (
            [...Array(skeletonRows)].map((_, row) => (
              <div key={row} className="p-5 animate-pulse space-y-3 bg-white">
                <div className="flex justify-between items-center">
                  <div className="h-4 bg-slate-200 rounded w-1/4"></div>
                  <div className="h-4 bg-slate-200 rounded w-1/5"></div>
                </div>
                <div className="h-5 bg-slate-200 rounded w-3/4"></div>
                <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                <div className="flex gap-2 justify-end pt-2">
                  <div className="h-8 bg-slate-200 rounded w-16"></div>
                  <div className="h-8 bg-slate-200 rounded w-16"></div>
                </div>
              </div>
            ))
          ) : isEmpty ? (
            <EmptyState icon={emptyIcon} title={emptyTitle} description={emptyDescription} className="py-16 border-none bg-transparent" />
          ) : (
            items.map((item, index) => (
              <div key={item.id || index} className="p-4 bg-white hover:bg-surface-soft transition-colors duration-150">
                {mobileCardRenderer(item, index)}
              </div>
            ))
          )}
        </div>
      )}

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
