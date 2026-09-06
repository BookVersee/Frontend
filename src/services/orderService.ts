import { apiClient } from "./api";
import { Order, CartItem, PaymentMethod, ApiResponse } from "../types";
import { INITIAL_ORDERS } from "./mockData";
import { normalizeBookGuid, generateGuid } from "../utils/guidHelper";
import { cartService } from "./cartService";

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
          const itemReturnReq = od.returnRequest ? {
            id: od.returnRequest.id,
            orderId: o.id,
            orderDetailId: od.orderDetailId || od.id,
            bookTitle: od.bookTitle,
            bookImageUrl: od.bookImage || od.imageUrl,
            reason: od.returnRequest.detailedReason || "",
            reasonType: od.returnRequest.reasonType,
            status: od.returnRequest.status,
            refundAmount: od.returnRequest.refundAmount || (od.unitPrice * od.quantity),
            createdAt: od.returnRequest.createdAt,
            evidenceImage: od.returnRequest.imageUrl,
            imageUrl: od.returnRequest.imageUrl,
          } : undefined;

          return {
            orderDetailId: od.orderDetailId || od.id,
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
            returnStatus: od.returnStatus || "NONE",
            returnRequest: itemReturnReq,
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
        returnRequest: (() => {
          const firstReq = (o.orderDetails || []).find((od: any) => od.returnRequest)?.returnRequest;
          if (!firstReq) return undefined;
          return {
            id: firstReq.id,
            orderId: o.id,
            orderDetailId: firstReq.orderDetailId,
            reason: firstReq.detailedReason || "",
            reasonType: firstReq.reasonType,
            status: firstReq.status,
            refundAmount: firstReq.refundAmount,
            createdAt: firstReq.createdAt,
            evidenceImage: firstReq.imageUrl,
            imageUrl: firstReq.imageUrl,
            disputeStatus: (firstReq.status === "PENDING" ? "OPEN" : "CLOSED") as any,
          };
        })(),
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
          const itemReturnReq = od.returnRequest ? {
            id: od.returnRequest.id,
            orderId: o.id,
            orderDetailId: od.orderDetailId || od.id,
            bookTitle: od.bookTitle,
            bookImageUrl: od.bookImage || od.imageUrl,
            reason: od.returnRequest.detailedReason || "",
            reasonType: od.returnRequest.reasonType,
            status: od.returnRequest.status,
            refundAmount: od.returnRequest.refundAmount || (od.unitPrice * od.quantity),
            createdAt: od.returnRequest.createdAt,
            evidenceImage: od.returnRequest.imageUrl,
            imageUrl: od.returnRequest.imageUrl,
          } : undefined;

          return {
            orderDetailId: od.orderDetailId || od.id,
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
            returnStatus: od.returnStatus || "NONE",
            returnRequest: itemReturnReq,
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
        returnRequest: (() => {
          const firstReq = (o.orderDetails || []).find((od: any) => od.returnRequest)?.returnRequest;
          if (!firstReq) return undefined;
          return {
            id: firstReq.id,
            orderId: o.id,
            orderDetailId: firstReq.orderDetailId,
            reason: firstReq.detailedReason || "",
            reasonType: firstReq.reasonType,
            status: firstReq.status,
            refundAmount: firstReq.refundAmount,
            createdAt: firstReq.createdAt,
            evidenceImage: firstReq.imageUrl,
            imageUrl: firstReq.imageUrl,
            disputeStatus: (firstReq.status === "PENDING" ? "OPEN" : "CLOSED") as any,
          };
        })(),
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
    const { customerId, customerName, customerPhone, cart, paymentMethod, shippingAddress, note } = params;

    try {
      // 1. Thu thập danh sách cartDetailId của các mặt hàng được chọn
      const selectedCartItemIds: string[] = [];
      for (const item of cart) {
        if (item.cartDetailId) {
          selectedCartItemIds.push(item.cartDetailId);
        } else {
          // Fallback an toàn: nếu món chưa có trên DB (ví dụ thêm lúc offline), thêm lên DB để lấy ID
          try {
            const backendCart = await cartService.addToCart(item.book.id, item.quantity);
            const found = backendCart?.shopGroups
              ?.flatMap((g) => g.items)
              ?.find((bi) => String(bi.bookId).toLowerCase() === String(item.book.id).toLowerCase());
            if (found?.cartDetailId) {
              selectedCartItemIds.push(found.cartDetailId);
            }
          } catch (e) {
            console.warn("Could not sync item to DB before order:", e);
          }
        }
      }

      // 2. Gọi duy nhất 1 API tạo đơn hàng, truyền SelectedCartItemIds để Backend tự động trừ đúng sản phẩm đã mua
      const res = await apiClient.post<ApiResponse<any>>("/orders/CreateOrder", {
        selectedCartItemIds: selectedCartItemIds.length > 0 ? selectedCartItemIds : undefined,
        shippingAddress,
        paymentMethod: paymentMethod === "ONLINE" ? "ONLINE" : "COD",
        note: note || "",
      });

      const orderRes = res.data.data;
      const items = (orderRes.orderDetails || []).map((od: any) => ({
        orderDetailId: od.orderDetailId || od.id,
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
    } catch (error: any) {
      console.warn("cancelOrder API error:", error);
      const msg = error?.response?.data?.message || "Không thể hủy đơn hàng này.";
      if (error?.response?.status === 400 || error?.response?.status === 403) {
        throw new Error(msg);
      }
      const order = INITIAL_ORDERS.find((o) => String(o.id) === String(orderId));
      if (order && (order.orderStatus === "PENDING" || order.orderStatus === "PAID")) {
        order.orderStatus = "CANCELLED";
        if (order.paymentStatus === "PAID") {
          order.paymentStatus = "REFUNDED";
        }
        return true;
      }
      throw new Error(msg);
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

  async requestReturn(
    orderIdOrParams:
      | string
      | number
      | {
          orderId: string | number;
          orderDetailId?: string;
          reason: string;
          reasonType?: string;
          evidenceImage?: string;
          refundAmount?: number;
        },
    reasonParam?: string,
    reasonTypeParam = "DAMAGED",
    evidenceImageParam?: string,
    refundAmountParam?: number
  ): Promise<boolean> {
    let orderId: string | number;
    let orderDetailId: string | undefined;
    let reason: string;
    let reasonType = "DAMAGED";
    let evidenceImage: string | undefined;
    let refundAmount: number | undefined;

    if (typeof orderIdOrParams === "object" && orderIdOrParams !== null) {
      orderId = orderIdOrParams.orderId;
      orderDetailId = orderIdOrParams.orderDetailId;
      reason = orderIdOrParams.reason;
      reasonType = orderIdOrParams.reasonType || "DAMAGED";
      evidenceImage = orderIdOrParams.evidenceImage;
      refundAmount = orderIdOrParams.refundAmount;
    } else {
      orderId = orderIdOrParams;
      reason = reasonParam || "";
      reasonType = reasonTypeParam || "DAMAGED";
      evidenceImage = evidenceImageParam;
      refundAmount = refundAmountParam;
    }

    try {
      // 1. Nếu chưa có orderDetailId, truy vấn chi tiết đơn hàng để lấy id item đầu tiên
      if (!orderDetailId) {
        const detailRes = await apiClient.get<ApiResponse<any>>(`/orders/GetOrderDetail`, {
          params: { id: orderId }
        });
        orderDetailId = detailRes.data?.data?.orderDetails?.[0]?.orderDetailId || detailRes.data?.data?.orderDetails?.[0]?.id;
      }

      if (!orderDetailId) {
        throw new Error("Không tìm thấy sản phẩm trong đơn hàng để gửi yêu cầu trả hàng.");
      }

      // 2. Gửi yêu cầu hoàn tiền cho đúng orderDetailId
      await apiClient.post(
        `/orders/SendRequestReturn`,
        {
          reasonType,
          detailedReason: reason,
          imageUrl: evidenceImage || "",
          refundAmount: refundAmount && refundAmount > 0 ? refundAmount : 0,
        },
        {
          params: { orderDetailId }
        }
      );
      return true;
    } catch (error: any) {
      console.warn("requestReturn API error, falling back to mock:", error);
      const serverMsg = error?.response?.data?.message;
      if (error?.response?.status === 400 || error?.response?.status === 403) {
        throw new Error(serverMsg || "Không thể gửi yêu cầu trả hàng.");
      }
      const order = INITIAL_ORDERS.find((o) => String(o.id) === String(orderId));
      if (order) {
        order.returnRequest = {
          orderId: order.id as any,
          orderDetailId,
          reason,
          reasonType,
          status: "PENDING",
          disputeStatus: "OPEN",
          refundAmount: refundAmount || order.totalAmount,
          createdAt: new Date().toISOString().split("T")[0],
          evidenceImage: evidenceImage || "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400",
        };
      }
      return true;
    }
  },

  async escalateDispute(returnRequestId: string | number, reason: string): Promise<boolean> {
    try {
      await apiClient.post(`/orders/EscalateDispute`, null, {
        params: {
          returnRequestId,
          reason: reason.trim(),
        },
      });
      return true;
    } catch (error: any) {
      console.error("escalateDispute API error:", error);
      const msg = error?.response?.data?.message || error?.message || "Không thể gửi khiếu nại lên Ban Quản Trị.";
      throw new Error(msg);
    }
  },
};
