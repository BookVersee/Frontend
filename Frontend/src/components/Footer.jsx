import React from 'react';

export default function Footer({ onNavigate }) {
  return (
    <footer className="bg-[#faf6f1] border-t border-[#ddd0be] pt-14 pb-8 text-[#1c1612] mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main 5 Columns Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 pb-12">
          {/* Brand Col (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#c8843a] text-white shadow-xs">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6zM19 1H5C3.9 1 3 1.9 3 3v18c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V3c0-1.1-.9-2-2-2zm0 18H5V3h14v16z"/>
                </svg>
              </div>
              <span className="font-serif font-extrabold text-2xl tracking-tight text-[#1c1612]">
                BookVerse
              </span>
            </div>

            <p className="font-serif italic text-sm text-[#7a6a5a] max-w-sm leading-relaxed">
              Nơi hàng trăm shop sách độc lập gặp gỡ hàng triệu độc giả yêu sách.
            </p>

            <div className="flex items-center gap-3 pt-2">
              <a
                href="#facebook"
                className="w-8 h-8 rounded-full border border-[#ddd0be] flex items-center justify-center text-[#7a6a5a] hover:text-[#1c1612] hover:border-[#1c1612] transition-colors"
                title="Facebook"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
              <a
                href="#instagram"
                className="w-8 h-8 rounded-full border border-[#ddd0be] flex items-center justify-center text-[#7a6a5a] hover:text-[#1c1612] hover:border-[#1c1612] transition-colors"
                title="Instagram"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
              <a
                href="#youtube"
                className="w-8 h-8 rounded-full border border-[#ddd0be] flex items-center justify-center text-[#7a6a5a] hover:text-[#1c1612] hover:border-[#1c1612] transition-colors"
                title="YouTube"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Mua hàng (2 cols) */}
          <div className="lg:col-span-2">
            <h4 className="text-xs font-bold text-[#7a6a5a] uppercase tracking-widest mb-4">
              MUA HÀNG
            </h4>
            <ul className="space-y-2.5 text-xs text-[#5a4a3a]">
              <li><a href="#new" className="hover:text-[#1a3d24] transition-colors">Sách mới nhất</a></li>
              <li><a href="#bestseller" className="hover:text-[#1a3d24] transition-colors">Sách bán chạy</a></li>
              <li><a href="#promo" className="hover:text-[#1a3d24] transition-colors">Khuyến mãi</a></li>
              <li><a href="#cats" className="hover:text-[#1a3d24] transition-colors">Danh mục</a></li>
            </ul>
          </div>

          {/* Hỗ trợ (2 cols) */}
          <div className="lg:col-span-2">
            <h4 className="text-xs font-bold text-[#7a6a5a] uppercase tracking-widest mb-4">
              HỖ TRỢ
            </h4>
            <ul className="space-y-2.5 text-xs text-[#5a4a3a]">
              <li><a href="#return" className="hover:text-[#1a3d24] transition-colors">Chính sách đổi trả</a></li>
              <li><a href="#guide" className="hover:text-[#1a3d24] transition-colors">Hướng dẫn mua</a></li>
              <li><a href="#contact" className="hover:text-[#1a3d24] transition-colors">Liên hệ</a></li>
              <li><a href="#faq" className="hover:text-[#1a3d24] transition-colors">FAQ</a></li>
            </ul>
          </div>

          {/* Shop (2 cols) */}
          <div className="lg:col-span-2">
            <h4 className="text-xs font-bold text-[#7a6a5a] uppercase tracking-widest mb-4">
              SHOP
            </h4>
            <ul className="space-y-2.5 text-xs text-[#5a4a3a]">
              <li><a href="#open-shop" className="hover:text-[#1a3d24] transition-colors">Mở shop</a></li>
              <li><a href="#manage-shop" className="hover:text-[#1a3d24] transition-colors">Quản lý shop</a></li>
              <li><a href="#shop-policy" className="hover:text-[#1a3d24] transition-colors">Chính sách shop</a></li>
              <li><a href="#partners" className="hover:text-[#1a3d24] transition-colors">Liên kết đối tác</a></li>
            </ul>
          </div>

          {/* Thanh toán & Vận chuyển (2 cols) */}
          <div className="lg:col-span-2 space-y-5">
            <div>
              <h4 className="text-xs font-bold text-[#7a6a5a] uppercase tracking-widest mb-3">
                THANH TOÁN
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {['VISA', 'MC', 'JCB', 'MoMo', 'ZaloPay', 'COD'].map((p) => (
                  <span
                    key={p}
                    className="px-2.5 py-1 bg-[#f3ede4] border border-[#ddd0be] text-[10px] font-bold text-[#1c1612] rounded-md shadow-2xs"
                  >
                    {p}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-[#7a6a5a] uppercase tracking-widest mb-3">
                VẬN CHUYỂN
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {['GHN', 'GHTK', 'VNPost'].map((c) => (
                  <span
                    key={c}
                    className="px-2.5 py-1 bg-[#f3ede4] border border-[#ddd0be] text-[10px] font-bold text-[#1c1612] rounded-md shadow-2xs"
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Sub-bar */}
        <div className="border-t border-[#ddd0be]/70 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#7a6a5a]">
          <p>© 2026 BookVerse Inc. Bảo lưu mọi quyền.</p>
          <div className="flex items-center gap-6">
            <a href="#privacy" className="hover:text-[#1c1612] transition-colors">Chính sách bảo mật</a>
            <a href="#terms" className="hover:text-[#1c1612] transition-colors">Điều khoản sử dụng</a>
            <a href="#sitemap" className="hover:text-[#1c1612] transition-colors">Sitemap</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
