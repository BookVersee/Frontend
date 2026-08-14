import React, { useState, useEffect } from 'react';
import { useApp } from '../../context';
import { getBooks, getCategories, getShops, addToCart, getCart } from '../../store';
import BookCover from '../../components/BookCover';
import StarRating from '../../components/StarRating';

function fmt(n) {
  return (n || 0).toLocaleString('vi-VN') + 'đ';
}

export default function Home({ search = '', activeCategory = '' }) {
  const { currentUser, navigate, setCart, refreshKey } = useApp();
  const [books, setBooks] = useState([]);
  const [shops, setShops] = useState([]);
  const [cats, setCats] = useState([]);
  const [selectedCatId, setSelectedCatId] = useState(0);
  const [addedId, setAddedId] = useState(null);

  useEffect(() => {
    setBooks(getBooks());
    setShops(getShops());
    setCats(getCategories());
  }, [refreshKey]);

  useEffect(() => {
    if (activeCategory) {
      const match = cats.find((c) => c.category_name.toLowerCase() === activeCategory.toLowerCase());
      if (match) setSelectedCatId(match.category_id);
    } else {
      setSelectedCatId(0);
    }
  }, [activeCategory, cats]);

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

  const filteredBooks = books.filter((b) => {
    const matchSearch =
      !search ||
      b.title.toLowerCase().includes(search.toLowerCase()) ||
      b.author.toLowerCase().includes(search.toLowerCase()) ||
      (b.shop_name && b.shop_name.toLowerCase().includes(search.toLowerCase()));
    const matchCat = selectedCatId === 0 || b.category_id === selectedCatId;
    return matchSearch && matchCat;
  });

  const featuredBooks = books.slice(0, 4);

  return (
    <div className="bg-[#faf6f1] min-h-screen text-[#1c1612]">
      {/* ── SECTION 02: SÁCH NỔI BẬT ("Được Yêu Thích Nhất") ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-16">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 pb-4 border-b border-[#ddd0be]/60 gap-4">
          <div>
            <span className="text-[11px] font-bold text-[#7a6a5a] uppercase tracking-widest block mb-1">
              02 — SÁCH NỔI BẬT
            </span>
            <h2 className="font-serif font-extrabold text-3xl sm:text-4xl text-[#1c1612] tracking-tight">
              Được Yêu Thích Nhất
            </h2>
            <p className="font-serif italic text-sm text-[#7a6a5a] mt-1">
              Tuyển chọn từ hàng nghìn shop uy tín trên BookVerse.
            </p>
          </div>
          <button
            onClick={() => setSelectedCatId(0)}
            className="text-xs font-bold text-[#1c1612] hover:text-[#1a3d24] flex items-center gap-1 group cursor-pointer transition-colors"
          >
            Xem tất cả sách{' '}
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </button>
        </div>

        {/* Featured 4 Books Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredBooks.map((book) => (
            <div
              key={book.book_id}
              onClick={() => navigate('book-detail', { bookId: book.book_id })}
              className="bg-white rounded-xl border border-[#ddd0be] overflow-hidden flex flex-col justify-between p-4 hover:shadow-xl hover:border-[#1a3d24]/30 transition-all duration-300 group cursor-pointer"
            >
              {/* Cover Container with Real 3D shadow & Tags */}
              <div className="bg-[#f3ede4] rounded-lg p-5 flex items-center justify-center relative min-h-[280px] overflow-hidden">
                {/* Top Badges */}
                <div className="absolute top-3 left-3 z-20 flex flex-col gap-1">
                  {book.tag && (
                    <span
                      className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider text-white shadow-2xs"
                      style={{ backgroundColor: book.tag_bg || '#d97706' }}
                    >
                      {book.tag}
                    </span>
                  )}
                </div>

                {book.discount_percent > 0 && (
                  <div className="absolute top-3 right-3 z-20">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold text-white bg-[#1a3d24] shadow-2xs">
                      -{book.discount_percent}%
                    </span>
                  </div>
                )}

                <BookCover
                  color={book.cover_color}
                  title={book.title}
                  author={book.author}
                  subtitle={book.cover_subtitle}
                  size="md"
                  className="book-3d-shadow"
                />
              </div>

              {/* Book Info */}
              <div className="pt-4 flex flex-col flex-1 justify-between">
                <div>
                  <span className="text-[10px] font-bold text-[#7a6a5a] uppercase tracking-wider block truncate mb-1">
                    {book.shop_name || 'Nhà Sách BookVerse'}
                  </span>
                  <h3 className="font-serif font-bold text-base text-[#1c1612] line-clamp-1 group-hover:text-[#1a3d24] transition-colors leading-snug">
                    {book.title}
                  </h3>
                  <p className="text-xs text-[#7a6a5a] italic line-clamp-1 mt-0.5">
                    {book.author}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-[#ddd0be]/50 flex items-center justify-between">
                  <div>
                    <StarRating rating={book.rating} count={book.reviews_count} size={11} />
                    <div className="flex items-center gap-2 mt-1">
                      <span className="font-serif font-bold text-base text-[#1a3d24]">
                        {fmt(book.price)}
                      </span>
                      {book.original_price && book.original_price > book.price && (
                        <span className="text-xs text-[#b5a898] line-through">
                          {fmt(book.original_price)}
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => handleAddToCart(book.book_id, e)}
                    className="w-8 h-8 rounded-full bg-[#1a3d24] hover:bg-[#14301c] text-white flex items-center justify-center transition-all shadow-xs shrink-0 cursor-pointer"
                    title="Thêm vào giỏ"
                  >
                    {addedId === book.book_id ? (
                      <span className="text-xs font-bold">✓</span>
                    ) : (
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── SECTION 03: GIAN HÀNG ("Shop Nổi Bật Tuần Này") ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 border-t border-[#ddd0be]/80">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Heading & Value Props (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            <div>
              <span className="text-[11px] font-bold text-[#7a6a5a] uppercase tracking-widest block mb-1">
                03 — GIAN HÀNG
              </span>
              <h2 className="font-serif font-extrabold text-3xl sm:text-4xl text-[#1c1612] leading-tight">
                Shop Nổi Bật<br />Tuần Này
              </h2>
              <p className="font-serif italic text-sm text-[#7a6a5a] mt-2 leading-relaxed">
                Các gian hàng được xếp hạng cao nhất dựa trên đánh giá, tốc độ giao hàng và sự hài lòng của khách.
              </p>
            </div>

            <div className="space-y-4 pt-2">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[#1a3d24]/10 text-[#1a3d24] flex items-center justify-center shrink-0 mt-0.5">
                  ✓
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#1c1612]">Đã xác minh</h4>
                  <p className="text-[11px] text-[#7a6a5a]">Thông tin & kho hàng thật 100%</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[#c8843a]/15 text-[#c8843a] flex items-center justify-center shrink-0 mt-0.5">
                  ★
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#1c1612]">Đánh giá cao</h4>
                  <p className="text-[11px] text-[#7a6a5a]">Từ 4.7★ trở lên với hàng nghìn đơn</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[#1a3d24]/10 text-[#1a3d24] flex items-center justify-center shrink-0 mt-0.5">
                  🚚
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#1c1612]">Giao hàng nhanh</h4>
                  <p className="text-[11px] text-[#7a6a5a]">Xử lý và đóng gói trong 24 giờ</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setSelectedCatId(0)}
              className="text-xs font-bold text-[#1c1612] hover:text-[#1a3d24] flex items-center gap-1.5 pt-4 group cursor-pointer"
            >
              Xem tất cả shop <span className="group-hover:translate-x-1 transition-transform">→</span>
            </button>
          </div>

          {/* Right Column: 6 Shop Cards Grid (8 cols) */}
          <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-5">
            {shops.map((shop) => (
              <div
                key={shop.shop_id}
                onClick={() => navigate('shop-profile', { shopId: shop.shop_id })}
                className="bg-white rounded-xl border border-[#ddd0be] overflow-hidden hover:shadow-lg hover:border-[#1a3d24]/40 transition-all duration-300 flex flex-col justify-between group cursor-pointer"
              >
                {/* Shop Real Image Cover */}
                <div className="h-36 relative overflow-hidden bg-slate-200">
                  <img
                    src={shop.image}
                    alt={shop.shop_name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  
                  {/* Verified Badge */}
                  {shop.verified && (
                    <div className="absolute top-2.5 right-2.5">
                      <span className="bg-[#1a3d24] text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                        ✓ XÁC MINH
                      </span>
                    </div>
                  )}
                </div>

                {/* Shop Details */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h3 className="font-serif font-bold text-base text-[#1c1612] group-hover:text-[#1a3d24] transition-colors truncate">
                        {shop.shop_name}
                      </h3>
                      <span className="text-xs font-bold text-[#d97706] shrink-0">
                        ★ {shop.rating}
                      </span>
                    </div>

                    <p className="text-[11px] text-[#7a6a5a] flex items-center gap-1 mb-1">
                      <span>📍</span> {shop.address}
                    </p>

                    <p className="text-xs text-[#5a4a3a] italic line-clamp-1 mb-3">
                      {shop.category_focus}
                    </p>

                    <div className="flex items-center gap-3 text-[11px] text-[#7a6a5a] mb-3">
                      <span><strong className="text-[#1c1612]">{shop.followers}</strong> theo dõi</span>
                      <span>•</span>
                      <span><strong className="text-[#1c1612]">{shop.book_count_text}</strong> sách</span>
                    </div>

                    {/* Featured Book Tags */}
                    {shop.featured_tags && shop.featured_tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {shop.featured_tags.map((t) => (
                          <span
                            key={t}
                            className="bg-[#f3ede4] text-[#7a6a5a] text-[10px] px-2 py-0.5 rounded font-medium"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Vào Shop Button */}
                  <div className="pt-2 border-t border-[#ddd0be]/50">
                    <div className="w-full bg-[#f3ede4] group-hover:bg-[#1a3d24] group-hover:text-white text-[#1c1612] rounded-lg py-2 text-center text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors">
                      VÀO SHOP <span>→</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION: FOREST GREEN GRID CTA BANNER ("Bắt đầu khám phá hôm nay") ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="bg-grid-green rounded-3xl p-8 sm:p-14 text-white text-center shadow-2xl relative overflow-hidden">
          <div className="max-w-2xl mx-auto space-y-5 relative z-10">
            <span className="text-[11px] font-bold tracking-widest text-[#c8843a] uppercase block">
              BOOKVERSE · 2026
            </span>

            <h2 className="font-serif font-extrabold text-3xl sm:text-5xl tracking-tight leading-tight">
              Bắt đầu<br />khám phá<br />hôm nay.
            </h2>

            <p className="text-sm sm:text-base text-[#e8ddd0] max-w-lg mx-auto font-sans leading-relaxed">
              Hơn 50.000 đầu sách từ 1.200+ shop uy tín. Giao hàng toàn quốc, đổi trả dễ dàng trong 7 ngày.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3.5 pt-4">
              <button
                onClick={() => {
                  const el = document.getElementById('all-books');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="bg-white hover:bg-[#faf6f1] text-[#1a3d24] px-7 py-3 rounded-full text-xs font-extrabold tracking-wider uppercase transition-all shadow-md cursor-pointer"
              >
                KHÁM PHÁ SÁCH NGAY
              </button>

              <button
                onClick={() => navigate('auth', { initialMode: 'register', initialRole: 'SHOP' })}
                className="bg-transparent hover:bg-white/10 text-white border border-white/40 px-7 py-3 rounded-full text-xs font-extrabold tracking-wider uppercase transition-all flex items-center gap-2 cursor-pointer"
              >
                <span>⚙</span> MỞ SHOP MIỄN PHÍ
              </button>
            </div>

            <div className="pt-8 mt-6 border-t border-white/15 flex flex-wrap items-center justify-center gap-6 sm:gap-12 text-xs text-[#e8ddd0]">
              <span className="flex items-center gap-1.5">
                <span>🛡️</span> Thanh toán bảo mật
              </span>
              <span className="flex items-center gap-1.5">
                <span>📦</span> Giao hàng toàn quốc
              </span>
              <span className="flex items-center gap-1.5">
                <span>🔄</span> Đổi trả 7 ngày
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION: TẤT CẢ SÁCH THEO DANH MỤC & TÌM KIẾM ── */}
      <section id="all-books" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="font-serif font-extrabold text-2xl sm:text-3xl text-[#1c1612]">
              {search
                ? `Kết quả tìm kiếm cho "${search}"`
                : selectedCatId === 0
                ? 'Tất cả sách trên sàn'
                : cats.find((c) => c.category_id === selectedCatId)?.category_name}
              <span className="text-sm font-sans font-medium text-[#7a6a5a] ml-2.5">
                ({filteredBooks.length} cuốn)
              </span>
            </h2>
          </div>

          {/* Category Chips Bar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            <button
              onClick={() => setSelectedCatId(0)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedCatId === 0
                  ? 'bg-[#1a3d24] text-white shadow-xs'
                  : 'bg-[#f3ede4] text-[#5a4a3a] hover:bg-[#e8ddd0]'
              }`}
            >
              Tất cả
            </button>
            {cats.map((c) => (
              <button
                key={c.category_id}
                onClick={() => setSelectedCatId(c.category_id)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCatId === c.category_id
                    ? 'bg-[#1a3d24] text-white shadow-xs'
                    : 'bg-[#f3ede4] text-[#5a4a3a] hover:bg-[#e8ddd0]'
                }`}
              >
                {c.category_name}
              </button>
            ))}
          </div>
        </div>

        {/* Books Grid */}
        {filteredBooks.length === 0 ? (
          <div className="bg-[#f3ede4] rounded-2xl p-12 text-center border border-[#ddd0be]">
            <div className="text-4xl mb-3">📚</div>
            <h3 className="font-serif font-bold text-lg text-[#1c1612]">Không tìm thấy sách nào</h3>
            <p className="text-xs text-[#7a6a5a] mt-1">Vui lòng thử tìm kiếm với từ khóa hoặc danh mục khác.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
            {filteredBooks.map((book) => (
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
                  <span className="text-[10px] font-bold text-[#7a6a5a] uppercase tracking-wider block truncate">
                    {book.shop_name}
                  </span>
                  <h4 className="font-serif font-bold text-sm text-[#1c1612] line-clamp-1 group-hover:text-[#1a3d24] transition-colors mt-0.5">
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
      </section>
    </div>
  );
}
