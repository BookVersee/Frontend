import { apiClient } from "./api";
import { ChatMessage, ApiResponse } from "../types";
import { INITIAL_MESSAGES } from "./mockData";

export const chatService = {
  // 1. Lấy danh sách cuộc trò chuyện của người dùng hiện tại
  async getUserConversations(): Promise<any[]> {
    try {
      const res = await apiClient.get<ApiResponse<any[]>>("/chat/GetUserConversations");
      return res.data.data || [];
    } catch (error) {
      console.warn("getUserConversations API error, falling back to mock:", error);
      return [];
    }
  },

  // 2. Lấy danh sách khách hàng đang chat với Shop
  async getShopConversations(shopId?: string | number): Promise<any[]> {
    try {
      const res = await apiClient.get<ApiResponse<any[]>>("/chat/GetShopConversations", {
        params: { shopId }
      });
      return res.data.data || [];
    } catch (error) {
      console.warn("getShopConversations API error, falling back to mock:", error);
      return [];
    }
  },

  // 3. Xem lịch sử tin nhắn trong phòng chat
  async getMessages(chatId?: string | number, shopId?: string | number, customerId?: string | number): Promise<ChatMessage[]> {
    try {
      if (chatId) {
        const res = await apiClient.get<ApiResponse<any[]>>("/chat/GetConversationMessages", {
          params: { chatId }
        });
        const list = res.data.data || [];
        return list.map((m: any) => ({
          id: m.id,
          senderId: m.senderId,
          receiverId: m.receiverId,
          shopId: m.shopId,
          text: m.content || m.text,
          createdAt: m.createdAt,
          isFromCustomer: m.isFromCustomer ?? true,
          senderName: m.senderName,
          imageUrl: m.imageUrl,
        }));
      }
      return INITIAL_MESSAGES;
    } catch (error) {
      console.warn("getMessages API error, falling back to mock:", error);
      return INITIAL_MESSAGES.filter((m) => !shopId || String(m.shopId) === String(shopId));
    }
  },

  // 4. Gửi tin nhắn mới
  async sendMessage(params: {
    chatId?: string | number;
    senderId: string | number;
    receiverId?: string | number;
    shopId?: string | number;
    text: string;
    isFromCustomer: boolean;
    senderName?: string;
    imageUrl?: string;
  }): Promise<ChatMessage> {
    try {
      const res = await apiClient.post<ApiResponse<any>>("/chat/SendMessage", {
        chatId: params.chatId || undefined,
        shopId: params.shopId || undefined,
        userId: params.receiverId || undefined,
        content: params.text,
        imageUrl: params.imageUrl || "",
      });
      const m = res.data.data;
      return {
        id: m?.id || Date.now(),
        senderId: params.senderId,
        receiverId: params.receiverId,
        shopId: params.shopId,
        text: params.text,
        createdAt: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
        isFromCustomer: params.isFromCustomer,
        senderName: params.senderName,
        imageUrl: params.imageUrl,
      };
    } catch (error) {
      console.warn("sendMessage API error, falling back to mock:", error);
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      const msg: ChatMessage = {
        id: Date.now(),
        senderId: params.senderId,
        receiverId: params.receiverId,
        shopId: params.shopId,
        text: params.text,
        createdAt: timeStr,
        isFromCustomer: params.isFromCustomer,
        senderName: params.senderName,
        imageUrl: params.imageUrl,
      };
      INITIAL_MESSAGES.push(msg);
      return msg;
    }
  },
};
