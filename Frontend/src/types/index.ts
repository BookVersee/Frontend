export type Role = "customer" | "shop" | "admin" | "deliver";

export type OrderStatus =
  | "PENDING"
  | "PAID"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED"
  | "RETURNED";

export type PaymentMethod = "COD" | "ONLINE";

export type DeliveryStatus =
  | "PENDING"
  | "TRANSIT"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "RETURNED";

export type ReturnStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface Category {
  id: number;
  name: string;
}

export interface Book {
  id: number;
  shopId: number;
  shopName: string;
  categoryId: number;
  title: string;
  author: string;
  publisher: string;
  price: number;
  stock: number;
  rating: number;
  reviewCount: number;
  description: string;
  coverColor: string;
  coverColor2: string;
  status: "ACTIVE" | "OUT_OF_STOCK" | "HIDDEN";
}

export interface CartItem {
  book: Book;
  quantity: number;
}

export interface OrderItem {
  book: Book;
  quantity: number;
  unitPrice: number;
}

export interface OrderTracking {
  number: string;
  carrier: string;
  status: DeliveryStatus;
  estimated: string;
  actualDelivered?: string;
}

export interface OrderFeedback {
  rating: number;
  content: string;
  type: "SHOP" | "BOOK";
  createdAt: string;
  customer?: string;
}

export interface ReturnRequest {
  reason: string;
  reasonType: string;
  status: ReturnStatus;
  refundAmount: number;
  createdAt: string;
}

export interface Order {
  id: number;
  customerId: number;
  customerName: string;
  customerPhone: string;
  shopId: number;
  items: OrderItem[];
  totalAmount: number;
  shippingFee: number;
  orderStatus: OrderStatus;
  paymentStatus: "UNPAID" | "PAID" | "REFUNDED";
  paymentMethod: PaymentMethod;
  shippingAddress: string;
  createdAt: string;
  updatedAt: string;
  note?: string;
  tracking?: OrderTracking;
  feedback?: OrderFeedback;
  returnRequest?: ReturnRequest;
}

export interface Transaction {
  id: number;
  orderId: number;
  amount: number;
  type: string;
  paidBy: string;
  createdAt: string;
  code?: string;
}

export interface DeliveryTask {
  id: number;
  orderId: number;
  trackingNumber: string;
  customer: string;
  address: string;
  phone: string;
  status: DeliveryStatus;
  items: number;
  weight: string;
  estimatedDate: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  shopId?: number;
  shopName?: string;
  phone?: string;
  avatar?: string;
  createdAt?: string;
}

export interface AuthResponse {
  token: string;
  refreshToken?: string;
  user: User;
}

export type CustomerPage =
  | "home"
  | "book"
  | "cart"
  | "checkout"
  | "orders"
  | "orderDetail";
