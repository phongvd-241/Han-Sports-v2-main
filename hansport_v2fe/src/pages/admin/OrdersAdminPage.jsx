import { useEffect, useState } from "react";
import { orderApi } from "../../api/orderApi";
import { formatVND, formatDate, ORDER_STATUS } from "../../utils/constants";

const STATUS_LIST = ["PENDING", "PROCESSING", "SHIPPING", "COMPLETED", "CANCELLED"];

export default function OrdersAdminPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [filterStatus, setFilterStatus] = useState("");
  const [selected, setSelected] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = { page, size: 10 };
      if (filterStatus) params.filter = `status:'${filterStatus}'`;
      const res = await orderApi.getAllOrders(params);
      const data = res.data?.data;
      setOrders(data?.result || []);
      setTotalPages(data?.meta?.pages || 1);
      setTotalElements(data?.meta?.total || 0);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchOrders(); }, [page, filterStatus]);

  const handleUpdateStatus = async (order, newStatus) => {
    setUpdating(true);
    try {
      await orderApi.updateOrder({ id: order.id, status: newStatus });
      setOrders((prev) => prev.map((o) => o.id === order.id ? { ...o, status: newStatus } : o));
      if (selected?.id === order.id) setSelected({ ...selected, status: newStatus });
      if (newStatus === "PROCESSING") {
        try {
          await orderApi.sendOrderEmail(order.id);
          showToast("Cập nhật trạng thái thành công! Đã gửi email.");
        } catch (e) {
          console.error("Gửi email thất bại", e);
          showToast("Cập nhật thành công nhưng gửi email thất bại!", "error");
        }
      } else {
        showToast(`Cập nhật trạng thái thành công!`);
      }
    } catch { showToast("Cập nhật thất bại!", "error"); }
    finally { setUpdating(false); }
  };

  const handleDelete = async (order) => {
    if (!window.confirm(`Xác nhận xóa đơn hàng #${String(order.id).padStart(6, "0")}?`)) return;
    try {
      await orderApi.deleteOrder(order.id);
      setOrders((prev) => prev.filter((o) => o.id !== order.id));
      setSelected(null);
      showToast("Đã xóa đơn hàng!");
    } catch { showToast("Xóa đơn hàng thất bại!", "error"); }
  };

  const getOrderTotal = (order) =>
    (order.orderDetails || []).reduce((s, i) => s + (i.price || 0) * (i.quantity || 0), 0);

  return (
    <div className="flex flex-col gap-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl shadow-modal text-sm font-semibold flex items-center gap-2 animate-fade-up ${toast.type === "success" ? "bg-brand-green text-white" : "bg-danger text-white"}`}>
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{toast.type === "success" ? "check_circle" : "error"}</span>
          {toast.msg}
        </div>
      )}

      {/* Status Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => { setFilterStatus(""); setPage(0); }}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${!filterStatus ? "text-white shadow-blue-glow" : "bg-white border border-surface-border text-text-secondary hover:border-brand-blue hover:text-brand-blue"}`}
          style={!filterStatus ? { background: "linear-gradient(135deg, #16a34a, #1d4ed8)" } : {}}>
          Tất cả ({totalElements})
        </button>
        {STATUS_LIST.map((s) => {
          const info = ORDER_STATUS[s] || { label: s, color: "badge-blue" };
          const isActive = filterStatus === s;
          return (
            <button key={s} onClick={() => { setFilterStatus(s); setPage(0); }}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${isActive ? "text-white shadow-blue-glow" : "bg-white border border-surface-border text-text-secondary hover:border-brand-blue hover:text-brand-blue"}`}
              style={isActive ? { background: "linear-gradient(135deg, #16a34a, #1d4ed8)" } : {}}>
              {info.label}
            </button>
          );
        })}
      </div>

      <div className="flex gap-6">
        {/* Orders Table */}
        <div className="flex-1 min-w-0">
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-surface-muted text-text-muted text-xs uppercase tracking-wider">
                    <th className="px-4 py-3 text-left">Mã đơn</th>
                    <th className="px-4 py-3 text-left">Khách hàng</th>
                    <th className="px-4 py-3 text-left">Ngày đặt</th>
                    <th className="px-4 py-3 text-right">Tổng tiền</th>
                    <th className="px-4 py-3 text-center">Trạng thái</th>
                    <th className="px-4 py-3 text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border">
                  {loading
                    ? [...Array(6)].map((_, i) => (
                      <tr key={i}>{[...Array(6)].map((_, j) => <td key={j} className="px-4 py-3"><div className="skeleton h-7 rounded" /></td>)}</tr>
                    ))
                    : orders.length === 0
                      ? (
                        <tr><td colSpan={6} className="px-4 py-16 text-center text-text-muted">
                          <span className="material-symbols-outlined" style={{ fontSize: 48 }}>receipt_long</span>
                          <p className="mt-2 font-semibold">Không có đơn hàng nào</p>
                        </td></tr>
                      )
                      : orders.map((order) => {
                        const status = ORDER_STATUS[order.status] || { label: order.status || "N/A", color: "badge-blue" };
                        const isSelected = selected?.id === order.id;
                        return (
                          <tr key={order.id}
                            onClick={() => setSelected(isSelected ? null : order)}
                            className={`cursor-pointer transition-colors ${isSelected ? "bg-brand-blue-light" : "hover:bg-surface-soft"}`}>
                            <td className="px-4 py-3 font-bold text-brand-blue">#{String(order.id).padStart(6, "0")}</td>
                            <td className="px-4 py-3 text-text-primary">{order.receiverName || order.user?.fullName || "—"}</td>
                            <td className="px-4 py-3 text-text-muted text-xs">{formatDate(order.createdAt)}</td>
                            <td className="px-4 py-3 text-right font-semibold">{formatVND(getOrderTotal(order))}</td>
                            <td className="px-4 py-3 text-center"><span className={status.color}>{status.label}</span></td>
                            <td className="px-4 py-3">
                              <div className="flex items-center justify-center gap-1">
                                <button onClick={(e) => { e.stopPropagation(); setSelected(order); }}
                                  className="p-1.5 rounded-lg text-brand-blue hover:bg-brand-blue-light transition-all" title="Chi tiết">
                                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>visibility</span>
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); handleDelete(order); }}
                                  className="p-1.5 rounded-lg text-danger hover:bg-red-50 transition-all" title="Xóa">
                                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>delete</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                  }
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-4 py-4 border-t border-surface-border flex items-center justify-between">
                <p className="text-xs text-text-muted">Trang {page + 1} / {totalPages}</p>
                <div className="flex gap-2">
                  <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}
                    className="px-3 py-1.5 rounded-lg border border-surface-border text-xs font-semibold hover:border-brand-blue disabled:opacity-40 transition-all">← Trước</button>
                  <button onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
                    className="px-3 py-1.5 rounded-lg border border-surface-border text-xs font-semibold hover:border-brand-blue disabled:opacity-40 transition-all">Sau →</button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Detail Panel */}
        {selected && (
          <div className="w-80 flex-shrink-0 animate-fade-up">
            <div className="card p-5 sticky top-24">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-text-primary">Chi tiết đơn #{String(selected.id).padStart(6, "0")}</h3>
                <button onClick={() => setSelected(null)} className="p-1.5 rounded-lg hover:bg-surface-muted transition-all text-text-muted">
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
                </button>
              </div>

              {/* Delivery info */}
              <div className="bg-brand-blue-light rounded-xl p-4 mb-4 text-sm">
                <p className="font-semibold text-brand-blue mb-2 flex items-center gap-1.5">
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>local_shipping</span>Giao hàng tới
                </p>
                <p className="text-text-primary font-medium">{selected.receiverName} — {selected.receiverPhone}</p>
                <p className="text-text-secondary text-xs mt-1">{selected.receiverAddress}</p>
                {selected.note && <p className="text-text-muted text-xs italic mt-1">"{selected.note}"</p>}
              </div>

              {/* Items */}
              <div className="flex flex-col gap-2 mb-4 max-h-48 overflow-y-auto hide-scrollbar">
                {(selected.orderDetails || []).map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs bg-surface-muted rounded-lg p-2">
                    <span className="font-medium text-text-primary flex-1 line-clamp-1">{item.product?.name || item.productName || "SP"}</span>
                    <span className="text-text-muted">x{item.quantity}</span>
                    <span className="font-bold text-brand-blue">{formatVND(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-between font-bold text-sm pt-3 border-t border-surface-border mb-4">
                <span>Tổng cộng</span>
                <span className="text-brand-blue">{formatVND(getOrderTotal(selected))}</span>
              </div>

              {/* Update Status */}
              <div>
                <p className="text-xs font-semibold text-text-muted mb-2 uppercase tracking-wide">Cập nhật trạng thái</p>
                <div className="flex flex-col gap-2">
                  {STATUS_LIST.map((s) => {
                    const info = ORDER_STATUS[s] || { label: s };
                    const isCurrent = selected.status === s;
                    return (
                      <button key={s} disabled={isCurrent || updating}
                        onClick={() => handleUpdateStatus(selected, s)}
                        className={`py-2 rounded-xl text-sm font-semibold transition-all border ${isCurrent ? "text-white border-transparent cursor-default" : "bg-white border-surface-border text-text-secondary hover:border-brand-blue hover:text-brand-blue"}`}
                        style={isCurrent ? { background: "linear-gradient(135deg, #16a34a, #1d4ed8)" } : {}}>
                        {isCurrent && <span className="material-symbols-outlined mr-1.5" style={{ fontSize: 14, verticalAlign: "middle" }}>check</span>}
                        {info.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}