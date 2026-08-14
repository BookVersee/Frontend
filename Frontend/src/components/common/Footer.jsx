import React, { useState } from "react";
import { MapPin, Mail, Phone, Send, Check } from "lucide-react";

export const Footer = () => {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setTimeout(() => {
        setEmail("");
        setSubscribed(false);
      }, 3000);
    }
  };

  return (
    <footer className="bg-[#111927] text-slate-300 pt-16 pb-8 mt-auto border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-6">
        {/* Main 4 Columns Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8 pb-12">
          {/* Column 1: Brand Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-white text-[#111927] flex items-center justify-center font-bold text-lg shadow-sm">
                B
              </div>
              <span className="text-xl font-bold text-white tracking-tight">
                BookVerse
              </span>
            </div>

            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed pr-2">
              Hệ thống kết nối và cung cấp sách chính hiệu trực tuyến số 1 Việt Nam.
              Đưa tri thức đến gần hơn với mọi người.
            </p>

            <div className="space-y-2.5 text-xs text-slate-400 pt-2">
              <div className="flex items-start gap-2.5">
                <MapPin size={15} className="text-rose-500 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-slate-300 font-medium">Địa chỉ:</strong> Toà nhà Tri Thức, 123 Đường Láng, Đống Đa, Hà Nội
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail size={15} className="text-slate-400 shrink-0" />
                <span>
                  <strong className="text-slate-300 font-medium">Email:</strong> lienhe@bookverse.vn
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone size={15} className="text-slate-400 shrink-0" />
                <span>
                  <strong className="text-slate-300 font-medium">Hotline:</strong> 1900 6488
                </span>
              </div>
            </div>
          </div>

          {/* Column 2: Policies & Terms */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-5">
              Chính Sách & Điều Khoản
            </h4>
            <ul className="space-y-3 text-xs sm:text-sm text-slate-400">
              <li>
                <a href="#return-policy" className="hover:text-white transition-colors">
                  Chính sách đổi trả 7 ngày
                </a>
              </li>
              <li>
                <a href="#terms" className="hover:text-white transition-colors">
                  Điều khoản sử dụng
                </a>
              </li>
              <li>
                <a href="#privacy" className="hover:text-white transition-colors">
                  Bảo mật thông tin khách hàng
                </a>
              </li>
              <li>
                <a href="#shipping-policy" className="hover:text-white transition-colors">
                  Chính sách vận chuyển
                </a>
              </li>
              <li>
                <a href="#regulations" className="hover:text-white transition-colors">
                  Quy chế hoạt động
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: Payment Methods */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-5">
              Phương Thức Thanh Toán
            </h4>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed mb-5">
              Chúng tôi hỗ trợ đa dạng các hình thức thanh toán an toàn, bảo mật tuyệt đối.
            </p>

            <div className="grid grid-cols-2 gap-2.5 max-w-[240px]">
              {["Visa Card", "MasterCard", "MoMo Wallet", "ZaloPay"].map((payment) => (
                <div
                  key={payment}
                  className="bg-[#1f2937]/90 border border-slate-700/60 rounded-lg py-2 px-3 text-center text-xs font-semibold text-slate-200 hover:border-slate-500 transition-colors shadow-xs"
                >
                  {payment}
                </div>
              ))}
            </div>
          </div>

          {/* Column 4: Subscribe & Social Media */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-5">
              Theo Dõi BookVerse
            </h4>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed mb-4">
              Đăng ký để nhận tin khuyến mãi và các sự kiện sách mới nhất.
            </p>

            <form onSubmit={handleSubscribe} className="relative mb-5">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email của bạn..."
                className="w-full bg-[#1e2838] border border-slate-700 rounded-xl pl-4 pr-12 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 transition-colors"
              />
              <button
                type="submit"
                className="absolute right-1 top-1 bottom-1 px-3 bg-teal-700 hover:bg-teal-600 text-white rounded-lg flex items-center justify-center transition-colors cursor-pointer"
                title="Gửi đăng ký"
              >
                {subscribed ? <Check size={16} /> : <Send size={15} />}
              </button>
            </form>

            <div className="flex items-center gap-3">
              <a
                href="#facebook"
                className="w-9 h-9 rounded-xl bg-[#1e2838] border border-slate-700 flex items-center justify-center text-slate-400 hover:text-white hover:border-slate-500 transition-all cursor-pointer"
                title="Facebook"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
              <a
                href="#youtube"
                className="w-9 h-9 rounded-xl bg-[#1e2838] border border-slate-700 flex items-center justify-center text-slate-400 hover:text-white hover:border-slate-500 transition-all cursor-pointer"
                title="YouTube"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </a>
              <a
                href="#instagram"
                className="w-9 h-9 rounded-xl bg-[#1e2838] border border-slate-700 flex items-center justify-center text-slate-400 hover:text-white hover:border-slate-500 transition-all cursor-pointer"
                title="Instagram"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Copyright & Tax ID Sub-bar */}
        <div className="border-t border-slate-800/80 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <p className="text-center sm:text-left">
            © 2026 BookVerse. Tất cả quyền được bảo lưu. Bản quyền thuộc về Công ty Cổ phần Sách BookVerse Việt Nam.
          </p>
          <p className="shrink-0 font-medium">
            Mã số thuế: <span className="font-mono text-slate-300">0109876543</span>
          </p>
        </div>
      </div>
    </footer>
  );
};
