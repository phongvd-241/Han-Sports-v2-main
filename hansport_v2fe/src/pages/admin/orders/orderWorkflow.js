export const STATUS_LIST = ["PENDING", "PROCESSING", "SHIPPING", "COMPLETED", "CANCELLED"];

export const ORDER_WORKFLOW = {
  PENDING: {
    allowedTransitions: ["PROCESSING", "CANCELLED"],
  },
  PROCESSING: {
    allowedTransitions: ["SHIPPING", "CANCELLED"],
  },
  SHIPPING: {
    allowedTransitions: ["COMPLETED", "CANCELLED"],
  },
  COMPLETED: {
    allowedTransitions: [],
  },
  CANCELLED: {
    allowedTransitions: [],
  },
};

/**
 * Lấy danh sách các trạng thái có thể chuyển sang từ trạng thái hiện tại.
 * @param {string} currentStatus Trạng thái hiện tại
 * @returns {string[]} Danh sách các trạng thái hợp lệ tiếp theo
 */
export function getAllowedTransitions(currentStatus) {
  if (!currentStatus) return [];
  const statusUpper = currentStatus.toUpperCase();
  return ORDER_WORKFLOW[statusUpper]?.allowedTransitions || [];
}

/**
 * Kiểm tra xem trạng thái hiện tại có phải trạng thái cuối cùng không (COMPLETED hoặc CANCELLED).
 * @param {string} status Trạng thái cần kiểm tra
 * @returns {boolean} True nếu là trạng thái cuối cùng
 */
export function isTerminalState(status) {
  if (!status) return false;
  const statusUpper = status.toUpperCase();
  const transitions = ORDER_WORKFLOW[statusUpper]?.allowedTransitions;
  return Array.isArray(transitions) && transitions.length === 0;
}
