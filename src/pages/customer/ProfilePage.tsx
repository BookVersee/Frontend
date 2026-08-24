import React, { useState } from "react";
import { User, Mail, Phone, MapPin, Save, Store, CreditCard, CheckCircle, ShieldCheck } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { authService } from "../../services/authService";
import { Card } from "../../components/common/Card";
import { Btn } from "../../components/common/Btn";
import { Badge } from "../../components/common/Badge";
import { fmt } from "../../utils/format";
import { INITIAL_TRANSACTIONS } from "../../services/mockData";

export const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [email, setEmail] = useState(user?.email || "");
  const [address, setAddress] = useState(user?.address || "123 Nguyễn Huệ, Quận 1, TP.HCM");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  // Shop Onboarding form state
  const [showShopRegister, setShowShopRegister] = useState(false);
  const [shopName, setShopName] = useState("");
  const [shopPhone, setShopPhone] = useState(user?.phone || "");
  const [shopAddress, setShopAddress] = useState(user?.address || "");
  const [shopDesc, setShopDesc] = useState("");
  const [shopRegistered, setShopRegistered] = useState(user?.shopStatus === "PENDING");

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await authService.updateProfile({
        name,
        phone,
        email,
        address,
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } finally {
      setSaving(false);
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

  const userTransactions = INITIAL_TRANSACTIONS.filter((t) => t.userId === user?.id || t.orderId === 1001);

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">
            Hồ sơ tài khoản
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Quản lý thông tin cá nhân, địa chỉ giao hàng và số dư ví
          </p>
        </div>

        <Badge
          label={user?.status === "LOCKED" ? "TÀI KHOẢN ĐÃ KHÓA" : "HOẠT ĐỘNG (ACTIVE)"}
          color={user?.status === "LOCKED" ? "#b91c1c" : "#047857"}
          bg={user?.status === "LOCKED" ? "#fee2e2" : "#d1fae5"}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Avatar & Wallet */}
        <div className="space-y-4">
          <Card className="p-6 text-center">
            <div className="w-20 h-20 rounded-full bg-blue-600 text-white flex items-center justify-center text-2xl font-bold mx-auto mb-3 shadow-md">
              {user?.name ? user.name[0] : "U"}
            </div>
            <h2 className="font-bold text-slate-800 text-base">{user?.name}</h2>
            <p className="text-xs text-slate-400 mt-0.5">{user?.email}</p>
            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Vai trò hiện tại</span>
              <span className="font-bold text-blue-600 uppercase">{user?.role}</span>
            </div>
          </Card>

          {/* Wallet / Balance */}
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <CreditCard size={16} className="text-blue-600" />
              <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                Ví thanh toán hoàn tiền
              </h3>
            </div>
            <p className="text-2xl font-extrabold text-blue-600">
              {fmt(user?.balance || 500000)}
            </p>
            <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
              Tiền hoàn từ các đơn hàng khiếu nại thành công được tích lũy vào đây.
            </p>
          </Card>

          {/* Open Shop CTA */}
          {user?.role === "customer" && (
            <Card className="p-5 bg-emerald-50/50 border-emerald-200">
              <div className="flex items-center gap-2 text-emerald-800 mb-2">
                <Store size={18} />
                <h3 className="font-bold text-xs uppercase tracking-wider">
                  Trở thành Nhà Bán Hàng
                </h3>
              </div>
              <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                {shopRegistered
                  ? "Hồ sơ mở cửa hàng của bạn đang được Ban Quản Trị sàn kiểm tra xét duyệt."
                  : "Mở gian hàng kinh doanh sách trên sàn BookVerse tiếp cận hàng triệu bạn đọc."}
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
        </div>

        {/* Right Column: Edit Profile & Shop Register Form */}
        <div className="md:col-span-2 space-y-6">
          {showShopRegister && (
            <Card className="p-6 border-emerald-300 animate-in zoom-in-95">
              <h3 className="font-bold text-slate-800 text-base mb-2">
                Đăng ký mở gian hàng sách mới
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Điền thông tin nhà sách để gửi yêu cầu xét duyệt lên Admin sàn BookVerse.
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
                <div className="grid grid-cols-2 gap-3">
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

          {/* Profile Form */}
          <Card className="p-6">
            <h3 className="font-bold text-slate-800 text-base mb-4">
              Thông tin cá nhân & Địa chỉ nhận hàng
            </h3>

            {success && (
              <div className="p-3 mb-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 font-semibold flex items-center gap-2">
                <CheckCircle size={16} /> Đã lưu thông tin hồ sơ thành công!
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
                    className="w-full text-xs sm:text-sm pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="pt-3">
                <Btn type="submit" disabled={saving} size="md" color="#1d4ed8">
                  <Save size={16} /> {saving ? "Đang lưu..." : "Cập nhật hồ sơ"}
                </Btn>
              </div>
            </form>
          </Card>

          {/* Transactions History */}
          <Card className="p-6">
            <h3 className="font-bold text-slate-800 text-base mb-3">
              Lịch sử dòng tiền cá nhân
            </h3>
            {userTransactions.length === 0 ? (
              <p className="text-xs text-slate-400">Chưa có giao dịch nào phát sinh.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {userTransactions.map((tx) => (
                  <div key={tx.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-semibold text-slate-800">
                        {tx.type === "REFUND" ? "Tiền hoàn đơn #" : "Thanh toán đơn #"}
                        {tx.orderId}
                      </span>
                      <p className="text-[10px] text-slate-400">{tx.createdAt}</p>
                    </div>
                    <span
                      className={`font-bold ${
                        tx.type === "REFUND" ? "text-emerald-600" : "text-slate-800"
                      }`}
                    >
                      {tx.type === "REFUND" ? "+" : "-"}
                      {fmt(tx.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};
