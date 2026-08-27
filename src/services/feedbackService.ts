import { apiClient } from "./api";
import { OrderFeedback, ApiResponse } from "../types";

export const feedbackService = {
  // 1. Lấy danh sách đánh giá sản phẩm sách
  async getBookFeedbacks(bookId: string | number): Promise<OrderFeedback[]> {
    try {
      const res = await apiClient.get<ApiResponse<any[]>>("/feedback/GetBookFeedbacks", {
        params: { bookId }
      });
      const items = res.data.data || [];
      return items.map((f: any) => ({
        id: f.id,
        orderId: f.orderDetailId,
        bookId: f.bookId,
        rating: f.rating,
        content: f.comment,
        type: "BOOK",
        createdAt: f.createdAt,
        customer: f.userFullName || "Độc giả BookVerse",
        customerName: f.userFullName || "Độc giả BookVerse",
        shopReply: f.shopResponse?.responseContent,
        shopRepliedAt: f.shopResponse?.createdAt,
      }));
    } catch (error) {
      console.warn("getBookFeedbacks API error, falling back to empty list:", error);
      return [];
    }
  },

  // 2. Gửi bình luận và điểm sao đánh giá sản phẩm
  async writeFeedback(payload: {
    bookId: string | number;
    orderDetailId?: string | number;
    rating: number;
    comment: string;
    imageUrl?: string;
  }): Promise<boolean> {
    try {
      await apiClient.post("/feedback/WriteFeedback", {
        bookId: payload.bookId,
        orderDetailId: payload.orderDetailId,
        rating: payload.rating,
        comment: payload.comment,
        imageUrl: payload.imageUrl || "",
      });
      return true;
    } catch (error) {
      console.warn("writeFeedback API error:", error);
      return true;
    }
  },

  // 3. Báo cáo phản hồi vi phạm của Shop
  async reportResponse(responseId: string | number, reason: string): Promise<boolean> {
    try {
      await apiClient.post("/feedback/ReportResponse", { reason }, {
        params: { responseId }
      });
      return true;
    } catch (error) {
      console.warn("reportResponse API error:", error);
      return true;
    }
  },
};
