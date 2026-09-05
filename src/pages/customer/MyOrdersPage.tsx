import React, { useState, useEffect, useRef } from "react";
import {
  Truck,
  Package,
  Clock,
  ChevronRight,
  Store,
  Copy,
  Check,
  XCircle,
  AlertTriangle,
  MessageSquare,
  Info,
} from "lucide-react";
import { Order, OrderStatus } from "../../types";
import { orderService } from "../../services/orderService";
import { signalRService } from "../../services/signalRService";
import { useAuth } from "../../contexts/AuthContext";
import { orderStatusInfo } from "../../utils/status";
import { fmt, formatOrderCode, formatOrderDate } from "../../utils/format";
import { Card } from "../../components/common/Card";
import { Badge } from "../../components/common/Badge";
import { Btn } from "../../components/common/Btn";
import { Modal } from "../../components/common/Modal";
import { BookCover } from "../../components/common/BookCover";

interface MyOrdersPageProps {
  onSelectOrder: (order: Order) => void;
  onOpenChat?: (shopId?: number | string) => void;
}

export const MyOrdersPage: React.FC<MyOrdersPageProps> = ({
  onSelectOrder,
  onOpenChat,
}) => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<"ALL" | OrderStatus>("ALL");
  const loadedUserIdRef = useRef<string | number | null>(null);

  // Modal hủy đơn PENDING
  const [orderToCancel, setOrderToCancel] = useState<Order | null>(null);
  const [cancelReason, setCancelReason] = useState("Đổi ý không muốn mua nữa");
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [cancelToast, setCancelToast] = useState<string | null>(null);

  // Modal hỗ trợ hủy đơn PROCESSING (liên hệ Shop)
  const [orderToContact, setOrderToContact] = useState<Order | null>(null);

  useEffect(() => {
    const currentUserId = user?.id || 1;
    if (loadedUserIdRef.current === currentUserId) return;
    loadedUserIdRef.current = currentUserId;

    setLoading(true);
    orderService
      .getOrders(currentUserId)
      .then(setOrders)
      .finally(() => setLoading(false));

    // Lắng nghe cập nhật trạng thái đơn hàng Realtime
    signalRService.startAppConnection();
    const unsubscribe = signalRService.onOrderStatusUpdated((payload) => {
      setOrders((prev) =>
        prev.map((o) =>
          String(o.id) === String(payload.orderId)
            ? { ...o, orderStatus: payload.newStatus as OrderStatus }
            : o
        )
      );
    });

    return () => {
      unsubscribe();
    };
  }, [user?.id]);

  const tabs: { key: "ALL" | OrderStatus; label: string }[] = [
    { key: "ALL", label: "Tất cả" },
    { key: "PENDING", label: "Chờ xác nhận" },
    { key: "PROCESSING", label: "Đang xử lý" },
    { key: "SHIPPED", label: "Đang giao" },
    { key: "DELIVERED", label: "Đã giao" },
    { key: "CANCELLED", label: "Đã hủy" },
    { key: "RETURNED", label: "Đổi trả" },
  ];

  const filteredOrders = orders.filter((o) =>
    statusFilter === "ALL" ? true : o.orderStatus === statusFilter
  );

  const handleConfirmCancel = async () => {
    if (!orderToCancel) return;
    setCancelling(true);
    setCancelError(null);

    try {
      await orderService.cancelOrder(orderToCancel.id, cancelReason);

      // Cập nhật state realtime ngay lập tức
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderToCancel.id
            ? {
                ...o,
                orderStatus: "CANCELLED" as OrderStatus,
              }
            : o
        )
      );

      setCancelToast(
        `Đã hủy thành công đơn hàng #${formatOrderCode(orderToCancel.id)}.`
      );
      setTimeout(() => setCancelToast(null), 5000);
      setOrderToCancel(null);
    } catch (err: any) {
      setCancelError(
        err.message ||
          "Không thể hủy đơn hàng này. Vui lòng kiểm tra lại trạng thái đơn."
      );
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      {/* Toast thông báo */}
      {cancelToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs animate-in fade-in duration-300">
          <Check size={16} className="text-emerald-400" />
          <span>{cancelToast}</span>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">
          Đơn hàng của tôi
        </h1>
        <span className="text-xs font-semibold text-slate-500 bg-slate-200/70 px-3 py-1 rounded-full">
          {orders.length} đơn hàng
        </span>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-thin">
        {tabs.map((t) => {
          const count =
            t.key === "ALL"
              ? orders.length
              : orders.filter((o) => o.orderStatus === t.key).length;
          return (
            <button
              key={t.key}
              onClick={() => setStatusFilter(t.key)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                statusFilter === t.key
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              <span>{t.label}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  statusFilter === t.key
                    ? "bg-white/20 text-white"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-32 bg-white rounded-2xl border border-slate-200 animate-pulse"
            />
          ))}
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
          <Package size={48} className="mx-auto mb-3 text-slate-300" />
          <h3 className="font-bold text-slate-700 text-base">
            Không có đơn hàng nào trong mục này
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Các đơn hàng bạn đã đặt sẽ xuất hiện tại đây để tiện theo dõi.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const si = orderStatusInfo(order.orderStatus);
            return (
              <div
                key={order.id}
                onClick={() => onSelectOrder(order)}
                className="w-full text-left cursor-pointer group block"
                role="button"
                tabIndex={0}
              >
                <Card className="p-5 hover:shadow-md hover:border-blue-300 transition-all rounded-2xl">
                  {/* Card Header: Mã đơn ngắn gọn & Thời gian chuẩn */}
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3.5 border-b border-slate-100 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-black text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-lg border border-blue-200">
                        {formatOrderCode(order.id)}
                      </span>
                      <span className="text-xs text-slate-300">•</span>
                      <span className="text-xs text-slate-500 flex items-center gap-1 font-medium">
                        <Clock size={12} className="text-slate-400" />
                        {formatOrderDate(order.createdAt)}
                      </span>
                    </div>
                    <Badge
                      label={si.label}
                      color={si.color}
                      bg={si.bg}
                      icon={si.icon}
                    />
                  </div>

                  {/* Danh sách sách trong đơn */}
                  <div className="space-y-3">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-3.5">
                        <div className="shrink-0 w-14 h-20 rounded-lg overflow-hidden shadow-2xs border border-slate-200 bg-slate-100 flex items-center justify-center">
                          {item.book.imageUrl ? (
                            <img
                              src={item.book.imageUrl}
                              alt={item.book.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <BookCover book={item.book} size="xs" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs sm:text-sm font-bold text-slate-800 line-clamp-1 group-hover:text-blue-600 transition-colors">
                            {item.book.title}
                          </p>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Số lượng: <span className="font-semibold text-slate-700">x{item.quantity}</span>
                            <span className="text-slate-300 mx-1.5">•</span>
                            <span>{fmt(item.unitPrice)}</span>
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Card Footer: Tổng tiền & Nút Hành động */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                    <div className="text-xs text-slate-500">
                      Tổng thanh toán:{" "}
                      <span className="text-sm sm:text-base font-black text-blue-700">
                        {fmt(order.totalAmount)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Nút hủy đơn hàng khi đơn PENDING */}
                      {order.orderStatus === "PENDING" && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOrderToCancel(order);
                            setCancelReason("Đổi ý không muốn mua nữa");
                            setCancelError(null);
                          }}
                          className="px-3 py-1.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <XCircle size={14} /> Hủy đơn
                        </button>
                      )}

                      {/* Nút hỗ trợ hủy khi đơn PROCESSING */}
                      {order.orderStatus === "PROCESSING" && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOrderToContact(order);
                          }}
                          className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-200 hover:bg-slate-50 text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <MessageSquare size={13} /> Yêu cầu hủy
                        </button>
                      )}

                      <div className="text-xs font-bold text-blue-600 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform ml-1">
                        <span>Xem chi tiết</span>
                        <ChevronRight size={14} />
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Hủy Đơn Hàng PENDING */}
      {orderToCancel && (
        <Modal
          isOpen={!!orderToCancel}
          onClose={() => !cancelling && setOrderToCancel(null)}
          title={`Xác nhận hủy đơn hàng #${formatOrderCode(orderToCancel.id)}`}
        >
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-3">
              <AlertTriangle size={20} className="shrink-0 text-amber-600 mt-0.5" />
              <div>
                <p className="font-bold mb-0.5">Lưu ý trước khi hủy:</p>
                <p className="text-amber-800 leading-relaxed">
                  Đơn hàng sẽ được hủy ngay lập tức. Hành động này không thể hoàn tác.
                </p>
              </div>
            </div>

            {cancelError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
                {cancelError}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Vui lòng chọn lý do hủy đơn:
              </label>
              <select
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                disabled={cancelling}
                className="w-full text-xs sm:text-sm border border-slate-200 rounded-xl px-3.5 py-2.5 bg-slate-50 focus:outline-none focus:border-blue-500 focus:bg-white"
              >
                <option value="Đổi ý không muốn mua nữa">Đổi ý không muốn mua nữa</option>
                <option value="Muốn thay đổi địa chỉ giao hàng">Muốn thay đổi địa chỉ giao hàng</option>
                <option value="Muốn đổi sách hoặc thêm mã giảm giá">Muốn đổi sách hoặc thêm mã giảm giá</option>
                <option value="Tìm thấy giá tốt hơn ở nơi khác">Tìm thấy giá tốt hơn ở nơi khác</option>
                <option value="Đặt nhầm sản phẩm / đơn hàng">Đặt nhầm sản phẩm / đơn hàng</option>
                <option value="Lý do khác">Lý do khác</option>
              </select>
            </div>

            <div className="flex gap-2 pt-2">
              <Btn
                onClick={handleConfirmCancel}
                disabled={cancelling}
                color="#dc2626"
                size="md"
                className="flex-1"
              >
                {cancelling ? "Đang xử lý..." : "Xác nhận hủy đơn"}
              </Btn>
              <Btn
                onClick={() => setOrderToCancel(null)}
                disabled={cancelling}
                variant="ghost"
                size="md"
              >
                Không hủy
              </Btn>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal Hướng dẫn Hủy đơn PROCESSING (Liên hệ Shop) */}
      {orderToContact && (
        <Modal
          isOpen={!!orderToContact}
          onClose={() => setOrderToContact(null)}
          title={`Yêu cầu hủy đơn hàng #${formatOrderCode(orderToContact.id)}`}
        >
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-xs text-blue-900 flex items-start gap-3">
              <Info size={20} className="shrink-0 text-blue-600 mt-0.5" />
              <div>
                <p className="font-bold mb-1">Đơn hàng đang trong quá trình chuẩn bị!</p>
                <p className="text-blue-800 leading-relaxed">
                  Đơn hàng của bạn đã được Người bán tiếp nhận và đang tiến hành đóng gói. Hệ thống không thể tự động hủy trực tiếp đơn hàng này.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-2">
              <p className="font-semibold text-slate-800">Bạn có thể xử lý theo 2 cách sau:</p>
              <ul className="list-disc pl-4 space-y-1.5 text-slate-600 leading-relaxed">
                <li>
                  <strong className="text-slate-800">Nhắn tin ngay cho Shop:</strong> Thông báo với Người bán để họ kịp thời hủy đơn.
                </li>
                <li>
                  <strong className="text-slate-800">Từ chối nhận khi giao:</strong> Nếu hàng đã bàn giao cho Shipper, bạn có thể từ chối nhận hàng khi Shipper liên hệ.
                </li>
              </ul>
            </div>

            <div className="flex gap-2 pt-2">
              {onOpenChat && (
                <Btn
                  onClick={() => {
                    const shopId = orderToContact.shopId || orderToContact.items[0]?.book?.shopId;
                    onOpenChat(shopId);
                    setOrderToContact(null);
                  }}
                  color="#1d4ed8"
                  size="md"
                  className="flex-1"
                >
                  <MessageSquare size={16} /> Nhắn tin cho Shop ngay
                </Btn>
              )}
              <Btn
                onClick={() => setOrderToContact(null)}
                variant="ghost"
                size="md"
                className={onOpenChat ? "" : "w-full"}
              >
                Đã hiểu
              </Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
