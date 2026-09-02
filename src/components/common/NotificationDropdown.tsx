import React, { useState, useEffect } from "react";
import { Bell, Check, CheckCheck, Clock, Package, RefreshCw, MessageSquare } from "lucide-react";
import { AppNotification } from "../../types";
import { notificationService } from "../../services/notificationService";
import { useAuth } from "../../contexts/AuthContext";

interface NotificationDropdownProps {
  onNavigate?: (link: string) => void;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Chỉ lấy số thông báo chưa đọc ban đầu (payload nhẹ)
  useEffect(() => {
    if (!user?.id) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }
    notificationService.getUnreadNotifications().then((unreadList) => {
      setUnreadCount(unreadList.length);
    });
  }, [user?.id]);

  // Khi người dùng bấm mở dropdown mới tải toàn bộ danh sách thông báo
  useEffect(() => {
    if (isOpen && user?.id) {
      setLoading(true);
      notificationService
        .getNotifications(user?.id)
        .then((list) => {
          setNotifications(list);
          setUnreadCount(list.filter((n) => !n.read).length);
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen, user?.id]);

  const handleMarkAsRead = async (id: number) => {
    await notificationService.markAsRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    setUnreadCount((c) => Math.max(0, c - 1));
  };

  const handleMarkAllRead = async () => {
    await notificationService.markAllAsRead(user?.id);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
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
        <Bell size={18} />
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
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-[11px] text-[#c8843a] hover:text-[#fdf9f5] hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                >
                  <CheckCheck size={13} /> Đánh dấu đã đọc
                </button>
              )}
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
                    className={`p-3.5 flex items-start gap-3 transition-colors cursor-pointer ${
                      n.read ? "bg-[#2a211c] hover:bg-[#3d2b1a]" : "bg-[#3d2b1a]/40 hover:bg-[#3d2b1a]"
                    }`}
                  >
                    <div className="p-2 rounded-xl bg-[#1c1612] border border-slate-700 shrink-0 shadow-2xs">
                      {getIcon(n.type)}
                    </div>
                    <div className="flex-1 min-w-0">
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
                    {!n.read && (
                      <span className="w-2 h-2 rounded-full bg-[#c8843a] shrink-0 mt-1.5" />
                    )}
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

