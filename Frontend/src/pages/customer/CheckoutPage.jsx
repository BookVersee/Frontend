import React, { useState } from "react";
import { ArrowLeft, MapPin, CreditCard, Check, CheckCircle } from "lucide-react";
import { useCart } from "../../contexts/CartContext";
import { useAuth } from "../../contexts/AuthContext";
import { Card } from "../../components/common/Card";
import { Btn } from "../../components/common/Btn";
import { fmt } from "../../utils/format";
import { orderService } from "../../services/orderService";

export const CheckoutPage = ({
  onBack,
  onSuccess,
}) => {
  const { cart, subtotal, shippingFee, total, clearCart } = useCart();
  const { user } = useAuth();

  const [method, setMethod] = useState("ONLINE");
  const [address, setAddress] = useState("123 Nguyễn Huệ, Quận 1, TP.HCM");
  const [phone, setPhone] = useState(user?.phone || "0901234567");
  const [customerName, setCustomerName] = useState(user?.name || "Nguyễn Văn An");
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const handlePlaceOrder = async () => {
    setIsSubmitting(true);
    try {
      await orderService.createOrder({
        customerId: user?.id || 1,
        customerName,
        customerPhone: phone,
        cart,
        paymentMethod: method,
        shippingAddress: address,
        note,
      });
      clearCart();
      setDone(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="max-w-md mx-auto px-6 py-20 text-center">
        <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-5 text-emerald-600 animate-bounce">
          <CheckCircle size={40} />
        </div>
        <h2 className="text-2xl font-extrabold text-slate-800 mb-2">
          Đặt hàng thành công!
        </h2>
        <p className="text-slate-500 text-sm mb-8 leading-relaxed">
          {method === "ONLINE"
            ? "Thanh toán trực tuyến (VNPAY/MoMo) đã được ghi nhận. Đơn hàng sẽ được chuyển tới các shop để đóng gói."
            : "Đơn hàng thanh toán khi nhận hàng (COD) đã được tạo. Vui lòng chuẩn bị tiền mặt khi nhận sách."}
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
                Họ và tên
              </label>
              <input
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full text-xs sm:text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500 bg-slate-50"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Số điện thoại
              </label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full text-xs sm:text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500 bg-slate-50"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Địa chỉ chi tiết (Tính cước qua GHN API)
            </label>
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full text-xs sm:text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500 bg-slate-50"
            />
          </div>
        </Card>

        {/* Payment Methods */}
        <Card className="p-5">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">
            Phương thức thanh toán
          </p>
          <div className="space-y-3">
            {["ONLINE", "COD"].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMethod(m)}
                className={`w-full flex items-center gap-3.5 p-3.5 rounded-2xl border-2 transition-all text-left cursor-pointer ${
                  method === m
                    ? "border-blue-600 bg-blue-50/70"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    method === m ? "border-blue-600" : "border-slate-300"
                  }`}
                >
                  {method === m && (
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-slate-800">
                    {m === "ONLINE"
                      ? "Cổng thanh toán Trực Tuyến (VNPAY / MoMo)"
                      : "Thanh toán khi nhận hàng (COD)"}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {m === "ONLINE"
                      ? "Thanh toán ngay bằng thẻ ATM, Visa, QRCode bảo mật cao"
                      : "Kiểm tra hàng và thanh toán tiền mặt trực tiếp cho Shipper"}
                  </p>
                </div>
              </button>
            ))}
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
              <span className="text-blue-600 text-lg">{fmt(total)}</span>
            </div>
          </div>
        </Card>
      </div>

      <Btn
        onClick={handlePlaceOrder}
        disabled={isSubmitting}
        size="lg"
        color="#1d4ed8"
        className="w-full"
      >
        {isSubmitting ? (
          "Đang khởi tạo đơn hàng..."
        ) : method === "ONLINE" ? (
          <>
            <CreditCard size={18} /> Xác nhận & Thanh toán ngay
          </>
        ) : (
          <>
            <Check size={18} /> Xác nhận đặt hàng COD
          </>
        )}
      </Btn>
    </div>
  );
};
