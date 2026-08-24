import { apiClient } from "./api";
import { Order, Book, OrderStatus, OrderFeedback } from "../types";
import { INITIAL_ORDERS, INITIAL_BOOKS } from "./mockData";

export const shopService = {
  async getShopOrders(shopId = 1): Promise<Order[]> {
    try {
      const res = await apiClient.get<Order[]>(`/shops/${shopId}/orders`);
      return res.data;
    } catch {
      return INITIAL_ORDERS.filter((o) => o.shopId === shopId);
    }
  },

  async updateOrderStatus(orderId: number, status: OrderStatus): Promise<boolean> {
    try {
      await apiClient.patch(`/orders/${orderId}/status`, { status });
      return true;
    } catch {
      const order = INITIAL_ORDERS.find((o) => o.id === orderId);
      if (order) {
        order.orderStatus = status;
        if (status === "SHIPPED") {
          order.tracking = {
            number: order.tracking?.number || `GHN${Math.floor(100000000 + Math.random() * 900000000)}`,
            carrier: "Giao Hàng Nhanh",
            status: "TRANSIT",
            estimated: "2-3 ngày tới",
            note: "Đã bàn giao cho nhân viên giao hàng GHN",
          };
        }
      }
      return true;
    }
  },

  async getShopProducts(shopId = 1): Promise<Book[]> {
    try {
      const res = await apiClient.get<Book[]>(`/shops/${shopId}/books`);
      return res.data;
    } catch {
      return INITIAL_BOOKS.filter((b) => b.shopId === shopId && b.status !== "HIDDEN");
    }
  },

  async addProduct(product: Omit<Book, "id">): Promise<Book> {
    try {
      const res = await apiClient.post<Book>("/books", product);
      return res.data;
    } catch {
      const newBook: Book = {
        ...product,
        id: Date.now(),
      };
      INITIAL_BOOKS.unshift(newBook);
      return newBook;
    }
  },

  async updateProduct(id: number, product: Partial<Book>): Promise<Book> {
    try {
      const res = await apiClient.put<Book>(`/books/${id}`, product);
      return res.data;
    } catch {
      const idx = INITIAL_BOOKS.findIndex((b) => b.id === id);
      if (idx !== -1) {
        INITIAL_BOOKS[idx] = { ...INITIAL_BOOKS[idx], ...product };
        return INITIAL_BOOKS[idx];
      }
      throw new Error("Không tìm thấy sách");
    }
  },

  async deleteProduct(id: number): Promise<boolean> {
    try {
      await apiClient.delete(`/books/${id}`);
      return true;
    } catch {
      const idx = INITIAL_BOOKS.findIndex((b) => b.id === id);
      if (idx !== -1) {
        INITIAL_BOOKS[idx].status = "HIDDEN";
      }
      return true;
    }
  },

  async getShopFeedbacks(shopId = 1): Promise<{ orderId: number; feedback: OrderFeedback }[]> {
    try {
      const res = await apiClient.get<{ orderId: number; feedback: OrderFeedback }[]>(`/shops/${shopId}/feedbacks`);
      return res.data;
    } catch {
      return INITIAL_ORDERS
        .filter((o) => o.shopId === shopId && o.feedback)
        .map((o) => ({
          orderId: o.id,
          feedback: o.feedback!,
        }));
    }
  },

  async replyFeedback(orderId: number, reply: string): Promise<boolean> {
    try {
      await apiClient.post(`/orders/${orderId}/feedback/reply`, { shopReply: reply });
      return true;
    } catch {
      const order = INITIAL_ORDERS.find((o) => o.id === orderId);
      if (order && order.feedback) {
        order.feedback.shopReply = reply;
        order.feedback.shopRepliedAt = new Date().toISOString().split("T")[0];
      }
      return true;
    }
  },

  async getRevenueStats(shopId = 1, period: "day" | "month" | "year" = "month") {
    try {
      const res = await apiClient.get(`/shops/${shopId}/revenue?period=${period}`);
      return res.data;
    } catch {
      const orders = INITIAL_ORDERS.filter((o) => o.shopId === shopId && o.orderStatus === "DELIVERED");
      const total = orders.reduce((s, o) => s + o.totalAmount, 0);
      return {
        period,
        totalRevenue: total,
        totalOrders: orders.length,
        deliveredCount: orders.length,
      };
    }
  },
};
