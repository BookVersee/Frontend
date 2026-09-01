import { apiClient } from "./api";
import { Order, Book, OrderStatus, OrderFeedback, ApiResponse, Shop } from "../types";
import { INITIAL_ORDERS, INITIAL_BOOKS } from "./mockData";

export const shopService = {
  // 1. Lấy thông tin hồ sơ Shop của user hiện tại
  async getMyProfile(): Promise<Shop | null> {
    try {
      const res = await apiClient.get<ApiResponse<any>>("/shop/GetMyProfile");
      const s = res.data.data;
      if (!s) return null;
      return {
        id: s.shopId || s.id,
        ownerId: s.userId,
        name: s.shopName,
        email: "shop@bookverse.com",
        phone: s.phone || "",
        address: s.address || "",
        description: s.description || "",
        status: s.condition === "ACTIVE" || s.condition === "OPEN" ? "ACTIVE" : "PENDING",
        rating: s.rating || 0,
        reviewCount: 0,
        bookCount: s.totalBooks || 0,
        joinedDate: s.createdAt,
      };
    } catch (error) {
      console.warn("getMyProfile API error, falling back to mock:", error);
      return null;
    }
  },

  // 2. Lấy danh sách đơn hàng của Shop
  async getShopOrders(shopId?: string | number): Promise<Order[]> {
    try {
      const res = await apiClient.get<ApiResponse<any[]>>("/orders/GetUserOrders");
      const orders = res.data.data || [];
      return orders.map((o: any) => ({
        id: o.id,
        customerId: o.userId,
        customerName: o.userFullName,
        customerPhone: "",
        shopId: o.shopId || shopId || "",
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
        orderStatus: o.orderStatus as OrderStatus,
        paymentStatus: o.orderStatus === "PAID" || o.orderStatus === "COMPLETED" ? "PAID" : "UNPAID",
        paymentMethod: "COD",
        shippingAddress: o.shippingAddress,
        createdAt: o.createdAt,
        updatedAt: o.createdAt,
        note: o.note || "",
      }));
    } catch (error) {
      console.warn("getShopOrders API error, falling back to mock:", error);
      return INITIAL_ORDERS.filter((o) => !shopId || String(o.shopId) === String(shopId));
    }
  },

  // 3. Xem chi tiết đơn hàng của Shop
  async getShopOrderDetail(orderId: string | number): Promise<Order | null> {
    try {
      const res = await apiClient.get<ApiResponse<any>>("/shop/GetShopOrderDetail", {
        params: { orderId }
      });
      const o = res.data.data;
      if (!o) return null;
      return {
        id: o.id,
        customerId: o.userId,
        customerName: o.userFullName,
        customerPhone: "",
        shopId: o.shopId,
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
        orderStatus: o.orderStatus as OrderStatus,
        paymentStatus: o.orderStatus === "PAID" || o.orderStatus === "COMPLETED" ? "PAID" : "UNPAID",
        paymentMethod: "COD",
        shippingAddress: o.shippingAddress,
        createdAt: o.createdAt,
        updatedAt: o.createdAt,
        note: o.note || "",
      };
    } catch (error) {
      console.warn("getShopOrderDetail API error, falling back to mock:", error);
      return INITIAL_ORDERS.find((o) => String(o.id) === String(orderId)) || null;
    }
  },

  // 4. Cập nhật trạng thái đơn hàng (PROCESSING, SHIPPED, DELIVERED, CANCELLED)
  async updateOrderStatus(orderId: string | number, status: OrderStatus, notes = ""): Promise<boolean> {
    try {
      await apiClient.post("/shop/UpdateOrderStatus", {
        newStatus: status,
        notes: notes || `Cập nhật trạng thái sang ${status}`
      }, {
        params: { orderId }
      });
      return true;
    } catch (error) {
      console.warn("updateOrderStatus API error, falling back to mock:", error);
      const order = INITIAL_ORDERS.find((o) => String(o.id) === String(orderId));
      if (order) {
        order.orderStatus = status;
      }
      return true;
    }
  },

  // 5. Lấy danh sách kho sách của Shop
  async getShopProducts(shopId?: string | number, keyword?: string, categoryId?: string, status?: string): Promise<Book[]> {
    try {
      const res = await apiClient.get<ApiResponse<any>>("/shop/GetShopInventory", {
        params: {
          keyword: keyword || undefined,
          categoryId: categoryId || undefined,
          status: status || undefined,
          pageIndex: 1,
          pageSize: 100
        }
      });
      const data = res.data.data;
      const items = data.items || data || [];
      return items.map((b: any) => ({
        id: b.bookId || b.id,
        shopId: b.shopId || shopId || "",
        shopName: b.shopName || "Gian hàng của tôi",
        categoryId: b.categoryId,
        title: b.title,
        author: b.author || "Chưa rõ tác giả",
        publisher: b.publisher || "NXB Tổng Hợp",
        price: b.price,
        stock: b.stockQuantity ?? b.stock ?? 0,
        rating: b.rating || 0,
        reviewCount: 0,
        description: b.description || "",
        coverColor: "#ffffff",
        coverColor2: "#ffffff",
        imageUrl: b.imageUrl,
        images: (b.images || []).map((img: any) => ({
          id: img.id,
          imageUrl: img.imageUrl,
          publicId: img.publicId,
          isCover: img.isCover,
          displayOrder: img.displayOrder,
        })),
        status: b.status === "ACTIVE" ? "ACTIVE" : b.status === "EMPTY" ? "OUT_OF_STOCK" : "HIDDEN",
        isbn: b.isbn,
        publishedYear: b.publishedYear,
      }));
    } catch (error) {
      console.warn("getShopProducts API error, falling back to mock:", error);
      return INITIAL_BOOKS.filter((b) => !shopId || String(b.shopId) === String(shopId));
    }
  },

  // 6. Đăng bán sách mới (CreateShopBook)
  async addProduct(product: Omit<Book, "id">): Promise<Book> {
    try {
      const primaryImageUrl =
        product.imageUrl ||
        (product.images && product.images.length > 0
          ? product.images.find((i) => i.isCover)?.imageUrl || product.images[0].imageUrl
          : "");

      const formattedImages = product.images && product.images.length > 0
        ? product.images.map((img, idx) => ({
            imageUrl: img.imageUrl,
            publicId: img.publicId,
            isCover: img.isCover ?? idx === 0,
            displayOrder: img.displayOrder ?? idx,
          }))
        : undefined;

      const formattedImageUrls = product.imageUrls && product.imageUrls.length > 0
        ? product.imageUrls
        : formattedImages
        ? formattedImages.map((i) => i.imageUrl)
        : undefined;

      const res = await apiClient.post<ApiResponse<any>>("/shop/CreateShopBook", {
        title: product.title,
        author: product.author,
        publisher: product.publisher,
        isbn: product.isbn || "",
        publishedYear: product.publishedYear || new Date().getFullYear(),
        price: product.price,
        stockQuantity: product.stock,
        categoryId: product.categoryId,
        description: product.description || "",
        imageUrl: primaryImageUrl,
        imageUrls: formattedImageUrls,
        images: formattedImages,
      });
      const b = res.data.data;
      return {
        ...product,
        id: b?.bookId || b?.id,
        imageUrl: b?.imageUrl || primaryImageUrl,
        images: b?.images || product.images,
      };
    } catch (error: any) {
      console.warn("addProduct API error:", error);
      const errorMsg =
        error?.response?.data?.errors?.detail ||
        (typeof error?.response?.data?.errors === "object"
          ? Object.values(error.response.data.errors).flat()[0]
          : null) ||
        error?.response?.data?.message ||
        error?.message ||
        "Không thể thêm sách vào gian hàng. Vui lòng kiểm tra lại thông tin.";
      throw new Error(String(errorMsg));
    }
  },

  // 7. Cập nhật thông tin & giá sách (UpdateShopBook)
  async updateProduct(id: string | number, product: Partial<Book>): Promise<Book> {
    try {
      const primaryImageUrl =
        product.imageUrl !== undefined
          ? product.imageUrl
          : product.images && product.images.length > 0
          ? product.images.find((i) => i.isCover)?.imageUrl || product.images[0].imageUrl
          : undefined;

      const formattedImages = product.images && product.images.length > 0
        ? product.images.map((img, idx) => ({
            imageUrl: img.imageUrl,
            publicId: img.publicId,
            isCover: img.isCover ?? idx === 0,
            displayOrder: img.displayOrder ?? idx,
          }))
        : undefined;

      const formattedImageUrls = product.imageUrls && product.imageUrls.length > 0
        ? product.imageUrls
        : formattedImages
        ? formattedImages.map((i) => i.imageUrl)
        : undefined;

      const res = await apiClient.post<ApiResponse<any>>("/shop/UpdateShopBook", {
        title: product.title,
        author: product.author,
        publisher: product.publisher,
        isbn: product.isbn,
        price: product.price,
        stockQuantity: product.stock,
        categoryId: product.categoryId,
        description: product.description,
        imageUrl: primaryImageUrl,
        imageUrls: formattedImageUrls,
        images: formattedImages,
        publishedYear: Number(product.publishedYear) || new Date().getFullYear(),
        status: product.status,
      }, {
        params: { bookId: id }
      });
      const b = res.data.data;
      return {
        ...product,
        id: b?.bookId || b?.id || id,
        imageUrl: b?.imageUrl || primaryImageUrl || product.imageUrl,
        images: b?.images || product.images,
      } as Book;
    } catch (error: any) {
      console.warn("updateProduct API error:", error);
      const errorMsg =
        error?.response?.data?.errors?.detail ||
        (typeof error?.response?.data?.errors === "object"
          ? Object.values(error.response.data.errors).flat()[0]
          : null) ||
        error?.response?.data?.message ||
        error?.message ||
        "Không thể cập nhật thông tin sách.";
      throw new Error(String(errorMsg));
    }
  },

  // 8. Ẩn/Xóa sách khỏi gian hàng (DeleteShopBook)
  async deleteProduct(id: string | number): Promise<boolean> {
    if (!id || id === "undefined" || id === "null") {
      throw new Error("Mã định danh sách không hợp lệ hoặc không tồn tại.");
    }
    try {
      await apiClient.post("/shop/DeleteShopBook", null, {
        params: { bookId: id }
      });
      return true;
    } catch (error: any) {
      console.warn("deleteProduct API error:", error);
      if (error?.response?.status === 404) {
        const errorMsg =
          error?.response?.data?.message ||
          error?.response?.data?.errors?.detail ||
          "Không tìm thấy sách trên hệ thống hoặc sách không thuộc quyền quản lý của gian hàng này.";
        throw new Error(String(errorMsg));
      }
      const errorMsg =
        error?.response?.data?.errors?.detail ||
        (typeof error?.response?.data?.errors === "object"
          ? Object.values(error.response.data.errors).flat()[0]
          : null) ||
        error?.response?.data?.message ||
        error?.message ||
        "Không thể xóa sách khỏi gian hàng.";
      throw new Error(String(errorMsg));
    }
  },

  // 9. Lấy danh sách đánh giá của khách hàng (GetShopFeedbacks)
  async getShopFeedbacks(shopId?: string | number): Promise<{ orderId: string | number; feedback: OrderFeedback }[]> {
    try {
      const res = await apiClient.get<ApiResponse<any>>("/shop/GetShopFeedbacks", {
        params: { pageIndex: 1, pageSize: 50 }
      });
      const data = res.data.data;
      const items = data?.items || data || [];
      return items.map((f: any) => {
        const fbId = f.feedbackId || f.id;
        const ordId = f.orderId || f.orderDetailId || fbId;
        const responseData = f.response || f.shopResponse;
        return {
          orderId: ordId,
          feedback: {
            id: fbId,
            feedbackId: fbId,
            orderId: ordId,
            orderDetailId: f.orderDetailId,
            bookId: f.bookId,
            bookTitle: f.bookTitle || "Sách chính hãng BookVerse",
            bookImageUrl: f.bookImageUrl,
            bookPrice: f.bookPrice,
            rating: f.rating ?? 5,
            content: f.content || f.comment || "",
            type: f.type || "BOOK",
            imageUrl: f.imageUrl,
            createdAt: f.createdAt,
            customer: f.customerName || f.userFullName || "Khách hàng",
            customerName: f.customerName || f.userFullName || "Khách hàng",
            customerAvatar: f.customerAvatar,
            shopReply: responseData?.content || responseData?.responseContent,
            shopRepliedAt: responseData?.createdAt,
            shopReplyImageUrl: responseData?.imageUrl,
          }
        };
      });
    } catch (error) {
      console.warn("getShopFeedbacks API error, falling back to mock:", error);
      return INITIAL_ORDERS
        .filter((o) => (!shopId || String(o.shopId) === String(shopId)) && o.feedback)
        .map((o) => ({
          orderId: o.id,
          feedback: o.feedback!,
        }));
    }
  },

  // 10. Trả lời phản hồi đánh giá của khách (ReplyFeedback)
  async replyFeedback(feedbackId: string | number, reply: string, imageUrl?: string): Promise<boolean> {
    try {
      await apiClient.post("/shop/ReplyFeedback", {
        feedbackId,
        content: reply,
        imageUrl: imageUrl || null
      }, {
        params: { feedbackId }
      });
      return true;
    } catch (error) {
      console.error("replyFeedback API error:", error);
      throw error;
    }
  },

  // 11. Xử lý yêu cầu trả hàng / hoàn tiền (ProcessReturnRequest)
  async processReturnRequest(returnRequestId: string | number, isAccepted: boolean, shopNote = ""): Promise<boolean> {
    try {
      await apiClient.post("/shop/ProcessReturnRequest", {
        isAccepted,
        shopNote: shopNote || (isAccepted ? "Đồng ý hoàn tiền" : "Từ chối hoàn tiền")
      }, {
        params: { returnRequestId }
      });
      return true;
    } catch (error) {
      console.warn("processReturnRequest API error, falling back to mock:", error);
      return true;
    }
  },

  // 12. Thống kê doanh thu Shop (GetRevenueStatistics)
  async getRevenueStats(shopId?: string | number, period: "day" | "month" | "year" = "month") {
    try {
      const res = await apiClient.get<ApiResponse<any>>("/shop/GetRevenueStatistics", {
        params: { periodType: period }
      });
      const data = res.data.data;
      return {
        period,
        totalRevenue: data?.totalRevenue || 0,
        totalOrders: data?.totalOrders || 0,
        deliveredCount: data?.completedOrders || data?.totalOrders || 0,
      };
    } catch (error) {
      console.warn("getRevenueStats API error, falling back to mock:", error);
      const orders = INITIAL_ORDERS.filter((o) => (!shopId || String(o.shopId) === String(shopId)) && o.orderStatus === "DELIVERED");
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
