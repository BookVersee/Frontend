import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  Check,
  CheckSquare,
  Square,
  RotateCcw,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { useCart } from "../../contexts/CartContext";
import { BookCover } from "../../components/common/BookCover";
import { Card } from "../../components/common/Card";
import { Btn } from "../../components/common/Btn";
import { fmt } from "../../utils/format";
import { orderService } from "../../services/orderService";
import { cartService } from "../../services/cartService";

interface CartPageProps {
  onBack: () => void;
  onCheckout: () => void;
}

export const CartPage: React.FC<CartPageProps> = ({ onBack, onCheckout }) => {
  const {
    cart,
    updateQuantity,
    removeFromCart,
    cartCount,
    toggleSelectItem,
    toggleSelectAll,
    isItemSelected,
    isAllSelected,
    selectedBookIds,
    selectedCount,
    selectedSubtotal,
    selectedShippingFee,
    selectedTotal,
    removePurchasedItems,
    refreshCart,
  } = useCart();

  const [isRestoring, setIsRestoring] = useState(false);
  const [restoredNotice, setRestoredNotice] = useState<string | null>(null);

  // Tự động kiểm tra và khôi phục nếu khách vừa rời MoMo mà đơn hàng chưa hoàn tất
  useEffect(() => {
    const autoRestoreAbandoned = async () => {
      if (cart.length > 0) return;

      let pendingOrderId = "";
      let pendingItems: any[] = [];
      try {
        const pendingStr = sessionStorage.getItem("bookverse_pending_checkout");
        if (pendingStr) {
          const pending = JSON.parse(pendingStr);
          if (pending?.orderId) pendingOrderId = String(pending.orderId);
          if (Array.isArray(pending?.items)) pendingItems = pending.items;
        }
      } catch (e) {}

      if (!pendingOrderId) {
        try {
          // Kiểm tra xem user có đơn PENDING phương thức ONLINE nào không
          const orders = await orderService.getOrders();
          const pendingOrder = orders.find(
            (o) => o.orderStatus === "PENDING" && o.paymentMethod === "ONLINE"
          );
          if (pendingOrder) {
            pendingOrderId = String(pendingOrder.id);
          }
        } catch (e) {}
      }

      if (pendingOrderId) {
        setIsRestoring(true);
        try {
          // Hủy đơn PENDING để Backend tự động hoàn trả cbd.IsDeleted = false
          await orderService.cancelOrder(pendingOrderId, "Khách hàng quay lại giỏ hàng từ thanh toán online");
          await refreshCart(true);

          // Fallback snapshot nếu cần
          const c = await cartService.getCart();
          const hasItems = c?.shopGroups?.some((g: any) => (g.items?.length || 0) > 0);
          if (!hasItems && pendingItems.length > 0) {
            for (const it of pendingItems) {
              if (it?.book?.id) {
                try {
                  await cartService.addToCart(it.book.id, it.quantity || 1);
                } catch (addErr) {
                  console.warn("addToCart fallback error:", addErr);
                }
              }
            }
            await refreshCart(true);
          }

          setRestoredNotice("Đã tự động khôi phục các sản phẩm từ giao dịch chưa hoàn tất vào giỏ hàng của bạn!");
          setTimeout(() => setRestoredNotice(null), 6000);
          sessionStorage.removeItem("bookverse_pending_checkout");
        } catch (err) {
          console.warn("Auto restore error:", err);
        } finally {
          setIsRestoring(false);
        }
      }
    };

    autoRestoreAbandoned();
  }, [cart.length, refreshCart]);

  const handleManualCheckAndRestore = async () => {
    setIsRestoring(true);
    try {
      let pendingOrderId = "";
      try {
        const pendingStr = sessionStorage.getItem("bookverse_pending_checkout");
        if (pendingStr) {
          const pending = JSON.parse(pendingStr);
          if (pending?.orderId) pendingOrderId = String(pending.orderId);
        }
      } catch (e) {}

      if (!pendingOrderId) {
        const orders = await orderService.getOrders();
        const pendingOrder = orders.find((o) => o.orderStatus === "PENDING");
        if (pendingOrder) {
          pendingOrderId = String(pendingOrder.id);
        }
      }

      if (pendingOrderId) {
        await orderService.cancelOrder(pendingOrderId, "Khách hàng khôi phục giỏ hàng");
        await refreshCart(true);
        setRestoredNotice("Đã khôi phục thành công các sản phẩm vào giỏ hàng!");
        setTimeout(() => setRestoredNotice(null), 5000);
        sessionStorage.removeItem("bookverse_pending_checkout");
      } else {
        await refreshCart(true);
        setRestoredNotice("Đã làm mới dữ liệu giỏ hàng từ máy chủ.");
        setTimeout(() => setRestoredNotice(null), 3000);
      }
    } catch (err: any) {
      console.warn("handleManualCheckAndRestore error:", err);
      await refreshCart(true);
    } finally {
      setIsRestoring(false);
    }
  };

  const handleRemoveSelected = () => {
    if (selectedBookIds.length === 0) return;
    if (window.confirm(`Bạn có chắc muốn xóa ${selectedBookIds.length} sản phẩm đã chọn khỏi giỏ hàng?`)) {
      removePurchasedItems(selectedBookIds);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* Toast thông báo khôi phục thành công */}
      {restoredNotice && (
        <div className="mb-4 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          <span>{restoredNotice}</span>
        </div>
      )}

      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 mb-6 transition-colors font-medium cursor-pointer"
      >
        <ArrowLeft size={16} /> Tiếp tục mua sắm
      </button>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">
            Giỏ hàng của bạn
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Chọn các sản phẩm bạn muốn đặt mua và tiến hành thanh toán
          </p>
        </div>
        <span className="text-xs font-semibold text-slate-600 bg-slate-200/80 px-3.5 py-1.5 rounded-full">
          {cartCount} sản phẩm
        </span>
      </div>

      {cart.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4 text-slate-400">
            <ShoppingCart size={32} />
          </div>
          <h2 className="text-lg font-bold text-slate-700 mb-1">
            Giỏ hàng đang trống
          </h2>
          <p className="text-xs text-slate-400 mb-6 max-w-sm mx-auto leading-relaxed">
            Nếu bạn vừa thanh toán qua MoMo nhưng chưa hoàn tất hoặc gặp sự cố, bạn có thể bấm nút khôi phục bên dưới để lấy lại các cuốn sách của mình.
          </p>

          {isRestoring && (
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-blue-700 bg-blue-50 py-2 px-4 rounded-xl mb-4 animate-pulse">
              <Loader2 size={14} className="animate-spin text-blue-600" />
              <span>Đang kiểm tra và phục hồi sách từ giao dịch trước...</span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={handleManualCheckAndRestore}
              disabled={isRestoring}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-pink-200 bg-pink-50/80 text-pink-700 hover:bg-pink-100 text-xs font-bold transition-all cursor-pointer shadow-2xs"
            >
              <RotateCcw size={14} className={isRestoring ? "animate-spin" : ""} />
              <span>Khôi phục sách từ đơn MoMo chưa thanh toán</span>
            </button>

            <Btn onClick={onBack} color="#1d4ed8">
              Khám phá sách ngay
            </Btn>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-3">
            {/* Thanh công cụ Chọn tất cả / Xóa đã chọn */}
            <div className="p-3.5 bg-white rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
              <label className="flex items-center gap-2.5 text-xs sm:text-sm font-semibold text-slate-700 cursor-pointer select-none">
                <button
                  type="button"
                  onClick={toggleSelectAll}
                  className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all cursor-pointer ${
                    isAllSelected
                      ? "bg-blue-600 border-blue-600 text-white"
                      : "bg-white border-slate-300 hover:border-blue-400 text-transparent"
                  }`}
                  title={isAllSelected ? "Bỏ chọn tất cả" : "Chọn tất cả"}
                >
                  <Check size={13} strokeWidth={3} />
                </button>
                <span>Chọn tất cả ({cart.length} sản phẩm)</span>
              </label>

              {selectedBookIds.length > 0 && (
                <button
                  type="button"
                  onClick={handleRemoveSelected}
                  className="text-xs font-semibold text-red-500 hover:text-red-700 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 size={13} />
                  <span>Xóa đã chọn ({selectedBookIds.length})</span>
                </button>
              )}
            </div>

            {/* Danh sách thẻ sản phẩm */}
            {cart.map((item) => {
              const checked = isItemSelected(item.book.id);
              return (
                <Card
                  key={item.book.id}
                  className={`p-3.5 sm:p-4 flex items-center gap-3 sm:gap-4 transition-all ${
                    checked
                      ? "bg-white border-blue-200 shadow-sm"
                      : "bg-slate-50/70 border-slate-200 opacity-75"
                  }`}
                >
                  {/* 1. Checkbox chọn từng sản phẩm */}
                  <div className="shrink-0">
                    <button
                      type="button"
                      onClick={() => toggleSelectItem(item.book.id)}
                      className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all cursor-pointer ${
                        checked
                          ? "bg-blue-600 border-blue-600 text-white shadow-xs"
                          : "bg-white border-slate-300 hover:border-blue-400 text-transparent"
                      }`}
                      title={checked ? "Bỏ chọn" : "Chọn thanh toán"}
                    >
                      <Check size={13} strokeWidth={3} />
                    </button>
                  </div>

                  {/* 2. Ảnh bìa sách (Đã fix layout không bị đè chữ) */}
                  <div className="w-16 h-22 sm:w-18 shrink-0 flex items-center justify-center relative overflow-hidden rounded-lg bg-slate-100 border border-slate-200/80 shadow-2xs">
                    <BookCover book={item.book} size="xs" />
                  </div>

                  {/* 3. Thông tin sách */}
                  <div className="flex-1 min-w-0 pr-1">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md inline-block truncate max-w-[180px]">
                        {item.book.shopName || "BookVerse Partner"}
                      </span>
                    </div>

                    <h4 className="font-bold text-xs sm:text-sm text-slate-800 line-clamp-1 leading-snug">
                      {item.book.title}
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                      {item.book.author}
                    </p>
                    <p className="text-xs sm:text-sm font-extrabold text-blue-600 mt-1">
                      {fmt(item.book.price)}
                    </p>
                  </div>

                  {/* 4. Thao tác số lượng & nút xóa */}
                  <div className="flex flex-col items-end gap-2.5 shrink-0">
                    <button
                      onClick={() => removeFromCart(item.book.id)}
                      className="text-slate-400 hover:text-red-500 p-1 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                      title="Xóa sản phẩm"
                    >
                      <Trash2 size={15} />
                    </button>

                    <div className="flex items-center border border-slate-200 rounded-xl bg-white shadow-2xs overflow-hidden">
                      <button
                        onClick={() =>
                          updateQuantity(item.book.id, item.quantity - 1)
                        }
                        className="p-1 sm:p-1.5 hover:bg-slate-100 transition-colors text-slate-600 cursor-pointer"
                      >
                        <Minus size={11} />
                      </button>
                      <span className="w-6 sm:w-7 text-center text-xs font-bold text-slate-800 select-none">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          updateQuantity(
                            item.book.id,
                            Math.min(item.book.stock || 999, item.quantity + 1)
                          )
                        }
                        className="p-1 sm:p-1.5 hover:bg-slate-100 transition-colors text-slate-600 cursor-pointer"
                      >
                        <Plus size={11} />
                      </button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Cột Tóm tắt thanh toán linh hoạt */}
          <div className="space-y-4">
            <Card className="p-5 sticky top-20 shadow-sm border-slate-200/80">
              <h3 className="font-extrabold text-slate-800 text-sm mb-4 border-b border-slate-100 pb-3 flex items-center justify-between">
                <span>Tóm tắt thanh toán</span>
                <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                  {selectedCount} món đã chọn
                </span>
              </h3>

              <div className="space-y-2.5 text-xs text-slate-600 mb-4">
                <div className="flex justify-between items-center">
                  <span>Tạm tính ({selectedCount} món)</span>
                  <span className="font-bold text-slate-800">
                    {fmt(selectedSubtotal)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Phí ship (GHN)</span>
                  <span className="font-bold text-slate-800">
                    {selectedCount > 0 ? fmt(selectedShippingFee) : "0 đ"}
                  </span>
                </div>

                <div className="border-t border-slate-100 pt-3 flex justify-between items-baseline text-sm font-bold text-slate-900">
                  <span>Tổng tiền</span>
                  <div className="text-right">
                    <span className="text-blue-600 text-lg font-extrabold block">
                      {fmt(selectedTotal)}
                    </span>
                    {selectedCount > 0 && (
                      <span className="text-[10px] text-slate-400 font-normal">
                        (Đã bao gồm VAT & phí giao hàng)
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {selectedCount === 0 && (
                <div className="mb-3 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-700 font-medium">
                  Vui lòng tick chọn ít nhất 1 sản phẩm để tiến hành đặt hàng.
                </div>
              )}

              <Btn
                onClick={onCheckout}
                disabled={selectedCount === 0}
                size="md"
                color="#1d4ed8"
                className="w-full shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CreditCard size={16} /> Tiến hành đặt hàng ({selectedCount})
              </Btn>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

