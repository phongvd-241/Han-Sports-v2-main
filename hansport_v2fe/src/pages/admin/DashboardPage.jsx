import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { productApi } from "../../api/productApi";
import { orderApi } from "../../api/orderApi";
import { userApi } from "../../api/userApi";
import { formatVND, formatDate, ORDER_STATUS } from "../../utils/constants";

function StatCard({ icon, label, value, sub, color, gradient }) {
  return (
    <div className="card p-6 flex items-center gap-5">
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0`} style={{ background: gradient }}>
        <span className="material-symbols-outlined text-white" style={{ fontSize: 28, fontVariationSettings: "'FILL' 1" }}>{icon}</span>
      </div>
      <div>
        <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">{label}</p>
        <p className={`text-2xl font-extrabold mt-0.5 ${color}`}>{value}</p>
        {sub && <p className="text-xs text-text-muted mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState({ products: 0, orders: 0, users: 0, revenue: 0 });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      productApi.getAll({ page: 0, size: 1 }),
      orderApi.getAllOrders({ page: 0, size: 5 }),
      userApi.getAll({ page: 0, size: 1 }),
    ])
      .then(([pRes, oRes, uRes]) => {
        const pData = pRes.data?.data;
        const oData = oRes.data?.data;
        const uData = uRes.data?.data;
        const orders = oData?.result || [];
        const revenue = orders.reduce((sum, o) => {
          const total = (o.orderDetails || []).reduce((s, i) => s + (i.price || 0) * (i.quantity || 0), 0);
          return sum + total;
        }, 0);
        setStats({
          products: pData?.meta?.total || 0,
          orders: oData?.meta?.total || orders.length,
          users: uData?.meta?.total || 0,
          revenue,
        });
        setRecentOrders(orders.slice(0, 5));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const STAT_CARDS = [
    {
      icon: "inventory_2", label: "Tổng sản phẩm",
      value: stats.products.toLocaleString("vi-VN"),
      sub: "Sản phẩm trong kho",
      color: "text-brand-blue",
      gradient: "linear-gradient(135deg, #1d4ed8, #3b82f6)",
    },
    {
      icon: "receipt_long", label: "Tổng đơn hàng",
      value: stats.orders.toLocaleString("vi-VN"),
      sub: "Đơn hàng đã tiếp nhận",
      color: "text-brand-green",
      gradient: "linear-gradient(135deg, #16a34a, #22c55e)",
    },
    {
      icon: "group", label: "Khách hàng",
      value: stats.users.toLocaleString("vi-VN"),
      sub: "Tài khoản đã đăng ký",
      color: "text-brand-teal",
      gradient: "linear-gradient(135deg, #0d9488, #14b8a6)",
    },
    {
      icon: "payments", label: "Doanh thu (mẫu)",
      value: formatVND(stats.revenue),
      sub: "Từ đơn hàng gần đây",
      color: "text-amber-600",
      gradient: "linear-gradient(135deg, #d97706, #f59e0b)",
    },
  ];

  return (
    <div className="flex flex-col gap-8">
      {/* Welcome */}
      <div className="rounded-2xl p-8 text-white" style={{ background: "linear-gradient(135deg, #0f1e3d 0%, #1d4ed8 60%, #0d9488 100%)" }}>
        <h2 className="text-2xl font-extrabold mb-1">Chào mừng trở lại! 👋</h2>
        <p className="text-white/70">Đây là tổng quan hoạt động của HAN SPORTS hôm nay.</p>
        <div className="flex gap-3 mt-5">
          <Link to="/admin/products" className="px-4 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-sm font-semibold transition-all flex items-center gap-2">
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add_circle</span> Thêm sản phẩm
          </Link>
          <Link to="/admin/orders" className="px-4 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-sm font-semibold transition-all flex items-center gap-2">
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>receipt_long</span> Xem đơn hàng
          </Link>
        </div>
      </div>

      {/* Stat Cards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-28 rounded-xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          {STAT_CARDS.map((c) => <StatCard key={c.label} {...c} />)}
        </div>
      )}

      {/* Recent Orders */}
      <div className="card overflow-hidden">
        <div className="px-6 py-5 border-b border-surface-border flex items-center justify-between">
          <h3 className="text-lg font-bold text-text-primary">Đơn hàng gần đây</h3>
          <Link to="/admin/orders" className="text-sm font-semibold text-brand-blue hover:underline flex items-center gap-1">
            Xem tất cả <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_forward</span>
          </Link>
        </div>
        {loading ? (
          <div className="p-6 flex flex-col gap-3">
            {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-12 rounded-lg" />)}
          </div>
        ) : recentOrders.length === 0 ? (
          <div className="p-12 text-center text-text-muted">
            <span className="material-symbols-outlined" style={{ fontSize: 48 }}>receipt_long</span>
            <p className="mt-2 font-semibold">Chưa có đơn hàng nào</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface-muted text-text-muted text-xs uppercase tracking-wider">
                  <th className="px-6 py-3 text-left font-semibold">Mã đơn</th>
                  <th className="px-6 py-3 text-left font-semibold">Khách hàng</th>
                  <th className="px-6 py-3 text-left font-semibold">Ngày đặt</th>
                  <th className="px-6 py-3 text-left font-semibold">Tổng tiền</th>
                  <th className="px-6 py-3 text-left font-semibold">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {recentOrders.map((order) => {
                  const status = ORDER_STATUS[order.status] || { label: order.status || "N/A", color: "badge-blue" };
                  const total = (order.orderDetails || []).reduce((s, i) => s + (i.price || 0) * (i.quantity || 0), 0);
                  return (
                    <tr key={order.id} className="hover:bg-surface-soft transition-colors">
                      <td className="px-6 py-4 font-bold text-brand-blue">#{String(order.id).padStart(6, "0")}</td>
                      <td className="px-6 py-4 text-text-primary">{order.receiverName || order.user?.fullName || "—"}</td>
                      <td className="px-6 py-4 text-text-muted">{formatDate(order.createdAt)}</td>
                      <td className="px-6 py-4 font-semibold text-text-primary">{formatVND(total)}</td>
                      <td className="px-6 py-4"><span className={status.color}>{status.label}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {[
          { icon: "add_box", label: "Thêm sản phẩm mới", desc: "Upload ảnh và điền thông tin", path: "/admin/products", color: "text-brand-blue", bg: "bg-brand-blue-light" },
          { icon: "manage_search", label: "Quản lý đơn hàng", desc: "Xem và cập nhật trạng thái", path: "/admin/orders", color: "text-brand-green", bg: "bg-brand-green-light" },
          { icon: "people", label: "Quản lý người dùng", desc: "Xem và chỉnh sửa tài khoản", path: "/admin/users", color: "text-brand-teal", bg: "bg-brand-teal-light" },
        ].map(({ icon, label, desc, path, color, bg }) => (
          <Link key={label} to={path} className="card p-5 flex items-center gap-4 hover:-translate-y-0.5 transition-all duration-200">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${bg}`}>
              <span className={`material-symbols-outlined ${color}`} style={{ fontSize: 24, fontVariationSettings: "'FILL' 1" }}>{icon}</span>
            </div>
            <div>
              <p className="font-bold text-text-primary text-sm">{label}</p>
              <p className="text-xs text-text-muted mt-0.5">{desc}</p>
            </div>
            <span className="material-symbols-outlined text-text-muted ml-auto" style={{ fontSize: 20 }}>arrow_forward_ios</span>
          </Link>
        ))}
      </div>
    </div>
  );
}