import React from "react";
import { BookOpen, Mail, Phone, ShieldCheck } from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-400 py-6 sm:py-7 mt-auto border-t border-slate-800 text-xs">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Brand & Hotline */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start md:items-center gap-3 text-center sm:text-left">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold shadow-xs">
                <BookOpen size={14} />
              </div>
              <span className="text-sm font-bold text-white tracking-tight">
                BookVerse
              </span>
            </div>
            <span className="hidden sm:inline text-slate-600">•</span>
            <p className="text-slate-400 text-[11px]">
              Sàn thương mại điện tử sách Đa Cửa Hàng
            </p>
          </div>

          {/* Essential Policy Links */}
          <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[11px] font-medium text-slate-400">
            <a
              href="#return-policy"
              className="hover:text-white transition-colors"
            >
              Chính sách đổi trả & hoàn tiền
            </a>
            <a
              href="#terms"
              className="hover:text-white transition-colors"
            >
              Điều khoản dịch vụ
            </a>
            <a
              href="#privacy"
              className="hover:text-white transition-colors"
            >
              Bảo mật thông tin
            </a>
          </nav>

          {/* Contact & Support */}
          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            <a
              href="tel:19006488"
              className="flex items-center gap-1.5 hover:text-white transition-colors"
            >
              <Phone size={12} className="text-blue-400" />
              <span>Hotline: <strong className="text-slate-200">1900 6488</strong></span>
            </a>
            <span className="text-slate-700">|</span>
            <a
              href="mailto:lienhe@bookverse.vn"
              className="flex items-center gap-1.5 hover:text-white transition-colors"
            >
              <Mail size={12} className="text-blue-400" />
              <span>lienhe@bookverse.vn</span>
            </a>
          </div>
        </div>

        {/* Bottom copyright line */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] text-slate-400">
          <p>© 2026 BookVerse. Tất cả quyền được bảo lưu.</p>
          <div className="flex items-center gap-3">
            <span>Mã số thuế: <strong className="font-mono text-slate-300">0109876543</strong></span>
            <span className="text-slate-700">•</span>
            <span className="flex items-center gap-1 text-emerald-400 font-medium">
              <ShieldCheck size={11} /> Sàn TMĐT đã đăng ký Bộ Công Thương
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
