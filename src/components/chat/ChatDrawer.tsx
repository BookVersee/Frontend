import React, { useState, useEffect, useRef } from "react";
import {
  MessageSquare,
  Send,
  X,
  Store,
  BookOpen,
  Sparkles,
  Wifi,
  WifiOff,
  ArrowLeft,
  Search,
  ChevronRight,
} from "lucide-react";
import { ChatMessage, Book } from "../../types";
import { chatService, ChatThread } from "../../services/chatService";
import { signalRService } from "../../services/signalRService";
import { useAuth } from "../../contexts/AuthContext";
import { BookCover } from "../common/BookCover";
import { fmt } from "../../utils/format";

interface ChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  shopId?: string | number;
  shopName?: string;
  book?: Book | null;
}

export const ChatDrawer: React.FC<ChatDrawerProps> = ({
  isOpen,
  onClose,
  shopId = 1,
  shopName = "Nhà sách Phương Nam",
  book,
}) => {
  const { user } = useAuth();

  // View mode: 'list' (danh sách tất cả các shop) hoặc 'detail' (khung chat với 1 shop)
  const [viewMode, setViewMode] = useState<"list" | "detail">("detail");
  const [currentShopId, setCurrentShopId] = useState<string | number>(shopId);
  const [currentShopName, setCurrentShopName] = useState<string>(shopName);
  const [currentBook, setCurrentBook] = useState<Book | null | undefined>(book);

  // Data states
  const [userThreads, setUserThreads] = useState<ChatThread[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | number | undefined>(undefined);
  const [inputText, setInputText] = useState("");
  const [isRealTimeConnected, setIsRealTimeConnected] = useState(false);
  const [searchShopKeyword, setSearchShopKeyword] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Cập nhật shop khi props thay đổi
  useEffect(() => {
    if (isOpen) {
      if (book) {
        setCurrentShopId(book.shopId);
        setCurrentShopName(book.shopName);
        setCurrentBook(book);
        setViewMode("detail");
      } else if (shopId) {
        setCurrentShopId(shopId);
        setCurrentShopName(shopName);
        setCurrentBook(null);
        // Nếu mở từ Header chung và không có sách -> Hiển thị danh sách hội thoại
        setViewMode(shopId === 1 && !book ? "list" : "detail");
      }
    }
  }, [isOpen, shopId, shopName, book]);

  // 1. Tải danh sách tất cả các Shop đã nhắn tin
  const loadUserThreads = async () => {
    try {
      const threads = await chatService.getUserConversations();
      setUserThreads(threads);
    } catch (e) {
      console.warn("Error loading user threads:", e);
    }
  };

  // 2. Tải tin nhắn của Shop hiện tại & Khởi tạo SignalR
  useEffect(() => {
    if (!isOpen) return;

    loadUserThreads();

    let isMounted = true;

    const loadChatAndConnectSignalR = async () => {
      try {
        const res = await chatService.getMessages({
          shopId: currentShopId,
          userId: user?.id,
        });

        if (isMounted) {
          setMessages(res.messages);
          setActiveChatId(res.chatId);
        }

        const conn = await signalRService.startConnection();
        if (conn && isMounted) {
          setIsRealTimeConnected(true);
          if (res.chatId) {
            await signalRService.joinChatRoom(res.chatId);
          }
        }
      } catch (err) {
        console.warn("Error initializing chat:", err);
      }
    };

    loadChatAndConnectSignalR();

    // Đăng ký nhận tin nhắn mới theo thời gian thực (Real-time)
    const unsubscribe = signalRService.onReceiveMessage((incomingMsg: any) => {
      if (!isMounted) return;
      const formattedMsg: ChatMessage = {
        id: incomingMsg.messageId || incomingMsg.id || Date.now(),
        senderId: incomingMsg.senderId,
        receiverId: incomingMsg.receiverId,
        shopId: incomingMsg.shopId || currentShopId,
        text: incomingMsg.content || incomingMsg.text || "",
        createdAt: incomingMsg.createdAt
          ? new Date(incomingMsg.createdAt).toLocaleTimeString("vi-VN", {
              hour: "2-digit",
              minute: "2-digit",
            })
          : new Date().toLocaleTimeString("vi-VN", {
              hour: "2-digit",
              minute: "2-digit",
            }),
        isFromCustomer: incomingMsg.senderId !== String(currentShopId),
        senderName: incomingMsg.senderName,
        imageUrl: incomingMsg.imageUrl,
      };

      setMessages((prev) => {
        if (prev.some((m) => m.id === formattedMsg.id)) return prev;
        return [...prev, formattedMsg];
      });

      loadUserThreads();
    });

    const handleLocalUpdate = () => {
      chatService
        .getMessages({ shopId: currentShopId, userId: user?.id })
        .then((res) => {
          if (isMounted) setMessages(res.messages);
        });
      loadUserThreads();
    };

    window.addEventListener("bookverse_chat_updated", handleLocalUpdate);

    return () => {
      isMounted = false;
      unsubscribe();
      window.removeEventListener("bookverse_chat_updated", handleLocalUpdate);
      if (activeChatId) {
        signalRService.leaveChatRoom(activeChatId);
      }
    };
  }, [isOpen, currentShopId, user?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, viewMode]);

  if (!isOpen) return null;

  const handleSelectShopThread = (t: ChatThread) => {
    if (activeChatId) {
      signalRService.leaveChatRoom(activeChatId);
    }
    setCurrentShopId(t.shopId);
    setCurrentShopName(t.shopName || t.userName);
    setCurrentBook(null);
    setViewMode("detail");
  };

  const sendMessageContent = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    try {
      const res = await chatService.sendMessage({
        chatId: activeChatId,
        senderId: user?.id || "customer-1",
        receiverId: currentShopId,
        shopId: currentShopId,
        text: textToSend.trim(),
        isFromCustomer: true,
        senderName: user?.name || "Khách hàng",
      });

      setMessages((prev) => [...prev, res.message]);

      if (!activeChatId && res.chatId) {
        setActiveChatId(res.chatId);
        await signalRService.joinChatRoom(res.chatId);
      }

      loadUserThreads();
    } catch (e) {
      console.warn("Send message error:", e);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    const text = inputText;
    setInputText("");
    await sendMessageContent(text);
  };

  const filteredThreads = userThreads.filter((t) =>
    searchShopKeyword
      ? (t.shopName || t.userName).toLowerCase().includes(searchShopKeyword.toLowerCase()) ||
        (t.lastMessage && t.lastMessage.toLowerCase().includes(searchShopKeyword.toLowerCase()))
      : true
  );

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
        
        {/* ========================================================= */}
        {/* VIEW 1: DANH SÁCH TẤT CẢ CÁC GIAN HÀNG (SHOP INBOX LIST) */}
        {/* ========================================================= */}
        {viewMode === "list" && (
          <div className="flex flex-col h-full bg-slate-50">
            {/* Header List */}
            <div className="px-5 py-4 border-b border-slate-200 bg-white flex items-center justify-between shadow-2xs">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                  <MessageSquare size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">
                    Hộp thư tư vấn ({userThreads.length} gian hàng)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Trao đổi trực tiếp với các nhà sách
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Search Shop Bar */}
            <div className="p-3 bg-white border-b border-slate-100">
              <div className="relative">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  value={searchShopKeyword}
                  onChange={(e) => setSearchShopKeyword(e.target.value)}
                  placeholder="Tìm kiếm tên nhà sách hoặc tin nhắn..."
                  className="w-full pl-8 pr-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Threads List */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
              {filteredThreads.length === 0 ? (
                <div className="p-10 text-center text-xs text-slate-400">
                  <Store size={36} className="mx-auto mb-2 text-slate-300" />
                  Bạn chưa có cuộc trò chuyện nào. Hãy chọn một cuốn sách và bấm "Chat với Shop" để bắt đầu!
                </div>
              ) : (
                filteredThreads.map((t) => (
                  <button
                    key={t.chatId}
                    onClick={() => handleSelectShopThread(t)}
                    className="w-full p-4 text-left flex items-start gap-3 bg-white hover:bg-blue-50/50 transition-colors cursor-pointer group"
                  >
                    <div className="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                      <Store size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-bold text-slate-800 text-xs sm:text-sm group-hover:text-blue-600 transition-colors truncate">
                          {t.shopName || t.userName}
                        </p>
                        <span className="text-[10px] text-slate-400 shrink-0 ml-1">
                          {t.updatedAt}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 truncate leading-relaxed">
                        {t.lastMessage || "Nhấn để tiếp tục trò chuyện..."}
                      </p>
                    </div>
                    <div className="flex items-center self-center text-slate-300 group-hover:text-blue-600 transition-colors pl-1">
                      <ChevronRight size={16} />
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 2: KHUNG CHAT CHI TIẾT VỚI 1 SHOP (ACTIVE CHAT VIEW) */}
        {/* ========================================================= */}
        {viewMode === "detail" && (
          <div className="flex flex-col h-full">
            {/* Header Detail */}
            <div className="px-4 py-3 border-b border-slate-200 bg-white flex items-center justify-between shadow-2xs">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setViewMode("list")}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer flex items-center gap-1 text-xs font-semibold mr-1"
                  title="Danh sách tất cả gian hàng"
                >
                  <ArrowLeft size={16} />
                </button>

                <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold shrink-0">
                  <Store size={18} />
                </div>

                <div className="min-w-0">
                  <h3 className="font-bold text-slate-800 text-xs sm:text-sm leading-tight truncate">
                    {currentShopName}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] text-emerald-600 font-medium">
                      Trực tuyến
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      {isRealTimeConnected ? (
                        <span className="text-emerald-600 flex items-center gap-0.5">
                          <Wifi size={10} /> Real-time
                        </span>
                      ) : (
                        <span className="text-slate-400 flex items-center gap-0.5">
                          <WifiOff size={10} /> Sẵn sàng
                        </span>
                      )}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Sticky Book Preview Card if chatting about a specific book */}
            {currentBook && (
              <div className="p-3 bg-blue-50/90 border-b border-blue-100 flex items-center gap-3 animate-in fade-in">
                <div className="w-11 h-14 shrink-0 rounded-lg overflow-hidden border border-blue-200/80 shadow-2xs">
                  <BookCover book={currentBook} size="sm" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block">
                    Đang tư vấn cuốn sách này
                  </span>
                  <p className="font-bold text-slate-800 text-xs truncate">
                    {currentBook.title}
                  </p>
                  <p className="text-[11px] text-blue-600 font-bold mt-0.5">
                    {fmt(currentBook.price)}
                  </p>
                </div>
              </div>
            )}

            {/* Message Thread */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
              <div className="text-center my-2">
                <span className="px-3 py-1 bg-slate-200/60 rounded-full text-[10px] font-semibold text-slate-500">
                  Hội thoại tư vấn sách với {currentShopName}
                </span>
              </div>

              {messages.map((m) => {
                const isMe =
                  user?.role === "customer" ? m.isFromCustomer : !m.isFromCustomer;
                return (
                  <div
                    key={m.id}
                    className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                  >
                    <div
                      className={`max-w-[82%] rounded-2xl px-4 py-2.5 text-xs sm:text-sm shadow-xs ${
                        isMe
                          ? "bg-blue-600 text-white rounded-br-none"
                          : "bg-white text-slate-800 border border-slate-200 rounded-bl-none"
                      }`}
                    >
                      <p className="leading-relaxed whitespace-pre-wrap">{m.text}</p>
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 px-1 font-mono">
                      {m.createdAt}
                    </span>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Suggestion Prompts */}
            {currentBook && (
              <div className="px-3 py-2 bg-white border-t border-slate-100 overflow-x-auto whitespace-nowrap flex gap-1.5 scrollbar-none">
                <button
                  onClick={() =>
                    sendMessageContent(
                      `Shop ơi, cuốn "${currentBook.title}" này còn hàng không ạ?`
                    )
                  }
                  className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-[11px] text-slate-600 font-medium transition-colors shrink-0 cursor-pointer border border-slate-200 flex items-center gap-1"
                >
                  <Sparkles size={11} className="text-blue-500" /> Sách còn hàng không?
                </button>
                <button
                  onClick={() =>
                    sendMessageContent(
                      `Sách "${currentBook.title}" này có kèm bookmark hoặc quà tặng không shop?`
                    )
                  }
                  className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-[11px] text-slate-600 font-medium transition-colors shrink-0 cursor-pointer border border-slate-200"
                >
                  🎁 Có kèm quà tặng không?
                </button>
                <button
                  onClick={() =>
                    sendMessageContent(
                      `Shop có thể cho mình xin thêm hình ảnh thật của sách "${currentBook.title}" được không?`
                    )
                  }
                  className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-[11px] text-slate-600 font-medium transition-colors shrink-0 cursor-pointer border border-slate-200"
                >
                  📷 Xin ảnh chụp thật
                </button>
              </div>
            )}

            {/* Input Bar */}
            <form
              onSubmit={handleSend}
              className="p-3 bg-white border-t border-slate-200 flex items-center gap-2"
            >
              <input
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={`Nhắn tin với ${currentShopName}...`}
                className="flex-1 text-xs sm:text-sm px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 bg-slate-50 transition-all"
              />
              <button
                type="submit"
                disabled={!inputText.trim()}
                className="p-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-all cursor-pointer shadow-sm"
              >
                <Send size={16} />
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
