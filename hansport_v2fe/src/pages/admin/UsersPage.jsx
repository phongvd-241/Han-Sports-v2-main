import { useEffect, useState } from "react";
import { userApi } from "../../api/userApi";
import { formatDate } from "../../utils/constants";

const EMPTY_FORM = { fullName: "", email: "", password: "", phone: "", address: "", roleName: "USER" };

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [search, setSearch] = useState("");

  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "success") => {
    const message = Array.isArray(msg) ? msg[0] : msg;
    setToast({ msg: message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = { page, size: 10 };
      if (search) params.filter = `fullName~'${search}',email~'${search}'`;
      const res = await userApi.getAll(params);
      const data = res.data?.data;
      setUsers(data?.result || []);
      setTotalPages(data?.meta?.pages || 1);
      setTotalElements(data?.meta?.total || 0);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, [page, search]);

  const openAdd = () => { setForm(EMPTY_FORM); setSelected(null); setModal("add"); };
  const openEdit = (u) => {
    setSelected(u);
    setForm({ 
        fullName: u.fullName || "", 
        email: u.email || "", 
        password: "", 
        phone: u.phone || "", 
        address: u.address || "",
        roleName: u.role?.name || "USER"
    });
    setModal("edit");
  };
  const openDelete = (u) => { setSelected(u); setModal("delete"); };
  const closeModal = () => { setModal(null); setSelected(null); };

  const handleReset = () => {
    if (!selected) return;
    setForm({ 
        fullName: selected.fullName || "", 
        email: selected.email || "", 
        password: "", 
        phone: selected.phone || "", 
        address: selected.address || "",
        roleName: selected.role?.name || "USER"
    });
    showToast("Đã khôi phục dữ liệu ban đầu");
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form };
      if (modal === "add") {
        await userApi.create(payload);
        showToast("Thêm người dùng thành công!");
      } else {
        delete payload.password; // Không hỗ trợ đổi pass ở API này
        await userApi.update({ ...payload, id: selected.id });
        showToast("Cập nhật người dùng thành công!");
      }
      closeModal();
      fetchUsers();
    } catch (err) {
      showToast(err.response?.data?.message || "Lỗi lưu dữ liệu!", "error");
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      await userApi.remove(selected.id);
      showToast("Đã xóa người dùng!");
      closeModal();
      fetchUsers();
    } catch { showToast("Xóa người dùng thất bại!", "error"); }
    finally { setSaving(false); }
  };

  const getRoleBadge = (role) => {
    if (role?.name === "ADMIN") return <span className="badge-blue">Admin</span>;
    return <span className="badge-green">Khách hàng</span>;
  };

  const getAvatar = (name) => {
    const initials = (name || "U").split(" ").map((w) => w[0]).join("").substring(0, 2).toUpperCase();
    return initials;
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl shadow-modal text-sm font-semibold flex items-center gap-2 animate-fade-up ${toast.type === "success" ? "bg-brand-green text-white" : "bg-danger text-white"}`}>
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{toast.type === "success" ? "check_circle" : "error"}</span>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-text-muted text-sm">{totalElements} người dùng</p>
        <button onClick={openAdd} className="btn-primary">
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>person_add</span>
          Thêm người dùng
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-text-muted" style={{ fontSize: 18 }}>search</span>
        <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          placeholder="Tìm theo tên, email..." className="input-field pl-10 py-2 text-sm" />
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface-muted text-text-muted text-xs uppercase tracking-wider">
                <th className="px-4 py-3 text-left">#</th>
                <th className="px-4 py-3 text-left">Người dùng</th>
                <th className="px-4 py-3 text-left">Email</th>
                <th className="px-4 py-3 text-left">Số điện thoại</th>
                <th className="px-4 py-3 text-left">Ngày đăng ký</th>
                <th className="px-4 py-3 text-center">Vai trò</th>
                <th className="px-4 py-3 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {loading
                ? [...Array(6)].map((_, i) => (
                    <tr key={i}>{[...Array(7)].map((_, j) => <td key={j} className="px-4 py-3"><div className="skeleton h-7 rounded" /></td>)}</tr>
                  ))
                : users.length === 0
                ? (
                  <tr><td colSpan={7} className="px-4 py-16 text-center text-text-muted">
                    <span className="material-symbols-outlined" style={{ fontSize: 48 }}>group</span>
                    <p className="mt-2 font-semibold">Không có người dùng nào</p>
                  </td></tr>
                )
                : users.map((u, i) => (
                  <tr key={u.id} className="hover:bg-surface-soft transition-colors">
                    <td className="px-4 py-3 text-text-muted text-xs">{page * 10 + i + 1}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                          style={{ background: "linear-gradient(135deg, #16a34a, #1d4ed8)" }}>
                          {getAvatar(u.fullName)}
                        </div>
                        <p className="font-semibold text-text-primary">{u.fullName || "—"}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-text-secondary">{u.email}</td>
                    <td className="px-4 py-3 text-text-secondary">{u.phone || "—"}</td>
                    <td className="px-4 py-3 text-text-muted text-xs">{formatDate(u.createdAt)}</td>
                    <td className="px-4 py-3 text-center">{getRoleBadge(u.role)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => openEdit(u)} className="p-1.5 rounded-lg text-brand-blue hover:bg-brand-blue-light transition-all" title="Sửa">
                          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>edit</span>
                        </button>
                        <button onClick={() => openDelete(u)} className="p-1.5 rounded-lg text-danger hover:bg-red-50 transition-all" title="Xóa">
                          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="px-4 py-4 border-t border-surface-border flex items-center justify-between">
            <p className="text-xs text-text-muted">Trang {page + 1} / {totalPages}</p>
            <div className="flex gap-2">
              <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}
                className="px-3 py-1.5 rounded-lg border border-surface-border text-xs font-semibold hover:border-brand-blue disabled:opacity-40 transition-all">← Trước</button>
              <button onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
                className="px-3 py-1.5 rounded-lg border border-surface-border text-xs font-semibold hover:border-brand-blue disabled:opacity-40 transition-all">Sau →</button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Add/Edit */}
      {(modal === "add" || modal === "edit") && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-modal w-full max-w-lg animate-fade-up">
            <div className="flex items-center justify-between px-6 py-5 border-b border-surface-border">
              <h3 className="text-lg font-bold text-text-primary">
                {modal === "add" ? "Thêm người dùng" : "Chỉnh sửa người dùng"}
              </h3>
              <button onClick={closeModal} className="p-2 rounded-lg hover:bg-surface-muted text-text-muted">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6">
              <div className="flex flex-col gap-4">
                {[
                  { name: "fullName", label: "Họ và tên", type: "text", placeholder: "Nguyễn Văn A", required: true },
                  { name: "email", label: "Email", type: "email", placeholder: "example@email.com", required: true },
                  { name: "password", label: modal === "add" ? "Mật khẩu" : "Mật khẩu mới (để trống nếu không đổi)", type: "password", placeholder: "••••••••", required: modal === "add" },
                  { name: "phone", label: "Số điện thoại", type: "tel", placeholder: "090 123 4567", required: false },
                  { name: "address", label: "Địa chỉ", type: "text", placeholder: "Địa chỉ...", required: false },
                ].map(({ name, label, type, placeholder, required }) => (
                  <div key={name}>
                    <label className="block text-sm font-semibold text-text-secondary mb-1.5">
                      {label} {required && <span className="text-danger">*</span>}
                    </label>
                    <input type={type} name={name} required={required} value={form[name]}
                      onChange={(e) => setForm({ ...form, [name]: e.target.value })}
                      placeholder={placeholder} className="input-field" />
                  </div>
                ))}
                
                {/* Role Selection */}
                <div>
                  <label className="block text-sm font-semibold text-text-secondary mb-1.5">Vai trò</label>
                  <select 
                    value={form.roleName} 
                    onChange={(e) => setForm({ ...form, roleName: e.target.value })}
                    className="input-field"
                  >
                    <option value="USER">Khách hàng</option>
                    <option value="ADMIN">Quản trị viên (Admin)</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 justify-end pt-5 mt-2 border-t border-surface-border">
                {modal === "edit" && (
                  <button type="button" onClick={handleReset} className="btn-ghost px-4 py-2.5 text-text-muted hover:text-brand-blue flex items-center gap-1">
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>restart_alt</span>
                    Khôi phục
                  </button>
                )}
                <div className="flex-1" />
                <button type="button" onClick={closeModal} className="btn-ghost px-5 py-2.5 border border-surface-border rounded-xl">Hủy</button>
                <button type="submit" disabled={saving} className="btn-primary py-2.5 px-5 disabled:opacity-60">
                  {saving ? <><span className="material-symbols-outlined animate-spin" style={{ fontSize: 16 }}>progress_activity</span> Đang lưu...</> : modal === "add" ? "Thêm người dùng" : "Lưu thay đổi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Delete */}
      {modal === "delete" && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-modal w-full max-w-md p-8 text-center animate-fade-up">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-danger" style={{ fontSize: 32 }}>person_remove</span>
            </div>
            <h3 className="text-lg font-bold mb-2">Xác nhận xóa người dùng?</h3>
            <p className="text-text-muted text-sm mb-6">
              Bạn sắp xóa tài khoản <strong>{selected.fullName}</strong> ({selected.email}).
            </p>
            <div className="flex gap-3">
              <button onClick={closeModal} className="flex-1 btn-ghost py-2.5 border border-surface-border rounded-xl">Hủy</button>
              <button onClick={handleDelete} disabled={saving}
                className="flex-1 bg-danger text-white py-2.5 rounded-xl font-semibold hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2">
                {saving && <span className="material-symbols-outlined animate-spin" style={{ fontSize: 16 }}>progress_activity</span>}
                Xóa tài khoản
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}