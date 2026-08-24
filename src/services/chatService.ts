import { apiClient } from "./api";
import { ChatMessage } from "../types";
import { INITIAL_MESSAGES } from "./mockData";

export const chatService = {
  async getMessages(shopId = 1, customerId = 1): Promise<ChatMessage[]> {
    try {
      const res = await apiClient.get<ChatMessage[]>("/chat/messages", {
        params: { shopId, customerId },
      });
      return res.data;
    } catch {
      return INITIAL_MESSAGES.filter((m) => m.shopId === shopId);
    }
  },

  async sendMessage(params: {
    senderId: number;
    receiverId: number;
    shopId?: number;
    text: string;
    isFromCustomer: boolean;
    senderName?: string;
  }): Promise<ChatMessage> {
    try {
      const res = await apiClient.post<ChatMessage>("/chat/messages", params);
      return res.data;
    } catch {
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      const msg: ChatMessage = {
        id: Date.now(),
        ...params,
        createdAt: timeStr,
      };
      INITIAL_MESSAGES.push(msg);
      return msg;
    }
  },
};
