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
  id: string | number;
  name: string;
}

export interface BookImageDto {
  id?: string | number;
  imageUrl: string;
  publicId?: string;
  isCover?: boolean;
  displayOrder?: number;
}

export interface Book {
  id: string | number;
  shopId: string | number;
  shopName: string;
  categoryId: string | number;
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
  imageUrl?: string;
  images?: BookImageDto[];
  imageUrls?: string[];
  status: "ACTIVE" | "OUT_OF_STOCK" | "HIDDEN";
  isbn?: string;
  publishedYear?: number;
}

export interface CartItem {
  cartDetailId?: string;
  book: Book;
  quantity: number;
}

export interface BackendCartItemResponse {
  cartDetailId: string;
  bookId: string;
  bookTitle: string;
  bookImage?: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
}

export interface BackendShopGroupResponse {
  shopId: string;
  shopName: string;
  items: BackendCartItemResponse[];
  shopSubtotal: number;
}

export interface BackendCartResponse {
  cartId: string;
  userId: string;
  shopGroups: BackendShopGroupResponse[];
  grandTotal: number;
}

export interface OrderItem {
  orderDetailId?: string;
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
  id?: string | number;
  feedbackId?: string | number;
  orderId?: string | number;
  orderDetailId?: string | number;
  bookId?: string | number;
  bookTitle?: string;
  bookImageUrl?: string;
  bookPrice?: number;
  rating: number;
  content: string;
  type?: "SHOP" | "BOOK" | string;
  imageUrl?: string;
  createdAt: string;
  customer?: string;
  customerName?: string;
  customerAvatar?: string;
  shopReply?: string;
  shopRepliedAt?: string;
  shopReplyImageUrl?: string;
  isReported?: boolean;
  reportReason?: string;
}

export interface ReturnRequest {
  id?: string | number;
  orderId?: string | number;
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
  id: string | number;
  customerId: string | number;
  customerName: string;
  customerPhone: string;
  shopId: string | number;
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

export interface BackendTransactionResponse {
  id: string;
  userId: string;
  referenceType?: "ORDER_PAYMENT" | "REFUND" | "SHIPPING_FEE" | "SHOP_REVENUE" | "WITHDRAWAL" | string;
  referenceId?: string | null;
  transactionType?: "IN" | "OUT" | string;
  amount: number;
  transactionCode?: string | null;
  description?: string | null;
  createdAt: string;
}

export interface Transaction {
  id: string | number;
  orderId?: string | number;
  userId?: string | number;
  amount: number;
  type: "ONLINE" | "COD" | "SHIPPING_FEE" | "REFUND" | "SHOP_REVENUE" | "TOPUP" | string;
  paidBy?: string;
  createdAt: string;
  code?: string;
  status?: "SUCCESS" | "PENDING" | "FAILED" | string;
  // Các trường nghiệp vụ chính từ Backend DTO
  referenceType?: "ORDER_PAYMENT" | "REFUND" | "SHIPPING_FEE" | "SHOP_REVENUE" | "WITHDRAWAL" | string;
  referenceId?: string;
  transactionType?: "IN" | "OUT";
  transactionCode?: string;
  description?: string;
}

export interface DeliveryTask {
  id: string | number;
  orderId: string | number;
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
  id: string | number;
  name: string;
  email: string;
  role: Role;
  shopId?: string | number;
  shopName?: string;
  phone?: string;
  address?: string;
  avatar?: string;
  createdAt?: string;
  status?: UserStatus;
  shopStatus?: "PENDING" | "ACTIVE" | "REJECTED";
  balance?: number;
  authProvider?: "local" | "google";
}

export interface Shop {
  id: string | number;
  ownerId: string | number;
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
  id: string | number;
  userId?: string | number;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  type: "ORDER" | "REFUND" | "CHAT" | "SYSTEM";
  link?: string;
  referenceId?: string;
  imageUrl?: string;
}

export interface ChatMessage {
  id: string | number;
  senderId: string | number;
  receiverId?: string | number;
  shopId?: string | number;
  text: string;
  createdAt: string;
  isFromCustomer: boolean;
  senderName?: string;
  imageUrl?: string;
  avatar?: string;
  messageType?: "text" | "product_card" | "order_card" | "voucher_card" | "image";
  productData?: {
    id: string | number;
    title: string;
    price: number;
    originalPrice?: number;
    imageUrl?: string;
    stock?: number;
  };
  orderData?: {
    orderId: string | number;
    orderStatus: OrderStatus;
    totalAmount: number;
    itemCount: number;
  };
  voucherData?: {
    code: string;
    discountAmount: number;
    minSpend: number;
  };
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
  | "shopProfile"
  | "paymentResult"
  | "shopDashboard";

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  errors?: string[];
}

export interface UploadImageResponse {
  url: string;
  public_id: string;
  file_name: string;
  size: number;
}

export interface ImageUploadItem {
  url: string;
  publicId: string;
}

// Realtime SignalR Payloads
export interface NewMessageNotificationPayload {
  chatId: string;
  senderId: string;
  senderName: string;
  messagePreview: string;
  timestamp: string;
  unreadCount: number;
}

export interface OrderStatusUpdatedPayload {
  orderId: string;
  newStatus: OrderStatus | string;
  message: string;
  updatedAt: string;
}

export interface PaymentResultPayload {
  orderId: string;
  isSuccess: boolean;
  message: string;
  transactionCode?: string;
}

export interface NewOrderAlertPayload extends Order {}
