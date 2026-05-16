import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authApi } from "../../api/authApi";
import { useAuthStore } from "../../store/useAuthStore";
import { LOGO_CIRCLE } from "../../utils/constants";

export default function LoginPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  const [form, setForm] = useState({ username: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPass, setShowPass] = useState(false);

  const googleButtonRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await authApi.login(form.username, form.password);
      const data = res.data?.data || res.data || {};

      const token = data.access_token || data.accessToken;
      const user = data.user;

      if (token && user) {
        setAuth(token, user);
        navigate(user?.role?.name === "ADMIN" ? "/admin" : "/");
      } else {
        throw new Error("Dữ liệu đăng nhập không hợp lệ");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Email hoặc mật khẩu không đúng");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

    if (!clientId) {
      setError("Thiếu VITE_GOOGLE_CLIENT_ID trong file .env");
      return;
    }

    const handleGoogleCredential = async (response) => {
      const idToken = response?.credential;

      if (!idToken) {
        setError("Không nhận được token từ Google");
        return;
      }

      setError("");
      setLoading(true);

      try {
        const res = await authApi.googleLogin(idToken);
        const data = res.data?.data || res.data || {};

        const token = data.access_token || data.accessToken;
        const user = data.user;

        if (token && user) {
          setAuth(token, user);
          navigate(user?.role?.name === "ADMIN" ? "/admin" : "/");
        } else {
          throw new Error("Dữ liệu đăng nhập Google không hợp lệ");
        }
      } catch (err) {
        setError(err.response?.data?.message || "Đăng nhập Google thất bại");
      } finally {
        setLoading(false);
      }
    };

    const initGoogle = () => {
      if (
        !window.google ||
        !window.google.accounts ||
        !window.google.accounts.id
      ) {
        return;
      }

      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleGoogleCredential,
      });

      if (googleButtonRef.current) {
        googleButtonRef.current.innerHTML = "";

        window.google.accounts.id.renderButton(googleButtonRef.current, {
          theme: "outline",
          size: "large",
          type: "standard",
          text: "signin_with",
          shape: "rectangular",
          width: 360,
        });
      }
    };

    const existingScript = document.querySelector(
      "script[src='https://accounts.google.com/gsi/client']"
    );

    if (!existingScript) {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = initGoogle;
      document.body.appendChild(script);
    } else {
      initGoogle();
    }
  }, [navigate, setAuth]);

  return (
    <div className="min-h-screen flex">
      {/* Left panel — brand */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#0f2027] via-brand-blue to-brand-teal relative overflow-hidden flex-col items-center justify-center p-12 text-white">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_30%_50%,#16a34a_0%,transparent_60%)]" />
        <div className="relative flex flex-col items-center text-center">
          <img
            src={LOGO_CIRCLE}
            alt="HAN SPORTS"
            className="w-28 h-28 rounded-full bg-white p-2 mb-6 shadow-brand-glow animate-float"
          />
          <h1 className="text-4xl font-extrabold mb-3">HAN SPORTS</h1>
          <p className="text-white/70 text-lg">Thế giới đồ thể thao chính hãng</p>

          <div className="mt-12 grid grid-cols-2 gap-4 w-full max-w-xs">
            {[
              { icon: "verified_user", text: "Hàng chính hãng" },
              { icon: "local_shipping", text: "Giao hàng nhanh" },
              { icon: "support_agent", text: "Hỗ trợ 7/7" },
              { icon: "cached", text: "Đổi trả 30 ngày" },
            ].map(({ icon, text }) => (
              <div key={text} className="flex items-center gap-2 text-sm text-white/80">
                <span
                  className="material-symbols-outlined text-brand-green-light"
                  style={{ fontSize: 18 }}
                >
                  {icon}
                </span>
                {text}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center px-4 py-12 bg-surface-soft">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <img
              src={LOGO_CIRCLE}
              alt="HAN SPORTS"
              className="w-16 h-16 rounded-full bg-white p-1 mx-auto mb-3 shadow-card"
            />
            <p className="font-extrabold text-xl gradient-text">HAN SPORTS</p>
          </div>

          <div className="card p-8">
            <h2 className="text-title font-bold text-text-primary mb-1">
              Chào mừng trở lại!
            </h2>
            <p className="text-text-muted text-sm mb-8">
              Đăng nhập để tiếp tục mua sắm
            </p>

            {error && (
              <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-danger text-sm flex items-center gap-2">
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                  error_outline
                </span>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div>
                <label className="block text-sm font-semibold text-text-secondary mb-2">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  placeholder="example@email.com"
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-text-secondary mb-2">
                  Mật khẩu
                </label>

                <div className="relative">
                  <input
                    type={showPass ? "text" : "password"}
                    required
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="Nhập mật khẩu"
                    className="input-field pr-12"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-brand-blue transition-colors"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                      {showPass ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-3.5 rounded-xl text-base disabled:opacity-60 mt-1 active:scale-95 transition-transform"
              >
                {loading ? (
                  <>
                    <span
                      className="material-symbols-outlined animate-spin"
                      style={{ fontSize: 18 }}
                    >
                      progress_activity
                    </span>{" "}
                    Đang đăng nhập...
                  </>
                ) : (
                  "Đăng nhập"
                )}
              </button>
            </form>

            <div className="mt-4 flex justify-center">
              <div ref={googleButtonRef}></div>
            </div>

            <p className="text-center text-sm text-text-muted mt-6">
              Chưa có tài khoản?{" "}
              <Link to="/register" className="text-brand-blue font-bold hover:underline">
                Đăng ký miễn phí
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}