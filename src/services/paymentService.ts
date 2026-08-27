import { apiClient } from "./api";
import { ApiResponse } from "../types";

export const paymentService = {
  // 1. Tạo URL thanh toán VNPay Sandbox
  async createVnpayUrl(params: {
    orderId: string | number;
    amount: number;
    orderInfo?: string;
    returnUrl?: string;
  }): Promise<string | null> {
    try {
      const res = await apiClient.post<ApiResponse<{ payment_url: string }>>("/payment/CreateVnpayUrl", {
        orderId: params.orderId,
        amount: params.amount,
        orderInfo: params.orderInfo || `Thanh toán đơn hàng #${params.orderId}`,
        returnUrl: params.returnUrl || `${window.location.origin}/payment-result`,
      });
      return res.data.data?.payment_url || (res.data as any)?.payment_url || null;
    } catch (error) {
      console.warn("createVnpayUrl API error:", error);
      return null;
    }
  },

  // 2. Hoàn tiền đơn hàng qua VNPay
  async processVnpayRefund(params: {
    orderId: string | number;
    amount: number;
    reason?: string;
  }): Promise<boolean> {
    try {
      await apiClient.post("/payment/ProcessVnpayRefund", {
        orderId: params.orderId,
        amount: params.amount,
        reason: params.reason || "Hoàn tiền đơn hàng trả lại",
      });
      return true;
    } catch (error) {
      console.warn("processVnpayRefund API error:", error);
      return false;
    }
  },
};
