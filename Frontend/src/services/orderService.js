import { apiClient } from "./api";
import { INITIAL_ORDERS } from "./mockData";

export const orderService = {
  async getOrders(customerId) {
    try {
      const url = customerId ? `/orders?customerId=${customerId}` : "/orders";
      const res = await apiClient.get(url);
      return res.data;
    } catch {
      return customerId
        ? INITIAL_ORDERS.filter((o) => o.customerId === customerId)
        : INITIAL_ORDERS;
    }
  },

  async getOrderById(orderId) {
    try {
      const res = await apiClient.get(`/orders/${orderId}`);
      return res.data;
    } catch {
      return INITIAL_ORDERS.find((o) => o.id === orderId) || null;
    }
  },

  async createOrder({
    customerId,
    customerName,
    customerPhone,
    cart,
    paymentMethod,
    shippingAddress,
    note,
  }) {
    // Group by shopId
    const shopGroups = new Map();
    cart.forEach((item) => {
      const shopId = item.book.shopId;
      const group = shopGroups.get(shopId) || [];
      group.push(item);
      shopGroups.set(shopId, group);
    });

    try {
      const res = await apiClient.post("/orders", {
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
      const createdOrders = [];
      const now = new Date();
      const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

      let baseId = 1000 + Math.floor(Math.random() * 8000);
      shopGroups.forEach((items, shopId) => {
        const totalAmount = items.reduce((s, i) => s + i.book.price * i.quantity, 0);
        const shippingFee = 30000;
        const newOrder = {
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

  async addFeedback(orderId, rating, content, customerName) {
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

  async requestReturn(orderId, reason, reasonType = "DAMAGED") {
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
