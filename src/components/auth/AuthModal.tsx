import React, { useState, useEffect } from "react";
import { Modal } from "../common/Modal";
import { Btn } from "../common/Btn";
import { GoogleIcon } from "../common/GoogleIcon";
import { useAuth } from "../../contexts/AuthContext";
import { Role } from "../../types";
import { ROLE_LABELS } from "../../utils/status";
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
  KeyRound,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  Clock,
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
  const { login, loginWithGoogle, register, forgotPassword, resetPassword } = useAuth();
  const [tab, setTab] = useState<"login" | "register" | "forgot">("login");

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

  // Forgot / Reset Password state
  const [forgotStep, setForgotStep] = useState<"email" | "otp" | "new_password" | "success">("email");
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotOtp, setForgotOtp] = useState("");
  const [forgotNewPassword, setForgotNewPassword] = useState("");
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState("");
  const [showForgotNewPassword, setShowForgotNewPassword] = useState(false);
  const [showForgotConfirmPassword, setShowForgotConfirmPassword] = useState(false);
  const [forgotSuccessMsg, setForgotSuccessMsg] = useState("");
  const [cooldown, setCooldown] = useState(0); // 60s cooldown for resending OTP
  const [otpExpiresIn, setOtpExpiresIn] = useState(0); // 300s (5 mins) OTP countdown

  // Common & Google states
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showGooglePicker, setShowGooglePicker] = useState(false);
  const [customGoogleEmail, setCustomGoogleEmail] = useState("");
  const [showCustomGoogleInput, setShowCustomGoogleInput] = useState(false);
  const [error, setError] = useState("");

  // Countdown timer effect for Cooldown and OTP Expiry
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (cooldown > 0) {
      timer = setInterval(() => setCooldown((c) => Math.max(c - 1, 0)), 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (forgotStep === "otp" && otpExpiresIn > 0) {
      timer = setInterval(() => setOtpExpiresIn((t) => Math.max(t - 1, 0)), 1000);
    }
    return () => clearInterval(timer);
  }, [forgotStep, otpExpiresIn]);

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const resetFormState = () => {
    setError("");
    setShowGooglePicker(false);
    setShowCustomGoogleInput(false);
  };

  const resetForgotState = () => {
    setForgotStep("email");
    setForgotEmail("");
    setForgotOtp("");
    setForgotNewPassword("");
    setForgotConfirmPassword("");
    setForgotSuccessMsg("");
    setCooldown(0);
    setOtpExpiresIn(0);
    setError("");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmailOrUser.trim()) {
      setError("Vui lòng nhập Tên đăng nhập hoặc Email");
      return;
    }
    if (!loginPassword) {
      setError("Vui lòng nhập Mật khẩu");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await login(loginEmailOrUser.trim(), loginPassword);
      onClose();
    } catch (err: any) {
      setError(err?.message || "Tên đăng nhập hoặc mật khẩu không chính xác.");
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

  // --- FORGOT PASSWORD STEP HANDLERS ---
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!forgotEmail.trim() || !forgotEmail.includes("@")) {
      setError("Vui lòng nhập địa chỉ Email hợp lệ để nhận mã OTP.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const msg = await forgotPassword(forgotEmail.trim());
      setForgotSuccessMsg(msg || "Mã OTP đã được gửi đến email của bạn.");
      setForgotStep("otp");
      setCooldown(60); // 60s cooldown
      setOtpExpiresIn(300); // 5 minutes expiry
    } catch (err: any) {
      setError(err?.message || "Không thể gửi mã OTP. Vui lòng kiểm tra lại địa chỉ email.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotOtp.trim()) {
      setError("Vui lòng nhập mã OTP đã nhận được.");
      return;
    }
    if (forgotOtp.trim().length < 4) {
      setError("Mã OTP không hợp lệ (yêu cầu tối thiểu 4-6 chữ số).");
      return;
    }
    if (otpExpiresIn <= 0) {
      setError("Mã OTP đã hết hiệu lực. Vui lòng nhấn 'Gửi lại mã' để nhận mã mới.");
      return;
    }
    setError("");
    setForgotStep("new_password");
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotNewPassword) {
      setError("Vui lòng nhập Mật khẩu mới.");
      return;
    }
    if (forgotNewPassword.length < 6) {
      setError("Mật khẩu mới phải có tối thiểu 6 ký tự.");
      return;
    }
    if (forgotNewPassword !== forgotConfirmPassword) {
      setError("Mật khẩu xác nhận không trùng khớp.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const msg = await resetPassword(forgotEmail.trim(), forgotOtp.trim(), forgotNewPassword);
      setForgotSuccessMsg(msg || "Đặt lại mật khẩu thành công!");
      setForgotStep("success");
    } catch (err: any) {
      setError(err?.message || "Đặt lại mật khẩu thất bại. Vui lòng kiểm tra lại mã OTP.");
    } finally {
      setLoading(false);
    }
  };

  const getModalTitle = () => {
    if (showGooglePicker) return "Đăng nhập bằng tài khoản Google";
    if (tab === "forgot") {
      if (forgotStep === "email") return "Quên mật khẩu";
      if (forgotStep === "otp") return "Xác thực mã OTP";
      if (forgotStep === "new_password") return "Thiết lập mật khẩu mới";
      return "Đổi mật khẩu thành công";
    }
    return tab === "login" ? "Đăng nhập hệ thống" : "Đăng ký tài khoản mới";
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        resetFormState();
        resetForgotState();
        setTab("login");
        onClose();
      }}
      title={getModalTitle()}
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
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
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
              className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl border border-dashed border-slate-300 text-xs font-semibold text-slate-600 hover:border-blue-400 hover:text-blue-600 hover:bg-slate-50 transition-all cursor-pointer"
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
                  className="px-3.5 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-1 cursor-pointer"
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
      ) : tab === "forgot" ? (
        /* FORGOT PASSWORD WORKFLOW (4 STEPS) */
        <div className="space-y-4 animate-in fade-in zoom-in-95 duration-150">
          {/* Header Bar */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <button
              type="button"
              onClick={() => {
                resetForgotState();
                setTab("login");
              }}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
            >
              <ArrowLeft size={14} />
              Quay lại Đăng nhập
            </button>
            <div className="flex items-center gap-1 text-[11px] font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
              <KeyRound size={12} />
              <span>Khôi phục tài khoản</span>
            </div>
          </div>

          {/* Error & Info Alerts */}
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-600 font-medium">
              {error}
            </div>
          )}

          {forgotStep === "email" && (
            /* STEP 1: ENTER EMAIL */
            <form onSubmit={handleSendOtp} className="space-y-3.5">
              <p className="text-xs text-slate-600 leading-relaxed">
                Nhập địa chỉ Email đã đăng ký tài khoản BookVerse của bạn. Hệ thống sẽ gửi một mã OTP 6 số để xác thực.
              </p>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Địa chỉ Email <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail size={15} />
                  </div>
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="name@example.com"
                    required
                    autoFocus
                    className="w-full text-xs border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 focus:outline-none focus:border-blue-500 bg-slate-50"
                  />
                </div>
              </div>

              <Btn type="submit" disabled={loading} className="w-full">
                {loading ? <Loader2 size={15} className="animate-spin" /> : <ShieldCheck size={15} />}
                {loading ? "Đang gửi mã OTP..." : "Gửi mã OTP về Email"}
              </Btn>
            </form>
          )}

          {forgotStep === "otp" && (
            /* STEP 2: ENTER OTP CODE */
            <form onSubmit={handleVerifyOtp} className="space-y-3.5">
              <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-100 text-xs text-blue-800">
                <p className="font-semibold">{forgotSuccessMsg || "Mã OTP đã được gửi thành công!"}</p>
                <p className="text-[11px] text-blue-600 mt-0.5">
                  Vui lòng kiểm tra hộp thư đến (hoặc thư mục Spam) của <strong>{forgotEmail}</strong>.
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-slate-600">
                    Nhập mã OTP 6 số <span className="text-red-500">*</span>
                  </label>
                  {otpExpiresIn > 0 ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md">
                      <Clock size={11} />
                      Còn {formatTimer(otpExpiresIn)}
                    </span>
                  ) : (
                    <span className="text-[11px] font-bold text-red-500">Mã đã hết hạn</span>
                  )}
                </div>

                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <KeyRound size={15} />
                  </div>
                  <input
                    type="text"
                    maxLength={6}
                    value={forgotOtp}
                    onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, ""))}
                    placeholder="123456"
                    required
                    autoFocus
                    className="w-full text-center tracking-[8px] font-mono text-base font-bold border border-slate-200 rounded-xl py-2.5 focus:outline-none focus:border-blue-500 bg-slate-50"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => setForgotStep("email")}
                  className="text-xs text-slate-500 hover:text-slate-800 underline cursor-pointer"
                >
                  Đổi email khác
                </button>

                <button
                  type="button"
                  disabled={cooldown > 0 || loading}
                  onClick={() => handleSendOtp()}
                  className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
                  {cooldown > 0 ? `Gửi lại mã (${cooldown}s)` : "Gửi lại mã OTP"}
                </button>
              </div>

              <Btn type="submit" disabled={loading || !forgotOtp.trim()} className="w-full">
                Tiếp tục thiết lập mật khẩu
              </Btn>
            </form>
          )}

          {forgotStep === "new_password" && (
            /* STEP 3: SET NEW PASSWORD */
            <form onSubmit={handleResetPassword} className="space-y-3.5">
              <p className="text-xs text-slate-600">
                Nhập mật khẩu mới an toàn cho tài khoản <strong>{forgotEmail}</strong>.
              </p>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Mật khẩu mới <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock size={15} />
                  </div>
                  <input
                    type={showForgotNewPassword ? "text" : "password"}
                    value={forgotNewPassword}
                    onChange={(e) => setForgotNewPassword(e.target.value)}
                    placeholder="Tối thiểu 6 ký tự"
                    required
                    autoFocus
                    className="w-full text-xs border border-slate-200 rounded-xl pl-9 pr-10 py-2.5 focus:outline-none focus:border-blue-500 bg-slate-50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowForgotNewPassword((s) => !s)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showForgotNewPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Xác nhận mật khẩu mới <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock size={15} />
                  </div>
                  <input
                    type={showForgotConfirmPassword ? "text" : "password"}
                    value={forgotConfirmPassword}
                    onChange={(e) => setForgotConfirmPassword(e.target.value)}
                    placeholder="Nhập lại mật khẩu mới"
                    required
                    className="w-full text-xs border border-slate-200 rounded-xl pl-9 pr-10 py-2.5 focus:outline-none focus:border-blue-500 bg-slate-50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowForgotConfirmPassword((s) => !s)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showForgotConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <Btn type="submit" disabled={loading} className="w-full">
                {loading ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
                {loading ? "Đang cập nhật..." : "Xác nhận đổi mật khẩu"}
              </Btn>
            </form>
          )}

          {forgotStep === "success" && (
            /* STEP 4: SUCCESS CONFIRMATION */
            <div className="text-center py-4 space-y-3.5">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 size={26} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">Đặt lại mật khẩu thành công!</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Mật khẩu mới đã được cập nhật an toàn. Bây giờ bạn có thể đăng nhập vào tài khoản BookVerse của mình.
                </p>
              </div>

              <Btn
                type="button"
                onClick={() => {
                  setLoginEmailOrUser(forgotEmail);
                  setLoginPassword(forgotNewPassword);
                  resetForgotState();
                  setTab("login");
                }}
                className="w-full"
              >
                <LogIn size={15} />
                Đăng nhập ngay
              </Btn>
            </div>
          )}
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
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
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
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
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

          {tab === "login" ? (
            /* TAB LOGIN */
            <div>
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
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-medium text-slate-600">
                      Mật khẩu
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setTab("forgot");
                        resetForgotState();
                        if (loginEmailOrUser.includes("@")) {
                          setForgotEmail(loginEmailOrUser);
                        }
                      }}
                      className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 transition-colors cursor-pointer"
                    >
                      Quên mật khẩu?
                    </button>
                  </div>

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
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showLoginPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                <Btn type="submit" disabled={loading} className="w-full">
                  <LogIn size={15} />
                  {loading ? "Đang xử lý..." : "Đăng nhập"}
                </Btn>
              </form>

              {/* DIVIDER */}
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-[10px] uppercase tracking-wider">
                  <span className="bg-white px-2.5 text-slate-400 font-semibold">
                    Hoặc đăng nhập bằng
                  </span>
                </div>
              </div>

              {/* GOOGLE SIGN-IN BUTTON */}
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
                <span>Tiếp tục với Google</span>
              </button>
            </div>
          ) : (
            /* TAB REGISTER */
            <div>
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
                        className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
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
                        className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
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

              {/* DIVIDER */}
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-[10px] uppercase tracking-wider">
                  <span className="bg-white px-2.5 text-slate-400 font-semibold">
                    Hoặc đăng ký nhanh với
                  </span>
                </div>
              </div>

              {/* GOOGLE SIGN-IN BUTTON */}
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
                <span>Đăng ký nhanh bằng Google</span>
              </button>
            </div>
          )}
        </>
      )}
    </Modal>
  );
};
