import { useId } from "react";

const CONFIRM_CLASS = {
  danger: "bg-danger text-white hover:opacity-90",
  primary: "bg-brand-blue text-white hover:opacity-90",
};

export default function ConfirmDialog({
  title,
  description,
  icon = "warning",
  confirmLabel = "Xác nhận",
  cancelLabel = "Hủy",
  variant = "danger",
  loading = false,
  onCancel,
  onConfirm,
}) {
  const titleId = useId();
  const descriptionId = useId();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onKeyDown={(event) => {
        if (event.key === "Escape" && !loading) onCancel();
      }}
    >
      <div className="bg-white rounded-xl shadow-modal w-full max-w-md p-8 text-center animate-fade-up">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
          <span className="material-symbols-outlined text-danger" style={{ fontSize: 32 }}>{icon}</span>
        </div>
        <h3 id={titleId} className="text-lg font-bold text-text-primary mb-2">{title}</h3>
        {description && <p id={descriptionId} className="text-text-muted text-sm mb-6">{description}</p>}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="flex-1 btn-ghost py-2.5 border border-surface-border rounded-xl disabled:opacity-60"
            autoFocus
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 py-2.5 rounded-xl font-semibold transition-all disabled:opacity-60 flex items-center justify-center gap-2 ${CONFIRM_CLASS[variant] || CONFIRM_CLASS.danger}`}
          >
            {loading && <span className="material-symbols-outlined animate-spin" style={{ fontSize: 16 }}>progress_activity</span>}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
