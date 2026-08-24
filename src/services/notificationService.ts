import { apiClient } from "./api";
import { AppNotification } from "../types";
import { INITIAL_NOTIFICATIONS } from "./mockData";

export const notificationService = {
  async getNotifications(userId?: number): Promise<AppNotification[]> {
    try {
      const res = await apiClient.get<AppNotification[]>("/notifications", {
        params: { userId },
      });
      return res.data;
    } catch {
      return userId
        ? INITIAL_NOTIFICATIONS.filter((n) => n.userId === userId)
        : INITIAL_NOTIFICATIONS;
    }
  },

  async markAsRead(id: number): Promise<boolean> {
    try {
      await apiClient.patch(`/notifications/${id}/read`);
      return true;
    } catch {
      const item = INITIAL_NOTIFICATIONS.find((n) => n.id === id);
      if (item) {
        item.read = true;
      }
      return true;
    }
  },

  async markAllAsRead(userId?: number): Promise<boolean> {
    try {
      await apiClient.patch("/notifications/read-all", { userId });
      return true;
    } catch {
      INITIAL_NOTIFICATIONS.forEach((n) => {
        if (!userId || n.userId === userId) {
          n.read = true;
        }
      });
      return true;
    }
  },
};
