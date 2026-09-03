import React, { useState, useEffect } from "react";
import {
  Bell,
  CheckCheck,
  Clock,
  Package,
  RefreshCw,
  MessageSquare,
  Trash2,
} from "lucide-react";
import { AppNotification } from "../../types";
import { notificationService } from "../../services/notificationService";
import { signalRService } from "../../services/signalRService";
import { useAuth } from "../../contexts/AuthContext";

import { chatService } from "../../services/chatService";

interface NotificationDropdownProps {
  onNavigate?: (link: string) => void;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isRinging, setIsRinging] = useState(false);

  // Tải đồng thời thông báo hệ thống và các tin nhắn chưa đọc từ Backend API
  const fetchCombinedNotifications = async (showLoading = false) => {
    if (!user?.id) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }
    if (showLoading) setLoading(true);

    try {
      // 1. Lấy thông báo hệ thống / đơn hàng từ API Backend
      const sysNotifs = await notificationService.getNotifications(user.id);

      // 2. Lấy danh sách hội thoại có tin nhắn chưa đọc từ API Chat Backend
      let chatNotifs: AppNotification[] = [];
      try {
        const threads = await chatService.getUserConversations();
        const unreadThreads = (threads || []).filter((t: any) => (t.unreadCount || 0) > 0);
        chatNotifs = unreadThreads.map((t: any) => ({
          id: `chat_${t.chatId}`,
          userId: user.id,
          title: `Tin nhắn mới từ ${t.shopName || t.userName || "Chủ Shop"}`,
          message: t.lastMessage || "Bạn có tin nhắn mới chưa đọc",
          read: false,
          createdAt: t.updatedAt
            ? new Date(t.updatedAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
            : "Vừa xong",
          type: "CHAT" as const,
          link: `/chat?chatId=${t.chatId}`,
        }));
      } catch (chatErr) {
        console.warn("Failed to fetch unread chat conversations for notification:", chatErr);
      }

      const combined = [...chatNotifs, ...sysNotifs];
      setNotifications(combined);
      setUnreadCount(combined.filter((n) => !n.read).length);
    } catch (e) {
      console.warn("Failed to fetch notifications:", e);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  // 1. Nạp thông báo ngay khi vào trang / đăng nhập
  useEffect(() => {
    fetchCombinedNotifications();
  }, [user?.id]);

  // 2. Đăng ký nhận thông báo Realtime từ SignalR NotificationHub & ChatHub
  useEffect(() => {
    if (!user?.id) return;

    signalRService.startNotificationConnection();
    signalRService.startChatConnection();

    // Lắng nghe thông báo hệ thống/đơn hàng từ NotificationHub
    const unsubscribeNotif = signalRService.onReceiveNotification(() => {
      fetchCombinedNotifications();
      setIsRinging(true);
      setTimeout(() => setIsRinging(false), 1500);
    });

    // Lắng nghe tin nhắn mới ngoài phòng chat từ ChatHub -> Cập nhật quả chuông ngay lập tức!
    const unsubscribeChat = signalRService.onNewMessageNotification(() => {
      fetchCombinedNotifications();
      setIsRinging(true);
      setTimeout(() => setIsRinging(false), 1500);
    });

    // Lắng nghe khi người dùng đọc tin nhắn -> Đồng bộ giảm số đếm ở Quả chuông
    const handleChatUpdated = () => {
      fetchCombinedNotifications();
    };
    window.addEventListener("bookverse_chat_updated", handleChatUpdated);

    return () => {
      unsubscribeNotif();
      unsubscribeChat();
      window.removeEventListener("bookverse_chat_updated", handleChatUpdated);
    };
  }, [user?.id]);

  // 3. Khi mở dropdown tải lại để đảm bảo dữ liệu mới nhất
  useEffect(() => {
    if (isOpen && user?.id) {
      fetchCombinedNotifications(true);
    }
  }, [isOpen, user?.id]);

  const handleMarkAsRead = async (id: string | number) => {
    await notificationService.markAsRead(id);
    setNotifications((prev) =>
      prev.map((n) => (String(n.id) === String(id) ? { ...n, read: true } : n))
    );
    setUnreadCount((c) => Math.max(0, c - 1));
  };

  const handleMarkAllRead = async () => {
    await notificationService.markAllAsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  // Xóa 1 thông báo
  const handleDeleteItem = async (e: React.MouseEvent, id: string | number) => {
    e.stopPropagation();
    const item = notifications.find((n) => n.id === id);
    await notificationService.deleteNotification(id, user?.id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    if (item && !item.read) {
      setUnreadCount((c) => Math.max(0, c - 1));
    }
  };

  // Xóa tất cả thông báo
  const handleDeleteAll = async () => {
    if (notifications.length === 0) return;
    const allIds = notifications.map((n) => n.id);
    await notificationService.deleteAllNotifications(allIds, user?.id);
    setNotifications([]);
    setUnreadCount(0);
  };

  const getIcon = (type: AppNotification["type"]) => {
    switch (type) {
      case "ORDER":
        return <Package size={14} className="text-blue-600" />;
      case "REFUND":
        return <RefreshCw size={14} className="text-red-500" />;
      case "CHAT":
        return <MessageSquare size={14} className="text-emerald-600" />;
      default:
        return <Clock size={14} className="text-slate-500" />;
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2.5 rounded-xl hover:bg-[#3d2b1a] transition-colors text-[#b5a898] hover:text-[#fdf9f5] cursor-pointer relative"
        title="Thông báo hệ thống"
      >
        <Bell size={18} className={isRinging ? "animate-bounce text-[#c8843a]" : ""} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 min-w-4 h-4 px-1 bg-[#c8843a] text-white rounded-full text-[10px] flex items-center justify-center font-bold animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-[#2a211c] rounded-2xl border border-slate-700 shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-100">
            <div className="px-4 py-3 bg-[#1c1612] border-b border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-bold text-[#fdf9f5] text-xs sm:text-sm">
                  Thông báo
                </span>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-[#7c4a2d]/30 text-[#c8843a] font-bold text-[10px]">
                    {unreadCount} mới
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-[11px] text-[#c8843a] hover:text-[#fdf9f5] hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                    title="Đánh dấu tất cả đã đọc"
                  >
                    <CheckCheck size={13} /> Đã đọc hết
                  </button>
                )}
                {notifications.length > 0 && (
                  <button
                    onClick={handleDeleteAll}
                    className="text-[11px] text-red-400 hover:text-red-300 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                    title="Xóa tất cả thông báo"
                  >
                    <Trash2 size={12} /> Xóa tất cả
                  </button>
                )}
              </div>
            </div>

            <div className="max-h-80 overflow-y-auto divide-y divide-[#3d2b1a]">
              {loading && notifications.length === 0 ? (
                <div className="py-8 text-center text-xs text-[#7a6a5a]">
                  <div className="w-5 h-5 border-2 border-[#c8843a] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  Đang tải thông báo...
                </div>
              ) : notifications.length === 0 ? (
                <div className="py-8 text-center text-xs text-[#7a6a5a]">
                  Không có thông báo nào
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => {
                      if (!n.read) handleMarkAsRead(n.id);
                      if (n.link && onNavigate) {
                        onNavigate(n.link);
                        setIsOpen(false);
                      }
                    }}
                    className={`group p-3.5 flex items-start gap-3 transition-colors cursor-pointer relative ${
                      n.read ? "bg-[#2a211c] hover:bg-[#3d2b1a]" : "bg-[#3d2b1a]/40 hover:bg-[#3d2b1a]"
                    }`}
                  >
                    <div className="p-2 rounded-xl bg-[#1c1612] border border-slate-700 shrink-0 shadow-2xs">
                      {getIcon(n.type)}
                    </div>
                    <div className="flex-1 min-w-0 pr-6">
                      <p
                        className={`text-xs leading-snug line-clamp-1 ${
                          n.read ? "font-semibold text-[#e8ddd0]" : "font-bold text-[#fdf9f5]"
                        }`}
                      >
                        {n.title}
                      </p>
                      <p className="text-[11px] text-[#7a6a5a] mt-0.5 line-clamp-2 leading-relaxed">
                        {n.message}
                      </p>
                      <span className="text-[10px] text-[#7a6a5a] mt-1 inline-block">
                        {n.createdAt}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 self-center">
                      {!n.read && (
                        <span className="w-2 h-2 rounded-full bg-[#c8843a]" />
                      )}
                      {/* Nút xóa từng thông báo (Hiện khi hover) */}
                      <button
                        type="button"
                        onClick={(e) => handleDeleteItem(e, n.id)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-950/40 transition-all cursor-pointer"
                        title="Xóa thông báo này"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

