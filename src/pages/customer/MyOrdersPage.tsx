import React, { useState, useEffect } from "react";
import { Truck, Package, Clock } from "lucide-react";
import { Order, OrderStatus } from "../../types";
import { orderService } from "../../services/orderService";
import { useAuth } from "../../contexts/AuthContext";
import { orderStatusInfo } from "../../utils/status";
import { fmt } from "../../utils/format";
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

  useEffect(() => {
    setLoading(true);
    orderService
      .getOrders(user?.id || 1)
      .then(setOrders)
      .finally(() => setLoading(false));
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
                <Card className="p-5 hover:shadow-md hover:border-blue-300 transition-all">
                  <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-slate-500">
                        #{order.id}
                      </span>
                      <span className="text-xs text-slate-300">•</span>
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Clock size={11} /> {order.createdAt}
                      </span>
                    </div>
                    <Badge
                      label={si.label}
                      color={si.color}
                      bg={si.bg}
                      icon={si.icon}
                    />
                  </div>

                  <div className="flex gap-4 items-center">
                    <div className="flex gap-1.5 shrink-0">
                      {order.items.slice(0, 2).map((item) => (
                        <BookCover
                          key={item.book.id}
                          book={item.book}
                          size="sm"
                        />
                      ))}
                      {order.items.length > 2 && (
                        <div className="w-14 h-20 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 text-xs font-bold">
                          +{order.items.length - 2}
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 line-clamp-1 group-hover:text-blue-600 transition-colors">
                        {order.items.map((i) => i.book.title).join(", ")}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        Shop: <strong className="text-slate-700">{order.shopName || "Nhà sách đối tác"}</strong> • {order.items.reduce((s, i) => s + i.quantity, 0)} cuốn sách
                      </p>
                      <p className="text-base font-extrabold text-blue-600 mt-2">
                        {fmt(order.totalAmount + order.shippingFee)}
                      </p>
                    </div>
                  </div>

                  {order.tracking && (
                    <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <Truck size={13} className="text-blue-600" />
                        <span>
                          Vận đơn:{" "}
                          <span className="font-mono font-bold text-slate-700">
                            {order.tracking.number}
                          </span>
                        </span>
                      </div>
                      <span className="text-[11px] text-blue-600 font-semibold group-hover:underline">
                        Xem chi tiết & theo dõi →
                      </span>
                    </div>
                  )}
                </Card>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
