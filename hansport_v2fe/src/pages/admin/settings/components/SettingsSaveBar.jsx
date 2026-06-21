export default function SettingsSaveBar({
  isDirty,
  activeTabDirty,
  saving,
  onRevert,
  onSaveCurrentTab,
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-end gap-2 px-1">
      <button
        type="button"
        onClick={onRevert}
        disabled={!isDirty || saving}
        className="btn-ghost text-text-muted hover:text-brand-blue disabled:opacity-40"
      >
        Khôi phục
      </button>
      <button
        type="button"
        onClick={onSaveCurrentTab}
        disabled={!activeTabDirty || saving}
        className="btn-outline py-2.5 px-4 disabled:opacity-40"
      >
        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>save_as</span>
        Lưu tab hiện tại
      </button>
      <button
        type="submit"
        disabled={!isDirty || saving}
        className="btn-primary py-2.5 px-5 disabled:opacity-50"
      >
        {saving ? (
          <>
            <span className="material-symbols-outlined animate-spin" style={{ fontSize: 18 }}>progress_activity</span>
            Đang lưu...
          </>
        ) : (
          <>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>save</span>
            Lưu toàn bộ
          </>
        )}
      </button>
    </div>
  );
}
