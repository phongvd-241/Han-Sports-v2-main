import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { userApi } from "../../api/userApi";
import AdminMetricCard from "../../components/admin/AdminMetricCard";
import AdminPageHeader from "../../components/admin/AdminPageHeader";
import AdminToolbar from "../../components/admin/AdminToolbar";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import DataTable from "../../components/admin/DataTable";
import FormModal from "../../components/admin/FormModal";
import IconButton from "../../components/admin/IconButton";
import { useAuthStore } from "../../store/useAuthStore";
import { formatDate, API_BASE_URL } from "../../utils/constants";

const EMPTY_FORM = { fullName: "", email: "", password: "", phone: "", address: "", roleName: "USER" };
const USER_COLUMNS = [
  { key: "index", label: "#", className: "px-4 py-3 text-left" },
  { key: "user", label: "Người dùng", className: "px-4 py-3 text-left" },
  { key: "email", label: "Email", className: "px-4 py-3 text-left" },
  { key: "phone", label: "Số điện thoại", className: "px-4 py-3 text-left" },
  { key: "createdAt", label: "Ngày đăng ký", className: "px-4 py-3 text-left" },
  { key: "status", label: "Trạng thái", className: "px-4 py-3 text-center" },
  { key: "role", label: "Vai trò", className: "px-4 py-3 text-center" },
  { key: "actions", label: "Thao tác", className: "px-4 py-3 text-center" },
];

export default function UsersPage() {
  const { user: currentUser } = useAuthStore();
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

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, size: 10 };
      if (search) params.filter = `fullName~'${search}',email~'${search}'`;
      const res = await userApi.getAll(params);
      const data = res.data?.data;
      setUsers(data?.result || []);
      setTotalPages(data?.meta?.pages || 1);
      setTotalElements(data?.meta?.total || 0);
    } catch (err) {
      console.error(err);
      toast.error("Không thể tải danh sách người dùng.");
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const openAdd = () => {
    setForm(EMPTY_FORM);
    setSelected(null);
    setModal("add");
  };

  const openEdit = (item) => {
    setSelected(item);
    setForm({
      fullName: item.fullName || "",
      email: item.email || "",
      password: "",
      phone: item.phone || "",
      address: item.address || "",
      roleName: item.role?.name || "USER",
    });
    setModal("edit");
  };

  const openDelete = (item) => {
    if (item.id === currentUser?.id) {
      toast.error("Không thể xóa tài khoản đang đăng nhập.");
      return;
    }
    setSelected(item);
    setModal("delete");
  };

  const openToggleLock = (item) => {
    if (item.id === currentUser?.id && !item.locked) {
      toast.error("Không thể khóa tài khoản đang đăng nhập.");
      return;
    }
    setSelected(item);
    setModal(item.locked ? "unlock" : "lock");
  };

  const closeModal = () => {
    setModal(null);
    setSelected(null);
    setForm(EMPTY_FORM);
  };

  const handleReset = () => {
    if (!selected) return;
    setForm({
      fullName: selected.fullName || "",
      email: selected.email || "",
      password: "",
      phone: selected.phone || "",
      address: selected.address || "",
      roleName: selected.role?.name || "USER",
    });
    toast.success("Đã khôi phục dữ liệu ban đầu.");
  };

  const handleSave = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form };
      if (modal === "add") {
        await userApi.create(payload);
        toast.success("Thêm người dùng thành công.");
      } else {
        delete payload.password;
        await userApi.update({ ...payload, id: selected.id });
        toast.success("Cập nhật người dùng thành công.");
      }
      closeModal();
      fetchUsers();
    } catch (err) {
      const msg = err.response?.data?.message;
      toast.error(Array.isArray(msg) ? msg[0] : msg || "Lưu dữ liệu thất bại.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selected || selected.id === currentUser?.id) return;
    setSaving(true);
    try {
      await userApi.remove(selected.id);
      toast.success("Đã xóa người dùng.");
      closeModal();
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || "Xóa người dùng thất bại.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleLock = async () => {
    if (!selected || (selected.id === currentUser?.id && !selected.locked)) return;
    setSaving(true);
    try {
      const nextLocked = !selected.locked;
      await userApi.updateLockStatus(selected.id, nextLocked);
      toast.success(nextLocked ? "Đã khóa người dùng." : "Đã mở khóa người dùng.");
      closeModal();
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || "Cập nhật trạng thái người dùng thất bại.");
    } finally {
      setSaving(false);
    }
  };

  const roleBadge = (role) => {
    if (role?.name === "ADMIN") return <span className="badge-blue">Admin</span>;
    return <span className="badge-green">Khách hàng</span>;
  };

  const lockBadge = (locked) => {
    if (locked) return <span className="badge-danger">Đã khóa</span>;
    return <span className="badge-green">Đang hoạt động</span>;
  };

  const avatar = (name) =>
    (name || "U").split(" ").map((word) => word[0]).join("").substring(0, 2).toUpperCase();

  const renderUserAvatar = (item, sizeClass = "w-9 h-9 rounded-lg", textClass = "text-xs") => {
    if (item.avatar) {
      return (
        <img
          src={`${API_BASE_URL}/api/v1/files?fileName=${encodeURIComponent(item.avatar)}&folder=avatar`}
          alt="Avatar"
          className={`${sizeClass} object-cover flex-shrink-0`}
        />
      );
    }
    return (
      <div className={`${sizeClass} bg-brand-blue text-white flex items-center justify-center ${textClass} font-bold flex-shrink-0`}>
        {avatar(item.fullName)}
      </div>
    );
  };

  const adminOnPage = users.filter((item) => item.role?.name === "ADMIN").length;
  const userOnPage = users.filter((item) => item.role?.name !== "ADMIN").length;
  const lockedOnPage = users.filter((item) => item.locked).length;

  const renderUserCard = (item, index) => {
    const isSelf = item.id === currentUser?.id;
    return (
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          {renderUserAvatar(item, "w-10 h-10 rounded-xl", "text-sm")}
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-text-primary text-sm truncate">
                {item.fullName || "-"}
              </span>
              <span className="text-[11px] text-text-muted font-semibold">
                #{page * 10 + index + 1}
              </span>
            </div>
            {isSelf && (
              <p className="text-[10px] text-brand-blue font-bold mt-0.5">Tài khoản hiện tại</p>
            )}
          </div>
        </div>

        {/* Hàng 2: Chi tiết email, điện thoại, ngày đăng ký */}
        <div className="flex flex-col gap-1 text-xs text-text-secondary bg-surface-soft p-2.5 rounded-lg border border-surface-border">
          <div className="flex justify-between items-center">
            <span className="text-text-muted">Email:</span>
            <span className="font-medium truncate max-w-[200px]">{item.email}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-text-muted">Số điện thoại:</span>
            <span className="font-medium">{item.phone || "-"}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-text-muted">Ngày đăng ký:</span>
            <span className="text-text-muted text-[10px]">{formatDate(item.createdAt)}</span>
          </div>
        </div>

        {/* Hàng 3: Vai trò + Action buttons */}
        <div className="flex items-center justify-between pt-2 border-t border-surface-border border-dashed mt-1">
          <div className="flex flex-wrap gap-2">
            {roleBadge(item.role)}
            {lockBadge(item.locked)}
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <button
              onClick={() => openEdit(item)}
              className="flex items-center gap-1 py-1.5 px-3 bg-brand-blue-light text-brand-blue rounded-xl text-xs font-bold hover:bg-brand-blue hover:text-white transition-colors"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>edit</span>
              Sửa
            </button>
            <button
              disabled={isSelf && !item.locked}
              onClick={() => openToggleLock(item)}
              className="flex items-center gap-1 py-1.5 px-3 bg-amber-50 text-amber-700 rounded-xl text-xs font-bold hover:bg-amber-500 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                {item.locked ? "lock_open" : "lock"}
              </span>
              {item.locked ? "Mở khóa" : "Khóa"}
            </button>
            <button
              disabled={isSelf}
              onClick={() => openDelete(item)}
              className="flex items-center gap-1 py-1.5 px-3 bg-red-50 text-danger rounded-xl text-xs font-bold hover:bg-danger hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>delete</span>
              Xóa
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title="Người dùng"
        description={`${totalElements} tài khoản trong hệ thống`}
        actions={(
          <button type="button" onClick={openAdd} className="btn-primary py-2.5 px-4">
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>person_add</span>
            Thêm người dùng
          </button>
        )}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <AdminMetricCard icon="group" label="Tổng tài khoản" value={totalElements.toLocaleString("vi-VN")} tone="blue" />
        <AdminMetricCard icon="admin_panel_settings" label="Admin trang này" value={adminOnPage.toLocaleString("vi-VN")} tone="teal" />
        <AdminMetricCard icon="person" label="Khách hàng trang này" value={userOnPage.toLocaleString("vi-VN")} tone="green" />
        <AdminMetricCard icon="lock" label="Đã khóa trang này" value={lockedOnPage.toLocaleString("vi-VN")} tone="amber" />
      </div>

      <AdminToolbar>
        <div className="relative w-full max-w-sm">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-text-muted" style={{ fontSize: 18 }}>search</span>
          <input
            type="text"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(0);
            }}
            placeholder="Tìm theo tên, email..."
            className="input-field pl-10 py-2 text-sm"
          />
        </div>
      </AdminToolbar>

      <DataTable
        columns={USER_COLUMNS}
        loading={loading}
        isEmpty={users.length === 0}
        emptyIcon="group"
        emptyTitle="Không có người dùng nào"
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        mobileCardRenderer={renderUserCard}
        items={users}
      >
        {users.map((item, index) => {
          const isSelf = item.id === currentUser?.id;
          return (
            <tr key={item.id} className="hover:bg-surface-soft transition-colors">
              <td className="px-4 py-3 text-text-muted text-xs">{page * 10 + index + 1}</td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  {renderUserAvatar(item, "w-9 h-9 rounded-lg", "text-xs")}
                  <div className="min-w-0">
                    <p className="font-semibold text-text-primary truncate">{item.fullName || "-"}</p>
                    {isSelf && <p className="text-[11px] text-brand-blue font-semibold">Tài khoản hiện tại</p>}
                  </div>
                </div>
              </td>
              <td className="px-4 py-3 text-text-secondary">{item.email}</td>
              <td className="px-4 py-3 text-text-secondary">{item.phone || "-"}</td>
              <td className="px-4 py-3 text-text-muted text-xs">{formatDate(item.createdAt)}</td>
              <td className="px-4 py-3 text-center">{lockBadge(item.locked)}</td>
              <td className="px-4 py-3 text-center">{roleBadge(item.role)}</td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-center gap-2">
                  <IconButton icon="edit" label="Sửa người dùng" variant="primary" onClick={() => openEdit(item)} />
                  <IconButton
                    icon={item.locked ? "lock_open" : "lock"}
                    label={
                      isSelf && !item.locked
                        ? "Không thể khóa tài khoản hiện tại"
                        : item.locked
                          ? "Mở khóa người dùng"
                          : "Khóa người dùng"
                    }
                    variant="default"
                    disabled={isSelf && !item.locked}
                    onClick={() => openToggleLock(item)}
                  />
                  <IconButton
                    icon="delete"
                    label={isSelf ? "Không thể xóa tài khoản hiện tại" : "Xóa người dùng"}
                    variant="danger"
                    disabled={isSelf}
                    onClick={() => openDelete(item)}
                  />
                </div>
              </td>
            </tr>
          );
        })}
      </DataTable>

      {(modal === "add" || modal === "edit") && (
        <UserFormModal
          modal={modal}
          form={form}
          setForm={setForm}
          saving={saving}
          onSubmit={handleSave}
          onReset={handleReset}
          onClose={closeModal}
        />
      )}

      {modal === "delete" && selected && (
        <ConfirmDialog
          title="Xác nhận xóa người dùng?"
          description={`Bạn sắp xóa tài khoản ${selected.fullName || selected.email} (${selected.email}).`}
          icon="person_remove"
          confirmLabel="Xóa tài khoản"
          loading={saving}
          onCancel={closeModal}
          onConfirm={handleDelete}
        />
      )}

      {(modal === "lock" || modal === "unlock") && selected && (
        <ConfirmDialog
          title={modal === "lock" ? "Khóa người dùng?" : "Mở khóa người dùng?"}
          description={
            modal === "lock"
              ? `Tài khoản ${selected.fullName || selected.email} sẽ không thể đăng nhập, refresh token hoặc dùng API bằng token hiện tại.`
              : `Tài khoản ${selected.fullName || selected.email} sẽ được phép đăng nhập lại.`
          }
          icon={modal === "lock" ? "lock" : "lock_open"}
          confirmLabel={modal === "lock" ? "Khóa tài khoản" : "Mở khóa"}
          variant={modal === "lock" ? "danger" : "primary"}
          loading={saving}
          onCancel={closeModal}
          onConfirm={handleToggleLock}
        />
      )}
    </div>
  );
}

function UserFormModal({ modal, form, setForm, saving, onSubmit, onReset, onClose }) {
  const fields = [
    { name: "fullName", label: "Họ và tên", type: "text", placeholder: "Nguyễn Văn A", required: true },
    { name: "email", label: "Email", type: "email", placeholder: "example@email.com", required: true },
    { name: "password", label: modal === "add" ? "Mật khẩu" : "Mật khẩu mới", type: "password", placeholder: "Để trống nếu không đổi", required: modal === "add" },
    { name: "phone", label: "Số điện thoại", type: "tel", placeholder: "090 123 4567", required: false },
    { name: "address", label: "Địa chỉ", type: "text", placeholder: "Địa chỉ giao hàng...", required: false },
  ];

  return (
    <FormModal
      title={modal === "add" ? "Thêm người dùng" : "Chỉnh sửa người dùng"}
      onClose={onClose}
      busy={saving}
      maxWidth="max-w-lg"
    >
        <form onSubmit={onSubmit} className="p-6">
          <div className="flex flex-col gap-4">
            {fields.map(({ name, label, type, placeholder, required }) => {
              if (modal === "edit" && name === "password") return null;
              return (
                <div key={name}>
                  <label className="block text-sm font-semibold text-text-secondary mb-1.5">
                    {label} {required && <span className="text-danger">*</span>}
                  </label>
                  <input
                    type={type}
                    name={name}
                    required={required}
                    value={form[name]}
                    onChange={(event) => setForm({ ...form, [name]: event.target.value })}
                    placeholder={placeholder}
                    className="input-field"
                  />
                </div>
              );
            })}

            <div>
              <label className="block text-sm font-semibold text-text-secondary mb-1.5">Vai trò</label>
              <select value={form.roleName} onChange={(event) => setForm({ ...form, roleName: event.target.value })} className="input-field">
                <option value="USER">Khách hàng</option>
                <option value="ADMIN">Quản trị viên</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3 justify-end pt-5 mt-2 border-t border-surface-border">
            {modal === "edit" && (
              <button type="button" onClick={onReset} className="btn-ghost px-4 py-2.5 text-text-muted hover:text-brand-blue flex items-center gap-1">
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>restart_alt</span>
                Khôi phục
              </button>
            )}
            <div className="flex-1" />
            <button type="button" onClick={onClose} className="btn-ghost px-5 py-2.5 border border-surface-border rounded-xl">Hủy</button>
            <button type="submit" disabled={saving} className="btn-primary py-2.5 px-5 disabled:opacity-60">
              {saving ? (
                <>
                  <span className="material-symbols-outlined animate-spin" style={{ fontSize: 16 }}>progress_activity</span>
                  Đang lưu...
                </>
              ) : modal === "add" ? "Thêm người dùng" : "Lưu thay đổi"}
            </button>
          </div>
        </form>
    </FormModal>
  );
}
