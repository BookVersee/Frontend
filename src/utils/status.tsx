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
      color: "#c8843a",
      bg: "#fdf8f0",
      icon: <Clock size={11} />,
    },
    PAID: {
      label: "Đã thanh toán",
      color: "#2d4a3a",
      bg: "#e2ede0",
      icon: <CreditCard size={11} />,
    },
    PROCESSING: {
      label: "Đang xử lý",
      color: "#2d3a5a",
      bg: "#e8effc",
      icon: <Package size={11} />,
    },
    SHIPPED: {
      label: "Đang giao",
      color: "#3a2d4a",
      bg: "#f5eefc",
      icon: <Truck size={11} />,
    },
    DELIVERED: {
      label: "Đã giao",
      color: "#3d5c2e",
      bg: "#e2ede0",
      icon: <CheckCircle size={11} />,
    },
    CANCELLED: {
      label: "Đã hủy",
      color: "#c53030",
      bg: "#fdf2f2",
      icon: <XCircle size={11} />,
    },
    RETURNED: {
      label: "Hoàn hàng",
      color: "#92400e",
      bg: "#fcf5ec",
      icon: <RefreshCw size={11} />,
    },
  };
  return map[s] || { label: s, color: "#7a6a5a", bg: "#f3ede4" };
}

export function deliveryStatusInfo(s: DeliveryStatus): {
  label: string;
  color: string;
  bg: string;
} {
  const map: Record<DeliveryStatus, { label: string; color: string; bg: string }> = {
    PENDING: { label: "Chờ lấy hàng", color: "#c8843a", bg: "#fdf8f0" },
    TRANSIT: { label: "Đang vận chuyển", color: "#2d3a5a", bg: "#e8effc" },
    OUT_FOR_DELIVERY: { label: "Đang giao", color: "#3a2d4a", bg: "#f5eefc" },
    DELIVERED: { label: "Đã giao", color: "#3d5c2e", bg: "#e2ede0" },
    RETURNED: { label: "Hoàn về", color: "#c53030", bg: "#fdf2f2" },
  };
  return map[s] || { label: s, color: "#7a6a5a", bg: "#f3ede4" };
}

export const ROLE_LABELS: Record<Role, string> = {
  customer: "Khách hàng",
  shop: "Cửa hàng",
  admin: "Quản trị viên",
  deliver: "Người giao hàng",
};

export const ROLE_COLORS: Record<Role, string> = {
  customer: "#7c4a2d",
  shop: "#c8843a",
  admin: "#2a211c",
  deliver: "#3d5c2e",
};

