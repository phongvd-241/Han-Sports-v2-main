import DataTable from "../../../components/admin/DataTable";
import IconButton from "../../../components/admin/IconButton";
import StatusBadge from "../../../components/admin/StatusBadge";
import { formatVND, formatDate, ORDER_STATUS } from "../../../utils/constants";

const ORDER_COLUMNS = [
  { key: "id", label: "Mã đơn", className: "px-4 py-3 text-left" },
  { key: "customer", label: "Khách hàng", className: "px-4 py-3 text-left" },
  { key: "createdAt", label: "Ngày đặt", className: "px-4 py-3 text-left" },
  { key: "total", label: "Tổng tiền", className: "px-4 py-3 text-right" },
  { key: "status", label: "Trạng thái", className: "px-4 py-3 text-center" },
  { key: "actions", label: "Thao tác", className: "px-4 py-3 text-center" },
];

export default function OrderTable({
  orders,
  loading,
  page,
  totalPages,
  onPageChange,
  selected,
  onSelectOrder,
  onDeleteOrder,
  getOrderTotal,
}) {
  const renderOrderCard = (order) => {
    const isSelected = selected?.id === order.id;
    const status = ORDER_STATUS[order.status] || {
      label: order.status || "N/A",
      color: "badge-blue",
    };

    return (
      <div
        onClick={() => onSelectOrder(isSelected ? null : order)}
        className={`flex flex-col gap-2.5 cursor-pointer rounded-xl p-1.5 transition-colors ${
          isSelected ? "bg-brand-blue-light/30 border border-brand-blue/20" : ""
        }`}
      >
        {/* Hàng 1: Mã đơn hàng + Trạng thái */}
        <div className="flex justify-between items-center">
          <span className="font-extrabold text-brand-blue text-sm">
            #{String(order.id).padStart(6, "0")}
          </span>
          <StatusBadge label={status.label} className={`${status.color} text-[10px]`} />
        </div>

        {/* Hàng 2: Tên khách hàng + Ngày đặt */}
        <div className="flex flex-col gap-0.5 text-xs text-text-secondary">
          <p className="font-semibold text-text-primary text-sm">
            {order.receiverName || order.user?.fullName || "-"}
          </p>
          <p className="text-[11px] text-text-muted mt-0.5">
            Ngày đặt: {formatDate(order.createdAt)}
          </p>
        </div>

        {/* Hàng 3: Tổng tiền + Nút Action */}
        <div className="flex justify-between items-center pt-2 border-t border-surface-border border-dashed mt-1" onClick={(e) => e.stopPropagation()}>
          <div className="flex flex-col">
            <span className="text-[10px] text-text-muted">Tổng tiền</span>
            <span className="font-extrabold text-text-primary text-sm">
              {formatVND(getOrderTotal(order))}
            </span>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => onSelectOrder(order)}
              className="flex items-center gap-1 py-1.5 px-3 bg-brand-blue-light text-brand-blue rounded-xl text-xs font-bold hover:bg-brand-blue hover:text-white transition-colors"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>visibility</span>
              Chi tiết
            </button>
            <button
              onClick={() => onDeleteOrder(order)}
              className="flex items-center gap-1 py-1.5 px-3 bg-red-50 text-danger rounded-xl text-xs font-bold hover:bg-danger hover:text-white transition-colors"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>delete</span>
              Xóa
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <DataTable
      columns={ORDER_COLUMNS}
      loading={loading}
      isEmpty={orders.length === 0}
      emptyIcon="receipt_long"
      emptyTitle="Không có đơn hàng nào"
      page={page}
      totalPages={totalPages}
      onPageChange={onPageChange}
      mobileCardRenderer={renderOrderCard}
      items={orders}
    >
      {orders.map((order) => {
        const status = ORDER_STATUS[order.status] || {
          label: order.status || "N/A",
          color: "badge-blue",
        };
        const isSelected = selected?.id === order.id;
        return (
          <tr
            key={order.id}
            onClick={() => onSelectOrder(isSelected ? null : order)}
            className={`cursor-pointer transition-colors ${
              isSelected ? "bg-brand-blue-light" : "hover:bg-surface-soft"
            }`}
          >
            <td className="px-4 py-3 font-bold text-brand-blue">
              #{String(order.id).padStart(6, "0")}
            </td>
            <td className="px-4 py-3 text-text-primary">
              {order.receiverName || order.user?.fullName || "-"}
            </td>
            <td className="px-4 py-3 text-text-muted text-xs">
              {formatDate(order.createdAt)}
            </td>
            <td className="px-4 py-3 text-right font-semibold">
              {formatVND(getOrderTotal(order))}
            </td>
            <td className="px-4 py-3 text-center">
              <StatusBadge label={status.label} className={status.color} />
            </td>
            <td className="px-4 py-3">
              <div className="flex items-center justify-center gap-1">
                <IconButton
                  icon="visibility"
                  label="Xem chi tiết đơn hàng"
                  variant="primary"
                  onClick={(event) => {
                    event.stopPropagation();
                    onSelectOrder(order);
                  }}
                />
                <IconButton
                  icon="delete"
                  label="Xóa đơn hàng"
                  variant="danger"
                  onClick={(event) => {
                    event.stopPropagation();
                    onDeleteOrder(order);
                  }}
                />
              </div>
            </td>
          </tr>
        );
      })}
    </DataTable>
  );
}
