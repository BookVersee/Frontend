import React from "react";
import { ArrowLeft, ShoppingCart, Plus, Minus, Trash2, CreditCard } from "lucide-react";
import { useCart } from "../../contexts/CartContext";
import { BookCover } from "../../components/common/BookCover";
import { Card } from "../../components/common/Card";
import { Btn } from "../../components/common/Btn";
import { fmt } from "../../utils/format";

export const CartPage = ({ onBack, onCheckout }) => {
  const { cart, updateQuantity, removeFromCart, subtotal, shippingFee, total, cartCount } =
    useCart();

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 mb-6 transition-colors font-medium cursor-pointer"
      >
        <ArrowLeft size={16} /> Tiếp tục mua sắm
      </button>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">
          Giỏ hàng của bạn
        </h1>
        <span className="text-xs font-semibold text-slate-500 bg-slate-200/70 px-3 py-1 rounded-full">
          {cartCount} sản phẩm
        </span>
      </div>

      {cart.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4 text-slate-400">
            <ShoppingCart size={32} />
          </div>
          <h2 className="text-lg font-bold text-slate-700 mb-1">
            Giỏ hàng đang trống
          </h2>
          <p className="text-xs text-slate-400 mb-6">
            Hãy khám phá thêm nhiều tựa sách hấp dẫn tại trang chủ.
          </p>
          <Btn onClick={onBack} color="#1d4ed8">
            Khám phá sách ngay
          </Btn>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-3">
            {cart.map((item) => (
              <Card
                key={item.book.id}
                className="p-4 flex items-center gap-4 hover:border-blue-200 transition-colors"
              >
                <div className="w-14 shrink-0">
                  <BookCover book={item.book} size="sm" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md inline-block mb-1">
                    {item.book.shopName}
                  </span>
                  <p className="font-semibold text-sm text-slate-800 line-clamp-1">
                    {item.book.title}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {item.book.author}
                  </p>
                  <p className="text-sm font-bold text-blue-600 mt-1">
                    {fmt(item.book.price)}
                  </p>
                </div>

                <div className="flex flex-col items-end gap-3">
                  <button
                    onClick={() => removeFromCart(item.book.id)}
                    className="text-slate-400 hover:text-red-500 p-1 transition-colors cursor-pointer"
                    title="Xóa khỏi giỏ"
                  >
                    <Trash2 size={16} />
                  </button>

                  <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50 overflow-hidden">
                    <button
                      onClick={() =>
                        updateQuantity(item.book.id, item.quantity - 1)
                      }
                      className="p-1.5 hover:bg-slate-200 transition-colors text-slate-600"
                    >
                      <Minus size={12} />
                    </button>
                    <span className="w-7 text-center text-xs font-bold text-slate-800">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() =>
                        updateQuantity(
                          item.book.id,
                          Math.min(item.book.stock, item.quantity + 1)
                        )
                      }
                      className="p-1.5 hover:bg-slate-200 transition-colors text-slate-600"
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <div className="space-y-4">
            <Card className="p-5">
              <h3 className="font-bold text-slate-800 text-sm mb-4 border-b border-slate-100 pb-3">
                Tóm tắt thanh toán
              </h3>
              <div className="space-y-2.5 text-xs text-slate-600 mb-4">
                <div className="flex justify-between">
                  <span>Tạm tính ({cartCount} món)</span>
                  <span className="font-semibold text-slate-800">
                    {fmt(subtotal)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Phí ship (GHN)</span>
                  <span className="font-semibold text-slate-800">
                    {fmt(shippingFee)}
                  </span>
                </div>
                <div className="border-t border-slate-100 pt-3 flex justify-between text-sm font-bold text-slate-900">
                  <span>Tổng tiền</span>
                  <span className="text-blue-600 text-base">{fmt(total)}</span>
                </div>
              </div>

              <Btn
                onClick={onCheckout}
                size="md"
                color="#1d4ed8"
                className="w-full"
              >
                <CreditCard size={16} /> Tiến hành đặt hàng
              </Btn>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};
