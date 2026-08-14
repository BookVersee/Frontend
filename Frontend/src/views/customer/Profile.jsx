import React, { useState } from 'react';
import { useApp } from '../../context';
import { updateProfile, getUserById } from '../../store';

const inp =
  'w-full p-3 bg-[#f3ede4] border border-[#ddd0be] rounded-xl text-xs sm:text-sm text-[#1c1612] focus:outline-none focus:border-[#1a3d24]';
const lbl = 'block text-xs font-bold text-[#5a4a3a] mb-1.5';

export default function Profile() {
  const { currentUser, login } = useApp();
  const [form, setForm] = useState({
    full_name: currentUser?.full_name || '',
    phone: currentUser?.phone || '',
    email: currentUser?.email || '',
    address: currentUser?.address || '',
  });
  const [saved, setSaved] = useState(false);

  if (!currentUser) return null;

  const handleSave = (e) => {
    e.preventDefault();
    updateProfile(currentUser.user_id, form);
    const updated = getUserById(currentUser.user_id);
    if (updated) login(updated);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="bg-[#faf6f1] min-h-screen text-[#1c1612]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <span className="text-[11px] font-bold text-[#7a6a5a] uppercase tracking-widest block">
            THÔNG TIN TÀI KHOẢN
          </span>
          <h1 className="font-serif font-extrabold text-3xl sm:text-4xl text-[#1c1612]">
            Hồ sơ cá nhân
          </h1>
        </div>

        <div className="bg-white rounded-3xl border border-[#ddd0be] p-6 sm:p-10 shadow-sm mb-6">
          <div className="flex items-center gap-5 pb-8 mb-8 border-b border-[#ddd0be]">
            <div className="w-16 h-16 rounded-full bg-[#1a3d24] text-white flex items-center justify-center font-serif font-bold text-2xl shadow-sm">
              {currentUser.full_name?.charAt(0) || 'U'}
            </div>
            <div>
              <h2 className="font-serif font-bold text-xl text-[#1c1612]">
                {currentUser.full_name}
              </h2>
              <p className="text-xs text-[#7a6a5a] mt-0.5">
                Vai trò: <strong className="text-[#1a3d24] uppercase">{currentUser.role}</strong> • @{currentUser.username}
              </p>
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className={lbl}>Họ và tên</label>
                <input
                  type="text"
                  required
                  value={form.full_name}
                  onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
                  className={inp}
                />
              </div>

              <div>
                <label className={lbl}>Số điện thoại</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  className={inp}
                />
              </div>

              <div>
                <label className={lbl}>Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  className={inp}
                />
              </div>

              <div className="sm:col-span-2">
                <label className={lbl}>Địa chỉ giao hàng mặc định</label>
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                  className={inp}
                  placeholder="Số nhà, đường, quận/huyện, tỉnh/thành..."
                />
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                className={`py-3 px-8 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-sm cursor-pointer ${
                  saved ? 'bg-emerald-700 text-white' : 'bg-[#1a3d24] hover:bg-[#14301c] text-white'
                }`}
              >
                {saved ? '✓ Đã lưu thay đổi' : 'Lưu thông tin'}
              </button>
            </div>
          </form>
        </div>

        {/* Account Metadata Card */}
        <div className="bg-[#f3ede4] rounded-2xl border border-[#ddd0be] p-6">
          <h3 className="font-serif font-bold text-sm text-[#1c1612] mb-3">
            Thông tin hệ thống
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-[#7a6a5a] block text-[10px] uppercase">ID Tài khoản</span>
              <strong className="text-[#1c1612]">#{currentUser.user_id}</strong>
            </div>
            <div>
              <span className="text-[#7a6a5a] block text-[10px] uppercase">Trạng thái</span>
              <span className="text-emerald-700 font-bold">{currentUser.status}</span>
            </div>
            <div>
              <span className="text-[#7a6a5a] block text-[10px] uppercase">Tên đăng nhập</span>
              <strong className="text-[#1c1612]">{currentUser.username}</strong>
            </div>
            <div>
              <span className="text-[#7a6a5a] block text-[10px] uppercase">Ngày tham gia</span>
              <span className="text-[#1c1612]">{new Date(currentUser.created_at).toLocaleDateString('vi-VN')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
