import { apiClient } from "./api";
import { Order, CartItem, PaymentMethod } from "../types";
import { INITIAL_ORDERS } from "./mockData";

export const orderService = {
  async getOrders(customerId?: number): Promise<Order[]> {
    try {
      const url = customerId ? `/orders?customerId=${customerId}` : "/orders";
      const res = await apiClient.get<Order[]>(url);
      return res.data;
    } catch {
      return customerId
        ? INITIAL_ORDERS.filter((o) => o.customerId === customerId)
        : INITIAL_ORDERS;
    }
  },

  async getOrderById(orderId: number): Promise<Order | null> {
    try {
      const res = await apiClient.get<Order>(`/orders/${orderId}`);
      return res.data;
    } catch {
      return INITIAL_ORDERS.find((o) => o.id === orderId) || null;
    }
  },

  async createOrder(params: {
    customerId: number;
    customerName: string;
    customerPhone: string;
    cart: CartItem[];
    paymentMethod: PaymentMethod;
    shippingAddress: string;
    note?: string;
  }): Promise<Order[]> {
    const { customerId, customerName, customerPhone, cart, paymentMethod, shippingAddress, note } = params;
    
    // Group by shopId
    const shopGroups = new Map<number, CartItem[]>();
    cart.forEach((item) => {
      const shopId = item.book.shopId;
      const group = shopGroups.get(shopId) || [];
      group.push(item);
      shopGroups.set(shopId, group);
    });

    try {
      const res = await apiClient.post<Order[]>("/orders", {
        customerId,
        customerName,
        customerPhone,
        items: cart,
        paymentMethod,
        shippingAddress,
        note,
      });
      return res.data;
    } catch {
      const createdOrders: Order[] = [];
      const now = new Date();
      const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

      let baseId = 1000 + Math.floor(Math.random() * 8000);
      shopGroups.forEach((items, shopId) => {
        const totalAmount = items.reduce((s, i) => s + i.book.price * i.quantity, 0);
        const shippingFee = 30000;
        const newOrder: Order = {
          id: baseId++,
          customerId,
          customerName,
          customerPhone,
          shopId,
          items: items.map((i) => ({
            book: i.book,
            quantity: i.quantity,
            unitPrice: i.book.price,
          })),
          totalAmount,
          shippingFee,
          orderStatus: paymentMethod === "ONLINE" ? "PAID" : "PENDING",
          paymentStatus: paymentMethod === "ONLINE" ? "PAID" : "UNPAID",
          paymentMethod,
          shippingAddress,
          createdAt: dateStr,
          updatedAt: dateStr,
          note,
          tracking: {
            number: `GHN${Math.floor(100000000 + Math.random() * 900000000)}`,
            carrier: "Giao Hàng Nhanh",
            status: "PENDING",
            estimated: "3-5 ngày tới",
          },
        };
        createdOrders.push(newOrder);
      });
      return createdOrders;
    }
  },

  async addFeedback(orderId: number, rating: number, content: string, customerName?: string): Promise<boolean> {
    try {
      await apiClient.post(`/orders/${orderId}/feedback`, { rating, content });
      return true;
    } catch {
      const order = INITIAL_ORDERS.find((o) => o.id === orderId);
      if (order) {
        order.feedback = {
          rating,
          content,
          type: "SHOP",
          createdAt: new Date().toISOString().split("T")[0],
          customer: customerName || order.customerName,
        };
      }
      return true;
    }
  },

  async requestReturn(orderId: number, reason: string, reasonType = "DAMAGED"): Promise<boolean> {
    try {
      await apiClient.post(`/orders/${orderId}/return`, { reason, reasonType });
      return true;
    } catch {
      const order = INITIAL_ORDERS.find((o) => o.id === orderId);
      if (order) {
        order.returnRequest = {
          reason,
          reasonType,
          status: "PENDING",
          refundAmount: order.totalAmount,
          createdAt: new Date().toISOString().split("T")[0],
        };
      }
      return true;
    }
  },
};
