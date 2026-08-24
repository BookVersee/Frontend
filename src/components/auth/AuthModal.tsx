import React, { useState } from "react";
import { Modal } from "../common/Modal";
import { Btn } from "../common/Btn";
import { useAuth } from "../../contexts/AuthContext";
import { Role } from "../../types";
import { ROLE_COLORS, ROLE_LABELS } from "../../utils/status";
import { DEMO_USERS } from "../../services/mockData";
import { Check, LogIn, UserPlus } from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { login, register } = useAuth();
  const [tab, setTab] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<Role>("customer");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("Vui lòng nhập email");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      onClose();
    } catch {
      setError("Đăng nhập không thành công");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) {
      setError("Vui lòng điền đầy đủ họ tên và email");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await register(name, email, role, phone);
      onClose();
    } catch {
      setError("Đăng ký không thành công");
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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={tab === "login" ? "Đăng nhập hệ thống" : "Đăng ký tài khoản mới"}
      maxWidth="max-w-md"
    >
      <div className="flex rounded-xl bg-slate-100 p-1 mb-5">
        <button
          type="button"
          onClick={() => {
            setTab("login");
            setError("");
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
            setError("");
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
        <div className="p-3 mb-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-600 font-medium">
          {error}
        </div>
      )}

      {tab === "login" ? (
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Email đăng nhập
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="an.nguyen@email.com"
              className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-500 bg-slate-50"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Mật khẩu
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-500 bg-slate-50"
            />
          </div>
          <Btn type="submit" disabled={loading} className="w-full">
            <LogIn size={15} />
            {loading ? "Đang xử lý..." : "Đăng nhập với JWT"}
          </Btn>

          <div className="pt-4 border-t border-slate-100">
            <p className="text-xs text-slate-400 font-medium mb-2">
              Hoặc chọn nhanh tài khoản Demo:
            </p>
            <div className="grid grid-cols-2 gap-2">
              {DEMO_USERS.slice(0, 4).map((u) => (
                <button
                  type="button"
                  key={u.id}
                  onClick={() => handleSelectDemoUser(u.email)}
                  className="flex items-center gap-2 p-2 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 transition-all text-left"
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
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Họ và tên
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nguyễn Văn A"
              className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-500 bg-slate-50"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-500 bg-slate-50"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Số điện thoại (tùy chọn)
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="0901234567"
              className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-500 bg-slate-50"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Vai trò tài khoản (Role)
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(["customer", "shop", "deliver"] as Role[]).map((r) => (
                <button
                  type="button"
                  key={r}
                  onClick={() => setRole(r)}
                  className={`p-2 text-xs font-medium rounded-xl border-2 transition-all flex items-center justify-center gap-1 ${
                    role === r
                      ? "border-blue-600 bg-blue-50 text-blue-700"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {ROLE_LABELS[r]}
                  {role === r && <Check size={12} />}
                </button>
              ))}
            </div>
          </div>
          <Btn type="submit" disabled={loading} className="w-full mt-2">
            <UserPlus size={15} />
            {loading ? "Đang tạo..." : "Đăng ký tài khoản"}
          </Btn>
        </form>
      )}
    </Modal>
  );
};
