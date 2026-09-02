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

  const handleRoleChange = async (newRole: Role) => {
    await switchRole(newRole);
    setRoleOpen(false);
    setCustomerPage("home");
  };

  return (
    <header className="sticky top-0 z-40 bg-[#1c1612] border-b border-[#2a211c] px-5 py-3 flex items-center gap-4 shadow-md">
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
          <span className="font-bold text-[#c8843a] text-base leading-tight tracking-tight font-serif">
            Book<span className="font-sans text-xs text-[#b5a898] uppercase ml-0.5 tracking-wider font-semibold">Verse</span>
          </span>
          <span className="text-[9px] text-[#7a6a5a] uppercase font-bold tracking-wider">Multi-vendor</span>
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
              onClick={() => {
                if ((pg === "orders" || pg === "profile") && !isAuthenticated) {
                  onOpenAuth();
                  return;
                }
                setCustomerPage(pg);
              }}
              className="px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer"
              style={
                customerPage === pg
                  ? {
                      color: "#c8843a",
                      borderBottom: "2px solid #c8843a",
                      paddingBottom: 2,
                    }
                  : { color: "#b5a898" }
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
              className="p-2.5 rounded-xl hover:bg-[#3d2b1a] transition-colors text-[#b5a898] hover:text-[#fdf9f5] cursor-pointer"
              title="Tin nhắn với Shop"
            >
              <MessageSquare size={18} />
            </button>
          )}

          <button
            onClick={() => setCustomerPage("cart")}
            className="relative p-2.5 rounded-xl hover:bg-[#3d2b1a] transition-colors text-[#b5a898] hover:text-[#fdf9f5] cursor-pointer"
            title="Giỏ hàng"
          >
            <ShoppingCart size={18} />
            {cartCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-[#c8843a] text-white rounded-full text-[10px] flex items-center justify-center font-bold animate-pulse leading-none">
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
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-700 hover:border-slate-600 hover:bg-[#2a211c] text-sm transition-all cursor-pointer text-[#e8ddd0]"
        >
          <div
            className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[11px] font-bold shadow-2xs"
            style={{ backgroundColor: ROLE_COLORS[role] || "#7c4a2d" }}
          >
            {(ROLE_LABELS[role] || "K")[0]}
          </div>
          <span className="text-xs font-semibold">
            {ROLE_LABELS[role] || "Khách hàng"}
          </span>
          <ChevronDown size={13} className="text-[#7a6a5a]" />
        </button>

        {roleOpen && (
          <div className="absolute right-0 top-full mt-1.5 w-48 bg-[#2a211c] rounded-2xl border border-slate-700 shadow-xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-100">
            <div className="px-3 py-2 bg-[#1c1612] border-b border-slate-700">
              <p className="text-[11px] font-medium text-[#7a6a5a]">Chọn vai trò demo:</p>
            </div>
            {[
              { r: "customer" as Role, label: "Khách hàng" },
              { r: "shop" as Role, label: "Cửa hàng" },
              { r: "admin" as Role, label: "Quản trị viên" },
              { r: "deliver" as Role, label: "Người giao hàng" },
            ].map(({ r, label }) => (
              <button
                key={r}
                onClick={() => handleRoleChange(r)}
                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs hover:bg-[#3d2b1a] transition-colors text-left cursor-pointer text-[#e8ddd0]"
              >
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-white text-[10px] font-bold"
                  style={{ backgroundColor: ROLE_COLORS[r] || "#7c4a2d" }}
                >
                  {label[0]}
                </div>
                <span
                  className={role === r ? "font-bold" : "font-medium"}
                  style={{ color: role === r ? (ROLE_COLORS[r] || "#c8843a") : "#b5a898" }}
                >
                  {label}
                </span>
                {role === r && (
                  <Check size={13} className="ml-auto" style={{ color: ROLE_COLORS[r] || "#c8843a" }} />
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
              className="flex items-center gap-2 p-1 rounded-xl hover:bg-[#2a211c] transition-colors cursor-pointer"
            >
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-8 h-8 rounded-full object-cover border border-slate-700 ring-2 ring-[#c8843a]/30 shadow-xs"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-[#3d2b1a] text-[#c8843a] border border-[#523d2b] flex items-center justify-center font-bold text-xs">
                  {user.name ? user.name[0] : "U"}
                </div>
              )}
            </button>
            {userMenuOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-56 bg-[#2a211c] rounded-2xl border border-slate-700 shadow-xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-4 py-3 bg-[#1c1612] border-b border-slate-700">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-bold text-[#e8ddd0] truncate flex-1">{user.name}</p>
                    {user.authProvider === "google" && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-950 text-blue-300 border border-blue-800">
                        Google
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-[#b5a898] truncate mt-0.5">{user.email}</p>
                </div>
                <button
                  onClick={() => {
                    setCustomerPage("profile");
                    setUserMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-[#e8ddd0] hover:bg-[#3d2b1a] transition-colors text-left cursor-pointer"
                >
                  <Settings size={14} className="text-[#c8843a]" />
                  Hồ sơ cá nhân
                </button>
                <button
                  onClick={async () => {
                    if (window.confirm("Bạn có chắc chắn muốn đăng xuất khỏi tài khoản?")) {
                      setUserMenuOpen(false);
                      await logout();
                      setCustomerPage("home");
                    }
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-red-400 hover:bg-red-950/30 hover:text-red-300 transition-colors text-left border-t border-slate-700/60 cursor-pointer"
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
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#c8843a] text-white hover:bg-[#b66e30] text-xs font-medium transition-all shadow-sm cursor-pointer"
          >
            <UserIcon size={13} />
            <span>Đăng nhập</span>
          </button>
        )}
      </div>
    </header>
  );
};

