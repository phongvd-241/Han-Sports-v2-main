import { useId } from "react";
import IconButton from "./IconButton";

export default function FormModal({
  title,
  children,
  footer,
  onClose,
  busy = false,
  maxWidth = "max-w-lg",
}) {
  const titleId = useId();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onKeyDown={(event) => {
        if (event.key === "Escape" && !busy) onClose();
      }}
    >
      <div className={`bg-white rounded-xl shadow-modal w-full ${maxWidth} max-h-[90vh] overflow-y-auto animate-fade-up`}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-surface-border sticky top-0 bg-white z-10">
          <h3 id={titleId} className="text-lg font-bold text-text-primary">{title}</h3>
          <IconButton icon="close" label="Đóng" onClick={onClose} disabled={busy} />
        </div>
        <div>{children}</div>
        {footer}
      </div>
    </div>
  );
}
