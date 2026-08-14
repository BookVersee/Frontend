import React, { useState, useEffect } from 'react';
import { useApp } from '../../context';
import {
  getUsers,
  getShops,
  getDisputes,
  updateUserStatus,
  updateShopStatus,
  resolveDispute,
  getOrders,
  getUserById,
} from '../../store';

function fmt(n) {
  return (n || 0).toLocaleString('vi-VN') + 'đ';
}

export default function AdminDashboard({ tab }) {
  const { page, refresh, refreshKey } = useApp();
  const activeTab = page.replace('admin-', '') || tab || 'users';

  const [users, setUsers] = useState([]);
  const [shops, setShops] = useState([]);
  const [disputes, setDisputes] = useState([]);
  const [orders, setOrders] = useState([]);
  const [filterRole, setFilterRole] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [resolvingId, setResolvingId] = useState(null);
  const [resNote, setResNote] = useState('');

  useEffect(() => {
    setUsers(getUsers());
    setShops(getShops());
    setDisputes(getDisputes());
    setOrders(getOrders());
  }, [refreshKey, page]);

  const handleLockUser = (userId, status) => {
    updateUserStatus(userId, status);
    refresh();
  };

  const handleShopApproval = (shopId, status) => {
    updateShopStatus(shopId, status);
    refresh();
  };

  const handleResolveSubmit = () => {
    if (!resolvingId || !resNote.trim()) return;
    resolveDispute(resolvingId, resNote);
    setResolvingId(null);
    setResNote('');
    refresh();
  };

  const filteredUsers = users.filter((u) => {
    const matchRole = filterRole === 'ALL' || u.role === filterRole;
    const matchStatus = filterStatus === 'ALL' || u.status === filterStatus;
    return matchRole && matchStatus;
  });

  const pendingShops = shops.filter((s) => s.status === 'PENDING');
  const openDisputes = disputes.filter((d) => d.status === 'OPEN' || d.status === 'PROCESSING');
  const totalRevenue = orders
    .filter((o) => o.order_status === 'DELIVERED')
    .reduce((s, o) => s + o.total_amount, 0);

  return (
    <div className="bg-[#faf6f1] min-h-screen text-[#1c1612]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <span className="text-[11px] font-bold text-[#7a6a5a] uppercase tracking-widest block">
              TRUNG TÂM QUẢN TRỊ BOOKVERSE
            </span>
            <h1 className="font-serif font-extrabold text-3xl text-[#1c1612]">
              Admin Dashboard
            </h1>
          </div>
          <span className="bg-[#1a3d24]/10 text-[#1a3d24] text-xs font-bold px-3.5 py-1.5 rounded-full">
            ● Hệ thống trực tuyến
          </span>
        </div>

        {/* 4 Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Tài khoản người dùng', value: `${users.length}`, color: '#1a3d24' },
            { label: 'Cửa hàng đã duyệt', value: `${shops.filter((s) => s.status === 'APPROVED').length}`, color: '#166534' },
            { label: 'Shop đang chờ duyệt', value: `${pendingShops.length}`, color: '#d97706' },
            { label: 'Tổng giao dịch toàn sàn', value: fmt(totalRevenue), color: '#7c4a2d' },
          ].map((s) => (
            <div
              key={s.label}
              className="bg-white rounded-2xl border border-[#ddd0be] p-5 shadow-xs"
            >
              <span className="text-[11px] font-bold text-[#7a6a5a] uppercase tracking-wider block mb-1">
                {s.label}
              </span>
              <span className="font-serif font-black text-2xl" style={{ color: s.color }}>
                {s.value}
              </span>
            </div>
          ))}
        </div>

        {/* ── TAB: USERS ── */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-3xl border border-[#ddd0be] p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-[#ddd0be]">
              <h2 className="font-serif font-bold text-xl text-[#1c1612]">
                Quản lý người dùng ({filteredUsers.length})
              </h2>

              <div className="flex flex-wrap gap-2">
                <div className="flex gap-1 bg-[#f3ede4] p-1 rounded-xl">
                  {['ALL', 'CUSTOMER', 'SHOP', 'ADMIN'].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setFilterRole(r)}
                      className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                        filterRole === r ? 'bg-white text-[#1a3d24] shadow-xs' : 'text-[#7a6a5a]'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-[#ddd0be] bg-[#f3ede4] text-[#5a4a3a] font-bold uppercase text-[10px]">
                    <th className="p-3">ID</th>
                    <th className="p-3">Họ tên & Username</th>
                    <th className="p-3">Email & SĐT</th>
                    <th className="p-3">Vai trò</th>
                    <th className="p-3">Trạng thái</th>
                    <th className="p-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ddd0be]">
                  {filteredUsers.map((u) => (
                    <tr key={u.user_id} className="hover:bg-[#faf6f1] transition-colors">
                      <td className="p-3 font-mono text-[#7a6a5a]">#{u.user_id}</td>
                      <td className="p-3">
                        <strong className="text-[#1c1612] block">{u.full_name}</strong>
                        <span className="text-[11px] text-[#7a6a5a]">@{u.username}</span>
                      </td>
                      <td className="p-3 text-[#5a4a3a]">
                        <p>{u.email}</p>
                        <span className="text-[11px] text-[#7a6a5a]">{u.phone || '—'}</span>
                      </td>
                      <td className="p-3">
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#1a3d24]/10 text-[#1a3d24]">
                          {u.role}
                        </span>
                      </td>
                      <td className="p-3">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            u.status === 'ACTIVE'
                              ? 'bg-emerald-100 text-emerald-800'
                              : u.status === 'PENDING'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {u.status}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        {u.role !== 'ADMIN' && (
                          u.status === 'ACTIVE' ? (
                            <button
                              type="button"
                              onClick={() => handleLockUser(u.user_id, 'LOCKED')}
                              className="px-3 py-1 rounded bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs cursor-pointer"
                            >
                              Khóa tài khoản
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleLockUser(u.user_id, 'ACTIVE')}
                              className="px-3 py-1 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs cursor-pointer"
                            >
                              Mở khóa
                            </button>
                          )
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── TAB: SHOPS ── */}
        {activeTab === 'shops' && (
          <div className="space-y-6">
            {/* Pending Shops */}
            {pendingShops.length > 0 && (
              <div className="bg-white rounded-3xl border border-amber-300 p-6 shadow-sm">
                <h3 className="font-serif font-bold text-lg text-amber-900 mb-4">
                  Cửa hàng mới đăng ký chờ xét duyệt ({pendingShops.length})
                </h3>

                <div className="space-y-4">
                  {pendingShops.map((s) => {
                    const owner = getUserById(s.user_id);
                    return (
                      <div
                        key={s.shop_id}
                        className="bg-[#fef3c7]/50 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <div>
                          <h4 className="font-serif font-bold text-base text-[#1c1612]">
                            {s.shop_name}
                          </h4>
                          <p className="text-xs text-[#5a4a3a]">
                            📍 Địa chỉ: {s.address} • Chủ: <strong>{owner?.full_name}</strong> ({owner?.phone})
                          </p>
                          <p className="text-xs text-[#7a6a5a] italic mt-1">{s.description}</p>
                        </div>

                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleShopApproval(s.shop_id, 'APPROVED')}
                            className="bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 rounded-xl text-xs font-bold cursor-pointer"
                          >
                            ✓ Duyệt gian hàng
                          </button>
                          <button
                            type="button"
                            onClick={() => handleShopApproval(s.shop_id, 'REJECTED')}
                            className="border border-red-300 text-red-600 hover:bg-red-50 px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer"
                          >
                            ✕ Từ chối
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* All Shops List */}
            <div className="bg-white rounded-3xl border border-[#ddd0be] p-6 shadow-sm">
              <h2 className="font-serif font-bold text-xl text-[#1c1612] mb-6 pb-3 border-b border-[#ddd0be]">
                Danh sách tất cả cửa hàng ({shops.length})
              </h2>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-[#ddd0be] bg-[#f3ede4] text-[#5a4a3a] font-bold uppercase text-[10px]">
                      <th className="p-3">Tên cửa hàng</th>
                      <th className="p-3">Địa điểm</th>
                      <th className="p-3">Dòng sách</th>
                      <th className="p-3">Đánh giá</th>
                      <th className="p-3">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#ddd0be]">
                    {shops.map((s) => (
                      <tr key={s.shop_id} className="hover:bg-[#faf6f1] transition-colors">
                        <td className="p-3 font-serif font-bold text-[#1c1612]">{s.shop_name}</td>
                        <td className="p-3 text-[#5a4a3a]">📍 {s.address}</td>
                        <td className="p-3 text-xs italic text-[#7a6a5a]">{s.category_focus || '—'}</td>
                        <td className="p-3 font-bold text-[#d97706]">★ {s.rating}</td>
                        <td className="p-3">
                          <span
                            className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                              s.status === 'APPROVED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : s.status === 'PENDING'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {s.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB: DISPUTES ── */}
        {activeTab === 'disputes' && (
          <div className="bg-white rounded-3xl border border-[#ddd0be] p-6 shadow-sm">
            <h2 className="font-serif font-bold text-xl text-[#1c1612] mb-6 pb-3 border-b border-[#ddd0be]">
              Xử lý tranh chấp & Khiếu nại ({disputes.length})
            </h2>

            {disputes.length === 0 ? (
              <p className="text-center text-xs text-[#7a6a5a] py-8">Không có tranh chấp nào.</p>
            ) : (
              <div className="space-y-4">
                {disputes.map((d) => {
                  const user = getUserById(d.user_id);
                  return (
                    <div
                      key={d.dispute_id}
                      className="p-5 bg-[#faf6f1] rounded-2xl border border-[#ddd0be] space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs text-[#1c1612]">
                            Khiếu nại #{d.dispute_id} (Đơn #{d.order_id})
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              d.status === 'CLOSED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {d.status}
                          </span>
                        </div>
                        <span className="text-[10px] text-[#7a6a5a]">
                          {new Date(d.created_at).toLocaleDateString('vi-VN')}
                        </span>
                      </div>

                      <p className="text-xs text-[#5a4a3a]">
                        Người gửi: <strong>{user?.full_name}</strong> • Vấn đề: <strong className="text-red-700">{d.issue_type}</strong>
                      </p>

                      <p className="text-xs sm:text-sm text-[#1c1612] italic">
                        "{d.description}"
                      </p>

                      {d.admin_resolution_note && (
                        <div className="p-3 bg-emerald-50 rounded-xl border-l-4 border-emerald-600 text-xs text-emerald-900">
                          <strong>Kết luận phân xử của Admin:</strong> {d.admin_resolution_note}
                        </div>
                      )}

                      {d.status !== 'CLOSED' && (
                        <div className="pt-2">
                          {resolvingId === d.dispute_id ? (
                            <div className="space-y-2">
                              <textarea
                                rows={3}
                                value={resNote}
                                onChange={(e) => setResNote(e.target.value)}
                                placeholder="Nhập kết luận giải quyết và phương án bồi hoàn..."
                                className="w-full p-3 bg-white border border-[#ddd0be] rounded-xl text-xs focus:outline-none focus:border-[#1a3d24]"
                              />
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={handleResolveSubmit}
                                  className="bg-[#1a3d24] hover:bg-[#14301c] text-white px-4 py-2 rounded-xl text-xs font-bold cursor-pointer"
                                >
                                  Xác nhận giải quyết
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setResolvingId(null)}
                                  className="px-3 py-2 text-xs text-[#7a6a5a] cursor-pointer"
                                >
                                  Hủy
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setResolvingId(d.dispute_id);
                                setResNote('');
                              }}
                              className="bg-[#1a3d24] text-white px-4 py-2 rounded-xl text-xs font-bold cursor-pointer"
                            >
                              Giải quyết khiếu nại này
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
