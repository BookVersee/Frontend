import React, { useState, useEffect } from "react";
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
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { authService } from "../../services/authService";
import { Card } from "../../components/common/Card";
import { Btn } from "../../components/common/Btn";
import { Badge } from "../../components/common/Badge";
import { Modal } from "../../components/common/Modal";
import { fmt } from "../../utils/format";

export const ProfilePage: React.FC = () => {
  const { user } = useAuth();

  // Profile Form state
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [email, setEmail] = useState(user?.email || "");
  const [address, setAddress] = useState(user?.address || "123 Nguyễn Huệ, Quận 1, TP.HCM");
  const [saving, setSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState("");

  // Change Password state
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [changingPass, setChangingPass] = useState(false);
  const [passSuccess, setPassSuccess] = useState("");
  const [passError, setPassError] = useState("");

  // Shop Onboarding form state
  const [showShopRegister, setShowShopRegister] = useState(false);
  const [shopName, setShopName] = useState("");
  const [shopPhone, setShopPhone] = useState(user?.phone || "");
  const [shopAddress, setShopAddress] = useState(user?.address || "");
  const [shopDesc, setShopDesc] = useState("");
  const [shopRegistered, setShopRegistered] = useState(user?.shopStatus === "PENDING");

  // Transactions state
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loadingTx, setLoadingTx] = useState(false);

  // Delete Account Modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  // Load user transactions on mount
  useEffect(() => {
    loadTransactions();
  }, [user?.id]);

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
    if (deleteConfirmText.toLowerCase() !== "xoa tai khoan") {
      return;
    }
    setDeletingAccount(true);
    try {
      await authService.deleteAccount();
      setShowDeleteModal(false);
      window.location.href = "/";
    } catch (err) {
      console.error(err);
      setShowDeleteModal(false);
    } finally {
      setDeletingAccount(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">
            Hồ sơ tài khoản & Bảo mật
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Quản lý thông tin cá nhân, địa chỉ nhận hàng, đổi mật khẩu và dòng tiền ví
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
        {/* Left Column: Avatar, Wallet & Quick Info */}
        <div className="space-y-5">
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

          {/* Wallet / Balance */}
          <Card className="p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <CreditCard size={16} className="text-blue-600" />
                <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                  Ví thanh toán hoàn tiền
                </h3>
              </div>
              <button
                onClick={loadTransactions}
                title="Làm mới số dư & giao dịch"
                className="text-slate-400 hover:text-blue-600 transition-colors p-1"
              >
                <RefreshCw size={13} className={loadingTx ? "animate-spin text-blue-600" : ""} />
              </button>
            </div>
            <p className="text-2xl font-black text-blue-600 tracking-tight">
              {fmt(user?.balance || 500000)}
            </p>
            <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
              Tiền hoàn từ các đơn hàng khiếu nại thành công hoặc số dư tạm giữ được tích lũy vào đây.
            </p>
          </Card>

          {/* Open Shop CTA */}
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
                />
              ) : (
                <Btn
                  onClick={() => setShowShopRegister(!showShopRegister)}
                  color="#047857"
                  size="sm"
                  className="w-full"
                >
                  {showShopRegister ? "Đóng form" : "Đăng ký mở Shop ngay"}
                </Btn>
              )}
            </Card>
          )}

          {/* Account Management */}
          <Card className="p-5 border-rose-100 bg-rose-50/30 shadow-sm">
            <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-3 flex items-center gap-1.5 text-rose-700">
              <AlertTriangle size={15} /> Quản lý an toàn tài khoản
            </h3>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl border border-rose-200 bg-white text-rose-600 hover:bg-rose-50 text-xs font-semibold shadow-xs transition-colors"
              >
                <Trash2 size={14} /> Yêu cầu hủy / xóa tài khoản
              </button>
            </div>
          </Card>
        </div>

        {/* Right Column: Profile, Change Password, Shop Form & Transactions */}
        <div className="md:col-span-2 space-y-6">
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

          {/* 2. Change Password Form */}
          <Card className="p-6 shadow-sm">
            <h3 className="font-bold text-slate-800 text-base mb-1 flex items-center gap-2">
              <KeyRound size={18} className="text-indigo-600" />
              Đổi mật khẩu tài khoản
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Khuyên bạn nên sử dụng mật khẩu mạnh có ít nhất 6 ký tự gồm chữ cái, số và ký tự đặc biệt.
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

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Mật khẩu hiện tại *
                </label>
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
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
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
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
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
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showConfirmPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <Btn type="submit" disabled={changingPass} size="md" color="#4f46e5">
                  <KeyRound size={16} /> {changingPass ? "Đang xử lý..." : "Cập nhật mật khẩu mới"}
                </Btn>
              </div>
            </form>
          </Card>

          {/* 3. Transactions History */}
          <Card className="p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                  <CreditCard size={18} className="text-emerald-600" />
                  Lịch sử biến động dòng tiền
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Theo dõi chi tiết các khoản thanh toán, hoàn tiền khiếu nại và giao dịch ví
                </p>
              </div>
              <Btn onClick={loadTransactions} variant="ghost" size="sm" className="text-xs">
                <RefreshCw size={13} className={loadingTx ? "animate-spin" : ""} /> Làm mới
              </Btn>
            </div>

            {loadingTx ? (
              <div className="py-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                <RefreshCw size={16} className="animate-spin text-blue-600" /> Đang tải lịch sử giao dịch...
              </div>
            ) : transactions.length === 0 ? (
              <div className="py-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <Clock size={28} className="mx-auto text-slate-300 mb-2" />
                <p className="text-xs font-semibold text-slate-600">Chưa có giao dịch nào phát sinh</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Khi bạn thanh toán hoặc nhận tiền hoàn, các giao dịch sẽ hiển thị tại đây.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto pr-1">
                {transactions.map((tx) => (
                  <div key={tx.id} className="py-3 flex items-center justify-between text-xs hover:bg-slate-50/60 px-2 rounded-lg transition-colors">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                          tx.type === "REFUND"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {tx.type === "REFUND" ? "+" : "-"}
                      </div>
                      <div>
                        <span className="font-semibold text-slate-800 block">
                          {tx.description || (tx.type === "REFUND" ? "Tiền hoàn đơn #" : "Thanh toán đơn #")}
                          {tx.orderId ? ` ${tx.orderId}` : ""}
                        </span>
                        <p className="text-[10px] text-slate-400 mt-0.5">{tx.createdAt}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span
                        className={`font-black text-sm block ${
                          tx.type === "REFUND" ? "text-emerald-600" : "text-slate-800"
                        }`}
                      >
                        {tx.type === "REFUND" ? "+" : "-"}
                        {fmt(tx.amount)}
                      </span>
                      <span className="text-[10px] uppercase font-bold text-emerald-600">
                        {tx.status || "THÀNH CÔNG"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
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
    </div>
  );
};
