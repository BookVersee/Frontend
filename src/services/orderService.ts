import { apiClient } from "./api";
import { Order, CartItem, PaymentMethod, ApiResponse } from "../types";
import { INITIAL_ORDERS } from "./mockData";
import { normalizeBookGuid, generateGuid } from "../utils/guidHelper";

export const orderService = {
  async getOrders(customerId?: string | number): Promise<Order[]> {
    try {
      // Backend xác định user qua JWT token gửi kèm, gọi GetUserOrders
      const res = await apiClient.get<ApiResponse<any[]>>("/orders/GetUserOrders");
      const mappedOrders: Order[] = (res.data?.data || []).map((o: any) => ({
        id: o.id,
        customerId: o.userId,
        customerName: o.userFullName,
        items: (o.orderDetails || []).map((od: any, idx: number) => {
          const colors = [
            { c1: "#1e3a8a", c2: "#3b82f6" },
            { c1: "#065f46", c2: "#10b981" },
            { c1: "#78350f", c2: "#d97706" },
            { c1: "#581c87", c2: "#9333ea" },
            { c1: "#831843", c2: "#db2777" },
          ];
          const colorPair = colors[Math.abs(String(od.bookId || idx).split("").reduce((acc, c) => acc + c.charCodeAt(0), 0)) % colors.length];
          return {
            book: {
              id: od.bookId,
              title: od.bookTitle,
              price: od.unitPrice,
              imageUrl: od.bookImage || od.BookImage || od.imageUrl || od.bookImageUrl || od.book?.imageUrl,
              coverColor: colorPair.c1,
              coverColor2: colorPair.c2,
            },
            quantity: od.quantity,
            unitPrice: od.unitPrice,
          };
        }),
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

      // Nếu có customerId, chỉ giữ lại các đơn do chính tài khoản này ĐÃ ĐẶT MUA (Tránh nhầm với các đơn bán của shop)
      if (customerId) {
        return mappedOrders.filter(
          (o) => String(o.customerId).toLowerCase() === String(customerId).toLowerCase()
        );
      }
      return mappedOrders;
    } catch (error) {
      console.warn("getOrders API error, falling back to mock:", error);
      return customerId
        ? INITIAL_ORDERS.filter((o) => String(o.customerId) === String(customerId))
        : INITIAL_ORDERS;
    }
  },

  async getOrderById(orderId: string | number): Promise<Order | null> {
    try {
      const res = await apiClient.get<ApiResponse<any>>(`/orders/GetOrderDetail`, {
        params: { id: orderId }
      });
      const o = res.data.data;
      return {
        id: o.id,
        customerId: o.userId,
        customerName: o.userFullName,
        customerPhone: "",
        items: (o.orderDetails || []).map((od: any, idx: number) => {
          const colors = [
            { c1: "#1e3a8a", c2: "#3b82f6" },
            { c1: "#065f46", c2: "#10b981" },
            { c1: "#78350f", c2: "#d97706" },
            { c1: "#581c87", c2: "#9333ea" },
            { c1: "#831843", c2: "#db2777" },
          ];
          const colorPair = colors[Math.abs(String(od.bookId || idx).split("").reduce((acc, c) => acc + c.charCodeAt(0), 0)) % colors.length];
          return {
            book: {
              id: od.bookId,
              title: od.bookTitle,
              price: od.unitPrice,
              imageUrl: od.bookImage || od.BookImage || od.imageUrl || od.bookImageUrl || od.book?.imageUrl,
              coverColor: colorPair.c1,
              coverColor2: colorPair.c2,
            },
            quantity: od.quantity,
            unitPrice: od.unitPrice,
          };
        }),
        totalAmount: o.totalAmount,
        shippingFee: 30000,
        orderStatus: o.orderStatus,
        paymentStatus: o.orderStatus === "PAID" || o.orderStatus === "COMPLETED" ? "PAID" : "UNPAID",
        paymentMethod: "COD",
        shippingAddress: o.shippingAddress,
        createdAt: o.createdAt,
        updatedAt: o.createdAt,
        note: o.note || "",
        returnRequest: o.orderDetails[0]?.returnRequest ? {
          id: o.orderDetails[0].returnRequest.id,
          reason: o.orderDetails[0].returnRequest.detailedReason || "",
          reasonType: o.orderDetails[0].returnRequest.reasonType,
          status: o.orderDetails[0].returnRequest.status,
          refundAmount: o.orderDetails[0].returnRequest.refundAmount,
          createdAt: o.orderDetails[0].returnRequest.createdAt,
        } : undefined
      };
    } catch (error) {
      console.warn("getOrderById API error, falling back to mock:", error);
      return INITIAL_ORDERS.find((o) => String(o.id) === String(orderId)) || null;
    }
  },

  async createOrder(params: {
    customerId: string | number;
    customerName: string;
    customerPhone: string;
    cart: CartItem[];
    remainingCart?: CartItem[];
    paymentMethod: PaymentMethod;
    shippingAddress: string;
    note?: string;
  }): Promise<Order[]> {
    const { customerId, customerName, customerPhone, cart, remainingCart, paymentMethod, shippingAddress, note } = params;

    try {
      // 1. Đồng bộ các sản phẩm được chọn mua lên Database Cart của Backend
      await apiClient.delete("/cart/ClearCart"); // Làm trống giỏ hàng cũ trên DB
      
      for (const item of cart) {
        const validBookId = normalizeBookGuid(item.book.id);
        await apiClient.post("/cart/AddToCart", {
          bookId: validBookId,
          quantity: item.quantity
        });
      }

      // 2. Gọi API tạo đơn hàng từ Giỏ hàng vừa đồng bộ
      const res = await apiClient.post<ApiResponse<any>>("/orders/CreateOrder", {
        shippingAddress,
        paymentMethod: paymentMethod === "ONLINE" ? "ONLINE" : "COD",
        note: note || "",
      });

      // 3. Nếu còn các sản phẩm khác trong giỏ hàng chưa mua, đồng bộ lại lên Backend Cart
      if (remainingCart && remainingCart.length > 0) {
        for (const remItem of remainingCart) {
          try {
            const validBookId = normalizeBookGuid(remItem.book.id);
            await apiClient.post("/cart/AddToCart", {
              bookId: validBookId,
              quantity: remItem.quantity,
            });
          } catch (e) {
            console.warn("Could not sync remaining cart item back to DB:", e);
          }
        }
      }

      const orderRes = res.data.data;
      const items = orderRes.orderDetails.map((od: any) => ({
        book: {
          id: od.bookId,
          title: od.bookTitle,
          price: od.unitPrice,
          coverColor: "#ffffff",
          coverColor2: "#ffffff",
        },
        quantity: od.quantity,
        unitPrice: od.unitPrice,
      }));

      const newOrder: Order = {
        id: orderRes.id,
        customerId: orderRes.userId,
        customerName: orderRes.userFullName,
        customerPhone: customerPhone,
        items,
        totalAmount: orderRes.totalAmount,
        shippingFee: 30000,
        orderStatus: orderRes.orderStatus,
        paymentStatus: orderRes.orderStatus === "PAID" || orderRes.orderStatus === "COMPLETED" ? "PAID" : "UNPAID",
        paymentMethod: paymentMethod,
        shippingAddress: orderRes.shippingAddress,
        createdAt: orderRes.createdAt,
        updatedAt: orderRes.createdAt,
        note: orderRes.note || "",
      };

      return [newOrder];
    } catch (error) {
      console.warn("createOrder API error, falling back to mock:", error);
      // Group by shopId (Fallback)
      const shopGroups = new Map<number | string, CartItem[]>();
      cart.forEach((item) => {
        const shopId = item.book.shopId;
        const group = shopGroups.get(shopId) || [];
        group.push(item);
        shopGroups.set(shopId, group);
      });

      const createdOrders: Order[] = [];
      const now = new Date();
      const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

      shopGroups.forEach((items, shopId) => {
        const totalAmount = items.reduce((s, i) => s + i.book.price * i.quantity, 0);
        const shippingFee = 30000;
        const shopName = items[0]?.book.shopName || "Nhà sách đối tác";
        const newOrder: Order = {
          id: generateGuid(),
          customerId,
          customerName,
          customerPhone,
          shopId,
          shopName,
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
            note: "Shop đang chuẩn bị hàng",
          },
        };
        INITIAL_ORDERS.unshift(newOrder);
        createdOrders.push(newOrder);
      });
      return createdOrders;
    }
  },

  async cancelOrder(orderId: string | number, reason?: string): Promise<boolean> {
    try {
      await apiClient.post(`/orders/CancelOrder`, null, {
        params: { id: orderId }
      });
      return true;
    } catch (error) {
      console.warn("cancelOrder API error, falling back to mock:", error);
      const order = INITIAL_ORDERS.find((o) => String(o.id) === String(orderId));
      if (order && (order.orderStatus === "PENDING" || order.orderStatus === "PAID")) {
        order.orderStatus = "CANCELLED";
        if (order.paymentStatus === "PAID") {
          order.paymentStatus = "REFUNDED";
        }
        return true;
      }
      return false;
    }
  },

  async addFeedback(orderId: string | number, rating: number, content: string, customerName?: string): Promise<boolean> {
    try {
      // Thực tế API backend feedback được tích hợp qua FeedbackController:
      // Ở đây chúng ta tạm thời dùng mock hoặc gọi API thực tế nếu có sẵn
      return true;
    } catch {
      return true;
    }
  },

  async replyFeedback(orderId: string | number, shopReply: string): Promise<boolean> {
    try {
      return true;
    } catch {
      return true;
    }
  },

  async reportFeedback(orderId: string | number, reportReason: string): Promise<boolean> {
    try {
      return true;
    } catch {
      return true;
    }
  },

  async requestReturn(orderId: string | number, reason: string, reasonType = "DAMAGED", evidenceImage?: string): Promise<boolean> {
    try {
      // 1. Lấy chi tiết đơn hàng để có orderDetailId cần trả hàng
      const detailRes = await apiClient.get<ApiResponse<any>>(`/orders/GetOrderDetail`, {
        params: { id: orderId }
      });
      const orderDetailId = detailRes.data.data.orderDetails[0]?.orderDetailId;
      if (!orderDetailId) throw new Error("No items in order to return.");

      // 2. Gửi yêu cầu hoàn tiền cho item đầu tiên của đơn hàng
      await apiClient.post(`/orders/SendRequestReturn`, {
        reasonType: reasonType,
        detailedReason: reason,
        imageUrl: evidenceImage || "",
        refundAmount: detailRes.data.data.totalAmount,
      }, {
        params: { orderDetailId }
      });
      return true;
    } catch (error) {
      console.warn("requestReturn API error, falling back to mock:", error);
      const order = INITIAL_ORDERS.find((o) => String(o.id) === String(orderId));
      if (order) {
        order.returnRequest = {
          orderId: order.id as any,
          reason,
          reasonType,
          status: "PENDING",
          disputeStatus: "OPEN",
          refundAmount: order.totalAmount,
          createdAt: new Date().toISOString().split("T")[0],
          evidenceImage: evidenceImage || "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400",
        };
      }
      return true;
    }
  },
};
