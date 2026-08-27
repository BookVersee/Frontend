import React, { useState } from "react";
import { Modal } from "../common/Modal";
import { Btn } from "../common/Btn";
import { GoogleIcon } from "../common/GoogleIcon";
import { useAuth } from "../../contexts/AuthContext";
import { Role } from "../../types";
import { ROLE_COLORS, ROLE_LABELS } from "../../utils/status";
import { DEMO_USERS } from "../../services/mockData";
import {
  Check,
  LogIn,
  UserPlus,
  ArrowLeft,
  Loader2,
  PlusCircle,
  Eye,
  EyeOff,
  User as UserIcon,
  Mail,
  Lock,
  Phone,
  MapPin,
  AtSign,
} from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const GOOGLE_SAMPLE_ACCOUNTS = [
  {
    name: "Tâm Nguyễn",
    email: "tam.nguyen.dev@gmail.com",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80",
  },
  {
    name: "An Nguyễn",
    email: "an.nguyen.google@gmail.com",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80",
  },
  {
    name: "Độc Giả BookVerse",
    email: "reader.bookverse@gmail.com",
    avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=120&auto=format&fit=crop&q=80",
  },
];

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { login, loginWithGoogle, register } = useAuth();
  const [tab, setTab] = useState<"login" | "register">("login");

  // Login form state
  const [loginEmailOrUser, setLoginEmailOrUser] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Register form state
  const [regUsername, setRegUsername] = useState("");
  const [regFullName, setRegFullName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regAddress, setRegAddress] = useState("");
  const [regRole, setRegRole] = useState<Role>("customer");
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false);

  // Common & Google states
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showGooglePicker, setShowGooglePicker] = useState(false);
  const [customGoogleEmail, setCustomGoogleEmail] = useState("");
  const [showCustomGoogleInput, setShowCustomGoogleInput] = useState(false);
  const [error, setError] = useState("");

  const resetFormState = () => {
    setError("");
    setShowGooglePicker(false);
    setShowCustomGoogleInput(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmailOrUser.trim()) {
      setError("Vui lòng nhập Tên đăng nhập hoặc Email");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await login(loginEmailOrUser.trim(), loginPassword);
      onClose();
    } catch (err: any) {
      setError(err?.message || "Đăng nhập không thành công. Vui lòng kiểm tra lại thông tin.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regFullName.trim()) {
      setError("Vui lòng nhập Họ và tên đầy đủ");
      return;
    }
    if (!regEmail.trim() || !regEmail.includes("@")) {
      setError("Vui lòng nhập địa chỉ Email hợp lệ");
      return;
    }
    if (!regPassword) {
      setError("Vui lòng thiết lập Mật khẩu");
      return;
    }
    if (regPassword.length < 6) {
      setError("Mật khẩu phải có tối thiểu 6 ký tự");
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setError("Mật khẩu xác nhận không trùng khớp");
      return;
    }

    const finalUsername = regUsername.trim() || regEmail.trim().split("@")[0];

    setError("");
    setLoading(true);
    try {
      await register({
        username: finalUsername,
        name: regFullName.trim(),
        email: regEmail.trim().toLowerCase(),
        password: regPassword,
        role: regRole,
        phone: regPhone.trim() || undefined,
        address: regAddress.trim() || undefined,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || "Đăng ký không thành công. Tên đăng nhập hoặc Email có thể đã tồn tại.");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDemoUser = async (userEmail: string) => {
    setLoading(true);
    try {
      await login(userEmail);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async (accountData: {
    email: string;
    name?: string;
    avatar?: string;
  }) => {
    setGoogleLoading(true);
    setError("");
    try {
      await loginWithGoogle({
        email: accountData.email,
        name: accountData.name || accountData.email.split("@")[0],
        avatar: accountData.avatar,
        role: tab === "register" ? regRole : "customer",
      });
      setShowGooglePicker(false);
      onClose();
    } catch (err: any) {
      setError(err?.message || "Đăng nhập Google không thành công. Vui lòng thử lại.");
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleCustomGoogleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customGoogleEmail || !customGoogleEmail.includes("@")) {
      setError("Vui lòng nhập địa chỉ email Google hợp lệ");
      return;
    }
    handleGoogleSignIn({
      email: customGoogleEmail,
      name: customGoogleEmail.split("@")[0],
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        resetFormState();
        onClose();
      }}
      title={
        showGooglePicker
          ? "Đăng nhập bằng tài khoản Google"
          : tab === "login"
          ? "Đăng nhập hệ thống"
          : "Đăng ký tài khoản mới"
      }
      maxWidth={tab === "register" && !showGooglePicker ? "max-w-lg" : "max-w-md"}
    >
      {showGooglePicker ? (
        /* GOOGLE ACCOUNT SELECTOR DIALOG */
        <div className="space-y-4 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <button
              type="button"
              onClick={() => {
                setShowGooglePicker(false);
                setError("");
              }}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
            >
              <ArrowLeft size={14} />
              Quay lại
            </button>
            <div className="flex items-center gap-1.5">
              <GoogleIcon size={16} />
              <span className="text-xs font-bold text-slate-700">Google OAuth 2.0</span>
            </div>
          </div>

          <p className="text-xs text-slate-500">
            Chọn một tài khoản Google để tiếp tục với <strong className="text-slate-700">BookVerse</strong>
          </p>

          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-600 font-medium">
              {error}
            </div>
          )}

          <div className="space-y-2">
            {GOOGLE_SAMPLE_ACCOUNTS.map((acc) => (
              <button
                key={acc.email}
                type="button"
                disabled={googleLoading}
                onClick={() => handleGoogleSignIn(acc)}
                className="w-full flex items-center gap-3 p-3 rounded-2xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/40 transition-all text-left group cursor-pointer disabled:opacity-60"
              >
                <img
                  src={acc.avatar}
                  alt={acc.name}
                  className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0 group-hover:scale-105 transition-transform"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                    {acc.name}
                  </p>
                  <p className="text-[11px] text-slate-400 truncate">{acc.email}</p>
                </div>
                {googleLoading ? (
                  <Loader2 size={16} className="text-blue-600 animate-spin" />
                ) : (
                  <GoogleIcon size={18} className="shrink-0 opacity-70 group-hover:opacity-100" />
                )}
              </button>
            ))}
          </div>

          {/* Custom Google Email input toggle */}
          {!showCustomGoogleInput ? (
            <button
              type="button"
              onClick={() => setShowCustomGoogleInput(true)}
              className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl border border-dashed border-slate-300 text-xs font-semibold text-slate-600 hover:border-blue-400 hover:text-blue-600 hover:bg-slate-50 transition-all"
            >
              <PlusCircle size={15} />
              Sử dụng tài khoản Google khác
            </button>
          ) : (
            <form onSubmit={handleCustomGoogleSubmit} className="space-y-2 pt-2 border-t border-slate-100">
              <label className="block text-xs font-medium text-slate-600">
                Nhập địa chỉ Gmail của bạn:
              </label>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={customGoogleEmail}
                  onChange={(e) => setCustomGoogleEmail(e.target.value)}
                  placeholder="your.email@gmail.com"
                  className="flex-1 text-xs border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500 bg-slate-50"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={googleLoading}
                  className="px-3.5 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-1"
                >
                  {googleLoading ? <Loader2 size={13} className="animate-spin" /> : "Tiếp tục"}
                </button>
              </div>
            </form>
          )}

          <p className="text-[11px] text-center text-slate-400 pt-2">
            Đăng nhập an toàn & bảo mật qua giao thức Google OAuth 2.0
          </p>
        </div>
      ) : (
        /* STANDARD LOGIN / REGISTER VIEW */
        <>
          <div className="flex rounded-xl bg-slate-100 p-1 mb-4">
            <button
              type="button"
              onClick={() => {
                setTab("login");
                resetFormState();
              }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                tab === "login"
                  ? "bg-white text-slate-800 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Đăng nhập
            </button>
            <button
              type="button"
              onClick={() => {
                setTab("register");
                resetFormState();
              }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                tab === "register"
                  ? "bg-white text-slate-800 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Đăng ký
            </button>
          </div>

          {error && (
            <div className="p-3 mb-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-600 font-medium">
              {error}
            </div>
          )}

          {/* GOOGLE SIGN-IN BUTTON */}
          <div className="mb-3.5">
            <button
              type="button"
              onClick={() => {
                setError("");
                setShowGooglePicker(true);
              }}
              disabled={loading || googleLoading}
              className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-xl border border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-xs active:scale-[0.99] cursor-pointer disabled:opacity-60"
            >
              <GoogleIcon size={18} />
              <span>
                {tab === "login" ? "Tiếp tục với Google" : "Đăng ký nhanh bằng Google"}
              </span>
            </button>

            {/* DIVIDER */}
            <div className="relative my-3.5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase tracking-wider">
                <span className="bg-white px-2.5 text-slate-400 font-semibold">
                  Hoặc bằng tài khoản & mật khẩu
                </span>
              </div>
            </div>
          </div>

          {tab === "login" ? (
            <form onSubmit={handleLogin} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Tên đăng nhập hoặc Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <UserIcon size={15} />
                  </div>
                  <input
                    type="text"
                    value={loginEmailOrUser}
                    onChange={(e) => setLoginEmailOrUser(e.target.value)}
                    placeholder="an.nguyen@email.com hoặc username"
                    className="w-full text-xs border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 focus:outline-none focus:border-blue-500 bg-slate-50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Mật khẩu
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock size={15} />
                  </div>
                  <input
                    type={showLoginPassword ? "text" : "password"}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full text-xs border border-slate-200 rounded-xl pl-9 pr-10 py-2.5 focus:outline-none focus:border-blue-500 bg-slate-50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword((s) => !s)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    {showLoginPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <Btn type="submit" disabled={loading} className="w-full">
                <LogIn size={15} />
                {loading ? "Đang xử lý..." : "Đăng nhập với JWT"}
              </Btn>

              <div className="pt-3 border-t border-slate-100">
                <p className="text-[11px] text-slate-400 font-medium mb-2">
                  Hoặc chọn nhanh tài khoản Demo:
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {DEMO_USERS.slice(0, 4).map((u) => (
                    <button
                      type="button"
                      key={u.id}
                      onClick={() => handleSelectDemoUser(u.email)}
                      className="flex items-center gap-2 p-2 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 transition-all text-left cursor-pointer"
                    >
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                        style={{ backgroundColor: ROLE_COLORS[u.role] }}
                      >
                        {u.name[0]}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-slate-700 truncate">{u.name}</p>
                        <p className="text-[10px] text-slate-400">{ROLE_LABELS[u.role]}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-3">
              {/* Row 1: Username & FullName */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Tên đăng nhập <span className="text-slate-400">(Username)</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                      <AtSign size={14} />
                    </div>
                    <input
                      type="text"
                      value={regUsername}
                      onChange={(e) => setRegUsername(e.target.value.replace(/\s+/g, ""))}
                      placeholder="nguyenvan_a"
                      className="w-full text-xs border border-slate-200 rounded-xl pl-8 pr-2.5 py-2 focus:outline-none focus:border-blue-500 bg-slate-50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Họ và tên <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                      <UserIcon size={14} />
                    </div>
                    <input
                      type="text"
                      value={regFullName}
                      onChange={(e) => setRegFullName(e.target.value)}
                      placeholder="Nguyễn Văn A"
                      required
                      className="w-full text-xs border border-slate-200 rounded-xl pl-8 pr-2.5 py-2 focus:outline-none focus:border-blue-500 bg-slate-50"
                    />
                  </div>
                </div>
              </div>

              {/* Row 2: Email */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Địa chỉ Email <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                    <Mail size={14} />
                  </div>
                  <input
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="user@example.com"
                    required
                    className="w-full text-xs border border-slate-200 rounded-xl pl-8 pr-2.5 py-2 focus:outline-none focus:border-blue-500 bg-slate-50"
                  />
                </div>
              </div>

              {/* Row 3: Password & Confirm Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Mật khẩu <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                      <Lock size={14} />
                    </div>
                    <input
                      type={showRegPassword ? "text" : "password"}
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Tối thiểu 6 ký tự"
                      required
                      className="w-full text-xs border border-slate-200 rounded-xl pl-8 pr-8 py-2 focus:outline-none focus:border-blue-500 bg-slate-50"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPassword((s) => !s)}
                      className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600"
                    >
                      {showRegPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Xác nhận mật khẩu <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                      <Lock size={14} />
                    </div>
                    <input
                      type={showRegConfirmPassword ? "text" : "password"}
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      placeholder="Nhập lại mật khẩu"
                      required
                      className="w-full text-xs border border-slate-200 rounded-xl pl-8 pr-8 py-2 focus:outline-none focus:border-blue-500 bg-slate-50"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegConfirmPassword((s) => !s)}
                      className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600"
                    >
                      {showRegConfirmPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Row 4: Phone & Address */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Số điện thoại <span className="text-slate-400">(tùy chọn)</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                      <Phone size={14} />
                    </div>
                    <input
                      type="tel"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      placeholder="0901234567"
                      className="w-full text-xs border border-slate-200 rounded-xl pl-8 pr-2.5 py-2 focus:outline-none focus:border-blue-500 bg-slate-50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Địa chỉ nhận hàng <span className="text-slate-400">(tùy chọn)</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                      <MapPin size={14} />
                    </div>
                    <input
                      type="text"
                      value={regAddress}
                      onChange={(e) => setRegAddress(e.target.value)}
                      placeholder="123 Nguyễn Huệ, TP.HCM"
                      className="w-full text-xs border border-slate-200 rounded-xl pl-8 pr-2.5 py-2 focus:outline-none focus:border-blue-500 bg-slate-50"
                    />
                  </div>
                </div>
              </div>

              {/* Row 5: Role Selection */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Vai trò tài khoản (Role)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(["customer", "shop", "deliver"] as Role[]).map((r) => (
                    <button
                      type="button"
                      key={r}
                      onClick={() => setRegRole(r)}
                      className={`p-2 text-xs font-medium rounded-xl border-2 transition-all flex items-center justify-center gap-1 cursor-pointer ${
                        regRole === r
                          ? "border-blue-600 bg-blue-50 text-blue-700"
                          : "border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {ROLE_LABELS[r]}
                      {regRole === r && <Check size={12} />}
                    </button>
                  ))}
                </div>
              </div>

              <Btn type="submit" disabled={loading} className="w-full mt-1.5">
                <UserPlus size={15} />
                {loading ? "Đang xử lý..." : "Đăng ký tài khoản"}
              </Btn>
            </form>
          )}
        </>
      )}
    </Modal>
  );
};


