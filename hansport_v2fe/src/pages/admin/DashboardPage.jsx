import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { dashboardApi } from "../../api/dashboardApi";
import AdminPageHeader from "../../components/admin/AdminPageHeader";
import { formatVND } from "../../utils/constants";
import DashboardKpiGrid from "./dashboard/DashboardKpiGrid";
import DashboardCharts from "./dashboard/DashboardCharts";
import DashboardActionCards from "./dashboard/DashboardActionCards";
import RecentOrdersTable from "./dashboard/RecentOrdersTable";

const DEFAULT_SUMMARY = {
  totalProducts: 0,
  totalUsers: 0,
  totalOrders: 0,
  revenueTotal: 0,
  revenueRecent: 0,
  lowStockCount: 0,
  recentOrders: [],
};

export default function DashboardPage() {
  const [summary, setSummary] = useState(DEFAULT_SUMMARY);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    dashboardApi
      .getSummary()
      .then((res) => setSummary(res.data?.data || res.data || DEFAULT_SUMMARY))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const hasOperationalWarning = (summary.lowStockCount || 0) > 0;

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title="Tổng quan vận hành"
        description="Theo dõi nhanh sản phẩm, đơn hàng, người dùng và tồn kho."
        actions={
          <>
            <Link to="/admin/products" className="btn-outline py-2 px-4 text-sm">
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                add_circle
              </span>
              Thêm sản phẩm
            </Link>
            <Link to="/admin/orders" className="btn-primary py-2 px-4 text-sm">
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                receipt_long
              </span>
              Xem đơn hàng
            </Link>
          </>
        }
      />

      {/* Banner Trạng Thái Vận Hành */}
      <section className="rounded-2xl overflow-hidden bg-slate-900 text-white border border-slate-800 shadow-xl relative group">
        <div className="absolute inset-0 bg-gradient-to-r from-brand-blue/10 to-transparent opacity-50 pointer-events-none" />
        <div className="p-5 md:p-6 grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 items-center relative z-10">
          <div className="flex items-start gap-4">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-105 ${
                hasOperationalWarning
                  ? "bg-red-500/15 text-red-400"
                  : "bg-brand-green/15 text-brand-green-light"
              }`}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 26, fontVariationSettings: "'FILL' 1" }}
              >
                {hasOperationalWarning ? "warning" : "task_alt"}
              </span>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-white/40">
                Trạng thái vận hành
              </p>
              <h3 className="text-xl md:text-2xl font-extrabold mt-1 tracking-tight">
                {hasOperationalWarning
                  ? `${summary.lowStockCount} sản phẩm cần kiểm tra tồn kho`
                  : "Hệ thống đang ở trạng thái ổn định"}
              </h3>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 w-full">
            <div className="rounded-xl bg-white/5 border border-white/10 p-4 transition-colors hover:bg-white/10">
              <p className="text-xs text-white/50 font-semibold">30 ngày gần đây</p>
              <p className="text-lg font-black mt-1 text-amber-400">
                {formatVND(summary.revenueRecent || 0)}
              </p>
            </div>
            <div className="rounded-xl bg-white/5 border border-white/10 p-4 transition-colors hover:bg-white/10">
              <p className="text-xs text-white/50 font-semibold">Đơn gần đây</p>
              <p className="text-lg font-black mt-1 text-brand-green-light">
                {(summary.recentOrders || []).length.toLocaleString("vi-VN")}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Grid KPI chỉ số */}
      <DashboardKpiGrid summary={summary} loading={loading} />

      {/* Biểu đồ SVG */}
      <DashboardCharts summary={summary} loading={loading} />

      {/* Tác vụ nhanh và Đơn hàng gần đây */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6 items-start">
        <RecentOrdersTable
          recentOrders={summary.recentOrders || []}
          loading={loading}
        />
        <DashboardActionCards />
      </div>
    </div>
  );
}
