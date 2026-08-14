import React, { useState } from "react";
import {
  ArrowLeft,
  Check,
  Star,
  RefreshCw,
  Clock,
  ShieldCheck,
} from "lucide-react";
import { Order, DeliveryStatus } from "../../types";
import { orderStatusInfo } from "../../utils/status";
import { fmt } from "../../utils/format";
import { Card } from "../../components/common/Card";
import { Badge } from "../../components/common/Badge";
import { Btn } from "../../components/common/Btn";
import { BookCover } from "../../components/common/BookCover";
import { orderService } from "../../services/orderService";
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

  // Return modal / inputs
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnReason, setReturnReason] = useState("");
  const [returnReasonType, setReturnReasonType] = useState("DAMAGED");

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
    await orderService.requestReturn(order.id, returnReason, returnReasonType);
    setOrder((prev) => ({
      ...prev,
      returnRequest: {
        reason: returnReason,
        reasonType: returnReasonType,
        status: "PENDING",
        refundAmount: prev.totalAmount,
        createdAt: new Date().toISOString().split("T")[0],
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

      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">
            Chi tiết đơn hàng #{order.id}
          </h1>
          <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
            <Clock size={12} /> Đặt lúc {order.createdAt}
          </p>
        </div>
        <Badge label={si.label} color={si.color} bg={si.bg} icon={si.icon} />
      </div>

      {/* GHN Shipping Tracker */}
      {order.tracking && (
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
          </p>

          <div className="flex items-center">
            {steps.map((step, i) => (
              <div key={step} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center transition-all shadow-xs"
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
            <span>Tổng cộng đã thanh toán/cần trả</span>
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
            <div className="p-4 bg-amber-50/60 rounded-2xl border border-amber-200">
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
                Hãy chia sẻ đánh giá để giúp các bạn đọc khác lựa chọn sách tốt
                hơn.
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

      {/* Return / Refund Request */}
      {order.returnRequest ? (
        <Card className="p-6 border-amber-200 bg-amber-50/40">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <RefreshCw size={16} className="text-amber-700" />
              <p className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                Yêu cầu hoàn trả / Hoàn tiền
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
          <p className="text-xs sm:text-sm text-slate-700 mb-2">
            Lý do: <span className="font-semibold">"{order.returnRequest.reason}"</span>
          </p>
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
              Vui lòng nêu rõ lý do hoàn sách để quản trị viên đối soát với nhà sách.
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
                  Mô tả chi tiết
                </label>
                <textarea
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  rows={3}
                  placeholder="Mô tả cụ thể tình trạng sách..."
                  className="w-full text-xs sm:text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none bg-slate-50 resize-none"
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
    </div>
  );
};
