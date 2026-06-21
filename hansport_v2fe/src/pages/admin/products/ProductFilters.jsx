import AdminToolbar from "../../../components/admin/AdminToolbar";

export default function ProductFilters({ search, setSearch, selectedIds, onOpenDeleteBulk, onOpenImport }) {
  return (
    <AdminToolbar>
      <div className="relative w-full max-w-sm">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-text-muted" style={{ fontSize: 18 }}>search</span>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm kiếm sản phẩm..."
          className="input-field pl-10 py-2 text-sm"
        />
      </div>
      <div className="flex items-center gap-2">
        {selectedIds.length > 0 && (
          <button
            type="button"
            onClick={onOpenDeleteBulk}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-semibold text-white bg-danger hover:opacity-90 transition-all duration-200 text-sm"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 17 }}>delete</span>
            Xóa {selectedIds.length} đã chọn
          </button>
        )}
        <button type="button" onClick={onOpenImport} className="btn-outline py-2 px-4 text-sm">
          <span className="material-symbols-outlined" style={{ fontSize: 17 }}>upload_file</span>
          Import Excel/CSV
        </button>
      </div>
    </AdminToolbar>
  );
}
