import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
    paymentMethod: "COD",
  });

  useEffect(() => {
    if (!user) { navigate("/login"); return; }
    if (cartItems.length === 0) { navigate("/cart"); return; }
  }, [user, cartItems]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const orderData = { ...form, cartDetailIds: selectedIds };
      if (form.paymentMethod === "VNPAY") {
        // Fake VNPay redirect
        alert("Chuyển hướng đến cổng thanh toán VNPay...");
        setTimeout(() => {
          removeSelectedItems();
          setSuccess(true);
        }, 1500);
      } else {
        await orderApi.createOrder(orderData);
        removeSelectedItems();
        setSuccess(true);
      }
    } catch (err) {
      alert(err.response?.data?.message || "Đặt hàng thất bại, vui lòng thử lại!");
    } finally {
      if (form.paymentMethod !== "VNPAY") {
        setSubmitting(false);
      }
    }
  };

  const subtotal = getTotal();
  const freeShipLimit = parseInt(getSetting("FREE_SHIP_LIMIT", "500000"), 10);
  const baseShippingFee = parseInt(getSetting("SHIPPING_FEE", "30000"), 10);
  const shipping = subtotal >= freeShipLimit ? 0 : baseShippingFee;

  if (success) return (
    <div className="min-h-screen bg-surface-soft flex items-center justify-center px-4">
      <div className="card p-10 max-w-md w-full text-center animate-fade-up">
        <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse-green" style={{ background: "linear-gradient(135deg, #16a34a, #0d9488)" }}>
          <span className="material-symbols-outlined text-white" style={{ fontSize: 40, fontVariationSettings: "'FILL' 1" }}>check_circle</span>
        </div>
        <h2 className="text-title font-bold text-text-primary mb-2">Đặt hàng thành công!</h2>
        <p className="text-text-muted mb-8">Cảm ơn bạn đã mua hàng tại HAN SPORTS. Chúng tôi sẽ liên hệ xác nhận đơn trong thời gian sớm nhất.</p>
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

  return (
    <div className="min-h-screen bg-surface-soft py-10">
      <div className="max-w-[1280px] mx-auto px-4 md:px-6">
        <h1 className="text-heading font-bold text-text-primary mb-8 flex items-center gap-3">
          <span className="material-symbols-outlined text-brand-blue" style={{ fontSize: 32 }}>payment</span>
          Thanh toán
        </h1>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Form bên trái */}
            <div className="lg:col-span-2 flex flex-col gap-6">
              {/* Thông tin giao hàng */}
              <div className="card p-6">
                <h2 className="text-title font-bold text-text-primary mb-5 flex items-center gap-2">
                  <span className="material-symbols-outlined text-brand-blue" style={{ fontSize: 24 }}>local_shipping</span>
                  Thông tin giao hàng
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-text-secondary mb-2">Họ và tên *</label>
                    <input name="receiverName" required value={form.receiverName} onChange={handleChange}
                      placeholder="Nguyễn Văn A" className="input-field" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-text-secondary mb-2">Số điện thoại *</label>
                    <input name="receiverPhone" required value={form.receiverPhone} onChange={handleChange}
                      placeholder="090 123 4567" type="tel" className="input-field" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-text-secondary mb-2">Địa chỉ giao hàng *</label>
                    <input name="receiverAddress" required value={form.receiverAddress} onChange={handleChange}
                      placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành" className="input-field" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-text-secondary mb-2">Ghi chú (tùy chọn)</label>
                    <textarea name="note" value={form.note} onChange={handleChange} rows={3}
                      placeholder="Ghi chú cho đơn hàng (ví dụ: giao trong giờ hành chính...)"
                      className="input-field resize-none" />
                  </div>
                </div>
              </div>

              {/* Phương thức thanh toán */}
              <div className="card p-6">
                <h2 className="text-title font-bold text-text-primary mb-5 flex items-center gap-2">
                  <span className="material-symbols-outlined text-brand-blue" style={{ fontSize: 24 }}>account_balance_wallet</span>
                  Phương thức thanh toán
                </h2>
                <div className="flex flex-col gap-3">
                  <label className={`flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all ${form.paymentMethod === 'COD' ? 'border-brand-blue bg-brand-blue-light' : 'border-surface-border bg-white hover:border-brand-blue/50'}`}>
                    <input type="radio" name="paymentMethod" value="COD" checked={form.paymentMethod === "COD"} onChange={handleChange} className="accent-brand-blue" />
                    <span className="material-symbols-outlined text-brand-blue" style={{ fontSize: 24 }}>payments</span>
                    <div>
                      <p className="font-semibold text-text-primary">Thanh toán khi nhận hàng (COD)</p>
                      <p className="text-xs text-text-muted">Thanh toán tiền mặt khi nhận được hàng</p>
                    </div>
                  </label>

                  <label className={`flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all ${form.paymentMethod === 'VNPAY' ? 'border-brand-blue bg-brand-blue-light' : 'border-surface-border bg-white hover:border-brand-blue/50'}`}>
                    <input type="radio" name="paymentMethod" value="VNPAY" checked={form.paymentMethod === "VNPAY"} onChange={handleChange} className="accent-brand-blue" />
                    <div className="w-8 h-8 rounded bg-white flex items-center justify-center p-0.5 border border-surface-border">
                      <span className="font-extrabold text-[#005BAA] text-[10px] tracking-tighter">VNPAY</span>
                    </div>
                    <div>
                      <p className="font-semibold text-text-primary">Thanh toán qua VNPay</p>
                      <p className="text-xs text-text-muted">Thẻ ATM, Visa, MasterCard, QR Code</p>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Order Summary bên phải */}
            <div className="lg:col-span-1">
              <div className="card p-6 sticky top-24">
                <h3 className="text-title font-bold text-text-primary mb-5">Đơn hàng ({selectedIds.length} sản phẩm)</h3>
                <div className="flex flex-col gap-3 mb-5 max-h-60 overflow-y-auto hide-scrollbar">
                  {cartItems.filter(i => selectedIds.includes(i.id)).map((item) => {
                    const p = item.product || item;
                    return (
                      <div key={item.id} className="flex gap-3 items-center">
                        <div className="w-14 h-14 rounded-lg bg-surface-muted flex-shrink-0 overflow-hidden">
                          {getFirstImage(p) && <img src={getImageUrl(getFirstImage(p))} alt={p.name} className="w-full h-full object-contain p-1.5" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-text-primary line-clamp-2">{p.name}</p>
                          <p className="text-xs text-text-muted mt-0.5">x{item.quantity}</p>
                        </div>
                        <span className="text-xs font-bold text-brand-blue flex-shrink-0">{formatVND(p.price * item.quantity)}</span>
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
                <div className="flex justify-between pt-4 mb-6 mt-2 border-t border-surface-border">
                  <span className="font-bold text-text-primary">Tổng cộng</span>
                  <span className="text-xl font-extrabold text-brand-blue">{formatVND(subtotal + shipping)}</span>
                </div>
                <button type="submit" disabled={submitting} className="w-full btn-primary py-4 rounded-xl text-base disabled:opacity-60 active:scale-95 transition-transform">
                  {submitting
                    ? <><span className="material-symbols-outlined animate-spin" style={{ fontSize: 18 }}>progress_activity</span> Đang xử lý...</>
                    : <><span className="material-symbols-outlined" style={{ fontSize: 20 }}>check_circle</span> Xác nhận đặt hàng</>
                  }
                </button>
                <p className="mt-3 text-center text-xs text-text-muted">🔒 Giao dịch được bảo mật tuyệt đối</p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}