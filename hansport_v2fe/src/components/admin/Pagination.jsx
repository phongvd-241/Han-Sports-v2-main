export default function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  const previousPage = () => onPageChange(Math.max(0, page - 1));
  const nextPage = () => onPageChange(Math.min(totalPages - 1, page + 1));

  return (
    <div className="px-4 py-4 border-t border-surface-border flex items-center justify-between gap-3">
      <p className="text-xs text-text-muted">Trang {page + 1} / {totalPages}</p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={previousPage}
          disabled={page === 0}
          className="px-3 py-1.5 rounded-lg border border-surface-border text-xs font-semibold hover:border-brand-blue hover:text-brand-blue disabled:opacity-40 transition-all"
        >
          Trước
        </button>
        <button
          type="button"
          onClick={nextPage}
          disabled={page >= totalPages - 1}
          className="px-3 py-1.5 rounded-lg border border-surface-border text-xs font-semibold hover:border-brand-blue hover:text-brand-blue disabled:opacity-40 transition-all"
        >
          Sau
        </button>
      </div>
    </div>
  );
}
