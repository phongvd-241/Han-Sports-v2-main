import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { orderApi } from "../../api/orderApi";
import { useCartStore } from "../../store/useCartStore";
import { useAuthStore } from "../../store/useAuthStore";
import { useSettingStore } from "../../store/useSettingStore";
import { getImageUrl, formatVND, getFirstImage } from "../../utils/constants";

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { cartItems, getTotal, selectedIds, removeSelectedItems } = useCartStore();
  const { getSetting } = useSettingStore();
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({
    receiverName: user?.fullName || "",
    receiverPhone: user?.phone || "",
    receiverAddress: user?.address || "",
    note: "",
  });

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    if (cartItems.length === 0 && !success) {
      navigate("/cart");
    }
  }, [user, cartItems.length, navigate, success]);

  // Synchronize user details (phone, address, name) into form once they load/change
  useEffect(() => {
    if (user) {
      setForm((prev) => ({
        ...prev,
        receiverName: prev.receiverName || user.fullName || user.name || "",
        receiverPhone: prev.receiverPhone || user.phone || "",
        receiverAddress: prev.receiverAddress || user.address || "",
      }));
    }
  }, [user]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await orderApi.createOrder({ ...form, cartDetailIds: selectedIds });
      removeSelectedItems();
      setSuccess(true);
    } catch (err) {
      toast.error(err.response?.data?.message || "Đặt hàng thất bại, vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  };

  const subtotal = getTotal();
  const freeShipLimit = parseInt(getSetting("FREE_SHIP_LIMIT", "500000"), 10);
  const baseShippingFee = parseInt(getSetting("SHIPPING_FEE", "30000"), 10);
  const shipping = subtotal >= freeShipLimit ? 0 : baseShippingFee;

  if (success) {
    return (
      <div className="min-h-screen bg-surface-soft flex items-center justify-center px-4">
        <div className="card p-10 max-w-md w-full text-center animate-fade-up">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse-green"
            style={{ background: "linear-gradient(135deg, #16a34a, #0d9488)" }}
          >
            <span className="material-symbols-outlined text-white" style={{ fontSize: 40, fontVariationSettings: "'FILL' 1" }}>
              check_circle
            </span>
          </div>
          <h2 className="text-title font-bold text-text-primary mb-2">Đặt hàng thành công!</h2>
          <p className="text-text-muted mb-8">
            Cảm ơn bạn đã mua hàng tại HAN SPORTS. Chúng tôi sẽ liên hệ xác nhận đơn trong thời gian sớm nhất.
          </p>
          <div className="flex flex-col gap-3">
            <button onClick={() => navigate("/orders")} className="btn-primary w-full py-3 rounded-xl">
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>receipt_long</span>
              Xem đơn hàng của tôi
            </button>
            <button onClick={() => navigate("/")} className="btn-ghost w-full py-3 rounded-xl border border-surface-border">
              Về trang chủ
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-soft py-10">
      <div className="max-w-[1280px] mx-auto px-4 md:px-6">
        <div className="mb-8 rounded-xl bg-admin-bg text-white overflow-hidden shadow-card">
          <div className="p-6 md:p-7 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-white/45">Hoàn tất đơn hàng</p>
              <h1 className="text-heading font-extrabold mt-1 flex items-center gap-3">
                <span className="material-symbols-outlined text-brand-green-light" style={{ fontSize: 32 }}>payment</span>
                Thanh toán
              </h1>
              <p className="text-sm text-white/65 mt-2">Kiểm tra thông tin giao hàng và xác nhận đơn COD.</p>
            </div>
            <div className="grid grid-cols-3 gap-2 min-w-0 lg:min-w-[360px]">
              {[
                { icon: "shopping_cart", label: "Giỏ hàng" },
                { icon: "local_shipping", label: "Giao hàng" },
                { icon: "check_circle", label: "Xác nhận" },
              ].map((step, index) => (
                <div key={step.label} className="rounded-xl bg-white/10 border border-white/10 p-3 text-center">
                  <span className="material-symbols-outlined text-brand-green-light" style={{ fontSize: 20 }}>{step.icon}</span>
                  <p className="text-[11px] font-bold mt-1">{index + 1}. {step.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 flex flex-col gap-6">
              <div className="card p-6 border-l-4 border-brand-blue/30">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-xl bg-brand-blue-light text-brand-blue flex items-center justify-center font-extrabold">1</div>
                  <div>
                    <h2 className="text-title font-bold text-text-primary">Thông tin giao hàng</h2>
                    <p className="text-xs text-text-muted">Thông tin này dùng để xác nhận và giao đơn.</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-text-secondary mb-2">Họ và tên *</label>
                    <input
                      name="receiverName"
                      required
                      value={form.receiverName}
                      onChange={handleChange}
                      placeholder="Nguyễn Văn A"
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-text-secondary mb-2">Số điện thoại *</label>
                    <input
                      name="receiverPhone"
                      required
                      value={form.receiverPhone}
                      onChange={handleChange}
                      placeholder="090 123 4567"
                      type="tel"
                      className="input-field"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-text-secondary mb-2">Địa chỉ giao hàng *</label>
                    <input
                      name="receiverAddress"
                      required
                      value={form.receiverAddress}
                      onChange={handleChange}
                      placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành"
                      className="input-field"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-text-secondary mb-2">Ghi chú tùy chọn</label>
                    <textarea
                      name="note"
                      value={form.note}
                      onChange={handleChange}
                      rows={3}
                      placeholder="Ghi chú cho đơn hàng"
                      className="input-field resize-none"
                    />
                  </div>
                </div>
              </div>

              <div className="card p-6 border-l-4 border-brand-green/30">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-xl bg-brand-green-light text-brand-green flex items-center justify-center font-extrabold">2</div>
                  <div>
                    <h2 className="text-title font-bold text-text-primary">Phương thức thanh toán</h2>
                    <p className="text-xs text-text-muted">Hiện tại hệ thống hỗ trợ COD để demo trung thực.</p>
                  </div>
                </div>
                <div className="flex flex-col gap-3">
                  <label className="flex items-center gap-3 p-4 border-2 rounded-xl border-brand-blue bg-brand-blue-light shadow-blue-glow">
                    <input type="radio" name="paymentMethod" value="COD" checked readOnly className="accent-brand-blue" />
                    <span className="material-symbols-outlined text-brand-blue" style={{ fontSize: 24 }}>payments</span>
                    <div>
                      <p className="font-semibold text-text-primary">Thanh toán khi nhận hàng (COD)</p>
                      <p className="text-xs text-text-muted">Thanh toán tiền mặt khi nhận được hàng</p>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="card sticky top-24 overflow-hidden">
                <div className="p-6 bg-surface border-b border-surface-border">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-brand-teal-light text-brand-teal flex items-center justify-center font-extrabold">3</div>
                    <div>
                      <h3 className="text-title font-bold text-text-primary">Đơn hàng</h3>
                      <p className="text-xs text-text-muted">{selectedIds.length} sản phẩm được chọn</p>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                <div className="flex flex-col gap-3 mb-5 max-h-60 overflow-y-auto hide-scrollbar">
                  {cartItems.filter((item) => selectedIds.includes(item.id)).map((item) => {
                    const product = item.product || item;
                    return (
                      <div key={item.id} className="flex gap-3 items-center">
                        <div className="w-14 h-14 rounded-lg bg-surface-muted flex-shrink-0 overflow-hidden">
                          {getFirstImage(product) && (
                            <img
                              src={getImageUrl(getFirstImage(product))}
                              alt={product.name}
                              className="w-full h-full object-contain p-1.5"
                            />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-text-primary line-clamp-2">{product.name}</p>
                          <p className="text-xs text-text-muted mt-0.5">x{item.quantity}</p>
                          {(item.selectedColor || item.selectedSize) && (
                            <p className="text-[11px] text-text-muted mt-0.5">
                              {[item.selectedColor && `Màu: ${item.selectedColor}`, item.selectedSize && `Size: ${item.selectedSize}`]
                                .filter(Boolean)
                                .join(" · ")}
                            </p>
                          )}
                        </div>
                        <span className="text-xs font-bold text-brand-blue flex-shrink-0">
                          {formatVND(product.price * item.quantity)}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div className="flex flex-col gap-2.5 pt-4 border-t border-surface-border text-sm">
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Tạm tính</span>
                    <span className="font-semibold">{formatVND(subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Vận chuyển</span>
                    <span className="font-semibold text-brand-green">{shipping === 0 ? "Miễn phí" : formatVND(shipping)}</span>
                  </div>
                </div>
                <div className="rounded-xl bg-admin-bg text-white p-4 mt-4 mb-6">
                  <div className="flex justify-between items-end">
                    <span className="font-bold">Tổng cộng</span>
                    <span className="text-2xl font-extrabold text-brand-green-light">{formatVND(subtotal + shipping)}</span>
                  </div>
                  <p className="text-xs text-white/55 mt-1">Đã bao gồm phí vận chuyển theo cấu hình hiện tại.</p>
                </div>
                <button
                  type="submit"
                  disabled={submitting || selectedIds.length === 0}
                  className="w-full btn-primary py-4 rounded-xl text-base disabled:opacity-60 active:scale-95 transition-transform"
                >
                  {submitting
                    ? <><span className="material-symbols-outlined animate-spin" style={{ fontSize: 18 }}>progress_activity</span> Đang xử lý...</>
                    : <><span className="material-symbols-outlined" style={{ fontSize: 20 }}>check_circle</span> Xác nhận đặt hàng</>
                  }
                </button>
                <p className="mt-3 text-center text-xs text-text-muted">Đơn hàng sẽ được xác nhận sau khi nhận thông tin.</p>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
