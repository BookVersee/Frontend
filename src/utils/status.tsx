import React from "react";
import {
  Clock,
  CreditCard,
  Package,
  Truck,
  CheckCircle,
  XCircle,
  RefreshCw,
} from "lucide-react";
import { OrderStatus, DeliveryStatus, Role } from "../types";

export interface StatusInfo {
  label: string;
  color: string;
  bg: string;
  icon?: React.ReactNode;
}

export function orderStatusInfo(s: OrderStatus): StatusInfo {
  const map: Record<OrderStatus, StatusInfo> = {
    PENDING: {
      label: "Chờ xác nhận",
      color: "#b45309",
      bg: "#fef3c7",
      icon: <Clock size={11} />,
    },
    PAID: {
      label: "Đã thanh toán",
      color: "#047857",
      bg: "#d1fae5",
      icon: <CreditCard size={11} />,
    },
    PROCESSING: {
      label: "Đang xử lý",
      color: "#1d4ed8",
      bg: "#dbeafe",
      icon: <Package size={11} />,
    },
    SHIPPED: {
      label: "Đang giao",
      color: "#6d28d9",
      bg: "#ede9fe",
      icon: <Truck size={11} />,
    },
    DELIVERED: {
      label: "Đã giao",
      color: "#065f46",
      bg: "#d1fae5",
      icon: <CheckCircle size={11} />,
    },
    CANCELLED: {
      label: "Đã hủy",
      color: "#b91c1c",
      bg: "#fee2e2",
      icon: <XCircle size={11} />,
    },
    RETURNED: {
      label: "Hoàn hàng",
      color: "#92400e",
      bg: "#fef3c7",
      icon: <RefreshCw size={11} />,
    },
  };
  return map[s] || { label: s, color: "#64748b", bg: "#f1f5f9" };
}

export function deliveryStatusInfo(s: DeliveryStatus): {
  label: string;
  color: string;
  bg: string;
} {
  const map: Record<DeliveryStatus, { label: string; color: string; bg: string }> = {
    PENDING: { label: "Chờ lấy hàng", color: "#b45309", bg: "#fef3c7" },
    TRANSIT: { label: "Đang vận chuyển", color: "#1d4ed8", bg: "#dbeafe" },
    OUT_FOR_DELIVERY: { label: "Đang giao", color: "#6d28d9", bg: "#ede9fe" },
    DELIVERED: { label: "Đã giao", color: "#047857", bg: "#d1fae5" },
    RETURNED: { label: "Hoàn về", color: "#b91c1c", bg: "#fee2e2" },
  };
  return map[s] || { label: s, color: "#64748b", bg: "#f1f5f9" };
}

export const ROLE_LABELS: Record<Role, string> = {
  customer: "Khách hàng",
  shop: "Cửa hàng",
  admin: "Quản trị viên",
  deliver: "Người giao hàng",
};

export const ROLE_COLORS: Record<Role, string> = {
  customer: "#1d4ed8",
  shop: "#047857",
  admin: "#b91c1c",
  deliver: "#6d28d9",
};
