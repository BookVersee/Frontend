import React from "react";
import { CheckCircle, XCircle, ArrowRight, Home, RefreshCw } from "lucide-react";
import { Btn } from "../../components/common/Btn";

interface PaymentResultPageProps {
  onViewOrders: () => void;
  onGoHome: () => void;
}

export const PaymentResultPage: React.FC<PaymentResultPageProps> = ({
  onViewOrders,
  onGoHome,
}) => {
  const urlParams = new URLSearchParams(window.location.search);
  const responseCode = urlParams.get("vnp_ResponseCode");
  const txnRef = urlParams.get("vnp_TxnRef") || "";
  const rawMessage = urlParams.get("message") || "";
  const isSuccess = responseCode === "00";

  return (
    <div className="max-w-md mx-auto px-6 py-16 text-center animate-in fade-in zoom-in-95 duration-200">
      <div
        className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${
          isSuccess
            ? "bg-emerald-100 text-emerald-600 animate-bounce"
            : "bg-red-100 text-red-600"
        }`}
      >
        {isSuccess ? <CheckCircle size={44} /> : <XCircle size={44} />}
      </div>

      <h1 className="text-2xl font-extrabold text-slate-800 mb-2 tracking-tight">
        {isSuccess ? "Thanh toán VNPay thành công!" : "Thanh toán chưa hoàn tất"}
      </h1>

      <p className="text-slate-500 text-sm mb-6 leading-relaxed">
        {isSuccess
          ? "Giao dịch thanh toán trực tuyến qua cổng VNPay đã được xác nhận thành công. Đơn hàng của bạn đang được chuyển đến nhà sách để chuẩn bị."
          : rawMessage || "Giao dịch bị hủy hoặc xảy ra lỗi trong quá trình thanh toán. Bạn có thể kiểm tra lại trong danh sách đơn hàng hoặc thử lại."}
      </p>

      {/* Transaction Details Box */}
      <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 mb-6 text-left space-y-2.5 text-xs">
        <div className="flex justify-between items-center text-slate-600">
          <span className="text-slate-400">Cổng thanh toán:</span>
          <span className="font-bold text-blue-600">VNPAY Sandbox</span>
        </div>
        {txnRef && (
          <div className="flex justify-between items-center text-slate-600">
            <span className="text-slate-400">Mã giao dịch:</span>
            <span className="font-mono font-bold text-slate-700 truncate max-w-[200px]">
              {txnRef}
            </span>
          </div>
        )}
        <div className="flex justify-between items-center text-slate-600">
          <span className="text-slate-400">Mã phản hồi (Response Code):</span>
          <span
            className={`font-mono font-bold px-2 py-0.5 rounded-md ${
              isSuccess
                ? "bg-emerald-100 text-emerald-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {responseCode || "N/A"}
          </span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="space-y-2.5">
        <Btn onClick={onViewOrders} color="#1d4ed8" size="lg" className="w-full">
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
