import { Link, useRouteError } from "react-router-dom";

export default function NotFoundPage() {
  const error = useRouteError?.() || null;
  const is404 = !error || error?.status === 404;

  return (
    <div className="min-h-screen bg-surface-soft flex flex-col items-center justify-center px-4 text-center">
      {/* Animated number */}
      <div className="relative mb-8">
        <div className="text-[120px] md:text-[180px] font-extrabold leading-none select-none"
          style={{ background: "linear-gradient(135deg, #16a34a, #0d9488, #1d4ed8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
          {is404 ? "404" : "Oops"}
        </div>
        {/* Floating emoji */}
        <div className="absolute -top-4 -right-4 text-5xl animate-float">🏸</div>
      </div>

      <h1 className="text-title font-extrabold text-text-primary mb-3">
        {is404 ? "Trang không tìm thấy!" : "Đã xảy ra lỗi!"}
      </h1>
      <p className="text-text-muted text-base max-w-md mb-10 leading-relaxed">
        {is404
          ? "Trang bạn đang tìm kiếm có thể đã bị xóa, đổi tên hoặc tạm thời không hoạt động."
          : "Đã có lỗi xảy ra. Vui lòng thử lại sau hoặc quay về trang chủ."
        }
      </p>

      <div className="flex flex-col sm:flex-row gap-4">
        <Link to="/" className="btn-primary py-3 px-8 rounded-xl text-base">
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>home</span>
          Về trang chủ
        </Link>
        <Link to="/shop" className="btn-outline py-3 px-8 rounded-xl text-base">
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>storefront</span>
          Xem sản phẩm
        </Link>
      </div>

      {/* Decorative dots */}
      <div className="flex gap-3 mt-16 opacity-30">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="rounded-full"
            style={{
              width: 8 + i * 4,
              height: 8 + i * 4,
              background: "linear-gradient(135deg, #16a34a, #1d4ed8)",
              animationDelay: `${i * 0.2}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
