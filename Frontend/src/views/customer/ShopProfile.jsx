import React, { useState, useEffect } from 'react';
import { useApp } from '../../context';
import { getShopById, getBooks, addToCart, getCart } from '../../store';
import BookCover from '../../components/BookCover';
import StarRating from '../../components/StarRating';

function fmt(n) {
  return (n || 0).toLocaleString('vi-VN') + 'đ';
}

export default function ShopProfile() {
  const { pageParams, navigate, currentUser, setCart } = useApp();
  const shopId = pageParams.shopId;
  const [shop, setShop] = useState(null);
  const [books, setBooks] = useState([]);
  const [addedId, setAddedId] = useState(null);

  useEffect(() => {
    const s = getShopById(shopId);
    setShop(s);
    if (s) {
      setBooks(getBooks(s.shop_id).filter((b) => b.status === 'ACTIVE'));
    }
  }, [shopId]);

  const handleAddToCart = (bookId, e) => {
    if (e) e.stopPropagation();
    if (!currentUser) {
      navigate('auth');
      return;
    }
    addToCart(currentUser.user_id, bookId, 1);
    setCart(getCart(currentUser.user_id));
    setAddedId(bookId);
    setTimeout(() => setAddedId(null), 1500);
  };

  if (!shop) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center text-[#7a6a5a]">
        <p className="text-lg font-serif">Không tìm thấy gian hàng.</p>
        <button
          onClick={() => navigate('home')}
          className="mt-4 text-xs font-bold text-[#1a3d24] underline cursor-pointer"
        >
          Quay lại trang chủ
        </button>
      </div>
    );
  }

  return (
    <div className="bg-[#faf6f1] min-h-screen text-[#1c1612]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <button
          onClick={() => navigate('home')}
          className="flex items-center gap-1.5 text-xs font-bold text-[#7a6a5a] hover:text-[#1c1612] transition-colors mb-8 cursor-pointer"
        >
          ← Quay lại trang chủ
        </button>

        {/* Shop Hero Card */}
        <div className="bg-[#1a3d24] text-white rounded-3xl p-8 sm:p-12 shadow-xl mb-12 relative overflow-hidden">
          <div className="relative z-10 max-w-2xl">
            <span className="text-[11px] font-bold text-[#c8843a] uppercase tracking-widest block mb-2">
              GIAN HÀNG ĐỐI TÁC CHÍNH HÃNG
            </span>
            <h1 className="font-serif font-black text-3xl sm:text-5xl tracking-tight mb-3">
              {shop.shop_name}
            </h1>
            <p className="text-sm text-[#e8ddd0] leading-relaxed mb-6 font-sans">
              {shop.description || 'Gian hàng sách uy tín phân phối chính thức trên hệ thống BookVerse.'}
            </p>

            <div className="flex flex-wrap items-center gap-6 text-xs text-[#e8ddd0]">
              <span className="flex items-center gap-1.5">
                <span>📍</span> {shop.address}
              </span>
              <span className="flex items-center gap-1.5">
                <span>★</span> {shop.rating} Đánh giá
              </span>
              <span className="flex items-center gap-1.5">
                <span>📚</span> {books.length} đầu sách đang bán
              </span>
              {shop.followers && (
                <span className="flex items-center gap-1.5">
                  <span>👥</span> {shop.followers} người theo dõi
                </span>
              )}
            </div>
          </div>

          <div className="absolute right-0 bottom-0 top-0 w-1/3 opacity-20 hidden md:block">
            <img
              src={shop.image}
              alt=""
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Shop Books Grid */}
        <div>
          <h2 className="font-serif font-bold text-2xl text-[#1c1612] mb-6">
            Tất cả sách của {shop.shop_name} ({books.length})
          </h2>

          {books.length === 0 ? (
            <div className="bg-white rounded-3xl border border-[#ddd0be] p-12 text-center text-[#7a6a5a]">
              Gian hàng hiện chưa có sách nào được đăng bán.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
              {books.map((book) => (
                <div
                  key={book.book_id}
                  onClick={() => navigate('book-detail', { bookId: book.book_id })}
                  className="bg-white rounded-xl border border-[#ddd0be] p-3.5 hover:shadow-md hover:border-[#1a3d24]/30 transition-all flex flex-col justify-between group cursor-pointer"
                >
                  <div className="bg-[#f3ede4] rounded-lg p-3 flex justify-center mb-3">
                    <BookCover
                      color={book.cover_color}
                      title={book.title}
                      author={book.author}
                      size="sm"
                      className="book-3d-shadow"
                    />
                  </div>

                  <div>
                    <h4 className="font-serif font-bold text-sm text-[#1c1612] line-clamp-1 group-hover:text-[#1a3d24] transition-colors">
                      {book.title}
                    </h4>
                    <p className="text-xs text-[#7a6a5a] italic truncate mb-2">
                      {book.author}
                    </p>
                    <StarRating rating={book.rating} size={10} />
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-[#ddd0be]/50 flex items-center justify-between">
                    <span className="font-serif font-bold text-sm text-[#1a3d24]">
                      {fmt(book.price)}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => handleAddToCart(book.book_id, e)}
                      className="px-2.5 py-1 rounded bg-[#1a3d24] hover:bg-[#14301c] text-white text-[11px] font-bold transition-colors cursor-pointer"
                    >
                      {addedId === book.book_id ? '✓' : '+ Thêm'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
