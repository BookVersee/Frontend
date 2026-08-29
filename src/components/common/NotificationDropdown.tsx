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

  const loadNotifications = async () => {
    const list = await notificationService.getNotifications(user?.id);
    setNotifications(list);
  };

  useEffect(() => {
    loadNotifications();
  }, [user?.id]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAsRead = async (id: number) => {
    await notificationService.markAsRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const handleMarkAllRead = async () => {
    await notificationService.markAllAsRead(user?.id);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
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
        className="p-2.5 rounded-xl hover:bg-slate-100 transition-colors text-slate-600 cursor-pointer relative"
        title="Thông báo hệ thống"
      >
        <Bell size={18} />
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
          <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-100">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
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
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-[11px] text-blue-600 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                >
                  <CheckCheck size={13} /> Đánh dấu đã đọc
                </button>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
              {notifications.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
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
                      n.read ? "bg-white hover:bg-slate-50" : "bg-blue-50/50 hover:bg-blue-50"
                    }`}
                  >
                    <div className="p-2 rounded-xl bg-white border border-slate-200 shrink-0 shadow-2xs">
                      {getIcon(n.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-xs leading-snug line-clamp-1 ${
                          n.read ? "font-semibold text-slate-700" : "font-bold text-slate-900"
                        }`}
                      >
                        {n.title}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">
                        {n.message}
                      </p>
                      <span className="text-[10px] text-slate-400 mt-1 inline-block">
                        {n.createdAt}
                      </span>
                    </div>
                    {!n.read && (
                      <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0 mt-1.5" />
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
