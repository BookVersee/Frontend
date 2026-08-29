import { apiClient } from "./api";
import { AppNotification, ApiResponse } from "../types";
import { INITIAL_NOTIFICATIONS } from "./mockData";

export const notificationService = {
  // 1. Lấy toàn bộ thông báo của người dùng
  async getNotifications(userId?: string | number): Promise<AppNotification[]> {
    try {
      const res = await apiClient.get<ApiResponse<any[]>>("/notifications/GetNotifications");
      const list = res.data.data || [];
      return list.map((n: any) => ({
        id: n.id,
        userId: n.userId || userId || "",
        title: n.title,
        message: n.content || n.message,
        read: n.isRead ?? n.read ?? false,
        createdAt: n.createdAt,
        type: n.type || "SYSTEM",
        link: n.link,
      }));
    } catch (error) {
      console.warn("getNotifications API error, falling back to mock:", error);
      return userId
        ? INITIAL_NOTIFICATIONS.filter((n) => String(n.userId) === String(userId))
        : INITIAL_NOTIFICATIONS;
    }
  },

  // 2. Lấy thông báo chưa đọc
  async getUnreadNotifications(): Promise<AppNotification[]> {
    try {
      const res = await apiClient.get<ApiResponse<any[]>>("/notifications/GetUnreadNotifications");
      const list = res.data.data || [];
      return list.map((n: any) => ({
        id: n.id,
        userId: n.userId,
        title: n.title,
        message: n.content || n.message,
        read: false,
        createdAt: n.createdAt,
        type: n.type || "SYSTEM",
        link: n.link,
      }));
    } catch (error) {
      console.warn("getUnreadNotifications API error, falling back to mock:", error);
      return INITIAL_NOTIFICATIONS.filter((n) => !n.read);
    }
  },

  // 3. Đánh dấu 1 thông báo là đã đọc
  async markAsRead(id: string | number): Promise<boolean> {
    try {
      await apiClient.put("/notifications/MarkAsRead", null, {
        params: { id }
      });
      return true;
    } catch (error) {
      console.warn("markAsRead API error, falling back to mock:", error);
      const item = INITIAL_NOTIFICATIONS.find((n) => String(n.id) === String(id));
      if (item) item.read = true;
      return true;
    }
  },

  // 4. Đánh dấu tất cả thông báo là đã đọc
  async markAllAsRead(): Promise<boolean> {
    try {
      await apiClient.put("/notifications/MarkAllAsRead");
      return true;
    } catch (error) {
      console.warn("markAllAsRead API error, falling back to mock:", error);
      INITIAL_NOTIFICATIONS.forEach((n) => { n.read = true; });
      return true;
    }
  },
};
