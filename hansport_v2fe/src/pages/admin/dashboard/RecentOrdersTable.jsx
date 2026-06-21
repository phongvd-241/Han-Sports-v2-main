import { Link } from "react-router-dom";
import DataTable from "../../../components/admin/DataTable";
import EmptyState from "../../../components/admin/EmptyState";
import StatusBadge from "../../../components/admin/StatusBadge";
import { formatVND, formatDate, ORDER_STATUS } from "../../../utils/constants";

const RECENT_ORDER_COLUMNS = [
  { key: "id", label: "Mã đơn", className: "px-5 py-3 text-left font-semibold" },
  { key: "customer", label: "Khách hàng", className: "px-5 py-3 text-left font-semibold" },
  { key: "createdAt", label: "Ngày đặt", className: "px-5 py-3 text-left font-semibold" },
  { key: "total", label: "Tổng tiền", className: "px-5 py-3 text-right font-semibold" },
  { key: "status", label: "Trạng thái", className: "px-5 py-3 text-center font-semibold" },
];

export default function RecentOrdersTable({ recentOrders, loading }) {
  return (
    <div className="card overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <div className="px-5 py-4 border-b border-surface-border flex items-center justify-between">
        <h3 className="text-lg font-bold text-text-primary">Đơn hàng gần đây</h3>
        <Link
          to="/admin/orders"
          className="text-sm font-semibold text-brand-blue hover:text-brand-blue-dark flex items-center gap-1 transition-colors"
        >
          Xem tất cả{" "}
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
            arrow_forward
          </span>
        </Link>
      </div>

      {loading ? (
        <div className="p-5 flex flex-col gap-3">
          {[...Array(4)].map((_, index) => (
            <div key={index} className="skeleton h-12 rounded-lg" />
          ))}
        </div>
      ) : recentOrders.length === 0 ? (
        <EmptyState
          icon="receipt_long"
          title="Chưa có đơn hàng nào"
          className="py-12 border-none bg-transparent"
        />
      ) : (
        <DataTable columns={RECENT_ORDER_COLUMNS} framed={false}>
          {recentOrders.map((order) => {
            const status = ORDER_STATUS[order.status] || {
              label: order.status || "N/A",
              color: "badge-blue",
            };
            return (
              <tr
                key={order.id}
                className="hover:bg-surface-soft transition-colors duration-150"
              >
                <td className="px-5 py-4 font-bold text-brand-blue">
                  <Link
                    to="/admin/orders"
                    className="hover:underline hover:text-brand-blue-dark"
                  >
                    #{String(order.id).padStart(6, "0")}
                  </Link>
                </td>
                <td className="px-5 py-4 text-text-primary font-medium">
                  {order.receiverName || order.user?.fullName || order.user?.name || "-"}
                </td>
                <td className="px-5 py-4 text-text-muted text-xs">
                  {formatDate(order.createdAt)}
                </td>
                <td className="px-5 py-4 text-right font-semibold text-text-primary">
                  {formatVND(order.totalPrice || order.total || 0)}
                </td>
                <td className="px-5 py-4 text-center">
                  <StatusBadge label={status.label} className={status.color} />
                </td>
              </tr>
            );
          })}
        </DataTable>
      )}
    </div>
  );
}
