import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
} from "@microsoft/signalr";
import { getStoredToken } from "../utils/storage";

const CHAT_HUB_URL =
  import.meta.env.VITE_WS_CHAT_URL || "http://localhost:5226/hubs/chat";

class SignalRService {
  private connection: HubConnection | null = null;
  private currentRoom: string | null = null;
  private messageListeners: ((msg: any) => void)[] = [];

  // Khởi tạo kết nối WebSocket với Hub
  public async startConnection(): Promise<HubConnection | null> {
    if (
      this.connection &&
      (this.connection.state === HubConnectionState.Connected ||
        this.connection.state === HubConnectionState.Connecting)
    ) {
      return this.connection;
    }

    try {
      this.connection = new HubConnectionBuilder()
        .withUrl(CHAT_HUB_URL, {
          accessTokenFactory: () => getStoredToken() || "",
        })
        .withAutomaticReconnect([0, 2000, 5000, 10000])
        .configureLogging(LogLevel.Warning)
        .build();

      // Đăng ký nhận tin nhắn từ Server
      this.connection.on("ReceiveMessage", (message: any) => {
        this.messageListeners.forEach((listener) => {
          try {
            listener(message);
          } catch (e) {
            console.error("Error in SignalR message listener:", e);
          }
        });
      });

      this.connection.onreconnected((connectionId) => {
        console.log("[SignalR] Reconnected successfully. ConnectionId:", connectionId);
        if (this.currentRoom) {
          this.joinChatRoom(this.currentRoom);
        }
      });

      await this.connection.start();
      console.log("[SignalR] Chat Hub Connected successfully.");
      return this.connection;
    } catch (error) {
      console.warn("[SignalR] Could not connect to Chat Hub (Backend might be offline):", error);
      return null;
    }
  }

  // Tham gia phòng chat của cuộc hội thoại cụ thể
  public async joinChatRoom(chatId: string | number): Promise<void> {
    const roomName = `chat_${chatId}`;
    this.currentRoom = roomName;

    if (!this.connection || this.connection.state !== HubConnectionState.Connected) {
      await this.startConnection();
    }

    if (this.connection && this.connection.state === HubConnectionState.Connected) {
      try {
        await this.connection.invoke("JoinRoom", roomName);
        console.log(`[SignalR] Joined room: ${roomName}`);
      } catch (err) {
        console.warn(`[SignalR] Failed to join room ${roomName}:`, err);
      }
    }
  }

  // Rời khỏi phòng chat
  public async leaveChatRoom(chatId: string | number): Promise<void> {
    const roomName = `chat_${chatId}`;
    if (this.currentRoom === roomName) {
      this.currentRoom = null;
    }

    if (this.connection && this.connection.state === HubConnectionState.Connected) {
      try {
        await this.connection.invoke("LeaveRoom", roomName);
        console.log(`[SignalR] Left room: ${roomName}`);
      } catch (err) {
        console.warn(`[SignalR] Failed to leave room ${roomName}:`, err);
      }
    }
  }

  // Đăng ký nhận tin nhắn mới
  public onReceiveMessage(callback: (msg: any) => void): () => void {
    this.messageListeners.push(callback);
    return () => {
      this.messageListeners = this.messageListeners.filter((l) => l !== callback);
    };
  }

  // Alias tương thích ngược
  public onMessageReceived(callback: (msg: any) => void): () => void {
    return this.onReceiveMessage(callback);
  }

  // Ngắt kết nối
  public async stopConnection(): Promise<void> {
    if (this.connection) {
      try {
        await this.connection.stop();
        this.connection = null;
        this.currentRoom = null;
      } catch (err) {
        console.warn("[SignalR] Error stopping connection:", err);
      }
    }
  }

  public isConnected(): boolean {
    return this.connection?.state === HubConnectionState.Connected;
  }
}

export const signalRService = new SignalRService();
