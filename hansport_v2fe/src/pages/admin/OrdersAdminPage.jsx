import AdminMetricCard from "../../components/admin/AdminMetricCard";
import AdminPageHeader from "../../components/admin/AdminPageHeader";
import AdminToolbar from "../../components/admin/AdminToolbar";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import { formatVND, ORDER_STATUS } from "../../utils/constants";
import { STATUS_LIST } from "./orders/orderWorkflow";
import useOrdersAdmin from "./orders/useOrdersAdmin";
import OrderTable from "./orders/OrderTable";
import OrderDetailPanel from "./orders/OrderDetailPanel";

export default function OrdersAdminPage() {
  const {
    orders,
    loading,
    page,
    setPage,
    totalPages,
    totalElements,
    filterStatus,
    setFilterStatus,
    selected,
    setSelected,
    deleteTarget,
    setDeleteTarget,
    updating,
    deleting,
    sendingEmail,
    handleUpdateStatus,
    handleSendEmail,
    handleDelete,
    getOrderTotal,
    revenueOnPage,
    pendingOnPage,
    processingOnPage,
  } = useOrdersAdmin();

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title="Đơn hàng"
        description={`${totalElements} đơn hàng trong hệ thống`}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <AdminMetricCard
          icon="receipt_long"
          label="Tổng đơn"
          value={totalElements.toLocaleString("vi-VN")}
          tone="blue"
        />
        <AdminMetricCard
          icon="payments"
          label="Tổng trang này"
          value={formatVND(revenueOnPage)}
          tone="green"
        />
        <AdminMetricCard
          icon="pending_actions"
          label="Chờ xác nhận"
          value={pendingOnPage.toLocaleString("vi-VN")}
          tone={pendingOnPage > 0 ? "amber" : "teal"}
        />
        <AdminMetricCard
          icon="mark_email_read"
          label="Đang xử lý"
          value={processingOnPage.toLocaleString("vi-VN")}
          tone="teal"
        />
      </div>

      <AdminToolbar>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => {
              setFilterStatus("");
              setPage(0);
            }}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              !filterStatus
                ? "text-white shadow-blue-glow"
                : "bg-white border border-surface-border text-text-secondary hover:border-brand-blue hover:text-brand-blue"
            }`}
            style={
              !filterStatus
                ? { background: "linear-gradient(135deg, #16a34a, #1d4ed8)" }
                : {}
            }
          >
            Tất cả ({totalElements})
          </button>
          {STATUS_LIST.map((statusKey) => {
            const info = ORDER_STATUS[statusKey] || {
              label: statusKey,
              color: "badge-blue",
            };
            const isActive = filterStatus === statusKey;
            return (
              <button
                key={statusKey}
                onClick={() => {
                  setFilterStatus(statusKey);
                  setPage(0);
                }}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                  isActive
                    ? "text-white shadow-blue-glow"
                    : "bg-white border border-surface-border text-text-secondary hover:border-brand-blue hover:text-brand-blue"
                }`}
                style={
                  isActive
                    ? { background: "linear-gradient(135deg, #16a34a, #1d4ed8)" }
                    : {}
                }
              >
                {info.label}
              </button>
            );
          })}
        </div>
      </AdminToolbar>

      <div className="flex flex-col xl:flex-row gap-6">
        <div className="flex-1 min-w-0">
          <OrderTable
            orders={orders}
            loading={loading}
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            selected={selected}
            onSelectOrder={setSelected}
            onDeleteOrder={setDeleteTarget}
            getOrderTotal={getOrderTotal}
          />
        </div>

        {selected && (
          <OrderDetailPanel
            selected={selected}
            onClose={() => setSelected(null)}
            updating={updating}
            sendingEmail={sendingEmail}
            onUpdateStatus={handleUpdateStatus}
            onSendEmail={handleSendEmail}
            getOrderTotal={getOrderTotal}
          />
        )}
      </div>

      {deleteTarget && (
        <ConfirmDialog
          title="Xác nhận xóa đơn hàng?"
          description={`Bạn sắp xóa đơn hàng #${String(
            deleteTarget.id
          ).padStart(6, "0")}. Hành động này không thể hoàn tác.`}
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
