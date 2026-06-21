import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { orderApi } from "../../../api/orderApi";

export default function useOrdersAdmin() {
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
  const [sendingEmail, setSendingEmail] = useState(false);

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

  const handleSendEmail = async (orderId) => {
    setSendingEmail(true);
    try {
      await orderApi.sendOrderEmail(orderId);
      toast.success("Đã gửi email đơn hàng thành công.");
    } catch (e) {
      console.error("Gửi email thất bại", e);
      toast.error("Gửi email thất bại.");
    } finally {
      setSendingEmail(false);
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

  return {
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
  };
}
