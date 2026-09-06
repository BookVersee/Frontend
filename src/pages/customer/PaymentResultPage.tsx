import React, { useEffect, useState, useRef } from "react";
import {
  CheckCircle,
  XCircle,
  ArrowRight,
  Home,
  Smartphone,
  CreditCard,
  ShoppingCart,
  ShieldCheck,
  RotateCcw,
  RefreshCw,
  Package,
} from "lucide-react";
import { Btn } from "../../components/common/Btn";
import { fmt } from "../../utils/format";
import { useCart } from "../../contexts/CartContext";
import { orderService } from "../../services/orderService";
import { cartService } from "../../services/cartService";

interface PaymentResultPageProps {
  onViewOrders: () => void;
  onGoHome: () => void;
  onGoToCart?: () => void;
}

export const PaymentResultPage: React.FC<PaymentResultPageProps> = ({
  onViewOrders,
  onGoHome,
  onGoToCart,
}) => {
  const { cart, refreshCart } = useCart();
  const [isSyncing, setIsSyncing] = useState(false);
  const syncExecuted = useRef(false);

  const urlParams = new URLSearchParams(window.location.search);

  // MoMo Parameters
  const momoResultCode = urlParams.get("resultCode");
  const momoOrderId = urlParams.get("orderId") || "";
  const momoTransId = urlParams.get("transId") || "";
  const momoMessage = urlParams.get("message") || "";
  const partnerCode = urlParams.get("partnerCode") || "";
  const momoAmount = urlParams.get("amount") ? Number(urlParams.get("amount")) : null;

  // VNPay Parameters
  const vnpResponseCode = urlParams.get("vnp_ResponseCode");
  const vnpTxnRef = urlParams.get("vnp_TxnRef") || "";
  const vnpAmount = urlParams.get("vnp_Amount") ? Number(urlParams.get("vnp_Amount")) / 100 : null;

  // Xác định nhà cung cấp và trạng thái thanh toán
  const isMomo = partnerCode.toUpperCase() === "MOMO" || momoResultCode !== null;
  const isSuccess = isMomo
    ? momoResultCode === "0"
    : vnpResponseCode === "00";

  const orderId = momoOrderId || vnpTxnRef;
  const gatewayName = isMomo ? "Ví MoMo" : "VNPAY";
  const displayTxn = isMomo ? momoTransId || momoOrderId : vnpTxnRef;
  const displayAmount = isMomo ? momoAmount : vnpAmount;

  // Khởi tạo danh sách sản phẩm thực sự thuộc đơn hàng vừa thanh toán (từ sessionStorage)
  const [orderItems, setOrderItems] = useState<any[]>(() => {
    try {
      const pendingStr = sessionStorage.getItem("bookverse_pending_checkout");
      if (pendingStr) {
        const parsed = JSON.parse(pendingStr);
        if (Array.isArray(parsed?.items) && parsed.items.length > 0) {
          return parsed.items;
        }
      }
    } catch (e) {}
    return [];
  });

  const [targetBookIds, setTargetBookIds] = useState<string[]>(() => {
    try {
      const pendingStr = sessionStorage.getItem("bookverse_pending_checkout");
      if (pendingStr) {
        const parsed = JSON.parse(pendingStr);
        if (Array.isArray(parsed?.purchasedBookIds) && parsed.purchasedBookIds.length > 0) {
          return parsed.purchasedBookIds.map(String);
        }
        if (Array.isArray(parsed?.items)) {
          return parsed.items.map((i: any) => String(i?.book?.id || i?.bookId)).filter(Boolean);
        }
      }
    } catch (e) {}
    return [];
  });

  // Tự động kích hoạt đồng bộ khi trang kết quả được mở
  useEffect(() => {
    if (syncExecuted.current) return;
    syncExecuted.current = true;

    const syncStatus = async () => {
      if (isSuccess) {
        sessionStorage.removeItem("bookverse_pending_checkout");
        try {
          await refreshCart(false);
        } catch (e) {
          console.warn("[PaymentResult] Lỗi khi đồng bộ giỏ hàng sau thanh toán thành công:", e);
        }
      } else {
        // Giao dịch thất bại hoặc bị hủy:
        setIsSyncing(true);
        try {
          // 1. Trích xuất đúng Order ID thực sự (thay vì paymentId_timestamp từ MoMo)
          let realOrderId = "";
          let pendingItems: any[] = [];
          let pendingBookIds: string[] = [];
          try {
            const pendingStr = sessionStorage.getItem("bookverse_pending_checkout");
            if (pendingStr) {
              const pending = JSON.parse(pendingStr);
              if (pending?.orderId) realOrderId = String(pending.orderId);
              if (Array.isArray(pending?.items)) pendingItems = pending.items;
              if (Array.isArray(pending?.purchasedBookIds)) {
                pendingBookIds = pending.purchasedBookIds.map(String);
              }
            }
          } catch (e) {}

          // Fallback: nếu không có trong sessionStorage, tìm đơn PENDING gần nhất của khách
          if (!realOrderId) {
            try {
              const orders = await orderService.getOrders();
              const latestPending = orders.find((o) => o.orderStatus === "PENDING");
              if (latestPending) {
                realOrderId = String(latestPending.id);
                if (latestPending.items && latestPending.items.length > 0 && orderItems.length === 0) {
                  setOrderItems(latestPending.items);
                  const bIds = latestPending.items.map((i: any) => String(i?.book?.id || i?.bookId)).filter(Boolean);
                  setTargetBookIds(bIds);
                  pendingBookIds = bIds;
                }
              }
            } catch (e) {}
          }

          // 2. Kích hoạt Backend hủy đơn PENDING ngay lập tức:
          // Backend OrderService.CancelOrderAsync sẽ set OrderStatus = CANCELLED, hoàn kho và set cbd.IsDeleted = false
          if (realOrderId) {
            try {
              await orderService.cancelOrder(realOrderId, "Hủy thanh toán MoMo");
            } catch (cancelErr) {
              console.warn("[PaymentResult] cancelOrder error:", cancelErr);
            }
          }

          // 3. Tải lại giỏ hàng từ máy chủ và CHỈ tick chọn đúng các cuốn sách vừa được hoàn trả của đơn này
          const selectIds = pendingBookIds.length > 0 ? pendingBookIds : targetBookIds;
          await refreshCart(selectIds.length > 0 ? selectIds : true);

          // 4. Fallback tối cao: Nếu giỏ hàng từ server vẫn trống (do DB issue), khôi phục từ snapshot
          const currentCart = await cartService.getCart();
          const hasActiveItems = currentCart?.shopGroups?.some((g: any) => (g.items?.length || 0) > 0);
          if (!hasActiveItems && pendingItems.length > 0) {
            console.log("[PaymentResult] Phục hồi giỏ hàng từ pending snapshot...");
            for (const item of pendingItems) {
              const bId = item?.book?.id || item?.bookId;
              if (bId) {
                try {
                  await cartService.addToCart(bId, item.quantity || 1);
                } catch (addErr) {
                  console.warn("addToCart fallback error:", addErr);
                }
              }
            }
            await refreshCart(selectIds.length > 0 ? selectIds : true);
          }
        } catch (e) {
          console.warn("[PaymentResult] syncStatus error:", e);
        } finally {
          setIsSyncing(false);
        }
      }
    };

    syncStatus();
  }, [isSuccess, orderId, refreshCart, orderItems.length, targetBookIds]);

  // Chuẩn hóa đối tượng sản phẩm để render an toàn
  const displayItems = orderItems.length > 0
    ? orderItems.map((item) => {
        const book = item.book || {};
        return {
          id: book.id || item.bookId || item.id,
          title: book.title || item.bookTitle || "Sách đã chọn",
          imageUrl: book.imageUrl || item.bookImage || item.imageUrl || "",
          quantity: item.quantity || 1,
          price: item.unitPrice || book.price || item.price || 0,
        };
      })
    : cart.slice(0, 3).map((item) => ({
        id: item.book?.id,
        title: item.book?.title,
        imageUrl: item.book?.imageUrl,
        quantity: item.quantity,
        price: item.book?.price || 0,
      }));

  const totalCalculated = displayItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const finalAmount = displayAmount || (totalCalculated > 0 ? totalCalculated : null);

  const displayMessage = isSuccess
    ? isMomo
      ? "Giao dịch thanh toán MoMo thành công! Đơn hàng của bạn đã được xác nhận và chuyển sang nhà sách để chuẩn bị đóng gói."
      : "Giao dịch thanh toán VNPAY đã được xác nhận thành công. Đơn hàng của bạn đang được chuẩn bị."
    : isMomo
    ? "Giao dịch đã được hủy theo yêu cầu của bạn trên cổng MoMo. Toàn bộ sách đã được hoàn trả về giỏ hàng an toàn."
    : "Giao dịch VNPAY bị hủy hoặc chưa hoàn tất. Đơn hàng đã được lưu lại trong hệ thống.";

  return (
    <div className="max-w-md mx-auto px-4 sm:px-6 py-10 text-center animate-in fade-in zoom-in-95 duration-200">
      {/* 1. Status Icon */}
      <div
        className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
          isSuccess
            ? isMomo
              ? "bg-pink-50 text-pink-600 ring-8 ring-pink-50/50"
              : "bg-emerald-50 text-emerald-600 ring-8 ring-emerald-50/50"
            : "bg-amber-50 text-amber-600 ring-8 ring-amber-50/50"
        }`}
      >
        {isSuccess ? <CheckCircle size={36} /> : <XCircle size={36} />}
      </div>

      {/* 2. Tiêu đề & Thông điệp */}
      <h1 className="text-xl font-extrabold text-slate-800 mb-1.5 tracking-tight">
        {isSuccess
          ? isMomo
            ? "Thanh toán MoMo thành công!"
            : "Thanh toán VNPAY thành công!"
          : "Giao dịch chưa hoàn tất"}
      </h1>

      <p className="text-slate-500 text-xs mb-4 leading-relaxed max-w-sm mx-auto">
        {momoMessage && momoMessage !== "Success" && momoMessage !== "Giao dịch thành công."
          ? momoMessage
          : displayMessage}
      </p>

      {/* 3. Cam kết bảo vệ quyền lợi (Pills nhỏ gọn thay cho box dài cồng kềnh) */}
      {!isSuccess && (
        <div className="flex flex-wrap items-center justify-center gap-1.5 mb-5">
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2.5 py-0.5 rounded-full">
            <ShieldCheck size={13} className="text-emerald-600" />
            Không bị trừ tiền
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-700 bg-blue-50 border border-blue-200/60 px-2.5 py-0.5 rounded-full">
            <ShoppingCart size={13} className="text-blue-600" />
            Đã hoàn lại giỏ
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 bg-slate-100 border border-slate-200/80 px-2.5 py-0.5 rounded-full">
            <CheckCircle size={13} className="text-slate-500" />
            Đơn đã hủy an toàn
          </span>
        </div>
      )}

      {/* Syncing indicator */}
      {isSyncing && (
        <div className="flex items-center justify-center gap-2 text-xs font-medium text-slate-500 bg-slate-100 py-2 px-3 rounded-xl mb-4 animate-pulse">
          <RefreshCw size={13} className="animate-spin text-pink-600" />
          <span>Đang đồng bộ trạng thái giỏ hàng từ máy chủ...</span>
        </div>
      )}

      {/* 4. Thẻ Tổng Hợp Đơn Hàng Duy Nhất (Single Consolidated Card) */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs text-left overflow-hidden mb-6">
        {/* Header thẻ: Cổng thanh toán & Trạng thái */}
        <div className="px-4 py-3 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 font-bold">
            {isMomo ? (
              <span className="text-pink-600 flex items-center gap-1">
                <Smartphone size={14} />
                Ví MoMo
              </span>
            ) : (
              <span className="text-blue-600 flex items-center gap-1">
                <CreditCard size={14} />
                VNPAY
              </span>
            )}
            {orderId && (
              <span className="font-mono text-slate-400 font-normal text-[11px]">
                #{String(orderId).slice(0, 10)}
              </span>
            )}
          </div>
          <span
            className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md ${
              isSuccess
                ? "bg-emerald-100 text-emerald-700"
                : "bg-amber-100 text-amber-800"
            }`}
          >
            {isSuccess ? "ĐÃ THANH TOÁN" : "CHƯA THANH TOÁN"}
          </span>
        </div>

        {/* Danh sách đúng các cuốn sách trong đơn hàng */}
        <div className="p-4 divide-y divide-slate-100">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">
            {isSuccess ? "Sản phẩm đã mua" : "Sản phẩm trong đơn hàng"} ({displayItems.length})
          </div>

          <div className="space-y-3 pt-1">
            {displayItems.map((item, idx) => (
              <div key={item.id || idx} className="flex items-center gap-3 text-xs">
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="w-10 h-13 object-cover rounded-md border border-slate-200 shrink-0 shadow-2xs"
                  />
                ) : (
                  <div className="w-10 h-13 bg-slate-100 rounded-md border border-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                    <Package size={16} />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-800 truncate" title={item.title}>
                    {item.title}
                  </p>
                  <p className="text-slate-400 text-[11px] mt-0.5">Số lượng: {item.quantity}</p>
                </div>
                <span className="font-bold text-slate-700 shrink-0 text-right">
                  {fmt(item.price * item.quantity)}
                </span>
              </div>
            ))}
          </div>

          {/* Tổng tiền đơn hàng */}
          {finalAmount !== null && (
            <div className="pt-3 mt-3 flex items-center justify-between text-xs">
              <span className="font-medium text-slate-500">Tổng thanh toán</span>
              <span className="text-base font-extrabold text-slate-900">
                {fmt(finalAmount)}
              </span>
            </div>
          )}
        </div>

        {/* Ghi chú nhắc nhở tinh tế ở chân thẻ */}
        {!isSuccess && (
          <div className="px-4 py-2.5 bg-pink-50/60 border-t border-pink-100/70 text-[11px] text-pink-800 flex items-center gap-2">
            <ShoppingCart size={13} className="text-pink-600 shrink-0" />
            <span>
              Sản phẩm trên đã được chọn sẵn trong giỏ hàng để bạn dễ dàng đặt lại.
            </span>
          </div>
        )}
      </div>

      {/* 5. Cụm Nút Hành Động Tinh Gọn (Chỉ 2 luồng rõ ràng: Chính & Phụ) */}
      <div className="space-y-2">
        {/* Nút Hành Động Chính (Primary Action) */}
        {!isSuccess ? (
          onGoToCart && (
            <Btn
              onClick={onGoToCart}
              color={isMomo ? "#d82d8b" : "#2563eb"}
              size="lg"
              className="w-full font-bold shadow-md cursor-pointer flex items-center justify-center gap-2 text-sm py-3"
            >
              <RotateCcw size={17} />
              <span>Quay lại giỏ hàng & Đặt lại ngay</span>
              <ArrowRight size={16} />
            </Btn>
          )
        ) : (
          <Btn
            onClick={onViewOrders}
            color={isMomo ? "#d82d8b" : "#2563eb"}
            size="lg"
            className="w-full font-bold shadow-md cursor-pointer flex items-center justify-center gap-2 text-sm py-3"
          >
            <span>Xem đơn hàng của tôi</span>
            <ArrowRight size={16} />
          </Btn>
        )}

        {/* Nút Hành Động Phụ (Secondary Action) */}
        <button
          type="button"
          onClick={onGoHome}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-slate-200/90 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 hover:text-slate-900 transition-all cursor-pointer shadow-2xs"
        >
          <Home size={14} />
          <span>Tiếp tục khám phá sách</span>
        </button>

        {/* Link phụ tinh tế: Xem lịch sử đơn hàng */}
        {!isSuccess && (
          <div className="pt-2">
            <button
              type="button"
              onClick={onViewOrders}
              className="text-[11px] text-slate-400 hover:text-slate-700 transition-all cursor-pointer inline-flex items-center gap-1 hover:underline"
            >
              <span>Xem chi tiết trong lịch sử đơn hàng</span>
              <ArrowRight size={11} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
