import React, { useState, useEffect } from 'react';
import { useApp } from '../../context';
import { getBookById, getShopById, getFeedbacks, addToCart, getCart, getUserById } from '../../store';
import BookCover from '../../components/BookCover';
import StarRating from '../../components/StarRating';

function fmt(n) {
  return (n || 0).toLocaleString('vi-VN') + 'đ';
}

export default function BookDetail() {
  const { currentUser, pageParams, navigate, setCart } = useApp();
  const bookId = pageParams.bookId;
  const [book, setBook] = useState(null);
  const [shop, setShop] = useState(null);
  const [feedbacks, setFeedbacks] = useState([]);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    const b = getBookById(bookId);
    setBook(b);
    if (b) {
      setShop(getShopById(b.shop_id));
      setFeedbacks(getFeedbacks(b.book_id));
    }
  }, [bookId]);

  if (!book) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center text-[#7a6a5a]">
        <p className="text-lg font-serif">Không tìm thấy thông tin sách.</p>
        <button
          onClick={() => navigate('home')}
          className="mt-4 text-xs font-bold text-[#1a3d24] underline cursor-pointer"
        >
          Quay lại trang chủ
        </button>
      </div>
    );
  }

  const handleAdd = () => {
    if (!currentUser) {
      navigate('auth');
      return;
    }
    addToCart(currentUser.user_id, book.book_id, qty);
    setCart(getCart(currentUser.user_id));
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const avgRating =
    feedbacks.length > 0
      ? feedbacks.reduce((s, f) => s + f.rating, 0) / feedbacks.length
      : book.rating;

  return (
    <div className="bg-[#faf6f1] min-h-screen text-[#1c1612]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Back Link */}
        <button
          onClick={() => navigate('home')}
          className="flex items-center gap-1.5 text-xs font-bold text-[#7a6a5a] hover:text-[#1c1612] transition-colors mb-8 cursor-pointer"
        >
          ← Quay lại danh sách sách
        </button>

        {/* Main Book Card */}
        <div className="bg-white rounded-3xl border border-[#ddd0be] p-6 sm:p-10 shadow-lg grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          {/* Left Column: 3D Book Cover & Shop Card (5 cols) */}
          <div className="md:col-span-5 flex flex-col items-center gap-6">
            <div className="bg-[#f3ede4] rounded-2xl p-8 w-full flex justify-center items-center shadow-inner">
              <BookCover
                color={book.cover_color}
                title={book.title}
                author={book.author}
                subtitle={book.cover_subtitle}
                size="lg"
                className="book-3d-shadow"
              />
            </div>

            {/* Associated Shop Banner */}
            {shop && (
              <div
                onClick={() => navigate('shop-profile', { shopId: shop.shop_id })}
                className="w-full bg-[#f3ede4] hover:bg-[#e8ddd0] border border-[#ddd0be] rounded-2xl p-4 flex items-center justify-between cursor-pointer transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#1a3d24] text-white flex items-center justify-center font-bold text-sm">
                    {shop.shop_name[0]}
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-[#7a6a5a] uppercase tracking-wider block">
                      Cung cấp bởi gian hàng
                    </span>
                    <h4 className="font-serif font-bold text-sm text-[#1c1612] group-hover:text-[#1a3d24] transition-colors">
                      {shop.shop_name}
                    </h4>
                  </div>
                </div>
                <span className="text-xs font-bold text-[#1a3d24] group-hover:translate-x-1 transition-transform">
                  Vào Shop →
                </span>
              </div>
            )}
          </div>

          {/* Right Column: Book Details & Add to Cart (7 cols) */}
          <div className="md:col-span-7 flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-[#1a3d24]/10 text-[#1a3d24] text-[11px] font-bold px-3 py-0.5 rounded-full uppercase tracking-wider">
                  Năm xuất bản {book.published_year}
                </span>
                {book.stock_quantity > 0 ? (
                  <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-3 py-0.5 rounded-full">
                    Còn {book.stock_quantity} cuốn
                  </span>
                ) : (
                  <span className="bg-red-100 text-red-800 text-[11px] font-bold px-3 py-0.5 rounded-full">
                    Hết hàng
                  </span>
                )}
              </div>

              <h1 className="font-serif font-black text-3xl sm:text-4xl text-[#1c1612] leading-tight mb-2">
                {book.title}
              </h1>

              <p className="text-sm text-[#7a6a5a] mb-4">
                Tác giả: <strong className="text-[#1c1612]">{book.author}</strong> • Nhà xuất bản: {book.publisher}
              </p>

              <div className="flex items-center gap-3 mb-6 pb-6 border-b border-[#ddd0be]">
                <StarRating rating={avgRating} count={feedbacks.length} size={14} />
                <span className="text-xs text-[#7a6a5a]">({feedbacks.length} lượt đánh giá thực tế)</span>
              </div>

              {/* Price Tag */}
              <div className="bg-[#f3ede4] rounded-2xl p-5 mb-6 flex items-baseline gap-3">
                <span className="font-serif font-black text-3xl sm:text-4xl text-[#1a3d24]">
                  {fmt(book.price)}
                </span>
                {book.original_price && book.original_price > book.price && (
                  <span className="text-sm text-[#7a6a5a] line-through">
                    {fmt(book.original_price)}
                  </span>
                )}
                {book.discount_percent > 0 && (
                  <span className="text-xs font-bold text-white bg-[#d97706] px-2 py-0.5 rounded">
                    Tiết kiệm {book.discount_percent}%
                  </span>
                )}
              </div>

              {/* Description */}
              <div className="mb-6">
                <h3 className="font-serif font-bold text-base text-[#1c1612] mb-2">Giới thiệu sách</h3>
                <p className="text-sm text-[#5a4a3a] leading-relaxed">
                  {book.description}
                </p>
              </div>

              {/* Specs Grid */}
              <div className="grid grid-cols-2 gap-3 mb-8 bg-[#faf6f1] p-4 rounded-xl border border-[#ddd0be]">
                <div>
                  <span className="text-[10px] font-bold text-[#7a6a5a] uppercase tracking-wider block">Mã ISBN</span>
                  <span className="text-xs font-mono font-bold text-[#1c1612]">{book.isbn}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-[#7a6a5a] uppercase tracking-wider block">Nhà xuất bản</span>
                  <span className="text-xs font-medium text-[#1c1612]">{book.publisher}</span>
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="pt-6 border-t border-[#ddd0be] flex flex-wrap items-center gap-4">
              <div className="flex items-center bg-[#f3ede4] border border-[#ddd0be] rounded-xl overflow-hidden">
                <button
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="w-10 h-11 text-base font-bold text-[#1c1612] hover:bg-[#e8ddd0] transition-colors cursor-pointer"
                >
                  −
                </button>
                <span className="w-10 text-center font-bold text-sm text-[#1c1612]">
                  {qty}
                </span>
                <button
                  onClick={() => setQty((q) => Math.min(q + 1, book.stock_quantity || 10))}
                  className="w-10 h-11 text-base font-bold text-[#1c1612] hover:bg-[#e8ddd0] transition-colors cursor-pointer"
                >
                  +
                </button>
              </div>

              <button
                type="button"
                onClick={handleAdd}
                disabled={book.stock_quantity === 0}
                className={`flex-1 py-3.5 px-6 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-sm cursor-pointer ${
                  added
                    ? 'bg-emerald-700 text-white'
                    : 'bg-[#1a3d24] hover:bg-[#14301c] text-white'
                } ${book.stock_quantity === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {added ? '✓ Đã thêm vào giỏ hàng' : 'Thêm vào giỏ hàng'}
              </button>

              {currentUser && (
                <button
                  type="button"
                  onClick={() => {
                    handleAdd();
                    navigate('cart');
                  }}
                  disabled={book.stock_quantity === 0}
                  className="py-3.5 px-6 rounded-xl font-bold text-xs uppercase tracking-wider bg-[#c8843a] hover:bg-[#b07330] text-white transition-all shadow-sm cursor-pointer"
                >
                  Mua ngay
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── Feedbacks Section ── */}
        <div className="mt-14">
          <h2 className="font-serif font-extrabold text-2xl text-[#1c1612] mb-6">
            Đánh giá từ độc giả ({feedbacks.length})
          </h2>

          {feedbacks.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#ddd0be] p-8 text-center text-[#7a6a5a]">
              Chưa có đánh giá nào cho cuốn sách này. Hãy mua và trở thành người đầu tiên đánh giá!
            </div>
          ) : (
            <div className="space-y-4">
              {feedbacks.map((fb) => {
                const reviewer = getUserById(fb.user_id);
                return (
                  <div
                    key={fb.feedback_id}
                    className="bg-white rounded-2xl border border-[#ddd0be] p-6 shadow-xs"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#1a3d24] text-white flex items-center justify-center font-bold text-xs">
                          {reviewer?.full_name?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <p className="font-bold text-xs text-[#1c1612]">
                            {reviewer?.full_name || 'Độc giả BookVerse'}
                          </p>
                          <span className="text-[10px] text-[#7a6a5a]">
                            {new Date(fb.created_at).toLocaleDateString('vi-VN')}
                          </span>
                        </div>
                      </div>
                      <StarRating rating={fb.rating} size={11} />
                    </div>

                    <p className="text-xs sm:text-sm text-[#5a4a3a] leading-relaxed">
                      "{fb.content}"
                    </p>

                    {/* Shop Responses */}
                    {fb.responses &&
                      fb.responses.map((res) => (
                        <div
                          key={res.response_id}
                          className="mt-3.5 bg-[#f3ede4] rounded-xl p-3.5 border-l-4 border-[#c8843a] text-xs text-[#3d2b1a]"
                        >
                          <span className="font-bold text-[#c8843a] block mb-1 uppercase tracking-wider text-[10px]">
                            Phản hồi từ Cửa hàng
                          </span>
                          <p>{res.content}</p>
                        </div>
                      ))}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
