import React, { useState, useEffect, useRef } from "react";
import { MessageSquare, Send, X, Store, User as UserIcon } from "lucide-react";
import { ChatMessage } from "../../types";
import { chatService } from "../../services/chatService";
import { useAuth } from "../../contexts/AuthContext";

interface ChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  shopId?: number;
  shopName?: string;
}

export const ChatDrawer: React.FC<ChatDrawerProps> = ({
  isOpen,
  onClose,
  shopId = 1,
  shopName = "Nhà sách Phương Nam",
}) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      chatService.getMessages(shopId, user?.id || 1).then(setMessages);
    }
  }, [isOpen, shopId, user?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!isOpen) return null;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const newMsg = await chatService.sendMessage({
      senderId: user?.id || 1,
      receiverId: shopId,
      shopId,
      text: inputText.trim(),
      isFromCustomer: user?.role === "customer",
      senderName: user?.name || "Khách hàng",
    });

    setMessages((prev) => [...prev, newMsg]);
    setInputText("");
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 bg-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
              <Store size={20} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm leading-tight">
                {shopName}
              </h3>
              <p className="text-[11px] text-emerald-600 font-medium flex items-center gap-1 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Đang hoạt động • Phản hồi nhanh
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

        {/* Message Thread */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
          <div className="text-center my-2">
            <span className="px-3 py-1 bg-slate-200/60 rounded-full text-[10px] font-semibold text-slate-500">
              Bắt đầu cuộc trò chuyện về sách và đơn hàng
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
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-xs sm:text-sm shadow-xs ${
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

        {/* Input Bar */}
        <form
          onSubmit={handleSend}
          className="p-3 bg-white border-t border-slate-200 flex items-center gap-2"
        >
          <input
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Nhập tin nhắn tư vấn sách..."
            className="flex-1 text-xs sm:text-sm px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 bg-slate-50"
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
    </div>
  );
};
