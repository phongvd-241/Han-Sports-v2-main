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

      {/* SECTION CHARTS */}
      {loading ? (
        <div className="flex flex-col gap-5">
          <div className="skeleton h-64 rounded-xl w-full" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="skeleton h-60 rounded-xl" />
            <div className="skeleton h-60 rounded-xl" />
            <div className="skeleton h-60 rounded-xl" />
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {/* Row 1: Daily Orders (60 Days) */}
          <DailyOrdersChart data={summary.dailyOrders || []} />

          {/* Row 2: Monthly Revenue, Top Products, Order Status */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <MonthlyRevenueChart data={summary.monthlyRevenue || []} />
            <TopProductsChart data={summary.topProducts || []} />
            <OrderStatusChart data={summary.statusDistribution || []} />
          </div>
        </div>
      )}

      {/* QUICK ACTIONS & RECENT ORDERS */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-5 items-start">
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

// ═══════════════ SUB-COMPONENTS BIỂU ĐỒ SVG ═══════════════

function DailyOrdersChart({ data }) {
  if (!data || data.length === 0) return null;

  const width = 1000;
  const height = 240;
  const paddingLeft = 40;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 40;
  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const maxVal = Math.max(...data.map(d => d.count), 3);

  const points = data.map((d, index) => {
    const x = paddingLeft + (data.length > 1 ? (index * (chartWidth / (data.length - 1))) : 0);
    const y = paddingTop + chartHeight - (d.count / maxVal * chartHeight);
    return { x, y, ...d };
  });

  let pathD = "";
  if (points.length > 0) {
    pathD = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const cpX1 = p0.x + (p1.x - p0.x) / 2;
      const cpY1 = p0.y;
      const cpX2 = p0.x + (p1.x - p0.x) / 2;
      const cpY2 = p1.y;
      pathD += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${p1.x} ${p1.y}`;
    }
  }

  const areaD = points.length > 0
    ? `${pathD} L ${points[points.length - 1].x} ${height - paddingBottom} L ${points[0].x} ${height - paddingBottom} Z`
    : "";

  const labelInterval = Math.ceil(data.length / 12);
  const labelsToShow = points.filter((_, idx) => idx % labelInterval === 0 || idx === points.length - 1);

  return (
    <div className="card p-5 flex flex-col gap-4 bg-white">
      <h3 className="text-sm font-bold text-text-primary flex items-center gap-1.5">
        <span className="material-symbols-outlined text-brand-blue" style={{ fontSize: 18 }}>calendar_today</span>
        Đơn hàng theo ngày (60 ngày)
      </h3>
      <div className="w-full overflow-x-auto hide-scrollbar">
        <div className="min-w-[700px] w-full">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
            <defs>
              <linearGradient id="order-gradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {[0, 1, 2, 3].map((val) => {
              const y = paddingTop + chartHeight - (val / maxVal * chartHeight);
              return (
                <g key={val}>
                  <line x1={paddingLeft} y1={y} x2={width - paddingRight} y2={y} stroke="#f1f5f9" strokeWidth="1" />
                  <text x={paddingLeft - 10} y={y + 4} textAnchor="end" fill="#94a3b8" fontSize="10" className="font-semibold">{val}</text>
                </g>
              );
            })}

            {areaD && <path d={areaD} fill="url(#order-gradient)" />}
            {pathD && <path d={pathD} fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />}

            {points.map((p, idx) => (
              <g key={idx} className="group cursor-pointer">
                <circle cx={p.x} cy={p.y} r="3" fill="#fff" stroke="#3b82f6" strokeWidth="1.5" className="transition-all duration-150 group-hover:r-5 group-hover:stroke-width-3" />
                <g className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none">
                  <rect x={p.x - 60} y={p.y - 35} width="120" height="24" rx="4" fill="#0f172a" />
                  <text x={p.x} y={p.y - 19} textAnchor="middle" fill="#fff" fontSize="10" className="font-bold">
                    {p.date}: {p.count} đơn
                  </text>
                </g>
              </g>
            ))}

            {labelsToShow.map((p, idx) => (
              <text key={idx} x={p.x} y={height - 10} textAnchor="middle" fill="#94a3b8" fontSize="10" className="font-semibold">
                {p.date}
              </text>
            ))}
          </svg>
        </div>
      </div>
    </div>
  );
}

function MonthlyRevenueChart({ data }) {
  if (!data || data.length === 0) return null;

  const width = 350;
  const height = 220;
  const paddingLeft = 55;
  const paddingRight = 15;
  const paddingTop = 20;
  const paddingBottom = 40;
  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const maxVal = Math.max(...data.map(d => d.revenue), 1000000);

  const points = data.map((d, index) => {
    const x = paddingLeft + (data.length > 1 ? (index * (chartWidth / (data.length - 1))) : 0);
    const y = paddingTop + chartHeight - (d.revenue / maxVal * chartHeight);
    return { x, y, ...d };
  });

  let pathD = "";
  if (points.length > 0) {
    pathD = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const cpX1 = p0.x + (p1.x - p0.x) / 2;
      const cpY1 = p0.y;
      const cpX2 = p0.x + (p1.x - p0.x) / 2;
      const cpY2 = p1.y;
      pathD += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${p1.x} ${p1.y}`;
    }
  }

  const areaD = points.length > 0
    ? `${pathD} L ${points[points.length - 1].x} ${height - paddingBottom} L ${points[0].x} ${height - paddingBottom} Z`
    : "";

  return (
    <div className="card p-5 flex flex-col gap-4 bg-white">
      <h3 className="text-sm font-bold text-text-primary flex items-center gap-1.5">
        <span className="material-symbols-outlined text-brand-green" style={{ fontSize: 18 }}>monitoring</span>
        Doanh thu theo tháng
      </h3>
      <div className="w-full flex-grow flex items-center justify-center">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
          <defs>
            <linearGradient id="revenue-gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#16a34a" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#16a34a" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const y = paddingTop + chartHeight * ratio;
            const valueLabel = Math.round((1 - ratio) * maxVal);
            return (
              <g key={ratio}>
                <line x1={paddingLeft} y1={y} x2={width - paddingRight} y2={y} stroke="#f1f5f9" strokeWidth="1" />
                <text x={paddingLeft - 8} y={y + 3} textAnchor="end" fill="#94a3b8" fontSize="9" className="font-semibold">
                  {valueLabel >= 1000000 ? `${(valueLabel / 1000000).toFixed(0)}M` : valueLabel.toLocaleString("vi-VN")}
                </text>
              </g>
            );
          })}

          {areaD && <path d={areaD} fill="url(#revenue-gradient)" />}
          {pathD && <path d={pathD} fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />}

          {points.map((p, idx) => (
            <g key={idx} className="group cursor-pointer">
              <circle cx={p.x} cy={p.y} r="3.5" fill="#fff" stroke="#16a34a" strokeWidth="2.0" className="transition-all duration-150 group-hover:r-5" />
              <g className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none">
                <rect x={p.x - 55} y={p.y - 32} width="110" height="22" rx="4" fill="#0f172a" />
                <text x={p.x} y={p.y - 17} textAnchor="middle" fill="#fff" fontSize="9" className="font-bold">
                  {p.revenue.toLocaleString("vi-VN")} đ
                </text>
              </g>
            </g>
          ))}

          {points.map((p, idx) => (
            <text key={idx} x={p.x} y={height - 12} textAnchor="middle" fill="#94a3b8" fontSize="9" className="font-semibold">
              {p.month}
            </text>
          ))}
        </svg>
      </div>
    </div>
  );
}

function TopProductsChart({ data }) {
  if (!data || data.length === 0) return null;

  const maxVal = Math.max(...data.map(d => d.quantity), 1);
  
  const barColors = [
    "bg-emerald-600",
    "bg-blue-600",
    "bg-orange-500",
    "bg-amber-500",
    "bg-rose-500",
    "bg-cyan-500",
  ];

  return (
    <div className="card p-5 flex flex-col gap-4 bg-white">
      <h3 className="text-sm font-bold text-text-primary flex items-center gap-1.5">
        <span className="material-symbols-outlined text-amber-500" style={{ fontSize: 18 }}>emoji_events</span>
        Top SP bán chạy
      </h3>
      <div className="flex flex-col gap-3.5 my-auto">
        {data.map((item, idx) => {
          const percentage = (item.quantity / maxVal) * 100;
          const colorClass = barColors[idx % barColors.length];
          return (
            <div key={item.name} className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-text-secondary truncate pr-2" title={item.name}>
                  {item.name}
                </span>
                <span className="font-bold text-text-primary flex-shrink-0">{item.quantity}</span>
              </div>
              <div className="w-full bg-surface-muted h-2 rounded-full overflow-hidden">
                <div
                  className={`${colorClass} h-full rounded-full transition-all duration-500`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function OrderStatusChart({ data }) {
  if (!data || data.length === 0) return null;

  const statusTranslations = {
    COMPLETED: { label: "Hoàn thành", color: "#f97316" },
    PROCESSING: { label: "Đang xử lý", color: "#3b82f6" },
    SHIPPING: { label: "Đang xử lý", color: "#3b82f6" },
    PENDING: { label: "Mới", color: "#10b981" },
    CONFIRMED: { label: "Mới", color: "#10b981" },
    CANCELLED: { label: "Đã hủy", color: "#ef4444" },
  };

  const grouped = {};
  data.forEach((d) => {
    const trans = statusTranslations[d.status] || { label: d.status, color: "#94a3b8" };
    if (!grouped[trans.label]) {
      grouped[trans.label] = { label: trans.label, count: 0, color: trans.color };
    }
    grouped[trans.label].count += d.count;
  });

  const chartData = Object.values(grouped);
  const total = chartData.reduce((acc, d) => acc + d.count, 0);

  const radius = 35;
  const strokeWidth = 10;
  const circumference = 2 * Math.PI * radius;

  let accumulatedOffset = 0;

  return (
    <div className="card p-5 flex flex-col gap-4 bg-white">
      <h3 className="text-sm font-bold text-text-primary flex items-center gap-1.5">
        <span className="material-symbols-outlined text-brand-blue" style={{ fontSize: 18 }}>pie_chart</span>
        Trạng thái đơn hàng
      </h3>
      <div className="flex flex-row items-center justify-center gap-6 my-auto">
        <div className="relative w-28 h-28 flex items-center justify-center">
          <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
            {total === 0 ? (
              <circle cx="50" cy="50" r={radius} fill="none" stroke="#e2e8f0" strokeWidth={strokeWidth} />
            ) : (
              chartData.map((d) => {
                const percentage = d.count / total;
                const strokeLength = percentage * circumference;
                const strokeOffset = circumference - strokeLength + accumulatedOffset;
                accumulatedOffset -= strokeLength;
                return (
                  <circle
                    key={d.label}
                    cx="50"
                    cy="50"
                    r={radius}
                    fill="none"
                    stroke={d.color}
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeOffset}
                    className="transition-all duration-300 hover:opacity-95"
                    style={{ strokeLinecap: "butt" }}
                  />
                );
              })
            )}
          </svg>
          <div className="absolute flex flex-col items-center justify-center">
            <span className="text-[9px] text-text-muted font-bold uppercase tracking-wider">Tổng đơn</span>
            <span className="text-sm font-black text-text-primary mt-0.5">{total}</span>
          </div>
        </div>

        <div className="flex flex-col gap-2 flex-shrink-0">
          {chartData.map((d) => (
            <div key={d.label} className="flex items-center gap-2 text-xs">
              <span className="w-3 h-3 rounded flex-shrink-0" style={{ backgroundColor: d.color }} />
              <span className="font-semibold text-text-secondary truncate max-w-[80px]">{d.label}</span>
              <span className="font-bold text-text-primary ml-1">{d.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
