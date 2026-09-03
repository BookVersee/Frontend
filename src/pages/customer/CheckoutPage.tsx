import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  MapPin,
  CreditCard,
  Check,
  CheckCircle,
  Smartphone,
  QrCode,
  Clock,
  ShieldCheck,
  X,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { useCart } from "../../contexts/CartContext";
import { useAuth } from "../../contexts/AuthContext";
import { PaymentMethod } from "../../types";
import { Card } from "../../components/common/Card";
import { Btn } from "../../components/common/Btn";
import { Modal } from "../../components/common/Modal";
import { fmt } from "../../utils/format";
import { orderService } from "../../services/orderService";
import { paymentService, PaymentUrlResponse } from "../../services/paymentService";
import { signalRService } from "../../services/signalRService";

interface CheckoutPageProps {
  onBack: () => void;
  onSuccess: () => void;
}

type SelectedGateway = "MOMO" | "VNPAY" | "COD";

export const CheckoutPage: React.FC<CheckoutPageProps> = ({
  onBack,
  onSuccess,
}) => {
  const { cart, subtotal, shippingFee, total, clearCart } = useCart();
  const { user } = useAuth();

  const [selectedGateway, setSelectedGateway] = useState<SelectedGateway>("MOMO");
  const [address, setAddress] = useState(user?.address || "123 Nguyễn Huệ, Quận 1, TP.HCM");
  const [phone, setPhone] = useState(user?.phone || "0901234567");
  const [customerName, setCustomerName] = useState(user?.name || "Khách hàng BookVerse");
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  // MoMo QR Modal State
  const [showMomoModal, setShowMomoModal] = useState(false);
  const [isRealtimePaid, setIsRealtimePaid] = useState(false);
  const [realtimeStatusMsg, setRealtimeStatusMsg] = useState("");
  const [momoPaymentData, setMomoPaymentData] = useState<{
    orderId: string | number;
    amount: number;
    qrUrl: string;
    payUrl: string;
  } | null>(null);

  // Countdown timer for QR (15 minutes)
  const [timeLeft, setTimeLeft] = useState(900);

  useEffect(() => {
    let timer: any;
    if (showMomoModal && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [showMomoModal, timeLeft]);

  // Lắng nghe kết quả thanh toán MoMo theo thời gian thực qua SignalR AppHub
  useEffect(() => {
    if (!showMomoModal || !momoPaymentData?.orderId) {
      setIsRealtimePaid(false);
      setRealtimeStatusMsg("");
      return;
    }

    const orderIdStr = String(momoPaymentData.orderId);
    signalRService.joinOrder(orderIdStr);

    const unsubscribe = signalRService.onPaymentResult((payload) => {
      if (String(payload.orderId) === orderIdStr) {
        if (payload.isSuccess) {
          setIsRealtimePaid(true);
          setRealtimeStatusMsg(payload.message || "Thanh toán MoMo thành công!");
          setTimeout(() => {
            handleConfirmMomoPaid();
          }, 1500);
        } else {
          setError(payload.message || "Giao dịch thanh toán thất bại.");
        }
      }
    });

    return () => {
      signalRService.leaveOrder(orderIdStr);
      unsubscribe();
    };
  }, [showMomoModal, momoPaymentData?.orderId]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const handlePlaceOrder = async () => {
    if (!address.trim()) {
      setError("Vui lòng nhập địa chỉ nhận hàng.");
      return;
    }
    if (!phone.trim()) {
      setError("Vui lòng nhập số điện thoại người nhận.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    const paymentMethod: PaymentMethod = selectedGateway === "COD" ? "COD" : "ONLINE";

    try {
      // 1. Tạo đơn hàng trên hệ thống
      const orders = await orderService.createOrder({
        customerId: user?.id || 1,
        customerName,
        customerPhone: phone,
        cart,
        paymentMethod,
        shippingAddress: address,
        note,
      });

      const orderId = orders?.[0]?.id;
      if (!orderId) {
        throw new Error("Không thể khởi tạo đơn hàng. Vui lòng thử lại.");
      }

      // 2. Xử lý theo từng phương thức thanh toán
      if (selectedGateway === "MOMO") {
        const momoRes = await paymentService.createMomoUrl({
          orderId,
          amount: total,
          orderInfo: `Thanh toan don hang BookVerse #${String(orderId).slice(0, 8)}`,
        });

        if (momoRes?.isRealGateway && momoRes.payment_url) {
          clearCart();
          // Điều hướng sang cổng MoMo Sandbox trực tiếp nếu có URL hợp lệ từ Backend
          window.location.href = momoRes.payment_url;
          return;
        }

        // Nếu ở chế độ Demo/Sandbox hoặc có QR Code -> Mở MoMo QR Modal
        setMomoPaymentData({
          orderId,
          amount: total,
          qrUrl:
            momoRes?.qr_code_url ||
            `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(
              `2|99|0901234567|BOOKVERSE|reader@gmail.com|0|0|${total}|Thanh toan don hang ${orderId}|transfer_p2p`
            )}`,
          payUrl: momoRes?.payment_url || "",
        });
        setShowMomoModal(true);
        setTimeLeft(900);
        return;
      }

      if (selectedGateway === "VNPAY") {
        const vnpayUrl = await paymentService.createVnpayUrl({
          orderId,
          amount: total,
          orderInfo: `Thanh toan don hang BookVerse #${String(orderId).slice(0, 8)}`,
        });

        if (vnpayUrl) {
          clearCart();
          window.location.href = vnpayUrl;
          return;
        } else {
          // VNPay sandbox fallback
          window.location.href = `/payment-result?vnp_ResponseCode=00&vnp_TxnRef=${orderId}&vnp_Amount=${total * 100}`;
          return;
        }
      }

      // 3. Với COD (Thanh toán khi nhận hàng)
      clearCart();
      setDone(true);
    } catch (err: any) {
      console.error("Place order error:", err);
      setError(err?.message || "Không thể khởi tạo đơn hàng. Vui lòng kiểm tra lại kết nối.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmMomoPaid = () => {
    if (!momoPaymentData) return;
    clearCart();
    setShowMomoModal(false);
    // Chuyển hướng sang màn hình kết quả thanh toán MoMo thành công
    const resultUrl = `/payment-result?resultCode=0&orderId=${momoPaymentData.orderId}&partnerCode=MOMO&transId=MOMO_${Date.now()}&amount=${momoPaymentData.amount}&message=Giao+dich+thanh+cong`;
    window.history.pushState({}, "", resultUrl);
    window.location.href = resultUrl;
  };

  if (done) {
    return (
      <div className="max-w-md mx-auto px-6 py-20 text-center animate-in fade-in zoom-in-95">
        <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-5 text-emerald-600 animate-bounce">
          <CheckCircle size={40} />
        </div>
        <h2 className="text-2xl font-extrabold text-slate-800 mb-2">
          Đặt hàng thành công!
        </h2>
        <p className="text-slate-500 text-sm mb-8 leading-relaxed">
          Đơn hàng thanh toán khi nhận hàng (COD) đã được gửi tới các nhà sách để chuẩn bị đóng gói.
        </p>
        <Btn onClick={onSuccess} color="#1d4ed8" size="lg" className="w-full">
          Xem đơn hàng của tôi
        </Btn>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 mb-6 transition-colors font-medium cursor-pointer"
      >
        <ArrowLeft size={16} /> Quay lại giỏ hàng
      </button>

      <h1 className="text-2xl font-extrabold text-slate-800 mb-6 tracking-tight">
        Xác nhận thông tin & Đặt hàng
      </h1>

      {error && (
        <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-600 font-semibold flex items-center gap-2">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      <div className="space-y-4 mb-6">
        {/* Customer & Address Card */}
        <Card className="p-5">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">
            <MapPin size={14} className="text-blue-600" />
            Thông tin người nhận & Địa chỉ giao hàng
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Họ và tên người nhận *
              </label>
              <input
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full text-xs sm:text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-500 bg-slate-50"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Số điện thoại liên hệ *
              </label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full text-xs sm:text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-500 bg-slate-50"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Địa chỉ chi tiết (Tính cước tự động qua GHN Express) *
            </label>
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full text-xs sm:text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-500 bg-slate-50"
            />
          </div>
        </Card>

        {/* Payment Gateways Selection */}
        <Card className="p-5">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">
            Phương thức thanh toán
          </p>
          <div className="space-y-3">
            {/* 1. MOMO */}
            <button
              type="button"
              onClick={() => setSelectedGateway("MOMO")}
              className={`w-full flex items-center gap-3.5 p-3.5 rounded-2xl border-2 transition-all text-left cursor-pointer ${
                selectedGateway === "MOMO"
                  ? "border-[#d82d8b] bg-pink-50/60 shadow-xs"
                  : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                  selectedGateway === "MOMO" ? "border-[#d82d8b]" : "border-slate-300"
                }`}
              >
                {selectedGateway === "MOMO" && (
                  <div className="w-2.5 h-2.5 rounded-full bg-[#d82d8b]" />
                )}
              </div>
              <div className="w-9 h-9 rounded-xl bg-[#d82d8b] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                <Smartphone size={18} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-slate-800">
                    Ví Điện Tử MoMo (Quét mã QR Code)
                  </p>
                  <span className="px-2 py-0.5 rounded-full bg-pink-100 text-[#d82d8b] text-[10px] font-bold">
                    Khuyên dùng
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Mở ứng dụng MoMo trên điện thoại để quét mã QR thanh toán tức thì
                </p>
              </div>
            </button>

            {/* 2. VNPAY */}
            <button
              type="button"
              onClick={() => setSelectedGateway("VNPAY")}
              className={`w-full flex items-center gap-3.5 p-3.5 rounded-2xl border-2 transition-all text-left cursor-pointer ${
                selectedGateway === "VNPAY"
                  ? "border-blue-600 bg-blue-50/60 shadow-xs"
                  : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                  selectedGateway === "VNPAY" ? "border-blue-600" : "border-slate-300"
                }`}
              >
                {selectedGateway === "VNPAY" && (
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                )}
              </div>
              <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                <CreditCard size={18} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-slate-800">
                  Cổng Thanh Toán VNPAY (ATM / Thẻ Quốc Tế)
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Thanh toán qua tài khoản ngân hàng nội địa hoặc thẻ Visa/Mastercard
                </p>
              </div>
            </button>

            {/* 3. COD */}
            <button
              type="button"
              onClick={() => setSelectedGateway("COD")}
              className={`w-full flex items-center gap-3.5 p-3.5 rounded-2xl border-2 transition-all text-left cursor-pointer ${
                selectedGateway === "COD"
                  ? "border-emerald-600 bg-emerald-50/60 shadow-xs"
                  : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                  selectedGateway === "COD" ? "border-emerald-600" : "border-slate-300"
                }`}
              >
                {selectedGateway === "COD" && (
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                )}
              </div>
              <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                <Check size={18} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-slate-800">
                  Thanh toán khi nhận hàng (COD)
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Kiểm tra sách và thanh toán tiền mặt trực tiếp cho Shipper
                </p>
              </div>
            </button>
          </div>
        </Card>

        {/* Note */}
        <Card className="p-5">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            Ghi chú giao hàng (Tùy chọn)
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            placeholder="Ví dụ: Giao giờ hành chính, gọi trước khi đến..."
            className="w-full text-xs sm:text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500 resize-none bg-slate-50"
          />
        </Card>

        {/* Order Summary */}
        <Card className="p-5">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
            Tóm tắt sản phẩm ({cart.length} đầu sách)
          </p>
          <div className="space-y-2 mb-3">
            {cart.map((i) => (
              <div
                key={i.book.id}
                className="flex justify-between items-center text-xs sm:text-sm text-slate-600"
              >
                <span className="truncate pr-2">
                  {i.book.title} <strong className="text-slate-800">×{i.quantity}</strong>
                </span>
                <span className="shrink-0 font-medium text-slate-800">
                  {fmt(i.book.price * i.quantity)}
                </span>
              </div>
            ))}
          </div>
          <div className="border-t border-slate-100 pt-3 space-y-1.5 text-xs sm:text-sm text-slate-600">
            <div className="flex justify-between">
              <span>Tiền sách</span>
              <span>{fmt(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>Cước vận chuyển (GHN)</span>
              <span>{fmt(shippingFee)}</span>
            </div>
            <div className="border-t border-slate-100 pt-2 flex justify-between font-bold text-slate-900 text-sm sm:text-base">
              <span>Tổng số tiền thanh toán</span>
              <span className="text-[#d82d8b] text-lg font-extrabold">{fmt(total)}</span>
            </div>
          </div>
        </Card>
      </div>

      <Btn
        onClick={handlePlaceOrder}
        disabled={isSubmitting}
        size="lg"
        color={selectedGateway === "MOMO" ? "#d82d8b" : selectedGateway === "VNPAY" ? "#1d4ed8" : "#047857"}
        className="w-full cursor-pointer shadow-md"
      >
        {isSubmitting ? (
          "Đang khởi tạo đơn hàng..."
        ) : selectedGateway === "MOMO" ? (
          <>
            <Smartphone size={18} /> Mở mã QR MoMo & Thanh toán ngay ({fmt(total)})
          </>
        ) : selectedGateway === "VNPAY" ? (
          <>
            <CreditCard size={18} /> Chuyển sang Cổng VNPAY ({fmt(total)})
          </>
        ) : (
          <>
            <Check size={18} /> Xác nhận đặt hàng COD ({fmt(total)})
          </>
        )}
      </Btn>

      {/* MOMO QR SCANNER MODAL */}
      {showMomoModal && momoPaymentData && (
        <Modal
          isOpen={true}
          onClose={() => setShowMomoModal(false)}
          title="Quét mã QR MoMo để thanh toán"
          maxWidth="max-w-md"
        >
          <div className="text-center space-y-4 animate-in fade-in zoom-in-95">
            {isRealtimePaid ? (
              <div className="py-8 px-4 text-center space-y-4 animate-in zoom-in-90 duration-300">
                <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-xl ring-8 ring-emerald-50 animate-bounce">
                  <CheckCircle size={44} />
                </div>
                <div>
                  <h3 className="text-xl font-extrabold text-slate-800">Thanh toán MoMo thành công!</h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto leading-relaxed">
                    {realtimeStatusMsg || "Hệ thống đã nhận được tiền và tự động xác nhận đơn hàng theo thời gian thực."}
                  </p>
                </div>
                <div className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-emerald-50 text-xs text-emerald-700 font-bold border border-emerald-200">
                  <Loader2 size={15} className="animate-spin" /> Đang chuyển sang trang đơn hàng...
                </div>
              </div>
            ) : (
              <>
                {/* MoMo Header Banner */}
                <div className="p-3 rounded-2xl bg-pink-50 border border-pink-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-[#d82d8b] text-white flex items-center justify-center font-bold text-xs">
                      <Smartphone size={16} />
                    </div>
                    <div className="text-left">
                      <p className="text-xs font-bold text-slate-800">Ví MoMo Sandbox</p>
                      <p className="text-[10px] text-slate-400">Đơn hàng #{String(momoPaymentData.orderId).slice(0, 8)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white text-[#d82d8b] text-xs font-bold shadow-2xs border border-pink-100">
                    <Clock size={12} />
                    <span>{formatTimer(timeLeft)}</span>
                  </div>
                </div>

                {/* Total Amount Display */}
                <div>
                  <p className="text-xs text-slate-500">Số tiền cần thanh toán:</p>
                  <p className="text-3xl font-extrabold text-[#d82d8b] tracking-tight">
                    {fmt(momoPaymentData.amount)}
                  </p>
                </div>

                {/* QR Code Container with Scanner Frame */}
                <div className="relative inline-block p-4 bg-white rounded-3xl border-2 border-dashed border-[#d82d8b]/50 shadow-inner">
                  <img
                    src={momoPaymentData.qrUrl}
                    alt="MoMo QR Code"
                    className="w-56 h-56 mx-auto object-contain rounded-2xl"
                  />
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-12 h-12 rounded-xl bg-[#d82d8b] text-white flex items-center justify-center font-bold text-xs shadow-md border-2 border-white">
                      MoMo
                    </div>
                  </div>
                </div>

                {/* Real-time WebSocket Listening Indicator */}
                <div className="flex items-center justify-center gap-2 text-[11px] text-emerald-700 bg-emerald-50 py-1.5 px-3 rounded-full border border-emerald-200 max-w-sm mx-auto">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  <span className="font-semibold">Hệ thống đang tự động lắng nghe giao dịch Realtime...</span>
                </div>

                {/* 3 Step Instructions */}
                <div className="bg-slate-50 rounded-2xl p-3.5 text-left text-xs text-slate-600 space-y-1.5 border border-slate-100">
                  <p className="font-bold text-slate-800 text-[11px] uppercase tracking-wider mb-1 flex items-center gap-1">
                    <ShieldCheck size={13} className="text-[#d82d8b]" /> Hướng dẫn quét mã:
                  </p>
                  <p className="flex items-start gap-1.5">
                    <span className="font-bold text-[#d82d8b]">1.</span> Mở ứng dụng <strong>MoMo</strong> trên điện thoại.
                  </p>
                  <p className="flex items-start gap-1.5">
                    <span className="font-bold text-[#d82d8b]">2.</span> Chọn biểu tượng <strong>"Quét mã"</strong> tại màn hình chính.
                  </p>
                  <p className="flex items-start gap-1.5">
                    <span className="font-bold text-[#d82d8b]">3.</span> Quét mã QR ở trên và xác nhận thanh toán.
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2 pt-2">
                  <Btn
                    onClick={handleConfirmMomoPaid}
                    color="#d82d8b"
                    size="lg"
                    className="w-full cursor-pointer shadow-md"
                  >
                    <CheckCircle size={16} /> Tôi đã hoàn tất thanh toán
                  </Btn>

                  <button
                    type="button"
                    onClick={() => setShowMomoModal(false)}
                    className="w-full py-2.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                  >
                    Đóng / Chọn phương thức khác
                  </button>
                </div>
              </>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};
