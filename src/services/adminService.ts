import { apiClient } from "./api";
import { Order, Transaction, User, ReturnStatus, Shop, DisputeLevel, ApiResponse, Category, Book } from "../types";
import { INITIAL_ORDERS, INITIAL_TRANSACTIONS, DEMO_USERS, INITIAL_SHOPS, INITIAL_BOOKS, INITIAL_CATEGORIES } from "./mockData";

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
        customerName: o.userFullName,
        customerPhone: "",
        shopId: o.shopId,
        shopName: o.shopName,
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
        paymentMethod: "COD",
        shippingAddress: o.shippingAddress,
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
        }
      });
      const pagedData = res.data.data;
      const items = pagedData.items || pagedData || [];
      return items.map((u: any) => ({
        id: u.id,
        name: u.fullName || u.username,
        email: u.email,
        role: (u.role?.toLowerCase() as any) || "customer",
        phone: u.phone,
        address: u.address,
        status: u.status,
        createdAt: u.createdAt,
        balance: 0,
      }));
    } catch (error) {
      console.warn("getUsers API error, falling back to mock:", error);
      let list = DEMO_USERS;
      if (role) {
        list = list.filter((u) => u.role === role);
      }
      if (status) {
        list = list.filter((u) => u.status === status);
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
        params: { id: userId }
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
        orders: [],
        transactions: [],
      };
    } catch (error) {
      console.warn("getUserDetail API error, falling back to mock:", error);
      const user = DEMO_USERS.find((u) => String(u.id) === String(userId));
      if (!user) return null;
      const orders = INITIAL_ORDERS.filter((o) => String(o.customerId) === String(userId) || String(o.shopId) === String(user.shopId));
      const transactions = INITIAL_TRANSACTIONS.filter((t) => String(t.userId) === String(userId) || String(t.orderId) === String(orders[0]?.id));
      return { user, orders, transactions };
    }
  },

  // 4. Khóa/Mở tài khoản người dùng (UpdateUserStatus)
  async toggleUserStatus(userId: string | number, currentStatus?: string): Promise<boolean> {
    try {
      const nextStatus = currentStatus === "ACTIVE" ? "LOCKED" : "ACTIVE";
      await apiClient.put("/admin/UpdateUserStatus", {
        status: nextStatus
      }, {
        params: { id: userId }
      });
      return true;
    } catch (error) {
      console.warn("toggleUserStatus API error, falling back to mock:", error);
      const user = DEMO_USERS.find((u) => String(u.id) === String(userId));
      if (user) {
        user.status = user.status === "ACTIVE" ? "LOCKED" : "ACTIVE";
        return true;
      }
      return false;
    }
  },

  // 5. Danh sách Shop chờ duyệt (GetPendingShops) & Tất cả Shop (GetAllShops)
  async getPendingShops(): Promise<Shop[]> {
    try {
      const res = await apiClient.get<ApiResponse<any[]>>("/admin/GetPendingShops");
      const shops = res.data.data || [];
      return shops.map((s: any) => ({
        id: s.id,
        ownerId: s.userId,
        name: s.shopName,
        email: "owner@bookverse.com",
        phone: s.phone || "",
        address: s.address || "",
        description: s.description || "",
        status: s.status || "PENDING",
        rating: s.rating || 0,
        reviewCount: 0,
        bookCount: s.totalBooks || 0,
        joinedDate: s.createdAt,
      }));
    } catch (error) {
      console.warn("getPendingShops API error, falling back to mock:", error);
      return INITIAL_SHOPS.filter((s) => s.status === "PENDING");
    }
  },

  // 6. Phê duyệt Shop (ApproveShop)
  async approveShop(shopId: string | number): Promise<boolean> {
    try {
      await apiClient.post("/admin/ApproveShop", null, {
        params: { shopId }
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

  // 7. Khóa/Từ chối Shop (LockShop)
  async rejectShop(shopId: string | number, reason = "Vi phạm chính sách sàn"): Promise<boolean> {
    try {
      await apiClient.post("/admin/LockShop", {
        reason
      }, {
        params: { shopId }
      });
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

  // 8. Danh sách đơn khiếu nại hoàn tiền (GetDisputes)
  async getDisputes(status?: ReturnStatus): Promise<Order[]> {
    try {
      const res = await apiClient.get<ApiResponse<any[]>>("/admin/GetDisputes", {
        params: { status }
      });
      const disputes = res.data.data || [];
      return disputes.map((d: any) => ({
        id: d.orderId || d.id,
        customerId: d.userId,
        customerName: d.userFullName || "Khách hàng",
        customerPhone: "",
        shopId: d.shopId,
        shopName: d.shopName,
        items: [],
        totalAmount: d.refundAmount || 0,
        shippingFee: 0,
        orderStatus: "RETURNED",
        paymentStatus: "REFUNDED",
        paymentMethod: "COD",
        shippingAddress: "",
        createdAt: d.createdAt,
        updatedAt: d.createdAt,
        returnRequest: {
          id: d.id,
          orderId: d.orderId,
          reason: d.detailedReason || d.reason,
          reasonType: d.reasonType,
          status: d.status,
          refundAmount: d.refundAmount,
          createdAt: d.createdAt,
          evidenceImage: d.imageUrl,
          adminResolutionNote: d.adminResolutionNote,
          disputeStatus: d.status === "PENDING" ? "OPEN" : "CLOSED",
        }
      }));
    } catch (error) {
      console.warn("getDisputes API error, falling back to mock:", error);
      let orders = INITIAL_ORDERS.filter((o) => o.returnRequest);
      return orders;
    }
  },

  // 9. Phê duyệt/từ chối giải quyết khiếu nại (ResolveDispute)
  async handleReturnRequest(
    disputeId: string | number,
    status: ReturnStatus,
    adminResolutionNote = ""
  ): Promise<boolean> {
    try {
      await apiClient.post("/admin/ResolveDispute", {
        isAccepted: status === "APPROVED",
        adminResolutionNote: adminResolutionNote || (status === "APPROVED" ? "Phê duyệt hoàn tiền cho khách" : "Từ chối khiếu nại")
      }, {
        params: { id: disputeId }
      });
      return true;
    } catch (error) {
      console.warn("handleReturnRequest API error, falling back to mock:", error);
      return true;
    }
  },

  // 10. Danh sách Thể loại sách (GetAllCategories) & Thêm/Sửa/Xóa
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
      const newCat: Category = { id: Date.now(), name };
      INITIAL_CATEGORIES.push(newCat);
      return newCat;
    }
  },

  async updateCategory(id: string | number, name: string): Promise<Category> {
    try {
      const res = await apiClient.put<ApiResponse<any>>("/admin/UpdateCategory", { name }, {
        params: { id }
      });
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
      await apiClient.delete("/admin/DeleteCategory", {
        params: { id }
      });
      return true;
    } catch (error) {
      console.warn("deleteCategory API error, falling back to mock:", error);
      const idx = INITIAL_CATEGORIES.findIndex((c) => String(c.id) === String(id));
      if (idx !== -1) INITIAL_CATEGORIES.splice(idx, 1);
      return true;
    }
  },

  // 11. Kiểm duyệt & Ẩn sách vi phạm (HideBook)
  async hideBook(bookId: string | number): Promise<boolean> {
    try {
      await apiClient.put("/admin/HideBook", null, {
        params: { bookId }
      });
      return true;
    } catch (error) {
      console.warn("hideBook API error, falling back to mock:", error);
      const b = INITIAL_BOOKS.find((item) => String(item.id) === String(bookId));
      if (b) b.status = "HIDDEN";
      return true;
    }
  },

  // 12. Thống kê & Báo cáo sàn (GetDashboardStatistics & GetRevenueReport)
  async getDashboardStats(period = "month") {
    try {
      const res = await apiClient.get<ApiResponse<any>>("/admin/GetDashboardStatistics", {
        params: { period }
      });
      return res.data.data;
    } catch (error) {
      console.warn("getDashboardStats API error, falling back to mock:", error);
      return null;
    }
  },

  async getRevenueReport(period = "month") {
    try {
      const res = await apiClient.get<ApiResponse<any>>("/admin/GetRevenueReport", {
        params: { period }
      });
      return res.data.data;
    } catch (error) {
      console.warn("getRevenueReport API error, falling back to mock:", error);
      return null;
    }
  },

  async getTransactions(): Promise<Transaction[]> {
    return INITIAL_TRANSACTIONS;
  }
};
