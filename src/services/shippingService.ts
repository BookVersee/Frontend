import { apiClient } from "./api";
import { ApiResponse } from "../types";

export interface CreateGhnOrderDto {
  orderId: string | number;
  requiredNote?: string; // "CHOXEMHANGKHONGTHU" | "CHOTHOIGIAN" | "KHONGCHOXEMHANG"
}

export interface GhnDeliveryResult {
  id: string;
  orderId: string;
  trackingNumber: string;
  carrierName: string;
  shipFee: number;
  status: string;
  estimatedDelivery?: string;
}

export const shippingService = {
  /**
   * Tạo vận đơn giao hàng qua API Giao Hàng Nhanh (GHN Sandbox)
   * POST /api/shipping/CreateGhnOrder
   * @param orderId ID của đơn hàng cần bàn giao
   * @param requiredNote Ghi chú xem hàng bắt buộc (Mặc định: CHOXEMHANGKHONGTHU)
   */
  async createGhnOrder(
    orderId: string | number,
    requiredNote = "CHOXEMHANGKHONGTHU"
  ): Promise<GhnDeliveryResult> {
    const res = await apiClient.post<ApiResponse<GhnDeliveryResult>>("/shipping/CreateGhnOrder", {
      orderId,
      requiredNote,
    });
    return res.data?.data;
  },
};
