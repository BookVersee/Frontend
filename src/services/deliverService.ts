import { apiClient } from "./api";
import { DeliveryTask, DeliveryStatus } from "../types";
import { INITIAL_DELIVER_TASKS } from "./mockData";

export const deliverService = {
  async getDeliverTasks(): Promise<DeliveryTask[]> {
    try {
      const res = await apiClient.get<DeliveryTask[]>("/delivery/tasks");
      return res.data;
    } catch {
      return INITIAL_DELIVER_TASKS;
    }
  },

  async updateTaskStatus(taskId: number, status: DeliveryStatus): Promise<boolean> {
    try {
      await apiClient.patch(`/delivery/tasks/${taskId}`, { status });
      return true;
    } catch {
      const task = INITIAL_DELIVER_TASKS.find((t) => t.id === taskId);
      if (task) {
        task.status = status;
      }
      return true;
    }
  },
};
