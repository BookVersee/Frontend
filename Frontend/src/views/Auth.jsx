import React, { useState } from 'react';
import { useApp } from '../context';
import { loginUser, registerUser } from '../store';

const inpStyle =
  'w-full px-3.5 py-2.5 bg-[#f3ede4] border border-[#ddd0be] rounded-lg text-sm text-[#1c1612] placeholder-[#7a6a5a] focus:outline-none focus:border-[#1a3d24] focus:ring-1 focus:ring-[#1a3d24] transition-all';
const lblStyle = 'block text-xs font-bold text-[#5a4a3a] mb-1';

export default function Auth() {
  const { login, navigate, pageParams } = useApp();
  const [mode, setMode] = useState(pageParams?.initialMode || 'login');
  const [role, setRole] = useState(pageParams?.initialRole || 'CUSTOMER');
  const [error, setError] = useState('');
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [regForm, setRegForm] = useState({
    username: '',
    email: '',
    password: '',
    confirm: '',
    full_name: '',
    phone: '',
    address: '',
  });

  const handleLogin = (e) => {
    e.preventDefault();
    setError('');
    const user = loginUser(loginForm.username.trim(), loginForm.password);
    if (!user) {
      setError('Sai tên đăng nhập hoặc mật khẩu, hoặc tài khoản đã bị khóa');
      return;
    }
    login(user);
  };

  const handleRegister = (e) => {
    e.preventDefault();
    setError('');
    if (regForm.password !== regForm.confirm) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }
    if (regForm.password.length < 6) {
      setError('Mật khẩu tối thiểu 6 ký tự');
      return;
    }
    const result = registerUser({
      username: regForm.username.trim(),
      email: regForm.email.trim(),
      password: regForm.password,
      full_name: regForm.full_name,
      phone: regForm.phone,
      address: regForm.address,
      role,
    });
    if ('error' in result) {
      setError(result.error);
      return;
    }
    login(result.user);
  };

  const demoAccounts = [
    { label: 'Khách hàng (Customer)', username: 'khachhang1', password: 'pass123', color: '#1a3d24' },
    { label: 'Shop (Nhà Sách Trí Tuệ)', username: 'cuahang1', password: 'pass123', color: '#c8843a' },
    { label: 'Quản trị viên (Admin)', username: 'admin', password: 'admin123', color: '#7c4a2d' },
  ];

  const handleDemoClick = (username, password) => {
    setLoginForm({ username, password });
    setMode('login');
    const user = loginUser(username, password);
    if (user) login(user);
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4 sm:p-6 bg-[#faf6f1]">
      <div className="w-full max-w-md bg-white rounded-3xl border border-[#ddd0be] shadow-xl overflow-hidden p-6 sm:p-8">
        {/* Header */}
        <div className="text-center mb-6">
          <button
            onClick={() => navigate('home')}
            className="inline-flex items-center gap-2 bg-transparent border-none cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#c8843a] text-white">
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6zM19 1H5C3.9 1 3 1.9 3 3v18c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V3c0-1.1-.9-2-2-2zm0 18H5V3h14v16z"/>
              </svg>
            </div>
            <span className="font-serif font-extrabold text-2xl text-[#1c1612]">
              BookVerse
            </span>
          </button>
          <p className="text-xs text-[#7a6a5a] mt-1 font-serif italic">
            {mode === 'login' ? 'Đăng nhập vào tài khoản BookVerse' : 'Tạo tài khoản mới'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-[#f3ede4] p-1 rounded-xl mb-6">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError('');
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              mode === 'login' ? 'bg-white text-[#1a3d24] shadow-xs' : 'text-[#7a6a5a] hover:text-[#1c1612]'
            }`}
          >
            Đăng nhập
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setError('');
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              mode === 'register' ? 'bg-white text-[#1a3d24] shadow-xs' : 'text-[#7a6a5a] hover:text-[#1c1612]'
            }`}
          >
            Đăng ký
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-xs font-medium rounded-xl p-3 mb-5">
            {error}
          </div>
        )}

        {/* Login Form */}
        {mode === 'login' ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className={lblStyle}>Tên đăng nhập hoặc Email</label>
              <input
                type="text"
                required
                value={loginForm.username}
                onChange={(e) => setLoginForm((f) => ({ ...f, username: e.target.value }))}
                placeholder="khachhang1 hoặc email@..."
                className={inpStyle}
              />
            </div>
            <div>
              <label className={lblStyle}>Mật khẩu</label>
              <input
                type="password"
                required
                value={loginForm.password}
                onChange={(e) => setLoginForm((f) => ({ ...f, password: e.target.value }))}
                placeholder="••••••••"
                className={inpStyle}
              />
            </div>
            <button
              type="submit"
              className="w-full bg-[#1a3d24] hover:bg-[#14301c] text-white py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-sm cursor-pointer mt-2"
            >
              Đăng nhập ngay
            </button>
          </form>
        ) : (
          /* Register Form */
          <form onSubmit={handleRegister} className="space-y-3.5">
            <div>
              <label className={lblStyle}>Vai trò tham gia</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { r: 'CUSTOMER', label: 'Khách hàng mua sách' },
                  { r: 'SHOP', label: 'Cửa hàng bán sách' },
                ].map(({ r, label }) => (
                  <button
                    type="button"
                    key={r}
                    onClick={() => setRole(r)}
                    className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all text-center cursor-pointer ${
                      role === r
                        ? 'border-[#1a3d24] bg-[#1a3d24]/10 text-[#1a3d24]'
                        : 'border-[#ddd0be] bg-[#f3ede4] text-[#7a6a5a]'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className={lblStyle}>Họ và tên / Tên tổ chức</label>
              <input
                type="text"
                required
                value={regForm.full_name}
                onChange={(e) => setRegForm((f) => ({ ...f, full_name: e.target.value }))}
                placeholder="Nguyễn Văn A"
                className={inpStyle}
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className={lblStyle}>Tên đăng nhập</label>
                <input
                  type="text"
                  required
                  value={regForm.username}
                  onChange={(e) => setRegForm((f) => ({ ...f, username: e.target.value }))}
                  placeholder="username"
                  className={inpStyle}
                />
              </div>
              <div>
                <label className={lblStyle}>Email</label>
                <input
                  type="email"
                  required
                  value={regForm.email}
                  onChange={(e) => setRegForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="name@email.com"
                  className={inpStyle}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className={lblStyle}>Mật khẩu</label>
                <input
                  type="password"
                  required
                  value={regForm.password}
                  onChange={(e) => setRegForm((f) => ({ ...f, password: e.target.value }))}
                  placeholder="••••••"
                  className={inpStyle}
                />
              </div>
              <div>
                <label className={lblStyle}>Xác nhận mật khẩu</label>
                <input
                  type="password"
                  required
                  value={regForm.confirm}
                  onChange={(e) => setRegForm((f) => ({ ...f, confirm: e.target.value }))}
                  placeholder="••••••"
                  className={inpStyle}
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-[#1a3d24] hover:bg-[#14301c] text-white py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-sm cursor-pointer mt-2"
            >
              Đăng ký tài khoản
            </button>
          </form>
        )}

        {/* Quick Demo Accounts */}
        <div className="mt-6 pt-5 border-t border-[#ddd0be]">
          <span className="text-[11px] font-bold text-[#7a6a5a] uppercase tracking-widest block mb-2 text-center">
            Đăng nhập nhanh tài khoản Demo
          </span>
          <div className="space-y-2">
            {demoAccounts.map((acc) => (
              <button
                key={acc.username}
                type="button"
                onClick={() => handleDemoClick(acc.username, acc.password)}
                className="w-full flex items-center justify-between p-2.5 rounded-xl border border-[#ddd0be] bg-[#f3ede4] hover:border-[#1a3d24] hover:bg-[#e8ddd0] transition-all text-left cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                    style={{ backgroundColor: acc.color }}
                  >
                    {acc.label[0]}
                  </div>
                  <span className="text-xs font-bold text-[#1c1612]">{acc.label}</span>
                </div>
                <span className="text-[11px] font-mono text-[#7a6a5a]">
                  {acc.username} / {acc.password}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
