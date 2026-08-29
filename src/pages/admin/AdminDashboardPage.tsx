import React, { useState, useEffect } from "react";
import {
  BarChart2,
  Package,
  RefreshCw,
  CreditCard,
  Users,
  TrendingUp,
  Check,
  X,
  CheckCircle,
  Lock,
  Unlock,
  Store,
  Eye,
  ShieldCheck,
  Search,
} from "lucide-react";
import { Order, Transaction, User, ReturnStatus, Shop, DisputeLevel } from "../../types";
import { adminService } from "../../services/adminService";
import { orderStatusInfo } from "../../utils/status";
import { fmt } from "../../utils/format";
import { Card } from "../../components/common/Card";
import { StatCard } from "../../components/common/StatCard";
import { Badge } from "../../components/common/Badge";
import { Btn } from "../../components/common/Btn";
import { Modal } from "../../components/common/Modal";

type AdminPageTab = "overview" | "orders" | "returns" | "shops" | "transactions" | "users";

export const AdminDashboardPage: React.FC = () => {
  const [tab, setTab] = useState<AdminPageTab>("overview");
  const [orders, setOrders] = useState<Order[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [pendingShops, setPendingShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);

  // User detail modal state
  const [selectedUserDetail, setSelectedUserDetail] = useState<{
    user: User;
    orders: Order[];
    transactions: Transaction[];
  } | null>(null);

  // Resolution modal state
  const [resolutionOrderId, setResolutionOrderId] = useState<number | null>(null);
  const [resolutionDecision, setResolutionDecision] = useState<ReturnStatus>("APPROVED");
  const [resolutionNote, setResolutionNote] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const [ordersData, txData, usersData, shopsData] = await Promise.all([
        adminService.getAllOrders(),
        adminService.getTransactions(),
        adminService.getUsers(),
        adminService.getPendingShops(),
      ]);
      setOrders(ordersData);
      setTransactions(txData);
      setUsers(usersData);
      setPendingShops(shopsData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenResolutionModal = (orderId: number, decision: ReturnStatus) => {
    setResolutionOrderId(orderId);
    setResolutionDecision(decision);
    setResolutionNote(
      decision === "APPROVED"
        ? "Admin xác nhận lỗi từ phía đóng gói/sản phẩm của Shop. Đồng ý hoàn 100% tiền đơn hàng cho khách."
        : "Không đủ bằng chứng chứng minh sách bị lỗi. Từ chối yêu cầu hoàn tiền."
    );
  };

  const handleConfirmResolution = async () => {
    if (!resolutionOrderId) return;
    await adminService.handleReturnRequest(
      resolutionOrderId,
      resolutionDecision,
      resolutionNote
    );

    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === resolutionOrderId && o.returnRequest) {
          return {
            ...o,
            orderStatus: resolutionDecision === "APPROVED" ? "RETURNED" : o.orderStatus,
            paymentStatus: resolutionDecision === "APPROVED" ? "REFUNDED" : o.paymentStatus,
            returnRequest: {
              ...o.returnRequest,
              status: resolutionDecision,
              disputeStatus: "CLOSED",
              adminResolutionNote: resolutionNote,
            },
          };
        }
        return o;
      })
    );

    if (resolutionDecision === "APPROVED") {
      const tx = await adminService.getTransactions();
      setTransactions(tx);
    }
    setResolutionOrderId(null);
  };

  const handleToggleUserStatus = async (userId: number) => {
    const updated = await adminService.toggleUserStatus(userId);
    setUsers((prev) => prev.map((u) => (u.id === userId ? updated : u)));
  };

  const handleViewUserDetail = async (userId: number) => {
    const detail = await adminService.getUserDetail(userId);
    setSelectedUserDetail(detail);
  };

  const handleApproveShop = async (shopId: number) => {
    await adminService.approveShop(shopId);
    setPendingShops((prev) => prev.filter((s) => s.id !== shopId));
    loadData();
  };

  const handleRejectShop = async (shopId: number) => {
    await adminService.rejectShop(shopId);
    setPendingShops((prev) => prev.filter((s) => s.id !== shopId));
    loadData();
  };

  const totalRevenue = transactions
    .filter((t) => t.type === "ONLINE" || t.type === "COD")
    .reduce((s, t) => s + t.amount, 0);

  const totalRefunds = transactions
    .filter((t) => t.type === "REFUND")
    .reduce((s, t) => s + t.amount, 0);

  const returnOrders = orders.filter((o) => o.returnRequest);

  const navItems = [
    { key: "overview" as const, label: "Tổng quan", icon: <BarChart2 size={16} /> },
    { key: "orders" as const, label: "Đơn hàng", icon: <Package size={16} /> },
    { key: "returns" as const, label: "Tranh chấp & Hoàn trả", icon: <RefreshCw size={16} /> },
    { key: "shops" as const, label: `Duyệt Shop (${pendingShops.length})`, icon: <Store size={16} /> },
    { key: "transactions" as const, label: "Lịch sử giao dịch", icon: <CreditCard size={16} /> },
    { key: "users" as const, label: "Người dùng", icon: <Users size={16} /> },
  ];

  return (
    <div className="flex flex-col md:flex-row min-h-[calc(100vh-105px)]">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-60 border-r border-slate-200 bg-white p-4 flex md:flex-col gap-1.5 shrink-0 overflow-x-auto">
        <div className="hidden md:block px-3 py-2 text-[11px] font-bold uppercase text-slate-400 tracking-wider">
          Quản trị hệ thống
        </div>
        {navItems.map((n) => (
          <button
            key={n.key}
            onClick={() => setTab(n.key)}
            className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-left transition-all whitespace-nowrap cursor-pointer"
            style={
              tab === n.key
                ? {
                    backgroundColor: "#fee2e2",
                    color: "#b91c1c",
                  }
                : { color: "#475569" }
            }
          >
            {n.icon}
            {n.label}
          </button>
        ))}
      </aside>

      {/* Main Admin Content */}
      <main className="flex-1 overflow-auto p-6 md:p-8 bg-slate-100/60">
        {loading ? (
          <div className="text-center py-20 text-slate-400">
            Đang tải dữ liệu quản trị...
          </div>
        ) : (
          <>
            {/* OVERVIEW TAB */}
            {tab === "overview" && (
              <div>
                <h1 className="text-2xl font-extrabold text-slate-800 mb-6 tracking-tight">
                  Tổng quan hệ thống BookVerse
                </h1>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <StatCard
                    label="Tổng doanh thu nền tảng"
                    value={fmt(totalRevenue)}
                    icon={<TrendingUp size={22} />}
                    color="#1d4ed8"
                    sub="Bao gồm COD & Online"
                  />
                  <StatCard
                    label="Tổng tiền đã hoàn trả"
                    value={fmt(totalRefunds)}
                    icon={<RefreshCw size={22} />}
                    color="#b91c1c"
                    sub="Duyệt qua khiếu nại"
                  />
                  <StatCard
                    label="Tổng đơn toàn sàn"
                    value={String(orders.length)}
                    icon={<Package size={22} />}
                    color="#047857"
                    sub="Tất cả các shop"
                  />
                  <StatCard
                    label="Tài khoản kích hoạt"
                    value={String(users.length)}
                    icon={<Users size={22} />}
                    color="#6d28d9"
                    sub="Khách, shop, shipper"
                  />
                </div>

                <Card className="p-6">
                  <h2 className="font-bold text-slate-800 mb-4 text-sm">
                    Phân bổ trạng thái đơn hàng toàn sàn
                  </h2>
                  <div className="space-y-3">
                    {(
                      [
                        "PENDING",
                        "PROCESSING",
                        "SHIPPED",
                        "DELIVERED",
                        "CANCELLED",
                        "RETURNED",
                      ] as const
                    ).map((st) => {
                      const count = orders.filter((o) => o.orderStatus === st).length;
                      const si = orderStatusInfo(st);
                      const percent = orders.length > 0 ? (count / orders.length) * 100 : 0;
                      return (
                        <div key={st} className="flex items-center gap-3">
                          <div className="w-28 shrink-0">
                            <Badge label={si.label} color={si.color} bg={si.bg} />
                          </div>
                          <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${percent}%`,
                                backgroundColor: si.color,
                              }}
                            />
                          </div>
                          <span className="text-xs font-bold text-slate-700 w-8 text-right">
                            {count}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              </div>
            )}

            {/* ORDERS TAB */}
            {tab === "orders" && (
              <div>
                <h1 className="text-2xl font-extrabold text-slate-800 mb-6 tracking-tight">
                  Tất cả đơn hàng sàn BookVerse
                </h1>
                <Card className="overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs sm:text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-semibold">
                          <th className="px-4 py-3.5">Mã đơn</th>
                          <th className="px-4 py-3.5">Khách hàng</th>
                          <th className="px-4 py-3.5">Cửa hàng</th>
                          <th className="px-4 py-3.5">Giá trị</th>
                          <th className="px-4 py-3.5">Thanh toán</th>
                          <th className="px-4 py-3.5">Trạng thái</th>
                          <th className="px-4 py-3.5">Ngày tạo</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {orders.map((o) => {
                          const si = orderStatusInfo(o.orderStatus);
                          return (
                            <tr key={o.id} className="hover:bg-slate-50 transition-colors">
                              <td className="px-4 py-3 font-mono font-bold text-slate-500">
                                #{o.id}
                              </td>
                              <td className="px-4 py-3">
                                <p className="font-semibold text-slate-800">
                                  {o.customerName}
                                </p>
                                <p className="text-[11px] text-slate-400">
                                  {o.customerPhone}
                                </p>
                              </td>
                              <td className="px-4 py-3 text-xs font-medium text-slate-700">
                                {o.shopName || `Shop #${o.shopId}`}
                              </td>
                              <td className="px-4 py-3 font-bold text-slate-800">
                                {fmt(o.totalAmount + o.shippingFee)}
                              </td>
                              <td className="px-4 py-3">
                                <Badge
                                  label={o.paymentMethod}
                                  color={
                                    o.paymentMethod === "ONLINE"
                                      ? "#1d4ed8"
                                      : "#047857"
                                  }
                                  bg={
                                    o.paymentMethod === "ONLINE"
                                      ? "#dbeafe"
                                      : "#d1fae5"
                                  }
                                />
                              </td>
                              <td className="px-4 py-3">
                                <Badge label={si.label} color={si.color} bg={si.bg} />
                              </td>
                              <td className="px-4 py-3 text-xs text-slate-400 font-mono">
                                {o.createdAt}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </div>
            )}

            {/* RETURNS & DISPUTES TAB */}
            {tab === "returns" && (
              <div>
                <h1 className="text-2xl font-extrabold text-slate-800 mb-6 tracking-tight">
                  Quản lý khiếu nại, tranh chấp & Hoàn tiền
                </h1>
                {returnOrders.length === 0 ? (
                  <Card className="p-8 text-center text-slate-400">
                    Hiện không có yêu cầu hoàn trả nào.
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {returnOrders.map((order) => {
                      const rr = order.returnRequest!;
                      return (
                        <Card key={order.id} className="p-5">
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="font-mono text-xs font-bold text-slate-500">
                                  Đơn #{order.id}
                                </span>
                                <Badge
                                  label={
                                    rr.status === "APPROVED"
                                      ? "Đã duyệt hoàn tiền"
                                      : rr.status === "REJECTED"
                                      ? "Đã từ chối"
                                      : "Chờ xét duyệt"
                                  }
                                  color={
                                    rr.status === "APPROVED"
                                      ? "#047857"
                                      : rr.status === "REJECTED"
                                      ? "#b91c1c"
                                      : "#b45309"
                                  }
                                  bg={
                                    rr.status === "APPROVED"
                                      ? "#d1fae5"
                                      : rr.status === "REJECTED"
                                      ? "#fee2e2"
                                      : "#fef3c7"
                                  }
                                />
                                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-bold">
                                  Level: {rr.disputeStatus || "OPEN"}
                                </span>
                              </div>

                              <p className="text-sm font-semibold text-slate-800">
                                Khách: {order.customerName} • Shop: {order.shopName || `Shop #${order.shopId}`} • Lý do:{" "}
                                <span className="font-mono text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                                  {rr.reasonType}
                                </span>
                              </p>

                              <p className="text-xs sm:text-sm text-slate-600 mt-1 italic">
                                "{rr.reason}"
                              </p>

                              {rr.evidenceImage && (
                                <p className="text-xs text-blue-600 mt-1">
                                  🔗 Bằng chứng đính kèm:{" "}
                                  <a href={rr.evidenceImage} target="_blank" rel="noreferrer" className="underline">
                                    Xem ảnh chụp lỗi sách
                                  </a>
                                </p>
                              )}

                              {rr.adminResolutionNote && (
                                <div className="mt-2.5 p-2.5 bg-blue-50 rounded-xl text-xs text-blue-900 border border-blue-200">
                                  <strong>Kết luận của Admin:</strong> {rr.adminResolutionNote}
                                </div>
                              )}

                              <p className="text-xs text-slate-400 mt-2">
                                Số tiền yêu cầu hoàn:{" "}
                                <span className="font-bold text-slate-800 text-sm">
                                  {fmt(rr.refundAmount)}
                                </span>{" "}
                                • Thời gian tạo: {rr.createdAt}
                              </p>
                            </div>

                            {rr.status === "PENDING" && (
                              <div className="flex gap-2 shrink-0">
                                <Btn
                                  size="sm"
                                  color="#047857"
                                  onClick={() => handleOpenResolutionModal(order.id, "APPROVED")}
                                >
                                  <Check size={14} /> Duyệt hoàn tiền
                                </Btn>
                                <Btn
                                  variant="danger"
                                  size="sm"
                                  onClick={() => handleOpenResolutionModal(order.id, "REJECTED")}
                                >
                                  <X size={14} /> Từ chối
                                </Btn>
                              </div>
                            )}
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* PENDING SHOPS TAB */}
            {tab === "shops" && (
              <div>
                <h1 className="text-2xl font-extrabold text-slate-800 mb-6 tracking-tight">
                  Duyệt hồ sơ mở cửa hàng sách mới
                </h1>
                {pendingShops.length === 0 ? (
                  <Card className="p-8 text-center text-slate-400">
                    Hiện không có hồ sơ mở gian hàng nào đang chờ duyệt.
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {pendingShops.map((shop) => (
                      <Card key={shop.id} className="p-5 flex items-center justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-sm text-slate-800">{shop.name}</span>
                            <Badge label="Chờ duyệt (PENDING)" color="#b45309" bg="#fef3c7" />
                          </div>
                          <p className="text-xs text-slate-500">
                            Hotline: {shop.phone} • Email: {shop.email}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Địa chỉ: {shop.address}
                          </p>
                          {shop.description && (
                            <p className="text-xs text-slate-600 italic mt-1">"{shop.description}"</p>
                          )}
                        </div>

                        <div className="flex gap-2 shrink-0">
                          <Btn size="sm" color="#047857" onClick={() => handleApproveShop(shop.id)}>
                            <Check size={14} /> Phê duyệt mở Shop
                          </Btn>
                          <Btn variant="danger" size="sm" onClick={() => handleRejectShop(shop.id)}>
                            <X size={14} /> Từ chối
                          </Btn>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TRANSACTIONS TAB */}
            {tab === "transactions" && (
              <div>
                <h1 className="text-2xl font-extrabold text-slate-800 mb-6 tracking-tight">
                  Lịch sử giao dịch tài chính & Đối soát
                </h1>
                <Card className="overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs sm:text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-semibold">
                          <th className="px-4 py-3.5">Mã GD</th>
                          <th className="px-4 py-3.5">Mã đơn</th>
                          <th className="px-4 py-3.5">Loại giao dịch</th>
                          <th className="px-4 py-3.5">Bên thanh toán</th>
                          <th className="px-4 py-3.5">Số tiền</th>
                          <th className="px-4 py-3.5">Mã đối soát</th>
                          <th className="px-4 py-3.5">Thời gian</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {transactions.map((t) => (
                          <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-4 py-3 font-mono text-slate-400 font-medium">
                              #{t.id}
                            </td>
                            <td className="px-4 py-3 font-mono font-bold text-slate-600">
                              #{t.orderId}
                            </td>
                            <td className="px-4 py-3">
                              <Badge
                                label={t.type}
                                color={t.type === "REFUND" ? "#b91c1c" : "#1d4ed8"}
                                bg={t.type === "REFUND" ? "#fee2e2" : "#dbeafe"}
                              />
                            </td>
                            <td className="px-4 py-3 text-slate-600 font-medium">{t.paidBy}</td>
                            <td className="px-4 py-3 font-bold text-slate-800">{fmt(t.amount)}</td>
                            <td className="px-4 py-3 font-mono text-xs text-slate-400">
                              {t.code || "—"}
                            </td>
                            <td className="px-4 py-3 text-xs text-slate-400 font-mono">
                              {t.createdAt}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </div>
            )}

            {/* USERS TAB */}
            {tab === "users" && (
              <div>
                <h1 className="text-2xl font-extrabold text-slate-800 mb-6 tracking-tight">
                  Quản lý tài khoản người dùng & Khóa tài khoản
                </h1>
                <Card className="overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs sm:text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-semibold">
                          <th className="px-4 py-3.5">Người dùng / Email</th>
                          <th className="px-4 py-3.5">Vai trò</th>
                          <th className="px-4 py-3.5">Trạng thái (Status)</th>
                          <th className="px-4 py-3.5">Ngày tham gia</th>
                          <th className="px-4 py-3.5 text-right">Hành động</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {users.map((u) => (
                          <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-4 py-3">
                              <p className="font-semibold text-slate-800">{u.name}</p>
                              <p className="text-xs text-slate-400">{u.email}</p>
                            </td>
                            <td className="px-4 py-3">
                              <Badge
                                label={u.role.toUpperCase()}
                                color="#1d4ed8"
                                bg="#dbeafe"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <Badge
                                label={u.status === "LOCKED" ? "LOCKED" : "ACTIVE"}
                                color={u.status === "LOCKED" ? "#b91c1c" : "#047857"}
                                bg={u.status === "LOCKED" ? "#fee2e2" : "#d1fae5"}
                              />
                            </td>
                            <td className="px-4 py-3 text-xs text-slate-400 font-mono">
                              {u.createdAt || "01/01/2024"}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => handleViewUserDetail(u.id)}
                                  className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg transition-colors cursor-pointer"
                                  title="Xem chi tiết hồ sơ & lịch sử dòng tiền"
                                >
                                  <Eye size={15} />
                                </button>
                                <button
                                  onClick={() => handleToggleUserStatus(u.id)}
                                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                    u.status === "LOCKED"
                                      ? "text-emerald-600 hover:bg-emerald-50"
                                      : "text-red-500 hover:bg-red-50"
                                  }`}
                                  title={u.status === "LOCKED" ? "Mở khóa tài khoản" : "Khóa tài khoản (Chặn JWT)"}
                                >
                                  {u.status === "LOCKED" ? <Unlock size={15} /> : <Lock size={15} />}
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </div>
            )}
          </>
        )}
      </main>

      {/* Dispute Resolution Note Modal */}
      {resolutionOrderId && (
        <Modal
          isOpen={true}
          onClose={() => setResolutionOrderId(null)}
          title={`Phân xử khiếu nại đơn hàng #${resolutionOrderId}`}
          maxWidth="max-w-md"
        >
          <div className="space-y-4">
            <p className="text-xs text-slate-500">
              Quyết định:{" "}
              <strong className={resolutionDecision === "APPROVED" ? "text-emerald-600" : "text-red-600"}>
                {resolutionDecision === "APPROVED" ? "Duyệt hoàn tiền 100%" : "Từ chối khiếu nại"}
              </strong>
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Lý do & Kết luận phân xử (Bắt buộc - gửi cho cả Khách và Shop) *
              </label>
              <textarea
                rows={3}
                value={resolutionNote}
                onChange={(e) => setResolutionNote(e.target.value)}
                className="w-full text-xs sm:text-sm border border-slate-200 rounded-xl p-3 bg-slate-50 focus:outline-none focus:border-blue-500 resize-none"
              />
            </div>

            <div className="flex gap-2">
              <Btn
                onClick={handleConfirmResolution}
                color={resolutionDecision === "APPROVED" ? "#047857" : "#dc2626"}
                size="md"
                className="flex-1"
              >
                <ShieldCheck size={16} /> Xác nhận phân xử
              </Btn>
              <Btn onClick={() => setResolutionOrderId(null)} variant="ghost" size="md">
                Hủy
              </Btn>
            </div>
          </div>
        </Modal>
      )}

      {/* User Detail Modal */}
      {selectedUserDetail && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedUserDetail(null)}
          title={`Hồ sơ chi tiết: ${selectedUserDetail.user.name}`}
          maxWidth="max-w-xl"
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl space-y-1">
              <p><strong>Email:</strong> {selectedUserDetail.user.email}</p>
              <p><strong>Số điện thoại:</strong> {selectedUserDetail.user.phone || "Chưa cập nhật"}</p>
              <p><strong>Địa chỉ:</strong> {selectedUserDetail.user.address || "Chưa cập nhật"}</p>
              <p><strong>Vai trò:</strong> {selectedUserDetail.user.role.toUpperCase()}</p>
              <p><strong>Trạng thái:</strong> {selectedUserDetail.user.status || "ACTIVE"}</p>
            </div>

            <div>
              <h4 className="font-bold text-slate-800 mb-2">Lịch sử đơn hàng ({selectedUserDetail.orders.length})</h4>
              <div className="max-h-36 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl p-2">
                {selectedUserDetail.orders.map((o) => (
                  <div key={o.id} className="py-1 flex justify-between">
                    <span>Đơn #{o.id} • {o.createdAt}</span>
                    <span className="font-bold text-blue-600">{fmt(o.totalAmount)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-bold text-slate-800 mb-2">Lịch sử dòng tiền Transaction History ({selectedUserDetail.transactions.length})</h4>
              <div className="max-h-36 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl p-2">
                {selectedUserDetail.transactions.map((t) => (
                  <div key={t.id} className="py-1 flex justify-between">
                    <span>{t.type} • Đơn #{t.orderId}</span>
                    <span className="font-bold text-slate-800">{fmt(t.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
