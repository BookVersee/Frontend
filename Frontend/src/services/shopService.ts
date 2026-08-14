import { apiClient } from "./api";
import { Order, Book, OrderStatus } from "../types";
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
      return INITIAL_BOOKS.filter((b) => b.shopId === shopId);
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
};
