import React, { useState } from "react";
import { Ticket, Copy, Check, Sparkles } from "lucide-react";
import { ShopVoucher } from "../../services/chatService";

interface VoucherTicketProps {
  voucher: ShopVoucher;
  isShop: boolean;
  onCopySuccess?: (code: string) => void;
}

export const VoucherTicket: React.FC<VoucherTicketProps> = ({
  voucher,
  isShop,
  onCopySuccess,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(voucher.code);
    setCopied(true);
    if (onCopySuccess) onCopySuccess(voucher.code);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-68 sm:w-72 rounded-2xl overflow-hidden shadow-md border border-amber-300 bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600 text-white relative select-none">
      {/* Răng cưa khuyết 2 bên chuẩn phong cách vé giảm giá Shopee */}
      <div className="absolute -left-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-slate-50 border-r border-amber-300" />
      <div className="absolute -right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-slate-50 border-l border-amber-300" />

      {/* Header Vé */}
      <div className="px-4 pt-3 pb-2 border-b border-dashed border-white/30 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-yellow-100">
          <Ticket size={14} className="text-yellow-200" />
          <span>VOUCHER ĐỘC QUYỀN SHOP</span>
        </div>
        <span className="text-[9px] bg-white/20 px-2 py-0.5 rounded-full font-semibold backdrop-blur-xs">
          {isShop ? "Đã gửi tặng" : "Được tặng"}
        </span>
      </div>

      {/* Nội dung chi tiết vé */}
      <div className="p-3.5 space-y-2 text-left">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <span className="text-[10px] text-yellow-100 block font-medium">Mã ưu đãi:</span>
            <span className="text-base sm:text-lg font-black font-mono tracking-widest text-white drop-shadow-xs">
              {voucher.code}
            </span>
          </div>
          <button
            type="button"
            onClick={handleCopy}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer shrink-0 ${
              copied
                ? "bg-emerald-600 text-white"
                : "bg-white text-amber-900 hover:bg-yellow-50 active:scale-95"
            }`}
            title="Sao chép mã vào bộ nhớ đệm"
          >
            {copied ? (
              <>
                <Check size={13} /> Đã chép
              </>
            ) : (
              <>
                <Copy size={13} /> Sao chép
              </>
            )}
          </button>
        </div>

        <div className="bg-black/15 rounded-xl p-2.5 backdrop-blur-xs">
          <p className="text-xs font-bold text-yellow-100 flex items-center gap-1">
            <Sparkles size={12} className="text-yellow-300" />
            {voucher.label || `Giảm ${voucher.discount.toLocaleString("vi-VN")}đ`}
          </p>
          <p className="text-[10px] text-white/80 mt-0.5">
            Áp dụng cho đơn hàng từ {voucher.minSpend.toLocaleString("vi-VN")}đ
          </p>
        </div>

        <div className="text-[10px] text-white/90 flex items-center justify-between pt-0.5">
          <span>HSD: 30 ngày từ khi nhận</span>
          <span className="font-semibold text-yellow-200">BookVerse Mall</span>
        </div>
      </div>
    </div>
  );
};
