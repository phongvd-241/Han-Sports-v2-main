import { useId, useEffect, useRef } from "react";
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
  const modalRef = useRef(null);

  // Restore Focus & Auto Focus
  useEffect(() => {
    const previousActiveElement = document.activeElement;
    
    // Auto Focus: Di chuyển focus vào phần tử tương tác đầu tiên trong modal khi mở
    const timer = setTimeout(() => {
      if (modalRef.current) {
        const focusableSelector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
        const focusableElements = Array.from(modalRef.current.querySelectorAll(focusableSelector)).filter(
          (el) => !el.disabled && el.offsetParent !== null
        );
        if (focusableElements.length > 0) {
          focusableElements[0].focus();
        } else {
          modalRef.current.focus();
        }
      }
    }, 100);

    return () => {
      clearTimeout(timer);
      if (previousActiveElement && typeof previousActiveElement.focus === "function") {
        previousActiveElement.focus();
      }
    };
  }, []);

  // ESC & Focus Trap keydown handler global (native DOM listeners)
  useEffect(() => {
    const handleGlobalKeyDown = (event) => {
      if (event.key === "Escape" && !busy) {
        onClose();
        return;
      }

      if (event.key === "Tab" && modalRef.current) {
        const focusableSelector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
        const focusableElements = Array.from(modalRef.current.querySelectorAll(focusableSelector)).filter(
          (el) => !el.disabled && el.offsetParent !== null
        );

        if (focusableElements.length === 0) {
          event.preventDefault();
          return;
        }

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (event.shiftKey) {
          // Shift + Tab (đi lùi)
          if (document.activeElement === firstElement) {
            lastElement.focus();
            event.preventDefault();
          }
        } else {
          // Tab (đi tiến)
          if (document.activeElement === lastElement) {
            firstElement.focus();
            event.preventDefault();
          }
        }
      }
    };

    document.addEventListener("keydown", handleGlobalKeyDown, true); // Use capture phase to intercept before other handlers
    return () => {
      document.removeEventListener("keydown", handleGlobalKeyDown, true);
    };
  }, [onClose, busy]);

  const handleBackdropClick = (event) => {
    if (event.target === event.currentTarget && !busy) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-fade-in focus:outline-none"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onClick={handleBackdropClick}
      tabIndex={-1}
      ref={modalRef}
    >
      <div className={`bg-white rounded-xl shadow-modal w-full ${maxWidth} max-h-[90vh] overflow-y-auto animate-fade-up focus:outline-none`} tabIndex={-1}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border sticky top-0 bg-white z-10">
          <h3 id={titleId} className="text-lg font-bold text-text-primary">{title}</h3>
          <IconButton icon="close" label="Đóng" onClick={onClose} disabled={busy} />
        </div>
        <div>{children}</div>
        {footer && (
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-surface-border sticky bottom-0 bg-white z-10 rounded-b-xl">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
