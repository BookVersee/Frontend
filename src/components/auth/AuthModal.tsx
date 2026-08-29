import React, { useState, useEffect, useRef } from "react";
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
  Sparkles,
} from "lucide-react";

declare global {
  interface Window {
    google?: any;
  }
}

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

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
  const [error, setError] = useState("");

  // Refs to mount Google Identity Services buttons
  const googleBtnLoginRef = useRef<HTMLDivElement>(null);
  const googleBtnRegRef = useRef<HTMLDivElement>(null);

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

  // Initialize Google Identity Services (GIS)
  useEffect(() => {
    if (!isOpen || tab === "forgot") return;

    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) {
      console.warn("VITE_GOOGLE_CLIENT_ID is not configured");
      return;
    }

    const initGoogleGsi = () => {
      if (window.google?.accounts?.id) {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: async (response: any) => {
            if (response?.credential) {
              setGoogleLoading(true);
              setError("");
              try {
                await loginWithGoogle(response.credential);
                onClose();
              } catch (err: any) {
                setError(err?.message || "Đăng nhập Google thất bại. Vui lòng thử lại.");
              } finally {
                setGoogleLoading(false);
              }
            }
          },
          auto_select: false,
          cancel_on_tap_outside: true,
        });

        // Render official button in Login Tab
        if (googleBtnLoginRef.current && tab === "login") {
          googleBtnLoginRef.current.innerHTML = "";
          window.google.accounts.id.renderButton(googleBtnLoginRef.current, {
            type: "standard",
            theme: "outline",
            size: "large",
            text: "continue_with",
            shape: "pill",
            width: 360,
            logo_alignment: "left",
          });
        }

        // Render official button in Register Tab
        if (googleBtnRegRef.current && tab === "register") {
          googleBtnRegRef.current.innerHTML = "";
          window.google.accounts.id.renderButton(googleBtnRegRef.current, {
            type: "standard",
            theme: "outline",
            size: "large",
            text: "signup_with",
            shape: "pill",
            width: 440,
            logo_alignment: "left",
          });
        }
      }
    };

    if (window.google?.accounts?.id) {
      initGoogleGsi();
    } else {
      const interval = setInterval(() => {
        if (window.google?.accounts?.id) {
          clearInterval(interval);
          initGoogleGsi();
        }
      }, 200);
      return () => clearInterval(interval);
    }
  }, [isOpen, tab]);

  const handleTriggerGooglePrompt = () => {
    if (window.google?.accounts?.id) {
      setError("");
      setGoogleLoading(true);
      window.google.accounts.id.prompt((notification: any) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          setGoogleLoading(false);
        }
      });
    } else {
      setError("Dịch vụ Google Identity chưa sẵn sàng. Vui lòng thử lại sau vài giây.");
    }
  };

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const resetFormState = () => {
    setError("");
    setGoogleLoading(false);
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
      maxWidth={tab === "register" ? "max-w-lg" : "max-w-md"}
    >
      {tab === "forgot" ? (
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

          {forgotSuccessMsg && forgotStep !== "success" && (
            <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-700 font-medium flex items-center gap-2">
              <Sparkles size={14} className="shrink-0 text-blue-500" />
              <span>{forgotSuccessMsg}</span>
            </div>
          )}

          {forgotStep === "email" && (
            /* STEP 1: ENTER EMAIL */
            <form onSubmit={handleSendOtp} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Địa chỉ Email đăng ký của bạn <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail size={15} />
                  </div>
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="user@example.com"
                    required
                    autoFocus
                    className="w-full text-xs border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 focus:outline-none focus:border-blue-500 bg-slate-50"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5">
                  Hệ thống sẽ gửi một mã OTP 6 số xác thực về địa chỉ email này.
                </p>
              </div>

              <Btn type="submit" disabled={loading} className="w-full">
                {loading ? (
                  <>
                    <Loader2 size={15} className="animate-spin" /> Đang gửi mã OTP...
                  </>
                ) : (
                  <>
                    <Mail size={15} /> Gửi mã OTP xác nhận
                  </>
                )}
              </Btn>
            </form>
          )}

          {forgotStep === "otp" && (
            /* STEP 2: VERIFY OTP */
            <form onSubmit={handleVerifyOtp} className="space-y-3.5">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-slate-600">
                    Mã xác thực OTP (6 chữ số) <span className="text-red-500">*</span>
                  </label>
                  {otpExpiresIn > 0 ? (
                    <span className="text-[11px] font-mono font-semibold text-amber-600 flex items-center gap-1">
                      <Clock size={12} />
                      Còn {formatTimer(otpExpiresIn)}
                    </span>
                  ) : (
                    <span className="text-[11px] font-semibold text-red-500">Mã đã hết hạn</span>
                  )}
                </div>

                <div className="relative">
                  <input
                    type="text"
                    maxLength={6}
                    value={forgotOtp}
                    onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, ""))}
                    placeholder="123456"
                    required
                    autoFocus
                    className="w-full text-center text-lg font-mono tracking-widest font-bold border border-slate-200 rounded-xl py-2.5 focus:outline-none focus:border-blue-500 bg-slate-50"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1 text-center">
                  Vui lòng kiểm tra hòm thư đến hoặc mục thư rác (Spam) của <strong>{forgotEmail}</strong>
                </p>
              </div>

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => setForgotStep("email")}
                  className="text-xs text-slate-500 hover:text-slate-700 underline cursor-pointer"
                >
                  Đổi email khác
                </button>

                <button
                  type="button"
                  disabled={cooldown > 0 || loading}
                  onClick={() => handleSendOtp()}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
                  {cooldown > 0 ? `Gửi lại mã (${cooldown}s)` : "Gửi lại mã OTP"}
                </button>
              </div>

              <Btn type="submit" disabled={!forgotOtp.trim()} className="w-full">
                <ShieldCheck size={15} /> Xác nhận mã OTP
              </Btn>
            </form>
          )}

          {forgotStep === "new_password" && (
            /* STEP 3: SET NEW PASSWORD */
            <form onSubmit={handleResetPassword} className="space-y-3.5">
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
                {loading ? (
                  <>
                    <Loader2 size={15} className="animate-spin" /> Đang cập nhật...
                  </>
                ) : (
                  <>
                    <Check size={15} /> Lưu mật khẩu mới
                  </>
                )}
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
                  Mật khẩu mới đã được cập nhật an toàn trên hệ thống. Bây giờ bạn có thể đăng nhập vào tài khoản BookVerse của mình.
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
                    Hoặc tiếp tục với
                  </span>
                </div>
              </div>

              {/* OFFICIAL GOOGLE SIGN-IN BUTTON CONTAINER */}
              <div className="flex flex-col items-center justify-center min-h-[44px]">
                <div ref={googleBtnLoginRef} className="w-full flex justify-center" />
                {googleLoading && (
                  <div className="flex items-center gap-2 text-xs text-blue-600 font-medium mt-2">
                    <Loader2 size={14} className="animate-spin" />
                    <span>Đang xác thực tài khoản Google với máy chủ...</span>
                  </div>
                )}
              </div>
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

              {/* OFFICIAL GOOGLE SIGN-IN BUTTON CONTAINER */}
              <div className="flex flex-col items-center justify-center min-h-[44px]">
                <div ref={googleBtnRegRef} className="w-full flex justify-center" />
                {googleLoading && (
                  <div className="flex items-center gap-2 text-xs text-blue-600 font-medium mt-2">
                    <Loader2 size={14} className="animate-spin" />
                    <span>Đang liên kết tài khoản Google với máy chủ...</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </Modal>
  );
};
