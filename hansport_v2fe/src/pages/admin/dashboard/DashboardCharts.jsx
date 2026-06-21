import { useState, useMemo } from "react";
import EmptyState from "../../../components/admin/EmptyState";

export default function DashboardCharts({ summary, loading }) {
  if (loading) {
    return (
      <div className="flex flex-col gap-5">
        <div className="skeleton h-64 rounded-xl w-full" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="skeleton h-60 rounded-xl" />
          <div className="skeleton h-60 rounded-xl" />
          <div className="skeleton h-60 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
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
  );
}

// ═══════════════ SUB-COMPONENTS BIỂU ĐỒ SVG CẢI TIẾN ═══════════════

function DailyOrdersChart({ data }) {
  const [groupBy, setGroupBy] = useState("day"); // "day", "month", "quarter", "year"

  const groupedData = useMemo(() => {
    if (!data || data.length === 0) return [];
    if (groupBy === "day") {
      return data;
    }

    const groups = {};
    data.forEach((d) => {
      if (!d.date) return;
      const parts = d.date.split("-");
      if (parts.length < 3) return;
      const year = parts[0];
      const month = parseInt(parts[1], 10);

      let key = "";
      let label = "";

      if (groupBy === "month") {
        key = `${year}-${parts[1]}`;
        label = `T${month}/${year}`;
      } else if (groupBy === "quarter") {
        const quarter = Math.ceil(month / 3);
        key = `${year}-Q${quarter}`;
        label = `Quý ${quarter}/${year}`;
      } else if (groupBy === "year") {
        key = year;
        label = `Năm ${year}`;
      }

      if (!groups[key]) {
        groups[key] = { key, label, count: 0 };
      }
      groups[key].count += d.count;
    });

    return Object.values(groups)
      .sort((a, b) => a.key.localeCompare(b.key))
      .map((g) => ({ date: g.label, count: g.count }));
  }, [data, groupBy]);

  if (!data || data.length === 0) {
    return (
      <div className="card p-5 flex flex-col gap-4 bg-white min-h-[260px] justify-between">
        <h3 className="text-sm font-bold text-text-primary flex items-center gap-1.5">
          <span className="material-symbols-outlined text-brand-blue" style={{ fontSize: 18 }}>calendar_today</span>
          Đơn hàng theo ngày (60 ngày)
        </h3>
        <div className="flex-1 flex items-center justify-center">
          <EmptyState
            icon="show_chart"
            title="Không có dữ liệu đơn hàng"
            description="Chưa có dữ liệu thống kê đơn hàng."
            className="py-4 border-none bg-transparent shadow-none"
          />
        </div>
      </div>
    );
  }

  const width = 1000;
  const height = 240;
  const paddingLeft = 40;
  const paddingRight = 20;
  const paddingTop = 30; // Increased padding top
  const paddingBottom = 40;
  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const maxVal = Math.max(...groupedData.map(d => d.count), 3);

  const points = groupedData.map((d, index) => {
    let x;
    if (groupedData.length > 1) {
      x = paddingLeft + index * (chartWidth / (groupedData.length - 1));
    } else {
      x = paddingLeft + chartWidth / 2;
    }
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

  const labelInterval = Math.ceil(groupedData.length / 12);
  const labelsToShow = points.filter((_, idx) => idx % labelInterval === 0 || idx === points.length - 1);

  return (
    <div className="card p-5 flex flex-col gap-4 bg-white shadow-sm hover:shadow-md transition-shadow">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h3 className="text-sm font-bold text-text-primary flex items-center gap-1.5">
          <span className="material-symbols-outlined text-brand-blue" style={{ fontSize: 18 }}>calendar_today</span>
          Đơn hàng theo {groupBy === "day" ? "ngày (60 ngày)" : groupBy === "month" ? "tháng" : groupBy === "quarter" ? "quý" : "năm"}
        </h3>
        
        <div className="flex items-center gap-1 bg-surface-soft p-1 rounded-xl border border-surface-border self-start">
          {[
            { key: "day", label: "Ngày" },
            { key: "month", label: "Tháng" },
            { key: "quarter", label: "Quý" },
            { key: "year", label: "Năm" },
          ].map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => setGroupBy(opt.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                groupBy === opt.key
                  ? "bg-white text-brand-blue shadow-sm border border-brand-blue/10"
                  : "text-text-secondary hover:text-brand-blue"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

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

            {points.map((p, idx) => {
              const isCloseToTop = p.y < 40;
              const tooltipY = isCloseToTop ? p.y + 15 : p.y - 35;
              const textY = isCloseToTop ? p.y + 31 : p.y - 19;
              
              const tooltipWidth = 120;
              const tooltipX = Math.max(5, Math.min(width - tooltipWidth - 5, p.x - tooltipWidth / 2));
              const textX = tooltipX + tooltipWidth / 2;

              return (
                <g key={idx} className="group cursor-pointer">
                  <circle cx={p.x} cy={p.y} r="3" fill="#fff" stroke="#3b82f6" strokeWidth="1.5" className="transition-all duration-150 group-hover:r-5 group-hover:stroke-width-3" />
                  <g className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none">
                    <rect x={tooltipX} y={tooltipY} width={tooltipWidth} height="24" rx="4" fill="#0f172a" />
                    <text x={textX} y={textY} textAnchor="middle" fill="#fff" fontSize="10" className="font-bold">
                      {p.date}: {p.count} đơn
                    </text>
                  </g>
                </g>
              );
            })}

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
  if (!data || data.length === 0) {
    return (
      <div className="card p-5 flex flex-col gap-4 bg-white min-h-[250px] justify-between">
        <h3 className="text-sm font-bold text-text-primary flex items-center gap-1.5">
          <span className="material-symbols-outlined text-brand-green" style={{ fontSize: 18 }}>monitoring</span>
          Doanh thu theo tháng
        </h3>
        <div className="flex-1 flex items-center justify-center">
          <EmptyState
            icon="finance"
            title="Không có doanh thu"
            description="Chưa có dữ liệu thống kê doanh thu theo tháng."
            className="py-4 border-none bg-transparent shadow-none"
          />
        </div>
      </div>
    );
  }

  const width = 350;
  const height = 220;
  const paddingLeft = 55;
  const paddingRight = 15;
  const paddingTop = 30; // Increased padding top
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
    <div className="card p-5 flex flex-col gap-4 bg-white shadow-sm hover:shadow-md transition-shadow">
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

          {points.map((p, idx) => {
            const isCloseToTop = p.y < 35;
            const tooltipY = isCloseToTop ? p.y + 12 : p.y - 32;
            const textY = isCloseToTop ? p.y + 27 : p.y - 17;
            
            const tooltipWidth = 110;
            const tooltipX = Math.max(5, Math.min(width - tooltipWidth - 5, p.x - tooltipWidth / 2));
            const textX = tooltipX + tooltipWidth / 2;

            return (
              <g key={idx} className="group cursor-pointer">
                <circle cx={p.x} cy={p.y} r="3.5" fill="#fff" stroke="#16a34a" strokeWidth="2.0" className="transition-all duration-150 group-hover:r-5" />
                <g className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none">
                  <rect x={tooltipX} y={tooltipY} width={tooltipWidth} height="22" rx="4" fill="#0f172a" />
                  <text x={textX} y={textY} textAnchor="middle" fill="#fff" fontSize="9" className="font-bold">
                    {p.revenue.toLocaleString("vi-VN")} đ
                  </text>
                </g>
              </g>
            );
          })}

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
  if (!data || data.length === 0) {
    return (
      <div className="card p-5 flex flex-col gap-4 bg-white min-h-[250px] justify-between">
        <h3 className="text-sm font-bold text-text-primary flex items-center gap-1.5">
          <span className="material-symbols-outlined text-amber-500" style={{ fontSize: 18 }}>emoji_events</span>
          Top SP bán chạy
        </h3>
        <div className="flex-1 flex items-center justify-center">
          <EmptyState
            icon="ads_click"
            title="Chưa có dữ liệu"
            description="Chưa ghi nhận sản phẩm bán chạy."
            className="py-4 border-none bg-transparent shadow-none"
          />
        </div>
      </div>
    );
  }

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
    <div className="card p-5 flex flex-col gap-4 bg-white shadow-sm hover:shadow-md transition-shadow">
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
  if (!data || data.length === 0) {
    return (
      <div className="card p-5 flex flex-col gap-4 bg-white min-h-[250px] justify-between">
        <h3 className="text-sm font-bold text-text-primary flex items-center gap-1.5">
          <span className="material-symbols-outlined text-brand-blue" style={{ fontSize: 18 }}>pie_chart</span>
          Trạng thái đơn hàng
        </h3>
        <div className="flex-1 flex items-center justify-center">
          <EmptyState
            icon="pie_chart"
            title="Chưa có đơn hàng"
            description="Chưa có dữ liệu về trạng thái đơn hàng."
            className="py-4 border-none bg-transparent shadow-none"
          />
        </div>
      </div>
    );
  }

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
    <div className="card p-5 flex flex-col gap-4 bg-white shadow-sm hover:shadow-md transition-shadow">
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
