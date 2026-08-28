import React from "react";
import { CheckCircle, XCircle, ArrowRight, Home, Smartphone, CreditCard } from "lucide-react";
import { Btn } from "../../components/common/Btn";
import { fmt } from "../../utils/format";

interface PaymentResultPageProps {
  onViewOrders: () => void;
  onGoHome: () => void;
}

export const PaymentResultPage: React.FC<PaymentResultPageProps> = ({
  onViewOrders,
  onGoHome,
}) => {
  const urlParams = new URLSearchParams(window.location.search);
  
  // MoMo Parameters
  const momoResultCode = urlParams.get("resultCode");
  const momoOrderId = urlParams.get("orderId") || "";
  const momoTransId = urlParams.get("transId") || "";
  const momoMessage = urlParams.get("message") || "";
  const partnerCode = urlParams.get("partnerCode") || "";

  // VNPay Parameters
  const vnpResponseCode = urlParams.get("vnp_ResponseCode");
  const vnpTxnRef = urlParams.get("vnp_TxnRef") || "";
  const vnpAmount = urlParams.get("vnp_Amount") ? Number(urlParams.get("vnp_Amount")) / 100 : null;

  // Xác định nhà cung cấp và trạng thái thanh toán
  const isMomo = partnerCode.toUpperCase() === "MOMO" || momoResultCode !== null;
  const isSuccess = isMomo
    ? momoResultCode === "0"
    : vnpResponseCode === "00";

  const gatewayName = isMomo ? "Ví Điện Tử MoMo (Sandbox)" : "Cổng Thanh Toán VNPAY";
  const displayTxn = isMomo ? momoTransId || momoOrderId : vnpTxnRef;
  const displayMessage = isSuccess
    ? isMomo
      ? "Giao dịch quét mã MoMo thành công! Đơn hàng của bạn đã được xác nhận và chuyển sang nhà sách để chuẩn bị đóng gói."
      : "Giao dịch thanh toán trực tuyến qua cổng VNPAY đã được xác nhận thành công. Đơn hàng đang được chuẩn bị."
    : momoMessage || (isMomo ? "Giao dịch MoMo bị hủy hoặc chưa hoàn tất." : "Giao dịch VNPAY bị hủy hoặc xảy ra lỗi trong quá trình thanh toán.");

  return (
    <div className="max-w-md mx-auto px-6 py-16 text-center animate-in fade-in zoom-in-95 duration-200">
      {/* Status Icon */}
      <div
        className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${
          isSuccess
            ? isMomo
              ? "bg-pink-100 text-pink-600 animate-bounce"
              : "bg-emerald-100 text-emerald-600 animate-bounce"
            : "bg-red-100 text-red-600"
        }`}
      >
        {isSuccess ? <CheckCircle size={44} /> : <XCircle size={44} />}
      </div>

      <h1 className="text-2xl font-extrabold text-slate-800 mb-2 tracking-tight">
        {isSuccess
          ? isMomo
            ? "Thanh toán MoMo thành công!"
            : "Thanh toán VNPAY thành công!"
          : "Thanh toán chưa hoàn tất"}
      </h1>

      <p className="text-slate-500 text-sm mb-6 leading-relaxed">
        {displayMessage}
      </p>

      {/* Transaction Details Box */}
      <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 mb-6 text-left space-y-2.5 text-xs">
        <div className="flex justify-between items-center text-slate-600">
          <span className="text-slate-400 flex items-center gap-1">
            {isMomo ? <Smartphone size={13} className="text-pink-600" /> : <CreditCard size={13} className="text-blue-600" />}
            Cổng thanh toán:
          </span>
          <span className={`font-bold ${isMomo ? "text-pink-600" : "text-blue-600"}`}>
            {gatewayName}
          </span>
        </div>

        {displayTxn && (
          <div className="flex justify-between items-center text-slate-600">
            <span className="text-slate-400">Mã giao dịch / Đơn:</span>
            <span className="font-mono font-bold text-slate-700 truncate max-w-[200px]">
              {displayTxn}
            </span>
          </div>
        )}

        <div className="flex justify-between items-center text-slate-600">
          <span className="text-slate-400">Trạng thái:</span>
          <span
            className={`font-mono font-bold px-2 py-0.5 rounded-md ${
              isSuccess
                ? isMomo
                  ? "bg-pink-100 text-pink-700"
                  : "bg-emerald-100 text-emerald-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {isSuccess ? "THÀNH CÔNG (PAID)" : "CHƯA HOÀN TẤT"}
          </span>
        </div>

        {vnpAmount && (
          <div className="flex justify-between items-center text-slate-600">
            <span className="text-slate-400">Số tiền:</span>
            <span className="font-bold text-slate-800">{fmt(vnpAmount)}</span>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="space-y-2.5">
        <Btn
          onClick={onViewOrders}
          color={isMomo ? "#d82d8b" : "#1d4ed8"}
          size="lg"
          className="w-full"
        >
          <span>Xem đơn hàng của tôi</span>
          <ArrowRight size={16} />
        </Btn>

        <button
          type="button"
          onClick={onGoHome}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 hover:text-slate-800 transition-all cursor-pointer"
        >
          <Home size={14} />
          <span>Về trang chủ BookVerse</span>
        </button>
      </div>
    </div>
  );
};
