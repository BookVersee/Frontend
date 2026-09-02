import { apiClient } from "./api";
import { ChatMessage, ApiResponse } from "../types";
import { INITIAL_MESSAGES, INITIAL_SHOPS, INITIAL_BOOKS } from "./mockData";

export interface ChatThread {
  chatId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  shopId: string;
  shopName?: string;
  lastMessage?: string;
  unreadCount: number;
  updatedAt: string;
  needsReply?: boolean;
  lastSenderId?: string | number;
}

export const isValidGuid = (val: any): boolean => {
  if (!val || typeof val !== "string") return false;
  return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(val.trim());
};

export interface ShopVoucher {
  code: string;
  label: string;
  discount: number;
  minSpend: number;
}

export interface ProductCardData {
  id: string | number;
  title: string;
  price: number;
  originalPrice?: number;
  imageUrl?: string;
  stock?: number;
  author?: string;
  publisher?: string;
  rating?: number;
  categoryName?: string;
}

// 1. Hàm mã hóa Thẻ Sách vào tin nhắn text để lưu xuống DB và phát SignalR
export const formatProductCardText = (book: {
  id: string | number;
  title: string;
  price: number;
  originalPrice?: number;
  imageUrl?: string;
  stock?: number;
  author?: string;
  publisher?: string;
  rating?: number;
}) => {
  const safeTitle = (book.title || "").replace(/[:\[\]]/g, " ").trim();
  const safeAuthor = (book.author || "Đang cập nhật").replace(/[:\[\]]/g, " ").trim();
  const safePublisher = (book.publisher || "NXB Tổng Hợp").replace(/[:\[\]]/g, " ").trim();
  const safeImg = encodeURIComponent(book.imageUrl || "");
  const origPrice = book.originalPrice || 0;
  const rating = book.rating || 5;
  return `[PRODUCT:${book.id}:${book.price}:${book.stock ?? 0}:${safeImg}:${origPrice}:${safeAuthor}:${safePublisher}:${rating}:${safeTitle}]\nShop xin gửi bạn thông tin cuốn sách "${safeTitle}"`;
};

// 2. Hàm dọn dẹp mã [PRODUCT:...] để hiển thị text thuần sạch sẽ
export const cleanProductText = (text: string): string => {
  if (!text) return "";
  return text.replace(/\[PRODUCT:[^\]]+\]\n?/g, "").trim();
};

// 3. Hàm giải mã Thẻ Sách từ tin nhắn (hỗ trợ cả cú pháp mới và tin nhắn cũ trong DB)
export const parseProductFromMessage = (m: ChatMessage): ProductCardData | null => {
  // Ưu tiên 1: Đã có sẵn productData
  if (m.productData) {
    const bookTitle = m.productData.title || "";
    const mockMatch = INITIAL_BOOKS.find(
      (b) =>
        b.title.toLowerCase().includes(bookTitle.toLowerCase()) ||
        bookTitle.toLowerCase().includes(b.title.toLowerCase())
    );
    return {
      id: m.productData.id,
      title: m.productData.title,
      price: m.productData.price,
      originalPrice: m.productData.originalPrice,
      imageUrl: m.productData.imageUrl || mockMatch?.imageUrl || (m.imageUrl && !m.imageUrl.includes("upload") ? m.imageUrl : undefined),
      stock: m.productData.stock,
      author: mockMatch?.author || "Đang cập nhật tác giả",
      publisher: mockMatch?.publisher || "NXB Hội Nhà Văn",
      rating: mockMatch?.rating || 4.8,
    };
  }

  const text = m.text || "";

  // Ưu tiên 2A: Parse từ cú pháp 9 tham số [PRODUCT:id:price:stock:imageUrl:origPrice:author:publisher:rating:title]
  const match9 = text.match(/\[PRODUCT:([^:]+):([^:]+):([^:]*):([^:]*):([^:]*):([^:]*):([^:]*):([^:]*):([^\]]+)\]/);
  if (match9) {
    return {
      id: match9[1],
      price: Number(match9[2]) || 0,
      stock: match9[3] ? Number(match9[3]) : undefined,
      imageUrl: match9[4] ? decodeURIComponent(match9[4]) : undefined,
      originalPrice: match9[5] ? Number(match9[5]) : undefined,
      author: match9[6] || undefined,
      publisher: match9[7] || undefined,
      rating: match9[8] ? Number(match9[8]) : 4.8,
      title: match9[9],
    };
  }

  // Ưu tiên 2B: Parse từ cú pháp 6 tham số [PRODUCT:id:price:stock:imageUrl:origPrice:title]
  const match6 = text.match(/\[PRODUCT:([^:]+):([^:]+):([^:]*):([^:]*):([^:]*):([^\]]+)\]/);
  if (match6) {
    const bookTitle = match6[6];
    const mockMatch = INITIAL_BOOKS.find(
      (b) =>
        b.title.toLowerCase().includes(bookTitle.toLowerCase()) ||
        bookTitle.toLowerCase().includes(b.title.toLowerCase())
    );
    return {
      id: match6[1],
      price: Number(match6[2]) || 0,
      stock: match6[3] ? Number(match6[3]) : undefined,
      imageUrl: (match6[4] ? decodeURIComponent(match6[4]) : undefined) || mockMatch?.imageUrl,
      originalPrice: match6[5] ? Number(match6[5]) : undefined,
      author: mockMatch?.author || "Đang cập nhật tác giả",
      publisher: mockMatch?.publisher || "NXB Hội Nhà Văn",
      rating: mockMatch?.rating || 4.8,
      title: bookTitle,
    };
  }

  // Ưu tiên 2C: Cú pháp cũ hơn [PRODUCT:id:price:stock:imageUrl:title] (5 tham số)
  const match5 = text.match(/\[PRODUCT:([^:]+):([^:]+):([^:]*):([^:]*):([^\]]+)\]/);
  if (match5) {
    const bookTitle = match5[5];
    const mockMatch = INITIAL_BOOKS.find(
      (b) =>
        b.title.toLowerCase().includes(bookTitle.toLowerCase()) ||
        bookTitle.toLowerCase().includes(b.title.toLowerCase())
    );
    return {
      id: match5[1],
      price: Number(match5[2]) || 0,
      stock: match5[3] ? Number(match5[3]) : undefined,
      imageUrl: (match5[4] ? decodeURIComponent(match5[4]) : undefined) || mockMatch?.imageUrl,
      author: mockMatch?.author || "Đang cập nhật tác giả",
      publisher: mockMatch?.publisher || "NXB Hội Nhà Văn",
      rating: mockMatch?.rating || 4.8,
      title: bookTitle,
    };
  }

  // Ưu tiên 3: Tương thích ngược với các tin nhắn cũ trong DB:
  // Ví dụ: Shop xin gửi bạn thông tin cuốn sách "Muôn Kiếp Nhân Sinh (Tập 1)" hoặc "Nhà Giả Kim"
  const titleMatch = text.match(/cuốn sách ["“]([^"”]+)["”]/i);
  if (titleMatch && titleMatch[1]) {
    const bookTitle = titleMatch[1].trim();
    const found = INITIAL_BOOKS.find(
      (b) =>
        b.title.toLowerCase().includes(bookTitle.toLowerCase()) ||
        bookTitle.toLowerCase().includes(b.title.toLowerCase())
    );
    if (found) {
      return {
        id: found.id,
        title: found.title,
        price: found.price,
        originalPrice: found.originalPrice,
        imageUrl: found.imageUrl,
        stock: found.stock,
        author: found.author,
        publisher: found.publisher,
        rating: found.rating || 4.8,
      };
    }
    return {
      id: "book-card",
      title: bookTitle,
      price: 95000,
      imageUrl: m.imageUrl || "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop",
      stock: 10,
      author: "Đang cập nhật",
      publisher: "NXB Tổng Hợp",
      rating: 4.8,
    };
  }

  return null;
};

export const SHOP_VOUCHERS: ShopVoucher[] = [
  { code: "BVBOOK10K", label: "Giảm 10.000đ", minSpend: 150000, discount: 10000 },
  { code: "BVFREESHIP", label: "Freeship 30.000đ", minSpend: 200000, discount: 30000 },
  { code: "BVVIPBOOK25", label: "Khách quen - Giảm 25.000đ", minSpend: 300000, discount: 25000 },
];

export const parseVoucherFromMessage = (m: ChatMessage): ShopVoucher | null => {
  if (m.voucherData) {
    return {
      code: m.voucherData.code,
      label: `Giảm ${m.voucherData.discountAmount.toLocaleString("vi-VN")}đ`,
      discount: m.voucherData.discountAmount,
      minSpend: m.voucherData.minSpend,
    };
  }

  const text = m.text || "";
  // 1. Parse cú pháp chuẩn [VOUCHER:code:discount:minSpend:label]
  const match = text.match(/\[VOUCHER:([^:]+):([^:]+):([^:]+):?([^\]]*)\]/);
  if (match) {
    return {
      code: match[1],
      discount: Number(match[2]) || 10000,
      minSpend: Number(match[3]) || 150000,
      label: match[4] || `Giảm ${Number(match[2]).toLocaleString("vi-VN")}đ`,
    };
  }

  // 2. Parse từ câu text: Shop gửi tặng bạn mã giảm giá BVFREESHIP (Freeship 30.000đ)!
  const codeMatch = text.match(/(BV[A-Z0-9]+)/);
  if (codeMatch) {
    const code = codeMatch[1];
    const found = SHOP_VOUCHERS.find((v) => v.code === code);
    if (found) return found;
    return {
      code,
      label: "Mã giảm giá độc quyền",
      discount: 10000,
      minSpend: 150000,
    };
  }

  return null;
};

export const cleanAndDeduplicateMessages = (messages: ChatMessage[]): ChatMessage[] => {
  const result: ChatMessage[] = [];
  const seenKeys = new Set<string>();

  for (const m of messages) {
    const idKey = m.id ? String(m.id) : "";

    if (idKey && seenKeys.has(idKey)) {
      continue;
    }

    // Key phân biệt nội dung tin nhắn: senderId + text + imageUrl (nếu có) + id + createdAt
    // Đảm bảo mỗi bức ảnh là một thực thể độc lập duy nhất, không bao giờ bị đè mất
    const imagePart = m.imageUrl ? `_img:${m.imageUrl}` : "";
    const idPart = (m.imageUrl || !m.text?.trim()) ? `_id:${m.id || Date.now()}` : "";
    const contentKey = `${String(m.senderId)}_${(m.text || "").trim()}${imagePart}${idPart}_${m.createdAt || ""}`;

    if (seenKeys.has(contentKey)) {
      // Nếu đã thấy nội dung này rồi, kiểm tra xem tin nhắn hiện tại có ID GUID hợp lệ từ server không
      if (isValidGuid(m.id)) {
        const idx = result.findIndex((item) => {
          const itemImg = item.imageUrl ? `_img:${item.imageUrl}` : "";
          const itemId = (item.imageUrl || !item.text?.trim()) ? `_id:${item.id || Date.now()}` : "";
          return `${String(item.senderId)}_${(item.text || "").trim()}${itemImg}${itemId}_${item.createdAt || ""}` === contentKey;
        });
        if (idx !== -1) {
          result[idx] = m;
          seenKeys.add(idKey);
        }
      }
      continue;
    }

    seenKeys.add(contentKey);
    if (idKey) seenKeys.add(idKey);
    result.push(m);
  }

  return result;
};

const STORAGE_KEY = "bookverse_chat_messages";

// Lấy danh sách tin nhắn từ LocalStorage (đồng bộ giữa các tab/vai trò)
const getStoredMessages = (): ChatMessage[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed: ChatMessage[] = JSON.parse(raw);
      return cleanAndDeduplicateMessages(parsed);
    }
  } catch (e) {
    console.warn("Error reading stored chat messages:", e);
  }
  return [...INITIAL_MESSAGES];
};

// Lưu tin nhắn vào LocalStorage
const saveStoredMessages = (messages: ChatMessage[]) => {
  try {
    const deduped = cleanAndDeduplicateMessages(messages);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(deduped));
    window.dispatchEvent(new CustomEvent("bookverse_chat_updated", { detail: deduped }));
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
      const lastCustomerMsg = [...group.msgs].reverse().find((m) => m.isFromCustomer);

      threads.push({
        chatId: `chat-${targetShopId}-${uKey}`,
        userId: uKey,
        userName: group.name,
        userAvatar: lastCustomerMsg?.avatar,
        shopId: targetShopId,
        lastMessage: lastMsg?.text,
        unreadCount: unreadCount > 0 ? 1 : 0,
        updatedAt: lastMsg?.createdAt || "Vừa xong",
        needsReply: lastMsg ? lastMsg.isFromCustomer : false,
        lastSenderId: lastMsg?.senderId,
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

  // 3A. Lấy lịch sử tin nhắn của cuộc hội thoại (hỗ trợ cả gọi bằng shopId hoặc params)
  async getConversationMessages(
    shopIdOrParams: any,
    userId?: string | number
  ): Promise<{ chatId?: string | number; messages: ChatMessage[] }> {
    if (typeof shopIdOrParams === "object" && shopIdOrParams !== null) {
      return this.getMessages(shopIdOrParams);
    }
    return this.getMessages({ shopId: shopIdOrParams, userId });
  },

  // 3B. Lấy lịch sử tin nhắn trong phòng chat
  async getMessages(params: {
    chatId?: string | number;
    shopId?: string | number;
    userId?: string | number;
  }): Promise<{ chatId?: string | number; messages: ChatMessage[] }> {
    const { chatId, shopId, userId } = params;

    try {
      // Nếu chưa có chatId nhưng có shopId, tự tra cứu chatId từ danh sách hội thoại của user
      let targetChatId = chatId;
      if ((!targetChatId || !isValidGuid(targetChatId)) && shopId) {
        try {
          const convRes = await apiClient.get<ApiResponse<ChatThread[]>>("/chat/GetUserConversations");
          const list = convRes.data?.data || [];
          const matched = list.find((t) => String(t.shopId) === String(shopId));
          if (matched && matched.chatId && isValidGuid(matched.chatId)) {
            targetChatId = matched.chatId;
          }
        } catch (e) {
          // ignore
        }
      }

      if (targetChatId && isValidGuid(targetChatId)) {
        const res = await apiClient.get<ApiResponse<any[]>>("/chat/GetConversationMessages", {
          params: { chatId: targetChatId },
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
            messageType: m.imageUrl ? "image" : (m.messageType || "text"),
          }));

          return { chatId: targetChatId, messages };
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
    avatar?: string;
    messageType?: "text" | "product_card" | "order_card" | "voucher_card" | "image";
    productData?: ChatMessage["productData"];
    orderData?: ChatMessage["orderData"];
    voucherData?: ChatMessage["voucherData"];
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
      avatar: params.avatar,
      messageType: params.messageType || (params.imageUrl ? "image" : "text"),
      productData: params.productData,
      orderData: params.orderData,
      voucherData: params.voucherData,
    };

    // 1. Luôn lưu ngay vào LocalStorage để đảm bảo tin nhắn được giữ lại và đồng bộ
    const allMsgs = getStoredMessages();
    allMsgs.push(newMsg);
    saveStoredMessages(allMsgs);

    // 2. Chuẩn hóa payload hợp lệ theo đúng schema C# Guid? của Backend
    const validChatId = isValidGuid(params.chatId) ? String(params.chatId).trim() : undefined;
    
    let resolvedShopId: string | undefined = undefined;
    if (isValidGuid(params.shopId)) {
      resolvedShopId = String(params.shopId).trim();
    } else if (params.shopId === 1 || params.shopId === "1") {
      resolvedShopId = "11111111-0000-0000-0000-000000000001";
    } else if (params.shopId === 2 || params.shopId === "2") {
      resolvedShopId = "22222222-0000-0000-0000-000000000002";
    }

    const validUserId = isValidGuid(params.receiverId) ? String(params.receiverId).trim() : undefined;

    // 3. Gửi lên Backend API
    try {
      // Đảm bảo imageUrl luôn là chuỗi string URL hợp lệ
      const imageStr = typeof params.imageUrl === "string" 
        ? params.imageUrl 
        : (params.imageUrl as any)?.url || "";

      const payload: any = {
        content: params.text,
        imageUrl: imageStr,
      };
      if (validChatId) payload.chatId = validChatId;
      if (resolvedShopId) payload.shopId = resolvedShopId;
      if (validUserId) payload.userId = validUserId;

      // Chỉ gửi HTTP request lên Backend khi có ít nhất ChatId hoặc cặp (ShopId, UserId) hợp lệ
      if (!validChatId && !validUserId) {
        return {
          message: newMsg,
          chatId: params.chatId || `chat-${params.shopId}-${params.senderId}`,
        };
      }

      const res = await apiClient.post<ApiResponse<any>>("/chat/SendMessage", payload);

      const m = res.data.data;
      const returnedChatId = m?.chatId || params.chatId || `chat-${params.shopId}-${params.senderId}`;

      // Cập nhật lại ID chính thức từ Database vào LocalStorage
      if (m?.messageId) {
        const stored = getStoredMessages();
        const target = stored.find((item) => item.id === newMsg.id);
        if (target) {
          target.id = m.messageId;
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
          } catch {}
        }
      }

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
