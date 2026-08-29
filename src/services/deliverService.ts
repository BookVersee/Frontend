import { apiClient } from "./api";
import { DeliveryTask, DeliveryStatus, ApiResponse } from "../types";
import { INITIAL_DELIVER_TASKS } from "./mockData";

export const deliverService = {
  // 1. Lấy danh sách đơn hàng cần giao cho Shipper
  async getDeliverTasks(status?: string): Promise<DeliveryTask[]> {
    try {
      const res = await apiClient.get<ApiResponse<any[]>>("/delivery/GetDeliveryOrders", {
        params: { status }
      });
      const deliveries = res.data.data || [];
      return deliveries.map((d: any) => ({
        id: d.id,
        orderId: d.orderId,
        trackingNumber: d.trackingNumber || `GHN${String(d.id).slice(0, 8)}`,
        customer: d.customerName || d.receiverName || "Khách hàng",
        address: d.shippingAddress || d.address || "Địa chỉ giao hàng",
        phone: d.customerPhone || d.receiverPhone || "0901234567",
        status: (d.status as DeliveryStatus) || "PENDING",
        items: d.itemCount || 1,
        weight: d.weight ? `${d.weight}g` : "500g",
        estimatedDate: d.estimatedDeliveryDate || "Trong ngày hôm nay",
        fee: d.codAmount || d.shippingFee || 30000,
        shipperName: d.shipperName || "Shipper BookVerse",
      }));
    } catch (error) {
      console.warn("getDeliverTasks API error, falling back to mock:", error);
      return status ? INITIAL_DELIVER_TASKS.filter((t) => t.status === status) : INITIAL_DELIVER_TASKS;
    }
  },

  // 2. Cập nhật trạng thái giao hàng (OUT_FOR_DELIVERY, DELIVERED, FAILED)
  async updateTaskStatus(deliveryId: string | number, status: DeliveryStatus, notes = ""): Promise<boolean> {
    try {
      await apiClient.post("/delivery/UpdateDeliveryStatus", {
        status,
        notes: notes || `Cập nhật giao hàng: ${status}`
      }, {
        params: { deliveryId }
      });
      return true;
    } catch (error) {
      console.warn("updateTaskStatus API error, falling back to mock:", error);
      const task = INITIAL_DELIVER_TASKS.find((t) => String(t.id) === String(deliveryId));
      if (task) {
        task.status = status;
      }
      return true;
    }
  },
};
