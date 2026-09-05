import { apiClient } from "./api";
import { AppNotification, ApiResponse } from "../types";

// Quản lý danh sách thông báo đã xóa trên trình duyệt (Local Soft-Delete Persistence)
const getDeletedIds = (userId?: string | number): Set<string> => {
  try {
    const key = `bookverse_deleted_notifs_${userId || "user"}`;
    const raw = localStorage.getItem(key);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
};

const addDeletedId = (id: string | number, userId?: string | number) => {
  try {
    const key = `bookverse_deleted_notifs_${userId || "user"}`;
    const set = getDeletedIds(userId);
    set.add(String(id));
    localStorage.setItem(key, JSON.stringify(Array.from(set)));
  } catch {}
};

const addDeletedIds = (ids: (string | number)[], userId?: string | number) => {
  try {
    const key = `bookverse_deleted_notifs_${userId || "user"}`;
    const set = getDeletedIds(userId);
    ids.forEach((id) => set.add(String(id)));
    localStorage.setItem(key, JSON.stringify(Array.from(set)));
  } catch {}
};

export const notificationService = {
  // 1. Lấy toàn bộ thông báo từ Backend API (100% dữ liệu thật, không dùng mockData)
  async getNotifications(userId?: string | number): Promise<AppNotification[]> {
    try {
      const res = await apiClient.get<ApiResponse<any[]>>("/notifications/GetNotifications");
      const list = res.data.data || [];
      const deletedIds = getDeletedIds(userId);

      return list
        .filter((n: any) => !deletedIds.has(String(n.id)))
        .map((n: any) => ({
          id: n.id,
          userId: n.userId || userId || "",
          title: n.title || (n.type === "CHAT" ? "Tin nhắn mới" : n.type === "ORDER_UPDATE" ? "Cập nhật đơn hàng" : "Thông báo hệ thống"),
          message: n.content || n.message || "",
          read: n.isRead ?? n.read ?? false,
          createdAt: n.createdAt ? new Date(n.createdAt).toLocaleString("vi-VN") : "Vừa xong",
          type: n.type || "SYSTEM",
          link: n.referenceId ? `/orders?id=${n.referenceId}` : n.link,
          referenceId: n.referenceId,
          imageUrl: n.imageUrl,
        }));
    } catch (error) {
      console.warn("[notificationService] getNotifications API error:", error);
      return []; // Tuyệt đối không fallback mockData
    }
  },

  // 2. Lấy thông báo chưa đọc từ Backend API
  async getUnreadNotifications(userId?: string | number): Promise<AppNotification[]> {
    try {
      const res = await apiClient.get<ApiResponse<any[]>>("/notifications/GetUnreadNotifications");
      const list = res.data.data || [];
      const deletedIds = getDeletedIds(userId);

      return list
        .filter((n: any) => !deletedIds.has(String(n.id)))
        .map((n: any) => ({
          id: n.id,
          userId: n.userId || userId || "",
          title: n.title || (n.type === "CHAT" ? "Tin nhắn mới" : n.type === "ORDER_UPDATE" ? "Cập nhật đơn hàng" : "Thông báo hệ thống"),
          message: n.content || n.message || "",
          read: false,
          createdAt: n.createdAt ? new Date(n.createdAt).toLocaleString("vi-VN") : "Vừa xong",
          type: n.type || "SYSTEM",
          link: n.referenceId ? `/orders?id=${n.referenceId}` : n.link,
          referenceId: n.referenceId,
          imageUrl: n.imageUrl,
        }));
    } catch (error) {
      console.warn("[notificationService] getUnreadNotifications API error:", error);
      return []; // Tuyệt đối không fallback mockData
    }
  },

  // 3. Đánh dấu 1 thông báo cụ thể là đã đọc
  async markAsRead(id: string | number): Promise<boolean> {
    try {
      await apiClient.put("/notifications/MarkAsRead", null, {
        params: { id }
      });
      return true;
    } catch (error) {
      console.warn("[notificationService] markAsRead API error:", error);
      return true;
    }
  },

  // 4. Đánh dấu tất cả thông báo là đã đọc
  async markAllAsRead(): Promise<boolean> {
    try {
      await apiClient.put("/notifications/MarkAllAsRead");
      return true;
    } catch (error) {
      console.warn("[notificationService] markAllAsRead API error:", error);
      return true;
    }
  },

  // 5. Ẩn/Xóa 1 thông báo khỏi danh sách máy khách (đồng thời đánh dấu đã đọc trên DB)
  async deleteNotification(id: string | number, userId?: string | number): Promise<boolean> {
    addDeletedId(id, userId);
    try {
      // Đánh dấu đã đọc trên server
      await apiClient.put("/notifications/MarkAsRead", null, { params: { id } });
    } catch {}
    return true;
  },

  // 6. Dọn dẹp/Ẩn toàn bộ thông báo (Đánh dấu đã đọc trên DB và ẩn trên máy khách, không gọi API 404)
  async deleteAllNotifications(ids: (string | number)[], userId?: string | number): Promise<boolean> {
    addDeletedIds(ids, userId);
    try {
      // Đồng bộ đánh dấu tất cả đã đọc lên Backend qua API hợp lệ
      await apiClient.put("/notifications/MarkAllAsRead");
    } catch {}
    return true;
  },
};
