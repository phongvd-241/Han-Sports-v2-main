import { formatVND } from "../../../utils/constants";

function StatCard({ icon, label, value, tone = "blue" }) {
  const toneClasses = {
    blue: {
      icon: "bg-brand-blue-light text-brand-blue",
      border: "border-brand-blue/30",
      glow: "shadow-blue-glow hover:shadow-brand-blue/15",
    },
    green: {
      icon: "bg-brand-green-light text-brand-green",
      border: "border-brand-green/30",
      glow: "shadow-green-glow hover:shadow-brand-green/15",
    },
    teal: {
      icon: "bg-brand-teal-light text-brand-teal",
      border: "border-brand-teal/30",
      glow: "shadow-card-hover hover:shadow-brand-teal/15",
    },
    amber: {
      icon: "bg-amber-50 text-amber-600",
      border: "border-amber-300",
      glow: "shadow-card-hover hover:shadow-amber-500/15",
    },
    danger: {
      icon: "bg-red-50 text-danger",
      border: "border-red-300",
      glow: "shadow-card-hover hover:shadow-red-500/15",
    },
  };
  const style = toneClasses[tone] || toneClasses.blue;

  return (
    <div
      className={`card p-5 flex items-center gap-4 border-l-4 ${style.border} hover:-translate-y-1 transition-all duration-300 ease-smooth ${style.glow}`}
    >
      <div
        className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${style.icon}`}
      >
        <span
          className="material-symbols-outlined"
          style={{ fontSize: 24, fontVariationSettings: "'FILL' 1" }}
        >
          {icon}
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">
          {label}
        </p>
        <p className="text-xl font-extrabold mt-0.5 text-text-primary truncate" title={value}>
          {value}
        </p>
      </div>
    </div>
  );
}

export default function DashboardKpiGrid({ summary, loading }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        {[...Array(5)].map((_, index) => (
          <div key={index} className="skeleton h-28 rounded-xl" />
        ))}
      </div>
    );
  }

  const statCards = [
    {
      icon: "inventory_2",
      label: "Tổng sản phẩm",
      value: (summary.totalProducts || 0).toLocaleString("vi-VN"),
      tone: "blue",
    },
    {
      icon: "receipt_long",
      label: "Tổng đơn hàng",
      value: (summary.totalOrders || 0).toLocaleString("vi-VN"),
      tone: "green",
    },
    {
      icon: "group",
      label: "Khách hàng",
      value: (summary.totalUsers || 0).toLocaleString("vi-VN"),
      tone: "teal",
    },
    {
      icon: "payments",
      label: "Doanh thu",
      value: formatVND(summary.revenueTotal || 0),
      tone: "amber",
    },
    {
      icon: "warning",
      label: "Sắp hết hàng",
      value: (summary.lowStockCount || 0).toLocaleString("vi-VN"),
      tone: (summary.lowStockCount || 0) > 0 ? "danger" : "green",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
      {statCards.map((card) => (
        <StatCard key={card.label} {...card} />
      ))}
    </div>
  );
}
