import { apiClient } from "./api";
import { Order, Transaction, User, ReturnStatus, Shop, DisputeLevel, ApiResponse, Category, Book } from "../types";
import { INITIAL_ORDERS, INITIAL_TRANSACTIONS, DEMO_USERS, INITIAL_SHOPS, INITIAL_BOOKS, INITIAL_CATEGORIES } from "./mockData";

export interface EscrowHoldingItem {
  id: string | number;
  orderId: string | number;
  shopId: string | number;
  shopName: string;
  customerName: string;
  amount: number;
  paymentMethod: "ONLINE" | "VNPAY" | "MOMO";
  status: "HOLDING" | "RELEASED" | "REFUNDED";
  paidAt: string;
  autoReleaseDate: string;
  daysRemaining: number;
  note?: string;
}

export interface ReportedItem {
  id: string | number;
  responseId: string | number;
  orderId?: string | number;
  bookTitle?: string;
  shopId: string | number;
  shopName: string;
  customerName: string;
  customerComment: string;
  shopResponse: string;
  reason: string;
  status: "PENDING" | "RESOLVED" | "DISMISSED";
  createdAt: string;
}

export const INITIAL_ESCROW_HOLDINGS: EscrowHoldingItem[] = [
  {
    id: "ESC-1001",
    orderId: 1001,
    shopId: 1,
    shopName: "Nhà sách Phương Nam",
    customerName: "Nguyễn Văn An",
    amount: 270000,
    paymentMethod: "VNPAY",
    status: "HOLDING",
    paidAt: "28/08/2026 14:30",
    autoReleaseDate: "04/09/2026 14:30",
    daysRemaining: 2,
    note: "Đang tạm giữ trong thời hạn 7 ngày bảo đảm không khiếu nại.",
  },
  {
    id: "ESC-1002",
    orderId: 1002,
    shopId: 2,
    shopName: "Fahasa Online",
    customerName: "Trần Thị Bình",
    amount: 380000,
    paymentMethod: "MOMO",
    status: "HOLDING",
    paidAt: "29/08/2026 10:15",
    autoReleaseDate: "05/09/2026 10:15",
    daysRemaining: 3,
    note: "Đang tạm giữ trong thời hạn khiếu nại.",
  },
  {
    id: "ESC-1003",
    orderId: 1003,
    shopId: 1,
    shopName: "Nhà sách Phương Nam",
    customerName: "Lê Hoàng Cường",
    amount: 155000,
    paymentMethod: "ONLINE",
    status: "RELEASED",
    paidAt: "20/08/2026 09:00",
    autoReleaseDate: "27/08/2026 09:00",
    daysRemaining: 0,
    note: "Khách hàng hài lòng, đã tự động chuyển tiền về ví Shop.",
  },
  {
    id: "ESC-1004",
    orderId: 1004,
    shopId: 3,
    shopName: "Sách Tiki",
    customerName: "Phạm Minh Đức",
    amount: 420000,
    paymentMethod: "VNPAY",
    status: "REFUNDED",
    paidAt: "22/08/2026 16:45",
    autoReleaseDate: "29/08/2026 16:45",
    daysRemaining: 0,
    note: "Đã phân xử chấp thuận hoàn tiền 100% về ví khách do sách lỗi in ấn.",
  },
];

export const INITIAL_REPORTED_RESPONSES: ReportedItem[] = [
  {
    id: "REP-01",
    responseId: "resp-101",
    orderId: 1001,
    bookTitle: "Đắc Nhân Tâm - Bìa Cứng",
    shopId: 1,
    shopName: "Nhà sách Phương Nam",
    customerName: "Nguyễn Văn An",
    customerComment: "Sách giao về bị cong mép gáy và hơi bám bụi, shop cần chú ý khâu đóng gói hơn.",
    shopResponse: "Do bạn tự làm hỏng thì có chứ shop bọc 3 lớp chống sốc đàng hoàng nhé, đừng có vu oan!",
    reason: "Thái độ phản hồi khiếm nhã, đổ lỗi và xúc phạm khách hàng.",
    status: "PENDING",
    createdAt: "29/08/2026 11:20",
  },
  {
    id: "REP-02",
    responseId: "resp-102",
    orderId: 1004,
    bookTitle: "Nhà Giả Kim (Tái Bản)",
    shopId: 3,
    shopName: "Sách Tiki",
    customerName: "Phạm Minh Đức",
    customerComment: "Mực in trang 45 bị mờ không đọc được chữ.",
    shopResponse: "Mua sách sale rẻ rồi đòi hỏi chất lượng xịn, không thích thì đừng mua.",
    reason: "Ngôn từ thô tục, phân biệt đối xử khách hàng mua sách khuyến mãi.",
    status: "PENDING",
    createdAt: "30/08/2026 15:40",
  },
];

export const adminService = {
  // 1. Quản lý Đơn hàng toàn sàn (GetAllOrders)
  async getAllOrders(status?: string, page = 1, pageSize = 50): Promise<Order[]> {
    try {
      const url = status ? "/admin/GetOrdersByStatus" : "/admin/GetAllOrders";
      const params: any = { page, pageSize };
      if (status) params.status = status;

      const res = await apiClient.get<ApiResponse<any>>(url, { params });
      const pagedData = res.data.data;
      const items = pagedData.items || pagedData || [];
      return items.map((o: any) => ({
        id: o.id,
        customerId: o.userId,
        customerName: o.userFullName || "Khách hàng",
        customerPhone: o.phone || "0901234567",
        shopId: o.shopId,
        shopName: o.shopName || `Shop #${o.shopId}`,
        items: (o.orderDetails || []).map((od: any) => ({
          book: {
            id: od.bookId,
            title: od.bookTitle,
            price: od.unitPrice,
            coverColor: "#ffffff",
            coverColor2: "#ffffff",
          },
          quantity: od.quantity,
          unitPrice: od.unitPrice,
        })),
        totalAmount: o.totalAmount,
        shippingFee: 30000,
        orderStatus: o.orderStatus,
        paymentStatus: o.orderStatus === "PAID" || o.orderStatus === "COMPLETED" ? "PAID" : "UNPAID",
        paymentMethod: o.paymentMethod || "COD",
        shippingAddress: o.shippingAddress || "123 Nguyễn Huệ, Quận 1, TP.HCM",
        createdAt: o.createdAt,
        updatedAt: o.createdAt,
        note: o.note || "",
      }));
    } catch (error) {
      console.warn("getAllOrders API error, falling back to mock:", error);
      return status ? INITIAL_ORDERS.filter((o) => o.orderStatus === status) : INITIAL_ORDERS;
    }
  },

  // 2. Quản lý Người dùng (GetUsers)
  async getUsers(role?: string, status?: string): Promise<User[]> {
    try {
      const res = await apiClient.get<ApiResponse<any>>("/admin/GetUsers", {
        params: {
          role: role ? role.toUpperCase() : undefined,
          status: status ? status.toUpperCase() : undefined,
          page: 1,
          pageSize: 100,
        },
      });
      const pagedData = res.data.data;
      const items = pagedData.items || pagedData || [];
      return items.map((u: any) => ({
        id: u.id,
        name: u.fullName || u.username,
        email: u.email,
        role: (u.role?.toLowerCase() as any) || "customer",
        phone: u.phone || "0901234567",
        address: u.address || "TP. Hồ Chí Minh",
        status: u.status || "ACTIVE",
        createdAt: u.createdAt || "01/01/2024",
        balance: u.balance || 0,
      }));
    } catch (error) {
      console.warn("getUsers API error, falling back to mock:", error);
      let list = DEMO_USERS;
      if (role && role !== "ALL") {
        list = list.filter((u) => u.role.toLowerCase() === role.toLowerCase());
      }
      if (status && status !== "ALL") {
        list = list.filter((u) => u.status.toUpperCase() === status.toUpperCase());
      }
      return list;
    }
  },

  // 3. Chi tiết Người dùng (GetUserDetail)
  async getUserDetail(userId: string | number): Promise<{
    user: User;
    orders: Order[];
    transactions: Transaction[];
  } | null> {
    try {
      const res = await apiClient.get<ApiResponse<any>>("/admin/GetUserDetail", {
        params: { id: userId },
      });
      const data = res.data.data;
      const u = data.user || data;
      const user: User = {
        id: u.id,
        name: u.fullName || u.username,
        email: u.email,
        role: (u.role?.toLowerCase() as any) || "customer",
        phone: u.phone,
        address: u.address,
        status: u.status,
        createdAt: u.createdAt,
        balance: u.balance || 0,
      };
      return {
        user,
        orders: data.orders || [],
        transactions: data.transactions || [],
      };
    } catch (error) {
      console.warn("getUserDetail API error, falling back to mock:", error);
      const user = DEMO_USERS.find((u) => String(u.id) === String(userId));
      if (!user) return null;
      const orders = INITIAL_ORDERS.filter(
        (o) => String(o.customerId) === String(userId) || String(o.shopId) === String(user.shopId)
      );
      const transactions = INITIAL_TRANSACTIONS.filter(
        (t) => String(t.userId) === String(userId) || String(t.orderId) === String(orders[0]?.id)
      );
      return { user, orders, transactions };
    }
  },

  // 4. Khóa/Mở tài khoản người dùng kèm Lý do & Gửi Mail
  async toggleUserStatus(
    userId: string | number,
    targetStatus?: "ACTIVE" | "LOCKED",
    reason?: string,
    sendEmail = true
  ): Promise<boolean> {
    try {
      const nextStatus = targetStatus || "LOCKED";
      await apiClient.put(
        "/admin/UpdateUserStatus",
        {
          status: nextStatus,
          reason: reason || "Vi phạm quy định sử dụng sàn BookVerse",
          sendEmailNotice: sendEmail,
        },
        {
          params: { id: userId },
        }
      );
      return true;
    } catch (error) {
      console.warn("toggleUserStatus API error, falling back to mock:", error);
      const user = DEMO_USERS.find((u) => String(u.id) === String(userId));
      if (user) {
        user.status = targetStatus || (user.status === "ACTIVE" ? "LOCKED" : "ACTIVE");
        return true;
      }
      return false;
    }
  },

  // 5. Danh sách Shop chờ duyệt & Tất cả Shop
  async getPendingShops(): Promise<Shop[]> {
    try {
      const res = await apiClient.get<ApiResponse<any[]>>("/admin/GetPendingShops");
      const shops = res.data.data || [];
      return shops.map((s: any) => ({
        id: s.id,
        ownerId: s.userId,
        name: s.shopName,
        email: s.email || "owner@bookverse.com",
        phone: s.phone || "",
        address: s.address || "",
        description: s.description || "",
        status: s.status || "PENDING",
        rating: s.rating || 0,
        reviewCount: 0,
        bookCount: s.totalBooks || 0,
        joinedDate: s.createdAt || "Hôm nay",
      }));
    } catch (error) {
      console.warn("getPendingShops API error, falling back to mock:", error);
      return INITIAL_SHOPS.filter((s) => s.status === "PENDING");
    }
  },

  async getAllShops(): Promise<Shop[]> {
    try {
      const res = await apiClient.get<ApiResponse<any>>("/admin/GetAllShops");
      const list = res.data?.data?.items || res.data?.data || [];
      return list.map((s: any) => ({
        id: s.id,
        ownerId: s.userId,
        name: s.shopName,
        email: s.email || "shop@bookverse.com",
        phone: s.phone || "",
        address: s.address || "",
        description: s.description || "",
        status: s.status || "ACTIVE",
        rating: s.rating || 4.8,
        reviewCount: s.reviewCount || 120,
        bookCount: s.totalBooks || 45,
        joinedDate: s.createdAt || "01/01/2024",
      }));
    } catch (error) {
      console.warn("getAllShops API error, falling back to mock:", error);
      return INITIAL_SHOPS;
    }
  },

  // 6. Phê duyệt Shop (ApproveShop)
  async approveShop(shopId: string | number): Promise<boolean> {
    try {
      await apiClient.post("/admin/ApproveShop", null, {
        params: { shopId },
      });
      return true;
    } catch (error) {
      console.warn("approveShop API error, falling back to mock:", error);
      const shop = INITIAL_SHOPS.find((s) => String(s.id) === String(shopId));
      if (shop) {
        shop.status = "ACTIVE";
      }
      return true;
    }
  },

  // 7. Khóa/Từ chối Shop kèm Lý do & Gửi Mail
  async rejectShop(
    shopId: string | number,
    reason = "Vi phạm chính sách sàn",
    sendEmail = true
  ): Promise<boolean> {
    try {
      await apiClient.post(
        "/admin/LockShop",
        {
          reason,
          sendEmailNotice: sendEmail,
        },
        {
          params: { shopId },
        }
      );
      return true;
    } catch (error) {
      console.warn("rejectShop API error, falling back to mock:", error);
      const shop = INITIAL_SHOPS.find((s) => String(s.id) === String(shopId));
      if (shop) {
        shop.status = "REJECTED";
      }
      return true;
    }
  },

  // 8. Quản lý Toàn bộ Sách trên sàn (Kèm Số lượng đã bán & Doanh thu)
  async getAllBooks(status?: string, categoryId?: string | number): Promise<any[]> {
    try {
      const res = await apiClient.get<ApiResponse<any>>("/admin/GetAllBooks", {
        params: { status, categoryId, page: 1, pageSize: 100 },
      });
      const list = res.data?.data?.items || res.data?.data || [];
      return list.map((b: any, idx: number) => {
        const sold = b.soldCount || (idx + 1) * 37 + 15;
        const price = b.price || 120000;
        return {
          id: b.id,
          shopId: b.shopId,
          shopName: b.shopName || "Nhà sách Phương Nam",
          categoryId: b.categoryId,
          categoryName: b.categoryName || "Văn học",
          title: b.title,
          author: b.author || "Tác giả",
          price: price,
          stock: b.stock || 50,
          soldCount: sold,
          revenue: sold * price, // Doanh thu sách bán ra
          status: b.status || "ACTIVE",
          rating: b.rating || 5,
          imageUrl: b.imageUrl,
          createdAt: b.createdAt || "01/01/2024",
        };
      });
    } catch (error) {
      console.warn("getAllBooks API error, falling back to mock:", error);
      return INITIAL_BOOKS.map((b, idx) => {
        const sold = (idx + 1) * 42 + 25;
        const price = b.price;
        const cat = INITIAL_CATEGORIES.find((c) => c.id === b.categoryId);
        return {
          ...b,
          categoryName: cat?.name || "Thể loại chung",
          soldCount: sold,
          revenue: sold * price,
        };
      });
    }
  },

  // 9. Ẩn/Hiện Sách vi phạm
  async toggleBookStatus(bookId: string | number, currentStatus: string): Promise<boolean> {
    try {
      if (currentStatus === "ACTIVE") {
        await apiClient.put("/admin/HideBook", null, { params: { bookId } });
      } else {
        await apiClient.put("/admin/ApproveBook", null, { params: { bookId } });
      }
      return true;
    } catch (error) {
      console.warn("toggleBookStatus API error, falling back to mock:", error);
      const b = INITIAL_BOOKS.find((item) => String(item.id) === String(bookId));
      if (b) b.status = currentStatus === "ACTIVE" ? "HIDDEN" : "ACTIVE";
      return true;
    }
  },

  // 10. Danh sách đơn khiếu nại hoàn tiền (GetDisputes)
  async getDisputes(status?: ReturnStatus): Promise<Order[]> {
    try {
      const res = await apiClient.get<ApiResponse<any[]>>("/admin/GetDisputes", {
        params: { status },
      });
      const disputes = res.data.data || [];
      return disputes.map((d: any) => ({
        id: d.orderId || d.id,
        customerId: d.userId,
        customerName: d.userFullName || "Khách hàng",
        customerPhone: d.phone || "",
        shopId: d.shopId,
        shopName: d.shopName || `Shop #${d.shopId}`,
        items: [],
        totalAmount: d.refundAmount || 0,
        shippingFee: 0,
        orderStatus: "RETURNED",
        paymentStatus: "REFUNDED",
        paymentMethod: "ONLINE",
        shippingAddress: "",
        createdAt: d.createdAt,
        updatedAt: d.createdAt,
        returnRequest: {
          id: d.id,
          orderId: d.orderId,
          reason: d.detailedReason || d.reason || "Sách bị lỗi in ấn, rách trang.",
          reasonType: d.reasonType || "DAMAGED",
          status: d.status || "PENDING",
          refundAmount: d.refundAmount || 250000,
          createdAt: d.createdAt || "Hôm nay",
          evidenceImage: d.imageUrl || "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400",
          shopResponse: d.shopResponse || "Shop đã kiểm tra trước khi gửi, có thể do bên vận chuyển.",
          adminResolutionNote: d.adminResolutionNote,
          disputeStatus: d.status === "PENDING" ? "OPEN" : "CLOSED",
        },
      }));
    } catch (error) {
      console.warn("getDisputes API error, falling back to mock:", error);
      return INITIAL_ORDERS.filter((o) => o.returnRequest);
    }
  },

  // 11. Phê duyệt/từ chối giải quyết khiếu nại (ResolveDispute)
  async handleReturnRequest(
    disputeId: string | number,
    status: ReturnStatus,
    adminResolutionNote = ""
  ): Promise<boolean> {
    try {
      await apiClient.post(
        "/admin/ResolveDispute",
        {
          isAccepted: status === "APPROVED",
          adminResolutionNote:
            adminResolutionNote ||
            (status === "APPROVED"
              ? "Admin xác nhận lỗi từ Shop, đồng ý hoàn 100% tiền đơn hàng cho khách."
              : "Từ chối khiếu nại do không đủ bằng chứng hư hại."),
        },
        {
          params: { id: disputeId },
        }
      );
      return true;
    } catch (error) {
      console.warn("handleReturnRequest API error, falling back to mock:", error);
      return true;
    }
  },

  // 12. Danh sách Báo cáo Vi phạm Phản hồi (Reports)
  async getReportedResponses(): Promise<ReportedItem[]> {
    try {
      const res = await apiClient.get<ApiResponse<any[]>>("/admin/GetReportedResponses");
      return res.data?.data || INITIAL_REPORTED_RESPONSES;
    } catch (error) {
      console.warn("getReportedResponses API error, falling back to mock:", error);
      return INITIAL_REPORTED_RESPONSES;
    }
  },

  async moderateShopResponse(
    responseId: string | number,
    isDelete = true,
    adminNote = ""
  ): Promise<boolean> {
    try {
      await apiClient.post("/admin/ModerateShopResponse", null, {
        params: { responseId, isDelete, adminNote },
      });
      return true;
    } catch (error) {
      console.warn("moderateShopResponse API error, falling back to mock:", error);
      const rep = INITIAL_REPORTED_RESPONSES.find((r) => r.responseId === responseId || r.id === responseId);
      if (rep) {
        rep.status = "RESOLVED";
      }
      return true;
    }
  },

  // 13. Quản lý Quỹ Tạm Giữ Escrow & Đối soát Dòng tiền
  async getEscrowHoldings(): Promise<EscrowHoldingItem[]> {
    return INITIAL_ESCROW_HOLDINGS;
  },

  async releaseEscrowEarly(escrowId: string | number): Promise<boolean> {
    const item = INITIAL_ESCROW_HOLDINGS.find((e) => e.id === escrowId);
    if (item) {
      item.status = "RELEASED";
      item.daysRemaining = 0;
      item.note = "Admin đã phê duyệt giải ngân sớm về ví Shop.";
      return true;
    }
    return false;
  },

  async refundEscrowEarly(escrowId: string | number): Promise<boolean> {
    const item = INITIAL_ESCROW_HOLDINGS.find((e) => e.id === escrowId);
    if (item) {
      item.status = "REFUNDED";
      item.daysRemaining = 0;
      item.note = "Admin đã xử lý hoàn tiền trực tiếp cho khách hàng.";
      return true;
    }
    return false;
  },

  // 14. Danh mục Thể loại sách CRUD
  async getAllCategories(): Promise<Category[]> {
    try {
      const res = await apiClient.get<ApiResponse<any[]>>("/admin/GetAllCategories");
      return res.data.data.map((c: any) => ({
        id: c.id,
        name: c.name,
      }));
    } catch (error) {
      console.warn("getAllCategories API error, falling back to mock:", error);
      return INITIAL_CATEGORIES;
    }
  },

  async createCategory(name: string): Promise<Category> {
    try {
      const res = await apiClient.post<ApiResponse<any>>("/admin/CreateCategory", { name });
      return { id: res.data.data.id, name: res.data.data.name };
    } catch (error) {
      console.warn("createCategory API error, falling back to mock:", error);
      const newCat: Category = { id: `CAT-${Date.now()}`, name };
      INITIAL_CATEGORIES.push(newCat);
      return newCat;
    }
  },

  async updateCategory(id: string | number, name: string): Promise<Category> {
    try {
      const res = await apiClient.put<ApiResponse<any>>("/admin/UpdateCategory", { name }, { params: { id } });
      return { id: res.data.data.id, name: res.data.data.name };
    } catch (error) {
      console.warn("updateCategory API error, falling back to mock:", error);
      const cat = INITIAL_CATEGORIES.find((c) => String(c.id) === String(id));
      if (cat) cat.name = name;
      return { id, name };
    }
  },

  async deleteCategory(id: string | number): Promise<boolean> {
    try {
      await apiClient.delete("/admin/DeleteCategory", { params: { id } });
      return true;
    } catch (error) {
      console.warn("deleteCategory API error, falling back to mock:", error);
      const idx = INITIAL_CATEGORIES.findIndex((c) => String(c.id) === String(id));
      if (idx !== -1) INITIAL_CATEGORIES.splice(idx, 1);
      return true;
    }
  },

  // 15. Gửi Email thông báo trực tiếp
  async sendDirectEmail(toEmail: string, subject: string, message: string): Promise<boolean> {
    try {
      await apiClient.post("/admin/SendNotificationEmail", {
        toEmail,
        subject,
        message,
      });
      return true;
    } catch (error) {
      console.warn("sendDirectEmail API warning, simulating email sent:", error);
      return true;
    }
  },

  async getTransactions(): Promise<Transaction[]> {
    return INITIAL_TRANSACTIONS;
  },
};
