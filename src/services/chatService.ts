import { apiClient } from "./api";
import { ChatMessage, ApiResponse } from "../types";
import { INITIAL_MESSAGES, INITIAL_SHOPS } from "./mockData";

export interface ChatThread {
  chatId: string;
  userId: string;
  userName: string;
  shopId: string;
  shopName?: string;
  lastMessage?: string;
  unreadCount: number;
  updatedAt: string;
}

const STORAGE_KEY = "bookverse_chat_messages";

// Lấy danh sách tin nhắn từ LocalStorage (đồng bộ giữa các tab/vai trò)
const getStoredMessages = (): ChatMessage[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn("Error reading stored chat messages:", e);
  }
  return [...INITIAL_MESSAGES];
};

// Lưu tin nhắn vào LocalStorage
const saveStoredMessages = (messages: ChatMessage[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    window.dispatchEvent(new CustomEvent("bookverse_chat_updated", { detail: messages }));
  } catch (e) {
    console.warn("Error saving chat messages:", e);
  }
};

const getShopNameById = (shopId: string | number): string => {
  const sId = String(shopId);
  const found = INITIAL_SHOPS.find((s) => String(s.id) === sId);
  if (found) return found.name;
  if (sId === "4" || sId.toLowerCase().includes("tri")) return "Nhà Sách Tri Thức Việt";
  return `Gian hàng #${sId}`;
};

export const chatService = {
  // 1. Lấy danh sách cuộc trò chuyện của khách hàng với các Shop
  async getUserConversations(): Promise<ChatThread[]> {
    try {
      const res = await apiClient.get<ApiResponse<ChatThread[]>>("/chat/GetUserConversations");
      if (res.data.data && res.data.data.length > 0) {
        return res.data.data;
      }
    } catch (error) {
      console.warn("getUserConversations API error, falling back to dynamic local threads:", error);
    }

    // Fallback: Tự động gom nhóm từ danh sách tin nhắn đã lưu
    const allMsgs = getStoredMessages();
    const shopMap = new Map<string, ChatMessage[]>();

    allMsgs.forEach((m) => {
      const sId = String(m.shopId || "1");
      const list = shopMap.get(sId) || [];
      list.push(m);
      shopMap.set(sId, list);
    });

    const threads: ChatThread[] = [];
    shopMap.forEach((msgs, sId) => {
      const lastMsg = msgs[msgs.length - 1];
      const sName = getShopNameById(sId);
      threads.push({
        chatId: `chat-shop-${sId}`,
        userId: "customer",
        userName: sName,
        shopName: sName,
        shopId: sId,
        lastMessage: lastMsg?.text,
        unreadCount: 0,
        updatedAt: lastMsg?.createdAt || "Vừa xong",
      });
    });

    // Luôn đảm bảo có các gian hàng phổ biến nếu danh sách ít
    if (!threads.some((t) => t.shopId === "1")) {
      threads.push({
        chatId: "chat-shop-1",
        userId: "customer",
        userName: "Nhà sách Phương Nam",
        shopName: "Nhà sách Phương Nam",
        shopId: "1",
        lastMessage: "Dạ chào bạn An, đây là bản bìa mềm có tay gập chính hãng!",
        unreadCount: 0,
        updatedAt: "09:18",
      });
    }

    return threads;
  },

  // 2. Lấy danh sách khách hàng đang nhắn tin cho Shop
  async getShopConversations(shopId?: string | number): Promise<ChatThread[]> {
    const targetShopId = String(shopId || "1");

    try {
      const res = await apiClient.get<ApiResponse<ChatThread[]>>("/chat/GetShopConversations", {
        params: { shopId: shopId || undefined },
      });
      if (res.data.data && res.data.data.length > 0) {
        return res.data.data;
      }
    } catch (error) {
      console.warn("getShopConversations API error, extracting dynamic threads for shop:", error);
    }

    // Fallback: Tự động gom nhóm các tin nhắn khách gửi cho shop này
    const allMsgs = getStoredMessages();
    const shopMsgs = allMsgs.filter(
      (m) => String(m.shopId) === targetShopId || !m.shopId || targetShopId === "1"
    );

    const userGroupMap = new Map<string, { name: string; msgs: ChatMessage[] }>();

    shopMsgs.forEach((m) => {
      const uKey = String(m.senderId === targetShopId ? m.receiverId || "customer" : m.senderId || "customer");
      const uName = m.isFromCustomer ? m.senderName || "Khách hàng" : "Khách hàng";
      const existing = userGroupMap.get(uKey) || { name: uName, msgs: [] };
      if (m.isFromCustomer && m.senderName) {
        existing.name = m.senderName;
      }
      existing.msgs.push(m);
      userGroupMap.set(uKey, existing);
    });

    const threads: ChatThread[] = [];
    userGroupMap.forEach((group, uKey) => {
      const lastMsg = group.msgs[group.msgs.length - 1];
      const unreadCount = group.msgs.filter((m) => m.isFromCustomer).length;

      threads.push({
        chatId: `chat-${targetShopId}-${uKey}`,
        userId: uKey,
        userName: group.name,
        shopId: targetShopId,
        lastMessage: lastMsg?.text,
        unreadCount: unreadCount > 0 ? 1 : 0,
        updatedAt: lastMsg?.createdAt || "Vừa xong",
      });
    });

    // Nếu chưa có tin nhắn nào cho shop này, hiển thị 2 hội thoại mẫu
    if (threads.length === 0) {
      threads.push(
        {
          chatId: `chat-${targetShopId}-user-1`,
          userId: "user-1",
          userName: "Nguyễn Văn Đọc",
          shopId: targetShopId,
          lastMessage: "Shop ơi cuốn Đắc Nhân Tâm này còn hàng không ạ?",
          unreadCount: 1,
          updatedAt: "Vừa xong",
        },
        {
          chatId: `chat-${targetShopId}-user-2`,
          userId: "user-2",
          userName: "Trần Thị Mai",
          shopId: targetShopId,
          lastMessage: "Sách giao rất nhanh và bọc cẩn thận nhé shop!",
          unreadCount: 0,
          updatedAt: "10 phút trước",
        }
      );
    }

    return threads;
  },

  // 3. Lấy lịch sử tin nhắn trong phòng chat
  async getMessages(params: {
    chatId?: string | number;
    shopId?: string | number;
    userId?: string | number;
  }): Promise<{ chatId?: string | number; messages: ChatMessage[] }> {
    const { chatId, shopId, userId } = params;

    try {
      if (chatId && !String(chatId).startsWith("chat-") && !String(chatId).startsWith("mock-")) {
        const res = await apiClient.get<ApiResponse<any[]>>("/chat/GetConversationMessages", {
          params: { chatId },
        });

        const list = res.data.data || [];
        if (list.length > 0) {
          const messages: ChatMessage[] = list.map((m: any) => ({
            id: m.messageId || m.id,
            senderId: m.senderId,
            receiverId: m.receiverId,
            shopId: m.shopId || shopId,
            text: m.content || m.text,
            createdAt: m.createdAt
              ? new Date(m.createdAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
              : new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
            isFromCustomer: m.senderId !== String(shopId),
            senderName: m.senderName,
            imageUrl: m.imageUrl,
          }));

          return { chatId, messages };
        }
      }
    } catch (error) {
      console.warn("getMessages API error, fetching from synchronized local storage:", error);
    }

    // Fallback: Lấy tin nhắn từ LocalStorage
    const allMsgs = getStoredMessages();
    const targetShopId = String(shopId || "1");

    let filtered = allMsgs.filter((m) => {
      if (userId) {
        return (
          (String(m.senderId) === String(userId) || String(m.receiverId) === String(userId)) &&
          (String(m.shopId) === targetShopId || targetShopId === "1" || !m.shopId)
        );
      }
      return String(m.shopId) === targetShopId;
    });

    if (filtered.length === 0) {
      filtered = allMsgs.filter((m) => String(m.shopId) === targetShopId);
    }

    return {
      chatId: chatId || `chat-${targetShopId}-${userId || "guest"}`,
      messages: filtered.length > 0 ? filtered : allMsgs.filter((m) => String(m.shopId) === targetShopId),
    };
  },

  // 4. Gửi tin nhắn mới (Tự động đồng bộ Database & LocalStorage)
  async sendMessage(params: {
    chatId?: string | number;
    senderId: string | number;
    receiverId?: string | number;
    shopId?: string | number;
    text: string;
    isFromCustomer: boolean;
    senderName?: string;
    imageUrl?: string;
  }): Promise<{ message: ChatMessage; chatId: string | number }> {
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

    const newMsg: ChatMessage = {
      id: Date.now(),
      senderId: params.senderId,
      receiverId: params.receiverId,
      shopId: params.shopId || 1,
      text: params.text,
      createdAt: timeStr,
      isFromCustomer: params.isFromCustomer,
      senderName: params.senderName || (params.isFromCustomer ? "Khách hàng" : "Chủ Shop"),
      imageUrl: params.imageUrl,
    };

    // 1. Luôn lưu ngay vào LocalStorage để đảm bảo tin nhắn được giữ lại và đồng bộ
    const allMsgs = getStoredMessages();
    allMsgs.push(newMsg);
    saveStoredMessages(allMsgs);

    // 2. Thử gửi lên Backend nếu có API
    try {
      const res = await apiClient.post<ApiResponse<any>>("/chat/SendMessage", {
        chatId: params.chatId || undefined,
        shopId: params.shopId || undefined,
        userId: params.receiverId || undefined,
        content: params.text,
        imageUrl: params.imageUrl || "",
      });

      const m = res.data.data;
      const returnedChatId = m?.chatId || params.chatId || `chat-${params.shopId}-${params.senderId}`;

      return {
        message: {
          ...newMsg,
          id: m?.messageId || m?.id || newMsg.id,
        },
        chatId: returnedChatId,
      };
    } catch (error) {
      console.warn("sendMessage API failed (using local sync mode):", error);
      return {
        message: newMsg,
        chatId: params.chatId || `chat-${params.shopId}-${params.senderId}`,
      };
    }
  },
};
