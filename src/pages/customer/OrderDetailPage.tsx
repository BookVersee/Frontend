import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  Check,
  Star,
  RefreshCw,
  Clock,
  ShieldCheck,
  XCircle,
  AlertTriangle,
  CornerDownRight,
  Truck,
  BellRing,
} from "lucide-react";
import { Order, DeliveryStatus } from "../../types";
import { orderStatusInfo } from "../../utils/status";
import { fmt, formatOrderCode, formatOrderDate } from "../../utils/format";
import { Card } from "../../components/common/Card";
import { Badge } from "../../components/common/Badge";
import { Btn } from "../../components/common/Btn";
import { BookCover } from "../../components/common/BookCover";
import { orderService } from "../../services/orderService";
import { signalRService } from "../../services/signalRService";
import { useAuth } from "../../contexts/AuthContext";

interface OrderDetailPageProps {
  order: Order;
  onBack: () => void;
}

export const OrderDetailPage: React.FC<OrderDetailPageProps> = ({
  order: initialOrder,
  onBack,
}) => {
  const { user } = useAuth();
  const [order, setOrder] = useState<Order>(initialOrder);
  const [showReview, setShowReview] = useState(false);
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [reviewed, setReviewed] = useState(!!order.feedback);
  const [realtimeUpdateBanner, setRealtimeUpdateBanner] = useState<string | null>(null);

  // Lắng nghe cập nhật trạng thái đơn hàng & Vận chuyển Realtime qua SignalR
  useEffect(() => {
    if (!order?.id) return;
    const orderIdStr = String(order.id);

    signalRService.joinOrder(orderIdStr);

    const unsubscribe = signalRService.onOrderStatusUpdated((payload) => {
      if (String(payload.orderId) === orderIdStr) {
        setOrder((prev) => {
          let updatedTracking = prev.tracking;
          if (updatedTracking) {
            if (payload.newStatus === "DELIVERING") {
              updatedTracking = { ...updatedTracking, status: "TRANSIT" };
            } else if (payload.newStatus === "DELIVERED") {
              updatedTracking = { ...updatedTracking, status: "DELIVERED" };
            }
          }
          return {
            ...prev,
            orderStatus: payload.newStatus as any,
            tracking: updatedTracking,
          };
        });

        setRealtimeUpdateBanner(
          payload.message || `Trạng thái đơn hàng vừa được cập nhật: ${payload.newStatus}`
        );
        setTimeout(() => setRealtimeUpdateBanner(null), 8000);
      }
    });

    return () => {
      signalRService.leaveOrder(orderIdStr);
      unsubscribe();
    };
  }, [order?.id]);

  // Return modal / inputs
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnReason, setReturnReason] = useState("");
  const [returnReasonType, setReturnReasonType] = useState("DAMAGED");
  const [evidenceUrl, setEvidenceUrl] = useState("");

  // Cancel order modal
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("Đổi ý không muốn mua nữa");

  const si = orderStatusInfo(order.orderStatus);
  const steps = ["Chờ lấy hàng", "Đang vận chuyển", "Đang giao", "Đã giao"];
  const deliveryStages: DeliveryStatus[] = [
    "PENDING",
    "TRANSIT",
    "OUT_FOR_DELIVERY",
    "DELIVERED",
  ];
  const currentStep = order.tracking
    ? deliveryStages.indexOf(order.tracking.status)
    : -1;

  const handleCancelOrder = async () => {
    await orderService.cancelOrder(order.id, cancelReason);
    setOrder((prev) => ({
      ...prev,
      orderStatus: "CANCELLED",
      paymentStatus: prev.paymentStatus === "PAID" ? "REFUNDED" : "UNPAID",
    }));
    setShowCancelModal(false);
  };

  const handleSubmitReview = async () => {
    if (!reviewText) return;
    await orderService.addFeedback(
      order.id,
      rating,
      reviewText,
      user?.name || order.customerName
    );
    setOrder((prev) => ({
      ...prev,
      feedback: {
        rating,
        content: reviewText,
        type: "SHOP",
        createdAt: new Date().toISOString().split("T")[0],
        customer: user?.name || order.customerName,
      },
    }));
    setReviewed(true);
    setShowReview(false);
  };

  const handleRequestReturn = async () => {
    if (!returnReason) return;
    await orderService.requestReturn(order.id, returnReason, returnReasonType, evidenceUrl);
    setOrder((prev) => ({
      ...prev,
      returnRequest: {
        reason: returnReason,
        reasonType: returnReasonType,
        status: "PENDING",
        disputeStatus: "OPEN",
        refundAmount: prev.totalAmount,
        createdAt: new Date().toISOString().split("T")[0],
        evidenceImage: evidenceUrl || "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400",
      },
    }));
    setShowReturnModal(false);
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 mb-6 transition-colors font-medium cursor-pointer"
      >
        <ArrowLeft size={16} /> Danh sách đơn hàng
      </button>

      {/* Real-time Order Status Update Banner */}
      {realtimeUpdateBanner && (
        <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white shadow-lg shadow-blue-900/20 flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-3 duration-300">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0 animate-bounce">
              <Truck size={18} className="text-white" />
            </div>
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-blue-200">
                CẬP NHẬT TRẠNG THÁI REALTIME
              </p>
              <p className="text-xs sm:text-sm font-bold text-white mt-0.5">
                {realtimeUpdateBanner}
              </p>
            </div>
          </div>
          <button
            onClick={() => setRealtimeUpdateBanner(null)}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0"
            title="Đóng"
          >
            <XCircle size={16} />
          </button>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">
              Chi tiết đơn hàng
            </h1>
            <span className="font-mono text-base font-black text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-lg border border-blue-200">
              {formatOrderCode(order.id)}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1.5 flex items-center gap-1.5 font-medium">
            <Clock size={13} className="text-slate-400" />
            <span>Thời gian đặt: <strong>{formatOrderDate(order.createdAt)}</strong></span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge label={si.label} color={si.color} bg={si.bg} icon={si.icon} />
          {order.orderStatus === "PENDING" && (
            <Btn
              variant="outline"
              size="sm"
              onClick={() => setShowCancelModal(true)}
              className="text-red-600 hover:border-red-400"
            >
              <XCircle size={14} /> Hủy đơn hàng
            </Btn>
          )}
        </div>
      </div>

      {/* GHN Shipping Tracker */}
      {order.tracking && order.orderStatus !== "CANCELLED" && (
        <Card className="p-6 mb-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Theo dõi lộ trình giao hàng (GHN Express)
            </p>
            <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg">
              {order.tracking.number}
            </span>
          </div>
          <p className="text-xs text-slate-400 mb-6">
            Đơn vị vận chuyển:{" "}
            <span className="text-slate-700 font-semibold">
              {order.tracking.carrier}
            </span>{" "}
            • Dự kiến giao:{" "}
            <span className="text-slate-700 font-semibold">
              {order.tracking.estimated}
            </span>
            {order.tracking.note && (
              <span className="block mt-1 text-slate-500">
                Ghi chú: {order.tracking.note}
              </span>
            )}
          </p>

          <div className="flex items-center">
            {steps.map((step, i) => (
              <div key={step} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center transition-all shadow-2xs"
                    style={{
                      backgroundColor: i <= currentStep ? "#1d4ed8" : "#e2e8f0",
                    }}
                  >
                    {i <= currentStep ? (
                      <Check size={14} className="text-white" />
                    ) : (
                      <div className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                    )}
                  </div>
                  <p
                    className="text-[11px] font-semibold mt-2 text-center"
                    style={{
                      color: i <= currentStep ? "#1d4ed8" : "#94a3b8",
                      maxWidth: 64,
                    }}
                  >
                    {step}
                  </p>
                </div>
                {i < steps.length - 1 && (
                  <div
                    className="flex-1 h-1 mb-6 mx-1.5 rounded-full transition-all"
                    style={{
                      backgroundColor: i < currentStep ? "#1d4ed8" : "#e2e8f0",
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Items Breakdown */}
      <Card className="p-6 mb-5">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">
          Danh sách sách trong đơn
        </p>
        <div className="space-y-3">
          {order.items.map((item) => (
            <div
              key={item.book.id}
              className="flex items-center gap-4 border-b border-slate-100 last:border-0 pb-3 last:pb-0"
            >
              <div className="w-12 shrink-0">
                <BookCover book={item.book} size="sm" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 line-clamp-1">
                  {item.book.title}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {item.book.author} • Số lượng:{" "}
                  <span className="font-bold text-slate-700">×{item.quantity}</span>
                </p>
              </div>
              <span className="text-sm font-bold text-slate-800">
                {fmt(item.unitPrice * item.quantity)}
              </span>
            </div>
          ))}
        </div>

        <div className="border-t border-slate-100 mt-4 pt-4 space-y-2 text-xs text-slate-600">
          <div className="flex justify-between">
            <span>Tiền hàng</span>
            <span className="font-semibold text-slate-800">
              {fmt(order.totalAmount)}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Phí vận chuyển (GHN)</span>
            <span className="font-semibold text-slate-800">
              {fmt(order.shippingFee)}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Hình thức thanh toán</span>
            <span className="font-bold text-blue-600">
              {order.paymentMethod === "ONLINE"
                ? "Trực tuyến (VNPAY/MoMo)"
                : "Thanh toán khi nhận (COD)"}
            </span>
          </div>
          <div className="border-t border-slate-100 pt-3 flex justify-between font-bold text-slate-900 text-sm">
            <span>Tổng cộng thanh toán</span>
            <span className="text-blue-600 text-base">
              {fmt(order.totalAmount + order.shippingFee)}
            </span>
          </div>
        </div>
      </Card>

      {/* Review Section */}
      {order.orderStatus === "DELIVERED" && (
        <Card className="p-6 mb-5">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">
            Đánh giá sản phẩm & Dịch vụ shop
          </p>

          {reviewed || order.feedback ? (
            <div className="p-4 bg-amber-50/60 rounded-2xl border border-amber-200 space-y-3">
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      size={16}
                      fill={
                        s <= (order.feedback?.rating ?? rating)
                          ? "#f59e0b"
                          : "none"
                      }
                      stroke={
                        s <= (order.feedback?.rating ?? rating)
                          ? "none"
                          : "#cbd5e1"
                      }
                    />
                  ))}
                  <span className="text-xs font-bold text-amber-800 ml-2">
                    Đã gửi đánh giá
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                  "{order.feedback?.content ?? reviewText}"
                </p>
              </div>

              {/* Shop Reply in Order Detail */}
              {order.feedback?.shopReply && (
                <div className="mt-3 p-3 bg-white rounded-xl border border-emerald-200">
                  <span className="text-[11px] font-bold text-emerald-800 flex items-center gap-1 mb-1">
                    <CornerDownRight size={12} /> Phản hồi từ {order.shopName || "Nhà sách"}
                  </span>
                  <p className="text-xs text-slate-600 italic">
                    "{order.feedback.shopReply}"
                  </p>
                </div>
              )}
            </div>
          ) : showReview ? (
            <div className="space-y-4">
              <div>
                <p className="text-xs font-medium text-slate-600 mb-2">
                  Chọn mức độ hài lòng:
                </p>
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setRating(s)}
                      className="p-1 hover:scale-110 transition-transform cursor-pointer"
                    >
                      <Star
                        size={24}
                        fill={s <= rating ? "#f59e0b" : "none"}
                        stroke={s <= rating ? "none" : "#cbd5e1"}
                      />
                    </button>
                  ))}
                </div>
              </div>
              <textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                rows={3}
                placeholder="Viết cảm nhận của bạn về chất lượng sách, đóng gói và thời gian giao..."
                className="w-full text-xs sm:text-sm border border-slate-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-blue-500 resize-none bg-slate-50"
              />
              <div className="flex gap-2">
                <Btn onClick={handleSubmitReview} size="sm" color="#1d4ed8">
                  <Check size={14} /> Gửi đánh giá ngay
                </Btn>
                <Btn
                  onClick={() => setShowReview(false)}
                  variant="ghost"
                  size="sm"
                >
                  Hủy
                </Btn>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-500">
                Hãy chia sẻ đánh giá để giúp các bạn đọc khác lựa chọn sách tốt hơn.
              </p>
              <Btn
                onClick={() => setShowReview(true)}
                variant="outline"
                size="sm"
              >
                <Star size={14} /> Viết đánh giá
              </Btn>
            </div>
          )}
        </Card>
      )}

      {/* Return / Refund Dispute Section */}
      {order.returnRequest ? (
        <Card className="p-6 border-amber-200 bg-amber-50/40 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <RefreshCw size={16} className="text-amber-700" />
              <p className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                Yêu cầu hoàn trả & Tranh chấp ({order.returnRequest.disputeStatus || "OPEN"})
              </p>
            </div>
            <Badge
              label={
                order.returnRequest.status === "APPROVED"
                  ? "Admin đã duyệt hoàn tiền"
                  : order.returnRequest.status === "REJECTED"
                  ? "Bị từ chối"
                  : "Đang chờ Admin xử lý"
              }
              color={
                order.returnRequest.status === "APPROVED"
                  ? "#047857"
                  : order.returnRequest.status === "REJECTED"
                  ? "#b91c1c"
                  : "#b45309"
              }
              bg={
                order.returnRequest.status === "APPROVED"
                  ? "#d1fae5"
                  : order.returnRequest.status === "REJECTED"
                  ? "#fee2e2"
                  : "#fef3c7"
              }
            />
          </div>

          <p className="text-xs sm:text-sm text-slate-700">
            Lý do: <span className="font-semibold">"{order.returnRequest.reason}"</span>
          </p>

          {/* Admin Resolution Note */}
          {order.returnRequest.adminResolutionNote && (
            <div className="p-3 bg-white rounded-xl border border-blue-200">
              <span className="text-[11px] font-bold text-blue-800 flex items-center gap-1 mb-1">
                <ShieldCheck size={13} /> Kết luận phân xử từ Ban Quản Trị:
              </span>
              <p className="text-xs text-slate-700 leading-relaxed">
                {order.returnRequest.adminResolutionNote}
              </p>
            </div>
          )}

          <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-amber-200">
            <span>Ngày gửi: {order.returnRequest.createdAt}</span>
            <span className="font-bold text-slate-800">
              Số tiền hoàn: {fmt(order.returnRequest.refundAmount)}
            </span>
          </div>
        </Card>
      ) : (
        order.orderStatus === "DELIVERED" && (
          <div className="text-right">
            <button
              onClick={() => setShowReturnModal(true)}
              className="text-xs text-slate-500 hover:text-red-600 font-medium underline cursor-pointer"
            >
              Yêu cầu hoàn hàng / đổi trả sách nếu có lỗi
            </button>
          </div>
        )
      )}

      {/* Return Request Modal */}
      {showReturnModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <Card className="max-w-md w-full p-6 animate-in zoom-in-95">
            <h3 className="font-bold text-slate-800 text-base mb-2">
              Yêu cầu hoàn tiền & Đổi trả
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Vui lòng nêu rõ lý do và cung cấp link hình ảnh lỗi để Admin đối soát với shop.
            </p>

            <div className="space-y-4 mb-5">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Loại lý do
                </label>
                <select
                  value={returnReasonType}
                  onChange={(e) => setReturnReasonType(e.target.value)}
                  className="w-full text-xs sm:text-sm border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 focus:outline-none"
                >
                  <option value="DAMAGED">Sách bị rách, gãy bìa, in lỗi</option>
                  <option value="WRONG_ITEM">Giao sai tựa sách</option>
                  <option value="MISSING_PAGES">Thiếu trang, lỗi kiểm duyệt</option>
                  <option value="OTHER">Lý do khác</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Mô tả cụ thể
                </label>
                <textarea
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  rows={3}
                  placeholder="Mô tả cụ thể tình trạng lỗi..."
                  className="w-full text-xs sm:text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none bg-slate-50 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Link ảnh chụp bằng chứng (Tùy chọn)
                </label>
                <input
                  value={evidenceUrl}
                  onChange={(e) => setEvidenceUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full text-xs sm:text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none bg-slate-50"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Btn
                onClick={handleRequestReturn}
                color="#dc2626"
                size="md"
                className="flex-1"
              >
                <ShieldCheck size={16} /> Gửi yêu cầu hoàn hàng
              </Btn>
              <Btn
                onClick={() => setShowReturnModal(false)}
                variant="ghost"
                size="md"
              >
                Hủy
              </Btn>
            </div>
          </Card>
        </div>
      )}

      {/* Cancel Order Confirmation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <Card className="max-w-md w-full p-6 animate-in zoom-in-95">
            <div className="flex items-center gap-3 mb-3 text-red-600">
              <AlertTriangle size={24} />
              <h3 className="font-bold text-slate-800 text-base">
                Xác nhận hủy đơn hàng #{order.id}
              </h3>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Bạn có chắc chắn muốn hủy đơn hàng này không? Tiền thanh toán trực tuyến (nếu có) sẽ được hoàn về ví tài khoản.
            </p>

            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Lý do hủy đơn:
              </label>
              <select
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full text-xs sm:text-sm border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 focus:outline-none"
              >
                <option value="Đổi ý không muốn mua nữa">Đổi ý không muốn mua nữa</option>
                <option value="Muốn thay đổi địa chỉ giao hàng">Muốn thay đổi địa chỉ giao hàng</option>
                <option value="Tìm thấy giá rẻ hơn ở nơi khác">Tìm thấy giá rẻ hơn ở nơi khác</option>
                <option value="Lý do khác">Lý do khác</option>
              </select>
            </div>

            <div className="flex gap-2">
              <Btn onClick={handleCancelOrder} color="#dc2626" size="md" className="flex-1">
                <XCircle size={16} /> Đồng ý hủy đơn
              </Btn>
              <Btn onClick={() => setShowCancelModal(false)} variant="ghost" size="md">
                Không hủy
              </Btn>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
