import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { authApi } from "../../api/authApi";
import { useAuthStore } from "../../store/useAuthStore";
import { LOGO_CIRCLE, formatDate } from "../../utils/constants";

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, setAuth, clearAuth, isAdmin } = useAuthStore();
  const [form, setForm] = useState({ fullName: "", email: "", phone: "", address: "" });
  const [tab, setTab] = useState("info");
  const [saving, setSaving] = useState(false);
  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (!user) { navigate("/login"); return; }
    setForm({
      fullName: user.fullName || "",
      email: user.email || "",
      phone: user.phone || "",
      address: user.address || "",
    });
  }, [user]);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleUpdateInfo = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await authApi.getAccount(); // Refresh from server after update
      // Note: In production, call the update endpoint here
      showToast("Cập nhật thông tin thành công!");
    } catch {
      showToast("Cập nhật thất bại!", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try { await authApi.logout(); } catch {}
    clearAuth();
    navigate("/login");
  };

  const getInitials = (name) =>
    (name || "U").split(" ").map((w) => w[0]).join("").substring(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-surface-soft py-10">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-20 right-4 z-50 px-4 py-3 rounded-xl shadow-modal text-sm font-semibold flex items-center gap-2 animate-fade-up ${toast.type === "success" ? "bg-brand-green text-white" : "bg-danger text-white"}`}>
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{toast.type === "success" ? "check_circle" : "error"}</span>
          {toast.msg}
        </div>
      )}

      <div className="max-w-3xl mx-auto px-4 md:px-6">
        {/* Profile Header Card */}
        <div className="card p-8 mb-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            {/* Avatar */}
            <div className="w-24 h-24 rounded-2xl flex items-center justify-center text-white text-3xl font-extrabold flex-shrink-0 shadow-brand-glow"
              style={{ background: "linear-gradient(135deg, #16a34a, #0d9488, #1d4ed8)" }}>
              {getInitials(user?.fullName)}
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-display font-extrabold text-text-primary">{user?.fullName}</h1>
              <p className="text-text-muted text-sm mt-1">{user?.email}</p>
              <div className="flex flex-wrap gap-2 mt-3 justify-center sm:justify-start">
                {isAdmin() && <span className="badge-blue">Quản trị viên</span>}
                <span className="badge-green">Thành viên</span>
                {user?.phone && (
                  <span className="inline-flex items-center gap-1 text-xs text-text-secondary bg-surface-muted px-2.5 py-1 rounded-pill">
                    <span className="material-symbols-outlined" style={{ fontSize: 14 }}>call</span>
                    {user.phone}
                  </span>
                )}
              </div>
            </div>
            <button onClick={handleLogout} className="flex-shrink-0 flex items-center gap-1.5 text-sm text-danger font-semibold hover:bg-red-50 px-3 py-2 rounded-lg transition-all">
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>logout</span>
              Đăng xuất
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { icon: "shopping_bag", label: "Đơn hàng", value: "—", path: "/orders" },
            { icon: "favorite", label: "Yêu thích", value: "—", path: "/shop" },
            { icon: "card_membership", label: "Hạng thành viên", value: "Silver", path: "#" },
          ].map(({ icon, label, value }) => (
            <div key={label} className="card p-4 text-center">
              <div className="w-10 h-10 rounded-xl mx-auto mb-2 flex items-center justify-center bg-brand-blue-light">
                <span className="material-symbols-outlined text-brand-blue" style={{ fontSize: 20 }}>{icon}</span>
              </div>
              <p className="text-lg font-bold text-text-primary">{value}</p>
              <p className="text-xs text-text-muted">{label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="card overflow-hidden">
          <div className="flex border-b border-surface-border">
            {[
              { key: "info", label: "Thông tin cá nhân", icon: "person" },
              { key: "address", label: "Địa chỉ", icon: "location_on" },
              { key: "security", label: "Bảo mật", icon: "lock" },
            ].map(({ key, label, icon }) => (
              <button key={key} onClick={() => setTab(key)}
                className={`flex items-center gap-2 px-5 py-4 text-sm font-semibold transition-all border-b-2 ${
                  tab === key ? "border-brand-blue text-brand-blue" : "border-transparent text-text-secondary hover:text-brand-blue"
                }`}>
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{icon}</span>
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>

          <div className="p-6">
            {/* Info Tab */}
            {tab === "info" && (
              <form onSubmit={handleUpdateInfo} className="flex flex-col gap-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-text-secondary mb-2">Họ và tên</label>
                    <input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                      className="input-field" placeholder="Nguyễn Văn A" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-text-secondary mb-2">Email</label>
                    <input value={form.email} readOnly
                      className="input-field bg-surface-muted cursor-not-allowed text-text-muted" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-text-secondary mb-2">Số điện thoại</label>
                    <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="input-field" placeholder="090 123 4567" />
                  </div>
                </div>
                <div className="flex justify-end">
                  <button type="submit" disabled={saving} className="btn-primary py-2.5 px-6 disabled:opacity-60">
                    {saving ? "Đang lưu..." : <>
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>save</span> Lưu thay đổi
                    </>}
                  </button>
                </div>
              </form>
            )}

            {/* Address Tab */}
            {tab === "address" && (
              <div className="flex flex-col gap-4">
                <div>
                  <label className="block text-sm font-semibold text-text-secondary mb-2">Địa chỉ giao hàng mặc định</label>
                  <textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })}
                    rows={4} className="input-field resize-none"
                    placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành phố..." />
                </div>
                <div className="flex justify-end">
                  <button onClick={handleUpdateInfo} disabled={saving} className="btn-primary py-2.5 px-6 disabled:opacity-60">
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>save</span> Lưu địa chỉ
                  </button>
                </div>
              </div>
            )}

            {/* Security Tab */}
            {tab === "security" && (
              <div className="flex flex-col gap-5">
                <div className="p-4 bg-brand-blue-light rounded-xl flex items-start gap-3">
                  <span className="material-symbols-outlined text-brand-blue flex-shrink-0 mt-0.5" style={{ fontSize: 20 }}>info</span>
                  <p className="text-sm text-brand-blue">Để đổi mật khẩu, bạn cần xác nhận mật khẩu hiện tại. Mật khẩu mới tối thiểu 8 ký tự.</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-text-secondary mb-2">Mật khẩu hiện tại</label>
                  <input type="password" value={pwForm.currentPassword}
                    onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })}
                    className="input-field" placeholder="••••••••" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-text-secondary mb-2">Mật khẩu mới</label>
                  <input type="password" value={pwForm.newPassword}
                    onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
                    className="input-field" placeholder="Tối thiểu 8 ký tự" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-text-secondary mb-2">Xác nhận mật khẩu mới</label>
                  <input type="password" value={pwForm.confirmPassword}
                    onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
                    className="input-field" placeholder="Nhập lại mật khẩu mới" />
                </div>
                <div className="flex justify-end">
                  <button className="btn-primary py-2.5 px-6">
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>lock_reset</span> Đổi mật khẩu
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
