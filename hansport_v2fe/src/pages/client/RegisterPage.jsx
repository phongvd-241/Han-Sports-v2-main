import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authApi } from "../../api/authApi";
import { LOGO_CIRCLE } from "../../utils/constants";

const FIELDS = [
  { name: "fullName", label: "Họ và tên", type: "text", placeholder: "Nguyễn Văn A", required: true, col: "full" },
  { name: "email", label: "Email", type: "email", placeholder: "example@email.com", required: true, col: "half" },
  { name: "password", label: "Mật khẩu", type: "password", placeholder: "Tối thiểu 8 ký tự", required: true, col: "half" },
  { name: "phone", label: "Số điện thoại", type: "tel", placeholder: "090 123 4567", required: false, col: "half" },
  { name: "address", label: "Địa chỉ", type: "text", placeholder: "Địa chỉ nhận hàng", required: false, col: "full" },
];

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: "", email: "", password: "", phone: "", address: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await authApi.register(form);
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.message || "Đăng ký thất bại, vui lòng thử lại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-soft flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <img src={LOGO_CIRCLE} alt="HAN SPORTS" className="w-16 h-16 rounded-full bg-white p-1 mx-auto mb-3 shadow-card" />
          <p className="font-extrabold text-xl gradient-text">HAN SPORTS</p>
        </div>

        <div className="card p-8">
          <h2 className="text-title font-bold text-text-primary mb-1">Tạo tài khoản mới</h2>
          <p className="text-text-muted text-sm mb-6">Tham gia HAN SPORTS để nhận nhiều ưu đãi hấp dẫn</p>

          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-danger text-sm flex items-center gap-2">
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>error_outline</span>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-4 mb-5">
              {FIELDS.map(({ name, label, type, placeholder, required, col }) => (
                <div key={name} className={col === "full" ? "col-span-2" : "col-span-1"}>
                  <label className="block text-sm font-semibold text-text-secondary mb-2">
                    {label} {required && <span className="text-danger">*</span>}
                  </label>
                  <input
                    type={type}
                    name={name}
                    required={required}
                    value={form[name]}
                    onChange={handleChange}
                    placeholder={placeholder}
                    className="input-field"
                  />
                </div>
              ))}
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-3.5 rounded-xl text-base disabled:opacity-60">
              {loading ? (
                <><span className="material-symbols-outlined animate-spin" style={{ fontSize: 18 }}>progress_activity</span> Đang đăng ký...</>
              ) : (
                <><span className="material-symbols-outlined" style={{ fontSize: 18 }}>person_add</span> Đăng ký ngay</>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-text-muted mt-6">
            Đã có tài khoản?{" "}
            <Link to="/login" className="text-brand-blue font-bold hover:underline">Đăng nhập</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
