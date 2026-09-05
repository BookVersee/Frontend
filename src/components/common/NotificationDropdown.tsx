import React, { useState, useEffect } from "react";
import {
  Bell,
  CheckCheck,
  Clock,
  Package,
  RefreshCw,
  MessageSquare,
  Trash2,
  X,
  ExternalLink,
  ShieldCheck,
  ChevronRight,
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
  
  // State quản lý xem chi tiết thông báo
  const [selectedNotif, setSelectedNotif] = useState<AppNotification | null>(null);

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
          referenceId: t.chatId,
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

  // Xóa / Ẩn 1 thông báo
  const handleDeleteItem = async (e: React.MouseEvent, id: string | number) => {
    e.stopPropagation();
    const item = notifications.find((n) => n.id === id);
    await notificationService.deleteNotification(id, user?.id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    if (item && !item.read) {
      setUnreadCount((c) => Math.max(0, c - 1));
    }
    if (selectedNotif && String(selectedNotif.id) === String(id)) {
      setSelectedNotif(null);
    }
  };

  // Dọn dẹp / Ẩn tất cả thông báo hiện có (Không gọi API 404)
  const handleDeleteAll = async () => {
    if (notifications.length === 0) return;
    const allIds = notifications.map((n) => n.id);
    await notificationService.deleteAllNotifications(allIds, user?.id);
    setNotifications([]);
    setUnreadCount(0);
  };

  // Xem chi tiết thông báo
  const handleOpenDetail = (notif: AppNotification) => {
    if (!notif.read) {
      handleMarkAsRead(notif.id);
    }
    setSelectedNotif(notif);
    setIsOpen(false);
  };

  const getIcon = (type: AppNotification["type"]) => {
    switch (type) {
      case "ORDER":
        return <Package size={16} className="text-blue-600" />;
      case "REFUND":
        return <RefreshCw size={16} className="text-amber-600" />;
      case "CHAT":
        return <MessageSquare size={16} className="text-emerald-600" />;
      default:
        return <Bell size={16} className="text-indigo-600" />;
    }
  };

  const getIconBg = (type: AppNotification["type"]) => {
    switch (type) {
      case "ORDER":
        return "bg-blue-100/80 border-blue-200";
      case "REFUND":
        return "bg-amber-100/80 border-amber-200";
      case "CHAT":
        return "bg-emerald-100/80 border-emerald-200";
      default:
        return "bg-indigo-100/80 border-indigo-200";
    }
  };

  const getTypeName = (type: AppNotification["type"]) => {
    switch (type) {
      case "ORDER":
        return "Đơn hàng";
      case "REFUND":
        return "Hoàn tiền & Trả hàng";
      case "CHAT":
        return "Tin nhắn";
      default:
        return "Hệ thống";
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2.5 rounded-xl hover:bg-white/10 transition-colors text-slate-300 hover:text-white cursor-pointer relative"
        title="Thông báo hệ thống"
      >
        <Bell size={18} className={isRinging ? "animate-bounce text-amber-400" : ""} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 min-w-4 h-4 px-1 bg-red-500 text-white rounded-full text-[10px] flex items-center justify-center font-bold animate-pulse">
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
          {/* Dropdown Container: Light Theme, Modern & High Contrast */}
          <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-2xl border border-slate-200/90 shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-100">
            {/* Header */}
            <div className="px-4 py-3 bg-slate-50/90 border-b border-slate-200/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-800 text-xs sm:text-sm">
                  Thông báo
                </span>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-bold text-[10px]">
                    {unreadCount} mới
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2.5">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-[11px] text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                    title="Đánh dấu tất cả đã đọc"
                  >
                    <CheckCheck size={13} /> Đã đọc hết
                  </button>
                )}
                {notifications.length > 0 && (
                  <button
                    onClick={handleDeleteAll}
                    className="text-[11px] text-slate-400 hover:text-red-500 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                    title="Dọn dẹp danh sách thông báo"
                  >
                    <Trash2 size={12} /> Dọn dẹp
                  </button>
                )}
              </div>
            </div>

            {/* List */}
            <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
              {loading && notifications.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  Đang tải thông báo...
                </div>
              ) : notifications.length === 0 ? (
                <div className="py-10 text-center text-xs text-slate-400">
                  <Bell size={24} className="mx-auto mb-2 text-slate-300 stroke-[1.5]" />
                  Không có thông báo nào
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => handleOpenDetail(n)}
                    className={`group p-3.5 flex items-start gap-3 transition-colors cursor-pointer relative ${
                      n.read
                        ? "bg-white hover:bg-slate-50"
                        : "bg-blue-50/40 hover:bg-blue-50/70 border-l-4 border-blue-600"
                    }`}
                  >
                    <div className={`p-2 rounded-xl border shrink-0 shadow-2xs ${getIconBg(n.type)}`}>
                      {getIcon(n.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0 pr-2">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <p
                          className={`text-xs leading-snug line-clamp-1 ${
                            n.read ? "font-semibold text-slate-700" : "font-extrabold text-slate-900"
                          }`}
                        >
                          {n.title}
                        </p>
                        {!n.read && (
                          <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                        )}
                      </div>

                      <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                        {n.message}
                      </p>

                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-slate-400 font-medium">
                          {n.createdAt}
                        </span>
                        <span className="text-[10px] text-blue-600 font-semibold group-hover:underline flex items-center gap-0.5">
                          Chi tiết <ChevronRight size={10} />
                        </span>
                      </div>
                    </div>

                    {/* Nút xóa 1 mục khi hover */}
                    <button
                      type="button"
                      onClick={(e) => handleDeleteItem(e, n.id)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all cursor-pointer shrink-0 self-center"
                      title="Ẩn thông báo này"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}

      {/* Modal Xem Chi Tiết Thông Báo (Notification Detail Modal) */}
      {selectedNotif && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95 duration-200 relative">
            {/* Header Modal */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2.5">
                <div className={`p-2 rounded-xl border ${getIconBg(selectedNotif.type)}`}>
                  {getIcon(selectedNotif.type)}
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    {getTypeName(selectedNotif.type)}
                  </span>
                  <h3 className="text-sm font-bold text-slate-800 line-clamp-1">
                    {selectedNotif.title}
                  </h3>
                </div>
              </div>

              <button
                onClick={() => setSelectedNotif(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                title="Đóng"
              >
                <X size={18} />
              </button>
            </div>

            {/* Nội dung chi tiết */}
            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <Clock size={13} />
                <span>Thời gian: <strong>{selectedNotif.createdAt}</strong></span>
              </div>

              {selectedNotif.imageUrl && (
                <div className="rounded-2xl overflow-hidden border border-slate-200 max-h-48 flex items-center justify-center bg-slate-50">
                  <img
                    src={selectedNotif.imageUrl}
                    alt="Ảnh thông báo"
                    className="max-w-full max-h-48 object-cover"
                  />
                </div>
              )}

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                  {selectedNotif.message}
                </p>
              </div>

              {selectedNotif.referenceId && (
                <p className="text-[11px] text-slate-400 font-mono">
                  Mã tham chiếu: <span className="font-semibold text-slate-600">{selectedNotif.referenceId}</span>
                </p>
              )}
            </div>

            {/* Actions Footer */}
            <div className="flex items-center gap-2 pt-2">
              {selectedNotif.type === "ORDER" && selectedNotif.referenceId && onNavigate && (
                <button
                  onClick={() => {
                    onNavigate(`/orders?id=${selectedNotif.referenceId}`);
                    setSelectedNotif(null);
                  }}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                >
                  <Package size={15} /> Xem chi tiết đơn hàng
                </button>
              )}

              {selectedNotif.type === "CHAT" && onNavigate && (
                <button
                  onClick={() => {
                    onNavigate(selectedNotif.link || "/chat");
                    setSelectedNotif(null);
                  }}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                >
                  <MessageSquare size={15} /> Mở cuộc trò chuyện
                </button>
              )}

              <button
                onClick={() => setSelectedNotif(null)}
                className="py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
