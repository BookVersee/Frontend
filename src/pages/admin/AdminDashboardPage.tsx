import React, { useState, useEffect, useMemo } from "react";
import {
  BarChart2,
  Package,
  RefreshCw,
  CreditCard,
  Users,
  TrendingUp,
  Check,
  X,
  Lock,
  Unlock,
  Store,
  Eye,
  ShieldCheck,
  Search,
  BookOpen,
  MessageSquare,
  AlertTriangle,
  Mail,
  Filter,
  DollarSign,
  Clock,
  Send,
  Plus,
  Edit2,
  Trash2,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  ArrowUpDown,
  FileText,
  BadgeAlert,
  Calendar,
  Layers,
  PieChart,
  UserPlus,
  Truck,
} from "lucide-react";
import { Order, Transaction, User, ReturnStatus, Shop, Category } from "../../types";
import {
  adminService,
  EscrowHoldingItem,
  ReportedItem,
} from "../../services/adminService";
import { orderStatusInfo } from "../../utils/status";
import { fmt } from "../../utils/format";
import { Card } from "../../components/common/Card";
import { StatCard } from "../../components/common/StatCard";
import { Badge } from "../../components/common/Badge";
import { Btn } from "../../components/common/Btn";
import { Modal } from "../../components/common/Modal";
import { ChatDrawer } from "../../components/chat/ChatDrawer";

type AdminPageTab =
  | "overview"
  | "orders"
  | "books"
  | "disputes"
  | "shops"
  | "escrow"
  | "users";

const PAGE_SIZE_DEFAULT = 8;

// Mock Yearly Financial Monthly Data (Năm 2026)
interface MonthlyFinanceData {
  month: string;
  monthNum: number;
  shortMonth: string;
  quarter: "Q1" | "Q2" | "Q3" | "Q4";
  gross: number; // Tổng tiền thu được
  shopPayout: number; // Tiền shop lấy được
  refunds: number; // Tiền giải quyết mâu thuẫn hoàn khách
  delivery: number; // Tiền phí delivery
  profit: number; // Hoa hồng / Lợi nhuận sàn
}

const YEARLY_FINANCIAL_DATA: MonthlyFinanceData[] = [
  { month: "Tháng 01/2026", monthNum: 1, shortMonth: "T1", quarter: "Q1", gross: 135000000, shopPayout: 105000000, refunds: 3500000, delivery: 13000000, profit: 13500000 },
  { month: "Tháng 02/2026", monthNum: 2, shortMonth: "T2", quarter: "Q1", gross: 152000000, shopPayout: 118000000, refunds: 4200000, delivery: 14500000, profit: 15300000 },
  { month: "Tháng 03/2026", monthNum: 3, shortMonth: "T3", quarter: "Q1", gross: 178000000, shopPayout: 138000000, refunds: 5100000, delivery: 17000000, profit: 17900000 },
  { month: "Tháng 04/2026", monthNum: 4, shortMonth: "T4", quarter: "Q2", gross: 195000000, shopPayout: 152000000, refunds: 6300000, delivery: 18500000, profit: 18200000 },
  { month: "Tháng 05/2026", monthNum: 5, shortMonth: "T5", quarter: "Q2", gross: 220000000, shopPayout: 171000000, refunds: 4800000, delivery: 21000000, profit: 23200000 },
  { month: "Tháng 06/2026", monthNum: 6, shortMonth: "T6", quarter: "Q2", gross: 255000000, shopPayout: 198000000, refunds: 7200000, delivery: 24500000, profit: 25300000 },
  { month: "Tháng 07/2026", monthNum: 7, shortMonth: "T7", quarter: "Q3", gross: 280000000, shopPayout: 218000000, refunds: 8000000, delivery: 26500000, profit: 27500000 },
  { month: "Tháng 08/2026", monthNum: 8, shortMonth: "T8", quarter: "Q3", gross: 320000000, shopPayout: 249000000, refunds: 6500000, delivery: 30500000, profit: 34000000 },
  { month: "Tháng 09/2026", monthNum: 9, shortMonth: "T9", quarter: "Q3", gross: 305000000, shopPayout: 238000000, refunds: 5900000, delivery: 29000000, profit: 32100000 },
  { month: "Tháng 10/2026", monthNum: 10, shortMonth: "T10", quarter: "Q4", gross: 345000000, shopPayout: 270000000, refunds: 7800000, delivery: 33000000, profit: 34200000 },
  { month: "Tháng 11/2026", monthNum: 11, shortMonth: "T11", quarter: "Q4", gross: 390000000, shopPayout: 305000000, refunds: 9200000, delivery: 37000000, profit: 38800000 },
  { month: "Tháng 12/2026", monthNum: 12, shortMonth: "T12", quarter: "Q4", gross: 430000000, shopPayout: 336000000, refunds: 8500000, delivery: 41000000, profit: 44500000 },
];

// Mock Monthly User Registration & Active Data
interface MonthlyUserData {
  month: string;
  monthNum: number;
  shortMonth: string;
  customers: number;
  shops: number;
  shippers: number;
  totalNew: number;
  active: number;
  locked: number;
}

const YEARLY_USER_DATA: MonthlyUserData[] = [
  { month: "Tháng 01", monthNum: 1, shortMonth: "T1", customers: 120, shops: 8, shippers: 4, totalNew: 132, active: 450, locked: 2 },
  { month: "Tháng 02", monthNum: 2, shortMonth: "T2", customers: 155, shops: 12, shippers: 6, totalNew: 173, active: 580, locked: 3 },
  { month: "Tháng 03", monthNum: 3, shortMonth: "T3", customers: 190, shops: 15, shippers: 8, totalNew: 213, active: 730, locked: 4 },
  { month: "Tháng 04", monthNum: 4, shortMonth: "T4", customers: 230, shops: 18, shippers: 10, totalNew: 258, active: 910, locked: 5 },
  { month: "Tháng 05", monthNum: 5, shortMonth: "T5", customers: 310, shops: 24, shippers: 14, totalNew: 348, active: 1180, locked: 6 },
  { month: "Tháng 06", monthNum: 6, shortMonth: "T6", customers: 390, shops: 28, shippers: 18, totalNew: 436, active: 1490, locked: 8 },
  { month: "Tháng 07", monthNum: 7, shortMonth: "T7", customers: 460, shops: 35, shippers: 22, totalNew: 517, active: 1850, locked: 9 },
  { month: "Tháng 08", monthNum: 8, shortMonth: "T8", customers: 580, shops: 42, shippers: 26, totalNew: 648, active: 2320, locked: 11 },
  { month: "Tháng 09", monthNum: 9, shortMonth: "T9", customers: 520, shops: 38, shippers: 24, totalNew: 582, active: 2680, locked: 10 },
  { month: "Tháng 10", monthNum: 10, shortMonth: "T10", customers: 640, shops: 48, shippers: 30, totalNew: 718, active: 3150, locked: 12 },
  { month: "Tháng 11", monthNum: 11, shortMonth: "T11", customers: 720, shops: 55, shippers: 34, totalNew: 809, active: 3720, locked: 15 },
  { month: "Tháng 12", monthNum: 12, shortMonth: "T12", customers: 850, shops: 62, shippers: 40, totalNew: 952, active: 4450, locked: 18 },
];

export const AdminDashboardPage: React.FC = () => {
  const [tab, setTab] = useState<AdminPageTab>("overview");
  const [loading, setLoading] = useState(true);

  // Core data states
  const [orders, setOrders] = useState<Order[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [pendingShops, setPendingShops] = useState<Shop[]>([]);
  const [allShops, setAllShops] = useState<Shop[]>([]);
  const [books, setBooks] = useState<any[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [escrowList, setEscrowList] = useState<EscrowHoldingItem[]>([]);
  const [reports, setReports] = useState<ReportedItem[]>([]);

  // Sub-tabs
  const [disputeSubTab, setDisputeSubTab] = useState<"disputes" | "reports">("disputes");
  const [shopSubTab, setShopSubTab] = useState<"pending" | "all">("pending");

  // Chart States - Financial
  const [finTimeRange, setFinTimeRange] = useState<"ALL_YEAR" | "Q1" | "Q2" | "Q3" | "Q4" | "LAST_6" | "CURRENT">("ALL_YEAR");
  const [finMetric, setFinMetric] = useState<"all" | "gross" | "shop" | "refund" | "delivery" | "profit">("all");
  const [hoveredFinMonth, setHoveredFinMonth] = useState<MonthlyFinanceData | null>(null);

  // Chart States - User Growth
  const [userTimeRange, setUserTimeRange] = useState<"ALL_YEAR" | "LAST_6" | "LAST_30" | "LAST_7">("ALL_YEAR");
  const [userRoleMetric, setUserRoleMetric] = useState<"all" | "customers" | "shops" | "shippers">("all");
  const [hoveredUserMonth, setHoveredUserMonth] = useState<MonthlyUserData | null>(null);

  // Pagination states for all lists
  const [ordersPage, setOrdersPage] = useState(1);
  const [booksPage, setBooksPage] = useState(1);
  const [usersPage, setUsersPage] = useState(1);
  const [disputesPage, setDisputesPage] = useState(1);
  const [reportsPage, setReportsPage] = useState(1);
  const [allShopsPage, setAllShopsPage] = useState(1);
  const [escrowPage, setEscrowPage] = useState(1);

  // Search & Filter states
  const [searchUser, setSearchUser] = useState("");
  const [filterUserRole, setFilterUserRole] = useState("ALL");
  const [filterUserStatus, setFilterUserStatus] = useState("ALL");

  const [searchOrder, setSearchOrder] = useState("");
  const [filterOrderStatus, setFilterOrderStatus] = useState("ALL");
  const [filterOrderPayment, setFilterOrderPayment] = useState("ALL");

  const [searchBook, setSearchBook] = useState("");
  const [filterBookCategory, setFilterBookCategory] = useState("ALL");
  const [filterBookStatus, setFilterBookStatus] = useState("ALL");
  const [sortBookBy, setSortBookBy] = useState<"revenue" | "sold" | "price" | "stock">("revenue");

  const [searchDispute, setSearchDispute] = useState("");
  const [filterDisputeStatus, setFilterDisputeStatus] = useState("ALL");

  const [searchShop, setSearchShop] = useState("");
  const [searchEscrow, setSearchEscrow] = useState("");
  const [filterEscrowStatus, setFilterEscrowStatus] = useState("ALL");

  // User detail modal state
  const [selectedUserDetail, setSelectedUserDetail] = useState<{
    user: User;
    orders: Order[];
    transactions: Transaction[];
  } | null>(null);

  // Dispute Resolution modal state
  const [resolutionOrderId, setResolutionOrderId] = useState<number | null>(null);
  const [resolutionDecision, setResolutionDecision] = useState<ReturnStatus>("APPROVED");
  const [resolutionNote, setResolutionNote] = useState("");

  // Lock / Ban with Reason & Email Modal state
  const [lockTargetType, setLockTargetType] = useState<"USER" | "SHOP" | null>(null);
  const [lockTargetId, setLockTargetId] = useState<string | number | null>(null);
  const [lockTargetName, setLockTargetName] = useState("");
  const [lockTargetEmail, setLockTargetEmail] = useState("");
  const [lockReason, setLockReason] = useState("Vi phạm quy chế và chính sách cộng đồng sàn BookVerse.");
  const [sendEmailNotice, setSendEmailNotice] = useState(true);
  const [lockProcessing, setLockProcessing] = useState(false);
  const [lockSuccessAlert, setLockSuccessAlert] = useState("");

  // Direct Mail Modal state
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [emailTo, setEmailTo] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailContent, setEmailContent] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSuccessMsg, setEmailSuccessMsg] = useState("");

  // Category Management Modal state
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [editingCatId, setEditingCatId] = useState<string | number | null>(null);
  const [editingCatName, setEditingCatName] = useState("");

  // Create Admin Modal state
  const [createAdminModalOpen, setCreateAdminModalOpen] = useState(false);
  const [adminUsername, setAdminUsername] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminFullName, setAdminFullName] = useState("");
  const [adminPhone, setAdminPhone] = useState("");
  const [adminAddress, setAdminAddress] = useState("");
  const [adminRole, setAdminRole] = useState<"ADMIN" | "SUPER_ADMIN">("ADMIN");
  const [creatingAdmin, setCreatingAdmin] = useState(false);
  const [createAdminError, setCreateAdminError] = useState("");
  const [createAdminSuccess, setCreateAdminSuccess] = useState("");
  const [showAdminPassword, setShowAdminPassword] = useState(false);

  // Chat Drawer state
  const [chatOpen, setChatOpen] = useState(false);
  const [chatShopId, setChatShopId] = useState<string | number>(1);
  const [chatShopName, setChatShopName] = useState("Nhà sách");

  const loadData = async () => {
    setLoading(true);
    try {
      const [
        ordersData,
        txData,
        usersData,
        pendingShopsData,
        allShopsData,
        booksData,
        catsData,
        escrowData,
        reportsData,
      ] = await Promise.all([
        adminService.getAllOrders(),
        adminService.getTransactions(),
        adminService.getUsers(),
        adminService.getPendingShops(),
        adminService.getAllShops(),
        adminService.getAllBooks(),
        adminService.getAllCategories(),
        adminService.getEscrowHoldings(),
        adminService.getReportedResponses(),
      ]);

      setOrders(ordersData);
      setTransactions(txData);
      setUsers(usersData);
      setPendingShops(pendingShopsData);
      setAllShops(allShopsData);
      setBooks(booksData);
      setCategories(catsData);
      setEscrowList(escrowData);
      setReports(reportsData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Reset pagination when search/filters change
  useEffect(() => {
    setOrdersPage(1);
  }, [searchOrder, filterOrderStatus, filterOrderPayment]);

  useEffect(() => {
    setBooksPage(1);
  }, [searchBook, filterBookCategory, filterBookStatus, sortBookBy]);

  useEffect(() => {
    setUsersPage(1);
  }, [searchUser, filterUserRole, filterUserStatus]);

  useEffect(() => {
    setDisputesPage(1);
  }, [searchDispute, filterDisputeStatus]);

  useEffect(() => {
    setAllShopsPage(1);
  }, [searchShop]);

  useEffect(() => {
    setEscrowPage(1);
  }, [searchEscrow, filterEscrowStatus]);

  // --- Handlers ---
  const handleOpenLockModal = (type: "USER" | "SHOP", id: string | number, name: string, email: string) => {
    setLockTargetType(type);
    setLockTargetId(id);
    setLockTargetName(name);
    setLockTargetEmail(email);
    setLockReason("Vi phạm quy chế và chính sách cộng đồng sàn BookVerse.");
    setSendEmailNotice(true);
  };

  const handleConfirmLock = async () => {
    if (!lockTargetId || !lockTargetType) return;
    setLockProcessing(true);
    try {
      if (lockTargetType === "USER") {
        await adminService.toggleUserStatus(lockTargetId, "LOCKED", lockReason, sendEmailNotice);
        setUsers((prev) =>
          prev.map((u) => (String(u.id) === String(lockTargetId) ? { ...u, status: "LOCKED" } : u))
        );
      } else {
        await adminService.rejectShop(lockTargetId, lockReason, sendEmailNotice);
        setAllShops((prev) =>
          prev.map((s) => (String(s.id) === String(lockTargetId) ? { ...s, status: "REJECTED" as any } : s))
        );
      }
      setLockSuccessAlert(
        `Đã khóa thành công ${lockTargetType === "USER" ? "Tài khoản" : "Cửa hàng"} "${lockTargetName}". ${sendEmailNotice ? "Email thông báo lý do đã được gửi." : ""
        }`
      );
      setTimeout(() => setLockSuccessAlert(""), 4000);
      setLockTargetType(null);
    } finally {
      setLockProcessing(false);
    }
  };

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
    await adminService.handleReturnRequest(resolutionOrderId, resolutionDecision, resolutionNote);

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
    setResolutionOrderId(null);
  };

  const handleOpenChatWithShop = (shopId: string | number, shopName: string) => {
    setChatShopId(shopId);
    setChatShopName(shopName);
    setChatOpen(true);
  };

  const handleModerateReport = async (reportId: string | number, isDelete: boolean) => {
    await adminService.moderateShopResponse(reportId, isDelete, "Phản hồi vi phạm tiêu chuẩn cộng đồng");
    setReports((prev) =>
      prev.map((r) => (r.id === reportId ? { ...r, status: "RESOLVED" } : r))
    );
  };

  const handleReleaseEscrow = async (escrowId: string | number) => {
    await adminService.releaseEscrowEarly(escrowId);
    setEscrowList((prev) =>
      prev.map((e) => (e.id === escrowId ? { ...e, status: "RELEASED", daysRemaining: 0 } : e))
    );
  };

  const handleRefundEscrow = async (escrowId: string | number) => {
    await adminService.refundEscrowEarly(escrowId);
    setEscrowList((prev) =>
      prev.map((e) => (e.id === escrowId ? { ...e, status: "REFUNDED", daysRemaining: 0 } : e))
    );
  };

  const handleToggleBook = async (bookId: string | number, currentStatus: string) => {
    await adminService.toggleBookStatus(bookId, currentStatus);
    setBooks((prev) =>
      prev.map((b) =>
        String(b.id) === String(bookId)
          ? { ...b, status: currentStatus === "ACTIVE" ? "HIDDEN" : "ACTIVE" }
          : b
      )
    );
  };

  const handleSendDirectEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setSendingEmail(true);
    try {
      await adminService.sendDirectEmail(emailTo, emailSubject, emailContent);
      setEmailSuccessMsg(`Đã gửi email thành công tới ${emailTo}`);
      setTimeout(() => {
        setEmailSuccessMsg("");
        setEmailModalOpen(false);
      }, 2500);
    } finally {
      setSendingEmail(false);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    const cat = await adminService.createCategory(newCatName.trim());
    setCategories((prev) => [...prev, cat]);
    setNewCatName("");
  };

  const handleSaveEditCategory = async (id: string | number) => {
    if (!editingCatName.trim()) return;
    const cat = await adminService.updateCategory(id, editingCatName.trim());
    setCategories((prev) => prev.map((c) => (c.id === id ? cat : c)));
    setEditingCatId(null);
  };

  const handleDeleteCategory = async (id: string | number) => {
    await adminService.deleteCategory(id);
    setCategories((prev) => prev.filter((c) => c.id !== id));
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateAdminError("");
    setCreateAdminSuccess("");

    if (!adminUsername.trim()) {
      setCreateAdminError("Vui lòng nhập Tên đăng nhập.");
      return;
    }
    if (!adminEmail.trim()) {
      setCreateAdminError("Vui lòng nhập Email.");
      return;
    }
    if (!adminPassword || adminPassword.length < 6) {
      setCreateAdminError("Mật khẩu khởi tạo phải có ít nhất 6 ký tự.");
      return;
    }

    setCreatingAdmin(true);
    try {
      const newAdmin = await adminService.createAdmin({
        username: adminUsername,
        email: adminEmail,
        password: adminPassword,
        fullName: adminFullName,
        phone: adminPhone,
        address: adminAddress,
        role: adminRole,
      });

      setUsers((prev) => [newAdmin, ...prev]);
      setCreateAdminSuccess(`Đã tạo tài khoản Quản trị viên "${newAdmin.name}" (${adminRole}) thành công!`);
      setAdminUsername("");
      setAdminEmail("");
      setAdminPassword("");
      setAdminFullName("");
      setAdminPhone("");
      setAdminAddress("");
      setAdminRole("ADMIN");
      setTimeout(() => {
        setCreateAdminSuccess("");
        setCreateAdminModalOpen(false);
      }, 2000);
    } catch (err: any) {
      setCreateAdminError(err?.message || "Không thể tạo tài khoản Quản trị viên. Vui lòng kiểm tra lại thông tin.");
    } finally {
      setCreatingAdmin(false);
    }
  };

  // --- Financial Chart Filtered Dataset ---
  const filteredFinancialData = useMemo(() => {
    if (finTimeRange === "Q1") return YEARLY_FINANCIAL_DATA.filter((d) => d.quarter === "Q1");
    if (finTimeRange === "Q2") return YEARLY_FINANCIAL_DATA.filter((d) => d.quarter === "Q2");
    if (finTimeRange === "Q3") return YEARLY_FINANCIAL_DATA.filter((d) => d.quarter === "Q3");
    if (finTimeRange === "Q4") return YEARLY_FINANCIAL_DATA.filter((d) => d.quarter === "Q4");
    if (finTimeRange === "LAST_6") return YEARLY_FINANCIAL_DATA.slice(6, 12);
    if (finTimeRange === "CURRENT") return YEARLY_FINANCIAL_DATA.slice(8, 9);
    return YEARLY_FINANCIAL_DATA;
  }, [finTimeRange]);

  const financialSummary = useMemo(() => {
    const totalGross = filteredFinancialData.reduce((s, d) => s + d.gross, 0);
    const totalShop = filteredFinancialData.reduce((s, d) => s + d.shopPayout, 0);
    const totalRefund = filteredFinancialData.reduce((s, d) => s + d.refunds, 0);
    const totalDelivery = filteredFinancialData.reduce((s, d) => s + d.delivery, 0);
    const totalProfit = filteredFinancialData.reduce((s, d) => s + d.profit, 0);
    return { totalGross, totalShop, totalRefund, totalDelivery, totalProfit };
  }, [filteredFinancialData]);

  const maxFinValue = useMemo(() => {
    return Math.max(...filteredFinancialData.map((d) => d.gross), 1000000);
  }, [filteredFinancialData]);

  // --- User Growth Filtered Dataset ---
  const filteredUserData = useMemo(() => {
    if (userTimeRange === "LAST_6") return YEARLY_USER_DATA.slice(6, 12);
    if (userTimeRange === "LAST_30") return YEARLY_USER_DATA.slice(8, 9);
    if (userTimeRange === "LAST_7") return YEARLY_USER_DATA.slice(8, 9);
    return YEARLY_USER_DATA;
  }, [userTimeRange]);

  const userSummary = useMemo(() => {
    const totalNew = filteredUserData.reduce((s, d) => s + d.totalNew, 0);
    const totalCustomers = filteredUserData.reduce((s, d) => s + d.customers, 0);
    const totalShops = filteredUserData.reduce((s, d) => s + d.shops, 0);
    const totalShippers = filteredUserData.reduce((s, d) => s + d.shippers, 0);
    const latestActive = filteredUserData[filteredUserData.length - 1]?.active || 0;
    const latestLocked = filteredUserData[filteredUserData.length - 1]?.locked || 0;
    return { totalNew, totalCustomers, totalShops, totalShippers, latestActive, latestLocked };
  }, [filteredUserData]);

  const maxUserValue = useMemo(() => {
    return Math.max(...filteredUserData.map((d) => d.totalNew), 10);
  }, [filteredUserData]);

  // --- Calculations for Overview ---
  const totalRevenue = orders.reduce((s, o) => s + o.totalAmount, 0);
  const totalEscrowHolding = escrowList
    .filter((e) => e.status === "HOLDING")
    .reduce((s, e) => s + e.amount, 0);
  const totalReleased = escrowList
    .filter((e) => e.status === "RELEASED")
    .reduce((s, e) => s + e.amount, 0);
  const totalRefunds = escrowList
    .filter((e) => e.status === "REFUNDED")
    .reduce((s, e) => s + e.amount, 0);

  // --- Filtered Data ---
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchSearch =
        u.name.toLowerCase().includes(searchUser.toLowerCase()) ||
        u.email.toLowerCase().includes(searchUser.toLowerCase()) ||
        (u.phone && u.phone.includes(searchUser));
      const matchRole = filterUserRole === "ALL" || u.role.toLowerCase() === filterUserRole.toLowerCase();
      const matchStatus = filterUserStatus === "ALL" || u.status === filterUserStatus;
      return matchSearch && matchRole && matchStatus;
    });
  }, [users, searchUser, filterUserRole, filterUserStatus]);

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchSearch =
        String(o.id).includes(searchOrder) ||
        o.customerName.toLowerCase().includes(searchOrder.toLowerCase()) ||
        (o.shopName && o.shopName.toLowerCase().includes(searchOrder.toLowerCase()));
      const matchStatus = filterOrderStatus === "ALL" || o.orderStatus === filterOrderStatus;
      const matchPayment = filterOrderPayment === "ALL" || o.paymentMethod === filterOrderPayment;
      return matchSearch && matchStatus && matchPayment;
    });
  }, [orders, searchOrder, filterOrderStatus, filterOrderPayment]);

  const filteredBooks = useMemo(() => {
    return books
      .filter((b) => {
        const matchSearch =
          b.title.toLowerCase().includes(searchBook.toLowerCase()) ||
          b.author.toLowerCase().includes(searchBook.toLowerCase()) ||
          (b.shopName && b.shopName.toLowerCase().includes(searchBook.toLowerCase()));
        const matchCategory = filterBookCategory === "ALL" || String(b.categoryId) === String(filterBookCategory);
        const matchStatus = filterBookStatus === "ALL" || b.status === filterBookStatus;
        return matchSearch && matchCategory && matchStatus;
      })
      .sort((a, b) => {
        if (sortBookBy === "revenue") return b.revenue - a.revenue;
        if (sortBookBy === "sold") return b.soldCount - a.soldCount;
        if (sortBookBy === "price") return b.price - a.price;
        if (sortBookBy === "stock") return b.stock - a.stock;
        return 0;
      });
  }, [books, searchBook, filterBookCategory, filterBookStatus, sortBookBy]);

  const returnOrders = useMemo(() => orders.filter((o) => o.returnRequest), [orders]);
  const filteredDisputes = useMemo(() => {
    return returnOrders.filter((o) => {
      const rr = o.returnRequest!;
      const matchSearch =
        String(o.id).includes(searchDispute) ||
        o.customerName.toLowerCase().includes(searchDispute.toLowerCase()) ||
        (o.shopName && o.shopName.toLowerCase().includes(searchDispute.toLowerCase())) ||
        rr.reason.toLowerCase().includes(searchDispute.toLowerCase());
      const matchStatus = filterDisputeStatus === "ALL" || rr.status === filterDisputeStatus;
      return matchSearch && matchStatus;
    });
  }, [returnOrders, searchDispute, filterDisputeStatus]);

  const filteredAllShops = useMemo(() => {
    return allShops.filter(
      (s) =>
        s.name.toLowerCase().includes(searchShop.toLowerCase()) ||
        (s.phone && s.phone.includes(searchShop)) ||
        (s.address && s.address.toLowerCase().includes(searchShop.toLowerCase()))
    );
  }, [allShops, searchShop]);

  const filteredEscrow = useMemo(() => {
    return escrowList.filter((e) => {
      const matchSearch =
        String(e.orderId).includes(searchEscrow) ||
        e.shopName.toLowerCase().includes(searchEscrow.toLowerCase()) ||
        e.customerName.toLowerCase().includes(searchEscrow.toLowerCase());
      const matchStatus = filterEscrowStatus === "ALL" || e.status === filterEscrowStatus;
      return matchSearch && matchStatus;
    });
  }, [escrowList, searchEscrow, filterEscrowStatus]);

  // --- Paginated Slices ---
  const paginatedOrders = useMemo(
    () => filteredOrders.slice((ordersPage - 1) * PAGE_SIZE_DEFAULT, ordersPage * PAGE_SIZE_DEFAULT),
    [filteredOrders, ordersPage]
  );

  const paginatedBooks = useMemo(
    () => filteredBooks.slice((booksPage - 1) * PAGE_SIZE_DEFAULT, booksPage * PAGE_SIZE_DEFAULT),
    [filteredBooks, booksPage]
  );

  const paginatedUsers = useMemo(
    () => filteredUsers.slice((usersPage - 1) * PAGE_SIZE_DEFAULT, usersPage * PAGE_SIZE_DEFAULT),
    [filteredUsers, usersPage]
  );

  const paginatedDisputes = useMemo(
    () => filteredDisputes.slice((disputesPage - 1) * 5, disputesPage * 5),
    [filteredDisputes, disputesPage]
  );

  const paginatedReports = useMemo(
    () => reports.slice((reportsPage - 1) * 5, reportsPage * 5),
    [reports, reportsPage]
  );

  const paginatedAllShops = useMemo(
    () => filteredAllShops.slice((allShopsPage - 1) * PAGE_SIZE_DEFAULT, allShopsPage * PAGE_SIZE_DEFAULT),
    [filteredAllShops, allShopsPage]
  );

  const paginatedEscrow = useMemo(
    () => filteredEscrow.slice((escrowPage - 1) * PAGE_SIZE_DEFAULT, escrowPage * PAGE_SIZE_DEFAULT),
    [filteredEscrow, escrowPage]
  );

  // --- Reusable Pagination Component ---
  const renderPagination = (
    currentPage: number,
    totalCount: number,
    pageSize: number,
    onPageChange: (newPage: number) => void
  ) => {
    const totalPages = Math.ceil(totalCount / pageSize);
    if (totalPages <= 1) return null;

    const startItem = (currentPage - 1) * pageSize + 1;
    const endItem = Math.min(currentPage * pageSize, totalCount);

    return (
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 bg-white border-t border-slate-200 rounded-b-2xl text-xs text-slate-500 shadow-2xs">
        <div className="font-medium">
          Hiển thị <span className="font-bold text-slate-800">{startItem}</span> -{" "}
          <span className="font-bold text-slate-800">{endItem}</span> trên tổng số{" "}
          <span className="font-bold text-blue-600">{totalCount}</span> mục
        </div>
        <div className="flex items-center gap-1.5 self-end sm:self-auto">
          <button
            disabled={currentPage === 1}
            onClick={() => onPageChange(currentPage - 1)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 font-bold transition-colors cursor-pointer"
          >
            <ChevronLeft size={13} /> Trước
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
            .map((p, idx, arr) => (
              <React.Fragment key={p}>
                {idx > 0 && arr[idx - 1] !== p - 1 && <span className="px-1 text-slate-300">...</span>}
                <button
                  onClick={() => onPageChange(p)}
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg font-bold transition-all text-xs cursor-pointer ${currentPage === p
                    ? "bg-blue-600 text-white shadow-xs"
                    : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                >
                  {p}
                </button>
              </React.Fragment>
            ))}
          <button
            disabled={currentPage === totalPages}
            onClick={() => onPageChange(currentPage + 1)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 font-bold transition-colors cursor-pointer"
          >
            Sau <ChevronRight size={13} />
          </button>
        </div>
      </div>
    );
  };

  const navItems = [
    { key: "overview" as const, label: "Tổng quan", icon: <BarChart2 size={16} /> },
    { key: "orders" as const, label: `Đơn hàng (${orders.length})`, icon: <Package size={16} /> },
    { key: "books" as const, label: `Kho sách & Doanh thu (${books.length})`, icon: <BookOpen size={16} /> },
    {
      key: "disputes" as const,
      label: `Tranh chấp & Báo cáo (${returnOrders.length + reports.filter((r) => r.status === "PENDING").length})`,
      icon: <BadgeAlert size={16} />,
    },
    { key: "shops" as const, label: `Duyệt & Quản lý Shop (${pendingShops.length})`, icon: <Store size={16} /> },
    { key: "escrow" as const, label: "Quỹ Tạm giữ Escrow", icon: <DollarSign size={16} /> },
    { key: "users" as const, label: `Người dùng (${users.length})`, icon: <Users size={16} /> },
  ];

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-80px)] overflow-hidden bg-slate-100/60">
      {/* Alert popup */}
      {lockSuccessAlert && (
        <div className="fixed top-20 right-6 z-50 p-4 rounded-2xl bg-emerald-600 text-white font-semibold text-xs shadow-2xl flex items-center gap-2.5 animate-in slide-in-from-top-4">
          <Check size={18} /> {lockSuccessAlert}
        </div>
      )}

      {/* Sidebar Navigation: Sticky & Independent Scroll */}
      <aside className="w-full md:w-64 border-r border-slate-200 bg-white p-3 sm:p-4 flex md:flex-col gap-1.5 shrink-0 overflow-x-auto md:overflow-y-auto md:h-full shadow-xs z-10">
        <div className="hidden md:block px-3 py-2 text-[11px] font-extrabold uppercase text-slate-400 tracking-wider">
          Trung tâm Quản trị Sàn
        </div>
        {navItems.map((n) => (
          <button
            key={n.key}
            onClick={() => setTab(n.key)}
            className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-left transition-all whitespace-nowrap cursor-pointer shrink-0 md:shrink"
            style={
              tab === n.key
                ? {
                  backgroundColor: "#eff6ff",
                  color: "#1d4ed8",
                  fontWeight: "bold",
                  borderLeft: "3px solid #2563eb",
                }
                : { color: "#475569" }
            }
          >
            {n.icon}
            {n.label}
          </button>
        ))}
      </aside>

      {/* Main Admin Workspace: Independent Scroll */}
      <main className="flex-1 h-full overflow-y-auto p-4 md:p-8 bg-slate-50/80">
        {loading ? (
          <div className="text-center py-24 text-slate-400 flex items-center justify-center gap-2">
            <RefreshCw size={20} className="animate-spin text-blue-600" /> Đang đồng bộ dữ liệu quản trị sàn...
          </div>
        ) : (
          <>
            {/* 1. OVERVIEW TAB */}
            {tab === "overview" && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-black text-slate-800 tracking-tight">
                    Tổng quan Hoạt động Sàn BookVerse
                  </h1>
                  <p className="text-xs text-slate-500 mt-1">
                    Báo cáo số liệu thời gian thực: Dòng tiền, Quỹ tạm giữ Escrow, Đơn hàng và Người dùng
                  </p>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard
                    label="Tổng doanh thu sàn (GMV)"
                    value={fmt(totalRevenue)}
                    icon={<TrendingUp size={22} />}
                    color="#1d4ed8"
                    sub="Bao gồm COD & Online"
                  />
                  <StatCard
                    label="Quỹ Escrow đang tạm giữ"
                    value={fmt(totalEscrowHolding)}
                    icon={<DollarSign size={22} />}
                    color="#b45309"
                    sub="Chờ hết hạn khiếu nại (3-7 ngày)"
                  />
                  <StatCard
                    label="Đã giải ngân cho Shop"
                    value={fmt(totalReleased)}
                    icon={<Check size={22} />}
                    color="#047857"
                    sub="Chuyển vào ví Shop thành công"
                  />
                  <StatCard
                    label="Tổng tiền đã hoàn khách"
                    value={fmt(totalRefunds)}
                    icon={<RefreshCw size={22} />}
                    color="#b91c1c"
                    sub="Qua giải quyết tranh chấp"
                  />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="p-6">
                    <h2 className="font-bold text-slate-800 mb-4 text-sm flex items-center justify-between">
                      <span>Phân bổ trạng thái đơn hàng</span>
                      <span className="text-xs text-slate-400 font-normal">{orders.length} đơn</span>
                    </h2>
                    <div className="space-y-3">
                      {(["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "RETURNED"] as const).map(
                        (st) => {
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
                                  style={{ width: `${percent}%`, backgroundColor: si.color }}
                                />
                              </div>
                              <span className="text-xs font-bold text-slate-700 w-12 text-right">
                                {count} ({percent.toFixed(0)}%)
                              </span>
                            </div>
                          );
                        }
                      )}
                    </div>
                  </Card>

                  <Card className="p-6">
                    <h2 className="font-bold text-slate-800 mb-4 text-sm flex items-center justify-between">
                      <span>Top 5 Sách mang lại Doanh thu cao nhất</span>
                      <button
                        onClick={() => setTab("books")}
                        className="text-xs text-blue-600 hover:underline font-semibold cursor-pointer"
                      >
                        Xem tất cả
                      </button>
                    </h2>
                    <div className="divide-y divide-slate-100">
                      {books
                        .slice()
                        .sort((a, b) => b.revenue - a.revenue)
                        .slice(0, 5)
                        .map((b, idx) => (
                          <div key={b.id} className="py-2.5 flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2.5">
                              <span className="w-5 h-5 rounded-full bg-slate-100 font-bold text-slate-600 flex items-center justify-center text-[10px]">
                                #{idx + 1}
                              </span>
                              <div>
                                <p className="font-semibold text-slate-800 line-clamp-1">{b.title}</p>
                                <p className="text-[10px] text-slate-400">
                                  Shop: {b.shopName} • Đã bán: <strong>{b.soldCount} cuốn</strong>
                                </p>
                              </div>
                            </div>
                            <span className="font-extrabold text-blue-600 text-sm whitespace-nowrap">
                              {fmt(b.revenue)}
                            </span>
                          </div>
                        ))}
                    </div>
                  </Card>
                </div>
              </div>
            )}

            {/* 2. ORDERS TAB */}
            {tab === "orders" && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h1 className="text-2xl font-black text-slate-800 tracking-tight">
                      Giám sát Đơn hàng Toàn Sàn
                    </h1>
                    <p className="text-xs text-slate-500">
                      Theo dõi tiến độ giao hàng và phương thức thanh toán của mọi gian hàng
                    </p>
                  </div>
                  <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full border border-blue-100">
                    {filteredOrders.length} / {orders.length} đơn hàng
                  </span>
                </div>

                {/* Search & Filter Bar */}
                <Card className="p-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="relative">
                      <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        value={searchOrder}
                        onChange={(e) => setSearchOrder(e.target.value)}
                        placeholder="Tìm theo Mã đơn, Tên khách, Tên shop..."
                        className="w-full text-xs pl-9 pr-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <select
                        value={filterOrderStatus}
                        onChange={(e) => setFilterOrderStatus(e.target.value)}
                        className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:border-blue-500 font-medium text-slate-700"
                      >
                        <option value="ALL">Tất cả Trạng thái đơn</option>
                        <option value="PENDING">Chờ xác nhận (PENDING)</option>
                        <option value="PROCESSING">Đang xử lý (PROCESSING)</option>
                        <option value="SHIPPED">Đang giao (SHIPPED)</option>
                        <option value="DELIVERED">Đã giao (DELIVERED)</option>
                        <option value="CANCELLED">Đã hủy (CANCELLED)</option>
                        <option value="RETURNED">Đổi trả (RETURNED)</option>
                      </select>
                    </div>
                    <div>
                      <select
                        value={filterOrderPayment}
                        onChange={(e) => setFilterOrderPayment(e.target.value)}
                        className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:border-blue-500 font-medium text-slate-700"
                      >
                        <option value="ALL">Tất cả Phương thức thanh toán</option>
                        <option value="COD">Thanh toán khi nhận hàng (COD)</option>
                        <option value="ONLINE">Thanh toán Online (VNPay / MoMo)</option>
                      </select>
                    </div>
                  </div>
                </Card>

                {/* Orders Table */}
                <Card className="overflow-hidden shadow-xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs sm:text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold text-xs uppercase">
                          <th className="px-4 py-3.5">Mã đơn</th>
                          <th className="px-4 py-3.5">Khách hàng</th>
                          <th className="px-4 py-3.5">Cửa hàng Shop</th>
                          <th className="px-4 py-3.5">Giá trị đơn</th>
                          <th className="px-4 py-3.5">Thanh toán</th>
                          <th className="px-4 py-3.5">Trạng thái</th>
                          <th className="px-4 py-3.5">Thời gian tạo</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {paginatedOrders.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="text-center py-10 text-slate-400">
                              Không tìm thấy đơn hàng nào phù hợp.
                            </td>
                          </tr>
                        ) : (
                          paginatedOrders.map((o) => {
                            const si = orderStatusInfo(o.orderStatus);
                            return (
                              <tr key={o.id} className="hover:bg-slate-50/70 transition-colors">
                                <td className="px-4 py-3 font-mono font-bold text-slate-600">#{o.id}</td>
                                <td className="px-4 py-3">
                                  <p className="font-semibold text-slate-800">{o.customerName}</p>
                                  <p className="text-[11px] text-slate-400">{o.customerPhone}</p>
                                </td>
                                <td className="px-4 py-3 text-xs font-medium text-slate-700">
                                  {o.shopName || `Shop #${o.shopId}`}
                                </td>
                                <td className="px-4 py-3 font-bold text-blue-600">
                                  {fmt(o.totalAmount + o.shippingFee)}
                                </td>
                                <td className="px-4 py-3">
                                  <Badge
                                    label={o.paymentMethod}
                                    color={o.paymentMethod === "ONLINE" ? "#1d4ed8" : "#047857"}
                                    bg={o.paymentMethod === "ONLINE" ? "#dbeafe" : "#d1fae5"}
                                  />
                                </td>
                                <td className="px-4 py-3">
                                  <Badge label={si.label} color={si.color} bg={si.bg} />
                                </td>
                                <td className="px-4 py-3 text-xs text-slate-400 font-mono">{o.createdAt}</td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                  {renderPagination(ordersPage, filteredOrders.length, PAGE_SIZE_DEFAULT, setOrdersPage)}
                </Card>
              </div>
            )}

            {/* 3. BOOKS & REVENUE TAB */}
            {tab === "books" && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h1 className="text-2xl font-black text-slate-800 tracking-tight">
                      Kiểm duyệt Sách & Thống kê Doanh thu
                    </h1>
                    <p className="text-xs text-slate-500">
                      Theo dõi số lượng đã bán, doanh thu từng đầu sách và kiểm duyệt sách vi phạm
                    </p>
                  </div>
                  <Btn onClick={() => setCategoryModalOpen(true)} color="#4f46e5" size="sm">
                    <Plus size={14} /> Quản lý Thể loại sách
                  </Btn>
                </div>

                {/* Search, Filter & Sort */}
                <Card className="p-4">
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div className="relative sm:col-span-2">
                      <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        value={searchBook}
                        onChange={(e) => setSearchBook(e.target.value)}
                        placeholder="Tìm tựa sách, tác giả, tên nhà sách..."
                        className="w-full text-xs pl-9 pr-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <select
                        value={filterBookCategory}
                        onChange={(e) => setFilterBookCategory(e.target.value)}
                        className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:border-blue-500 text-slate-700"
                      >
                        <option value="ALL">Tất cả Thể loại</option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <select
                        value={sortBookBy}
                        onChange={(e) => setSortBookBy(e.target.value as any)}
                        className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:border-blue-500 font-semibold text-slate-700"
                      >
                        <option value="revenue">Sắp xếp: Doanh thu cao nhất</option>
                        <option value="sold">Sắp xếp: Đã bán nhiều nhất</option>
                        <option value="stock">Sắp xếp: Tồn kho</option>
                        <option value="price">Sắp xếp: Giá bán</option>
                      </select>
                    </div>
                  </div>
                </Card>

                {/* Books Table */}
                <Card className="overflow-hidden shadow-xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs sm:text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold text-xs uppercase">
                          <th className="px-4 py-3.5">Tựa sách / Tác giả</th>
                          <th className="px-4 py-3.5">Cửa hàng Shop</th>
                          <th className="px-4 py-3.5">Thể loại</th>
                          <th className="px-4 py-3.5">Giá bán</th>
                          <th className="px-4 py-3.5">Tồn kho</th>
                          <th className="px-4 py-3.5">Đã bán</th>
                          <th className="px-4 py-3.5 font-black text-blue-700">Doanh thu sách bán ra</th>
                          <th className="px-4 py-3.5 text-right">Kiểm duyệt</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {paginatedBooks.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="text-center py-10 text-slate-400">
                              Không tìm thấy sách nào phù hợp.
                            </td>
                          </tr>
                        ) : (
                          paginatedBooks.map((b) => (
                            <tr key={b.id} className="hover:bg-slate-50/70 transition-colors">
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-3">
                                  {b.imageUrl ? (
                                    <img
                                      src={b.imageUrl}
                                      alt={b.title}
                                      className="w-9 h-12 rounded object-cover border border-slate-200 shadow-2xs"
                                    />
                                  ) : (
                                    <div className="w-9 h-12 rounded bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs border border-indigo-200">
                                      📖
                                    </div>
                                  )}
                                  <div>
                                    <p className="font-bold text-slate-800 line-clamp-1">{b.title}</p>
                                    <p className="text-[11px] text-slate-400">{b.author}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-xs font-medium text-slate-700">{b.shopName}</td>
                              <td className="px-4 py-3">
                                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[11px] font-semibold">
                                  {b.categoryName || "Sách"}
                                </span>
                              </td>
                              <td className="px-4 py-3 font-semibold text-slate-800">{fmt(b.price)}</td>
                              <td className="px-4 py-3 font-medium text-slate-600">{b.stock}</td>
                              <td className="px-4 py-3 font-bold text-slate-800">{b.soldCount}</td>
                              <td className="px-4 py-3 font-black text-blue-600 text-sm">{fmt(b.revenue)}</td>
                              <td className="px-4 py-3 text-right">
                                <button
                                  onClick={() => handleToggleBook(b.id, b.status)}
                                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${b.status === "ACTIVE"
                                    ? "bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200"
                                    : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200"
                                    }`}
                                >
                                  {b.status === "ACTIVE" ? "Ẩn sách" : "Bỏ ẩn"}
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                  {renderPagination(booksPage, filteredBooks.length, PAGE_SIZE_DEFAULT, setBooksPage)}
                </Card>
              </div>
            )}

            {/* 4. DISPUTES & REPORTS TAB */}
            {tab === "disputes" && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h1 className="text-2xl font-black text-slate-800 tracking-tight">
                      Trọng tài Tranh chấp & Xử lý Báo cáo Vi phạm
                    </h1>
                    <p className="text-xs text-slate-500">
                      Phán quyết đổi trả hoàn tiền minh bạch, nhắn tin trực tiếp với Shop và xử lý vi phạm
                    </p>
                  </div>

                  {/* Sub-tab switcher */}
                  <div className="flex bg-slate-200/80 p-1 rounded-xl">
                    <button
                      onClick={() => setDisputeSubTab("disputes")}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${disputeSubTab === "disputes"
                        ? "bg-white text-blue-600 shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                        }`}
                    >
                      Khiếu nại Hoàn tiền ({returnOrders.length})
                    </button>
                    <button
                      onClick={() => setDisputeSubTab("reports")}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${disputeSubTab === "reports"
                        ? "bg-white text-rose-600 shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                        }`}
                    >
                      Báo cáo Vi phạm ({reports.filter((r) => r.status === "PENDING").length})
                    </button>
                  </div>
                </div>

                {/* Sub-tab 1: Disputes */}
                {disputeSubTab === "disputes" && (
                  <div className="space-y-4">
                    <Card className="p-4">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="relative sm:col-span-2">
                          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            value={searchDispute}
                            onChange={(e) => setSearchDispute(e.target.value)}
                            placeholder="Tìm theo Mã đơn, Tên khách, Tên shop, Lý do..."
                            className="w-full text-xs pl-9 pr-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <select
                            value={filterDisputeStatus}
                            onChange={(e) => setFilterDisputeStatus(e.target.value)}
                            className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:border-blue-500 font-semibold text-slate-700"
                          >
                            <option value="ALL">Tất cả Trạng thái phân xử</option>
                            <option value="PENDING">Chờ Admin phân xử (PENDING)</option>
                            <option value="APPROVED">Đã duyệt hoàn tiền (APPROVED)</option>
                            <option value="REJECTED">Đã từ chối khiếu nại (REJECTED)</option>
                          </select>
                        </div>
                      </div>
                    </Card>

                    {filteredDisputes.length === 0 ? (
                      <Card className="p-12 text-center text-slate-400">
                        Không tìm thấy yêu cầu khiếu nại nào phù hợp.
                      </Card>
                    ) : (
                      <div className="space-y-4">
                        {paginatedDisputes.map((order) => {
                          const rr = order.returnRequest!;
                          return (
                            <Card key={order.id} className="p-5 shadow-sm border-l-4 border-l-blue-500">
                              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                                <div className="flex-1 space-y-2">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-mono text-xs font-extrabold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                                      Đơn hàng #{order.id}
                                    </span>
                                    <Badge
                                      label={
                                        rr.status === "APPROVED"
                                          ? "Đã duyệt hoàn tiền 100%"
                                          : rr.status === "REJECTED"
                                            ? "Đã từ chối khiếu nại"
                                            : "Đang chờ Admin phân xử"
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
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-bold border border-indigo-100">
                                      Loại lỗi: {rr.reasonType}
                                    </span>
                                  </div>

                                  <div className="text-xs text-slate-700">
                                    <strong>Khách khiếu nại:</strong> {order.customerName} ({order.customerPhone}) •{" "}
                                    <strong>Cửa hàng:</strong> {order.shopName || `Shop #${order.shopId}`}
                                  </div>

                                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                                    <p className="font-bold text-slate-700 mb-1">📝 Nội dung khiếu nại từ Khách:</p>
                                    <p className="text-slate-600 italic">"{rr.reason}"</p>

                                    {rr.evidenceImage && (
                                      <div className="mt-2 flex items-center gap-2">
                                        <span className="font-semibold text-slate-700">📸 Bằng chứng ảnh lỗi:</span>
                                        <a
                                          href={rr.evidenceImage}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="text-blue-600 font-bold underline hover:text-blue-800 inline-flex items-center gap-1"
                                        >
                                          Xem ảnh chụp sách hỏng <Eye size={12} />
                                        </a>
                                      </div>
                                    )}
                                  </div>

                                  {rr.shopResponse && (
                                    <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200 text-xs">
                                      <p className="font-bold text-amber-900 mb-1">🏪 Phản hồi từ chối từ Shop:</p>
                                      <p className="text-amber-800 italic">"{rr.shopResponse}"</p>
                                    </div>
                                  )}

                                  {rr.adminResolutionNote && (
                                    <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 text-xs">
                                      <p className="font-bold text-blue-900 mb-1">⚖️ Quyết định phân xử của Admin:</p>
                                      <p className="text-blue-800">{rr.adminResolutionNote}</p>
                                    </div>
                                  )}

                                  <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                                    <span>
                                      Số tiền hoàn yêu cầu:{" "}
                                      <strong className="text-slate-800 text-sm font-black">
                                        {fmt(rr.refundAmount)}
                                      </strong>
                                    </span>
                                    <span>Ngày tạo: {rr.createdAt}</span>
                                  </div>
                                </div>

                                {/* Action Buttons on Dispute */}
                                <div className="flex lg:flex-col gap-2 shrink-0">
                                  <button
                                    onClick={() =>
                                      handleOpenChatWithShop(order.shopId, order.shopName || "Nhà sách")
                                    }
                                    className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold transition-colors cursor-pointer"
                                    title="Mở khung chat trực tiếp với Shop"
                                  >
                                    <MessageSquare size={14} /> Nhắn tin với Shop
                                  </button>

                                  {rr.status === "PENDING" && (
                                    <>
                                      <Btn
                                        size="sm"
                                        color="#047857"
                                        onClick={() => handleOpenResolutionModal(order.id as any, "APPROVED")}
                                      >
                                        <Check size={14} /> Duyệt hoàn tiền
                                      </Btn>
                                      <Btn
                                        variant="danger"
                                        size="sm"
                                        onClick={() => handleOpenResolutionModal(order.id as any, "REJECTED")}
                                      >
                                        <X size={14} /> Bác bỏ khiếu nại
                                      </Btn>
                                    </>
                                  )}
                                </div>
                              </div>
                            </Card>
                          );
                        })}
                        {renderPagination(disputesPage, filteredDisputes.length, 5, setDisputesPage)}
                      </div>
                    )}
                  </div>
                )}

                {/* Sub-tab 2: Reported Reviews/Responses */}
                {disputeSubTab === "reports" && (
                  <div className="space-y-4">
                    {reports.length === 0 ? (
                      <Card className="p-12 text-center text-slate-400">
                        Hiện không có phản hồi nào bị báo cáo vi phạm.
                      </Card>
                    ) : (
                      <div className="space-y-4">
                        {paginatedReports.map((rep) => (
                          <Card key={rep.id} className="p-5 border-rose-200 shadow-sm">
                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                              <div className="space-y-2 flex-1 text-xs">
                                <div className="flex items-center gap-2">
                                  <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 font-extrabold text-[11px]">
                                    Báo cáo vi phạm #{rep.id}
                                  </span>
                                  <Badge
                                    label={rep.status === "RESOLVED" ? "Đã xử lý ẩn" : "Chờ xử lý"}
                                    color={rep.status === "RESOLVED" ? "#047857" : "#b91c1c"}
                                    bg={rep.status === "RESOLVED" ? "#d1fae5" : "#fee2e2"}
                                  />
                                </div>

                                <p className="font-bold text-slate-800 text-sm">
                                  Sách: {rep.bookTitle || "Sách trên sàn"} • Gian hàng:{" "}
                                  <span className="text-blue-600">{rep.shopName}</span>
                                </p>

                                <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 border border-slate-200">
                                  <p>
                                    <strong>Bình luận của Khách ({rep.customerName}):</strong> "{rep.customerComment}"
                                  </p>
                                  <p className="text-rose-700">
                                    <strong>Phản hồi vi phạm của Shop:</strong> "{rep.shopResponse}"
                                  </p>
                                  <p className="text-slate-500 italic">
                                    <strong>Lý do bị báo cáo:</strong> {rep.reason}
                                  </p>
                                </div>
                              </div>

                              <div className="flex sm:flex-col gap-2 shrink-0">
                                <button
                                  onClick={() => handleOpenChatWithShop(rep.shopId, rep.shopName)}
                                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                                >
                                  <MessageSquare size={14} /> Nhắn tin với Shop
                                </button>

                                {rep.status === "PENDING" && (
                                  <Btn
                                    size="sm"
                                    color="#dc2626"
                                    onClick={() => handleModerateReport(rep.id, true)}
                                  >
                                    <Trash2 size={14} /> Ẩn phản hồi vi phạm
                                  </Btn>
                                )}
                              </div>
                            </div>
                          </Card>
                        ))}
                        {renderPagination(reportsPage, reports.length, 5, setReportsPage)}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* 5. SHOPS TAB */}
            {tab === "shops" && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h1 className="text-2xl font-black text-slate-800 tracking-tight">
                      Kiểm duyệt & Quản lý Gian hàng
                    </h1>
                    <p className="text-xs text-slate-500">
                      Phê duyệt đơn mở tiệm sách mới và giám sát các nhà sách đang hoạt động
                    </p>
                  </div>

                  {/* Sub-tab switcher */}
                  <div className="flex bg-slate-200/80 p-1 rounded-xl">
                    <button
                      onClick={() => setShopSubTab("pending")}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${shopSubTab === "pending"
                        ? "bg-white text-amber-700 shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                        }`}
                    >
                      Shop chờ duyệt ({pendingShops.length})
                    </button>
                    <button
                      onClick={() => setShopSubTab("all")}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${shopSubTab === "all"
                        ? "bg-white text-blue-600 shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                        }`}
                    >
                      Tất cả gian hàng ({allShops.length})
                    </button>
                  </div>
                </div>

                {/* Sub-tab: Pending Shops */}
                {shopSubTab === "pending" && (
                  <div>
                    {pendingShops.length === 0 ? (
                      <Card className="p-12 text-center text-slate-400">
                        Hiện không có hồ sơ mở gian hàng nào đang chờ duyệt.
                      </Card>
                    ) : (
                      <div className="space-y-4">
                        {pendingShops.map((shop) => (
                          <Card
                            key={shop.id}
                            className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm"
                          >
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-bold text-sm text-slate-800">{shop.name}</span>
                                <Badge label="Chờ duyệt (PENDING)" color="#b45309" bg="#fef3c7" />
                              </div>
                              <p className="text-xs text-slate-500">
                                Hotline: {shop.phone} • Email: {shop.email}
                              </p>
                              <p className="text-xs text-slate-500 mt-0.5">Địa chỉ kho: {shop.address}</p>
                              {shop.description && (
                                <p className="text-xs text-slate-600 italic mt-1">"{shop.description}"</p>
                              )}
                            </div>

                            <div className="flex gap-2 shrink-0">
                              <Btn
                                size="sm"
                                color="#047857"
                                onClick={async () => {
                                  await adminService.approveShop(shop.id);
                                  setPendingShops((prev) => prev.filter((s) => s.id !== shop.id));
                                  loadData();
                                }}
                              >
                                <Check size={14} /> Phê duyệt mở Shop
                              </Btn>
                              <Btn
                                variant="danger"
                                size="sm"
                                onClick={() => handleOpenLockModal("SHOP", shop.id, shop.name, shop.email)}
                              >
                                <X size={14} /> Từ chối
                              </Btn>
                            </div>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Sub-tab: All Active Shops */}
                {shopSubTab === "all" && (
                  <div className="space-y-4">
                    <Card className="p-4">
                      <div className="relative">
                        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          value={searchShop}
                          onChange={(e) => setSearchShop(e.target.value)}
                          placeholder="Tìm kiếm theo tên gian hàng, hotline, địa chỉ..."
                          className="w-full text-xs pl-9 pr-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </Card>

                    <Card className="overflow-hidden shadow-xs">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs sm:text-sm">
                          <thead>
                            <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold text-xs uppercase">
                              <th className="px-4 py-3.5">Tên Gian Hàng / Hotline</th>
                              <th className="px-4 py-3.5">Địa chỉ kho</th>
                              <th className="px-4 py-3.5">Đánh giá</th>
                              <th className="px-4 py-3.5">Đầu sách</th>
                              <th className="px-4 py-3.5">Trạng thái</th>
                              <th className="px-4 py-3.5 text-right">Thao tác</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {paginatedAllShops.length === 0 ? (
                              <tr>
                                <td colSpan={6} className="text-center py-10 text-slate-400">
                                  Không tìm thấy gian hàng nào.
                                </td>
                              </tr>
                            ) : (
                              paginatedAllShops.map((s) => (
                                <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                                  <td className="px-4 py-3">
                                    <p className="font-bold text-slate-800">{s.name}</p>
                                    <p className="text-[11px] text-slate-400">
                                      {s.phone} • {s.email}
                                    </p>
                                  </td>
                                  <td className="px-4 py-3 text-xs text-slate-600">{s.address}</td>
                                  <td className="px-4 py-3 font-semibold text-amber-600">⭐ {s.rating}</td>
                                  <td className="px-4 py-3 font-medium text-slate-700">{s.bookCount} sách</td>
                                  <td className="px-4 py-3">
                                    <Badge
                                      label={s.status === "ACTIVE" ? "HOẠT ĐỘNG" : "ĐÃ KHÓA"}
                                      color={s.status === "ACTIVE" ? "#047857" : "#b91c1c"}
                                      bg={s.status === "ACTIVE" ? "#d1fae5" : "#fee2e2"}
                                    />
                                  </td>
                                  <td className="px-4 py-3 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                      <button
                                        onClick={() => handleOpenChatWithShop(s.id, s.name)}
                                        className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                                        title="Nhắn tin với Shop"
                                      >
                                        <MessageSquare size={15} />
                                      </button>
                                      <button
                                        onClick={() => {
                                          setEmailTo(s.email);
                                          setEmailSubject(
                                            `[BookVerse] Thông báo từ Ban Quản Trị gửi Gian hàng ${s.name}`
                                          );
                                          setEmailModalOpen(true);
                                        }}
                                        className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg transition-colors cursor-pointer"
                                        title="Gửi Email trực tiếp cho Shop"
                                      >
                                        <Mail size={15} />
                                      </button>
                                      <button
                                        onClick={() => handleOpenLockModal("SHOP", s.id, s.name, s.email)}
                                        className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                        title="Khóa gian hàng vi phạm"
                                      >
                                        <Lock size={15} />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                      {renderPagination(allShopsPage, filteredAllShops.length, PAGE_SIZE_DEFAULT, setAllShopsPage)}
                    </Card>
                  </div>
                )}
              </div>
            )}

            {/* 6. ESCROW & FINANCIAL ANALYTICS TAB */}
            {tab === "escrow" && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h1 className="text-2xl font-black text-slate-800 tracking-tight">
                      Quản lý Quỹ Tạm Giữ Escrow & Biểu Đồ Dòng Tiền 2026
                    </h1>
                    <p className="text-xs text-slate-500">
                      Báo cáo dòng tiền thu được, giải ngân Shop, hoàn tiền khiếu nại, phí giao vận và lợi nhuận sàn
                    </p>
                  </div>
                  <span className="text-xs font-bold text-amber-700 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-200">
                    Quỹ Escrow đang giữ: {fmt(totalEscrowHolding)}
                  </span>
                </div>

                {/* --- INTERACTIVE FINANCIAL CHART SECTION --- */}
                <Card className="p-5 sm:p-6 space-y-5 bg-white border border-slate-200/80 shadow-xs">
                  {/* Top Chart Controls */}
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                        <TrendingUp size={18} />
                      </div>
                      <div>
                        <h2 className="text-sm font-black text-slate-800">
                          Biểu đồ Dòng Tiền & Tăng Trưởng Quỹ Năm 2026
                        </h2>
                        <p className="text-[11px] text-slate-400">
                          Rê chuột vào từng cột để xem chi tiết đối soát từng tháng
                        </p>
                      </div>
                    </div>

                    {/* Time Filter Bar */}
                    <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs overflow-x-auto">
                      {[
                        { key: "ALL_YEAR" as const, label: "Cả năm 2026" },
                        { key: "Q1" as const, label: "Quý 1" },
                        { key: "Q2" as const, label: "Quý 2" },
                        { key: "Q3" as const, label: "Quý 3" },
                        { key: "Q4" as const, label: "Quý 4" },
                        { key: "LAST_6" as const, label: "6 Tháng gần nhất" },
                        { key: "CURRENT" as const, label: "Tháng này" },
                      ].map((tf) => (
                        <button
                          key={tf.key}
                          onClick={() => setFinTimeRange(tf.key)}
                          className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap ${finTimeRange === tf.key
                            ? "bg-white text-blue-600 shadow-xs"
                            : "text-slate-600 hover:text-slate-900"
                            }`}
                        >
                          {tf.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Metric Switcher Badges */}
                  <div className="flex items-center gap-2 flex-wrap text-xs">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">
                      Hiển thị:
                    </span>
                    {[
                      { key: "all" as const, label: "🌈 Tất cả dòng tiền", color: "#1d4ed8" },
                      { key: "gross" as const, label: "💰 Số tiền thu được (GMV)", color: "#2563eb" },
                      { key: "shop" as const, label: "🏪 Tiền giải ngân cho Shop", color: "#059669" },
                      { key: "refund" as const, label: "⚖️ Hoàn tiền khiếu nại", color: "#dc2626" },
                      { key: "delivery" as const, label: "🚚 Phí vận chuyển (Delivery)", color: "#d97706" },
                      { key: "profit" as const, label: "💎 Phí sàn / Lợi nhuận BookVerse", color: "#7c3aed" },
                    ].map((m) => (
                      <button
                        key={m.key}
                        onClick={() => setFinMetric(m.key)}
                        className={`px-3 py-1.5 rounded-xl font-bold transition-all border cursor-pointer ${finMetric === m.key
                          ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                          }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>

                  {/* Period Aggregated Summary Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 p-3.5 bg-slate-50/90 rounded-2xl border border-slate-200/70 text-xs">
                    <div>
                      <p className="text-[11px] text-slate-400 font-semibold">Tổng tiền thu được</p>
                      <p className="text-sm font-black text-blue-600">{fmt(financialSummary.totalGross)}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-slate-400 font-semibold">Giải ngân về Shop</p>
                      <p className="text-sm font-black text-emerald-600">{fmt(financialSummary.totalShop)}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-slate-400 font-semibold">Hoàn tiền tranh chấp</p>
                      <p className="text-sm font-black text-rose-600">{fmt(financialSummary.totalRefund)}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-slate-400 font-semibold">Phí giao vận (Ship)</p>
                      <p className="text-sm font-black text-amber-600">{fmt(financialSummary.totalDelivery)}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-slate-400 font-semibold">Lợi nhuận sàn (Fee)</p>
                      <p className="text-sm font-black text-purple-600">{fmt(financialSummary.totalProfit)}</p>
                    </div>
                  </div>

                  {/* SVG Bar Chart Visualization */}
                  <div className="relative pt-6 pb-2">
                    <div className="h-64 flex items-end justify-between gap-2 sm:gap-4 px-2 border-b border-slate-200">
                      {filteredFinancialData.map((d) => {
                        const grossHeight = (d.gross / maxFinValue) * 100;
                        const shopHeight = (d.shopPayout / maxFinValue) * 100;
                        const refundHeight = (d.refunds / maxFinValue) * 100;
                        const deliveryHeight = (d.delivery / maxFinValue) * 100;
                        const profitHeight = (d.profit / maxFinValue) * 100;

                        return (
                          <div
                            key={d.monthNum}
                            onMouseEnter={() => setHoveredFinMonth(d)}
                            onMouseLeave={() => setHoveredFinMonth(null)}
                            className="flex-1 flex flex-col items-center h-full justify-end group relative cursor-pointer"
                          >
                            {/* Hover Tooltip Popup */}
                            {hoveredFinMonth?.monthNum === d.monthNum && (
                              <div className="absolute -top-36 z-30 w-56 p-3 bg-slate-900 text-white rounded-xl shadow-2xl text-[11px] space-y-1 animate-in fade-in zoom-in-95 pointer-events-none">
                                <p className="font-extrabold text-amber-400 border-b border-slate-700 pb-1">
                                  📊 {d.month}
                                </p>
                                <p className="flex justify-between">
                                  <span>Thu được:</span> <strong className="text-blue-300">{fmt(d.gross)}</strong>
                                </p>
                                <p className="flex justify-between">
                                  <span>Về ví Shop:</span> <strong className="text-emerald-300">{fmt(d.shopPayout)}</strong>
                                </p>
                                <p className="flex justify-between">
                                  <span>Hoàn tranh chấp:</span> <strong className="text-rose-300">{fmt(d.refunds)}</strong>
                                </p>
                                <p className="flex justify-between">
                                  <span>Phí Delivery:</span> <strong className="text-amber-300">{fmt(d.delivery)}</strong>
                                </p>
                                <p className="flex justify-between">
                                  <span>Lợi nhuận sàn:</span> <strong className="text-purple-300">{fmt(d.profit)}</strong>
                                </p>
                              </div>
                            )}

                            {/* Bars depending on selected metric */}
                            <div className="w-full flex items-end justify-center gap-0.5 sm:gap-1 h-full pb-1">
                              {finMetric === "all" ? (
                                <>
                                  <div
                                    className="w-2.5 sm:w-3.5 bg-blue-500 group-hover:bg-blue-600 rounded-t-md transition-all duration-300"
                                    style={{ height: `${grossHeight}%` }}
                                    title={`Thu được: ${fmt(d.gross)}`}
                                  />
                                  <div
                                    className="w-2.5 sm:w-3.5 bg-emerald-500 group-hover:bg-emerald-600 rounded-t-md transition-all duration-300"
                                    style={{ height: `${shopHeight}%` }}
                                    title={`Shop lấy: ${fmt(d.shopPayout)}`}
                                  />
                                  <div
                                    className="w-1.5 sm:w-2 bg-rose-500 group-hover:bg-rose-600 rounded-t-md transition-all duration-300"
                                    style={{ height: `${Math.max(refundHeight, 4)}%` }}
                                    title={`Hoàn tiền: ${fmt(d.refunds)}`}
                                  />
                                  <div
                                    className="w-1.5 sm:w-2.5 bg-amber-500 group-hover:bg-amber-600 rounded-t-md transition-all duration-300"
                                    style={{ height: `${deliveryHeight}%` }}
                                    title={`Delivery: ${fmt(d.delivery)}`}
                                  />
                                  <div
                                    className="w-1.5 sm:w-2.5 bg-purple-500 group-hover:bg-purple-600 rounded-t-md transition-all duration-300"
                                    style={{ height: `${profitHeight}%` }}
                                    title={`Hoa hồng sàn: ${fmt(d.profit)}`}
                                  />
                                </>
                              ) : (
                                <div
                                  className={`w-full max-w-[36px] rounded-t-lg transition-all duration-300 ${finMetric === "gross"
                                    ? "bg-blue-600 hover:bg-blue-700"
                                    : finMetric === "shop"
                                      ? "bg-emerald-600 hover:bg-emerald-700"
                                      : finMetric === "refund"
                                        ? "bg-rose-600 hover:bg-rose-700"
                                        : finMetric === "delivery"
                                          ? "bg-amber-600 hover:bg-amber-700"
                                          : "bg-purple-600 hover:bg-purple-700"
                                    }`}
                                  style={{
                                    height: `${finMetric === "gross"
                                      ? grossHeight
                                      : finMetric === "shop"
                                        ? shopHeight
                                        : finMetric === "refund"
                                          ? Math.max(refundHeight, 6)
                                          : finMetric === "delivery"
                                            ? deliveryHeight
                                            : profitHeight
                                      }%`,
                                  }}
                                />
                              )}
                            </div>

                            {/* Month Label */}
                            <span className="text-[11px] font-bold text-slate-500 mt-2 group-hover:text-blue-600 transition-colors">
                              {d.shortMonth}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Chart Legend */}
                    <div className="flex items-center justify-center gap-4 flex-wrap pt-3 text-[11px] font-semibold text-slate-600">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Tiền thu được (GMV)
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Tiền giải ngân cho Shop
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Hoàn tiền tranh chấp
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Phí Delivery
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-purple-500" /> Lợi nhuận sàn
                      </span>
                    </div>
                  </div>
                </Card>

                {/* --- ESCROW HOLDING LIST & SEARCH --- */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-base font-black text-slate-800">Danh sách Khoản Tiền Tạm Giữ Escrow</h2>
                    <span className="text-xs text-slate-400">
                      Hiển thị {filteredEscrow.length} khoản tạm giữ
                    </span>
                  </div>

                  <Card className="p-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="relative sm:col-span-2">
                        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          value={searchEscrow}
                          onChange={(e) => setSearchEscrow(e.target.value)}
                          placeholder="Tìm mã đơn, tên shop, tên khách..."
                          className="w-full text-xs pl-9 pr-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <select
                          value={filterEscrowStatus}
                          onChange={(e) => setFilterEscrowStatus(e.target.value)}
                          className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:border-blue-500 font-semibold text-slate-700"
                        >
                          <option value="ALL">Tất cả Trạng thái Escrow</option>
                          <option value="HOLDING">Đang tạm giữ (HOLDING)</option>
                          <option value="RELEASED">Đã giải ngân cho Shop (RELEASED)</option>
                          <option value="REFUNDED">Đã hoàn tiền cho Khách (REFUNDED)</option>
                        </select>
                      </div>
                    </div>
                  </Card>

                  {/* Escrow Table */}
                  <Card className="overflow-hidden shadow-xs">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs sm:text-sm">
                        <thead>
                          <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold text-xs uppercase">
                            <th className="px-4 py-3.5">Mã GD / Đơn</th>
                            <th className="px-4 py-3.5">Cửa hàng nhận tiền</th>
                            <th className="px-4 py-3.5">Khách thanh toán</th>
                            <th className="px-4 py-3.5">Số tiền giữ</th>
                            <th className="px-4 py-3.5">Thời hạn giải ngân</th>
                            <th className="px-4 py-3.5">Trạng thái</th>
                            <th className="px-4 py-3.5 text-right">Hành động của Admin</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {paginatedEscrow.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="text-center py-10 text-slate-400">
                                Không tìm thấy khoản tạm giữ nào phù hợp.
                              </td>
                            </tr>
                          ) : (
                            paginatedEscrow.map((item) => (
                              <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                                <td className="px-4 py-3 font-mono font-bold text-slate-600">
                                  <span className="block">{item.id}</span>
                                  <span className="text-[10px] text-slate-400">Đơn #{item.orderId}</span>
                                </td>
                                <td className="px-4 py-3 font-semibold text-slate-800">{item.shopName}</td>
                                <td className="px-4 py-3 text-slate-600">
                                  {item.customerName}
                                  <span className="block text-[10px] text-blue-600 font-bold">{item.paymentMethod}</span>
                                </td>
                                <td className="px-4 py-3 font-black text-blue-600 text-sm">{fmt(item.amount)}</td>
                                <td className="px-4 py-3">
                                  {item.status === "HOLDING" ? (
                                    <div>
                                      <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded text-xs border border-amber-200">
                                        Còn {item.daysRemaining} ngày
                                      </span>
                                      <span className="block text-[10px] text-slate-400 mt-0.5">
                                        Auto: {item.autoReleaseDate}
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="text-xs text-slate-400">—</span>
                                  )}
                                </td>
                                <td className="px-4 py-3">
                                  <Badge
                                    label={
                                      item.status === "HOLDING"
                                        ? "ĐANG TẠM GIỮ"
                                        : item.status === "RELEASED"
                                          ? "ĐÃ GIẢI NGÂN"
                                          : "ĐÃ HOÀN TIỀN"
                                    }
                                    color={
                                      item.status === "HOLDING"
                                        ? "#b45309"
                                        : item.status === "RELEASED"
                                          ? "#047857"
                                          : "#b91c1c"
                                    }
                                    bg={
                                      item.status === "HOLDING"
                                        ? "#fef3c7"
                                        : item.status === "RELEASED"
                                          ? "#d1fae5"
                                          : "#fee2e2"
                                    }
                                  />
                                </td>
                                <td className="px-4 py-3 text-right">
                                  {item.status === "HOLDING" && (
                                    <div className="flex items-center justify-end gap-1.5">
                                      <Btn
                                        size="sm"
                                        color="#047857"
                                        onClick={() => handleReleaseEscrow(item.id)}
                                        title="Giải phóng tiền ngay về ví Shop"
                                      >
                                        <Check size={13} /> Giải ngân sớm
                                      </Btn>
                                      <Btn
                                        size="sm"
                                        variant="danger"
                                        onClick={() => handleRefundEscrow(item.id)}
                                        title="Hoàn tiền ngay cho khách"
                                      >
                                        <X size={13} /> Hoàn khách
                                      </Btn>
                                    </div>
                                  )}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                    {renderPagination(escrowPage, filteredEscrow.length, PAGE_SIZE_DEFAULT, setEscrowPage)}
                  </Card>
                </div>
              </div>
            )}

            {/* 7. USERS & USER GROWTH CHART TAB */}
            {tab === "users" && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h1 className="text-2xl font-black text-slate-800 tracking-tight">
                      Quản lý Người dùng & Biểu Đồ Tăng Trưởng
                    </h1>
                    <p className="text-xs text-slate-500">
                      Theo dõi số lượng khách hàng, gian hàng và shipper mới đăng ký theo mốc thời gian
                    </p>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Btn
                      onClick={() => {
                        setCreateAdminError("");
                        setCreateAdminSuccess("");
                        setCreateAdminModalOpen(true);
                      }}
                      color="#4f46e5"
                      size="sm"
                      className="shadow-xs font-bold"
                    >
                      <UserPlus size={15} /> Thêm Quản trị viên (Admin)
                    </Btn>
                    <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full border border-blue-100">
                      {filteredUsers.length} / {users.length} tài khoản
                    </span>
                  </div>
                </div>

                {/* --- INTERACTIVE USER GROWTH CHART SECTION --- */}
                <Card className="p-5 sm:p-6 space-y-5 bg-white border border-slate-200/80 shadow-xs">
                  {/* Top Header & Range Switcher */}
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                        <Users size={18} />
                      </div>
                      <div>
                        <h2 className="text-sm font-black text-slate-800">
                          Biểu đồ Tăng Trưởng Người Dùng Theo Thời Gian (2026)
                        </h2>
                        <p className="text-[11px] text-slate-400">
                          Số lượng tài khoản Khách hàng, Shop và Shipper mới kích hoạt
                        </p>
                      </div>
                    </div>

                    {/* Time Filter Bar */}
                    <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs">
                      {[
                        { key: "ALL_YEAR" as const, label: "12 Tháng" },
                        { key: "LAST_6" as const, label: "6 Tháng gần nhất" },
                        { key: "LAST_30" as const, label: "30 Ngày qua" },
                        { key: "LAST_7" as const, label: "7 Ngày qua" },
                      ].map((tf) => (
                        <button
                          key={tf.key}
                          onClick={() => setUserTimeRange(tf.key)}
                          className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${userTimeRange === tf.key
                            ? "bg-white text-indigo-600 shadow-xs"
                            : "text-slate-600 hover:text-slate-900"
                            }`}
                        >
                          {tf.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* User Role Metric Filters */}
                  <div className="flex items-center gap-2 flex-wrap text-xs">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">
                      Phân loại:
                    </span>
                    {[
                      { key: "all" as const, label: "👥 Toàn bộ người dùng mới" },
                      { key: "customers" as const, label: "🛍️ Khách hàng (Customer)" },
                      { key: "shops" as const, label: "🏪 Gian hàng (Shop)" },
                      { key: "shippers" as const, label: "🚚 Nhân viên giao vận (Shipper)" },
                    ].map((m) => (
                      <button
                        key={m.key}
                        onClick={() => setUserRoleMetric(m.key)}
                        className={`px-3 py-1.5 rounded-xl font-bold transition-all border cursor-pointer ${userRoleMetric === m.key
                          ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                          }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>

                  {/* Period User Aggregated Summary */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-indigo-50/50 rounded-2xl border border-indigo-100 text-xs">
                    <div>
                      <p className="text-[11px] text-slate-400 font-semibold">Tổng đăng ký mới</p>
                      <p className="text-base font-black text-indigo-700">+{userSummary.totalNew} tài khoản</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-slate-400 font-semibold">Khách hàng mới</p>
                      <p className="text-base font-black text-blue-600">+{userSummary.totalCustomers}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-slate-400 font-semibold">Shop & Shipper mới</p>
                      <p className="text-base font-black text-emerald-600">
                        +{userSummary.totalShops} Shop • +{userSummary.totalShippers} Ship
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] text-slate-400 font-semibold">Tỷ lệ Hoạt động Active</p>
                      <p className="text-base font-black text-emerald-600">
                        {userSummary.latestActive} Active ({((userSummary.latestActive / (userSummary.latestActive + userSummary.latestLocked || 1)) * 100).toFixed(1)}%)
                      </p>
                    </div>
                  </div>

                  {/* SVG User Chart */}
                  <div className="relative pt-6 pb-2">
                    <div className="h-56 flex items-end justify-between gap-2 sm:gap-4 px-2 border-b border-slate-200">
                      {filteredUserData.map((u) => {
                        const custHeight = (u.customers / maxUserValue) * 100;
                        const shopHeight = (u.shops / maxUserValue) * 100;
                        const shipHeight = (u.shippers / maxUserValue) * 100;
                        const totalHeight = (u.totalNew / maxUserValue) * 100;

                        return (
                          <div
                            key={u.monthNum}
                            onMouseEnter={() => setHoveredUserMonth(u)}
                            onMouseLeave={() => setHoveredUserMonth(null)}
                            className="flex-1 flex flex-col items-center h-full justify-end group relative cursor-pointer"
                          >
                            {/* Hover Tooltip Popup */}
                            {hoveredUserMonth?.monthNum === u.monthNum && (
                              <div className="absolute -top-32 z-30 w-52 p-3 bg-slate-900 text-white rounded-xl shadow-2xl text-[11px] space-y-1 animate-in fade-in zoom-in-95 pointer-events-none">
                                <p className="font-extrabold text-indigo-400 border-b border-slate-700 pb-1">
                                  📈 {u.month}
                                </p>
                                <p className="flex justify-between">
                                  <span>Đăng ký mới:</span> <strong className="text-white">+{u.totalNew}</strong>
                                </p>
                                <p className="flex justify-between">
                                  <span>Khách hàng:</span> <strong className="text-blue-300">+{u.customers}</strong>
                                </p>
                                <p className="flex justify-between">
                                  <span>Cửa hàng Shop:</span> <strong className="text-amber-300">+{u.shops}</strong>
                                </p>
                                <p className="flex justify-between">
                                  <span>Shipper giao hàng:</span> <strong className="text-emerald-300">+{u.shippers}</strong>
                                </p>
                              </div>
                            )}

                            {/* Stacked or Single Bar */}
                            <div className="w-full flex items-end justify-center gap-0.5 sm:gap-1 h-full pb-1">
                              {userRoleMetric === "all" ? (
                                <div
                                  className="w-full max-w-[32px] flex flex-col justify-end rounded-t-md overflow-hidden transition-all duration-300 group-hover:opacity-90 shadow-2xs"
                                  style={{ height: `${totalHeight}%` }}
                                >
                                  <div className="w-full bg-emerald-500" style={{ height: `${(u.shippers / u.totalNew) * 100}%` }} title={`Shipper: ${u.shippers}`} />
                                  <div className="w-full bg-amber-500" style={{ height: `${(u.shops / u.totalNew) * 100}%` }} title={`Shop: ${u.shops}`} />
                                  <div className="w-full bg-blue-600" style={{ height: `${(u.customers / u.totalNew) * 100}%` }} title={`Customer: ${u.customers}`} />
                                </div>
                              ) : (
                                <div
                                  className={`w-full max-w-[32px] rounded-t-lg transition-all duration-300 ${userRoleMetric === "customers"
                                    ? "bg-blue-600"
                                    : userRoleMetric === "shops"
                                      ? "bg-amber-500"
                                      : "bg-emerald-500"
                                    }`}
                                  style={{
                                    height: `${userRoleMetric === "customers"
                                      ? custHeight
                                      : userRoleMetric === "shops"
                                        ? Math.max(shopHeight * 3, 8)
                                        : Math.max(shipHeight * 4, 6)
                                      }%`,
                                  }}
                                />
                              )}
                            </div>

                            {/* Month Label */}
                            <span className="text-[11px] font-bold text-slate-500 mt-2 group-hover:text-indigo-600 transition-colors">
                              {u.shortMonth}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Chart Legend */}
                    <div className="flex items-center justify-center gap-4 flex-wrap pt-3 text-[11px] font-semibold text-slate-600">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-600" /> Khách hàng mới (Customer)
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Gian hàng mới (Shop)
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Shipper mới (Delivery)
                      </span>
                    </div>
                  </div>
                </Card>

                {/* --- USERS LIST & SEARCH --- */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-base font-black text-slate-800">Danh sách Tài khoản Người Dùng</h2>
                  </div>

                  {/* Search & Filter Bar */}
                  <Card className="p-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="relative">
                        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          value={searchUser}
                          onChange={(e) => setSearchUser(e.target.value)}
                          placeholder="Tìm theo Tên, Email, Số điện thoại..."
                          className="w-full text-xs pl-9 pr-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <select
                          value={filterUserRole}
                          onChange={(e) => setFilterUserRole(e.target.value)}
                          className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:border-blue-500 font-semibold text-slate-700"
                        >
                          <option value="ALL">Tất cả Vai trò (Roles)</option>
                          <option value="customer">Khách hàng (CUSTOMER)</option>
                          <option value="shop">Chủ cửa hàng (SHOP)</option>
                          <option value="deliver">Nhân viên giao hàng (DELIVER)</option>
                          <option value="admin">Quản trị viên (ADMIN)</option>
                        </select>
                      </div>
                      <div>
                        <select
                          value={filterUserStatus}
                          onChange={(e) => setFilterUserStatus(e.target.value)}
                          className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:border-blue-500 font-semibold text-slate-700"
                        >
                          <option value="ALL">Tất cả Trạng thái</option>
                          <option value="ACTIVE">Đang hoạt động (ACTIVE)</option>
                          <option value="LOCKED">Đã khóa tài khoản (LOCKED)</option>
                        </select>
                      </div>
                    </div>
                  </Card>

                  {/* Users Table */}
                  <Card className="overflow-hidden shadow-xs">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs sm:text-sm">
                        <thead>
                          <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold text-xs uppercase">
                            <th className="px-4 py-3.5">Người dùng / Email</th>
                            <th className="px-4 py-3.5">Vai trò</th>
                            <th className="px-4 py-3.5">Trạng thái</th>
                            <th className="px-4 py-3.5">Ngày tham gia</th>
                            <th className="px-4 py-3.5 text-right">Thao tác & Cảnh cáo</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {paginatedUsers.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="text-center py-10 text-slate-400">
                                Không tìm thấy người dùng nào phù hợp.
                              </td>
                            </tr>
                          ) : (
                            paginatedUsers.map((u) => (
                              <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                                <td className="px-4 py-3">
                                  <p className="font-bold text-slate-800">{u.name}</p>
                                  <p className="text-xs text-slate-400">
                                    {u.email} • {u.phone}
                                  </p>
                                </td>
                                <td className="px-4 py-3">
                                  <Badge
                                    label={u.role.toUpperCase()}
                                    color={
                                      u.role === "admin"
                                        ? "#6d28d9"
                                        : u.role === "shop"
                                          ? "#b45309"
                                          : u.role === "deliver"
                                            ? "#047857"
                                            : "#1d4ed8"
                                    }
                                    bg={
                                      u.role === "admin"
                                        ? "#ede9fe"
                                        : u.role === "shop"
                                          ? "#fef3c7"
                                          : u.role === "deliver"
                                            ? "#d1fae5"
                                            : "#dbeafe"
                                    }
                                  />
                                </td>
                                <td className="px-4 py-3">
                                  <Badge
                                    label={u.status === "LOCKED" ? "LOCKED" : "ACTIVE"}
                                    color={u.status === "LOCKED" ? "#b91c1c" : "#047857"}
                                    bg={u.status === "LOCKED" ? "#fee2e2" : "#d1fae5"}
                                  />
                                </td>
                                <td className="px-4 py-3 text-xs text-slate-400 font-mono">{u.createdAt}</td>
                                <td className="px-4 py-3 text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    <button
                                      onClick={async () => {
                                        const detail = await adminService.getUserDetail(u.id);
                                        setSelectedUserDetail(detail);
                                      }}
                                      className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg transition-colors cursor-pointer"
                                      title="Xem chi tiết hồ sơ & dòng tiền"
                                    >
                                      <Eye size={15} />
                                    </button>
                                    <button
                                      onClick={() => {
                                        setEmailTo(u.email);
                                        setEmailSubject(`[BookVerse] Thông báo cảnh cáo / nhắc nhở tài khoản ${u.name}`);
                                        setEmailModalOpen(true);
                                      }}
                                      className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg transition-colors cursor-pointer"
                                      title="Gửi Email cảnh cáo trực tiếp"
                                    >
                                      <Mail size={15} />
                                    </button>
                                    {u.status === "LOCKED" ? (
                                      <button
                                        onClick={async () => {
                                          await adminService.toggleUserStatus(u.id, "ACTIVE");
                                          setUsers((prev) =>
                                            prev.map((item) =>
                                              item.id === u.id ? { ...item, status: "ACTIVE" } : item
                                            )
                                          );
                                        }}
                                        className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                                        title="Mở khóa tài khoản"
                                      >
                                        <Unlock size={15} />
                                      </button>
                                    ) : (
                                      <button
                                        onClick={() => handleOpenLockModal("USER", u.id, u.name, u.email)}
                                        className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                        title="Khóa tài khoản kèm lý do"
                                      >
                                        <Lock size={15} />
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                    {renderPagination(usersPage, filteredUsers.length, PAGE_SIZE_DEFAULT, setUsersPage)}
                  </Card>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* --- MODALS & DRAWERS --- */}

      {/* 1. Modal Lock User/Shop with Reason & Email */}
      {lockTargetType && (
        <Modal
          isOpen={true}
          onClose={() => setLockTargetType(null)}
          title={`Khóa / Đình chỉ ${lockTargetType === "USER" ? "Tài khoản" : "Cửa hàng"}: ${lockTargetName}`}
          maxWidth="max-w-md"
        >
          <div className="space-y-4 text-xs">
            <div className="p-3.5 bg-rose-50 rounded-xl border border-rose-200 text-rose-900 flex items-start gap-2.5">
              <AlertTriangle size={18} className="shrink-0 text-rose-600 mt-0.5" />
              <div>
                <p className="font-bold">Cảnh báo khóa hoạt động!</p>
                <p className="text-[11px] text-rose-700 leading-relaxed mt-0.5">
                  Tài khoản sẽ bị thu hồi toàn bộ token và chặn truy cập vào hệ thống BookVerse ngay lập tức.
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Lý do khóa / đình chỉ vi phạm (Bắt buộc) *
              </label>
              <textarea
                rows={3}
                required
                value={lockReason}
                onChange={(e) => setLockReason(e.target.value)}
                placeholder="Ví dụ: Gian lận thanh toán, bán sách kém chất lượng, vi phạm quy định sàn..."
                className="w-full text-xs sm:text-sm border border-slate-300 rounded-xl p-3 bg-slate-50 focus:outline-none focus:border-rose-500 resize-none"
              />
            </div>

            <label className="flex items-center gap-2 font-medium text-slate-700 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={sendEmailNotice}
                onChange={(e) => setSendEmailNotice(e.target.checked)}
                className="rounded text-rose-600 focus:ring-rose-500"
              />
              <span>
                Tự động gửi Email thông báo lý do vi phạm tới <strong>{lockTargetEmail}</strong>
              </span>
            </label>

            <div className="flex gap-2 pt-2">
              <Btn
                onClick={handleConfirmLock}
                disabled={!lockReason.trim() || lockProcessing}
                color="#dc2626"
                size="md"
                className="flex-1"
              >
                <Lock size={15} /> {lockProcessing ? "Đang xử lý..." : "Xác nhận khóa tài khoản"}
              </Btn>
              <Btn onClick={() => setLockTargetType(null)} variant="ghost" size="md">
                Hủy bỏ
              </Btn>
            </div>
          </div>
        </Modal>
      )}

      {/* 2. Modal Send Direct Warning Email */}
      {emailModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => setEmailModalOpen(false)}
          title="Gửi Email Thông Báo / Cảnh Cáo Trực Tiếp"
          maxWidth="max-w-md"
        >
          <form onSubmit={handleSendDirectEmail} className="space-y-4 text-xs">
            {emailSuccessMsg && (
              <div className="p-3 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl font-bold flex items-center gap-2">
                <Check size={16} /> {emailSuccessMsg}
              </div>
            )}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Gửi tới Email:</label>
              <input
                type="email"
                required
                value={emailTo}
                onChange={(e) => setEmailTo(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-xl p-2.5 bg-slate-50 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Tiêu đề thư (Subject):</label>
              <input
                required
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-xl p-2.5 bg-slate-50 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Nội dung thông báo:</label>
              <textarea
                rows={4}
                required
                value={emailContent}
                onChange={(e) => setEmailContent(e.target.value)}
                placeholder="Nhập nội dung cảnh báo hoặc thông báo chính thức..."
                className="w-full text-xs border border-slate-300 rounded-xl p-2.5 bg-slate-50 focus:outline-none focus:border-blue-500 resize-none"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Btn type="submit" disabled={sendingEmail} color="#2563eb" size="md" className="flex-1">
                <Send size={14} /> {sendingEmail ? "Đang gửi email..." : "Gửi thư ngay"}
              </Btn>
              <Btn onClick={() => setEmailModalOpen(false)} variant="ghost" size="md">
                Đóng
              </Btn>
            </div>
          </form>
        </Modal>
      )}

      {/* 3. Modal Dispute Resolution */}
      {resolutionOrderId && (
        <Modal
          isOpen={true}
          onClose={() => setResolutionOrderId(null)}
          title={`Phán quyết tranh chấp đơn hàng #${resolutionOrderId}`}
          maxWidth="max-w-md"
        >
          <div className="space-y-4 text-xs">
            <p className="text-slate-600">
              Quyết định:{" "}
              <strong
                className={
                  resolutionDecision === "APPROVED" ? "text-emerald-600 text-sm" : "text-rose-600 text-sm"
                }
              >
                {resolutionDecision === "APPROVED" ? "Duyệt hoàn tiền 100% cho Khách" : "Bác bỏ khiếu nại của Khách"}
              </strong>
            </p>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Lý do & Kết luận phân xử (Bắt buộc - gửi thông báo cho cả Khách và Shop) *
              </label>
              <textarea
                rows={3}
                required
                value={resolutionNote}
                onChange={(e) => setResolutionNote(e.target.value)}
                className="w-full text-xs sm:text-sm border border-slate-300 rounded-xl p-3 bg-slate-50 focus:outline-none focus:border-blue-500 resize-none"
              />
            </div>

            <div className="flex gap-2">
              <Btn
                onClick={handleConfirmResolution}
                disabled={!resolutionNote.trim()}
                color={resolutionDecision === "APPROVED" ? "#047857" : "#dc2626"}
                size="md"
                className="flex-1"
              >
                <ShieldCheck size={16} /> Xác nhận phán quyết
              </Btn>
              <Btn onClick={() => setResolutionOrderId(null)} variant="ghost" size="md">
                Hủy
              </Btn>
            </div>
          </div>
        </Modal>
      )}

      {/* 4. Modal Category Management */}
      {categoryModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => setCategoryModalOpen(false)}
          title="Quản lý Danh mục Thể loại Sách"
          maxWidth="max-w-lg"
        >
          <div className="space-y-4 text-xs">
            <form onSubmit={handleCreateCategory} className="flex gap-2">
              <input
                required
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="Nhập tên thể loại sách mới..."
                className="flex-1 text-xs border border-slate-300 rounded-xl px-3 py-2 bg-slate-50 focus:outline-none focus:border-indigo-500"
              />
              <Btn type="submit" color="#4f46e5" size="sm">
                <Plus size={14} /> Thêm thể loại
              </Btn>
            </form>

            <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl p-2">
              {categories.map((cat) => (
                <div key={cat.id} className="py-2 px-2 flex items-center justify-between hover:bg-slate-50 rounded-lg">
                  {editingCatId === cat.id ? (
                    <div className="flex items-center gap-2 flex-1 mr-2">
                      <input
                        value={editingCatName}
                        onChange={(e) => setEditingCatName(e.target.value)}
                        className="flex-1 text-xs border border-blue-400 rounded-lg px-2 py-1 bg-white"
                      />
                      <button
                        onClick={() => handleSaveEditCategory(cat.id)}
                        className="text-emerald-600 font-bold hover:underline cursor-pointer"
                      >
                        Lưu
                      </button>
                      <button
                        onClick={() => setEditingCatId(null)}
                        className="text-slate-400 hover:underline cursor-pointer"
                      >
                        Hủy
                      </button>
                    </div>
                  ) : (
                    <span className="font-semibold text-slate-800">{cat.name}</span>
                  )}

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setEditingCatId(cat.id);
                        setEditingCatName(cat.name);
                      }}
                      className="text-slate-400 hover:text-blue-600 cursor-pointer"
                      title="Sửa tên"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(cat.id)}
                      className="text-slate-400 hover:text-rose-600 cursor-pointer"
                      title="Xóa thể loại"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-right pt-2">
              <Btn onClick={() => setCategoryModalOpen(false)} variant="ghost" size="sm">
                Đóng
              </Btn>
            </div>
          </div>
        </Modal>
      )}

      {/* 5. Modal User Detail 360 */}
      {selectedUserDetail && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedUserDetail(null)}
          title={`Hồ sơ chi tiết 360°: ${selectedUserDetail.user.name}`}
          maxWidth="max-w-xl"
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl space-y-1">
              <p>
                <strong>Email:</strong> {selectedUserDetail.user.email}
              </p>
              <p>
                <strong>Số điện thoại:</strong> {selectedUserDetail.user.phone || "Chưa cập nhật"}
              </p>
              <p>
                <strong>Địa chỉ:</strong> {selectedUserDetail.user.address || "Chưa cập nhật"}
              </p>
              <p>
                <strong>Vai trò:</strong> {selectedUserDetail.user.role.toUpperCase()}
              </p>
              <p>
                <strong>Trạng thái:</strong> {selectedUserDetail.user.status || "ACTIVE"}
              </p>
            </div>

            <div>
              <h4 className="font-bold text-slate-800 mb-2">Lịch sử đơn hàng ({selectedUserDetail.orders.length})</h4>
              <div className="max-h-36 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl p-2">
                {selectedUserDetail.orders.map((o) => (
                  <div key={o.id} className="py-1 flex justify-between">
                    <span>
                      Đơn #{o.id} • {o.createdAt}
                    </span>
                    <span className="font-bold text-blue-600">{fmt(o.totalAmount)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-bold text-slate-800 mb-2">
                Lịch sử dòng tiền ({selectedUserDetail.transactions.length})
              </h4>
              <div className="max-h-36 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl p-2">
                {selectedUserDetail.transactions.map((t) => (
                  <div key={t.id} className="py-1 flex justify-between">
                    <span>
                      {t.type} • Đơn #{t.orderId}
                    </span>
                    <span className="font-bold text-slate-800">{fmt(t.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* 6. Modal Create New Admin */}
      {createAdminModalOpen && (
        <Modal
          isOpen={true}
          title="Tạo tài khoản Quản trị viên mới (Admin / Super Admin)"
          onClose={() => setCreateAdminModalOpen(false)}
        >
          <form onSubmit={handleCreateAdmin} className="space-y-4 text-xs sm:text-sm">
            {createAdminSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 font-semibold flex items-center gap-2">
                <Check size={16} /> {createAdminSuccess}
              </div>
            )}

            {createAdminError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-semibold flex items-center gap-2">
                <AlertTriangle size={16} /> {createAdminError}
              </div>
            )}

            {/* Role Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Cấp độ phân quyền *
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label
                  className={`p-3 rounded-xl border flex flex-col gap-1 cursor-pointer transition-all ${adminRole === "ADMIN"
                      ? "border-indigo-600 bg-indigo-50/50 shadow-xs"
                      : "border-slate-200 bg-white hover:bg-slate-50"
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-black text-indigo-900 text-xs flex items-center gap-1.5">
                      <ShieldCheck size={15} className="text-indigo-600" /> ADMIN
                    </span>
                    <input
                      type="radio"
                      name="adminRole"
                      value="ADMIN"
                      checked={adminRole === "ADMIN"}
                      onChange={() => setAdminRole("ADMIN")}
                      className="text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                  </div>
                  <span className="text-[11px] text-slate-500">
                    Quản trị viên tiêu chuẩn (Duyệt shop, đơn hàng, sách, khiếu nại)
                  </span>
                </label>

                <label
                  className={`p-3 rounded-xl border flex flex-col gap-1 cursor-pointer transition-all ${adminRole === "SUPER_ADMIN"
                      ? "border-purple-600 bg-purple-50/50 shadow-xs"
                      : "border-slate-200 bg-white hover:bg-slate-50"
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-black text-purple-900 text-xs flex items-center gap-1.5">
                      <Sparkles size={15} className="text-purple-600" /> SUPER ADMIN
                    </span>
                    <input
                      type="radio"
                      name="adminRole"
                      value="SUPER_ADMIN"
                      checked={adminRole === "SUPER_ADMIN"}
                      onChange={() => setAdminRole("SUPER_ADMIN")}
                      className="text-purple-600 focus:ring-purple-500 cursor-pointer"
                    />
                  </div>
                  <span className="text-[11px] text-slate-500">
                    Toàn quyền hệ thống + Quản lý & Cấp quyền tài khoản Admin
                  </span>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Họ và tên
                </label>
                <input
                  type="text"
                  value={adminFullName}
                  onChange={(e) => setAdminFullName(e.target.value)}
                  placeholder="Ví dụ: Nguyễn Văn Quản Trị"
                  className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tên đăng nhập (Username) *
                </label>
                <input
                  type="text"
                  required
                  value={adminUsername}
                  onChange={(e) => setAdminUsername(e.target.value)}
                  placeholder="admin_staff01"
                  className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email làm việc *
                </label>
                <input
                  type="email"
                  required
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="admin@bookverse.com"
                  className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mật khẩu khởi tạo *
                </label>
                <div className="relative">
                  <input
                    type={showAdminPassword ? "text" : "password"}
                    required
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="Tối thiểu 6 ký tự"
                    className="w-full text-xs px-3 pr-9 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAdminPassword(!showAdminPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showAdminPassword ? <Eye size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Số điện thoại liên hệ
                </label>
                <input
                  type="text"
                  value={adminPhone}
                  onChange={(e) => setAdminPhone(e.target.value)}
                  placeholder="0988123456"
                  className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Địa chỉ / Phòng ban phụ trách
                </label>
                <input
                  type="text"
                  value={adminAddress}
                  onChange={(e) => setAdminAddress(e.target.value)}
                  placeholder="Văn phòng BookVerse TP.HCM"
                  className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <Btn
                type="button"
                onClick={() => setCreateAdminModalOpen(false)}
                variant="ghost"
                size="sm"
              >
                Hủy
              </Btn>
              <Btn
                type="submit"
                disabled={creatingAdmin}
                color="#4f46e5"
                size="sm"
                className="font-bold"
              >
                <UserPlus size={15} /> {creatingAdmin ? "Đang tạo tài khoản..." : "Xác nhận tạo Admin"}
              </Btn>
            </div>
          </form>
        </Modal>
      )}

      {/* 7. Live Chat Drawer with Shop */}
      {chatOpen && (
        <ChatDrawer
          isOpen={chatOpen}
          onClose={() => setChatOpen(false)}
          shopId={chatShopId}
          shopName={chatShopName}
        />
      )}
    </div>
  );
};
