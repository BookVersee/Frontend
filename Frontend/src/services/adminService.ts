import { apiClient } from "./api";
import { Order, Transaction, User, ReturnStatus } from "../types";
import { INITIAL_ORDERS, INITIAL_TRANSACTIONS, DEMO_USERS } from "./mockData";

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

  async getUsers(): Promise<User[]> {
    try {
      const res = await apiClient.get<User[]>("/admin/users");
      return res.data;
    } catch {
      return DEMO_USERS;
    }
  },

  async handleReturnRequest(orderId: number, status: ReturnStatus): Promise<boolean> {
    try {
      await apiClient.patch(`/admin/returns/${orderId}`, { status });
      return true;
    } catch {
      const order = INITIAL_ORDERS.find((o) => o.id === orderId);
      if (order && order.returnRequest) {
        order.returnRequest.status = status;
        if (status === "APPROVED") {
          order.orderStatus = "RETURNED";
          order.paymentStatus = "REFUNDED";
          INITIAL_TRANSACTIONS.push({
            id: Date.now(),
            orderId: order.id,
            amount: order.returnRequest.refundAmount,
            type: "REFUND",
            paidBy: "PLATFORM",
            createdAt: new Date().toISOString().replace("T", " ").substring(0, 16),
          });
        }
      }
      return true;
    }
  },
};
