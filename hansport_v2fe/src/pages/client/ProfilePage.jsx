import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { authApi } from "../../api/authApi";
import { orderApi } from "../../api/orderApi";
import { useAuthStore } from "../../store/useAuthStore";
import { formatDate, formatVND, ORDER_STATUS } from "../../utils/constants";

const EMPTY_PROFILE = { fullName: "", email: "", phone: "", address: "" };
const EMPTY_PASSWORD = { currentPassword: "", newPassword: "", confirmPassword: "" };

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, setUser, clearAuth, isAdmin } = useAuthStore();
  const [form, setForm] = useState(EMPTY_PROFILE);
  const [savedForm, setSavedForm] = useState(EMPTY_PROFILE);
  const [tab, setTab] = useState("info");
  const [saving, setSaving] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [changingPassword, setChangingPassword] = useState(false);
  const [pwForm, setPwForm] = useState(EMPTY_PASSWORD);
  const [errors, setErrors] = useState({});
  const [orders, setOrders] = useState([]);
  const currentEmail = user?.email;
  const currentFullName = user?.fullName || user?.name || "";
  const currentPhone = user?.phone || "";
  const currentAddress = user?.address || "";

  const getInitials = (name) =>
    (name || "U").split(" ").map((word) => word[0]).join("").substring(0, 2).toUpperCase();

  const hydrateProfile = useCallback((accountUser) => {
    const next = {
      fullName: accountUser?.fullName || accountUser?.name || "",
      email: accountUser?.email || "",
      phone: accountUser?.phone || "",
      address: accountUser?.address || "",
    };
    setForm(next);
    setSavedForm(next);
    setUser(accountUser);
  }, [setUser]);

  useEffect(() => {
    if (!currentEmail) {
      navigate("/login");
      return;
    }

    let active = true;
    setLoadingProfile(true);
    Promise.allSettled([authApi.getAccount(), orderApi.getMyOrders()])
      .then(([accountRes, ordersRes]) => {
        if (!active) return;
        if (accountRes.status === "fulfilled") {
          const accountUser = accountRes.value.data?.data?.user || accountRes.value.data?.user;
          hydrateProfile(accountUser);
        } else {
          const fallback = {
            fullName: currentFullName,
            email: currentEmail,
            phone: currentPhone,
            address: currentAddress,
          };
          setForm(fallback);
          setSavedForm(fallback);
        }

        if (ordersRes.status === "fulfilled") {
          const data = ordersRes.value.data?.data?.result || ordersRes.value.data?.data || [];
          setOrders(Array.isArray(data) ? data : []);
        }
      })
      .catch(() => toast.error("Không thể tải đầy đủ thông tin tài khoản."))
      .finally(() => {
        if (active) setLoadingProfile(false);
      });

    return () => {
      active = false;
    };
  }, [currentAddress, currentEmail, currentFullName, currentPhone, hydrateProfile, navigate]);

  const isDirty = useMemo(() => (
    form.fullName !== savedForm.fullName ||
    form.phone !== savedForm.phone ||
    form.address !== savedForm.address
  ), [form, savedForm]);

  const latestOrder = useMemo(() => {
    return [...orders].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))[0] || null;
  }, [orders]);

  const validateProfile = () => {
    const nextErrors = {};
    if (!form.fullName.trim() || form.fullName.trim().length < 3) {
      nextErrors.fullName = "Họ và tên phải có ít nhất 3 ký tự.";
    }
    if (form.phone && !/^[0-9+() .-]{8,30}$/.test(form.phone.trim())) {
      nextErrors.phone = "Số điện thoại không hợp lệ.";
    }
    if (form.address && form.address.length > 255) {
      nextErrors.address = "Địa chỉ không được vượt quá 255 ký tự.";
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleUpdateInfo = async (event) => {
    event.preventDefault();
    if (!validateProfile()) return;

    setSaving(true);
    try {
      const payload = {
        fullName: form.fullName.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
      };
      const res = await authApi.updateAccount(payload);
      const updatedUser = res.data?.data || res.data;
      hydrateProfile(updatedUser);
      toast.success("Đã cập nhật thông tin tài khoản.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Cập nhật thông tin thất bại.");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch (err) {
      console.error(err);
    }
    clearAuth();
    navigate("/login");
  };

  const handleChangePassword = async (event) => {
    event.preventDefault();
    if (pwForm.newPassword.length < 8) {
      toast.error("Mật khẩu mới phải có ít nhất 8 ký tự.");
      return;
    }
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      toast.error("Mật khẩu xác nhận không khớp.");
      return;
    }

    setChangingPassword(true);
    try {
      await authApi.changePassword(pwForm);
      toast.success("Đổi mật khẩu thành công. Vui lòng đăng nhập lại.");
      clearAuth();
      navigate("/login");
    } catch (err) {
      toast.error(err.response?.data?.message || "Đổi mật khẩu thất bại.");
    } finally {
      setChangingPassword(false);
    }
  };

  const tabs = [
    { key: "info", label: "Thông tin", icon: "person" },
    { key: "address", label: "Địa chỉ", icon: "location_on" },
    { key: "security", label: "Bảo mật", icon: "lock" },
  ];

  const latestStatus = latestOrder
    ? ORDER_STATUS[latestOrder.status]?.label || latestOrder.status
    : "Chưa có đơn";
  const latestStatusClass = latestOrder ? (ORDER_STATUS[latestOrder.status]?.color || "badge-blue") : "badge-blue";
  const latestOrderTotal = latestOrder
    ? latestOrder.totalPrice || (latestOrder.orderDetails || []).reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 0), 0)
    : 0;

  return (
    <div className="min-h-screen bg-surface-soft py-8 md:py-10">
      <div className="max-w-5xl mx-auto px-4 md:px-6">
        <section className="rounded-xl overflow-hidden bg-admin-bg text-white mb-6 shadow-card">
          <div className="p-6 md:p-8 flex flex-col lg:flex-row lg:items-center gap-6">
            <div
              className="w-24 h-24 rounded-xl flex items-center justify-center text-white text-3xl font-extrabold flex-shrink-0 shadow-brand-glow border border-white/20"
              style={{ background: "linear-gradient(135deg, #16a34a, #0d9488, #1d4ed8)" }}
            >
              {getInitials(form.fullName || user?.fullName)}
            </div>

            <div className="flex-1 text-center lg:text-left min-w-0">
              <p className="text-xs font-bold uppercase tracking-widest text-white/45">Tài khoản HAN SPORTS</p>
              <h1 className="text-heading md:text-display font-extrabold break-words mt-1">
                {form.fullName || "Tài khoản của tôi"}
              </h1>
              <p className="text-white/65 text-sm mt-1">{form.email || user?.email}</p>
              <div className="flex flex-wrap gap-2 mt-4 justify-center lg:justify-start">
                {isAdmin() && <span className="badge-blue">Quản trị viên</span>}
                <span className="badge-green">Thành viên</span>
                {form.phone && (
                  <span className="inline-flex items-center gap-1 text-xs text-white bg-white/10 border border-white/10 px-2.5 py-1 rounded-pill">
                    <span className="material-symbols-outlined" style={{ fontSize: 14 }}>call</span>
                    {form.phone}
                  </span>
                )}
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="flex-shrink-0 flex items-center gap-1.5 text-sm text-red-100 font-semibold hover:bg-white/10 px-3 py-2 rounded-lg transition-all"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>logout</span>
              Đăng xuất
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 border-t border-white/10">
            <div className="p-4 md:p-5 border-b md:border-b-0 md:border-r border-white/10">
              <p className="text-xs text-white/45 font-semibold uppercase tracking-wider">Đơn gần nhất</p>
              <div className="mt-2 flex items-center gap-2">
                <span className={latestStatusClass}>{latestStatus}</span>
                {latestOrder && <span className="text-sm font-bold">#{String(latestOrder.id).padStart(6, "0")}</span>}
              </div>
            </div>
            <div className="p-4 md:p-5 border-b md:border-b-0 md:border-r border-white/10">
              <p className="text-xs text-white/45 font-semibold uppercase tracking-wider">Giá trị đơn gần nhất</p>
              <p className="text-lg font-extrabold mt-1">{latestOrder ? formatVND(latestOrderTotal) : "-"}</p>
            </div>
            <div className="p-4 md:p-5 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs text-white/45 font-semibold uppercase tracking-wider">Truy cập nhanh</p>
                <p className="text-sm text-white/70 mt-1">Theo dõi đơn hàng đã mua</p>
              </div>
              <Link to="/orders" className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-white/10 hover:bg-white/15 transition-all" aria-label="Xem đơn hàng">
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>arrow_forward</span>
              </Link>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <SummaryCard icon="shopping_bag" label="Tổng đơn hàng" value={orders.length} tone="blue" />
          <SummaryCard icon="receipt_long" label="Đơn gần nhất" value={latestStatus} tone="green" />
          <SummaryCard icon="event" label="Ngày đặt gần nhất" value={latestOrder ? formatDate(latestOrder.createdAt) : "-"} tone="teal" />
        </div>

        <div className="card overflow-hidden">
          <div className="flex border-b border-surface-border overflow-x-auto hide-scrollbar">
            {tabs.map(({ key, label, icon }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`flex items-center gap-2 px-5 py-4 text-sm font-semibold transition-all border-b-2 whitespace-nowrap ${
                  tab === key ? "border-brand-blue text-brand-blue" : "border-transparent text-text-secondary hover:text-brand-blue"
                }`}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{icon}</span>
                {label}
              </button>
            ))}
          </div>

          <div className="p-5 md:p-6">
            {loadingProfile ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[...Array(4)].map((_, index) => <div key={index} className="skeleton h-12 rounded-lg" />)}
              </div>
            ) : (
              <>
                {tab === "info" && (
                  <form onSubmit={handleUpdateInfo} className="flex flex-col gap-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <TextField
                        label="Họ và tên"
                        value={form.fullName}
                        error={errors.fullName}
                        onChange={(value) => setForm({ ...form, fullName: value })}
                        placeholder="Nguyễn Văn A"
                      />
                      <TextField label="Email" value={form.email} readOnly />
                      <TextField
                        label="Số điện thoại"
                        value={form.phone}
                        error={errors.phone}
                        onChange={(value) => setForm({ ...form, phone: value })}
                        placeholder="090 123 4567"
                      />
                    </div>
                    <Actions saving={saving} isDirty={isDirty} />
                  </form>
                )}

                {tab === "address" && (
                  <form onSubmit={handleUpdateInfo} className="flex flex-col gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-text-secondary mb-2">Địa chỉ giao hàng mặc định</label>
                      <textarea
                        value={form.address}
                        onChange={(event) => setForm({ ...form, address: event.target.value })}
                        rows={4}
                        className={`input-field resize-none ${errors.address ? "border-danger" : ""}`}
                        placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành phố..."
                      />
                      {errors.address && <p className="text-xs text-danger mt-1">{errors.address}</p>}
                    </div>
                    <Actions saving={saving} isDirty={isDirty} label="Lưu địa chỉ" />
                  </form>
                )}

                {tab === "security" && (
                  <form onSubmit={handleChangePassword} className="flex flex-col gap-5">
                    <div className="p-4 bg-brand-blue-light rounded-xl flex items-start gap-3">
                      <span className="material-symbols-outlined text-brand-blue flex-shrink-0 mt-0.5" style={{ fontSize: 20 }}>info</span>
                      <p className="text-sm text-brand-blue">
                        Để đổi mật khẩu, bạn cần nhập đúng mật khẩu hiện tại. Mật khẩu mới nên có ít nhất 8 ký tự.
                      </p>
                    </div>
                    <PasswordField
                      label="Mật khẩu hiện tại"
                      value={pwForm.currentPassword}
                      onChange={(value) => setPwForm({ ...pwForm, currentPassword: value })}
                    />
                    <PasswordField
                      label="Mật khẩu mới"
                      value={pwForm.newPassword}
                      onChange={(value) => setPwForm({ ...pwForm, newPassword: value })}
                      placeholder="Tối thiểu 8 ký tự"
                    />
                    <PasswordField
                      label="Xác nhận mật khẩu mới"
                      value={pwForm.confirmPassword}
                      onChange={(value) => setPwForm({ ...pwForm, confirmPassword: value })}
                      placeholder="Nhập lại mật khẩu mới"
                    />
                    <div className="flex justify-end">
                      <button type="submit" disabled={changingPassword} className="btn-primary py-2.5 px-6 disabled:opacity-60">
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>lock_reset</span>
                        {changingPassword ? "Đang đổi..." : "Đổi mật khẩu"}
                      </button>
                    </div>
                  </form>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ icon, label, value, tone = "blue" }) {
  const toneClass = {
    blue: "bg-brand-blue-light text-brand-blue border-brand-blue/25",
    green: "bg-brand-green-light text-brand-green border-brand-green/25",
    teal: "bg-brand-teal-light text-brand-teal border-brand-teal/25",
  }[tone] || "bg-brand-blue-light text-brand-blue border-brand-blue/25";

  return (
    <div className="card p-4 text-center hover:-translate-y-1">
      <div className={`w-10 h-10 rounded-xl mx-auto mb-2 flex items-center justify-center border ${toneClass}`}>
        <span className="material-symbols-outlined" style={{ fontSize: 20 }}>{icon}</span>
      </div>
      <p className="text-lg font-bold text-text-primary truncate">{value}</p>
      <p className="text-xs text-text-muted">{label}</p>
    </div>
  );
}

function TextField({ label, value, onChange, placeholder, error, readOnly = false }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-text-secondary mb-2">{label}</label>
      <input
        value={value}
        readOnly={readOnly}
        onChange={(event) => onChange?.(event.target.value)}
        className={`input-field ${readOnly ? "bg-surface-muted cursor-not-allowed text-text-muted" : ""} ${error ? "border-danger" : ""}`}
        placeholder={placeholder}
      />
      {error && <p className="text-xs text-danger mt-1">{error}</p>}
    </div>
  );
}

function PasswordField({ label, value, onChange, placeholder = "••••••••" }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-text-secondary mb-2">{label}</label>
      <input
        type="password"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="input-field"
        placeholder={placeholder}
      />
    </div>
  );
}

function Actions({ saving, isDirty, label = "Lưu thay đổi" }) {
  return (
    <div className="flex justify-end">
      <button type="submit" disabled={saving || !isDirty} className="btn-primary py-2.5 px-6 disabled:opacity-60 disabled:grayscale">
        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>save</span>
        {saving ? "Đang lưu..." : label}
      </button>
    </div>
  );
}
