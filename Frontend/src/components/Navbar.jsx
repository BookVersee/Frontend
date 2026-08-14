import React, { useState, useEffect } from 'react';
import { useApp } from '../context';
import { getNotifications, markAllRead } from '../store';

export default function Navbar({ onSearch, searchValue, onSelectCategory, activeCategory }) {
  const { currentUser, cart, navigate, logout, page } = useApp();
  const [showNotif, setShowNotif] = useState(false);
  const [notifs, setNotifs] = useState([]);
  const [internalSearch, setInternalSearch] = useState(searchValue || '');

  useEffect(() => {
    if (currentUser) {
      setNotifs(getNotifications(currentUser.user_id));
    }
  }, [currentUser, page]);

  useEffect(() => {
    if (searchValue !== undefined) {
      setInternalSearch(searchValue);
    }
  }, [searchValue]);

  const unread = notifs.filter((n) => !n.read).length;
  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (page !== 'home') {
      navigate('home');
    }
    if (onSearch) {
      onSearch(internalSearch);
    }
  };

  const handleCategoryClick = (catName) => {
    if (page !== 'home') {
      navigate('home');
    }
    if (onSelectCategory) {
      onSelectCategory(catName);
    }
  };

  const categories = ['Văn học', 'Kinh tế', 'Khoa học', 'Tâm lý', 'Thiếu nhi', 'Ngoại ngữ'];

  const shopLinks = [
    { label: 'Quản lý sách', page: 'shop-books' },
    { label: 'Đơn hàng', page: 'shop-orders' },
    { label: 'Doanh thu', page: 'shop-revenue' },
    { label: 'Đánh giá', page: 'shop-feedbacks' },
    { label: 'Cài đặt shop', page: 'shop-settings' },
  ];

  const adminLinks = [
    { label: 'Người dùng', page: 'admin-users' },
    { label: 'Duyệt Shop', page: 'admin-shops' },
    { label: 'Tranh chấp', page: 'admin-disputes' },
  ];

  const customerLinks = [
    { label: 'Trang chủ', page: 'home' },
    { label: 'Đơn hàng', page: 'customer-orders' },
    { label: 'Hồ sơ', page: 'profile' },
  ];

  const links = !currentUser
    ? []
    : currentUser.role === 'SHOP'
    ? shopLinks
    : currentUser.role === 'ADMIN'
    ? adminLinks
    : customerLinks;

  return (
    <header className="sticky top-0 z-50 bg-[#faf6f1]/95 backdrop-blur-md border-b border-[#ddd0be]">
      {/* Top Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
        {/* Left: Brand Logo */}
        <button
          onClick={() =>
            navigate(
              currentUser?.role === 'SHOP'
                ? 'shop-books'
                : currentUser?.role === 'ADMIN'
                ? 'admin-users'
                : 'home'
            )
          }
          className="flex items-center gap-2.5 bg-transparent border-none cursor-pointer text-left shrink-0 group"
        >
          <div className="w-9 h-9 rounded-lg flex items-center justify-center shadow-xs bg-[#c8843a] text-white">
            <svg
              className="w-5 h-5 fill-current"
              viewBox="0 0 24 24"
            >
              <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6zM19 1H5C3.9 1 3 1.9 3 3v18c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V3c0-1.1-.9-2-2-2zm0 18H5V3h14v16z"/>
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="font-serif font-extrabold text-2xl tracking-tight text-[#1c1612] leading-none group-hover:text-[#1a3d24] transition-colors">
              BookVerse
            </span>
          </div>
        </button>

        {/* Center: Search Bar Pill with 'Tìm' Button */}
        <form
          onSubmit={handleSearchSubmit}
          className="flex-1 max-w-xl hidden md:flex items-center bg-[#f3ede4] rounded-full border border-[#ddd0be] px-4 py-1.5 focus-within:border-[#1a3d24] focus-within:ring-2 focus-within:ring-[#1a3d24]/10 transition-all shadow-inner"
        >
          <svg
            className="w-4 h-4 text-[#7a6a5a] shrink-0 mr-2.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            value={internalSearch}
            onChange={(e) => {
              setInternalSearch(e.target.value);
              if (onSearch) onSearch(e.target.value);
            }}
            placeholder="Tìm sách, tác giả, shop..."
            className="flex-1 bg-transparent border-none outline-none text-sm text-[#1c1612] placeholder-[#7a6a5a]"
          />
          {internalSearch && (
            <button
              type="button"
              onClick={() => {
                setInternalSearch('');
                if (onSearch) onSearch('');
              }}
              className="text-[#7a6a5a] hover:text-[#1c1612] text-sm px-2 cursor-pointer"
            >
              ✕
            </button>
          )}
          <button
            type="submit"
            className="bg-[#1a3d24] hover:bg-[#14301c] text-white px-5 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all shadow-xs cursor-pointer"
          >
            Tìm
          </button>
        </form>

        {/* Right: Actions (Cart, Notifications, Auth / User Menu) */}
        <div className="flex items-center gap-3.5 sm:gap-4 shrink-0">
          {/* Role Navigation for logged in users */}
          {currentUser && (
            <div className="hidden lg:flex items-center gap-4 mr-2 border-r border-[#ddd0be] pr-4">
              {links.map((l) => (
                <button
                  key={l.page}
                  onClick={() => navigate(l.page)}
                  className={`text-xs font-semibold transition-colors cursor-pointer ${
                    page === l.page ? 'text-[#1a3d24] underline underline-offset-4' : 'text-[#7a6a5a] hover:text-[#1c1612]'
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          )}

          {/* Cart Icon with Orange Badge '3' */}
          <button
            onClick={() => {
              if (!currentUser) navigate('auth');
              else navigate('cart');
            }}
            className="relative p-2 text-[#1c1612] hover:text-[#1a3d24] transition-colors cursor-pointer"
            title="Giỏ hàng"
          >
            <svg
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#d97706] text-white text-[11px] font-bold flex items-center justify-center shadow-xs">
                {cartCount}
              </span>
            )}
          </button>

          {/* Notifications dropdown for logged in user */}
          {currentUser && (
            <div className="relative">
              <button
                onClick={() => setShowNotif(!showNotif)}
                className="relative p-2 text-[#1c1612] hover:text-[#1a3d24] transition-colors cursor-pointer"
                title="Thông báo"
              >
                <svg
                  className="w-5 h-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                {unread > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-600 rounded-full ring-2 ring-[#faf6f1]" />
                )}
              </button>

              {showNotif && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-[#f3ede4] rounded-2xl border border-[#ddd0be] shadow-2xl z-50 overflow-hidden">
                  <div className="p-3.5 border-b border-[#ddd0be] flex items-center justify-between bg-[#e8ddd0]">
                    <span className="font-bold text-xs text-[#1c1612]">Thông báo mới</span>
                    <button
                      onClick={() => {
                        markAllRead(currentUser.user_id);
                        setNotifs(notifs.map((n) => ({ ...n, read: true })));
                      }}
                      className="text-[11px] font-semibold text-[#1a3d24] hover:underline cursor-pointer"
                    >
                      Đã đọc tất cả
                    </button>
                  </div>
                  <div className="max-h-64 overflow-y-auto divide-y divide-[#ddd0be]/50">
                    {notifs.length === 0 ? (
                      <p className="text-center text-xs text-[#7a6a5a] py-6">Không có thông báo nào</p>
                    ) : (
                      notifs.map((n) => (
                        <div
                          key={n.notification_id}
                          className={`p-3 text-xs ${n.read ? 'text-[#7a6a5a]' : 'bg-[#1a3d24]/5 text-[#1c1612] font-medium'}`}
                        >
                          <p className="line-clamp-2">{n.message}</p>
                          <span className="text-[10px] text-[#b5a898] mt-1 block">
                            {new Date(n.created_at).toLocaleDateString('vi-VN')}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Auth State */}
          {currentUser ? (
            <div className="flex items-center gap-2.5">
              <button
                onClick={() =>
                  navigate(
                    currentUser.role === 'SHOP'
                      ? 'shop-books'
                      : currentUser.role === 'ADMIN'
                      ? 'admin-users'
                      : 'profile'
                  )
                }
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-full bg-[#f3ede4] border border-[#ddd0be] hover:border-[#1a3d24] transition-all cursor-pointer"
              >
                <div className="w-7 h-7 rounded-full bg-[#1a3d24] text-white flex items-center justify-center font-bold text-xs">
                  {currentUser.full_name?.charAt(0) || 'U'}
                </div>
                <div className="text-left hidden sm:block">
                  <p className="text-xs font-bold text-[#1c1612] leading-tight line-clamp-1">
                    {currentUser.full_name}
                  </p>
                  <p className="text-[10px] text-[#7a6a5a] font-semibold leading-none uppercase tracking-wider">
                    {currentUser.role}
                  </p>
                </div>
              </button>
              <button
                onClick={logout}
                className="text-xs font-semibold text-[#7a6a5a] hover:text-red-600 px-2 py-1 transition-colors cursor-pointer"
                title="Đăng xuất"
              >
                Đăng xuất
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('auth', { initialMode: 'login' })}
                className="text-xs font-bold text-[#1c1612] hover:text-[#1a3d24] transition-colors cursor-pointer px-2"
              >
                Đăng nhập
              </button>
              <button
                onClick={() => navigate('auth', { initialMode: 'register' })}
                className="bg-[#1a3d24] hover:bg-[#14301c] text-white px-5 py-2 rounded-full text-xs font-bold tracking-wide transition-all shadow-xs cursor-pointer"
              >
                Đăng ký
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Sub-bar: Category Pills / Line */}
      <div className="border-t border-[#ddd0be]/60 bg-[#faf6f1] px-4 sm:px-6 lg:px-8 py-2 overflow-x-auto scrollbar-none">
        <div className="max-w-7xl mx-auto flex items-center gap-6 text-xs text-[#7a6a5a]">
          <span className="font-bold text-[#1c1612] shrink-0">Danh mục:</span>
          <div className="flex items-center gap-6 whitespace-nowrap">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => handleCategoryClick(cat)}
                className={`transition-colors cursor-pointer font-medium ${
                  activeCategory === cat
                    ? 'text-[#1a3d24] font-bold underline underline-offset-4'
                    : 'text-[#7a6a5a] hover:text-[#1c1612]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}
