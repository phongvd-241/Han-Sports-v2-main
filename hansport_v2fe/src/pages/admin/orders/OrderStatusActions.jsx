import { ORDER_STATUS } from "../../../utils/constants";
import { getAllowedTransitions, STATUS_LIST } from "./orderWorkflow";

export default function OrderStatusActions({
  order,
  updating,
  sendingEmail,
  onUpdateStatus,
  onSendEmail,
}) {
  if (!order) return null;

  const currentStatus = order.status;
  const allowedTransitions = getAllowedTransitions(currentStatus);

  return (
    <div className="mt-4 pt-4 border-t border-surface-border">
      <p className="text-xs font-semibold text-text-muted mb-2 uppercase tracking-wide">
        Cập nhật trạng thái
      </p>

      {/* Cảnh báo UI Guard */}
      <div className="bg-amber-50 text-amber-800 border border-amber-200 rounded-xl p-2.5 mb-3 text-xs flex items-start gap-1.5 leading-relaxed">
        <span className="material-symbols-outlined shrink-0 text-amber-600" style={{ fontSize: 16 }}>
          info
        </span>
        <span>
          Lưu ý: Đây là ràng buộc trên giao diện (UI guard), hệ thống chưa bắt buộc quy trình này ở backend.
        </span>
      </div>

      <div className="flex flex-col gap-2">
        {STATUS_LIST.map((statusKey) => {
          const info = ORDER_STATUS[statusKey] || { label: statusKey };
          const isCurrent = currentStatus === statusKey;
          const isAllowed = allowedTransitions.includes(statusKey);

          // Nếu là trạng thái hiện tại hoặc trạng thái được phép chuyển đổi
          if (isCurrent || isAllowed) {
            return (
              <button
                key={statusKey}
                disabled={isCurrent || updating}
                onClick={() => onUpdateStatus(order, statusKey)}
                className={`py-2 px-3 rounded-xl text-sm font-semibold transition-all border flex items-center justify-center gap-1.5 ${
                  isCurrent
                    ? "text-white border-transparent cursor-default font-bold"
                    : "bg-white border-surface-border text-text-secondary hover:border-brand-blue hover:text-brand-blue disabled:opacity-50"
                }`}
                style={isCurrent ? { background: "linear-gradient(135deg, #16a34a, #1d4ed8)" } : {}}
              >
                {isCurrent && (
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                    check
                  </span>
                )}
                {info.label}
              </button>
            );
          }

          // Không render các button cho những trạng thái không được phép chuyển tới
          return null;
        })}
      </div>

      {/* Nút gửi email thủ công */}
      <div className="mt-3 pt-3 border-t border-surface-border border-dashed">
        <button
          disabled={sendingEmail}
          onClick={() => onSendEmail(order.id)}
          className="w-full py-2 px-3 bg-surface-soft border border-surface-border text-text-primary rounded-xl text-sm font-semibold hover:bg-brand-blue-light hover:text-brand-blue hover:border-brand-blue transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
            mail
          </span>
          {sendingEmail ? "Đang gửi email..." : "Gửi email đơn hàng"}
        </button>
      </div>
    </div>
  );
}
