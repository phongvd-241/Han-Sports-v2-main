import { Link } from "react-router-dom";
import { useSettingStore } from "../../store/useSettingStore";
import { LOGO_CIRCLE } from "../../utils/constants";

export default function Footer() {
  const { getSetting } = useSettingStore();
  const HOTLINE = getSetting("HOTLINE", "090 123 4567");

  return (
    <footer style={{ background: "linear-gradient(135deg, #0f2027 0%, #1d4ed8 60%, #16a34a 100%)" }} className="text-white pt-14 pb-20 md:pb-10">
      <div className="max-w-[1280px] mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-10 border-b border-white/10">
          {/* Col 1: Brand */}
          <div className="md:col-span-1 flex flex-col gap-5">
            <div className="flex items-center gap-3">
              <img src={LOGO_CIRCLE} alt="HAN SPORTS" className="w-12 h-12 object-contain rounded-full bg-white p-1" />
              <div>
                <p className="font-extrabold text-lg leading-none">HAN SPORTS</p>
                <p className="text-xs text-white/60 mt-0.5">Thế giới đồ thể thao chính hãng</p>
              </div>
            </div>
            <p className="text-white/70 text-sm leading-relaxed">
              Hệ thống phân phối đồ thể thao chính hãng hàng đầu Việt Nam.
            </p>
            <div className="flex flex-col gap-2 text-sm text-white/70">
              <div className="flex items-start gap-2">
                <span className="material-symbols-outlined text-brand-green-light mt-0.5" style={{ fontSize: 16 }}>location_on</span>
                Hà Nội, Việt Nam
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-brand-green-light" style={{ fontSize: 16 }}>call</span>
                {HOTLINE}
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-brand-green-light" style={{ fontSize: 16 }}>mail</span>
                contact@hansports.vn
              </div>
            </div>
          </div>

          {/* Col 2: Chính sách */}
          <div className="flex flex-col gap-3">
            <h4 className="font-bold text-sm uppercase tracking-wider text-white/40 mb-1">Chính Sách</h4>
            {["Chính sách đổi trả", "Chính sách bảo hành", "Chính sách giao hàng", "Bảo mật thông tin", "Điều khoản dịch vụ"].map((t) => (
              <Link key={t} to="#" className="text-sm text-white/70 hover:text-white transition-colors">{t}</Link>
            ))}
          </div>

          {/* Col 3: Hỗ trợ */}
          <div className="flex flex-col gap-3">
            <h4 className="font-bold text-sm uppercase tracking-wider text-white/40 mb-1">Hỗ Trợ Khách Hàng</h4>
            {["Tra cứu đơn hàng", "Hướng dẫn mua hàng", "Hướng dẫn chọn size", "Câu hỏi thường gặp", "Liên hệ đại lý"].map((t) => (
              <Link key={t} to="#" className="text-sm text-white/70 hover:text-white transition-colors">{t}</Link>
            ))}
          </div>

          {/* Col 4: Newsletter */}
          <div className="flex flex-col gap-4">
            <h4 className="font-bold text-sm uppercase tracking-wider text-white/40 mb-1">Đăng Ký Nhận Tin</h4>
            <p className="text-sm text-white/70">Nhận ưu đãi và tin tức mới nhất từ HAN SPORTS.</p>
            <div className="flex">
              <input
                type="email"
                placeholder="Email của bạn..."
                className="flex-1 h-10 px-4 rounded-l-lg bg-white/10 border border-white/20 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-brand-green-light"
              />
              <button
                className="h-10 px-4 rounded-r-lg font-semibold text-sm text-white transition-all"
                style={{ background: "linear-gradient(135deg, #16a34a, #0d9488)" }}
              >
                Gửi
              </button>
            </div>
            <div className="flex gap-3 mt-1">
              {["public", "share", "chat_bubble"].map((icon) => (
                <button key={icon} className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all">
                  <span className="material-symbols-outlined text-white/70" style={{ fontSize: 18 }}>{icon}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="pt-6 text-center text-sm text-white/50">
          © 2026 HAN SPORTS. Thế giới đồ thể thao chính hãng.
        </div>
      </div>
    </footer>
  );
}
