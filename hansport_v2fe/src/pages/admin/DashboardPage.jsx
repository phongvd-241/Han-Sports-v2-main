import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { dashboardApi } from "../../api/dashboardApi";
import AdminPageHeader from "../../components/admin/AdminPageHeader";
import DataTable from "../../components/admin/DataTable";
import EmptyState from "../../components/admin/EmptyState";
import StatusBadge from "../../components/admin/StatusBadge";
import { formatVND, formatDate, ORDER_STATUS } from "../../utils/constants";

const DEFAULT_SUMMARY = {
  totalProducts: 0,
  totalUsers: 0,
  totalOrders: 0,
  revenueTotal: 0,
  revenueRecent: 0,
  lowStockCount: 0,
  recentOrders: [],
};
const RECENT_ORDER_COLUMNS = [
  { key: "id", label: "Mã đơn", className: "px-5 py-3 text-left font-semibold" },
  { key: "customer", label: "Khách hàng", className: "px-5 py-3 text-left font-semibold" },
  { key: "createdAt", label: "Ngày đặt", className: "px-5 py-3 text-left font-semibold" },
  { key: "total", label: "Tổng tiền", className: "px-5 py-3 text-right font-semibold" },
  { key: "status", label: "Trạng thái", className: "px-5 py-3 text-center font-semibold" },
];

function StatCard({ icon, label, value, sub, tone = "blue" }) {
  const toneClasses = {
    blue: { icon: "bg-brand-blue-light text-brand-blue", border: "border-brand-blue/30", glow: "shadow-blue-glow" },
    green: { icon: "bg-brand-green-light text-brand-green", border: "border-brand-green/30", glow: "shadow-green-glow" },
    teal: { icon: "bg-brand-teal-light text-brand-teal", border: "border-brand-teal/30", glow: "shadow-card-hover" },
    amber: { icon: "bg-amber-50 text-amber-600", border: "border-amber-300", glow: "shadow-card-hover" },
    danger: { icon: "bg-red-50 text-danger", border: "border-red-300", glow: "shadow-card-hover" },
  };
  const style = toneClasses[tone] || toneClasses.blue;

  return (
    <div className={`card p-5 flex items-center gap-4 border-l-4 ${style.border} hover:-translate-y-1 ${style.glow}`}>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${style.icon}`}>
        <span className="material-symbols-outlined" style={{ fontSize: 24, fontVariationSettings: "'FILL' 1" }}>{icon}</span>
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">{label}</p>
        <p className="text-xl font-extrabold mt-0.5 text-text-primary truncate">{value}</p>
        {sub && <p className="text-xs text-text-muted mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [summary, setSummary] = useState(DEFAULT_SUMMARY);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    dashboardApi.getSummary()
      .then((res) => setSummary(res.data?.data || res.data || DEFAULT_SUMMARY))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const statCards = [
    {
      icon: "inventory_2",
      label: "Tổng sản phẩm",
      value: summary.totalProducts.toLocaleString("vi-VN"),
      sub: "Sản phẩm đang quản lý",
      tone: "blue",
    },
    {
      icon: "receipt_long",
      label: "Tổng đơn hàng",
      value: summary.totalOrders.toLocaleString("vi-VN"),
      sub: "Toàn bộ đơn đã ghi nhận",
      tone: "green",
    },
    {
      icon: "group",
      label: "Khách hàng",
      value: summary.totalUsers.toLocaleString("vi-VN"),
      sub: "Tài khoản trong hệ thống",
      tone: "teal",
    },
    {
      icon: "payments",
      label: "Doanh thu",
      value: formatVND(summary.revenueTotal),
      sub: `30 ngày gần đây: ${formatVND(summary.revenueRecent)}`,
      tone: "amber",
    },
    {
      icon: "warning",
      label: "Sắp hết hàng",
      value: summary.lowStockCount.toLocaleString("vi-VN"),
      sub: "Sản phẩm còn tối đa 5",
      tone: summary.lowStockCount > 0 ? "danger" : "green",
    },
  ];
  const hasOperationalWarning = summary.lowStockCount > 0;

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title="Tổng quan vận hành"
        description="Theo dõi nhanh sản phẩm, đơn hàng, người dùng và tồn kho."
        actions={(
          <>
            <Link to="/admin/products" className="btn-outline py-2 px-4 text-sm">
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add_circle</span>
              Thêm sản phẩm
            </Link>
            <Link to="/admin/orders" className="btn-primary py-2 px-4 text-sm">
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>receipt_long</span>
              Xem đơn hàng
            </Link>
          </>
        )}
      />

      <section className="rounded-xl overflow-hidden bg-admin-bg text-white border border-white/10 shadow-card">
        <div className="p-5 md:p-6 grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5 items-center">
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${hasOperationalWarning ? "bg-red-500/15 text-red-200" : "bg-brand-green/15 text-brand-green-light"}`}>
              <span className="material-symbols-outlined" style={{ fontSize: 26 }}>{hasOperationalWarning ? "warning" : "task_alt"}</span>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-white/50">Trạng thái vận hành</p>
              <h3 className="text-xl md:text-2xl font-extrabold mt-1">
                {hasOperationalWarning ? `${summary.lowStockCount} sản phẩm cần kiểm tra tồn kho` : "Hệ thống đang ở trạng thái ổn định"}
              </h3>
              <p className="text-sm text-white/70 mt-2 max-w-2xl">
                Dashboard đang dùng dữ liệu tổng hợp từ backend, giúp admin nắm nhanh đơn hàng, doanh thu và tồn kho trước khi xử lý chi tiết.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-white/10 border border-white/10 p-4">
              <p className="text-xs text-white/55 font-semibold">30 ngày gần đây</p>
              <p className="text-lg font-extrabold mt-1">{formatVND(summary.revenueRecent)}</p>
            </div>
            <div className="rounded-xl bg-white/10 border border-white/10 p-4">
              <p className="text-xs text-white/55 font-semibold">Đơn gần đây</p>
              <p className="text-lg font-extrabold mt-1">{summary.recentOrders.length.toLocaleString("vi-VN")}</p>
            </div>
          </div>
        </div>
      </section>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
          {[...Array(5)].map((_, index) => <div key={index} className="skeleton h-28 rounded-xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
          {statCards.map((card) => <StatCard key={card.label} {...card} />)}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-5">
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-surface-border flex items-center justify-between">
            <h3 className="text-lg font-bold text-text-primary">Đơn hàng gần đây</h3>
            <Link to="/admin/orders" className="text-sm font-semibold text-brand-blue hover:underline flex items-center gap-1">
              Xem tất cả <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_forward</span>
            </Link>
          </div>
          {loading ? (
            <div className="p-5 flex flex-col gap-3">
              {[...Array(4)].map((_, index) => <div key={index} className="skeleton h-12 rounded-lg" />)}
            </div>
          ) : summary.recentOrders.length === 0 ? (
            <EmptyState icon="receipt_long" title="Chưa có đơn hàng nào" className="py-12" />
          ) : (
            <DataTable columns={RECENT_ORDER_COLUMNS} framed={false}>
              {summary.recentOrders.map((order) => {
                const status = ORDER_STATUS[order.status] || { label: order.status || "N/A", color: "badge-blue" };
                return (
                  <tr key={order.id} className="hover:bg-surface-soft transition-colors">
                    <td className="px-5 py-4 font-bold text-brand-blue">#{String(order.id).padStart(6, "0")}</td>
                    <td className="px-5 py-4 text-text-primary">{order.receiverName || order.user?.name || "-"}</td>
                    <td className="px-5 py-4 text-text-muted">{formatDate(order.createdAt)}</td>
                    <td className="px-5 py-4 text-right font-semibold text-text-primary">{formatVND(order.totalPrice)}</td>
                    <td className="px-5 py-4 text-center"><StatusBadge label={status.label} className={status.color} /></td>
                  </tr>
                );
              })}
            </DataTable>
          )}
        </div>

        <div className="card p-5 flex flex-col gap-4 border-t-4 border-brand-teal/40">
          <div>
            <h3 className="text-lg font-bold text-text-primary">Tác vụ nhanh</h3>
            <p className="text-xs text-text-muted mt-1">Các luồng quản trị thường dùng.</p>
          </div>
          {[
            { icon: "add_box", label: "Thêm sản phẩm mới", desc: "Upload ảnh và nhập thông tin", path: "/admin/products", tone: "bg-brand-blue-light text-brand-blue" },
            { icon: "manage_search", label: "Quản lý đơn hàng", desc: "Xem và cập nhật trạng thái", path: "/admin/orders", tone: "bg-brand-green-light text-brand-green" },
            { icon: "people", label: "Quản lý người dùng", desc: "Cập nhật tài khoản và vai trò", path: "/admin/users", tone: "bg-brand-teal-light text-brand-teal" },
          ].map(({ icon, label, desc, path, tone }) => (
            <Link key={label} to={path} className="flex items-center gap-3 p-3 rounded-xl border border-surface-border hover:border-brand-blue hover:bg-surface-soft transition-all">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${tone}`}>
                <span className="material-symbols-outlined" style={{ fontSize: 22 }}>{icon}</span>
              </div>
              <div className="min-w-0">
                <p className="font-bold text-sm text-text-primary">{label}</p>
                <p className="text-xs text-text-muted">{desc}</p>
              </div>
              <span className="material-symbols-outlined text-text-muted ml-auto" style={{ fontSize: 18 }}>chevron_right</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
