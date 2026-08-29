import { apiClient } from "./api";
import { ApiResponse } from "../types";

export interface PaymentUrlResponse {
  payment_url: string;
  qr_code_url?: string;
  deeplink?: string;
  isRealGateway?: boolean;
}

export const paymentService = {
  // 1. Tạo URL thanh toán MoMo Sandbox (Quét mã QR / App MoMo)
  async createMomoUrl(params: {
    orderId: string | number;
    amount?: number;
    orderInfo?: string;
  }): Promise<PaymentUrlResponse | null> {
    try {
      const res = await apiClient.post<ApiResponse<PaymentUrlResponse>>("/payment/CreatePaymentUrl", {
        order_id: params.orderId,
        order_info: params.orderInfo || `Thanh toan don hang MoMo ${params.orderId}`,
      });
      const data = res.data.data;
      if (data && data.payment_url) {
        return {
          ...data,
          isRealGateway: true,
        };
      }
      return null;
    } catch (error) {
      console.warn("createMomoUrl API error, falling back to In-App MoMo QR Modal:", error);
      // Fallback khi chạy chế độ Demo / Sandbox Offline: Tuyệt đối không redirect sang URL giả của MoMo
      const demoOrderId = params.orderId;
      const demoAmount = params.amount || 150000;
      
      // Tạo mã QR thanh toán chuẩn VietQR / MoMo format
      const demoQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(
        `2|99|0901234567|BOOKVERSE STORE|bookverse@gmail.com|0|0|${demoAmount}|Thanh toan don hang ${demoOrderId}|transfer_p2p`
      )}`;

      return {
        payment_url: "",
        qr_code_url: demoQrUrl,
        deeplink: `momo://app?action=payWithApp&isScanQR=true`,
        isRealGateway: false,
      };
    }
  },

  // 2. Tạo URL thanh toán VNPay Sandbox
  async createVnpayUrl(params: {
    orderId: string | number;
    amount?: number;
    orderInfo?: string;
    bankCode?: string;
  }): Promise<string | null> {
    try {
      const res = await apiClient.post<ApiResponse<PaymentUrlResponse>>("/payment/CreateVnpayUrl", {
        order_id: params.orderId,
        order_info: params.orderInfo || `Thanh toan don hang ${params.orderId}`,
        bank_code: params.bankCode || "",
      });
      return res.data.data?.payment_url || (res.data as any)?.payment_url || null;
    } catch (error) {
      console.warn("createVnpayUrl API error:", error);
      return null;
    }
  },

  // 3. Hoàn tiền đơn hàng qua MoMo / VNPay
  async processRefund(params: {
    orderId: string | number;
    amount: number;
    reason?: string;
    returnRequestId?: string | number;
  }): Promise<boolean> {
    try {
      await apiClient.post("/payment/ProcessRefund", {
        order_id: params.orderId,
        return_request_id: params.returnRequestId,
        amount: params.amount,
        refund_reason: params.reason || "Hoàn tiền đơn hàng qua MoMo",
      });
      return true;
    } catch (error) {
      console.warn("processRefund API error:", error);
      return false;
    }
  },

  // Backward compatibility
  async processVnpayRefund(params: {
    orderId: string | number;
    amount: number;
    reason?: string;
  }): Promise<boolean> {
    return this.processRefund(params);
  },
};
