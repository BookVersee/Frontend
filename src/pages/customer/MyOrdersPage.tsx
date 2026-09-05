import React, { useState, useEffect, useRef } from "react";
import { Truck, Package, Clock, ChevronRight, Store, Copy, Check } from "lucide-react";
import { Order, OrderStatus } from "../../types";
import { orderService } from "../../services/orderService";
import { signalRService } from "../../services/signalRService";
import { useAuth } from "../../contexts/AuthContext";
import { orderStatusInfo } from "../../utils/status";
import { fmt, formatOrderCode, formatOrderDate } from "../../utils/format";
import { Card } from "../../components/common/Card";
import { Badge } from "../../components/common/Badge";
import { BookCover } from "../../components/common/BookCover";

interface MyOrdersPageProps {
  onSelectOrder: (order: Order) => void;
}

export const MyOrdersPage: React.FC<MyOrdersPageProps> = ({
  onSelectOrder,
}) => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<"ALL" | OrderStatus>("ALL");
  const loadedUserIdRef = useRef<string | number | null>(null);

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

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
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
              <button
                key={order.id}
                onClick={() => onSelectOrder(order)}
                className="w-full text-left cursor-pointer group"
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

                  {/* Card Footer: Tổng tiền & Xem chi tiết */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div className="text-xs text-slate-500">
                      Tổng thanh toán:{" "}
                      <span className="text-sm sm:text-base font-black text-blue-700">
                        {fmt(order.totalAmount)}
                      </span>
                    </div>
                    <div className="text-xs font-bold text-blue-600 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                      <span>Xem chi tiết</span>
                      <ChevronRight size={14} />
                    </div>
                  </div>
                </Card>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
