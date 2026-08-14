import React, { useState, useEffect } from 'react';
import { useApp } from '../../context';
import { getBookById, removeFromCart, updateCartItem, getCart, createOrder } from '../../store';
import BookCover from '../../components/BookCover';

function fmt(n) {
  return (n || 0).toLocaleString('vi-VN') + 'đ';
}

export default function Cart() {
  const { currentUser, cart, setCart, navigate, refresh } = useApp();
  const [books, setBooks] = useState({});
  const [address, setAddress] = useState(currentUser?.address || '123 Nguyễn Huệ, Quận 1, TP.HCM');
  const [method, setMethod] = useState('COD');
  const [note, setNote] = useState('');
  const [step, setStep] = useState('cart');
  const [orderId, setOrderId] = useState(null);

  useEffect(() => {
    const bks = {};
    cart.forEach((item) => {
      const b = getBookById(item.book_id);
      if (b) bks[item.book_id] = b;
    });
    setBooks(bks);
  }, [cart]);

  if (!currentUser) return null;

  const handleRemove = (bookId) => {
    removeFromCart(currentUser.user_id, bookId);
    setCart(getCart(currentUser.user_id));
  };

  const handleQtyChange = (bookId, qty) => {
    updateCartItem(currentUser.user_id, bookId, qty);
    setCart(getCart(currentUser.user_id));
  };

  const handleCheckout = () => {
    if (!address.trim()) return;
    const order = createOrder(currentUser.user_id, cart, address, method, note);
    setOrderId(order.order_id);
    setCart([]);
    setStep('success');
    refresh();
  };

  const subtotal = cart.reduce(
    (s, item) => s + (books[item.book_id]?.price || 0) * item.quantity,
    0
  );
  const SHIP_FEE = cart.length > 0 ? 30000 : 0;
  const total = subtotal + SHIP_FEE;

  if (step === 'success') {
    return (
      <div className="bg-[#faf6f1] min-h-[80vh] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl border border-[#ddd0be] p-8 sm:p-12 text-center max-w-md w-full shadow-xl">
          <div className="w-16 h-16 rounded-full bg-[#1a3d24]/10 text-[#1a3d24] flex items-center justify-center text-3xl mx-auto mb-4">
            🎉
          </div>
          <h2 className="font-serif font-extrabold text-2xl sm:text-3xl text-[#1c1612] mb-2">
            Đặt hàng thành công!
          </h2>
          <p className="text-xs sm:text-sm text-[#7a6a5a] leading-relaxed mb-8">
            Đơn hàng <strong>#{orderId}</strong> của bạn đã được chuyển đến shop để xác nhận và đóng gói giao hàng.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => navigate('customer-orders')}
              className="bg-[#1a3d24] hover:bg-[#14301c] text-white py-3 px-6 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-sm"
            >
              Xem đơn hàng
            </button>
            <button
              onClick={() => navigate('home')}
              className="bg-[#f3ede4] hover:bg-[#e8ddd0] text-[#1c1612] py-3 px-6 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
            >
              Tiếp tục mua sách
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#faf6f1] min-h-screen text-[#1c1612]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <span className="text-[11px] font-bold text-[#7a6a5a] uppercase tracking-widest block">
              {step === 'cart' ? 'BƯỚC 01 / 02' : 'BƯỚC 02 / 02'}
            </span>
            <h1 className="font-serif font-extrabold text-3xl sm:text-4xl text-[#1c1612]">
              {step === 'cart' ? 'Giỏ hàng của bạn' : 'Xác nhận & Thanh toán'}
            </h1>
          </div>
          {step === 'checkout' && (
            <button
              onClick={() => setStep('cart')}
              className="text-xs font-bold text-[#1a3d24] hover:underline cursor-pointer"
            >
              ← Quay lại chỉnh giỏ hàng
            </button>
          )}
        </div>

        {cart.length === 0 && step === 'cart' ? (
          <div className="bg-white rounded-3xl border border-[#ddd0be] p-12 sm:p-16 text-center max-w-lg mx-auto shadow-sm">
            <div className="text-5xl mb-4">🛒</div>
            <h2 className="font-serif font-bold text-xl text-[#1c1612] mb-1">
              Giỏ hàng của bạn đang trống
            </h2>
            <p className="text-xs text-[#7a6a5a] mb-6">
              Hãy khám phá các đầu sách bán chạy và gian hàng nổi bật.
            </p>
            <button
              onClick={() => navigate('home')}
              className="bg-[#1a3d24] hover:bg-[#14301c] text-white py-3 px-8 rounded-full font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-sm"
            >
              Khám phá sách ngay
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Cart Items or Checkout Form (8 cols) */}
            <div className="lg:col-span-8 space-y-4">
              {step === 'cart' ? (
                cart.map((item) => {
                  const b = books[item.book_id];
                  if (!b) return null;
                  return (
                    <div
                      key={item.book_id}
                      className="bg-white rounded-2xl border border-[#ddd0be] p-4 sm:p-5 flex items-center gap-4 sm:gap-6 shadow-xs hover:border-[#1a3d24]/30 transition-all"
                    >
                      <div className="w-14 sm:w-16 shrink-0 bg-[#f3ede4] p-1 rounded-md flex justify-center">
                        <BookCover
                          color={b.cover_color}
                          title={b.title}
                          author={b.author}
                          size="xs"
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <span className="text-[10px] font-bold text-[#7a6a5a] uppercase tracking-wider block">
                          {b.shop_name}
                        </span>
                        <h3
                          onClick={() => navigate('book-detail', { bookId: b.book_id })}
                          className="font-serif font-bold text-sm sm:text-base text-[#1c1612] hover:text-[#1a3d24] transition-colors truncate cursor-pointer"
                        >
                          {b.title}
                        </h3>
                        <p className="text-xs text-[#7a6a5a] italic mb-2">{b.author}</p>

                        <div className="flex items-center gap-4">
                          <div className="flex items-center bg-[#f3ede4] border border-[#ddd0be] rounded-lg overflow-hidden">
                            <button
                              onClick={() => handleQtyChange(item.book_id, item.quantity - 1)}
                              className="w-7 h-7 text-xs font-bold text-[#1c1612] hover:bg-[#e8ddd0] cursor-pointer"
                            >
                              −
                            </button>
                            <span className="w-8 text-center text-xs font-bold">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => handleQtyChange(item.book_id, item.quantity + 1)}
                              className="w-7 h-7 text-xs font-bold text-[#1c1612] hover:bg-[#e8ddd0] cursor-pointer"
                            >
                              +
                            </button>
                          </div>

                          <button
                            onClick={() => handleRemove(item.book_id)}
                            className="text-xs text-red-600 hover:underline cursor-pointer"
                          >
                            Xóa
                          </button>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="font-serif font-black text-base text-[#1a3d24]">
                          {fmt(b.price * item.quantity)}
                        </span>
                        <span className="text-[11px] text-[#7a6a5a] block">
                          {fmt(b.price)} / cuốn
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                /* Checkout Form */
                <div className="bg-white rounded-3xl border border-[#ddd0be] p-6 sm:p-8 shadow-sm space-y-6">
                  <div>
                    <h3 className="font-serif font-bold text-lg text-[#1c1612] mb-4">
                      1. Địa chỉ giao hàng
                    </h3>
                    <input
                      type="text"
                      required
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành..."
                      className="w-full px-4 py-3 bg-[#f3ede4] border border-[#ddd0be] rounded-xl text-sm text-[#1c1612] focus:outline-none focus:border-[#1a3d24]"
                    />
                  </div>

                  <div>
                    <h3 className="font-serif font-bold text-lg text-[#1c1612] mb-3">
                      2. Phương thức thanh toán
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[
                        {
                          m: 'COD',
                          title: 'Thanh toán khi nhận hàng (COD)',
                          desc: 'Kiểm tra sách và thanh toán tiền mặt cho shipper',
                        },
                        {
                          m: 'ONLINE',
                          title: 'Chuyển khoản / Ví điện tử',
                          desc: 'Thanh toán trực tuyến qua VNPAY, MoMo, ZaloPay',
                        },
                      ].map(({ m, title, desc }) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setMethod(m)}
                          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                            method === m
                              ? 'border-[#1a3d24] bg-[#1a3d24]/5 ring-1 ring-[#1a3d24]'
                              : 'border-[#ddd0be] bg-[#f3ede4] hover:bg-[#e8ddd0]'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-xs text-[#1c1612]">{title}</span>
                            {method === m && <span className="text-[#1a3d24] text-xs font-black">✓</span>}
                          </div>
                          <p className="text-[11px] text-[#7a6a5a]">{desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-serif font-bold text-lg text-[#1c1612] mb-2">
                      3. Ghi chú giao hàng (Tùy chọn)
                    </h3>
                    <textarea
                      rows={3}
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Giao giờ hành chính, gọi trước khi giao..."
                      className="w-full px-4 py-3 bg-[#f3ede4] border border-[#ddd0be] rounded-xl text-sm text-[#1c1612] focus:outline-none focus:border-[#1a3d24] resize-none"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Order Summary (4 cols) */}
            <div className="lg:col-span-4 bg-white rounded-3xl border border-[#ddd0be] p-6 shadow-sm sticky top-28">
              <h3 className="font-serif font-bold text-lg text-[#1c1612] mb-4 pb-3 border-b border-[#ddd0be]">
                Tóm tắt đơn hàng
              </h3>

              <div className="space-y-3 text-xs text-[#5a4a3a] mb-6">
                <div className="flex justify-between">
                  <span>Tiền sách ({cart.reduce((s, i) => s + i.quantity, 0)} cuốn)</span>
                  <span className="font-bold text-[#1c1612]">{fmt(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Phí vận chuyển toàn quốc</span>
                  <span className="font-bold text-[#1c1612]">{fmt(SHIP_FEE)}</span>
                </div>
                <div className="pt-3 border-t border-[#ddd0be] flex justify-between items-baseline">
                  <span className="font-serif font-bold text-base text-[#1c1612]">Tổng thanh toán</span>
                  <span className="font-serif font-black text-2xl text-[#1a3d24]">{fmt(total)}</span>
                </div>
              </div>

              {step === 'cart' ? (
                <button
                  type="button"
                  onClick={() => setStep('checkout')}
                  className="w-full bg-[#1a3d24] hover:bg-[#14301c] text-white py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-sm cursor-pointer"
                >
                  Tiến hành thanh toán
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleCheckout}
                  disabled={!address.trim()}
                  className="w-full bg-[#1a3d24] hover:bg-[#14301c] text-white py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-sm cursor-pointer disabled:opacity-50"
                >
                  Xác nhận đặt hàng
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
