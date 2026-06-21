import { SidebarContent } from "./AdminSidebar";

export default function AdminMobileDrawer({ isOpen, onClose, user, onLogout, currentPath }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="Đóng menu quản trị"
        onClick={onClose}
      />
      <div className="relative w-72 max-w-[85vw] h-full bg-admin-bg text-white shadow-modal animate-slide-in">
        <SidebarContent user={user} onLogout={onLogout} currentPath={currentPath} />
      </div>
    </div>
  );
}
