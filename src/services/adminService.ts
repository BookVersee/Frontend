import { apiClient } from "./api";
import { Order, Transaction, User, ReturnStatus, Shop, DisputeLevel } from "../types";
import { INITIAL_ORDERS, INITIAL_TRANSACTIONS, DEMO_USERS, INITIAL_SHOPS } from "./mockData";

export const adminService = {
  async getAllOrders(): Promise<Order[]> {
    try {
      const res = await apiClient.get<Order[]>("/admin/orders");
      return res.data;
    } catch {
      return INITIAL_ORDERS;
    }
  },

  async getTransactions(): Promise<Transaction[]> {
    try {
      const res = await apiClient.get<Transaction[]>("/admin/transactions");
      return res.data;
    } catch {
      return INITIAL_TRANSACTIONS;
    }
  },

  async getUsers(role?: string, status?: string): Promise<User[]> {
    try {
      const res = await apiClient.get<User[]>("/admin/users", { params: { role, status } });
      return res.data;
    } catch {
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

  async getUserDetail(userId: number): Promise<{
    user: User;
    orders: Order[];
    transactions: Transaction[];
  } | null> {
    try {
      const res = await apiClient.get(`/admin/users/${userId}`);
      return res.data;
    } catch {
      const user = DEMO_USERS.find((u) => u.id === userId);
      if (!user) return null;
      const orders = INITIAL_ORDERS.filter((o) => o.customerId === userId || o.shopId === user.shopId);
      const transactions = INITIAL_TRANSACTIONS.filter((t) => t.userId === userId || t.orderId === orders[0]?.id);
      return { user, orders, transactions };
    }
  },

  async toggleUserStatus(userId: number): Promise<User> {
    try {
      const res = await apiClient.patch<User>(`/admin/users/${userId}/toggle-status`);
      return res.data;
    } catch {
      const user = DEMO_USERS.find((u) => u.id === userId);
      if (user) {
        user.status = user.status === "ACTIVE" ? "LOCKED" : "ACTIVE";
        return user;
      }
      throw new Error("Không tìm thấy người dùng");
    }
  },

  async getPendingShops(): Promise<Shop[]> {
    try {
      const res = await apiClient.get<Shop[]>("/admin/shops/pending");
      return res.data;
    } catch {
      return INITIAL_SHOPS.filter((s) => s.status === "PENDING");
    }
  },

  async approveShop(shopId: number): Promise<boolean> {
    try {
      await apiClient.patch(`/admin/shops/${shopId}/approve`);
      return true;
    } catch {
      const shop = INITIAL_SHOPS.find((s) => s.id === shopId);
      if (shop) {
        shop.status = "ACTIVE";
        const owner = DEMO_USERS.find((u) => u.id === shop.ownerId);
        if (owner) {
          owner.shopStatus = "ACTIVE";
          owner.shopId = shop.id;
          owner.shopName = shop.name;
        }
      }
      return true;
    }
  },

  async rejectShop(shopId: number): Promise<boolean> {
    try {
      await apiClient.patch(`/admin/shops/${shopId}/reject`);
      return true;
    } catch {
      const shop = INITIAL_SHOPS.find((s) => s.id === shopId);
      if (shop) {
        shop.status = "REJECTED";
        const owner = DEMO_USERS.find((u) => u.id === shop.ownerId);
        if (owner) {
          owner.shopStatus = "REJECTED";
        }
      }
      return true;
    }
  },

  async getDisputes(level?: DisputeLevel): Promise<Order[]> {
    try {
      const res = await apiClient.get<Order[]>("/admin/disputes", { params: { level } });
      return res.data;
    } catch {
      let orders = INITIAL_ORDERS.filter((o) => o.returnRequest);
      if (level) {
        orders = orders.filter((o) => o.returnRequest?.disputeStatus === level);
      }
      return orders;
    }
  },

  async handleReturnRequest(
    orderId: number,
    status: ReturnStatus,
    adminResolutionNote = ""
  ): Promise<boolean> {
    try {
      await apiClient.patch(`/admin/returns/${orderId}`, { status, adminResolutionNote });
      return true;
    } catch {
      const order = INITIAL_ORDERS.find((o) => o.id === orderId);
      if (order && order.returnRequest) {
        order.returnRequest.status = status;
        order.returnRequest.disputeStatus = "CLOSED";
        order.returnRequest.adminResolutionNote = adminResolutionNote;
        if (status === "APPROVED") {
          order.orderStatus = "RETURNED";
          order.paymentStatus = "REFUNDED";
          INITIAL_TRANSACTIONS.push({
            id: Date.now(),
            orderId: order.id,
            userId: order.customerId,
            amount: order.returnRequest.refundAmount,
            type: "REFUND",
            paidBy: "PLATFORM (Admin phê duyệt hoàn tiền)",
            createdAt: new Date().toISOString().replace("T", " ").substring(0, 16),
            code: `REF${Date.now().toString().slice(-8)}`,
            status: "SUCCESS",
          });
        }
      }
      return true;
    }
  },
};
