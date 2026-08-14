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
} from "lucide-react";
import { adminService } from "../../services/adminService";
import { orderStatusInfo } from "../../utils/status";
import { fmt } from "../../utils/format";
import { Card } from "../../components/common/Card";
import { StatCard } from "../../components/common/StatCard";
import { Badge } from "../../components/common/Badge";
import { Btn } from "../../components/common/Btn";

export const AdminDashboardPage = () => {
  const [tab, setTab] = useState("overview");
  const [orders, setOrders] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [ordersData, txData, usersData] = await Promise.all([
        adminService.getAllOrders(),
        adminService.getTransactions(),
        adminService.getUsers(),
      ]);
      setOrders(ordersData);
      setTransactions(txData);
      setUsers(usersData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleReturnDecision = async (orderId, status) => {
    await adminService.handleReturnRequest(orderId, status);
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === orderId && o.returnRequest) {
          return {
            ...o,
            orderStatus: status === "APPROVED" ? "RETURNED" : o.orderStatus,
            paymentStatus: status === "APPROVED" ? "REFUNDED" : o.paymentStatus,
            returnRequest: { ...o.returnRequest, status },
          };
        }
        return o;
      })
    );
    // Reload transactions if refund happened
    if (status === "APPROVED") {
      const tx = await adminService.getTransactions();
      setTransactions(tx);
    }
  };

  const totalRevenue = transactions
    .filter((t) => t.type === "ONLINE" || t.type === "COD")
    .reduce((s, t) => s + t.amount, 0);

  const totalRefunds = transactions
    .filter((t) => t.type === "REFUND")
    .reduce((s, t) => s + t.amount, 0);

  const returnOrders = orders.filter((o) => o.returnRequest);

  const navItems = [
    { key: "overview", label: "Tổng quan", icon: <BarChart2 size={16} /> },
    { key: "orders", label: "Đơn hàng", icon: <Package size={16} /> },
    { key: "returns", label: "Hoàn hàng & Đổi trả", icon: <RefreshCw size={16} /> },
    { key: "transactions", label: "Lịch sử giao dịch", icon: <CreditCard size={16} /> },
    { key: "users", label: "Người dùng & Cửa hàng", icon: <Users size={16} /> },
  ];

  return (
    <div className="flex flex-col md:flex-row min-h-[calc(100vh-105px)]">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-56 border-r border-slate-200 bg-white p-4 flex md:flex-col gap-1.5 shrink-0 overflow-x-auto">
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
                    {[
                      "PENDING",
                      "PROCESSING",
                      "SHIPPED",
                      "DELIVERED",
                      "CANCELLED",
                      "RETURNED",
                    ].map((st) => {
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
                          <th className="px-4 py-3.5">Giá trị đơn</th>
                          <th className="px-4 py-3.5">Phương thức</th>
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

            {/* RETURNS TAB */}
            {tab === "returns" && (
              <div>
                <h1 className="text-2xl font-extrabold text-slate-800 mb-6 tracking-tight">
                  Quản lý khiếu nại & Hoàn tiền
                </h1>
                {returnOrders.length === 0 ? (
                  <Card className="p-8 text-center text-slate-400">
                    Hiện không có yêu cầu hoàn trả nào.
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {returnOrders.map((order) => {
                      const rr = order.returnRequest;
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
                              </div>

                              <p className="text-sm font-semibold text-slate-800">
                                Khách hàng: {order.customerName} • Lý do:{" "}
                                <span className="font-mono text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                                  {rr.reasonType}
                                </span>
                              </p>

                              <p className="text-xs sm:text-sm text-slate-600 mt-1 italic">
                                "{rr.reason}"
                              </p>

                              <p className="text-xs text-slate-400 mt-2">
                                Số tiền hoàn:{" "}
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
                                  onClick={() =>
                                    handleReturnDecision(order.id, "APPROVED")
                                  }
                                >
                                  <Check size={14} /> Duyệt hoàn tiền
                                </Btn>
                                <Btn
                                  variant="danger"
                                  size="sm"
                                  onClick={() =>
                                    handleReturnDecision(order.id, "REJECTED")
                                  }
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

            {/* TRANSACTIONS TAB */}
            {tab === "transactions" && (
              <div>
                <h1 className="text-2xl font-extrabold text-slate-800 mb-6 tracking-tight">
                  Lịch sử giao dịch tài chính
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
                        {transactions.map((t) => {
                          const typeColors = {
                            ONLINE: { color: "#1d4ed8", bg: "#dbeafe" },
                            COD: { color: "#047857", bg: "#d1fae5" },
                            SHIPPING_FEE: { color: "#b45309", bg: "#fef3c7" },
                            REFUND: { color: "#b91c1c", bg: "#fee2e2" },
                            SHOP_REVENUE: { color: "#065f46", bg: "#d1fae5" },
                          };
                          const tc = typeColors[t.type] || {
                            color: "#475569",
                            bg: "#f1f5f9",
                          };
                          return (
                            <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                              <td className="px-4 py-3 font-mono text-slate-400 font-medium">
                                #{t.id}
                              </td>
                              <td className="px-4 py-3 font-mono font-bold text-slate-600">
                                #{t.orderId}
                              </td>
                              <td className="px-4 py-3">
                                <Badge label={t.type} color={tc.color} bg={tc.bg} />
                              </td>
                              <td className="px-4 py-3 text-slate-600 font-medium">
                                {t.paidBy}
                              </td>
                              <td className="px-4 py-3 font-bold text-slate-800">
                                {fmt(t.amount)}
                              </td>
                              <td className="px-4 py-3 font-mono text-xs text-slate-400">
                                {t.code || "—"}
                              </td>
                              <td className="px-4 py-3 text-xs text-slate-400 font-mono">
                                {t.createdAt}
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

            {/* USERS TAB */}
            {tab === "users" && (
              <div>
                <h1 className="text-2xl font-extrabold text-slate-800 mb-6 tracking-tight">
                  Quản lý tài khoản người dùng & Nhà bán
                </h1>
                <Card className="overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs sm:text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-semibold">
                          <th className="px-4 py-3.5">Người dùng / Shop</th>
                          <th className="px-4 py-3.5">Vai trò (Role)</th>
                          <th className="px-4 py-3.5">Trạng thái</th>
                          <th className="px-4 py-3.5">Ngày tham gia</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {users.map((u) => {
                          const roleColors = {
                            admin: { color: "#b91c1c", bg: "#fee2e2" },
                            shop: { color: "#047857", bg: "#d1fae5" },
                            customer: { color: "#1d4ed8", bg: "#dbeafe" },
                            deliver: { color: "#6d28d9", bg: "#ede9fe" },
                          };
                          const rc = roleColors[u.role] || {
                            color: "#475569",
                            bg: "#f1f5f9",
                          };
                          return (
                            <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-3">
                                  <div
                                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                                    style={{
                                      backgroundColor: rc.bg,
                                      color: rc.color,
                                    }}
                                  >
                                    {u.name[0]}
                                  </div>
                                  <div>
                                    <p className="font-semibold text-slate-800">
                                      {u.name}
                                    </p>
                                    <p className="text-xs text-slate-400">
                                      {u.email}
                                    </p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <Badge
                                  label={u.role.toUpperCase()}
                                  color={rc.color}
                                  bg={rc.bg}
                                />
                              </td>
                              <td className="px-4 py-3">
                                <Badge
                                  label="ACTIVE"
                                  color="#047857"
                                  bg="#d1fae5"
                                  icon={<CheckCircle size={10} />}
                                />
                              </td>
                              <td className="px-4 py-3 text-xs text-slate-400">
                                {u.createdAt || "01/01/2024"}
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
          </>
        )}
      </main>
    </div>
  );
};
