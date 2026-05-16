import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { orderApi } from "../../api/orderApi";
import { useAuthStore } from "../../store/useAuthStore";
import { getImageUrl, formatVND, formatDate, ORDER_STATUS, getFirstImage } from "../../utils/constants";

export default function MyOrdersPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [activeFilter, setActiveFilter] = useState("ALL");

  const fetchOrders = () => {
    setLoading(true);
    orderApi.getMyOrders()
      .then((res) => {
        const data = res.data?.data?.result || res.data?.data || [];
        setOrders(Array.isArray(data) ? data : []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!user) { navigate("/login"); return; }
    fetchOrders();
  }, [user]);

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm("Bạn có chắc chắn muốn hủy đơn hàng này?")) return;
    try {
      await orderApi.deleteOrder(orderId);
      fetchOrders();
    } catch (e) {
      alert("Hủy đơn hàng thất bại, vui lòng thử lại!");
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-surface-soft py-10 flex flex-col items-center justify-center">
      <div className="w-12 h-12 rounded-full border-4 border-brand-blue border-t-transparent animate-spin mb-4" />
      <p className="text-text-muted font-medium">Đang tải đơn hàng...</p>
    </div>
  );

  const filters = [
    { key: "ALL", label: "Tất cả" },
    { key: "PENDING", label: "Chờ xác nhận" },
    { key: "CONFIRMED", label: "Đã xác nhận" },
    { key: "SHIPPING", label: "Đang giao" },
    { key: "COMPLETED", label: "Hoàn thành" },
    { key: "CANCELLED", label: "Đã hủy" },
  ];

  const filteredOrders = activeFilter === "ALL"
    ? orders
    : orders.filter(o => o.status === activeFilter);

  return (
    <div className="min-h-screen bg-surface-soft py-8 md:py-12">
      <div className="max-w-[1000px] mx-auto px-4 md:px-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <h1 className="text-heading font-bold text-text-primary flex items-center gap-3">
            <span className="material-symbols-outlined text-brand-blue" style={{ fontSize: 32 }}>receipt_long</span>
            Đơn hàng của tôi
          </h1>
          <Link to="/shop" className="text-brand-blue font-bold text-sm hover:underline flex items-center gap-1.5">
            Tiếp tục mua sắm
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_forward</span>
          </Link>
        </div>

        {/* Status Filters */}
        <div className="flex overflow-x-auto gap-2 mb-8 pb-2 hide-scrollbar">
          {filters.map(f => (
            <button
              key={f.key}
              onClick={() => setActiveFilter(f.key)}
              className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all whitespace-nowrap border-2 ${activeFilter === f.key
                  ? "bg-brand-blue border-brand-blue text-white shadow-lg shadow-brand-blue/20"
                  : "bg-white border-surface-border text-text-muted hover:border-brand-blue/50"
                }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {filteredOrders.length === 0 ? (
          <div className="card p-16 text-center bg-white/50 backdrop-blur-sm border-dashed border-2">
            <div className="w-20 h-20 rounded-full bg-brand-blue-light flex items-center justify-center mx-auto mb-5">
              <span className="material-symbols-outlined text-brand-blue" style={{ fontSize: 40 }}>shopping_bag</span>
            </div>
            <h3 className="text-title font-bold text-text-primary mb-2">Không tìm thấy đơn hàng</h3>
            <p className="text-text-muted mb-8 max-w-sm mx-auto">Bạn chưa có đơn hàng nào ở trạng thái này. Hãy khám phá ngay các sản phẩm mới nhất!</p>
            <Link to="/shop" className="btn-primary py-3.5 px-10 rounded-xl">Khám phá sản phẩm</Link>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {filteredOrders.map((order) => {
              const status = ORDER_STATUS[order.status] || { label: order.status, color: "badge-blue" };
              const isExpanded = expanded === order.id;
              const items = order.orderDetails || [];
              const orderTotal = order.totalPrice || items.reduce((s, i) => s + (i.price || 0) * (i.quantity || 0), 0);

              return (
                <div key={order.id} className={`card overflow-hidden transition-all duration-500 border-2 ${isExpanded ? "border-brand-blue/30 shadow-xl" : "border-transparent"}`}>
                  {/* Order Header */}
                  <div
                    className="px-6 py-5 flex items-center justify-between cursor-pointer hover:bg-surface-muted transition-colors"
                    onClick={() => setExpanded(isExpanded ? null : order.id)}
                  >
                    <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 items-center">
                      <div>
                        <p className="text-[10px] uppercase font-bold text-text-muted tracking-wider mb-1">Mã đơn hàng</p>
                        <p className="font-black text-brand-blue text-sm">#{String(order.id).padStart(6, "0")}</p>
                      </div>
                      <div className="hidden md:block">
                        <p className="text-[10px] uppercase font-bold text-text-muted tracking-wider mb-1">Ngày đặt</p>
                        <p className="font-semibold text-text-primary text-sm">{formatDate(order.createdAt)}</p>
                      </div>
                      <div className="hidden md:block">
                        <p className="text-[10px] uppercase font-bold text-text-muted tracking-wider mb-1">Sản phẩm</p>
                        <p className="font-semibold text-text-primary text-sm">{items.length} món</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-text-muted tracking-wider mb-1">Tổng cộng</p>
                        <p className="font-black text-brand-green text-sm">{formatVND(orderTotal)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 ml-4">
                      <span className={`${status.color} px-3 py-1 rounded-pill text-[10px] font-black uppercase tracking-wider`}>
                        {status.label}
                      </span>
                      <span className={`material-symbols-outlined text-text-muted transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`}>
                        expand_more
                      </span>
                    </div>
                  </div>

                  {/* Order Details Container */}
                  <div className={`transition-all duration-500 ease-in-out ${isExpanded ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"} overflow-hidden`}>
                    <div className="border-t border-surface-border px-6 py-6 bg-surface-soft/50 backdrop-blur-sm">
                      {/* Grid Layout for Details */}
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Items List */}
                        <div className="lg:col-span-2 space-y-3">
                          <p className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-4">Danh sách hàng</p>
                          {items.map((item, idx) => {
                            const p = item.product || {};
                            return (
                              <div key={idx} className="flex gap-4 items-center p-3 bg-white rounded-2xl border border-surface-border hover:border-brand-blue/20 transition-all group/item">
                                <div className="w-16 h-16 rounded-xl bg-surface-muted flex-shrink-0 overflow-hidden">
                                  {getFirstImage(p) && <img src={getImageUrl(getFirstImage(p))} alt={p.name} className="w-full h-full object-contain p-2 group-hover/item:scale-110 transition-transform" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-bold text-text-primary line-clamp-1 group-hover/item:text-brand-blue transition-colors">
                                    {p.name || item.productName}
                                  </p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="text-xs text-text-muted">Số lượng: {item.quantity}</span>
                                    <span className="w-1 h-1 rounded-full bg-surface-border" />
                                    <span className="text-xs text-text-muted">{formatVND(item.price)}</span>
                                  </div>
                                </div>
                                <span className="font-black text-brand-blue text-sm">{formatVND(item.price * item.quantity)}</span>
                              </div>
                            );
                          })}
                        </div>

                        {/* Summary & Shipping Info */}
                        <div className="space-y-4">
                          <div className="p-5 bg-white rounded-2xl border border-surface-border shadow-sm">
                            <p className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-4">Thông tin nhận hàng</p>
                            <div className="space-y-3 text-sm">
                              <div className="flex items-start gap-3">
                                <span className="material-symbols-outlined text-brand-blue" style={{ fontSize: 18 }}>person</span>
                                <div>
                                  <p className="font-bold text-text-primary leading-none">{order.receiverName}</p>
                                  <p className="text-xs text-text-muted mt-1">{order.receiverPhone}</p>
                                </div>
                              </div>
                              <div className="flex items-start gap-3">
                                <span className="material-symbols-outlined text-brand-green" style={{ fontSize: 18 }}>location_on</span>
                                <p className="text-text-secondary leading-snug">{order.receiverAddress}</p>
                              </div>
                              {order.note && (
                                <div className="flex items-start gap-3 mt-4 pt-4 border-t border-surface-border italic text-xs text-text-muted">
                                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>edit_note</span>
                                  <p>Ghi chú: {order.note}</p>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex flex-col gap-2">
                            {order.status === "PENDING" && (
                              <button
                                onClick={(e) => { e.stopPropagation(); handleCancelOrder(order.id); }}
                                className="w-full py-3 bg-red-50 text-red-600 rounded-xl text-xs font-black hover:bg-red-100 transition-all flex items-center justify-center gap-2"
                              >
                                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>cancel</span>
                                HỦY ĐƠN HÀNG
                              </button>
                            )}
                            <button className="w-full py-3 bg-surface-muted text-text-secondary rounded-xl text-xs font-black hover:bg-brand-blue hover:text-white transition-all flex items-center justify-center gap-2">
                              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>support_agent</span>
                              CẦN HỖ TRỢ?
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}