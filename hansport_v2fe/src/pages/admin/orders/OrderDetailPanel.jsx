import IconButton from "../../../components/admin/IconButton";
import { formatVND } from "../../../utils/constants";
import OrderStatusActions from "./OrderStatusActions";

export default function OrderDetailPanel({
  selected,
  onClose,
  updating,
  sendingEmail,
  onUpdateStatus,
  onSendEmail,
  getOrderTotal,
}) {
  if (!selected) return null;

  return (
    <div className="w-full xl:w-80 flex-shrink-0 animate-fade-up">
      <div className="card p-5 xl:sticky xl:top-24">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-text-primary">
            Chi tiết đơn #{String(selected.id).padStart(6, "0")}
          </h3>
          <IconButton
            icon="close"
            label="Đóng chi tiết đơn hàng"
            onClick={onClose}
          />
        </div>

        <div className="bg-brand-blue-light rounded-xl p-4 mb-4 text-sm">
          <p className="font-semibold text-brand-blue mb-2 flex items-center gap-1.5">
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
              local_shipping
            </span>
            Giao hàng tới
          </p>
          <p className="text-text-primary font-medium">
            {selected.receiverName} - {selected.receiverPhone}
          </p>
          <p className="text-text-secondary text-xs mt-1">
            {selected.receiverAddress}
          </p>
          {selected.note && (
            <p className="text-text-muted text-xs italic mt-1">
              "{selected.note}"
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2 mb-4 max-h-48 overflow-y-auto hide-scrollbar">
          {(selected.orderDetails || []).map((item, index) => (
            <div
              key={index}
              className="flex items-start gap-2 text-xs bg-surface-muted rounded-lg p-2"
            >
              <div className="flex-1 min-w-0">
                <span className="font-medium text-text-primary line-clamp-1">
                  {item.product?.name || item.productName || "SP"}
                </span>
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
              <span className="font-bold text-brand-blue mt-0.5">
                {formatVND(item.price * item.quantity)}
              </span>
            </div>
          ))}
        </div>

        <div className="flex justify-between font-bold text-sm pt-3 border-t border-surface-border mb-4">
          <span>Tổng cộng</span>
          <span className="text-brand-blue">
            {formatVND(getOrderTotal(selected))}
          </span>
        </div>

        <OrderStatusActions
          order={selected}
          updating={updating}
          sendingEmail={sendingEmail}
          onUpdateStatus={onUpdateStatus}
          onSendEmail={onSendEmail}
        />
      </div>
    </div>
  );
}
