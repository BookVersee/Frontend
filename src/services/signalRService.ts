import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
} from "@microsoft/signalr";
import { getStoredToken } from "../utils/storage";
import {
  NewMessageNotificationPayload,
  OrderStatusUpdatedPayload,
  PaymentResultPayload,
  AppNotification,
} from "../types";

// Helper chuẩn hóa URL cho SignalR Client (SignalR builder bắt buộc dùng HTTP/HTTPS để handshake negotiate)
const normalizeHubUrl = (url: string) => {
  if (!url) return "";
  if (url.startsWith("ws://")) return url.replace("ws://", "http://");
  if (url.startsWith("wss://")) return url.replace("wss://", "https://");
  return url;
};

// Base URLs cho các SignalR Hubs
const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL || "http://localhost:5226";

const CHAT_HUB_URL = normalizeHubUrl(
  import.meta.env.VITE_WS_CHAT_URL || `${BACKEND_URL}/hubs/chat`
);
const NOTIFICATION_HUB_URL = normalizeHubUrl(
  import.meta.env.VITE_WS_NOTIF_URL || `${BACKEND_URL}/hubs/notifications`
);
const APP_HUB_URL = normalizeHubUrl(
  import.meta.env.VITE_WS_APP_URL || `${BACKEND_URL}/hubs/app`
);

// Web Audio API Synthesizer tạo tiếng chuông thông báo trong trẻo, không phụ thuộc file mp3 ngoài
export const playNotificationChime = (type: "order" | "message" | "notification" = "notification") => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    if (type === "order") {
      // Âm thanh báo đơn hàng: 2 nốt ngân cao vui tươi (G5 -> C6)
      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(783.99, now); // G5
      gain1.gain.setValueAtTime(0.3, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.35);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(1046.5, now + 0.18); // C6
      gain2.gain.setValueAtTime(0.4, now + 0.18);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.18);
      osc2.stop(now + 0.65);
    } else if (type === "message") {
      // Âm thanh tin nhắn đến: nốt pop nhẹ nhàng (E5 -> A5)
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(659.25, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.12);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.28);
    } else {
      // Quả chuông: Ding thanh tao (B5)
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(987.77, now);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.4);
    }
  } catch (e) {
    // Trình duyệt có thể block autoplay khi chưa tương tác, bỏ qua êm ái
  }
};

class SignalRService {
  // 1. Connection Instances
  private chatConn: HubConnection | null = null;
  private notifConn: HubConnection | null = null;
  private appConn: HubConnection | null = null;

  // 2. States & Active Rooms
  private currentChatRoom: string | null = null;
  private joinedOrders: Set<string> = new Set();
  private joinedShops: Set<string> = new Set();

  // 3. Typed Listeners
  private chatMessageListeners: ((msg: any) => void)[] = [];
  private newMessageNotifListeners: ((payload: NewMessageNotificationPayload) => void)[] = [];
  private notifListeners: ((notif: AppNotification | any) => void)[] = [];
  private newOrderAlertListeners: ((order: any) => void)[] = [];
  private orderStatusListeners: ((payload: OrderStatusUpdatedPayload) => void)[] = [];
  private paymentResultListeners: ((payload: PaymentResultPayload) => void)[] = [];

  // Helper tạo kết nối tập trung
  private createHubConnection(url: string): HubConnection {
    return new HubConnectionBuilder()
      .withUrl(url, {
        accessTokenFactory: () => getStoredToken() || "",
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000, 20000])
      .configureLogging(LogLevel.Warning)
      .build();
  }

  // =========================================================================
  // 1. CHAT HUB CONNECTION (/hubs/chat)
  // =========================================================================
  public async startChatConnection(): Promise<HubConnection | null> {
    if (
      this.chatConn &&
      (this.chatConn.state === HubConnectionState.Connected ||
        this.chatConn.state === HubConnectionState.Connecting)
    ) {
      return this.chatConn;
    }

    try {
      this.chatConn = this.createHubConnection(CHAT_HUB_URL);

      // Nhận tin nhắn trong phòng chat cụ thể
      this.chatConn.on("ReceiveMessage", (message: any) => {
        this.chatMessageListeners.forEach((fn) => {
          try {
            fn(message);
          } catch (e) {
            console.error("[SignalR] Error in chatMessageListener:", e);
          }
        });
      });

      // Nhận thông báo tin nhắn mới ngoài phòng chat (Header / Drawer list)
      this.chatConn.on("ReceiveNewMessageNotification", (payload: NewMessageNotificationPayload) => {
        playNotificationChime("message");
        this.newMessageNotifListeners.forEach((fn) => {
          try {
            fn(payload);
          } catch (e) {
            console.error("[SignalR] Error in newMessageNotifListener:", e);
          }
        });
      });

      this.chatConn.onreconnected((connectionId) => {
        console.log("[SignalR:ChatHub] Reconnected successfully. Id:", connectionId);
        if (this.currentChatRoom) {
          const rawId = this.currentChatRoom.replace("chat_", "");
          this.joinChatRoom(rawId);
        }
        this.joinedShops.forEach((shopId) => {
          this.joinShop(shopId);
        });
      });

      await this.chatConn.start();
      console.log("[SignalR:ChatHub] Connected successfully.");
      return this.chatConn;
    } catch (error) {
      console.warn("[SignalR:ChatHub] Connection failed (Backend might be offline):", error);
      return null;
    }
  }

  // =========================================================================
  // 2. NOTIFICATION HUB CONNECTION (/hubs/notifications)
  // =========================================================================
  public async startNotificationConnection(): Promise<HubConnection | null> {
    if (
      this.notifConn &&
      (this.notifConn.state === HubConnectionState.Connected ||
        this.notifConn.state === HubConnectionState.Connecting)
    ) {
      return this.notifConn;
    }

    try {
      this.notifConn = this.createHubConnection(NOTIFICATION_HUB_URL);

      // Nhận quả chuông thông báo Realtime
      this.notifConn.on("ReceiveNotification", (notif: any) => {
        playNotificationChime("notification");
        this.notifListeners.forEach((fn) => {
          try {
            fn(notif);
          } catch (e) {
            console.error("[SignalR] Error in notifListener:", e);
          }
        });
      });

      this.notifConn.onreconnected((connectionId) => {
        console.log("[SignalR:NotificationHub] Reconnected. Id:", connectionId);
      });

      await this.notifConn.start();
      console.log("[SignalR:NotificationHub] Connected successfully.");
      return this.notifConn;
    } catch (error) {
      console.warn("[SignalR:NotificationHub] Connection failed:", error);
      return null;
    }
  }

  // =========================================================================
  // 3. APP HUB CONNECTION (/hubs/app) - Đơn hàng, Vận chuyển, Thanh toán
  // =========================================================================
  public async startAppConnection(): Promise<HubConnection | null> {
    if (
      this.appConn &&
      (this.appConn.state === HubConnectionState.Connected ||
        this.appConn.state === HubConnectionState.Connecting)
    ) {
      return this.appConn;
    }

    try {
      this.appConn = this.createHubConnection(APP_HUB_URL);

      // Đơn hàng mới tiếp nhận cho Shop
      this.appConn.on("NewOrderAlert", (order: any) => {
        playNotificationChime("order");
        this.newOrderAlertListeners.forEach((fn) => {
          try {
            fn(order);
          } catch (e) {
            console.error("[SignalR] Error in newOrderAlertListener:", e);
          }
        });
      });

      // Cập nhật trạng thái đơn hàng & Vận chuyển (GHN)
      this.appConn.on("OrderStatusUpdated", (payload: OrderStatusUpdatedPayload) => {
        playNotificationChime("notification");
        this.orderStatusListeners.forEach((fn) => {
          try {
            fn(payload);
          } catch (e) {
            console.error("[SignalR] Error in orderStatusListener:", e);
          }
        });
      });

      // Xác nhận kết quả thanh toán MoMo / VNPay / QR
      this.appConn.on("PaymentResult", (payload: PaymentResultPayload) => {
        if (payload.isSuccess) {
          playNotificationChime("order");
        }
        this.paymentResultListeners.forEach((fn) => {
          try {
            fn(payload);
          } catch (e) {
            console.error("[SignalR] Error in paymentResultListener:", e);
          }
        });
      });

      this.appConn.onreconnected((connectionId) => {
        console.log("[SignalR:AppHub] Reconnected. Id:", connectionId);
        this.joinedOrders.forEach((orderId) => {
          this.joinOrder(orderId);
        });
        this.joinedShops.forEach((shopId) => {
          this.joinShop(shopId);
        });
      });

      await this.appConn.start();
      console.log("[SignalR:AppHub] Connected successfully.");
      return this.appConn;
    } catch (error) {
      console.warn("[SignalR:AppHub] Connection failed:", error);
      return null;
    }
  }

  // Khởi động toàn bộ các Hub cho người dùng đã đăng nhập
  public async startAllConnections(): Promise<void> {
    await Promise.allSettled([
      this.startChatConnection(),
      this.startNotificationConnection(),
      this.startAppConnection(),
    ]);
  }

  // Tương thích ngược: startConnection() gọi startChatConnection()
  public async startConnection(): Promise<HubConnection | null> {
    return await this.startChatConnection();
  }

  // Tham gia phòng chat
  public async joinChatRoom(chatId: string | number): Promise<void> {
    const roomName = `chat_${chatId}`;
    this.currentChatRoom = roomName;

    if (!this.chatConn || this.chatConn.state !== HubConnectionState.Connected) {
      await this.startChatConnection();
    }

    if (this.chatConn && this.chatConn.state === HubConnectionState.Connected) {
      try {
        await this.chatConn.invoke("JoinRoom", roomName);
        console.log(`[SignalR] Joined chat room: ${roomName}`);
      } catch (err) {
        console.warn(`[SignalR] Failed to join chat room ${roomName}:`, err);
      }
    }
  }

  // Rời khỏi phòng chat
  public async leaveChatRoom(chatId: string | number): Promise<void> {
    const roomName = `chat_${chatId}`;
    if (this.currentChatRoom === roomName) {
      this.currentChatRoom = null;
    }

    if (this.chatConn && this.chatConn.state === HubConnectionState.Connected) {
      try {
        await this.chatConn.invoke("LeaveRoom", roomName);
        console.log(`[SignalR] Left chat room: ${roomName}`);
      } catch (err) {
        console.warn(`[SignalR] Failed to leave chat room ${roomName}:`, err);
      }
    }
  }

  public isChatConnected(): boolean {
    return this.chatConn?.state === HubConnectionState.Connected;
  }

  // Khách hàng gửi tin nhắn cho Cửa hàng qua WebSocket ChatHub (Backend kích hoạt cả ReceiveMessage và ReceiveNewMessageNotification)
  public async sendMessageToShop(shopId: string, content: string, imageUrl?: string): Promise<boolean> {
    if (!this.chatConn || this.chatConn.state !== HubConnectionState.Connected) {
      await this.startChatConnection();
    }
    if (this.chatConn && this.chatConn.state === HubConnectionState.Connected) {
      try {
        await this.chatConn.invoke("SendMessageToShop", shopId, content, imageUrl || null);
        console.log(`[SignalR:ChatHub] Sent message to shop ${shopId} via WebSocket.`);
        return true;
      } catch (err) {
        console.warn("[SignalR:ChatHub] invoke SendMessageToShop error:", err);
        return false;
      }
    }
    return false;
  }

  // Chủ Shop phản hồi tin nhắn cho Khách hàng qua WebSocket ChatHub (Backend kích hoạt cả ReceiveMessage và ReceiveNewMessageNotification)
  public async sendMessageToUser(userId: string, shopId: string, content: string, imageUrl?: string): Promise<boolean> {
    if (!this.chatConn || this.chatConn.state !== HubConnectionState.Connected) {
      await this.startChatConnection();
    }
    if (this.chatConn && this.chatConn.state === HubConnectionState.Connected) {
      try {
        await this.chatConn.invoke("SendMessageToUser", userId, shopId, content, imageUrl || null);
        console.log(`[SignalR:ChatHub] Sent message to user ${userId} via WebSocket.`);
        return true;
      } catch (err) {
        console.warn("[SignalR:ChatHub] invoke SendMessageToUser error:", err);
        return false;
      }
    }
    return false;
  }

  // Shop tham gia nhóm nhận tin nhắn và đơn hàng của shop
  public async joinShop(shopId: string | number): Promise<void> {
    const sId = String(shopId);
    this.joinedShops.add(sId);

    if (this.chatConn && this.chatConn.state === HubConnectionState.Connected) {
      try {
        await this.chatConn.invoke("JoinShop", sId);
      } catch (e) {
        console.warn("[SignalR] Failed to JoinShop on ChatHub:", e);
      }
    }

    if (this.appConn && this.appConn.state === HubConnectionState.Connected) {
      try {
        await this.appConn.invoke("JoinShop", sId);
      } catch (e) {
        console.warn("[SignalR] Failed to JoinShop on AppHub:", e);
      }
    }
  }

  // Client theo dõi đơn hàng cụ thể (kết quả thanh toán & vận chuyển)
  public async joinOrder(orderId: string | number): Promise<void> {
    const oId = String(orderId);
    this.joinedOrders.add(oId);

    if (!this.appConn || this.appConn.state !== HubConnectionState.Connected) {
      await this.startAppConnection();
    }

    if (this.appConn && this.appConn.state === HubConnectionState.Connected) {
      try {
        await this.appConn.invoke("JoinOrder", oId);
        console.log(`[SignalR:AppHub] Joined order group: order_${oId}`);
      } catch (e) {
        console.warn(`[SignalR:AppHub] Failed to join order ${oId}:`, e);
      }
    }
  }

  // Rời khỏi nhóm theo dõi đơn hàng
  public async leaveOrder(orderId: string | number): Promise<void> {
    const oId = String(orderId);
    this.joinedOrders.delete(oId);

    if (this.appConn && this.appConn.state === HubConnectionState.Connected) {
      try {
        await this.appConn.invoke("LeaveOrder", oId);
        console.log(`[SignalR:AppHub] Left order group: order_${oId}`);
      } catch (e) {
        console.warn(`[SignalR:AppHub] Failed to leave order ${oId}:`, e);
      }
    }
  }

  // Event Listeners
  public onReceiveMessage(callback: (msg: any) => void): () => void {
    this.chatMessageListeners.push(callback);
    return () => {
      this.chatMessageListeners = this.chatMessageListeners.filter((l) => l !== callback);
    };
  }

  public onMessageReceived(callback: (msg: any) => void): () => void {
    return this.onReceiveMessage(callback);
  }

  public onNewMessageNotification(
    callback: (payload: NewMessageNotificationPayload) => void
  ): () => void {
    this.newMessageNotifListeners.push(callback);
    return () => {
      this.newMessageNotifListeners = this.newMessageNotifListeners.filter((l) => l !== callback);
    };
  }

  public onReceiveNotification(callback: (notif: AppNotification | any) => void): () => void {
    this.notifListeners.push(callback);
    return () => {
      this.notifListeners = this.notifListeners.filter((l) => l !== callback);
    };
  }

  public onNewOrderAlert(callback: (order: any) => void): () => void {
    this.newOrderAlertListeners.push(callback);
    return () => {
      this.newOrderAlertListeners = this.newOrderAlertListeners.filter((l) => l !== callback);
    };
  }

  public onOrderStatusUpdated(callback: (payload: OrderStatusUpdatedPayload) => void): () => void {
    this.orderStatusListeners.push(callback);
    return () => {
      this.orderStatusListeners = this.orderStatusListeners.filter((l) => l !== callback);
    };
  }

  public onPaymentResult(callback: (payload: PaymentResultPayload) => void): () => void {
    this.paymentResultListeners.push(callback);
    return () => {
      this.paymentResultListeners = this.paymentResultListeners.filter((l) => l !== callback);
    };
  }

  public isConnected(): boolean {
    return (
      this.chatConn?.state === HubConnectionState.Connected ||
      this.notifConn?.state === HubConnectionState.Connected ||
      this.appConn?.state === HubConnectionState.Connected
    );
  }

  public async stopAllConnections(): Promise<void> {
    const stops: Promise<void>[] = [];

    if (this.chatConn) {
      stops.push(this.chatConn.stop().catch(() => {}));
      this.chatConn = null;
    }
    if (this.notifConn) {
      stops.push(this.notifConn.stop().catch(() => {}));
      this.notifConn = null;
    }
    if (this.appConn) {
      stops.push(this.appConn.stop().catch(() => {}));
      this.appConn = null;
    }

    this.currentChatRoom = null;
    this.joinedOrders.clear();
    this.joinedShops.clear();

    await Promise.all(stops);
    console.log("[SignalR] All Hub connections stopped.");
  }

  public async stopConnection(): Promise<void> {
    await this.stopAllConnections();
  }
}

export const signalRService = new SignalRService();
