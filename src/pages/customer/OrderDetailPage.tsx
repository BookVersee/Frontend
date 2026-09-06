import React, { useState, useEffect, useRef } from "react";
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
  MessageSquare,
  Info,
  Upload,
  Image as ImageIcon,
  Loader2,
  Gavel,
  AlertCircle,
  Trash2,
  CheckCircle,
  CreditCard,
  Copy,
} from "lucide-react";
import { Order, DeliveryStatus, ReturnRequestReasonType, OrderItem } from "../../types";
import { orderStatusInfo } from "../../utils/status";
import { fmt, formatOrderCode, formatOrderDate } from "../../utils/format";
import { Card } from "../../components/common/Card";
import { Badge } from "../../components/common/Badge";
import { Btn } from "../../components/common/Btn";
import { BookCover } from "../../components/common/BookCover";
import { orderService } from "../../services/orderService";
import { uploadService } from "../../services/uploadService";
import { signalRService } from "../../services/signalRService";
import { useAuth } from "../../contexts/AuthContext";
import { useCart } from "../../contexts/CartContext";

interface OrderDetailPageProps {
  order: Order;
  onBack: () => void;
  onOpenChat?: (shopId?: number | string) => void;
}

export const OrderDetailPage: React.FC<OrderDetailPageProps> = ({
  order: initialOrder,
  onBack,
  onOpenChat,
}) => {
  const { user } = useAuth();
  const { refreshCart } = useCart();
  const [order, setOrder] = useState<Order>(initialOrder);
  const [showReview, setShowReview] = useState(false);
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [reviewed, setReviewed] = useState(!!order.feedback);
  const [realtimeUpdateBanner, setRealtimeUpdateBanner] = useState<string | null>(null);
  const [copiedBankTemplate, setCopiedBankTemplate] = useState(false);

  const handleCopyBankTemplate = () => {
    const bookTitle = order?.returnRequest?.bookTitle || order?.items[0]?.book?.title || "Sản phẩm";
    const amountStr = order?.returnRequest?.refundAmount ? fmt(order.returnRequest.refundAmount) : "";
    const template = `[BookVerse - Cung cấp thông tin nhận hoàn tiền]
Chào Shop, yêu cầu đổi trả cho cuốn "${bookTitle}" của đơn #${formatOrderCode(order?.id || "")} (${amountStr}) đã được chấp thuận.
Mình xin gửi thông tin số tài khoản ngân hàng để nhận lại tiền hoàn:
- Ngân hàng: [Điền tên ngân hàng, ví dụ: Vietcombank, MB Bank, Techcombank...]
- Số tài khoản (STK): [Điền số tài khoản nhận tiền]
- Chủ tài khoản: [Họ và tên chủ tài khoản]
Cảm ơn Shop hỗ trợ!`;

    navigator.clipboard.writeText(template);
    setCopiedBankTemplate(true);
    setTimeout(() => setCopiedBankTemplate(false), 3000);
  };

  const handleContactShop = () => {
    const shopId = order.shopId || order.items[0]?.book?.shopId;
    if (onOpenChat) {
      onOpenChat(shopId);
    }
  };

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
  const [selectedReturnItem, setSelectedReturnItem] = useState<OrderItem | null>(null);
  const [returnReason, setReturnReason] = useState("");
  const [returnReasonType, setReturnReasonType] = useState<ReturnRequestReasonType>("DAMAGED");
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isSubmittingReturn, setIsSubmittingReturn] = useState(false);
  const [returnError, setReturnError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Escalate dispute modal
  const [showEscalateModal, setShowEscalateModal] = useState(false);
  const [escalateReason, setEscalateReason] = useState("");
  const [isSubmittingEscalate, setIsSubmittingEscalate] = useState(false);
  const [escalateError, setEscalateError] = useState<string | null>(null);

  // Cancel order modal
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("Đổi ý không muốn mua nữa");
  const [cancelError, setCancelError] = useState<string | null>(null);

  // Modal yêu cầu hủy đơn PROCESSING
  const [showContactShopModal, setShowContactShopModal] = useState(false);

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
    try {
      setCancelError(null);
      await orderService.cancelOrder(order.id, cancelReason);
      await refreshCart(true);
      setOrder((prev) => ({
        ...prev,
        orderStatus: "CANCELLED",
        paymentStatus: prev.paymentStatus === "PAID" ? "REFUNDED" : "UNPAID",
      }));
      setRealtimeUpdateBanner("Đơn hàng đã được hủy thành công. Các sản phẩm đã được hoàn trả lại giỏ hàng của bạn!");
      setTimeout(() => setRealtimeUpdateBanner(null), 6000);
      setShowCancelModal(false);
    } catch (err: any) {
      setCancelError(err.message || "Không thể hủy đơn hàng này.");
    }
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

  const handleOpenReturnModal = (item?: OrderItem) => {
    setReturnError(null);
    setReturnReason("");
    setReturnReasonType("DAMAGED");
    setEvidenceUrl("");
    if (item) {
      setSelectedReturnItem(item);
    } else {
      const eligible = order.items.find((i) => !i.returnStatus || i.returnStatus === "NONE") || order.items[0];
      setSelectedReturnItem(eligible || null);
    }
    setShowReturnModal(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploadingImage(true);
      setReturnError(null);
      const res = await uploadService.uploadImage(file, "bookverse/returns");
      setEvidenceUrl(res.url);
    } catch (err: any) {
      setReturnError(err.message || "Tải ảnh lên máy chủ thất bại.");
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleRequestReturn = async () => {
    if (!returnReason.trim()) {
      setReturnError("Vui lòng nêu rõ lý do hoặc mô tả cụ thể tình trạng lỗi của sách.");
      return;
    }
    if (!selectedReturnItem?.orderDetailId) {
      setReturnError("Không tìm thấy mã sản phẩm hợp lệ trong đơn hàng.");
      return;
    }

    try {
      setIsSubmittingReturn(true);
      setReturnError(null);
      const refundAmount = selectedReturnItem.unitPrice * selectedReturnItem.quantity;
      await orderService.requestReturn({
        orderId: order.id,
        orderDetailId: selectedReturnItem.orderDetailId,
        reason: returnReason.trim(),
        reasonType: returnReasonType,
        evidenceImage: evidenceUrl || undefined,
        refundAmount,
      });

      const newReturnReq = {
        orderId: order.id,
        orderDetailId: selectedReturnItem.orderDetailId,
        bookTitle: selectedReturnItem.book.title,
        bookImageUrl: selectedReturnItem.book.imageUrl,
        reason: returnReason.trim(),
        reasonType: returnReasonType,
        status: "PENDING" as const,
        disputeStatus: "OPEN" as const,
        refundAmount,
        createdAt: new Date().toISOString().split("T")[0],
        evidenceImage: evidenceUrl || undefined,
        imageUrl: evidenceUrl || undefined,
      };

      setOrder((prev) => ({
        ...prev,
        items: prev.items.map((it) =>
          it.orderDetailId === selectedReturnItem.orderDetailId
            ? { ...it, returnStatus: "REQUESTED", returnRequest: newReturnReq }
            : it
        ),
        returnRequest: newReturnReq,
      }));

      setShowReturnModal(false);
    } catch (err: any) {
      setReturnError(err.message || "Không thể gửi yêu cầu đổi trả.");
    } finally {
      setIsSubmittingReturn(false);
    }
  };

  const handleEscalateDispute = async () => {
    if (!escalateReason.trim()) {
      setEscalateError("Vui lòng nhập lý do bạn không đồng ý với phản hồi của Shop.");
      return;
    }
    const returnReqId = order.returnRequest?.id;
    if (!returnReqId) {
      setEscalateError("Không tìm thấy mã yêu cầu trả hàng.");
      return;
    }

    try {
      setIsSubmittingEscalate(true);
      setEscalateError(null);
      await orderService.escalateDispute(returnReqId, escalateReason.trim());

      setOrder((prev) => {
        const updatedReturnReq = prev.returnRequest
          ? {
              ...prev.returnRequest,
              status: "PENDING" as const,
              disputeStatus: "OPEN" as const,
              reason: (prev.returnRequest.reason || "") + ` | [KHIẾU NẠI ADMIN: ${escalateReason.trim()}]`,
            }
          : undefined;

        return {
          ...prev,
          returnRequest: updatedReturnReq,
          items: prev.items.map((it) =>
            it.returnRequest?.id === returnReqId
              ? { ...it, returnRequest: updatedReturnReq }
              : it
          ),
        };
      });

      setShowEscalateModal(false);
    } catch (err: any) {
      setEscalateError(err.message || "Không thể gửi khiếu nại lên Ban Quản Trị.");
    } finally {
      setIsSubmittingEscalate(false);
    }
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
              onClick={() => {
                setShowCancelModal(true);
                setCancelError(null);
              }}
              className="text-red-600 hover:border-red-400"
            >
              <XCircle size={14} /> Hủy đơn hàng
            </Btn>
          )}

          {order.orderStatus === "PROCESSING" && (
            <Btn
              variant="outline"
              size="sm"
              onClick={() => setShowContactShopModal(true)}
              className="text-slate-600 hover:text-blue-600 hover:border-blue-200"
            >
              <MessageSquare size={14} /> Yêu cầu hủy
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
              key={item.orderDetailId || item.book.id}
              className="flex items-center gap-4 border-b border-slate-100 last:border-0 pb-3 last:pb-0"
            >
              <div className="w-16 h-22 shrink-0 rounded-xl overflow-hidden shadow-xs border border-slate-200/80 bg-slate-50 flex items-center justify-center">
                <BookCover book={item.book} size="xs" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 line-clamp-1">
                  {item.book.title}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {item.book.author} • Số lượng:{" "}
                  <span className="font-bold text-slate-700">×{item.quantity}</span>
                </p>

                {/* Trạng thái đổi trả chi tiết theo từng cuốn sách */}
                {item.returnStatus && item.returnStatus !== "NONE" ? (
                  <div className="mt-1.5 flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md ${
                        item.returnStatus === "REFUNDED"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : item.returnStatus === "PROCESSING"
                          ? "bg-blue-50 text-blue-700 border border-blue-200"
                          : item.returnStatus === "REJECTED"
                          ? "bg-rose-50 text-rose-700 border border-rose-200"
                          : "bg-amber-50 text-amber-700 border border-amber-200"
                      }`}
                    >
                      <RefreshCw size={11} className={item.returnStatus === "REQUESTED" ? "animate-spin" : ""} />
                      {item.returnStatus === "REFUNDED"
                        ? "Đã hoàn tiền"
                        : item.returnStatus === "PROCESSING"
                        ? "Shop đã chấp nhận (Đang hoàn tiền)"
                        : item.returnStatus === "REJECTED"
                        ? "Shop từ chối trả hàng"
                        : "Chờ Shop duyệt trả hàng"}
                    </span>
                  </div>
                ) : (
                  order.orderStatus === "DELIVERED" && (
                    <div className="mt-1.5">
                      <button
                        onClick={() => handleOpenReturnModal(item)}
                        className="text-[11px] text-red-600 hover:text-red-700 font-semibold underline cursor-pointer"
                      >
                        Đổi trả cuốn này
                      </button>
                    </div>
                  )
                )}
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
                  ? "Đã duyệt hoàn tiền"
                  : order.returnRequest.status === "REJECTED"
                  ? "Shop từ chối"
                  : order.returnRequest.reason?.includes("[KHIẾU NẠI ADMIN:")
                  ? "Admin đang thụ lý"
                  : "Chờ Shop xử lý"
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

          <div className="text-xs sm:text-sm text-slate-700 space-y-1">
            <p>
              Lý do khiếu nại: <span className="font-semibold text-slate-900">"{order.returnRequest.reason}"</span>
            </p>
            <p className="text-xs text-slate-500">
              Phân loại: <span className="font-medium text-slate-700">
                {order.returnRequest.reasonType === "WRONG_ITEM"
                  ? "Giao sai tựa sách"
                  : order.returnRequest.reasonType === "DEFECTIVE"
                  ? "Lỗi in ấn / thiếu trang"
                  : "Sách bị hư hỏng / rách móp"}
              </span>
            </p>
          </div>

          {/* Evidence Image Thumbnail */}
          {(order.returnRequest.evidenceImage || order.returnRequest.imageUrl) && (
            <div className="pt-2">
              <p className="text-[11px] font-semibold text-slate-600 mb-1.5 flex items-center gap-1">
                <ImageIcon size={13} /> Hình ảnh bằng chứng:
              </p>
              <a
                href={order.returnRequest.evidenceImage || order.returnRequest.imageUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-block relative group rounded-xl overflow-hidden border border-slate-200 shadow-xs"
              >
                <img
                  src={order.returnRequest.evidenceImage || order.returnRequest.imageUrl}
                  alt="Evidence"
                  className="w-24 h-24 object-cover group-hover:scale-105 transition-transform"
                />
                <span className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px] font-semibold transition-opacity">
                  Xem ảnh
                </span>
              </a>
            </div>
          )}

          {/* Shop Approved Return Notice: Hướng dẫn khách hàng cung cấp STK */}
          {order.returnRequest.status === "APPROVED" && (
            <div className="p-4.5 bg-gradient-to-br from-emerald-50 via-teal-50/50 to-emerald-50 rounded-2xl border-2 border-emerald-300/90 shadow-xs space-y-3.5">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <CheckCircle size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-extrabold text-emerald-950">
                    Cửa hàng đã chấp thuận yêu cầu đổi trả & hoàn tiền!
                  </h4>
                  <p className="text-xs text-emerald-800 mt-0.5 leading-relaxed">
                    Số tiền hoàn dự kiến: <strong className="text-emerald-950 font-black text-sm">{fmt(order.returnRequest.refundAmount)}</strong>.
                  </p>
                </div>
              </div>

              {/* Hướng dẫn từng bước */}
              <div className="bg-white/95 rounded-xl p-3.5 border border-emerald-200/80 text-xs space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-slate-800">
                  <CreditCard size={15} className="text-emerald-600" />
                  <span>Hướng dẫn nhận lại tiền hoàn từ Shop:</span>
                </div>
                <ol className="list-decimal list-inside space-y-1.5 text-slate-600 pl-1 leading-relaxed">
                  <li>
                    Bạn hãy <strong>chủ động nhắn tin cho Cửa hàng ({order.shopName || "Shop"})</strong> qua hệ thống Chat BookVerse.
                  </li>
                  <li>
                    Gửi thông tin tài khoản ngân hàng của bạn gồm: <strong>Tên ngân hàng, Số tài khoản (STK)</strong> và <strong>Họ tên chủ tài khoản</strong>.
                  </li>
                  <li>
                    Shop sẽ tiến hành chuyển khoản hoàn tiền trực tiếp cho bạn sau khi nhận được thông tin.
                  </li>
                </ol>
              </div>

              {/* Nút Copy mẫu STK & Nút Nhắn tin cho Shop */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleCopyBankTemplate}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-white hover:bg-slate-50 border border-emerald-300 text-emerald-900 font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                >
                  <Copy size={14} className="text-emerald-700" />
                  {copiedBankTemplate ? "✓ Đã sao chép mẫu tin nhắn!" : "Sao chép mẫu thông tin STK"}
                </button>

                <button
                  type="button"
                  onClick={handleContactShop}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
                >
                  <MessageSquare size={14} /> Nhắn tin ngay cho Shop
                </button>
              </div>
            </div>
          )}

          {/* Shop Rejection Notice & Escalation to Admin */}
          {order.returnRequest.status === "REJECTED" && (
            <div className="p-3.5 bg-rose-50/80 rounded-xl border border-rose-200 space-y-2.5">
              <div className="flex items-start gap-2 text-rose-800">
                <AlertCircle size={16} className="shrink-0 mt-0.5 text-rose-600" />
                <div className="text-xs">
                  <p className="font-bold">Cửa hàng đã từ chối yêu cầu đổi trả này.</p>
                  <p className="text-rose-700 mt-0.5 leading-relaxed">
                    Nếu bạn nhận thấy phán quyết của Shop chưa thỏa đáng hoặc bạn có đầy đủ bằng chứng đối soát, bạn có quyền khiếu nại lên Ban Quản Trị để Admin can thiệp xử lý.
                  </p>
                </div>
              </div>
              <div className="text-right">
                <Btn
                  onClick={() => {
                    setEscalateError(null);
                    setEscalateReason("");
                    setShowEscalateModal(true);
                  }}
                  size="sm"
                  color="#b45309"
                >
                  <Gavel size={14} /> Khiếu nại lên Ban Quản Trị
                </Btn>
              </div>
            </div>
          )}

          {/* Admin Dispute Pending Notice */}
          {order.returnRequest.status === "PENDING" && order.returnRequest.reason?.includes("[KHIẾU NẠI ADMIN:") && (
            <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 flex items-center gap-2 text-xs text-blue-800">
              <ShieldCheck size={16} className="shrink-0 text-blue-600" />
              <span>Vụ việc tranh chấp đang được <strong>Ban Quản Trị (Admin)</strong> tiếp nhận và phân xử. Vui lòng chờ phản hồi.</span>
            </div>
          )}

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
              onClick={() => handleOpenReturnModal()}
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
          <Card className="max-w-lg w-full p-6 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-slate-800 text-base mb-1">
              Yêu cầu hoàn tiền & Đổi trả
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Vui lòng chọn sản phẩm cần hoàn trả, nêu rõ lý do và cung cấp ảnh chụp bằng chứng lỗi để đối soát.
            </p>

            {returnError && (
              <div className="p-3 mb-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium flex items-center gap-2">
                <AlertCircle size={15} className="shrink-0" />
                <span>{returnError}</span>
              </div>
            )}

            <div className="space-y-4 mb-5">
              {/* Product selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Chọn sản phẩm cần đổi trả
                </label>
                {order.items.length > 1 ? (
                  <select
                    value={selectedReturnItem?.orderDetailId || ""}
                    onChange={(e) => {
                      const it = order.items.find((i) => i.orderDetailId === e.target.value);
                      if (it) setSelectedReturnItem(it);
                    }}
                    className="w-full text-xs sm:text-sm border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 focus:outline-none"
                  >
                    {order.items.map((item) => (
                      <option
                        key={item.orderDetailId || item.book.id}
                        value={item.orderDetailId || ""}
                        disabled={!!item.returnStatus && item.returnStatus !== "NONE"}
                      >
                        {item.book.title} (×{item.quantity}) - {fmt(item.unitPrice * item.quantity)}
                        {item.returnStatus && item.returnStatus !== "NONE" ? " [Đã gửi yêu cầu]" : ""}
                      </option>
                    ))}
                  </select>
                ) : (
                  selectedReturnItem && (
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-3">
                      <div className="w-10 h-14 shrink-0 rounded overflow-hidden border border-slate-200 bg-white">
                        <BookCover book={selectedReturnItem.book} size="xs" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-slate-800 line-clamp-1">
                          {selectedReturnItem.book.title}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Số lượng: {selectedReturnItem.quantity} • Giá: {fmt(selectedReturnItem.unitPrice)}
                        </p>
                      </div>
                    </div>
                  )
                )}
              </div>

              {/* Estimated Refund Amount */}
              {selectedReturnItem && (
                <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-100 flex items-center justify-between text-xs">
                  <span className="text-blue-900 font-medium">Số tiền hoàn dự kiến:</span>
                  <span className="text-blue-700 font-bold text-sm">
                    {fmt(selectedReturnItem.unitPrice * selectedReturnItem.quantity)}
                  </span>
                </div>
              )}

              {/* Reason Type */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Loại lý do đổi trả
                </label>
                <select
                  value={returnReasonType}
                  onChange={(e) => setReturnReasonType(e.target.value as ReturnRequestReasonType)}
                  className="w-full text-xs sm:text-sm border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 focus:outline-none"
                >
                  <option value="DAMAGED">Sách bị rách, gãy bìa, ướt hoặc móp méo</option>
                  <option value="WRONG_ITEM">Giao sai tựa sách / sản phẩm khác</option>
                  <option value="DEFECTIVE">Lỗi in ấn, thiếu trang từ nhà xuất bản</option>
                </select>
              </div>

              {/* Detailed Reason */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Mô tả cụ thể tình trạng lỗi <span className="text-rose-500">*</span>
                </label>
                <textarea
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  rows={3}
                  placeholder="Nêu rõ trang bị rách, tình trạng móp méo hoặc tựa sách bị giao nhầm..."
                  className="w-full text-xs sm:text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none bg-slate-50 resize-none"
                />
              </div>

              {/* Photo Evidence Upload */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Ảnh chụp bằng chứng lỗi
                </label>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/jpeg,image/png,image/webp,image/jpg"
                  onChange={handleImageUpload}
                  className="hidden"
                />

                {evidenceUrl ? (
                  <div className="relative rounded-xl border border-slate-200 p-2.5 bg-slate-50 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={evidenceUrl}
                        alt="Evidence preview"
                        className="w-14 h-14 rounded-lg object-cover border border-slate-200 shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-800 line-clamp-1">
                          Ảnh chụp bằng chứng
                        </p>
                        <span className="text-[10px] text-emerald-600 font-medium">
                          Đã tải lên Cloudinary thành công
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEvidenceUrl("")}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Xóa ảnh"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-200 hover:border-blue-400 hover:bg-blue-50/20 rounded-xl p-4 text-center cursor-pointer transition-colors"
                  >
                    {isUploadingImage ? (
                      <div className="flex flex-col items-center justify-center gap-2 py-2">
                        <Loader2 size={24} className="text-blue-600 animate-spin" />
                        <span className="text-xs font-medium text-slate-600">
                          Đang tải ảnh lên Cloudinary...
                        </span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center gap-1.5">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                          <Upload size={16} />
                        </div>
                        <p className="text-xs font-semibold text-slate-700">
                          Bấm để tải ảnh chụp từ thiết bị
                        </p>
                        <p className="text-[10px] text-slate-400">
                          Hỗ trợ định dạng JPG, PNG, WEBP (Tối đa 10MB)
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <Btn
                onClick={handleRequestReturn}
                color="#dc2626"
                size="md"
                className="flex-1"
                disabled={isSubmittingReturn || isUploadingImage}
              >
                {isSubmittingReturn ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Đang gửi yêu cầu...
                  </>
                ) : (
                  <>
                    <ShieldCheck size={16} /> Gửi yêu cầu hoàn hàng
                  </>
                )}
              </Btn>
              <Btn
                onClick={() => setShowReturnModal(false)}
                variant="ghost"
                size="md"
                disabled={isSubmittingReturn}
              >
                Hủy
              </Btn>
            </div>
          </Card>
        </div>
      )}

      {/* Escalate Dispute Modal */}
      {showEscalateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <Card className="max-w-md w-full p-6 animate-in zoom-in-95">
            <div className="flex items-center gap-2 mb-2 text-amber-700">
              <Gavel size={20} />
              <h3 className="font-bold text-slate-800 text-base">
                Khiếu nại lên Ban Quản Trị
              </h3>
            </div>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              Vụ việc sẽ được chuyển trực tiếp tới Admin để đối soát với Shop. Ban Quản Trị sẽ bảo vệ quyền lợi chính đáng của bạn nếu sản phẩm thực sự bị lỗi.
            </p>

            {escalateError && (
              <div className="p-3 mb-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
                {escalateError}
              </div>
            )}

            <div className="mb-5">
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Lý do khiếu nại đối soát:
              </label>
              <textarea
                value={escalateReason}
                onChange={(e) => setEscalateReason(e.target.value)}
                rows={4}
                placeholder="Nêu rõ căn cứ, bằng chứng bóc hàng hoặc lý do vì sao phản hồi của Shop chưa thỏa đáng..."
                className="w-full text-xs sm:text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none bg-slate-50 resize-none"
              />
            </div>

            <div className="flex gap-2">
              <Btn
                onClick={handleEscalateDispute}
                color="#b45309"
                size="md"
                className="flex-1"
                disabled={isSubmittingEscalate}
              >
                {isSubmittingEscalate ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Đang gửi khiếu nại...
                  </>
                ) : (
                  <>
                    <Gavel size={16} /> Gửi khiếu nại Admin
                  </>
                )}
              </Btn>
              <Btn
                onClick={() => setShowEscalateModal(false)}
                variant="ghost"
                size="md"
                disabled={isSubmittingEscalate}
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
                Xác nhận hủy đơn hàng #{formatOrderCode(order.id)}
              </h3>
            </div>
            <p className="text-xs text-slate-500 mb-3">
              Bạn có chắc chắn muốn hủy đơn hàng này không? Tồn kho sản phẩm sẽ được tự động hoàn trả lại cho cửa hàng.
            </p>

            {cancelError && (
              <div className="p-3 mb-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
                {cancelError}
              </div>
            )}

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
                <option value="Muốn đổi sách hoặc thêm mã giảm giá">Muốn đổi sách hoặc thêm mã giảm giá</option>
                <option value="Tìm thấy giá rẻ hơn ở nơi khác">Tìm thấy giá rẻ hơn ở nơi khác</option>
                <option value="Đặt nhầm sản phẩm / đơn hàng">Đặt nhầm sản phẩm / đơn hàng</option>
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

      {/* Modal Hướng dẫn Hủy đơn PROCESSING (Liên hệ Shop) */}
      {showContactShopModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <Card className="max-w-md w-full p-6 animate-in zoom-in-95">
            <div className="flex items-center gap-3 mb-3 text-blue-600">
              <Info size={24} />
              <h3 className="font-bold text-slate-800 text-base">
                Yêu cầu hủy đơn #{formatOrderCode(order.id)}
              </h3>
            </div>
            
            <p className="text-xs text-slate-600 mb-3 leading-relaxed">
              Đơn hàng này đã được người bán tiếp nhận và đang trong quá trình đóng gói. Theo quy định của hệ thống, đơn hàng đang xử lý không thể tự động hủy trực tiếp.
            </p>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 mb-4 space-y-1">
              <p className="font-semibold text-slate-700">Hướng dẫn xử lý:</p>
              <p>• Nhắn tin trực tiếp với Shop để người bán hỗ trợ giữ lại đơn trước khi bàn giao cho Shipper.</p>
              <p>• Hoặc bạn có thể từ chối nhận hàng khi đơn vị vận chuyển liên hệ giao.</p>
            </div>

            <div className="flex gap-2">
              {onOpenChat && (
                <Btn
                  onClick={() => {
                    const shopId = order.shopId || order.items[0]?.book?.shopId;
                    onOpenChat(shopId);
                    setShowContactShopModal(false);
                  }}
                  color="#1d4ed8"
                  size="md"
                  className="flex-1"
                >
                  <MessageSquare size={16} /> Nhắn tin cho Shop ngay
                </Btn>
              )}
              <Btn
                onClick={() => setShowContactShopModal(false)}
                variant="ghost"
                size="md"
                className={onOpenChat ? "" : "w-full"}
              >
                Đã hiểu
              </Btn>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
