export default function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  const goToFirst = () => onPageChange(0);
  const goToLast = () => onPageChange(totalPages - 1);
  const previousPage = () => onPageChange(Math.max(0, page - 1));
  const nextPage = () => onPageChange(Math.min(totalPages - 1, page + 1));

  const getPages = () => {
    const pages = [];
    const delta = 1; // Số trang hiển thị trước và sau trang hiện tại
    const start = Math.max(0, page - delta);
    const end = Math.min(totalPages - 1, page + delta);

    // Luôn bao gồm trang đầu tiên
    pages.push(0);

    if (start > 1) {
      pages.push("ellipsis-1");
    }

    // Các trang ở giữa
    for (let i = Math.max(1, start); i <= Math.min(totalPages - 2, end); i++) {
      pages.push(i);
    }

    if (end < totalPages - 2) {
      pages.push("ellipsis-2");
    }

    // Luôn bao gồm trang cuối cùng
    if (totalPages > 1) {
      pages.push(totalPages - 1);
    }

    return pages;
  };

  return (
    <div className="px-4 py-4 border-t border-surface-border flex flex-col sm:flex-row items-center justify-between gap-3 bg-white">
      <p className="text-xs text-text-muted">Trang {page + 1} / {totalPages}</p>
      <div className="flex items-center gap-1.5 flex-wrap">
        <button
          type="button"
          onClick={goToFirst}
          disabled={page === 0}
          aria-label="Trang đầu tiên"
          className="px-2.5 py-1.5 rounded-lg border border-surface-border text-xs font-semibold hover:border-brand-blue hover:text-brand-blue disabled:opacity-40 disabled:cursor-not-allowed transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand-blue"
        >
          Đầu
        </button>
        <button
          type="button"
          onClick={previousPage}
          disabled={page === 0}
          aria-label="Trang trước"
          className="px-2.5 py-1.5 rounded-lg border border-surface-border text-xs font-semibold hover:border-brand-blue hover:text-brand-blue disabled:opacity-40 disabled:cursor-not-allowed transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand-blue"
        >
          Trước
        </button>

        {getPages().map((p, idx) => {
          if (p === "ellipsis-1" || p === "ellipsis-2") {
            return (
              <span key={`ellipsis-${idx}`} className="px-1 text-xs text-text-muted">
                ...
              </span>
            );
          }
          const isActive = p === page;
          return (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange(p)}
              aria-label={isActive ? `Trang hiện tại, Trang ${p + 1}` : `Đi đến trang ${p + 1}`}
              aria-current={isActive ? "page" : undefined}
              className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-semibold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand-blue ${
                isActive
                  ? "bg-brand-blue text-white shadow-blue-glow border border-brand-blue"
                  : "border border-surface-border text-text-secondary hover:border-brand-blue hover:text-brand-blue"
              }`}
            >
              {p + 1}
            </button>
          );
        })}

        <button
          type="button"
          onClick={nextPage}
          disabled={page >= totalPages - 1}
          aria-label="Trang sau"
          className="px-2.5 py-1.5 rounded-lg border border-surface-border text-xs font-semibold hover:border-brand-blue hover:text-brand-blue disabled:opacity-40 disabled:cursor-not-allowed transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand-blue"
        >
          Sau
        </button>
        <button
          type="button"
          onClick={goToLast}
          disabled={page >= totalPages - 1}
          aria-label="Trang cuối cùng"
          className="px-2.5 py-1.5 rounded-lg border border-surface-border text-xs font-semibold hover:border-brand-blue hover:text-brand-blue disabled:opacity-40 disabled:cursor-not-allowed transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand-blue"
        >
          Cuối
        </button>
      </div>
    </div>
  );
}
