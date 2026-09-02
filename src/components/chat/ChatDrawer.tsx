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
  Loader2,
  ShoppingCart,
  Check,
  ExternalLink,
  Minus,
  Maximize2,
  Minimize2,
  Info,
  Package,
  Tag,
  Copy,
  CheckCheck,
  Phone,
  MapPin,
  Star,
  Clock,
  ShieldCheck,
  ShoppingBag,
} from "lucide-react";
import { ChatMessage, Book, Order, Shop } from "../../types";
import {
  chatService,
  ChatThread,
  isValidGuid,
  cleanAndDeduplicateMessages,
  parseVoucherFromMessage,
  parseProductFromMessage,
  cleanProductText,
  ProductCardData,
  SHOP_VOUCHERS,
} from "../../services/chatService";
import { VoucherTicket } from "./VoucherTicket";
import { signalRService } from "../../services/signalRService";
import { useAuth } from "../../contexts/AuthContext";
import { useCart } from "../../contexts/CartContext";
import { bookService } from "../../services/bookService";
import { orderService } from "../../services/orderService";
import { BookCover } from "../common/BookCover";
import { fmt } from "../../utils/format";

interface ChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  shopId?: string | number;
  shopName?: string;
  book?: Book | null;
  onSelectBook?: (book: Book) => void;
}

export const ChatDrawer: React.FC<ChatDrawerProps> = ({
  isOpen,
  onClose,
  shopId = 1,
  shopName = "Nhà sách Phương Nam",
  book,
  onSelectBook,
}) => {
  const { user } = useAuth();
  const { addToCart } = useCart();

  // Chế độ hiển thị: 'floating' (cửa sổ nổi góc phải) hoặc 'fullscreen' (toàn màn hình 3 cột)
  const [displayMode, setDisplayMode] = useState<"floating" | "fullscreen">("floating");
  // Trạng thái thu nhỏ thành bong bóng chat nổi góc phải
  const [isMinimized, setIsMinimized] = useState(false);
  // Bật/tắt Cột 3 (Hồ sơ Shop & Đơn hàng) khi ở chế độ Fullscreen
  const [showRightSidebar, setShowRightSidebar] = useState(true);

  // View mode khi ở Floating: 'list' (danh sách shop) hoặc 'detail' (chat với 1 shop)
  const [viewMode, setViewMode] = useState<"list" | "detail">("detail");
  const [currentShopId, setCurrentShopId] = useState<string | number>(shopId);
  const [currentShopName, setCurrentShopName] = useState<string>(shopName);
  const [currentBook, setCurrentBook] = useState<Book | null | undefined>(book);

  // Data states
  const [userThreads, setUserThreads] = useState<ChatThread[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | number | undefined>(undefined);
  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isRealTimeConnected, setIsRealTimeConnected] = useState(false);
  const [searchShopKeyword, setSearchShopKeyword] = useState("");
  const [previewModalImage, setPreviewModalImage] = useState<string | null>(null);
  const [addedBookId, setAddedBookId] = useState<string | number | null>(null);
  const [loadingBookId, setLoadingBookId] = useState<string | number | null>(null);

  // Dữ liệu cho Cột 3 (Hồ sơ Shop & Đơn hàng của khách hàng)
  const [shopProfile, setShopProfile] = useState<Shop | null>(null);
  const [shopOrders, setShopOrders] = useState<Order[]>([]);
  const [copiedVoucher, setCopiedVoucher] = useState<string | null>(null);

  // Kéo chuột điều chỉnh độ rộng các cột (Resizers)
  const [col1Width, setCol1Width] = useState(() => {
    const saved = localStorage.getItem("bookverse_customer_chat_col1_w");
    return saved ? Math.min(Math.max(Number(saved), 220), 450) : 310;
  });
  const [col3Width, setCol3Width] = useState(() => {
    const saved = localStorage.getItem("bookverse_customer_chat_col3_w");
    return saved ? Math.min(Math.max(Number(saved), 260), 480) : 330;
  });
  const [isDraggingCol1, setIsDraggingCol1] = useState(false);
  const [isDraggingCol3, setIsDraggingCol3] = useState(false);

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Xử lý kéo chuột thay đổi kích thước Cột 1 và Cột 3
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingCol1 && !isDraggingCol3) return;
      if (!chatContainerRef.current) return;

      const rect = chatContainerRef.current.getBoundingClientRect();

      if (isDraggingCol1) {
        const newW = e.clientX - rect.left;
        if (newW >= 220 && newW <= 450) {
          setCol1Width(newW);
          localStorage.setItem("bookverse_customer_chat_col1_w", String(newW));
        }
      }

      if (isDraggingCol3) {
        const newW = rect.right - e.clientX;
        if (newW >= 260 && newW <= 480) {
          setCol3Width(newW);
          localStorage.setItem("bookverse_customer_chat_col3_w", String(newW));
        }
      }
    };

    const handleMouseUp = () => {
      setIsDraggingCol1(false);
      setIsDraggingCol3(false);
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    };

    if (isDraggingCol1 || isDraggingCol3) {
      document.body.style.userSelect = "none";
      document.body.style.cursor = "col-resize";
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    };
  }, [isDraggingCol1, isDraggingCol3]);

  // Tải thông tin Shop Profile & Đơn hàng của khách tại shop này khi đổi shop
  useEffect(() => {
    if (!currentShopId) return;

    // 1. Tải hồ sơ Shop
    bookService.getShopProfile(currentShopId).then((profile) => {
      if (profile) setShopProfile(profile);
    });

    // 2. Tải đơn hàng của khách hàng tại Shop này
    orderService.getOrders(user?.id).then((orders) => {
      const specific = orders.filter(
        (o) =>
          String(o.shopId) === String(currentShopId) ||
          (o.shopName && o.shopName.toLowerCase() === currentShopName.toLowerCase())
      );
      // Nếu chưa có đơn cụ thể của shop, lấy các đơn gần đây của khách để hỗ trợ đối soát
      setShopOrders(specific.length > 0 ? specific : orders.slice(0, 3));
    });
  }, [currentShopId, currentShopName, user?.id]);

  // Mở trang chi tiết sách khi khách hàng click vào thẻ sản phẩm
  const handleOpenBookDetail = async (product: ProductCardData) => {
    setLoadingBookId(product.id);
    try {
      let detailedBook: Book | null = null;
      if (product.id && product.id !== "book-card") {
        detailedBook = await bookService.getBookById(product.id);
      }

      const targetBook: Book = detailedBook || {
        id: product.id,
        shopId: currentShopId,
        shopName: currentShopName,
        categoryId: 1,
        title: product.title,
        author: product.author || "Đang cập nhật",
        publisher: product.publisher || "NXB Hội Nhà Văn",
        price: product.price,
        originalPrice: product.originalPrice,
        stock: product.stock ?? 10,
        rating: product.rating ?? 5,
        reviewCount: 0,
        description: `Cuốn sách "${product.title}" chính hãng từ gian hàng ${currentShopName}`,
        coverColor: "#ffffff",
        coverColor2: "#ffffff",
        imageUrl: product.imageUrl,
        status: "ACTIVE",
        publishedYear: new Date().getFullYear(),
      };

      if (onSelectBook) {
        onSelectBook(targetBook);
        if (displayMode === "floating") {
          onClose();
        }
      }
    } catch (err) {
      console.warn("Error opening book detail:", err);
    } finally {
      setLoadingBookId(null);
    }
  };

  // Thêm nhanh vào giỏ hàng trực tiếp từ thẻ sản phẩm
  const handleAddToCartFromCard = (e: React.MouseEvent, product: ProductCardData) => {
    e.stopPropagation();
    const bookToAdd: Book = {
      id: product.id,
      shopId: currentShopId,
      shopName: currentShopName,
      categoryId: 1,
      title: product.title,
      author: product.author || "Đang cập nhật",
      publisher: product.publisher || "NXB Hội Nhà Văn",
      price: product.price,
      originalPrice: product.originalPrice,
      stock: product.stock ?? 10,
      rating: product.rating ?? 5,
      reviewCount: 0,
      description: "",
      coverColor: "#ffffff",
      coverColor2: "#ffffff",
      imageUrl: product.imageUrl,
      status: "ACTIVE",
      publishedYear: new Date().getFullYear(),
    };
    addToCart(bookToAdd, 1);
    setAddedBookId(product.id);
    setTimeout(() => setAddedBookId(null), 2000);
  };

  // Khách hàng gửi thắc mắc về đơn hàng trực tiếp vào khung chat
  const handleAskAboutOrder = async (order: Order) => {
    const orderCode = typeof order.id === "string" ? order.id.slice(0, 8).toUpperCase() : `#${order.id}`;
    const text = `Shop ơi, mình muốn hỏi về đơn hàng #${orderCode} (Tổng tiền: ${fmt(order.totalAmount)}). Shop kiểm tra tiến độ giao giúp mình nhé!`;
    await sendMessageContent(text);
  };

  // Sao chép mã voucher của Shop
  const handleCopyVoucher = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedVoucher(code);
    setTimeout(() => setCopiedVoucher(null), 2000);
  };

  // Cập nhật shop khi props thay đổi
  useEffect(() => {
    if (isOpen) {
      setIsMinimized(false);
      if (book) {
        setCurrentShopId(book.shopId);
        setCurrentShopName(book.shopName);
        setCurrentBook(book);
        setViewMode("detail");
      } else if (shopId) {
        setCurrentShopId(shopId);
        setCurrentShopName(shopName);
        setCurrentBook(null);
        setViewMode(shopId === 1 && !book ? "list" : "detail");
      }
    }
  }, [isOpen, shopId, shopName, book]);

  // Format thời gian hiển thị gọn gàng trong danh sách cuộc trò chuyện
  const formatChatTime = (timeStr?: string) => {
    if (!timeStr) return "";
    if (timeStr.includes("T")) {
      try {
        const d = new Date(timeStr);
        return d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
      } catch {
        return timeStr;
      }
    }
    return timeStr;
  };

  // 1. Tải danh sách tất cả các Shop đã nhắn tin
  const loadUserThreads = async () => {
    try {
      const threads = await chatService.getUserConversations();
      setUserThreads(threads);

      // Tìm thread khớp với shop hiện tại để tự động gán chatId và tải tin nhắn
      const matched = threads.find((t) => String(t.shopId) === String(currentShopId));
      if (matched && matched.chatId && isValidGuid(matched.chatId)) {
        setActiveChatId(matched.chatId);
        chatService
          .getMessages({ chatId: matched.chatId, shopId: currentShopId, userId: user?.id })
          .then((res) => {
            if (res.messages && res.messages.length > 0) {
              setMessages(res.messages);
            }
          });
      }
    } catch (e) {
      console.warn("Error loading user threads:", e);
    }
  };

  // 2. Tải tin nhắn của Shop hiện tại & Khởi tạo SignalR
  useEffect(() => {
    if (!isOpen) return;

    loadUserThreads();

    let isMounted = true;
    const fetchChatMessages = async (explicitChatId?: string | number) => {
      try {
        const idToUse = explicitChatId || activeChatId;
        const res = await chatService.getMessages({
          chatId: idToUse,
          shopId: currentShopId,
          userId: user?.id,
        });
        if (isMounted && res.messages) {
          setMessages(res.messages);
          if (res.chatId && isValidGuid(res.chatId)) {
            setActiveChatId(res.chatId);
          }
        }
      } catch (err) {
        console.warn("Could not fetch messages:", err);
      }
    };

    fetchChatMessages();

    // Kết nối SignalR Hub
    signalRService.startConnection().then((connected) => {
      if (isMounted) setIsRealTimeConnected(connected);
    });

    // Đăng ký nhận tin nhắn real-time
    const registerListener =
      typeof signalRService.onReceiveMessage === "function"
        ? signalRService.onReceiveMessage.bind(signalRService)
        : typeof (signalRService as any).onMessageReceived === "function"
        ? (signalRService as any).onMessageReceived.bind(signalRService)
        : null;

    const unsubscribe = registerListener
      ? registerListener((newMsg: any) => {
          if (isMounted) {
            if (
              String(newMsg.shopId) === String(currentShopId) ||
              String(newMsg.senderId) === String(currentShopId)
            ) {
              upsertMessage(newMsg);
            }
            loadUserThreads();
          }
        })
      : () => {};

    // Lắng nghe sự kiện đồng bộ giữa các tab
    const handleLocalUpdate = () => {
      chatService
        .getMessages({ chatId: activeChatId, shopId: currentShopId, userId: user?.id })
        .then((res) => {
          if (res.messages && isMounted) setMessages(res.messages);
        });
      loadUserThreads();
    };
    window.addEventListener("bookverse_chat_updated", handleLocalUpdate);

    return () => {
      isMounted = false;
      unsubscribe();
      window.removeEventListener("bookverse_chat_updated", handleLocalUpdate);
    };
  }, [isOpen, currentShopId]);

  // Gia nhập phòng chat khi có chatId
  useEffect(() => {
    if (activeChatId && isValidGuid(activeChatId)) {
      signalRService.joinChatRoom(activeChatId);
    }
  }, [activeChatId]);

  // Cuộn xuống tin nhắn mới nhất
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const upsertMessage = (msg: ChatMessage) => {
    setMessages((prev) => cleanAndDeduplicateMessages([...prev, msg]));
  };

  // Chọn một Shop từ danh sách cuộc trò chuyện
  const handleSelectShopThread = (thread: ChatThread) => {
    setCurrentShopId(thread.shopId);
    setCurrentShopName(thread.shopName || thread.userName);
    const nextChatId = isValidGuid(thread.chatId) ? thread.chatId : undefined;
    setActiveChatId(nextChatId);
    setCurrentBook(null);
    setViewMode("detail");

    // Tải tin nhắn của cuộc trò chuyện được chọn ngay lập tức
    chatService
      .getMessages({ chatId: nextChatId, shopId: thread.shopId, userId: user?.id })
      .then((res) => {
        setMessages(res.messages || []);
      });
  };

  const sendMessageContent = async (textToSend: string) => {
    if (isSending || !textToSend.trim()) return;

    setIsSending(true);
    try {
      const res = await chatService.sendMessage({
        chatId: activeChatId,
        senderId: user?.id || "customer-1",
        receiverId: currentShopId,
        shopId: currentShopId,
        text: textToSend.trim(),
        isFromCustomer: true,
        senderName: user?.name || "Khách hàng",
        avatar: user?.avatar,
      });

      upsertMessage(res.message);

      if (!activeChatId && res.chatId && isValidGuid(res.chatId)) {
        setActiveChatId(res.chatId);
        await signalRService.joinChatRoom(res.chatId);
      }

      loadUserThreads();
    } catch (e) {
      console.warn("Send message error:", e);
    } finally {
      setIsSending(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSending || !inputText.trim()) return;
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

  if (!isOpen) return null;

  // =========================================================
  // KHI THU NHỎ THÀNH BONG BÓNG NỔI (MINIMIZED FLOATING BUBBLE)
  // =========================================================
  if (isMinimized) {
    return (
      <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 p-3 bg-white/95 backdrop-blur-md border border-slate-200 shadow-2xl rounded-2xl cursor-pointer hover:shadow-blue-500/20 hover:border-blue-400 transition-all group animate-in slide-in-from-bottom-3 duration-200">
        <button
          type="button"
          onClick={() => setIsMinimized(false)}
          className="flex items-center gap-3 text-left bg-transparent border-0 cursor-pointer p-0"
        >
          <div className="relative">
            <div className="w-11 h-11 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-md group-hover:scale-105 transition-transform">
              <Store size={20} />
            </div>
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full" />
          </div>
          <div className="min-w-0 pr-1">
            <p className="font-bold text-xs text-slate-800 group-hover:text-blue-600 transition-colors truncate max-w-[160px]">
              {viewMode === "detail" ? currentShopName : "Hộp thư tư vấn"}
            </p>
            <p className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
              Bấm để mở lại chat
            </p>
          </div>
        </button>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer ml-1"
          title="Đóng chat"
        >
          <X size={15} />
        </button>
      </div>
    );
  }

  // =========================================================
  // SUB-COMPONENT: RENDER CỘT 1 (DANH SÁCH SHOP - INBOX LIST)
  // =========================================================
  const renderInboxList = (showBackToDetail = false) => (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Header List */}
      <div className="px-4 py-3.5 border-b border-slate-200 bg-white flex items-center justify-between shrink-0 shadow-2xs">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
            <MessageSquare size={18} />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-xs sm:text-sm">
              Hộp thư tư vấn ({userThreads.length} gian hàng)
            </h3>
            <p className="text-[11px] text-slate-500">
              Trao đổi trực tiếp với các nhà sách
            </p>
          </div>
        </div>

        {showBackToDetail && (
          <button
            type="button"
            onClick={() => setViewMode("detail")}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
          >
            Quay lại <ChevronRight size={14} />
          </button>
        )}
      </div>

      {/* Search Shop Bar */}
      <div className="p-3 bg-white border-b border-slate-100 shrink-0">
        <div className="relative">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            value={searchShopKeyword}
            onChange={(e) => setSearchShopKeyword(e.target.value)}
            placeholder="Tìm kiếm nhà sách hoặc tin nhắn..."
            className="w-full pl-8 pr-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
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
          filteredThreads.map((t) => {
            const isCurrentActive = String(t.shopId) === String(currentShopId);
            return (
              <button
                key={t.chatId}
                onClick={() => handleSelectShopThread(t)}
                className={`w-full p-3.5 text-left flex items-start gap-3 transition-colors cursor-pointer group ${
                  isCurrentActive
                    ? "bg-blue-50/80 border-l-4 border-l-blue-600"
                    : "bg-white hover:bg-slate-50"
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                  <Store size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <p className={`font-bold text-xs truncate ${isCurrentActive ? "text-blue-700" : "text-slate-800"}`}>
                      {t.shopName || t.userName}
                    </p>
                    <span className="text-[10px] text-slate-400 shrink-0 ml-1">
                      {formatChatTime(t.updatedAt)}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 truncate leading-relaxed">
                    {t.lastMessage || "Nhấn để tiếp tục trò chuyện..."}
                  </p>
                </div>
                <div className="flex items-center self-center text-slate-300 group-hover:text-blue-600 transition-colors pl-1">
                  <ChevronRight size={14} />
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );

  // =========================================================
  // SUB-COMPONENT: RENDER CỘT 2 (KHUNG CHAT CHÍNH VỚI SHOP)
  // =========================================================
  const renderActiveChat = (isFullscreenMode: boolean) => (
    <div className="flex flex-col h-full bg-white relative">
      {/* Header Detail */}
      <div className="px-4 py-3 border-b border-slate-200 bg-white flex items-center justify-between shrink-0 shadow-2xs">
        <div className="flex items-center gap-2.5 min-w-0">
          {!isFullscreenMode && (
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer flex items-center gap-1 text-xs font-semibold mr-1"
              title="Danh sách tất cả gian hàng"
            >
              <ArrowLeft size={16} />
            </button>
          )}

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

        {/* Nút điều khiển bên phải của Header Cột 2 */}
        <div className="flex items-center gap-1">
          {isFullscreenMode ? (
            <button
              type="button"
              onClick={() => setShowRightSidebar(!showRightSidebar)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                showRightSidebar
                  ? "bg-blue-50 text-blue-700 border-blue-200 shadow-2xs"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
              title="Bật/tắt Hồ sơ & Đơn hàng của shop"
            >
              <Info size={14} />
              <span className="hidden sm:inline">Hồ sơ & Đơn hàng</span>
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setIsMinimized(true)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                title="Thu nhỏ xuống góc màn hình"
              >
                <Minus size={16} />
              </button>
              <button
                type="button"
                onClick={() => setDisplayMode("fullscreen")}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer hidden sm:block"
                title="Bung toàn màn hình 3 cột"
              >
                <Maximize2 size={16} />
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                title="Đóng chat"
              >
                <X size={17} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Sticky Book Preview Card if chatting about a specific book */}
      {currentBook && (
        <div className="p-3 bg-blue-50/90 border-b border-blue-100 flex items-center gap-3 shrink-0 animate-in fade-in">
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
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50">
        <div className="text-center my-2">
          <span className="px-3.5 py-1.5 bg-white border border-slate-200 shadow-2xs rounded-full text-[11px] font-semibold text-slate-600">
            Hội thoại tư vấn sách với <span className="text-blue-700 font-bold">{currentShopName}</span>
          </span>
        </div>

        {cleanAndDeduplicateMessages(messages).map((m, idx) => {
          const isMe = user?.role === "customer" ? m.isFromCustomer : !m.isFromCustomer;
          const product = parseProductFromMessage(m);
          const voucher = parseVoucherFromMessage(m);

          return (
            <div
              key={m.id || idx}
              className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
            >
              {product ? (
                <div
                  onClick={() => handleOpenBookDetail(product)}
                  className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-xs max-w-[320px] sm:max-w-[340px] w-full text-left cursor-pointer hover:border-blue-400 hover:shadow-md transition-all group"
                >
                  <div className="flex items-start gap-3 mb-2.5">
                    {/* Bìa sách chuẩn tỉ lệ 3:4 kích thước 80x112px */}
                    <div className="w-20 h-28 rounded-lg bg-slate-100 overflow-hidden border border-slate-200/80 shrink-0 flex items-center justify-center relative shadow-xs group-hover:shadow-md transition-shadow">
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full bg-linear-to-br from-amber-700 to-amber-900 flex flex-col items-center justify-center p-1 text-center text-white">
                          <BookOpen size={20} className="mb-1 text-amber-200" />
                          <span className="text-[9px] font-bold line-clamp-2 leading-tight">
                            {product.title}
                          </span>
                        </div>
                      )}
                      {loadingBookId === product.id && (
                        <div className="absolute inset-0 bg-black/40 backdrop-blur-2xs flex items-center justify-center">
                          <Loader2 size={16} className="animate-spin text-white" />
                        </div>
                      )}
                    </div>

                    {/* Khối thông tin chi tiết của sách */}
                    <div className="min-w-0 flex-1 flex flex-col justify-between self-stretch">
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[9px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded font-bold border border-emerald-200">
                            Sản phẩm Shop
                          </span>
                          {product.rating && (
                            <span className="text-[10px] text-amber-600 font-bold flex items-center gap-0.5">
                              ⭐ {product.rating}
                            </span>
                          )}
                        </div>
                        <h5
                          className="font-bold text-xs text-slate-800 line-clamp-2 mt-1 leading-snug group-hover:text-blue-600 transition-colors"
                          title={product.title}
                        >
                          {product.title}
                        </h5>
                        {product.author && (
                          <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
                            Tác giả: {product.author}
                          </p>
                        )}
                        {product.publisher && (
                          <p className="text-[10px] text-slate-400 truncate mt-0.2">
                            NXB: {product.publisher}
                          </p>
                        )}
                      </div>

                      <div className="pt-1.5 mt-1 border-t border-slate-100">
                        <p className="text-sm font-black text-blue-700 leading-none">
                          {fmt(product.price)}
                        </p>
                        {product.stock !== undefined && (
                          <p className="text-[10px] text-slate-400 mt-1">
                            Tồn kho: <span className="font-semibold text-slate-600">{product.stock} cuốn</span>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {cleanProductText(m.text) &&
                    cleanProductText(m.text) !==
                      `Shop xin gửi bạn thông tin cuốn sách "${product.title}"` && (
                      <p className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-xl border border-slate-100 leading-relaxed mb-2">
                        {cleanProductText(m.text)}
                      </p>
                    )}

                  {/* Hàng nút tương tác: Xem sách & Thêm vào giỏ */}
                  <div className="flex items-center gap-1.5 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenBookDetail(product);
                      }}
                      className="flex-1 py-1.5 px-2.5 bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-blue-200/60 shadow-2xs"
                    >
                      <ExternalLink size={13} /> Xem chi tiết
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleAddToCartFromCard(e, product)}
                      className={`py-1.5 px-3 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs ${
                        addedBookId === product.id
                          ? "bg-emerald-600 text-white"
                          : "bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white border border-emerald-200/60"
                      }`}
                      title="Thêm nhanh vào giỏ hàng"
                    >
                      {addedBookId === product.id ? (
                        <>
                          <Check size={13} /> Đã thêm
                        </>
                      ) : (
                        <>
                          <ShoppingCart size={13} /> Giỏ hàng
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : voucher ? (
                <VoucherTicket voucher={voucher} isShop={false} />
              ) : m.imageUrl ? (
                <div className="rounded-2xl overflow-hidden border border-slate-200 bg-white p-1 max-w-[240px] shadow-xs">
                  <img
                    src={m.imageUrl}
                    alt="Ảnh chụp thực tế của sách"
                    onClick={() => setPreviewModalImage(m.imageUrl || null)}
                    className="w-full h-auto max-h-60 rounded-xl object-cover cursor-pointer hover:opacity-90 transition-opacity"
                  />
                  {m.text &&
                    m.text.trim() !== "" &&
                    m.text !== "Shop gửi bạn ảnh chụp thực tế của sách" &&
                    !m.text.startsWith("[VOUCHER:") &&
                    !m.text.startsWith("[PRODUCT:") && (
                      <p className="text-xs text-slate-800 px-2 py-1.5 leading-relaxed">
                        {m.text}
                      </p>
                    )}
                </div>
              ) : (
                <div
                  className={`max-w-[82%] rounded-2xl px-4 py-2.5 text-xs sm:text-sm shadow-xs ${
                    isMe
                      ? "bg-blue-600 text-white rounded-br-none"
                      : "bg-white text-slate-800 border border-slate-200 rounded-bl-none"
                  }`}
                >
                  <p className="leading-relaxed whitespace-pre-wrap">{m.text}</p>
                </div>
              )}
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
        <div className="px-3 py-2 bg-white border-t border-slate-100 overflow-x-auto whitespace-nowrap flex gap-1.5 shrink-0 scrollbar-none">
          <button
            type="button"
            disabled={isSending}
            onClick={() =>
              sendMessageContent(
                `Shop ơi, cuốn "${currentBook.title}" này còn hàng không ạ?`
              )
            }
            className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-[11px] text-slate-600 font-medium transition-colors shrink-0 cursor-pointer border border-slate-200 flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Sparkles size={11} className="text-blue-500" /> Sách còn hàng không?
          </button>
          <button
            type="button"
            disabled={isSending}
            onClick={() =>
              sendMessageContent(
                `Sách "${currentBook.title}" này có kèm bookmark hoặc quà tặng không shop?`
              )
            }
            className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-[11px] text-slate-600 font-medium transition-colors shrink-0 cursor-pointer border border-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            🎁 Có kèm quà tặng không?
          </button>
          <button
            type="button"
            disabled={isSending}
            onClick={() =>
              sendMessageContent(
                `Shop có thể cho mình xin thêm hình ảnh thật của sách "${currentBook.title}" được không?`
              )
            }
            className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-[11px] text-slate-600 font-medium transition-colors shrink-0 cursor-pointer border border-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            📷 Xin ảnh chụp thật
          </button>
        </div>
      )}

      {/* Input Bar */}
      <form
        onSubmit={handleSend}
        className="p-3 bg-white border-t border-slate-200 flex items-center gap-2 shrink-0"
      >
        <input
          value={inputText}
          disabled={isSending}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={isSending ? "Đang gửi tin nhắn..." : `Nhắn tin với ${currentShopName}...`}
          className="flex-1 text-xs sm:text-sm px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 bg-slate-50 transition-all disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={!inputText.trim() || isSending}
          className="p-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-all cursor-pointer shadow-sm flex items-center justify-center min-w-[38px] min-h-[38px]"
        >
          {isSending ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Send size={16} />
          )}
        </button>
      </form>
    </div>
  );

  // =========================================================
  // SUB-COMPONENT: RENDER CỘT 3 (HỒ SƠ SHOP & ĐƠN HÀNG CỦA TÔI)
  // =========================================================
  const renderShopProfileAndOrders = () => (
    <div className="flex flex-col h-full bg-slate-50 overflow-hidden">
      {/* Header Cột 3 */}
      <div className="px-4 py-3.5 border-b border-slate-200 bg-white flex items-center justify-between shrink-0 shadow-2xs">
        <div className="flex items-center gap-2">
          <Store size={18} className="text-blue-600" />
          <h4 className="font-extrabold text-xs sm:text-sm text-slate-800">
            HỒ SƠ & ĐƠN HÀNG TẠI SHOP
          </h4>
        </div>
        <button
          type="button"
          onClick={() => setShowRightSidebar(false)}
          className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          title="Thu gọn cột hồ sơ"
        >
          <X size={16} />
        </button>
      </div>

      {/* Body Cột 3: Cuộn dọc các card thông tin */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-3.5">
        {/* Card 1: Thông tin Gian Hàng */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs text-center">
          <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold mx-auto mb-2.5 shadow-2xs">
            <Store size={26} />
          </div>
          <h4 className="font-black text-sm text-slate-800 leading-tight">
            {currentShopName}
          </h4>
          <div className="flex items-center justify-center gap-1 mt-1">
            <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
              <ShieldCheck size={12} /> Đối tác xác thực
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 my-3 pt-3 border-t border-slate-100 text-center">
            <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
              <div className="flex items-center justify-center gap-0.5 text-amber-500 font-bold text-xs">
                <Star size={12} fill="currentColor" /> {shopProfile?.rating || "4.9"}
              </div>
              <p className="text-[9px] text-slate-400 mt-0.5">Đánh giá</p>
            </div>
            <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
              <span className="font-extrabold text-xs text-blue-700">100%</span>
              <p className="text-[9px] text-slate-400 mt-0.5">Phản hồi</p>
            </div>
            <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
              <span className="font-extrabold text-xs text-slate-700">5 phút</span>
              <p className="text-[9px] text-slate-400 mt-0.5">Thời gian</p>
            </div>
          </div>

          <div className="text-left text-[11px] text-slate-500 space-y-1.5 pt-1">
            <div className="flex items-start gap-1.5">
              <MapPin size={13} className="text-slate-400 shrink-0 mt-0.5" />
              <span className="line-clamp-2">
                {shopProfile?.address || "Hà Nội / TP. Hồ Chí Minh, Việt Nam"}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Phone size={13} className="text-slate-400 shrink-0" />
              <span>{shopProfile?.phone || "1900 6868"}</span>
            </div>
          </div>
        </div>

        {/* Card 2: Kho Voucher Độc Quyền Của Shop */}
        <div className="bg-white rounded-2xl p-3.5 border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-1.5">
              <Tag size={15} className="text-amber-600" />
              <h5 className="font-extrabold text-xs text-slate-800">
                Kho Voucher của Shop
              </h5>
            </div>
            <span className="text-[10px] text-slate-400">
              {SHOP_VOUCHERS.length} mã khả dụng
            </span>
          </div>

          <div className="space-y-2">
            {SHOP_VOUCHERS.map((v) => (
              <div
                key={v.code}
                className="p-2.5 rounded-xl border border-amber-200/80 bg-linear-to-r from-amber-50/70 to-orange-50/40 flex items-center justify-between gap-2"
              >
                <div>
                  <span className="font-black text-xs text-amber-800 font-mono tracking-wider block">
                    {v.code}
                  </span>
                  <p className="text-[10px] text-slate-600 mt-0.2">
                    {v.label} (Đơn từ {fmt(v.minSpend)})
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopyVoucher(v.code)}
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer shrink-0 ${
                    copiedVoucher === v.code
                      ? "bg-emerald-600 text-white"
                      : "bg-amber-600 hover:bg-amber-700 text-white shadow-2xs"
                  }`}
                >
                  {copiedVoucher === v.code ? (
                    <>
                      <CheckCheck size={11} /> Đã chép
                    </>
                  ) : (
                    <>
                      <Copy size={11} /> Lưu mã
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Card 3: Đơn Hàng Của Tôi Tại Shop Này */}
        <div className="bg-white rounded-2xl p-3.5 border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-1.5">
              <Package size={15} className="text-blue-600" />
              <h5 className="font-extrabold text-xs text-slate-800">
                Đơn Hàng Của Bạn Tại Shop
              </h5>
            </div>
            <span className="text-[10px] bg-blue-50 text-blue-700 font-bold px-1.5 py-0.2 rounded-full border border-blue-200">
              {shopOrders.length} đơn
            </span>
          </div>

          {shopOrders.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-slate-100">
              <ShoppingBag size={24} className="mx-auto mb-1 text-slate-300" />
              Bạn chưa có đơn hàng nào tại gian hàng này.
            </div>
          ) : (
            <div className="space-y-2.5">
              {shopOrders.map((o) => {
                const shortId = typeof o.id === "string" ? o.id.slice(0, 8).toUpperCase() : o.id;
                return (
                  <div
                    key={o.id}
                    className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-blue-50/40 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono font-bold text-xs text-slate-800">
                        #{shortId}
                      </span>
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800">
                        {o.orderStatus === "COMPLETED"
                          ? "Hoàn thành"
                          : o.orderStatus === "SHIPPED"
                          ? "Đang giao"
                          : o.orderStatus === "PAID"
                          ? "Đã thanh toán"
                          : "Chờ xác nhận"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 mb-2">
                      <span>{o.createdAt ? String(o.createdAt).slice(0, 10) : "Gần đây"}</span>
                      <span className="font-extrabold text-blue-700">
                        {fmt(o.totalAmount)}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleAskAboutOrder(o)}
                      className="w-full py-1 px-2 rounded-lg bg-white hover:bg-blue-600 hover:text-white border border-blue-200 text-blue-700 text-[10px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer shadow-2xs"
                    >
                      <MessageSquare size={11} /> Hỏi shop về đơn này
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // =========================================================
  // CHẾ ĐỘ 1: TOÀN MÀN HÌNH 3 CỘT (FULLSCREEN 3-COLUMN CHAT HUB)
  // =========================================================
  if (displayMode === "fullscreen") {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex flex-col animate-in fade-in duration-200">
        <div className="w-full h-full bg-white flex flex-col overflow-hidden">
          {/* TOP BAR: HEADER TOÀN CỤC CHO FULLSCREEN */}
          <div className="h-14 px-5 bg-white border-b border-slate-200 flex items-center justify-between shrink-0 shadow-2xs z-10">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-sm shadow-xs">
                BV
              </div>
              <div>
                <h2 className="font-extrabold text-sm sm:text-base text-slate-800 flex items-center gap-2">
                  <span>Trung Tâm Hộp Thư Tư Vấn</span>
                  <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-bold border border-blue-200 hidden sm:inline-block">
                    BookVerse Chat Hub
                  </span>
                </h2>
                <p className="text-[11px] text-slate-400 hidden sm:block">
                  Trao đổi trực tiếp, nhận voucher độc quyền và theo dõi đơn hàng với các nhà sách
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setDisplayMode("floating")}
                className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Thu nhỏ về cửa sổ góc phải"
              >
                <Minimize2 size={15} /> Thu nhỏ
              </button>
              <button
                type="button"
                onClick={() => setIsMinimized(true)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                title="Thu nhỏ thành bong bóng"
              >
                <Minus size={16} />
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                title="Đóng chat"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* MAIN 3-COLUMN CONTAINER CÓ THANH KÉO RESIZERS */}
          <div
            ref={chatContainerRef}
            className="flex-1 flex flex-row min-h-0 relative bg-slate-100 overflow-hidden"
          >
            {/* CỘT 1: DANH SÁCH CÁC GIAN HÀNG (INBOX LIST) */}
            <div
              style={{ width: col1Width }}
              className="shrink-0 h-full border-r border-slate-200 bg-white flex flex-col overflow-hidden"
            >
              {renderInboxList(false)}
            </div>

            {/* RESIZER 1 GIỮA CỘT 1 VÀ CỘT 2 */}
            <div
              onMouseDown={() => setIsDraggingCol1(true)}
              className="w-1.5 hover:w-2 hover:bg-blue-500 active:bg-blue-600 bg-slate-200/80 cursor-col-resize transition-all shrink-0 relative group flex items-center justify-center z-10"
              title="Kéo chuột để thay đổi độ rộng danh sách shop"
            >
              <div className="w-0.5 h-6 bg-slate-400 group-hover:bg-white rounded-full transition-colors" />
            </div>

            {/* CỘT 2: KHUNG CHAT CHÍNH VỚI SHOP */}
            <div className="flex-1 h-full min-w-0 flex flex-col bg-white overflow-hidden">
              {renderActiveChat(true)}
            </div>

            {/* RESIZER 2 GIỮA CỘT 2 VÀ CỘT 3 */}
            {showRightSidebar && (
              <div
                onMouseDown={() => setIsDraggingCol3(true)}
                className="w-1.5 hover:w-2 hover:bg-blue-500 active:bg-blue-600 bg-slate-200/80 cursor-col-resize transition-all shrink-0 relative group flex items-center justify-center z-10"
                title="Kéo chuột để thay đổi độ rộng hồ sơ shop"
              >
                <div className="w-0.5 h-6 bg-slate-400 group-hover:bg-white rounded-full transition-colors" />
              </div>
            )}

            {/* CỘT 3: HỒ SƠ SHOP & ĐƠN HÀNG CỦA TÔI TẠI SHOP */}
            {showRightSidebar && (
              <div
                style={{ width: col3Width }}
                className="shrink-0 h-full border-l border-slate-200 bg-slate-50 flex flex-col overflow-hidden"
              >
                {renderShopProfileAndOrders()}
              </div>
            )}
          </div>
        </div>

        {/* Modal phóng to xem ảnh thực tế của sách */}
        {previewModalImage && (
          <div
            onClick={() => setPreviewModalImage(null)}
            className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in"
          >
            <div className="relative max-w-2xl max-h-[90vh] bg-white rounded-2xl overflow-hidden p-2 shadow-2xl">
              <button
                type="button"
                onClick={() => setPreviewModalImage(null)}
                className="absolute top-3 right-3 p-1.5 bg-black/60 text-white rounded-full hover:bg-black transition-colors cursor-pointer z-10"
              >
                <X size={18} />
              </button>
              <img
                src={previewModalImage}
                alt="Ảnh chi tiết sách"
                className="w-full h-auto max-h-[80vh] object-contain rounded-xl"
              />
            </div>
          </div>
        )}
      </div>
    );
  }

  // =========================================================
  // CHẾ ĐỘ 2: CỬA SỔ NỔI GÓC PHẢI (FLOATING WINDOW COMPACT)
  // =========================================================
  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-[calc(100vw-32px)] sm:w-[430px] h-[calc(100dvh-32px)] sm:h-[620px] sm:max-h-[85vh] bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200/90 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
      {viewMode === "list" ? renderInboxList(true) : renderActiveChat(false)}

      {/* Modal phóng to xem ảnh thực tế của sách */}
      {previewModalImage && (
        <div
          onClick={() => setPreviewModalImage(null)}
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in"
        >
          <div className="relative max-w-2xl max-h-[90vh] bg-white rounded-2xl overflow-hidden p-2 shadow-2xl">
            <button
              type="button"
              onClick={() => setPreviewModalImage(null)}
              className="absolute top-3 right-3 p-1.5 bg-black/60 text-white rounded-full hover:bg-black transition-colors cursor-pointer z-10"
            >
              <X size={18} />
            </button>
            <img
              src={previewModalImage}
              alt="Ảnh chi tiết sách"
              className="w-full h-auto max-h-[80vh] object-contain rounded-xl"
            />
          </div>
        </div>
      )}
    </div>
  );
};
