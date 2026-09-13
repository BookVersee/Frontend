import React, { useState, useEffect, useMemo } from "react";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Save,
  Store,
  CreditCard,
  CheckCircle,
  ShieldCheck,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  AlertTriangle,
  Trash2,
  RefreshCw,
  Clock,
  LogOut,
  Send,
  Sparkles,
  ArrowDownLeft,
  ArrowUpRight,
  Copy,
  Check,
  Search,
  Receipt,
  Filter,
  X,
  ChevronRight,
  ArrowRight,
  ArrowLeft,
  Package,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { authService } from "../../services/authService";
import { Card } from "../../components/common/Card";
import { Btn } from "../../components/common/Btn";
import { Badge } from "../../components/common/Badge";
import { Modal } from "../../components/common/Modal";
import { fmt, formatOrderDate, formatOrderCode } from "../../utils/format";
import { Transaction } from "../../types";

export type ProfileDashboardTab = "profile" | "transactions" | "security";

interface ProfilePageProps {
  onOpenAuth?: () => void;
  onGoHome?: () => void;
  onGoOrders?: () => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ onOpenAuth, onGoHome, onGoOrders }) => {
  const { user, isAuthenticated, logout } = useAuth();

  // Dashboard Active Tab
  const [dashboardTab, setDashboardTab] = useState<ProfileDashboardTab>("profile");

  // Profile Form state
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [email, setEmail] = useState(user?.email || "");
  const [address, setAddress] = useState(user?.address || "");
  const [saving, setSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState("");

  // Change Password state
  const [passChangeMode, setPassChangeMode] = useState<"old_password" | "email_otp">("old_password");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [changingPass, setChangingPass] = useState(false);
  const [passSuccess, setPassSuccess] = useState("");
  const [passError, setPassError] = useState("");

  // OTP Password Reset (dành cho người dùng quên mật khẩu cũ trong hồ sơ)
  const [profileOtp, setProfileOtp] = useState("");
  const [profileOtpSent, setProfileOtpSent] = useState(false);
  const [profileOtpSending, setProfileOtpSending] = useState(false);
  const [profileOtpVerifying, setProfileOtpVerifying] = useState(false);
  const [profileOtpCooldown, setProfileOtpCooldown] = useState(0);

  // Google Account Set Password via OTP state
  const isGoogleUser = user?.authProvider === "google";
  const [showGooglePassForm, setShowGooglePassForm] = useState(false);
  const [googleOtpSent, setGoogleOtpSent] = useState(false);
  const [googleOtp, setGoogleOtp] = useState("");
  const [googleOtpSending, setGoogleOtpSending] = useState(false);
  const [googleOtpVerifying, setGoogleOtpVerifying] = useState(false);

  // Shop Onboarding form state
  const [showShopRegister, setShowShopRegister] = useState(false);
  const [shopName, setShopName] = useState("");
  const [shopPhone, setShopPhone] = useState(user?.phone || "");
  const [shopAddress, setShopAddress] = useState(user?.address || "");
  const [shopDesc, setShopDesc] = useState("");
  const [shopRegistered, setShopRegistered] = useState(user?.shopStatus === "PENDING");

  // Transactions state
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadingTx, setLoadingTx] = useState(false);
  const [txFilter, setTxFilter] = useState<"ALL" | "PAYMENT" | "REFUND">("ALL");
  const [txSearch, setTxSearch] = useState("");
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [copiedTxCode, setCopiedTxCode] = useState<string | null>(null);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedTxCode(code);
    setTimeout(() => setCopiedTxCode(null), 2000);
  };

  const totalSpent = useMemo(() => {
    return transactions
      .filter((t) => t.referenceType === "ORDER_PAYMENT" || (t.type !== "REFUND" && t.transactionType === "IN"))
      .reduce((sum, t) => sum + (t.amount || 0), 0);
  }, [transactions]);

  const totalRefunded = useMemo(() => {
    return transactions
      .filter((t) => t.referenceType === "REFUND" || t.type === "REFUND")
      .reduce((sum, t) => sum + (t.amount || 0), 0);
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      const isRefund = tx.referenceType === "REFUND" || tx.type === "REFUND";
      if (txFilter === "PAYMENT" && isRefund) return false;
      if (txFilter === "REFUND" && !isRefund) return false;

      if (txSearch.trim()) {
        const q = txSearch.toLowerCase().trim();
        const matchCode = tx.transactionCode?.toLowerCase().includes(q) || tx.code?.toLowerCase().includes(q);
        const matchRef = tx.referenceId?.toLowerCase().includes(q) || String(tx.orderId || "").toLowerCase().includes(q);
        const matchDesc = tx.description?.toLowerCase().includes(q);
        if (!matchCode && !matchRef && !matchDesc) return false;
      }
      return true;
    });
  }, [transactions, txFilter, txSearch]);

  // Delete Account Modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  // Tự động mở popup đăng nhập nếu chưa đăng nhập
  useEffect(() => {
    if (!isAuthenticated && onOpenAuth) {
      onOpenAuth();
    }
  }, [isAuthenticated, onOpenAuth]);

  // Bộ đếm ngược thời gian gửi lại OTP đổi mật khẩu trong Profile
  useEffect(() => {
    if (profileOtpCooldown <= 0) return;
    const timer = setInterval(() => {
      setProfileOtpCooldown((c) => Math.max(c - 1, 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [profileOtpCooldown]);

  // Load user transactions on mount
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      loadTransactions();
    }
  }, [isAuthenticated, user?.id]);

  const loadTransactions = async () => {
    setLoadingTx(true);
    try {
      const data = await authService.getUserTransactions();
      setTransactions(data);
    } catch (err) {
      console.warn("Lỗi tải lịch sử giao dịch:", err);
    } finally {
      setLoadingTx(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setProfileError("");
    setProfileSuccess(false);
    try {
      await authService.updateProfile({
        name,
        phone,
        email,
        address,
      });
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 4000);
    } catch (err: any) {
      setProfileError(err?.message || "Không thể lưu hồ sơ. Vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError("");
    setPassSuccess("");

    if (!oldPassword) {
      setPassError("Vui lòng nhập mật khẩu hiện tại.");
      return;
    }
    if (newPassword.length < 6) {
      setPassError("Mật khẩu mới phải có tối thiểu 6 ký tự.");
      return;
    }
    if (newPassword === oldPassword) {
      setPassError("Mật khẩu mới không được trùng với mật khẩu cũ.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPassError("Xác nhận mật khẩu mới không trùng khớp.");
      return;
    }

    setChangingPass(true);
    try {
      const msg = await authService.changePassword(oldPassword, newPassword);
      setPassSuccess(msg || "Đổi mật khẩu thành công!");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setPassSuccess(""), 5000);
    } catch (err: any) {
      setPassError(err?.message || "Đổi mật khẩu không thành công. Vui lòng thử lại.");
    } finally {
      setChangingPass(false);
    }
  };

  const handleSendProfileOtp = async () => {
    if (!user?.email) return;
    if (profileOtpCooldown > 0) return;
    setProfileOtpSending(true);
    setPassError("");
    setPassSuccess("");
    try {
      const msg = await authService.sendPasswordOtp(user.email);
      setProfileOtpSent(true);
      setProfileOtpCooldown(60);
      setPassSuccess(msg || `Mã OTP xác thực đã được gửi về hộp thư ${user.email}. Vui lòng kiểm tra hộp thư.`);
    } catch (err: any) {
      setPassError(err?.message || "Không thể gửi mã OTP. Vui lòng thử lại sau.");
    } finally {
      setProfileOtpSending(false);
    }
  };

  const handleResetProfilePasswordViaOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.email) return;
    setPassError("");
    setPassSuccess("");

    if (!profileOtp.trim() || profileOtp.trim().length < 6) {
      setPassError("Vui lòng nhập đầy đủ mã xác thực OTP 6 số.");
      return;
    }
    if (newPassword.length < 6) {
      setPassError("Mật khẩu mới phải có tối thiểu 6 ký tự.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPassError("Xác nhận mật khẩu mới không trùng khớp.");
      return;
    }

    setProfileOtpVerifying(true);
    try {
      await authService.verifyPasswordOtp(user.email, profileOtp.trim());
      const msg = await authService.resetNewPassword(user.email, newPassword);
      setPassSuccess(msg || "Đặt lại mật khẩu mới thành công! Mật khẩu của bạn đã được cập nhật.");
      setProfileOtp("");
      setNewPassword("");
      setConfirmPassword("");
      setProfileOtpSent(false);
      setPassChangeMode("old_password");
      setTimeout(() => setPassSuccess(""), 6000);
    } catch (err: any) {
      setPassError(err?.message || "Xác thực OTP hoặc đặt mật khẩu mới thất bại. Vui lòng kiểm tra lại mã OTP.");
    } finally {
      setProfileOtpVerifying(false);
    }
  };

  const handleSendGoogleOtp = async () => {
    if (!user?.email) return;
    setGoogleOtpSending(true);
    setPassError("");
    setPassSuccess("");
    try {
      const msg = await authService.sendPasswordOtp(user.email);
      setGoogleOtpSent(true);
      setPassSuccess(msg || "Mã xác thực OTP đã được gửi đến email của bạn.");
    } catch (err: any) {
      setPassError(err?.message || "Không thể gửi mã OTP. Vui lòng thử lại.");
    } finally {
      setGoogleOtpSending(false);
    }
  };

  const handleSetGooglePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.email) return;
    setPassError("");
    setPassSuccess("");

    if (!googleOtp.trim()) {
      setPassError("Vui lòng nhập mã OTP 6 số đã được gửi về email.");
      return;
    }
    if (newPassword.length < 6) {
      setPassError("Mật khẩu mới phải có tối thiểu 6 ký tự.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPassError("Xác nhận mật khẩu mới không trùng khớp.");
      return;
    }

    setGoogleOtpVerifying(true);
    try {
      await authService.verifyPasswordOtp(user.email, googleOtp);
      const msg = await authService.resetNewPassword(user.email, newPassword);
      setPassSuccess(msg || "Thiết lập mật khẩu thành công! Giờ đây bạn có thể sử dụng mật khẩu này để đăng nhập.");
      setGoogleOtp("");
      setNewPassword("");
      setConfirmPassword("");
      setGoogleOtpSent(false);
      setTimeout(() => setPassSuccess(""), 6000);
    } catch (err: any) {
      setPassError(err?.message || "Xác thực OTP hoặc thiết lập mật khẩu thất bại.");
    } finally {
      setGoogleOtpVerifying(false);
    }
  };


  const handleRegisterShop = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopName) return;
    await authService.registerShop({
      shopName,
      phone: shopPhone,
      address: shopAddress,
      description: shopDesc,
    });
    setShopRegistered(true);
    setShowShopRegister(false);
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText.trim().toLowerCase() !== "xoa tai khoan") {
      return;
    }
    if (!window.confirm("Bạn có CHẮC CHẮN muốn hủy / xóa vĩnh viễn tài khoản này? Hành động này không thể hoàn tác.")) {
      return;
    }
    setDeletingAccount(true);
    try {
      await authService.deleteAccount();
      setShowDeleteModal(false);
      await logout();
      onGoHome?.();
    } catch (err: any) {
      console.error(err);
      alert(err?.message || "Không thể thực hiện xóa tài khoản vào lúc này.");
      setShowDeleteModal(false);
    } finally {
      setDeletingAccount(false);
    }
  };

  if (!isAuthenticated || !user) {
    return (
      <div className="max-w-md mx-auto px-6 py-20 text-center animate-in fade-in zoom-in-95 duration-300">
        <Card className="p-8 shadow-lg border-amber-100/80 bg-white">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto mb-4 text-[#c8843a]">
            <Lock size={32} />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">
            Yêu cầu đăng nhập
          </h2>
          <p className="text-xs text-slate-500 mb-6 leading-relaxed">
            Vui lòng đăng nhập hoặc tạo tài khoản BookVerse để xem và quản lý hồ sơ cá nhân của bạn.
          </p>
          <div className="flex flex-col gap-2.5">
            <Btn
              onClick={onOpenAuth}
              color="#c8843a"
              size="md"
              className="w-full font-semibold shadow-sm"
            >
              Đăng nhập ngay
            </Btn>
            <Btn
              onClick={onGoHome}
              variant="outline"
              size="md"
              className="w-full text-slate-600 hover:bg-slate-50"
            >
              Trở về trang toàn bộ sách
            </Btn>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">
            {dashboardTab === "profile" && "Hồ sơ cá nhân & Địa chỉ nhận hàng"}
            {dashboardTab === "transactions" && "Lịch sử thanh toán & Hoàn tiền"}
            {dashboardTab === "security" && "Mật khẩu & Bảo mật tài khoản"}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {dashboardTab === "profile" && "Quản lý thông tin tài khoản, số điện thoại và địa chỉ nhận hàng giao vận GHN"}
            {dashboardTab === "transactions" && "Theo dõi chi tiết các giao dịch thanh toán đơn hàng MoMo/COD và các khoản bồi hoàn khiếu nại"}
            {dashboardTab === "security" && "Thiết lập bảo mật, đổi mật khẩu tài khoản và khôi phục qua mã OTP Email"}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Badge
            label={user?.status === "LOCKED" ? "TÀI KHOẢN ĐÃ KHÓA" : "HOẠT ĐỘNG (ACTIVE)"}
            color={user?.status === "LOCKED" ? "#b91c1c" : "#047857"}
            bg={user?.status === "LOCKED" ? "#fee2e2" : "#d1fae5"}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Dashboard Navigation & Profile Sidebar */}
        <div className="space-y-5">
          {/* User Mini Profile Card */}
          <Card className="p-6 text-center shadow-sm">
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user?.name || "Avatar"}
                className="w-20 h-20 rounded-full object-cover border-2 border-blue-500/20 mx-auto mb-3 shadow-md ring-4 ring-blue-50"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center text-2xl font-bold mx-auto mb-3 shadow-md">
                {user?.name ? user.name[0].toUpperCase() : "U"}
              </div>
            )}
            <h2 className="font-bold text-slate-800 text-base">{user?.name}</h2>
            <p className="text-xs text-slate-400 mt-0.5">{user?.email}</p>

            {user?.authProvider === "google" && (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-[11px] font-semibold border border-blue-200 mt-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                Tài khoản Google liên kết
              </div>
            )}

            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Vai trò hiện tại:</span>
              <span className="font-bold text-blue-600 uppercase tracking-wider bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                {user?.role}
              </span>
            </div>
          </Card>

          {/* Navigation Menu Tabs */}
          <Card className="p-2 shadow-sm space-y-1">
            <button
              type="button"
              onClick={() => setDashboardTab("profile")}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all cursor-pointer ${
                dashboardTab === "profile"
                  ? "bg-blue-600 text-white font-bold shadow-md shadow-blue-500/20"
                  : "text-slate-700 hover:bg-slate-100 font-medium"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  dashboardTab === "profile" ? "bg-white/20 text-white" : "bg-blue-50 text-blue-600"
                }`}>
                  <User size={16} />
                </div>
                <div>
                  <p className="text-xs sm:text-sm leading-tight">Hồ sơ cá nhân</p>
                  <p className={`text-[10px] mt-0.5 ${dashboardTab === "profile" ? "text-blue-100" : "text-slate-400"}`}>
                    Thông tin & địa chỉ nhận
                  </p>
                </div>
              </div>
              <ChevronRight size={14} className={dashboardTab === "profile" ? "text-white" : "text-slate-300"} />
            </button>

            <button
              type="button"
              onClick={() => setDashboardTab("transactions")}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all cursor-pointer ${
                dashboardTab === "transactions"
                  ? "bg-blue-600 text-white font-bold shadow-md shadow-blue-500/20"
                  : "text-slate-700 hover:bg-slate-100 font-medium"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  dashboardTab === "transactions" ? "bg-white/20 text-white" : "bg-emerald-50 text-emerald-600"
                }`}>
                  <Receipt size={16} />
                </div>
                <div>
                  <p className="text-xs sm:text-sm leading-tight">Lịch sử giao dịch</p>
                  <p className={`text-[10px] mt-0.5 ${dashboardTab === "transactions" ? "text-blue-100" : "text-slate-400"}`}>
                    Thanh toán & hoàn tiền
                  </p>
                </div>
              </div>
              <ChevronRight size={14} className={dashboardTab === "transactions" ? "text-white" : "text-slate-300"} />
            </button>

            <button
              type="button"
              onClick={() => setDashboardTab("security")}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all cursor-pointer ${
                dashboardTab === "security"
                  ? "bg-blue-600 text-white font-bold shadow-md shadow-blue-500/20"
                  : "text-slate-700 hover:bg-slate-100 font-medium"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  dashboardTab === "security" ? "bg-white/20 text-white" : "bg-indigo-50 text-indigo-600"
                }`}>
                  <ShieldCheck size={16} />
                </div>
                <div>
                  <p className="text-xs sm:text-sm leading-tight">Mật khẩu & Bảo mật</p>
                  <p className={`text-[10px] mt-0.5 ${dashboardTab === "security" ? "text-blue-100" : "text-slate-400"}`}>
                    Đổi mật khẩu qua OTP
                  </p>
                </div>
              </div>
              <ChevronRight size={14} className={dashboardTab === "security" ? "text-white" : "text-slate-300"} />
            </button>
          </Card>

          {/* Account Overview Card (Chuẩn hóa nghiệp vụ sàn sách, loại bỏ Ví ảo 500k) */}
          <Card className="p-4 shadow-sm bg-gradient-to-br from-slate-900 to-slate-800 text-white border-none">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] text-slate-300 font-medium uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck size={13} className="text-emerald-400" /> Tài khoản BookVerse
              </span>
              <span className="text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                Đã kích hoạt
              </span>
            </div>
            <div className="space-y-1.5 pt-1 text-xs">
              <p className="text-slate-300 text-[11px]">
                <span className="text-slate-400">Tham gia:</span>{" "}
                <span className="font-semibold text-white">
                  {user?.createdAt ? formatOrderDate(user.createdAt) : "Thành viên BookVerse"}
                </span>
              </p>
              <p className="text-slate-400 text-[10px] leading-relaxed">
                Thanh toán trực tiếp qua MoMo Sandbox hoặc tiền mặt COD khi nhận sách.
              </p>
            </div>
            {onGoOrders && (
              <button
                type="button"
                onClick={onGoOrders}
                className="mt-3 w-full py-2 px-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Package size={13} className="text-blue-300" />
                <span>Quản lý Đơn hàng của tôi</span>
                <ArrowRight size={12} />
              </button>
            )}
          </Card>

          {/* Quick Actions */}
          <div className="space-y-2">
            {onGoHome && (
              <button
                type="button"
                onClick={onGoHome}
                className="w-full flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <ArrowLeft size={14} /> Quay lại trang chủ sách
              </button>
            )}
            <button
              type="button"
              onClick={logout}
              className="w-full flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl border border-rose-200 bg-rose-50/50 text-rose-600 hover:bg-rose-100 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <LogOut size={14} /> Đăng xuất tài khoản
            </button>
          </div>
        </div>

        {/* Right Column: Dynamic Dashboard Content */}
        <div className="md:col-span-2 space-y-6">
          {/* Mobile Tab Bar (Hiển thị trên màn hình nhỏ) */}
          <div className="flex md:hidden items-center gap-1.5 p-1 bg-slate-100 rounded-xl overflow-x-auto border border-slate-200">
            <button
              type="button"
              onClick={() => setDashboardTab("profile")}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold whitespace-nowrap transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                dashboardTab === "profile"
                  ? "bg-white text-blue-600 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <User size={14} /> Hồ sơ cá nhân
            </button>
            <button
              type="button"
              onClick={() => setDashboardTab("transactions")}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold whitespace-nowrap transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                dashboardTab === "transactions"
                  ? "bg-white text-emerald-600 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Receipt size={14} /> Giao dịch
            </button>
            <button
              type="button"
              onClick={() => setDashboardTab("security")}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold whitespace-nowrap transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                dashboardTab === "security"
                  ? "bg-white text-indigo-600 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <ShieldCheck size={14} /> Mật khẩu
            </button>
          </div>

          {/* ========================================================================= */}
          {/* PHÂN HỆ 1: HỒ SƠ CÁ NHÂN & ĐỊA CHỈ NHẬN HÀNG                             */}
          {/* ========================================================================= */}
          {dashboardTab === "profile" && (
            <div className="space-y-6 animate-in fade-in-50 duration-200">
              {/* Shop Registration Form Drawer/Card */}
          {showShopRegister && (
            <Card className="p-6 border-emerald-300 animate-in zoom-in-95 shadow-md">
              <h3 className="font-bold text-slate-800 text-base mb-2 flex items-center gap-2">
                <Store size={18} className="text-emerald-600" />
                Đăng ký mở gian hàng sách mới
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Điền thông tin nhà sách để gửi yêu cầu xét duyệt lên Ban Quản Trị sàn BookVerse.
              </p>
              <form onSubmit={handleRegisterShop} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Tên gian hàng / Nhà sách *
                  </label>
                  <input
                    required
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                    placeholder="Ví dụ: Tiệm Sách Tuổi Thơ"
                    className="w-full text-xs sm:text-sm border border-slate-200 rounded-xl px-3.5 py-2.5 bg-slate-50 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Số điện thoại hotline *
                    </label>
                    <input
                      required
                      value={shopPhone}
                      onChange={(e) => setShopPhone(e.target.value)}
                      className="w-full text-xs sm:text-sm border border-slate-200 rounded-xl px-3.5 py-2.5 bg-slate-50 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Địa chỉ kho / Tiệm sách *
                    </label>
                    <input
                      required
                      value={shopAddress}
                      onChange={(e) => setShopAddress(e.target.value)}
                      className="w-full text-xs sm:text-sm border border-slate-200 rounded-xl px-3.5 py-2.5 bg-slate-50 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Giới thiệu ngắn về cửa hàng
                  </label>
                  <textarea
                    rows={2}
                    value={shopDesc}
                    onChange={(e) => setShopDesc(e.target.value)}
                    placeholder="Thể loại sách chuyên sâu, cam kết chính hãng..."
                    className="w-full text-xs sm:text-sm border border-slate-200 rounded-xl px-3.5 py-2.5 bg-slate-50 resize-none focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <Btn type="submit" color="#047857" size="md" className="flex-1">
                    <ShieldCheck size={16} /> Gửi hồ sơ đăng ký mở Shop
                  </Btn>
                  <Btn onClick={() => setShowShopRegister(false)} variant="ghost" size="md">
                    Hủy
                  </Btn>
                </div>
              </form>
            </Card>
          )}

          {/* 1. Profile Information Form */}
          <Card className="p-6 shadow-sm">
            <h3 className="font-bold text-slate-800 text-base mb-1 flex items-center gap-2">
              <User size={18} className="text-blue-600" />
              Thông tin cá nhân & Địa chỉ nhận hàng
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Cập nhật thông tin nhận hàng để tự động tính phí vận chuyển chính xác từ GHN.
            </p>

            {profileSuccess && (
              <div className="p-3 mb-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 font-semibold flex items-center gap-2">
                <CheckCircle size={16} /> Đã lưu thông tin hồ sơ thành công!
              </div>
            )}

            {profileError && (
              <div className="p-3 mb-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-semibold flex items-center gap-2">
                <AlertTriangle size={16} /> {profileError}
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Họ và tên
                </label>
                <div className="relative">
                  <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nguyễn Văn A"
                    className="w-full text-xs sm:text-sm pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Email
                  </label>
                  <div className="relative">
                    <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="user@example.com"
                      className="w-full text-xs sm:text-sm pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Số điện thoại
                  </label>
                  <div className="relative">
                    <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="0912345678"
                      className="w-full text-xs sm:text-sm pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Địa chỉ giao hàng mặc định (Tự động tính cước GHN)
                </label>
                <div className="relative">
                  <MapPin size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Số nhà, Tên đường, Phường/Xã, Quận/Huyện, Tỉnh/TP"
                    className="w-full text-xs sm:text-sm pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="pt-2">
                <Btn type="submit" disabled={saving} size="md" color="#1d4ed8">
                  <Save size={16} /> {saving ? "Đang lưu..." : "Lưu thay đổi hồ sơ"}
                </Btn>
              </div>
            </form>
          </Card>

          {/* Open Shop CTA (Dành cho tài khoản Customer) */}
          {user?.role === "customer" && (
            <Card className="p-5 bg-emerald-50/60 border-emerald-200 shadow-sm">
              <div className="flex items-center gap-2 text-emerald-800 mb-2">
                <Store size={18} />
                <h3 className="font-bold text-xs uppercase tracking-wider">
                  Trở thành Nhà Bán Hàng
                </h3>
              </div>
              <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                {shopRegistered
                  ? "Hồ sơ mở cửa hàng của bạn đang được Ban Quản Trị sàn kiểm tra xét duyệt."
                  : "Mở gian hàng kinh doanh sách trên sàn BookVerse tiếp cận hàng triệu bạn đọc cả nước."}
              </p>
              {shopRegistered ? (
                <Badge
                  label="Hồ sơ Shop chờ duyệt"
                  color="#b45309"
                  bg="#fef3c7"
                  className="w-fit"
                />
              ) : (
                <Btn
                  onClick={() => setShowShopRegister(!showShopRegister)}
                  color="#047857"
                  size="sm"
                  className="w-full sm:w-auto"
                >
                  {showShopRegister ? "Đóng form đăng ký" : "Đăng ký mở Shop ngay"}
                </Btn>
              )}
            </Card>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* PHÂN HỆ 3: MẬT KHẨU & BẢO MẬT TÀI KHOẢN                                   */}
      {/* ========================================================================= */}
      {dashboardTab === "security" && (
        <div className="space-y-6 animate-in fade-in-50 duration-200">
          {/* 2. Change Password Form */}
          <Card className="p-6 shadow-sm">
            <h3 className="font-bold text-slate-800 text-base mb-1 flex items-center gap-2">
              <KeyRound size={18} className="text-indigo-600" />
              {isGoogleUser ? "Mật khẩu & Bảo mật tài khoản" : "Đổi mật khẩu tài khoản"}
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              {isGoogleUser
                ? "Tài khoản liên kết Google có thể thiết lập thêm mật khẩu bảo mật riêng để đăng nhập bằng nhiều phương thức."
                : "Khuyên bạn nên sử dụng mật khẩu mạnh có ít nhất 6 ký tự gồm chữ cái, số và ký tự đặc biệt."}
            </p>

            {passSuccess && (
              <div className="p-3 mb-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 font-semibold flex items-center gap-2">
                <CheckCircle size={16} /> {passSuccess}
              </div>
            )}

            {passError && (
              <div className="p-3 mb-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-semibold flex items-center gap-2">
                <AlertTriangle size={16} /> {passError}
              </div>
            )}

            {isGoogleUser ? (
              <div className="space-y-4">
                {/* Google Notice Banner */}
                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50/60 border border-amber-200 text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-white shadow-xs border border-amber-200 flex items-center justify-center shrink-0 mt-0.5">
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                      </svg>
                    </div>
                    <div className="text-xs sm:text-sm">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-800">Tài khoản bảo mật bằng Google OAuth</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          An toàn
                        </span>
                      </div>
                      <p className="mt-1 text-slate-600 leading-relaxed text-xs">
                        Tài khoản <strong>{user?.email}</strong> của bạn đăng nhập an toàn bằng tài khoản Google. Bạn không bắt buộc phải tạo mật khẩu riêng trừ khi muốn đăng nhập bằng Email & Mật khẩu.
                      </p>
                    </div>
                  </div>
                  {!showGooglePassForm && (
                    <Btn
                      type="button"
                      onClick={() => {
                        setShowGooglePassForm(true);
                        setPassError("");
                        setPassSuccess("");
                      }}
                      color="#4f46e5"
                      size="sm"
                      className="whitespace-nowrap shrink-0 self-start sm:self-center"
                    >
                      <KeyRound size={14} /> Thiết lập thêm mật khẩu riêng
                    </Btn>
                  )}
                </div>

                {/* Form Thiết lập Mật Khẩu qua OTP cho Google User */}
                {showGooglePassForm && (
                  <div className="p-4 rounded-2xl bg-indigo-50/40 border border-indigo-200/80 space-y-4 animate-in fade-in-50 duration-200">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                        <KeyRound size={14} className="text-indigo-600" /> Tạo mật khẩu riêng cho tài khoản
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setShowGooglePassForm(false);
                          setGoogleOtpSent(false);
                          setGoogleOtp("");
                          setPassError("");
                          setPassSuccess("");
                        }}
                        className="text-[11px] text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        Thu gọn
                      </button>
                    </div>

                    {!googleOtpSent ? (
                      <div className="p-3.5 rounded-xl bg-white border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <p className="text-xs font-bold text-slate-700">Gửi mã xác thực về Gmail</p>
                          <p className="text-[11px] text-slate-400">Hệ thống sẽ gửi mã OTP 6 số về hộp thư {user?.email}</p>
                        </div>
                        <Btn onClick={handleSendGoogleOtp} disabled={googleOtpSending} color="#4f46e5" size="sm">
                          <Send size={14} /> {googleOtpSending ? "Đang gửi OTP..." : "Gửi mã OTP qua Email"}
                        </Btn>
                      </div>
                    ) : (
                      <form onSubmit={handleSetGooglePassword} className="space-y-4 pt-1">
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="block text-xs font-semibold text-slate-600">
                              Mã xác thực OTP (6 số) *
                            </label>
                            <button
                              type="button"
                              onClick={handleSendGoogleOtp}
                              disabled={googleOtpSending}
                              className="text-[11px] text-indigo-600 hover:underline font-semibold cursor-pointer"
                            >
                              {googleOtpSending ? "Đang gửi lại..." : "Gửi lại mã OTP"}
                            </button>
                          </div>
                          <div className="relative">
                            <ShieldCheck size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-indigo-500" />
                            <input
                              type="text"
                              required
                              maxLength={6}
                              value={googleOtp}
                              onChange={(e) => setGoogleOtp(e.target.value.replace(/\D/g, ''))}
                              placeholder="Nhập mã 6 số gửi về email"
                              className="w-full text-xs sm:text-sm pl-10 pr-4 py-2.5 border border-indigo-200 rounded-xl bg-white focus:outline-none focus:border-indigo-500 font-mono font-bold tracking-widest text-indigo-900"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">
                              Mật khẩu mới *
                            </label>
                            <div className="relative">
                              <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                              <input
                                type={showNewPass ? "text" : "password"}
                                required
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Tối thiểu 6 ký tự"
                                className="w-full text-xs sm:text-sm pl-10 pr-10 py-2.5 border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-indigo-500"
                              />
                              <button
                                type="button"
                                onClick={() => setShowNewPass(!showNewPass)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                              >
                                {showNewPass ? <EyeOff size={16} /> : <Eye size={16} />}
                              </button>
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">
                              Xác nhận mật khẩu mới *
                            </label>
                            <div className="relative">
                              <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                              <input
                                type={showConfirmPass ? "text" : "password"}
                                required
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Nhập lại mật khẩu mới"
                                className="w-full text-xs sm:text-sm pl-10 pr-10 py-2.5 border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-indigo-500"
                              />
                              <button
                                type="button"
                                onClick={() => setShowConfirmPass(!showConfirmPass)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                              >
                                {showConfirmPass ? <EyeOff size={16} /> : <Eye size={16} />}
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className="pt-2 flex items-center gap-3">
                          <Btn type="submit" disabled={googleOtpVerifying} size="md" color="#4f46e5">
                            <KeyRound size={16} /> {googleOtpVerifying ? "Đang xác thực & lưu..." : "Xác nhận & Thiết lập mật khẩu"}
                          </Btn>
                          <Btn
                            type="button"
                            onClick={() => {
                              setShowGooglePassForm(false);
                              setGoogleOtpSent(false);
                              setGoogleOtp("");
                            }}
                            variant="ghost"
                            size="md"
                          >
                            Hủy
                          </Btn>
                        </div>
                      </form>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {/* Segmented Switch: Chọn phương thức đổi mật khẩu */}
                <div className="flex items-center p-1 rounded-xl bg-slate-100/90 max-w-sm border border-slate-200/80">
                  <button
                    type="button"
                    onClick={() => {
                      setPassChangeMode("old_password");
                      setPassError("");
                      setPassSuccess("");
                    }}
                    className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      passChangeMode === "old_password"
                        ? "bg-white text-indigo-600 shadow-xs border border-slate-200/60"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    <KeyRound size={13} /> Nhớ mật khẩu cũ
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPassChangeMode("email_otp");
                      setPassError("");
                      setPassSuccess("");
                    }}
                    className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      passChangeMode === "email_otp"
                        ? "bg-white text-indigo-600 shadow-xs border border-slate-200/60"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    <Mail size={13} /> Quên mật khẩu? (Dùng OTP)
                  </button>
                </div>

                {passChangeMode === "old_password" ? (
                  <form onSubmit={handleChangePassword} className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-semibold text-slate-600">
                          Mật khẩu hiện tại *
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setPassChangeMode("email_otp");
                            setPassError("");
                            setPassSuccess("");
                          }}
                          className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer hover:underline flex items-center gap-1"
                        >
                          Quên mật khẩu hiện tại?
                        </button>
                      </div>
                      <div className="relative">
                        <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type={showOldPass ? "text" : "password"}
                          required
                          value={oldPassword}
                          onChange={(e) => setOldPassword(e.target.value)}
                          placeholder="Nhập mật khẩu đang sử dụng"
                          className="w-full text-xs sm:text-sm pl-10 pr-10 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:border-indigo-500"
                        />
                        <button
                          type="button"
                          onClick={() => setShowOldPass(!showOldPass)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          {showOldPass ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">
                          Mật khẩu mới *
                        </label>
                        <div className="relative">
                          <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            type={showNewPass ? "text" : "password"}
                            required
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Tối thiểu 6 ký tự"
                            className="w-full text-xs sm:text-sm pl-10 pr-10 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:border-indigo-500"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPass(!showNewPass)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                          >
                            {showNewPass ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">
                          Xác nhận mật khẩu mới *
                        </label>
                        <div className="relative">
                          <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            type={showConfirmPass ? "text" : "password"}
                            required
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Nhập lại mật khẩu mới"
                            className="w-full text-xs sm:text-sm pl-10 pr-10 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:border-indigo-500"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPass(!showConfirmPass)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                          >
                            {showConfirmPass ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>
                    </div>

                    {newPassword && (
                      <div className="space-y-1 pt-0.5">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-500">Độ mạnh mật khẩu:</span>
                          <span className={`font-semibold ${
                            newPassword.length < 6 ? "text-rose-500" :
                            newPassword.length < 9 ? "text-amber-500" : "text-emerald-600"
                          }`}>
                            {newPassword.length < 6 ? "Yếu (tối thiểu 6 ký tự)" :
                             newPassword.length < 9 ? "Trung bình" : "Rất mạnh"}
                          </span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden flex gap-1">
                          <div className={`h-full rounded-full transition-all ${
                            newPassword.length >= 6 ? (newPassword.length < 9 ? "bg-amber-400 w-1/2" : "bg-emerald-500 w-full") : "bg-rose-400 w-1/4"
                          }`} />
                        </div>
                      </div>
                    )}

                    <div className="pt-2">
                      <Btn type="submit" disabled={changingPass} size="md" color="#4f46e5">
                        <KeyRound size={16} /> {changingPass ? "Đang xử lý..." : "Cập nhật mật khẩu mới"}
                      </Btn>
                    </div>
                  </form>
                ) : (
                  /* Form Quên mật khẩu - Đổi qua OTP Email */
                  <div className="space-y-4">
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50 to-blue-50/50 border border-indigo-200/80 text-indigo-950 flex items-start gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-white shadow-xs border border-indigo-200 flex items-center justify-center shrink-0 mt-0.5 text-indigo-600">
                        <ShieldCheck size={20} />
                      </div>
                      <div className="text-xs sm:text-sm">
                        <p className="font-bold text-slate-800">Xác thực danh tính qua mã OTP Email</p>
                        <p className="mt-1 text-slate-600 leading-relaxed text-xs">
                          Mã xác thực OTP gồm 6 chữ số sẽ được gửi về hộp thư đăng ký <strong>{user?.email}</strong>. Sau khi xác thực, bạn có thể thiết lập mật khẩu mới ngay mà không cần nhớ mật khẩu cũ.
                        </p>
                      </div>
                    </div>

                    {!profileOtpSent ? (
                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <p className="text-xs font-bold text-slate-700">Gửi mã xác thực về Gmail</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">Mã OTP có hiệu lực trong vòng 15 phút</p>
                        </div>
                        <Btn
                          onClick={handleSendProfileOtp}
                          disabled={profileOtpSending || profileOtpCooldown > 0}
                          color="#4f46e5"
                          size="sm"
                        >
                          <Send size={14} /> {profileOtpSending ? "Đang gửi OTP..." : profileOtpCooldown > 0 ? `Gửi lại sau (${profileOtpCooldown}s)` : "Gửi mã OTP về Email"}
                        </Btn>
                      </div>
                    ) : (
                      <form onSubmit={handleResetProfilePasswordViaOtp} className="space-y-4 pt-1">
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="block text-xs font-semibold text-slate-600">
                              Mã xác thực OTP (6 số) *
                            </label>
                            <button
                              type="button"
                              onClick={handleSendProfileOtp}
                              disabled={profileOtpSending || profileOtpCooldown > 0}
                              className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer disabled:text-slate-400"
                            >
                              {profileOtpSending ? "Đang gửi..." : profileOtpCooldown > 0 ? `Gửi lại sau (${profileOtpCooldown}s)` : "Gửi lại mã OTP"}
                            </button>
                          </div>
                          <div className="relative">
                            <ShieldCheck size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-indigo-500" />
                            <input
                              type="text"
                              required
                              maxLength={6}
                              value={profileOtp}
                              onChange={(e) => setProfileOtp(e.target.value.replace(/\D/g, ''))}
                              placeholder="Nhập mã 6 số từ email"
                              className="w-full text-xs sm:text-sm pl-10 pr-4 py-2.5 border border-indigo-200 rounded-xl bg-indigo-50/40 focus:outline-none focus:border-indigo-500 font-mono font-bold tracking-widest text-indigo-900"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">
                              Mật khẩu mới *
                            </label>
                            <div className="relative">
                              <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                              <input
                                type={showNewPass ? "text" : "password"}
                                required
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Tối thiểu 6 ký tự"
                                className="w-full text-xs sm:text-sm pl-10 pr-10 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:border-indigo-500"
                              />
                              <button
                                type="button"
                                onClick={() => setShowNewPass(!showNewPass)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                              >
                                {showNewPass ? <EyeOff size={16} /> : <Eye size={16} />}
                              </button>
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">
                              Xác nhận mật khẩu mới *
                            </label>
                            <div className="relative">
                              <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                              <input
                                type={showConfirmPass ? "text" : "password"}
                                required
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Nhập lại mật khẩu mới"
                                className="w-full text-xs sm:text-sm pl-10 pr-10 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:border-indigo-500"
                              />
                              <button
                                type="button"
                                onClick={() => setShowConfirmPass(!showConfirmPass)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                              >
                                {showConfirmPass ? <EyeOff size={16} /> : <Eye size={16} />}
                              </button>
                            </div>
                          </div>
                        </div>

                        {newPassword && (
                          <div className="space-y-1 pt-0.5">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="text-slate-500">Độ mạnh mật khẩu:</span>
                              <span className={`font-semibold ${
                                newPassword.length < 6 ? "text-rose-500" :
                                newPassword.length < 9 ? "text-amber-500" : "text-emerald-600"
                              }`}>
                                {newPassword.length < 6 ? "Yếu (tối thiểu 6 ký tự)" :
                                 newPassword.length < 9 ? "Trung bình" : "Rất mạnh"}
                              </span>
                            </div>
                            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden flex gap-1">
                              <div className={`h-full rounded-full transition-all ${
                                newPassword.length >= 6 ? (newPassword.length < 9 ? "bg-amber-400 w-1/2" : "bg-emerald-500 w-full") : "bg-rose-400 w-1/4"
                              }`} />
                            </div>
                          </div>
                        )}

                        <div className="pt-2 flex items-center gap-3">
                          <Btn type="submit" disabled={profileOtpVerifying} size="md" color="#4f46e5">
                            <KeyRound size={16} /> {profileOtpVerifying ? "Đang xác thực & cập nhật..." : "Xác nhận & Cập nhật mật khẩu"}
                          </Btn>
                          <Btn
                            type="button"
                            onClick={() => {
                              setPassChangeMode("old_password");
                              setProfileOtpSent(false);
                              setProfileOtp("");
                            }}
                            variant="ghost"
                            size="md"
                          >
                            Quay lại
                          </Btn>
                        </div>
                      </form>
                    )}
                  </div>
                )}
              </div>
            )}
          </Card>

          {/* Account Security & Danger Zone */}
          <Card className="p-5 border-rose-100 bg-rose-50/30 shadow-sm space-y-3">
            <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5 text-rose-700">
              <AlertTriangle size={15} /> Khu vực nguy hiểm & An toàn tài khoản
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Vô hiệu hóa tài khoản và thu hồi toàn bộ phiên đăng nhập hiện có trên hệ thống BookVerse. Hành động này không thể hoàn tác.
            </p>
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-rose-200 bg-white text-rose-600 hover:bg-rose-50 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <Trash2 size={14} /> Yêu cầu hủy / xóa tài khoản
              </button>
            </div>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PHÂN HỆ 2: LỊCH SỬ THANH TOÁN & HOÀN TIỀN                                 */}
      {/* ========================================================================= */}
      {dashboardTab === "transactions" && (
        <div className="space-y-6 animate-in fade-in-50 duration-200">
          {/* 3. Transactions History */}
          <Card className="p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
              <div>
                <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                  <Receipt size={18} className="text-emerald-600" />
                  Lịch sử thanh toán & Hoàn tiền
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Theo dõi chi tiết các giao dịch thanh toán đơn hàng MoMo/COD và các khoản bồi hoàn khiếu nại
                </p>
              </div>
              <Btn onClick={loadTransactions} variant="ghost" size="sm" className="text-xs self-start sm:self-auto">
                <RefreshCw size={13} className={loadingTx ? "animate-spin" : ""} /> Làm mới
              </Btn>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                  <ArrowUpRight size={20} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-medium text-slate-500 truncate">Tổng thanh toán đơn</p>
                  <p className="text-sm sm:text-base font-bold text-slate-800 truncate">{fmt(totalSpent)}</p>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <ArrowDownLeft size={20} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-medium text-slate-500 truncate">Tổng tiền hoàn khiếu nại</p>
                  <p className="text-sm sm:text-base font-bold text-emerald-600 truncate">{fmt(totalRefunded)}</p>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                  <Receipt size={20} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-medium text-slate-500 truncate">Tổng số giao dịch</p>
                  <p className="text-sm sm:text-base font-bold text-slate-800 truncate">{transactions.length} giao dịch</p>
                </div>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-4">
              {/* Tabs */}
              <div className="flex items-center gap-1 bg-slate-100/90 p-1 rounded-xl shrink-0">
                <button
                  type="button"
                  onClick={() => setTxFilter("ALL")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    txFilter === "ALL"
                      ? "bg-white text-slate-800 shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Tất cả ({transactions.length})
                </button>
                <button
                  type="button"
                  onClick={() => setTxFilter("PAYMENT")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    txFilter === "PAYMENT"
                      ? "bg-white text-blue-700 shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Thanh toán
                </button>
                <button
                  type="button"
                  onClick={() => setTxFilter("REFUND")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    txFilter === "REFUND"
                      ? "bg-white text-emerald-700 shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Hoàn tiền
                </button>
              </div>

              {/* Search input */}
              <div className="relative flex-1 max-w-sm">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={txSearch}
                  onChange={(e) => setTxSearch(e.target.value)}
                  placeholder="Tìm theo mã GD, mã đơn..."
                  className="w-full text-xs pl-8 pr-7 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                />
                {txSearch && (
                  <button
                    onClick={() => setTxSearch("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
            </div>

            {/* List */}
            {loadingTx ? (
              <div className="py-12 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-2">
                <RefreshCw size={20} className="animate-spin text-blue-600" />
                <span>Đang tải lịch sử giao dịch từ máy chủ...</span>
              </div>
            ) : filteredTransactions.length === 0 ? (
              <div className="py-10 text-center bg-slate-50/70 rounded-2xl border border-dashed border-slate-200">
                <Clock size={32} className="mx-auto text-slate-300 mb-2" />
                <p className="text-xs font-semibold text-slate-600">
                  {txSearch || txFilter !== "ALL"
                    ? "Không tìm thấy giao dịch nào phù hợp bộ lọc"
                    : "Chưa có giao dịch thanh toán hoặc hoàn tiền nào"}
                </p>
                <p className="text-[11px] text-slate-400 mt-1 max-w-sm mx-auto">
                  {txSearch || txFilter !== "ALL"
                    ? "Vui lòng thử tìm kiếm với từ khóa khác hoặc chuyển sang tab Tất cả."
                    : "Khi bạn thanh toán đơn hàng sách hoặc nhận bồi hoàn khiếu nại, các giao dịch thực tế sẽ xuất hiện tại đây."}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-[380px] overflow-y-auto pr-1 space-y-2">
                {filteredTransactions.map((tx) => {
                  const isRefund = tx.referenceType === "REFUND" || tx.type === "REFUND";
                  const code = tx.transactionCode || tx.code || "";
                  return (
                    <div
                      key={tx.id}
                      className="p-3.5 rounded-2xl bg-white border border-slate-100 hover:border-blue-200 hover:shadow-sm transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                    >
                      {/* Left: Icon & Info */}
                      <div className="flex items-start gap-3 min-w-0">
                        <div
                          className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm shrink-0 border ${
                            isRefund
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200/70"
                              : "bg-blue-50 text-blue-700 border-blue-200/70"
                          }`}
                        >
                          {isRefund ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                                isRefund
                                  ? "bg-emerald-100/80 text-emerald-800"
                                  : "bg-blue-100/80 text-blue-800"
                              }`}
                            >
                              {isRefund ? "HOÀN TIỀN KHIẾU NẠI" : "THANH TOÁN ĐƠN HÀNG"}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              {formatOrderDate(tx.createdAt)}
                            </span>
                          </div>

                          <p className="font-semibold text-slate-800 text-xs sm:text-sm mt-1 leading-snug">
                            {tx.description || (isRefund ? "Hoàn tiền giao dịch" : "Thanh toán giao dịch")}
                          </p>

                          {/* Pills for Transaction Code & Reference Order */}
                          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                            {code && (
                              <button
                                type="button"
                                onClick={() => handleCopyCode(code)}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-medium transition-colors cursor-pointer"
                                title="Bấm để sao chép mã giao dịch đối soát"
                              >
                                {copiedTxCode === code ? (
                                  <>
                                    <Check size={10} className="text-emerald-600" />
                                    <span className="text-emerald-700 font-bold">Đã chép</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy size={10} />
                                    <span>Mã GD: {code}</span>
                                  </>
                                )}
                              </button>
                            )}

                            {tx.referenceId && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-medium">
                                Đơn: {formatOrderCode(tx.referenceId)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Amount & Actions */}
                      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100 shrink-0">
                        <span
                          className={`font-black text-sm sm:text-base block ${
                            isRefund ? "text-emerald-600" : "text-slate-800"
                          }`}
                        >
                          {isRefund ? "+" : "-"} {fmt(tx.amount)}
                        </span>
                        
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200/50">
                            THÀNH CÔNG
                          </span>
                          <button
                            type="button"
                            onClick={() => setSelectedTx(tx)}
                            className="text-[11px] text-blue-600 hover:text-blue-800 font-medium underline cursor-pointer"
                          >
                            Biên lai
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      )}
        </div>
      </div>

      {/* Delete Account Confirmation Modal */}
      {showDeleteModal && (
        <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Xác nhận vô hiệu hóa tài khoản">
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-3">
              <AlertTriangle size={20} className="shrink-0 text-rose-600 mt-0.5" />
              <div>
                <p className="font-bold mb-1">Cảnh báo hành động không thể hoàn tác!</p>
                <p className="leading-relaxed text-slate-600">
                  Khi bạn xác nhận hủy tài khoản, mọi phiên đăng nhập sẽ bị thu hồi ngay lập tức, tài khoản của bạn sẽ bị vô hiệu hóa trên toàn bộ hệ thống BookVerse.
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Nhập <span className="font-bold text-rose-600 select-all">xoa tai khoan</span> để xác nhận:
              </label>
              <input
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="xoa tai khoan"
                className="w-full text-xs sm:text-sm border border-slate-300 rounded-xl px-3.5 py-2.5 bg-slate-50 focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="flex gap-2 pt-3">
              <Btn
                onClick={handleDeleteAccount}
                disabled={deleteConfirmText.toLowerCase() !== "xoa tai khoan" || deletingAccount}
                color="#dc2626"
                size="md"
                className="flex-1"
              >
                {deletingAccount ? "Đang xử lý..." : "Xác nhận vô hiệu hóa"}
              </Btn>
              <Btn onClick={() => setShowDeleteModal(false)} variant="ghost" size="md">
                Hủy bỏ
              </Btn>
            </div>
          </div>
        </Modal>
      )}

      {/* Transaction Detail / E-Receipt Modal */}
      {selectedTx && (
        <Modal
          isOpen={!!selectedTx}
          onClose={() => setSelectedTx(null)}
          title="Biên lai giao dịch điện tử"
        >
          <div className="space-y-4">
            <div className="text-center py-4 px-3 bg-gradient-to-b from-slate-50 to-white rounded-2xl border border-slate-200">
              <div
                className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-2 font-bold ${
                  selectedTx.referenceType === "REFUND" || selectedTx.transactionType === "IN" || selectedTx.type === "REFUND"
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-blue-100 text-blue-700"
                }`}
              >
                <Receipt size={24} />
              </div>
              <p className="text-xs text-slate-500 font-medium">Biến động số dư</p>
              <p
                className={`text-2xl font-black mt-0.5 ${
                  selectedTx.referenceType === "REFUND" || selectedTx.transactionType === "IN" || selectedTx.type === "REFUND"
                    ? "text-emerald-600"
                    : "text-slate-900"
                }`}
              >
                {selectedTx.referenceType === "REFUND" || selectedTx.transactionType === "IN" || selectedTx.type === "REFUND" ? "+" : "-"} {fmt(selectedTx.amount)}
              </p>
              <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                Giao dịch thành công
              </span>
            </div>

            <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200 space-y-2.5 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Mã giao dịch hệ thống</span>
                <span className="font-mono text-slate-800 font-medium select-all text-[11px]">
                  {selectedTx.id}
                </span>
              </div>

              {(selectedTx.transactionCode || selectedTx.code) && (
                <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Mã đối soát cổng TT</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-slate-800 select-all">
                      {selectedTx.transactionCode || selectedTx.code}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyCode(selectedTx.transactionCode || selectedTx.code || "")}
                      className="text-slate-400 hover:text-slate-700 cursor-pointer"
                      title="Sao chép"
                    >
                      {copiedTxCode === (selectedTx.transactionCode || selectedTx.code) ? (
                        <Check size={12} className="text-emerald-600" />
                      ) : (
                        <Copy size={12} />
                      )}
                    </button>
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Loại nghiệp vụ</span>
                <span className="font-semibold text-slate-800">
                  {selectedTx.referenceType || (selectedTx.type === "REFUND" ? "REFUND" : "ORDER_PAYMENT")}
                </span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Chiều dòng tiền</span>
                <span
                  className={`font-bold ${
                    selectedTx.transactionType === "IN" || selectedTx.type === "REFUND"
                      ? "text-emerald-600"
                      : "text-blue-700"
                  }`}
                >
                  {selectedTx.transactionType === "IN" || selectedTx.type === "REFUND"
                    ? "Cộng vào tài khoản / Tiền hoàn (+)"
                    : "Trừ tài khoản / Tiền thanh toán (-)"}
                </span>
              </div>

              {(selectedTx.referenceId || selectedTx.orderId) && (
                <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Đơn hàng liên quan</span>
                  <span className="font-mono text-slate-800 font-semibold">
                    {formatOrderCode(selectedTx.referenceId || selectedTx.orderId || "")}
                  </span>
                </div>
              )}

              <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Thời gian ghi nhận</span>
                <span className="text-slate-800 font-medium">
                  {formatOrderDate(selectedTx.createdAt)}
                </span>
              </div>

              <div className="py-1">
                <span className="text-slate-500 block mb-1">Diễn giải</span>
                <p className="text-slate-800 leading-relaxed font-medium bg-white p-2.5 rounded-xl border border-slate-200">
                  {selectedTx.description || "Giao dịch thanh toán mua sách trên sàn BookVerse."}
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <Btn onClick={() => setSelectedTx(null)} color="#1d4ed8" size="md" className="w-full">
                Đóng biên lai
              </Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
