import React, { useState } from "react";
import {
  BookOpen,
  ShoppingCart,
  ChevronDown,
  Check,
  User as UserIcon,
  LogOut,
  Settings,
  MessageSquare,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useCart } from "../../contexts/CartContext";
import { Role, CustomerPage } from "../../types";
import { ROLE_COLORS, ROLE_LABELS } from "../../utils/status";
import { NotificationDropdown } from "./NotificationDropdown";

interface HeaderProps {
  customerPage: CustomerPage;
  setCustomerPage: (page: CustomerPage) => void;
  onOpenAuth: () => void;
  onOpenChat?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  customerPage,
  setCustomerPage,
  onOpenAuth,
  onOpenChat,
}) => {
  const { user, role, switchRole, logout, isAuthenticated } = useAuth();
  const { cartCount } = useCart();
  const [roleOpen, setRoleOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleRoleChange = (newRole: Role) => {
    switchRole(newRole);
    setRoleOpen(false);
    setCustomerPage("home");
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 px-5 py-3 flex items-center gap-4 shadow-xs">
      <div
        className="flex items-center gap-2.5 mr-2 cursor-pointer"
        onClick={() => setCustomerPage("home")}
      >
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors shadow-xs"
          style={{ backgroundColor: ROLE_COLORS[role] }}
        >
          <BookOpen size={16} className="text-white" />
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-slate-800 text-base leading-tight tracking-tight">
            BookVerse
          </span>
          <span className="text-[10px] text-slate-400 font-medium">Multi-vendor</span>
        </div>
      </div>

      {role === "customer" && (
        <nav className="flex items-center gap-1.5 ml-2">
          {(
            [
              ["home", "Trang chủ"],
              ["orders", "Đơn hàng của tôi"],
              ["profile", "Hồ sơ cá nhân"],
            ] as [CustomerPage, string][]
          ).map(([pg, label]) => (
            <button
              key={pg}
              onClick={() => setCustomerPage(pg)}
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer"
              style={
                customerPage === pg
                  ? {
                      backgroundColor: `${ROLE_COLORS[role]}15`,
                      color: ROLE_COLORS[role],
                    }
                  : { color: "#64748b" }
              }
            >
              {label}
            </button>
          ))}
        </nav>
      )}

      <div className="flex-1" />

      {/* Customer Action Buttons */}
      {role === "customer" && (
        <>
          {onOpenChat && (
            <button
              onClick={onOpenChat}
              className="p-2.5 rounded-xl hover:bg-slate-100 transition-colors text-slate-600 cursor-pointer"
              title="Tin nhắn với Shop"
            >
              <MessageSquare size={18} />
            </button>
          )}

          <button
            onClick={() => setCustomerPage("cart")}
            className="relative p-2.5 rounded-xl hover:bg-slate-100 transition-colors text-slate-600 cursor-pointer"
            title="Giỏ hàng"
          >
            <ShoppingCart size={18} />
            {cartCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white rounded-full text-[10px] flex items-center justify-center font-bold animate-pulse leading-none">
                {cartCount}
              </span>
            )}
          </button>
        </>
      )}

      {/* Notification Dropdown */}
      <NotificationDropdown
        onNavigate={(link) => {
          if (link.includes("orders")) {
            setCustomerPage("orders");
          }
        }}
      />

      {/* Role Switcher */}
      <div className="relative">
        <button
          onClick={() => {
            setRoleOpen((o) => !o);
            setUserMenuOpen(false);
          }}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-sm transition-all cursor-pointer"
        >
          <div
            className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[11px] font-bold shadow-2xs"
            style={{ backgroundColor: ROLE_COLORS[role] }}
          >
            {ROLE_LABELS[role][0]}
          </div>
          <span className="text-xs font-semibold text-slate-700">
            {ROLE_LABELS[role]}
          </span>
          <ChevronDown size={13} className="text-slate-400" />
        </button>

        {roleOpen && (
          <div className="absolute right-0 top-full mt-1.5 w-48 bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-100">
            <div className="px-3 py-2 bg-slate-50 border-b border-slate-100">
              <p className="text-[11px] font-medium text-slate-400">Chọn vai trò demo:</p>
            </div>
            {(Object.entries(ROLE_LABELS) as [Role, string][]).map(([r, label]) => (
              <button
                key={r}
                onClick={() => handleRoleChange(r)}
                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs hover:bg-slate-50 transition-colors text-left cursor-pointer"
              >
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-white text-[10px] font-bold"
                  style={{ backgroundColor: ROLE_COLORS[r] }}
                >
                  {label[0]}
                </div>
                <span
                  className={role === r ? "font-bold" : "font-medium"}
                  style={{ color: role === r ? ROLE_COLORS[r] : "#475569" }}
                >
                  {label}
                </span>
                {role === r && (
                  <Check size={13} className="ml-auto" style={{ color: ROLE_COLORS[r] }} />
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* User Account / Auth Button */}
      <div className="relative">
        {isAuthenticated && user ? (
          <div>
            <button
              onClick={() => {
                setUserMenuOpen((o) => !o);
                setRoleOpen(false);
              }}
              className="flex items-center gap-2 p-1 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
            >
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-8 h-8 rounded-full object-cover border border-slate-200 ring-2 ring-blue-500/20 shadow-xs"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                  {user.name ? user.name[0] : "U"}
                </div>
              )}
            </button>
            {userMenuOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-56 bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-4 py-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-bold text-slate-800 truncate flex-1">{user.name}</p>
                    {user.authProvider === "google" && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-50 text-blue-600 border border-blue-100">
                        Google
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 truncate mt-0.5">{user.email}</p>
                </div>
                <button
                  onClick={() => {
                    setCustomerPage("profile");
                    setUserMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-slate-700 hover:bg-slate-50 transition-colors text-left"
                >
                  <Settings size={14} className="text-slate-400" />
                  Hồ sơ cá nhân
                </button>
                <button
                  onClick={() => {
                    logout();
                    setUserMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-red-600 hover:bg-red-50 transition-colors text-left border-t border-slate-100"
                >
                  <LogOut size={14} />
                  Đăng xuất
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={onOpenAuth}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 text-white hover:bg-slate-800 text-xs font-medium transition-all shadow-sm cursor-pointer"
          >
            <UserIcon size={13} />
            <span>Đăng nhập</span>
          </button>
        )}
      </div>
    </header>
  );
};
