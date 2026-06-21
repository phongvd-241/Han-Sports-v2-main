import { Link } from "react-router-dom";

export default function AdminTopbar({ currentPageLabel, onMenuClick }) {
  return (
    <header className="sticky top-0 z-30 bg-white border-b border-surface-border px-4 md:px-6 lg:px-8 py-4 flex items-center justify-between">
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          className="lg:hidden p-2 rounded-lg text-text-secondary hover:bg-surface-muted hover:text-brand-blue transition-all"
          onClick={onMenuClick}
          aria-label="Mở menu quản trị"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 22 }}>menu</span>
        </button>
        <div className="min-w-0">
          <h1 className="text-lg md:text-xl font-bold text-text-primary truncate">{currentPageLabel || "Admin"}</h1>
          <p className="text-xs text-text-muted mt-0.5 hidden sm:block">
            {new Date().toLocaleDateString("vi-VN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
      </div>
      <Link to="/" className="flex items-center gap-1.5 text-sm text-brand-blue font-semibold hover:underline">
        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>open_in_new</span>
        <span className="hidden sm:inline">Xem trang khách</span>
      </Link>
    </header>
  );
}
