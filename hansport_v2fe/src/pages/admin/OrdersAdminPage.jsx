import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { orderApi } from "../../api/orderApi";
import AdminMetricCard from "../../components/admin/AdminMetricCard";
import AdminPageHeader from "../../components/admin/AdminPageHeader";
import AdminToolbar from "../../components/admin/AdminToolbar";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import DataTable from "../../components/admin/DataTable";
import IconButton from "../../components/admin/IconButton";
import StatusBadge from "../../components/admin/StatusBadge";
import { formatVND, formatDate, ORDER_STATUS } from "../../utils/constants";

const STATUS_LIST = ["PENDING", "PROCESSING", "SHIPPING", "COMPLETED", "CANCELLED"];
const ORDER_COLUMNS = [
  { key: "id", label: "Mã đơn", className: "px-4 py-3 text-left" },
  { key: "customer", label: "Khách hàng", className: "px-4 py-3 text-left" },
  { key: "createdAt", label: "Ngày đặt", className: "px-4 py-3 text-left" },
  { key: "total", label: "Tổng tiền", className: "px-4 py-3 text-right" },
  { key: "status", label: "Trạng thái", className: "px-4 py-3 text-center" },
  { key: "actions", label: "Thao tác", className: "px-4 py-3 text-center" },
];

export default function OrdersAdminPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [filterStatus, setFilterStatus] = useState("");
  const [selected, setSelected] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, size: 10 };
      if (filterStatus) params.filter = `status:'${filterStatus}'`;
      const res = await orderApi.getAllOrders(params);
      const data = res.data?.data;
      setOrders(data?.result || []);
      setTotalPages(data?.meta?.pages || 1);
      setTotalElements(data?.meta?.total || 0);
    } catch (e) {
      console.error(e);
      toast.error("Không thể tải danh sách đơn hàng.");
    } finally {
      setLoading(false);
    }
  }, [filterStatus, page]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleUpdateStatus = async (order, newStatus) => {
    setUpdating(true);
    try {
      await orderApi.updateOrder({ id: order.id, status: newStatus });
      setOrders((prev) => prev.map((item) => item.id === order.id ? { ...item, status: newStatus } : item));
      if (selected?.id === order.id) setSelected({ ...selected, status: newStatus });

      if (newStatus === "PROCESSING") {
        try {
          await orderApi.sendOrderEmail(order.id);
          toast.success("Cập nhật trạng thái thành công. Đã gửi email.");
        } catch (e) {
          console.error("Gửi email thất bại", e);
          toast.error("Cập nhật thành công nhưng gửi email thất bại.");
        }
      } else {
        toast.success("Cập nhật trạng thái thành công.");
      }
    } catch {
      toast.error("Cập nhật thất bại.");
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await orderApi.deleteOrder(deleteTarget.id);
      setOrders((prev) => prev.filter((item) => item.id !== deleteTarget.id));
      setSelected((current) => current?.id === deleteTarget.id ? null : current);
      setDeleteTarget(null);
      toast.success("Đã xóa đơn hàng.");
    } catch {
      toast.error("Xóa đơn hàng thất bại.");
    } finally {
      setDeleting(false);
    }
  };

  const getOrderTotal = (order) =>
    order.totalPrice || (order.orderDetails || []).reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 0), 0);
  const revenueOnPage = orders.reduce((sum, order) => sum + getOrderTotal(order), 0);
  const pendingOnPage = orders.filter((order) => order.status === "PENDING").length;
  const processingOnPage = orders.filter((order) => order.status === "PROCESSING").length;
  const selectedFilterLabel = filterStatus ? ORDER_STATUS[filterStatus]?.label || filterStatus : "Tất cả";

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title="Đơn hàng"
        description={`${totalElements} đơn hàng trong hệ thống`}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <AdminMetricCard icon="receipt_long" label="Tổng đơn" value={totalElements.toLocaleString("vi-VN")} hint={`Bộ lọc: ${selectedFilterLabel}`} tone="blue" />
        <AdminMetricCard icon="payments" label="Tổng trang này" value={formatVND(revenueOnPage)} hint={`${orders.length} đơn đang hiển thị`} tone="green" />
        <AdminMetricCard icon="pending_actions" label="Chờ xác nhận" value={pendingOnPage.toLocaleString("vi-VN")} hint="Trong trang hiện tại" tone={pendingOnPage > 0 ? "amber" : "teal"} />
        <AdminMetricCard icon="mark_email_read" label="Đang xử lý" value={processingOnPage.toLocaleString("vi-VN")} hint="Có thể đã gửi email" tone="teal" />
      </div>

      <AdminToolbar>
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => {
            setFilterStatus("");
            setPage(0);
          }}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${!filterStatus ? "text-white shadow-blue-glow" : "bg-white border border-surface-border text-text-secondary hover:border-brand-blue hover:text-brand-blue"}`}
          style={!filterStatus ? { background: "linear-gradient(135deg, #16a34a, #1d4ed8)" } : {}}
        >
          Tất cả ({totalElements})
        </button>
        {STATUS_LIST.map((statusKey) => {
          const info = ORDER_STATUS[statusKey] || { label: statusKey, color: "badge-blue" };
          const isActive = filterStatus === statusKey;
          return (
            <button
              key={statusKey}
              onClick={() => {
                setFilterStatus(statusKey);
                setPage(0);
              }}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${isActive ? "text-white shadow-blue-glow" : "bg-white border border-surface-border text-text-secondary hover:border-brand-blue hover:text-brand-blue"}`}
              style={isActive ? { background: "linear-gradient(135deg, #16a34a, #1d4ed8)" } : {}}
            >
              {info.label}
            </button>
          );
        })}
      </div>
      </AdminToolbar>

      <div className="flex flex-col xl:flex-row gap-6">
        <div className="flex-1 min-w-0">
          <DataTable
            columns={ORDER_COLUMNS}
            loading={loading}
            isEmpty={orders.length === 0}
            emptyIcon="receipt_long"
            emptyTitle="Không có đơn hàng nào"
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
          >
            {orders.map((order) => {
              const status = ORDER_STATUS[order.status] || { label: order.status || "N/A", color: "badge-blue" };
              const isSelected = selected?.id === order.id;
              return (
                <tr
                  key={order.id}
                  onClick={() => setSelected(isSelected ? null : order)}
                  className={`cursor-pointer transition-colors ${isSelected ? "bg-brand-blue-light" : "hover:bg-surface-soft"}`}
                >
                  <td className="px-4 py-3 font-bold text-brand-blue">#{String(order.id).padStart(6, "0")}</td>
                  <td className="px-4 py-3 text-text-primary">{order.receiverName || order.user?.fullName || "-"}</td>
                  <td className="px-4 py-3 text-text-muted text-xs">{formatDate(order.createdAt)}</td>
                  <td className="px-4 py-3 text-right font-semibold">{formatVND(getOrderTotal(order))}</td>
                  <td className="px-4 py-3 text-center"><StatusBadge label={status.label} className={status.color} /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <IconButton
                        icon="visibility"
                        label="Xem chi tiết đơn hàng"
                        variant="primary"
                        onClick={(event) => {
                          event.stopPropagation();
                          setSelected(order);
                        }}
                      />
                      <IconButton
                        icon="delete"
                        label="Xóa đơn hàng"
                        variant="danger"
                        onClick={(event) => {
                          event.stopPropagation();
                          setDeleteTarget(order);
                        }}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </DataTable>
        </div>

        {selected && (
          <div className="w-full xl:w-80 flex-shrink-0 animate-fade-up">
            <div className="card p-5 xl:sticky xl:top-24">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-text-primary">Chi tiết đơn #{String(selected.id).padStart(6, "0")}</h3>
                <IconButton icon="close" label="Đóng chi tiết đơn hàng" onClick={() => setSelected(null)} />
              </div>

              <div className="bg-brand-blue-light rounded-xl p-4 mb-4 text-sm">
                <p className="font-semibold text-brand-blue mb-2 flex items-center gap-1.5">
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>local_shipping</span>
                  Giao hàng tới
                </p>
                <p className="text-text-primary font-medium">{selected.receiverName} - {selected.receiverPhone}</p>
                <p className="text-text-secondary text-xs mt-1">{selected.receiverAddress}</p>
                {selected.note && <p className="text-text-muted text-xs italic mt-1">"{selected.note}"</p>}
              </div>

              <div className="flex flex-col gap-2 mb-4 max-h-48 overflow-y-auto hide-scrollbar">
                {(selected.orderDetails || []).map((item, index) => (
                  <div key={index} className="flex items-start gap-2 text-xs bg-surface-muted rounded-lg p-2">
                    <div className="flex-1 min-w-0">
                      <span className="font-medium text-text-primary line-clamp-1">{item.product?.name || item.productName || "SP"}</span>
                      {(item.selectedColor || item.selectedSize) && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {item.selectedColor && (
                            <span className="px-1.5 py-0.5 rounded bg-white text-[11px] text-text-secondary">
                              Màu: {item.selectedColor}
                            </span>
                          )}
                          {item.selectedSize && (
                            <span className="px-1.5 py-0.5 rounded bg-white text-[11px] text-text-secondary">
                              Size: {item.selectedSize}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <span className="text-text-muted mt-0.5">x{item.quantity}</span>
                    <span className="font-bold text-brand-blue mt-0.5">{formatVND(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-between font-bold text-sm pt-3 border-t border-surface-border mb-4">
                <span>Tổng cộng</span>
                <span className="text-brand-blue">{formatVND(getOrderTotal(selected))}</span>
              </div>

              <div>
                <p className="text-xs font-semibold text-text-muted mb-2 uppercase tracking-wide">Cập nhật trạng thái</p>
                <div className="flex flex-col gap-2">
                  {STATUS_LIST.map((statusKey) => {
                    const info = ORDER_STATUS[statusKey] || { label: statusKey };
                    const isCurrent = selected.status === statusKey;
                    return (
                      <button
                        key={statusKey}
                        disabled={isCurrent || updating}
                        onClick={() => handleUpdateStatus(selected, statusKey)}
                        className={`py-2 rounded-xl text-sm font-semibold transition-all border ${isCurrent ? "text-white border-transparent cursor-default" : "bg-white border-surface-border text-text-secondary hover:border-brand-blue hover:text-brand-blue"}`}
                        style={isCurrent ? { background: "linear-gradient(135deg, #16a34a, #1d4ed8)" } : {}}
                      >
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

      {deleteTarget && (
        <ConfirmDialog
          title="Xác nhận xóa đơn hàng?"
          description={`Bạn sắp xóa đơn hàng #${String(deleteTarget.id).padStart(6, "0")}. Hành động này không thể hoàn tác.`}
          icon="delete_forever"
          confirmLabel="Xóa đơn hàng"
          loading={deleting}
          onCancel={() => {
            if (!deleting) setDeleteTarget(null);
          }}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}
