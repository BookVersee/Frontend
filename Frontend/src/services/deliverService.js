import { apiClient } from "./api";
import { INITIAL_DELIVER_TASKS } from "./mockData";

export const deliverService = {
  async getDeliverTasks() {
    try {
      const res = await apiClient.get("/delivery/tasks");
      return res.data;
    } catch {
      return INITIAL_DELIVER_TASKS;
    }
  },

  async updateTaskStatus(taskId, status) {
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
