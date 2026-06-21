import { Link } from "react-router-dom";

export default function DashboardActionCards() {
  const actions = [
    {
      icon: "add_box",
      label: "Thêm sản phẩm mới",
      desc: "Upload ảnh và nhập thông tin sản phẩm",
      path: "/admin/products",
      tone: "bg-brand-blue-light text-brand-blue border-brand-blue/20",
    },
    {
      icon: "manage_search",
      label: "Quản lý đơn hàng",
      desc: "Xem, cập nhật trạng thái đơn hàng & gửi email",
      path: "/admin/orders",
      tone: "bg-brand-green-light text-brand-green border-brand-green/20",
    },
    {
      icon: "people",
      label: "Quản lý người dùng",
      desc: "Cập nhật thông tin tài khoản và vai trò",
      path: "/admin/users",
      tone: "bg-brand-teal-light text-brand-teal border-brand-teal/20",
    },
  ];

  return (
    <div className="card p-5 flex flex-col gap-4 border-t-4 border-brand-teal/40 shadow-sm hover:shadow-md transition-shadow">
      <div>
        <h3 className="text-lg font-bold text-text-primary">Tác vụ nhanh</h3>
        <p className="text-xs text-text-muted mt-1">Các luồng quản trị thường dùng.</p>
      </div>
      <div className="flex flex-col gap-3">
        {actions.map(({ icon, label, desc, path, tone }) => (
          <Link
            key={label}
            to={path}
            className="group flex items-center gap-3.5 p-3.5 rounded-xl border border-surface-border bg-white hover:border-brand-blue hover:bg-brand-blue-light/20 transition-all duration-300 ease-smooth hover:translate-x-1"
          >
            <div
              className={`w-11 h-11 rounded-xl border flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-105 ${tone}`}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 24 }}>
                {icon}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-bold text-sm text-text-primary transition-colors group-hover:text-brand-blue">
                {label}
              </p>
              <p className="text-xs text-text-muted mt-0.5 truncate">{desc}</p>
            </div>
            <span
              className="material-symbols-outlined text-text-muted transition-transform duration-300 group-hover:translate-x-0.5 group-hover:text-brand-blue"
              style={{ fontSize: 18 }}
            >
              chevron_right
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
