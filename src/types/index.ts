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

export type DisputeLevel = "OPEN" | "PROCESSING" | "CLOSED";

export type UserStatus = "ACTIVE" | "LOCKED";

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
  isbn?: string;
  publishedYear?: number;
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
  note?: string;
}

export interface OrderFeedback {
  id?: number;
  orderId?: number;
  bookId?: number;
  rating: number;
  content: string;
  type: "SHOP" | "BOOK";
  createdAt: string;
  customer?: string;
  customerName?: string;
  shopReply?: string;
  shopRepliedAt?: string;
  isReported?: boolean;
  reportReason?: string;
}

export interface ReturnRequest {
  id?: number;
  orderId?: number;
  reason: string;
  reasonType: string;
  status: ReturnStatus;
  refundAmount: number;
  createdAt: string;
  evidenceImage?: string;
  shopResponse?: string;
  disputeStatus?: DisputeLevel;
  adminResolutionNote?: string;
}

export interface Order {
  id: number;
  customerId: number;
  customerName: string;
  customerPhone: string;
  shopId: number;
  shopName?: string;
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
  userId?: number;
  amount: number;
  type: "ONLINE" | "COD" | "SHIPPING_FEE" | "REFUND" | "SHOP_REVENUE" | "TOPUP";
  paidBy: string;
  createdAt: string;
  code?: string;
  status?: "SUCCESS" | "PENDING" | "FAILED";
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
  fee?: number;
  shipperName?: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  shopId?: number;
  shopName?: string;
  phone?: string;
  address?: string;
  avatar?: string;
  createdAt?: string;
  status?: UserStatus;
  shopStatus?: "PENDING" | "ACTIVE" | "REJECTED";
  balance?: number;
}

export interface Shop {
  id: number;
  ownerId: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  description?: string;
  avatar?: string;
  status: "PENDING" | "ACTIVE" | "REJECTED";
  rating: number;
  reviewCount: number;
  bookCount: number;
  joinedDate: string;
}

export interface AppNotification {
  id: number;
  userId: number;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  type: "ORDER" | "REFUND" | "CHAT" | "SYSTEM";
  link?: string;
}

export interface ChatMessage {
  id: number;
  senderId: number;
  receiverId: number;
  shopId?: number;
  text: string;
  createdAt: string;
  isFromCustomer: boolean;
  senderName?: string;
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
  | "orderDetail"
  | "profile"
  | "shopProfile";

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  errors?: string[];
}
