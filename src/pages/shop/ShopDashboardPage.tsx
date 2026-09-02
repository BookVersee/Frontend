import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Package,
  BookOpen,
  DollarSign,
  ShoppingBag,
  Clock,
  Truck,
  Check,
  X,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  MessageSquare,
  CornerDownRight,
  Send,
  Calendar,
  User as UserIcon,
  Wifi,
  WifiOff,
  Search,
  Upload,
  Image as ImageIcon,
  Loader2,
  AlertCircle,
  Star,
  ChevronRight,
  Info,
  ExternalLink,
  Tag,
  Sparkles,
  Filter,
  ArrowRight,
  CheckCheck,
  Ticket,
  Share2,
  FileText,
  ShieldAlert,
  Copy,
  ChevronDown,
  Paperclip,
  ArrowLeft,
  GripVertical,
} from "lucide-react";
import { Order, Book, Category, OrderStatus, OrderFeedback, ChatMessage, BookImageDto, Shop } from "../../types";
import { shopService } from "../../services/shopService";
import { bookService } from "../../services/bookService";
import {
  chatService,
  ChatThread,
  isValidGuid,
  cleanAndDeduplicateMessages,
  SHOP_VOUCHERS,
  parseVoucherFromMessage,
  ShopVoucher,
  formatProductCardText,
  parseProductFromMessage,
  cleanProductText,
} from "../../services/chatService";
import { VoucherTicket } from "../../components/chat/VoucherTicket";
import { signalRService } from "../../services/signalRService";
import { uploadService } from "../../services/uploadService";
import { useAuth } from "../../contexts/AuthContext";
import { orderStatusInfo } from "../../utils/status";
import { fmt } from "../../utils/format";
import { Card } from "../../components/common/Card";
import { StatCard } from "../../components/common/StatCard";
import { Badge } from "../../components/common/Badge";
import { Btn } from "../../components/common/Btn";
import { BookCover } from "../../components/common/BookCover";
import { Modal } from "../../components/common/Modal";

export const ShopDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [currentShop, setCurrentShop] = useState<Shop | null>(null);

  const shopId = currentShop?.id || user?.shopId || 1;
  const shopName = currentShop?.name || user?.shopName || "Gian hàng của tôi";

  const [tab, setTab] = useState<"orders" | "products" | "feedbacks" | "revenue" | "chat">("orders");
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Book[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [feedbacks, setFeedbacks] = useState<{ orderId: number; feedback: OrderFeedback }[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter in shop products
  const [productSearch, setProductSearch] = useState("");
  const [productStatusFilter, setProductStatusFilter] = useState<"ACTIVE" | "OUT_OF_STOCK" | "HIDDEN" | "ALL">("ACTIVE");

  // Add & Edit Product Modal State
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingBookId, setEditingBookId] = useState<string | number | null>(null);
  const [categoryId, setCategoryId] = useState<string | number>("");
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [publisher, setPublisher] = useState("NXB Trẻ");
  const [publishedYear, setPublishedYear] = useState(String(new Date().getFullYear()));
  const [price, setPrice] = useState("95000");
  const [stock, setStock] = useState("50");
  const [desc, setDesc] = useState("");
  const [isbn, setIsbn] = useState("");
  const [color1, setColor1] = useState("#1d4ed8");
  const [color2, setColor2] = useState("#3b82f6");
  const [imageUrl, setImageUrl] = useState("");
  const [bookImages, setBookImages] = useState<
    { url: string; publicId?: string; isCover: boolean; displayOrder: number }[]
  >([]);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reply Feedback State
  const [replyTextMap, setReplyTextMap] = useState<Record<number, string>>({});
  const [submittingReply, setSubmittingReply] = useState<number | null>(null);

  // Revenue filter period
  const [revenuePeriod, setRevenuePeriod] = useState<"day" | "month" | "year">("month");

// REAL-TIME CHAT & MESSAGING STATE (SHOP)
  // ==========================================
  const [chatThreads, setChatThreads] = useState<ChatThread[]>([]);
  const [selectedThread, setSelectedThread] = useState<ChatThread | null>(null);
  const [threadMessages, setThreadMessages] = useState<ChatMessage[]>([]);
  const [shopReplyInput, setShopReplyInput] = useState("");
  const [isSendingShopReply, setIsSendingShopReply] = useState(false);
  const [isRealTimeChatConnected, setIsRealTimeChatConnected] = useState(false);
  const [threadSearch, setThreadSearch] = useState("");
  const [showCustomerSidebar, setShowCustomerSidebar] = useState(true);
  const [chatFilter, setChatFilter] = useState<"all" | "unread" | "needs_reply" | "has_order">("all");
  const [previewModalImage, setPreviewModalImage] = useState<string | null>(null);
  const [showProductPickerModal, setShowProductPickerModal] = useState(false);
  const [isLoadingPickerProducts, setIsLoadingPickerProducts] = useState(false);
  const [productPickerSearch, setProductPickerSearch] = useState("");

  const handleOpenProductPicker = async () => {
    setShowProductPickerModal(true);
    const activeId = currentShop?.id || user?.shopId || 1;
    if (products.length === 0) {
      setIsLoadingPickerProducts(true);
      try {
        const list = await shopService.getShopProducts(activeId);
        setProducts(list);
        setProductsLoaded(true);
      } catch (err) {
        console.warn("Load picker products error:", err);
      } finally {
        setIsLoadingPickerProducts(false);
      }
    }
  };
  const [customerNotes, setCustomerNotes] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem("bookverse_shop_customer_notes");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [activeNoteText, setActiveNoteText] = useState("");
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [isUploadingChatImage, setIsUploadingChatImage] = useState(false);
  const chatFileInputRef = useRef<HTMLInputElement>(null);
  const chatMessagesEndRef = useRef<HTMLDivElement>(null);

  // RESPONSIVE & DRAGGABLE SPLITTERS STATE (SHOP CHAT)
  // ==================================================
  const [col1Width, setCol1Width] = useState<number>(() => {
    try {
      const saved = localStorage.getItem("bookverse_shop_chat_col1_w");
      return saved ? Math.max(220, Math.min(480, Number(saved))) : 320;
    } catch {
      return 320;
    }
  });
  const [col3Width, setCol3Width] = useState<number>(() => {
    try {
      const saved = localStorage.getItem("bookverse_shop_chat_col3_w");
      return saved ? Math.max(260, Math.min(520, Number(saved))) : 320;
    } catch {
      return 320;
    }
  });
  const [isDraggingCol1, setIsDraggingCol1] = useState(false);
  const [isDraggingCol3, setIsDraggingCol3] = useState(false);
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth >= 1024 : true
  );
  const [mobileChatView, setMobileChatView] = useState<"list" | "chat">("list");
  const [mobileProfileOpen, setMobileProfileOpen] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Lắng nghe thay đổi kích thước màn hình
  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Xử lý kéo chuột điều chỉnh độ rộng cột trên Web (Draggable Resizers)
  useEffect(() => {
    if (!isDraggingCol1 && !isDraggingCol3) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!chatContainerRef.current) return;
      const rect = chatContainerRef.current.getBoundingClientRect();

      if (isDraggingCol1) {
        const newW = Math.max(220, Math.min(480, e.clientX - rect.left));
        setCol1Width(newW);
      } else if (isDraggingCol3) {
        const newW = Math.max(260, Math.min(520, rect.right - e.clientX));
        setCol3Width(newW);
      }
    };

    const handleMouseUp = () => {
      if (isDraggingCol1) {
        setIsDraggingCol1(false);
        try {
          localStorage.setItem("bookverse_shop_chat_col1_w", String(col1Width));
        } catch {}
      }
      if (isDraggingCol3) {
        setIsDraggingCol3(false);
        try {
          localStorage.setItem("bookverse_shop_chat_col3_w", String(col3Width));
        } catch {}
      }
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    };

    document.body.style.userSelect = "none";
    document.body.style.cursor = "col-resize";

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    };
  }, [isDraggingCol1, isDraggingCol3, col1Width, col3Width]);

  // Trạng thái lazy loading theo Tab
  const [productsLoaded, setProductsLoaded] = useState(false);
  const [feedbacksLoaded, setFeedbacksLoaded] = useState(false);
  const [chatsLoaded, setChatsLoaded] = useState(false);
  const [tabLoading, setTabLoading] = useState(false);
  const [realtimeNewChatCount, setRealtimeNewChatCount] = useState(0);

  const loadData = async () => {
    setLoading(true);
    try {
      const profile = await shopService.getMyProfile();
      if (profile) {
        setCurrentShop(profile);
      }
      const activeId = profile?.id || user?.shopId || 1;

      // Chỉ tải đơn hàng và danh mục cho màn hình mặc định ban đầu
      const [ordersData, categoriesData] = await Promise.all([
        shopService.getShopOrders(activeId),
        bookService.getCategories(),
      ]);
      setOrders(ordersData);
      setCategories(categoriesData);
      if (categoriesData.length > 0 && !categoryId) {
        setCategoryId(categoriesData[0].id);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user?.id]);

  // Lazy-load dữ liệu khi người dùng chuyển Tab
  useEffect(() => {
    const activeId = currentShop?.id || user?.shopId || 1;
    if (tab === "products" && !productsLoaded) {
      setTabLoading(true);
      shopService.getShopProducts(activeId)
        .then((data) => {
          setProducts(data);
          setProductsLoaded(true);
        })
        .finally(() => setTabLoading(false));
    } else if (tab === "feedbacks" && !feedbacksLoaded) {
      setTabLoading(true);
      shopService.getShopFeedbacks(activeId)
        .then((data) => {
          setFeedbacks(data);
          setFeedbacksLoaded(true);
        })
        .finally(() => setTabLoading(false));
    } else if (tab === "chat") {
      setRealtimeNewChatCount(0);
      if (!chatsLoaded) {
        setTabLoading(true);
        chatService.getShopConversations(activeId)
          .then((data) => {
            setChatThreads(data);
            setChatsLoaded(true);
            if (data.length > 0 && !selectedThread) {
              setSelectedThread(data[0]);
            }
          })
          .finally(() => setTabLoading(false));
      }
    }
  }, [tab, currentShop?.id, user?.shopId, productsLoaded, feedbacksLoaded, chatsLoaded]);

  // Khởi tạo kết nối SignalR cho Shop Dashboard
  useEffect(() => {
    let isMounted = true;

    signalRService.startConnection().then((conn) => {
      if (conn && isMounted) {
        setIsRealTimeChatConnected(true);
      }
    });

    const unsubscribe = signalRService.onReceiveMessage((incomingMsg: any) => {
      if (!isMounted) return;

      const isFromCustomer = incomingMsg.senderId !== String(shopId);

      // Nếu đang không ở tab chat, tăng badge tin nhắn mới realtime
      if (tab !== "chat" && isFromCustomer) {
        setRealtimeNewChatCount((c) => c + 1);
      }

      const formatted: ChatMessage = {
        id: incomingMsg.messageId || incomingMsg.id || Date.now(),
        senderId: incomingMsg.senderId,
        receiverId: incomingMsg.receiverId,
        shopId: incomingMsg.shopId || shopId,
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
        isFromCustomer,
        senderName: incomingMsg.senderName,
        imageUrl: incomingMsg.imageUrl,
      };

      // Cập nhật tin nhắn trong khung chat đang mở
      setThreadMessages((prev) => {
        if (prev.some((m) => m.id === formatted.id)) return prev;
        return [...prev, formatted];
      });

      // Cập nhật danh sách hội thoại
      setChatThreads((prev) =>
        prev.map((t) => {
          if (t.chatId === incomingMsg.chatId || String(t.userId) === String(incomingMsg.senderId)) {
            return {
              ...t,
              lastMessage: formatted.text,
              updatedAt: "Vừa xong",
              unreadCount: t.chatId === selectedThread?.chatId ? 0 : t.unreadCount + 1,
            };
          }
          return t;
        })
      );
    });

    const handleLocalUpdate = () => {
      chatService.getShopConversations(shopId).then(setChatThreads);
      if (selectedThread) {
        chatService
          .getMessages({ chatId: selectedThread.chatId, shopId })
          .then((res) => setThreadMessages(res.messages));
      }
    };

    window.addEventListener("bookverse_chat_updated", handleLocalUpdate);

    return () => {
      isMounted = false;
      unsubscribe();
      window.removeEventListener("bookverse_chat_updated", handleLocalUpdate);
    };
  }, [shopId, selectedThread?.chatId, tab]);

  // Khi chọn một khách hàng từ danh sách hội thoại
  useEffect(() => {
    if (selectedThread) {
      chatService
        .getMessages({ chatId: selectedThread.chatId, shopId })
        .then((res) => {
          setThreadMessages(res.messages);
        });

      signalRService.joinChatRoom(selectedThread.chatId);

      // Đánh dấu đã đọc
      setChatThreads((prev) =>
        prev.map((t) =>
          t.chatId === selectedThread.chatId ? { ...t, unreadCount: 0 } : t
        )
      );
    }
  }, [selectedThread?.chatId, shopId]);

  useEffect(() => {
    chatMessagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [threadMessages]);

  useEffect(() => {
    if (tab === "chat") {
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    };
  }, [tab]);

    // Lưu ghi chú nội bộ của Shop về khách hàng
  const handleSaveCustomerNote = () => {
    if (!selectedThread) return;
    setIsSavingNote(true);
    const updated = { ...customerNotes, [String(selectedThread.userId)]: activeNoteText.trim() };
    setCustomerNotes(updated);
    try {
      localStorage.setItem("bookverse_shop_customer_notes", JSON.stringify(updated));
    } catch (e) {
      console.warn("Error saving customer note:", e);
    }
    setTimeout(() => setIsSavingNote(false), 500);
  };

  // Gửi thẻ sản phẩm trực tiếp vào khung chat
  const handleSendProductCard = async (book: Book) => {
    if (!selectedThread || isSendingShopReply) return;
    setIsSendingShopReply(true);
    try {
      const productCardText = formatProductCardText(book);
      const res = await chatService.sendMessage({
        chatId: isValidGuid(selectedThread.chatId) ? selectedThread.chatId : undefined,
        senderId: shopId,
        receiverId: selectedThread.userId,
        shopId,
        text: productCardText,
        imageUrl: book.imageUrl,
        isFromCustomer: false,
        senderName: shopName,
        messageType: "product_card",
        productData: {
          id: book.id,
          title: book.title,
          price: book.price,
          originalPrice: book.originalPrice,
          imageUrl: book.imageUrl,
          stock: book.stock,
        },
      });
      setThreadMessages((prev) => cleanAndDeduplicateMessages([...prev, res.message]));
      setShowProductPickerModal(false);
    } catch (err) {
      console.warn("Send product card error:", err);
    } finally {
      setIsSendingShopReply(false);
    }
  };

  // Gửi thẻ đơn hàng vào chat để hai bên cùng đối soát
  const handleSendOrderCard = async (ord: Order) => {
    if (!selectedThread || isSendingShopReply) return;
    setIsSendingShopReply(true);
    try {
      const res = await chatService.sendMessage({
        chatId: isValidGuid(selectedThread.chatId) ? selectedThread.chatId : undefined,
        senderId: shopId,
        receiverId: selectedThread.userId,
        shopId,
        text: `Thông tin đơn hàng #${formatShortOrderId(ord.id)} của bạn`,
        isFromCustomer: false,
        senderName: shopName,
        messageType: "order_card",
        orderData: {
          orderId: ord.id,
          orderStatus: ord.orderStatus,
          totalAmount: ord.totalAmount,
          itemCount: ord.items?.length || 1,
        },
      });
      setThreadMessages((prev) => cleanAndDeduplicateMessages([...prev, res.message]));
    } catch (err) {
      console.warn("Send order card error:", err);
    } finally {
      setIsSendingShopReply(false);
    }
  };

  // Tặng voucher giảm giá vào chat cho khách chốt đơn
  const handleSendVoucher = async (voucher: ShopVoucher) => {
    if (!selectedThread || isSendingShopReply) return;
    setIsSendingShopReply(true);
    try {
      const res = await chatService.sendMessage({
        chatId: isValidGuid(selectedThread.chatId) ? selectedThread.chatId : undefined,
        senderId: shopId,
        receiverId: selectedThread.userId,
        shopId,
        text: `[VOUCHER:${voucher.code}:${voucher.discount}:${voucher.minSpend}:${voucher.label}]`,
        isFromCustomer: false,
        senderName: shopName,
        messageType: "voucher_card",
        voucherData: {
          code: voucher.code,
          discountAmount: voucher.discount,
          minSpend: voucher.minSpend,
        },
      });
      setThreadMessages((prev) => cleanAndDeduplicateMessages([...prev, res.message]));
      window.dispatchEvent(new Event("bookverse_chat_updated"));
    } catch (err) {
      console.warn("Send voucher error:", err);
    } finally {
      setIsSendingShopReply(false);
    }
  };

  // Tải lên và gửi ảnh chụp thật của sách cho khách
  const handleUploadChatImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedThread || isSendingShopReply) return;
    setIsUploadingChatImage(true);
    setIsSendingShopReply(true);
    try {
      // 1. Upload ảnh và trích xuất đúng chuỗi URL string
      const uploadRes = await uploadService.uploadImage(file);
      const imageUrlString = uploadRes?.url || "";

      if (!imageUrlString) {
        throw new Error("Không nhận được link ảnh từ hệ thống tải tệp.");
      }

      const res = await chatService.sendMessage({
        chatId: isValidGuid(selectedThread.chatId) ? selectedThread.chatId : undefined,
        senderId: shopId,
        receiverId: selectedThread.userId,
        shopId,
        text: "Shop gửi bạn ảnh chụp thực tế của sách",
        isFromCustomer: false,
        senderName: shopName,
        imageUrl: imageUrlString,
        messageType: "image",
      });
      const safeMsg = {
        ...res.message,
        text: res.message.text || "Shop gửi bạn ảnh chụp thực tế của sách",
      };
      setThreadMessages((prev) => cleanAndDeduplicateMessages([...prev, safeMsg]));
      window.dispatchEvent(new Event("bookverse_chat_updated"));
    } catch (err) {
      console.warn("Upload chat image error:", err);
    } finally {
      setIsUploadingChatImage(false);
      setIsSendingShopReply(false);
      if (chatFileInputRef.current) chatFileInputRef.current.value = "";
    }
  };

  const handleSelectThread = (t: ChatThread) => {
    if (selectedThread?.chatId) {
      signalRService.leaveChatRoom(selectedThread.chatId);
    }
    setSelectedThread(t);
    setActiveNoteText(customerNotes[String(t.userId)] || "");
    setMobileChatView("chat");
  };

  const handleSendShopReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopReplyInput.trim() || !selectedThread || isSendingShopReply) return;

    const textToSend = shopReplyInput.trim();
    setShopReplyInput("");
    setIsSendingShopReply(true);

    try {
      const res = await chatService.sendMessage({
        chatId: isValidGuid(selectedThread.chatId) ? selectedThread.chatId : undefined,
        senderId: shopId,
        receiverId: selectedThread.userId,
        shopId,
        text: textToSend,
        isFromCustomer: false,
        senderName: shopName,
      });

      // Khử trùng lặp tin nhắn trên giao diện
      setThreadMessages((prev) => {
        const isDuplicate = prev.some(
          (m) =>
            m.id === res.message.id ||
            (m.text === res.message.text &&
              String(m.senderId) === String(res.message.senderId) &&
              Math.abs(Number(m.id) - Number(res.message.id)) < 3000)
        );
        if (isDuplicate) return prev;
        return [...prev, res.message];
      });

      setChatThreads((prev) =>
        prev.map((t) =>
          t.chatId === selectedThread.chatId
            ? { ...t, lastMessage: textToSend, updatedAt: "Vừa xong" }
            : t
        )
      );
      window.dispatchEvent(new Event("bookverse_chat_updated"));
    } catch (err) {
      console.warn("Error sending shop reply:", err);
    } finally {
      setIsSendingShopReply(false);
    }
  };

  const needsReplyCount = chatThreads.filter((t) => t.needsReply || (t.unreadCount || 0) > 0).length;
  const totalUnreadChats =
    chatThreads.reduce((s, t) => s + (t.unreadCount || 0), 0) + realtimeNewChatCount;

  const handleUpdateStatus = async (orderId: number, nextStatus: OrderStatus) => {
    await shopService.updateOrderStatus(orderId, nextStatus);
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, orderStatus: nextStatus } : o))
    );
  };

  const handleOpenAddModal = () => {
    setEditingBookId(null);
    setTitle("");
    setAuthor("");
    setPublisher("NXB Trẻ");
    setPublishedYear(String(new Date().getFullYear()));
    setPrice("95000");
    setStock("50");
    setDesc("");
    setIsbn("");
    setCategoryId(categories[0]?.id || "11111111-0000-0000-0000-000000000001");
    setColor1("#1d4ed8");
    setColor2("#3b82f6");
    setImageUrl("");
    setBookImages([]);
    setUploadError(null);
    setFormError(null);
    setShowProductModal(true);
  };

  const handleOpenEditModal = (book: Book) => {
    setEditingBookId(book.id);
    setTitle(book.title);
    setAuthor(book.author);
    setPublisher(book.publisher);
    setPublishedYear(String(book.publishedYear || new Date().getFullYear()));
    setPrice(String(book.price));
    setStock(String(book.stock));
    setDesc(book.description);
    setIsbn(book.isbn || "");
    setCategoryId(book.categoryId || categories[0]?.id || "11111111-0000-0000-0000-000000000001");
    setColor1(book.coverColor);
    setColor2(book.coverColor2);
    setImageUrl(book.imageUrl || "");

    // Đổ danh sách hình ảnh đã có vào modal
    if (book.images && book.images.length > 0) {
      setBookImages(
        book.images.map((img, idx) => ({
          url: img.imageUrl,
          publicId: img.publicId,
          isCover: img.isCover ?? (img.imageUrl === book.imageUrl || idx === 0),
          displayOrder: img.displayOrder ?? idx,
        }))
      );
    } else if (book.imageUrl) {
      setBookImages([
        {
          url: book.imageUrl,
          isCover: true,
          displayOrder: 0,
        },
      ]);
    } else {
      setBookImages([]);
    }

    setUploadError(null);
    setFormError(null);
    setShowProductModal(true);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileList = Array.from(files);
    setIsUploadingImage(true);
    setUploadError(null);

    try {
      const uploaded = await uploadService.uploadMultipleImages(fileList, "bookverse/books");
      setBookImages((prev) => {
        const hasCover = prev.some((img) => img.isCover);
        const newItems = uploaded.map((item, idx) => ({
          url: item.url,
          publicId: item.publicId,
          isCover: !hasCover && idx === 0,
          displayOrder: prev.length + idx,
        }));
        const combined = [...prev, ...newItems];
        const cover = combined.find((img) => img.isCover) || combined[0];
        if (cover) {
          setImageUrl(cover.url);
        }
        return combined;
      });
    } catch (err: any) {
      setUploadError(err.message || "Tải danh sách ảnh lên thất bại. Vui lòng thử lại.");
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleSetCoverImage = (index: number) => {
    setBookImages((prev) => {
      const updated = prev.map((img, i) => ({
        ...img,
        isCover: i === index,
      }));
      if (updated[index]) {
        setImageUrl(updated[index].url);
      }
      return updated;
    });
  };

  const handleRemoveImage = (index: number) => {
    setBookImages((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      if (updated.length === 0) {
        setImageUrl("");
        return [];
      }
      const hasCover = updated.some((img) => img.isCover);
      if (!hasCover && updated.length > 0) {
        updated[0].isCover = true;
      }
      const cover = updated.find((img) => img.isCover) || updated[0];
      setImageUrl(cover ? cover.url : "");
      return updated;
    });
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !author.trim()) {
      setFormError("Vui lòng điền đầy đủ Tựa đề sách và Tác giả.");
      return;
    }

    const selectedCategoryGuid = categoryId || categories[0]?.id || "11111111-0000-0000-0000-000000000001";
    const primaryCoverUrl =
      bookImages.find((img) => img.isCover)?.url ||
      bookImages[0]?.url ||
      imageUrl.trim() ||
      undefined;

    const formattedImages: BookImageDto[] = bookImages.map((img, idx) => ({
      imageUrl: img.url,
      publicId: img.publicId,
      isCover: img.isCover,
      displayOrder: idx,
    }));

    setIsSubmitting(true);
    setFormError(null);

    try {
      if (editingBookId) {
        const updated = await shopService.updateProduct(editingBookId, {
          title,
          author,
          publisher,
          publishedYear: Number(publishedYear) || new Date().getFullYear(),
          price: Number(price) || 0,
          stock: Number(stock) || 0,
          categoryId: selectedCategoryGuid,
          description: desc,
          isbn,
          coverColor: color1,
          coverColor2: color2,
          imageUrl: primaryCoverUrl,
          images: formattedImages.length > 0 ? formattedImages : undefined,
          imageUrls: formattedImages.length > 0 ? formattedImages.map((i) => i.imageUrl) : undefined,
        });
        setProducts((prev) => prev.map((b) => (b.id === editingBookId ? updated : b)));
      } else {
        const created = await shopService.addProduct({
          shopId,
          shopName,
          categoryId: selectedCategoryGuid,
          title,
          author,
          publisher,
          publishedYear: Number(publishedYear) || new Date().getFullYear(),
          price: Number(price) || 0,
          stock: Number(stock) || 0,
          rating: 5.0,
          reviewCount: 0,
          description: desc || "Tác phẩm mới cập nhật tại nhà sách.",
          coverColor: color1,
          coverColor2: color2,
          imageUrl: primaryCoverUrl,
          images: formattedImages.length > 0 ? formattedImages : undefined,
          imageUrls: formattedImages.length > 0 ? formattedImages.map((i) => i.imageUrl) : undefined,
          status: "ACTIVE",
          isbn,
        });
        setProducts((prev) => [created, ...prev]);
      }

      setShowProductModal(false);
    } catch (err: any) {
      console.error("Lỗi khi lưu sách:", err);
      setFormError(err.message || "Không thể lưu thông tin sách. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProduct = async (id: string | number) => {
    if (confirm("Bạn có chắc chắn muốn ẩn đầu sách này khỏi gian hàng?")) {
      try {
        await shopService.deleteProduct(id);
        setProducts((prev) =>
          prev.map((b) => (b.id === id ? { ...b, status: "HIDDEN" } : b))
        );
      } catch (err: any) {
        console.warn("Lỗi khi ẩn sách:", err);
        const errMsg = err?.message || "";
        if (
          errMsg.includes("không tìm thấy") ||
          errMsg.includes("404") ||
          errMsg.includes("not found") ||
          errMsg.includes("quyền")
        ) {
          setProducts((prev) => prev.filter((b) => b.id !== id));
          alert("Đã gỡ sách khỏi danh sách hiển thị gian hàng.");
        } else {
          alert(errMsg || "Không thể ẩn sách khỏi gian hàng. Vui lòng thử lại.");
        }
      }
    }
  };

  const handleUnhideProduct = async (book: Book) => {
    try {
      await shopService.updateProduct(book.id, {
        ...book,
        status: "ACTIVE",
      });
      setProducts((prev) =>
        prev.map((b) => (b.id === book.id ? { ...b, status: "ACTIVE" } : b))
      );
      alert(`Đã mở bán lại cuốn sách "${book.title}" thành công!`);
    } catch (err: any) {
      console.error("Lỗi khi mở bán lại sách:", err);
      alert(err.message || "Không thể mở bán lại sách. Vui lòng thử lại.");
    }
  };

  const handleSendReply = async (orderId: number) => {
    const text = replyTextMap[orderId];
    if (!text?.trim()) return;
    setSubmittingReply(orderId);
    try {
      await shopService.replyFeedback(orderId, text.trim());
      setFeedbacks((prev) =>
        prev.map((f) =>
          f.orderId === orderId
            ? {
              ...f,
              feedback: {
                ...f.feedback,
                shopReply: text.trim(),
                shopRepliedAt: new Date().toISOString().split("T")[0],
              },
            }
            : f
        )
      );
      setReplyTextMap((prev) => ({ ...prev, [orderId]: "" }));
    } finally {
      setSubmittingReply(null);
    }
  };

  const activeProducts = products.filter((p) => p.status === "ACTIVE");
  const outOfStockProducts = products.filter((p) => p.status === "OUT_OF_STOCK" || p.stock === 0);
  const hiddenProducts = products.filter((p) => p.status === "HIDDEN");

  const filteredProducts = products.filter((p) => {
    const matchSearch = productSearch
      ? (p.title || "").toLowerCase().includes(productSearch.toLowerCase()) ||
        (p.author || "").toLowerCase().includes(productSearch.toLowerCase())
      : true;
    if (!matchSearch) return false;

    if (productStatusFilter === "ACTIVE") return p.status === "ACTIVE";
    if (productStatusFilter === "OUT_OF_STOCK") return p.status === "OUT_OF_STOCK" || p.stock === 0;
    if (productStatusFilter === "HIDDEN") return p.status === "HIDDEN";
    return true;
  });

  // Bộ câu trả lời mẫu chuẩn Shopee Seller
  const QUICK_REPLIES = [
    { label: "📦 Còn hàng", text: "Dạ chào bạn, cuốn sách này bên shop hiện vẫn còn hàng và là bản mới 100% chính hãng ạ!" },
    { label: "🚚 Giao nhanh", text: "Dạ shop sẽ bọc chống sốc cẩn thận và gửi shipper ngay hôm nay bạn nhé!" },
    { label: "🎁 Quà tặng", text: "Dạ sách có kèm bookmark chính hãng và màng co bảo vệ của NXB bạn nhé!" },
    { label: "💬 Hỗ trợ thêm", text: "Dạ bạn cần shop tư vấn thêm về nội dung hay hình ảnh thật của cuốn sách này không ạ?" },
    { label: "🏷️ Voucher 10k", text: "Dạ shop gửi tặng bạn voucher giảm 10.000đ khi đặt mua cuốn sách này nhé!" },
  ];

  // Danh sách đơn hàng của khách hàng đang chat
  const selectedCustomerOrders = useMemo(() => {
    if (!selectedThread) return [];
    const targetName = (selectedThread.userName || "").toLowerCase().trim();
    const targetUserId = String(selectedThread.userId);
    return orders.filter(
      (o) =>
        (o.customerName && o.customerName.toLowerCase().trim() === targetName) ||
        (o.customerId && String(o.customerId) === targetUserId)
    );
  }, [selectedThread, orders]);

  // Cuốn sách mà khách đang hỏi (dựa trên tin nhắn hoặc sản phẩm của shop)
  const relatedBook = useMemo(() => {
    if (!selectedThread || products.length === 0) return null;
    const allText = threadMessages
      .map((m) => (m.text || "").toLowerCase())
      .join(" ");
    const matched = products.find(
      (b) => b.title && allText.includes(b.title.toLowerCase())
    );
    return matched || products[0] || null;
  }, [selectedThread, products, threadMessages]);

  const filteredChatThreads = chatThreads.filter((t) => {
    const matchSearch = threadSearch
      ? (t.userName || "").toLowerCase().includes(threadSearch.toLowerCase()) ||
        (t.lastMessage && t.lastMessage.toLowerCase().includes(threadSearch.toLowerCase()))
      : true;

    if (!matchSearch) return false;

    if (chatFilter === "unread") {
      return (t.unreadCount || 0) > 0;
    }
    if (chatFilter === "needs_reply") {
      return t.needsReply === true || (t.unreadCount || 0) > 0;
    }
    if (chatFilter === "has_order") {
      const targetName = (t.userName || "").toLowerCase().trim();
      const targetUserId = String(t.userId);
      return orders.some(
        (o) =>
          (o.customerName && o.customerName.toLowerCase().trim() === targetName) ||
          (o.customerId && String(o.customerId) === targetUserId)
      );
    }
    return true;
  });

  const revenue = orders
    .filter((o) => o.orderStatus === "DELIVERED")
    .reduce((s, o) => s + o.totalAmount, 0);
  const pendingCount = orders.filter((o) => o.orderStatus === "PENDING").length;

  const formatChatTime = (dateStr?: string): string => {
    if (!dateStr) return "";
    if (dateStr === "Vừa xong") return dateStr;
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const now = new Date();
      const isToday = d.toDateString() === now.toDateString();
      if (isToday) {
        return d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
      }
      return `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}`;
    } catch {
      return dateStr;
    }
  };

  const formatShortOrderId = (id: string | number): string => {
    const str = String(id);
    if (str.length <= 10) return `#${str}`;
    return `#${str.slice(-8).toUpperCase()}`;
  };

  // Helper render nội dung Hồ sơ & Đơn hàng khách hàng (dùng chung cho cả Desktop Panel & Mobile Drawer)
  const renderCustomerProfileContent = (onClose?: () => void) => {
    if (!selectedThread) return null;

    return (
      <div className="flex flex-col h-full bg-slate-50/50">
        {/* Header Cột 3 */}
        <div className="p-3.5 border-b border-slate-200 bg-white flex items-center justify-between shrink-0 shadow-2xs">
          <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5 uppercase tracking-wider">
            <ShoppingBag size={14} className="text-emerald-600" />
            Hồ sơ & Đơn hàng của khách
          </h4>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              title="Đóng bảng thông tin"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Vùng nội dung Cột 3 - Cuộn độc lập */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* 1. Thẻ thông tin khách hàng chuyên sâu */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs text-center">
            <div className="relative w-14 h-14 mx-auto mb-2">
              {selectedThread.userAvatar ? (
                <img
                  src={selectedThread.userAvatar}
                  alt={selectedThread.userName}
                  className="w-14 h-14 rounded-full object-cover border-2 border-emerald-500 shadow-sm"
                />
              ) : (
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-sm uppercase">
                  {(selectedThread.userName?.trim() || "K").charAt(0) || "K"}
                </div>
              )}
              <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white" />
            </div>
            <h4 className="font-bold text-slate-800 text-sm">
              {selectedThread.userName?.trim() || "Khách hàng"}
            </h4>
            <div className="flex items-center justify-center gap-1 mt-1">
              <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                Khách hàng BookVerse
              </span>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                ⭐ Tỷ lệ nhận: 100%
              </span>
            </div>

            {/* Địa chỉ giao hàng mặc định */}
            {selectedCustomerOrders[0]?.shippingAddress && (
              <p className="text-[10px] text-slate-500 mt-2 text-left bg-slate-50 p-2 rounded-lg border border-slate-100 truncate">
                📍 Giao đến: {selectedCustomerOrders[0].shippingAddress}
              </p>
            )}

            <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-100 text-left">
              <div>
                <span className="text-[10px] text-slate-400 block">Đơn tại Shop</span>
                <span className="font-extrabold text-slate-700 text-xs">
                  {selectedCustomerOrders.length} đơn
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Tổng chi tiêu</span>
                <span className="font-extrabold text-emerald-700 text-xs">
                  {fmt(selectedCustomerOrders.reduce((s, o) => s + o.totalAmount, 0))}
                </span>
              </div>
            </div>
          </div>

          {/* 2. Kho Voucher khuyến mãi của Shop (Voucher Center) */}
          <div className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <h5 className="font-bold text-slate-700 text-xs flex items-center gap-1">
                <Ticket size={13} className="text-amber-600" />
                Kho Voucher của Shop
              </h5>
            </div>
            <div className="space-y-2">
              {SHOP_VOUCHERS.map((v) => (
                <div
                  key={v.code}
                  className="flex items-center justify-between p-2 rounded-xl bg-amber-50/60 border border-amber-200/80 text-xs"
                >
                  <div className="min-w-0">
                    <span className="font-bold text-amber-900 font-mono block">
                      {v.code}
                    </span>
                    <span className="text-[10px] text-amber-700 block">
                      {v.label} (đơn từ {fmt(v.minSpend)})
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      handleSendVoucher(v);
                      if (!isDesktop) {
                        setMobileProfileOpen(false);
                      }
                    }}
                    className="px-2 py-1 bg-amber-600 text-white rounded-lg text-[10px] font-bold hover:bg-amber-700 transition-colors shrink-0 shadow-2xs cursor-pointer"
                  >
                    Tặng ngay
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* 3. Danh sách đơn hàng gần đây của khách tại Shop kèm nút Share */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h5 className="font-bold text-slate-700 text-xs flex items-center gap-1">
                <Package size={13} className="text-slate-500" />
                Đơn hàng của khách ({selectedCustomerOrders.length})
              </h5>
            </div>

            {selectedCustomerOrders.length === 0 ? (
              <div className="bg-white rounded-2xl p-4 border border-dashed border-slate-200 text-center text-xs text-slate-400">
                <ShoppingBag size={24} className="mx-auto text-slate-300 mb-1" />
                Khách hàng chưa có đơn hàng nào tại Shop.
                <p className="text-[11px] text-emerald-600 font-medium mt-1">
                  Hãy tặng voucher để kích thích chốt đơn đầu tiên!
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {selectedCustomerOrders.map((ord) => {
                  const statusBadge = orderStatusInfo[ord.orderStatus] || {
                    label: ord.orderStatus,
                    color: "bg-slate-100 text-slate-700 border-slate-200",
                  };

                  return (
                    <div
                      key={ord.id}
                      className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-2xs hover:border-emerald-300 transition-all"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span
                          className="font-extrabold text-xs text-slate-800 font-mono tracking-tight"
                          title={`Mã đơn đầy đủ: #${ord.id}`}
                        >
                          {formatShortOrderId(ord.id)}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusBadge.color}`}
                        >
                          {statusBadge.label}
                        </span>
                      </div>

                      {/* Danh sách sách trong đơn */}
                      <div className="space-y-1.5 py-1.5 border-y border-slate-100">
                        {ord.items.map((item: any, idx) => {
                          const bookTitle = item.book?.title || item.bookTitle || item.title || "Tựa sách đặt mua";
                          return (
                            <div
                              key={idx}
                              className="flex items-center justify-between text-[11px] gap-2"
                            >
                              <span className="truncate text-slate-700 font-medium flex-1" title={bookTitle}>
                                • {bookTitle}
                              </span>
                              <span className="text-slate-500 shrink-0 font-mono font-semibold">
                                x{item.quantity}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      <div className="flex items-center justify-between mt-2 pt-1 text-xs">
                        <span className="font-extrabold text-emerald-700">
                          {fmt(ord.totalAmount)}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            handleSendOrderCard(ord);
                            if (!isDesktop) {
                              setMobileProfileOpen(false);
                            }
                          }}
                          className="px-2 py-0.5 text-[10px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-600 hover:text-white transition-all shadow-2xs cursor-pointer flex items-center gap-1"
                          title="Gửi thông tin đơn này vào chat"
                        >
                          <Share2 size={11} /> Gửi vào chat
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 4. Ghi chú nội bộ của Shop về khách hàng (Shop Notes) */}
          <div className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-2xs">
            <h5 className="font-bold text-slate-700 text-xs flex items-center gap-1 mb-1.5">
              <FileText size={13} className="text-slate-500" />
              Ghi chú nội bộ (Chỉ Shop nhìn thấy)
            </h5>
            <textarea
              value={activeNoteText}
              onChange={(e) => setActiveNoteText(e.target.value)}
              placeholder="Ví dụ: Khách thích bọc bìa kỹ, khách hay sưu tầm sách cổ điển..."
              rows={2}
              className="w-full text-xs p-2 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:border-emerald-500"
            />
            <div className="flex justify-end mt-1.5">
              <button
                type="button"
                disabled={isSavingNote}
                onClick={handleSaveCustomerNote}
                className="px-2.5 py-1 bg-slate-800 text-white rounded-lg text-[10px] font-bold hover:bg-slate-900 transition-colors cursor-pointer shadow-2xs"
              >
                {isSavingNote ? "Đang lưu..." : "Lưu ghi chú"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`${tab === "chat" ? "w-full max-w-[1700px] h-[calc(100dvh-64px)] flex flex-col overflow-hidden px-2 sm:px-4 lg:px-6 pt-1 sm:pt-2 pb-1 sm:pb-2" : "max-w-5xl mx-auto px-4 sm:px-6 py-8"} mx-auto transition-all duration-200`}>
      {/* Header */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 ${tab === "chat" ? "mb-1.5 sm:mb-2 shrink-0" : "mb-8"}`}>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-lg sm:text-2xl font-extrabold text-slate-800 tracking-tight truncate">
              {shopName}
            </h1>
            <span className="text-[10px] sm:text-xs font-semibold px-2 sm:px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 shrink-0">
              Đối tác xác thực
            </span>
          </div>
          <p className="text-slate-500 text-[11px] sm:text-sm mt-0.5 truncate">
            Cổng quản trị nhà cung cấp sách BookVerse
          </p>
        </div>

        {/* Thanh tab trượt ngang mềm mại trên Mobile & Desktop */}
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto scrollbar-none pb-0.5 shrink-0 max-w-full">
          <Btn
            onClick={() => setTab("orders")}
            variant={tab === "orders" ? "primary" : "outline"}
            size="sm"
            color="#047857"
            className="shrink-0 text-xs py-1.5"
          >
            <Package size={14} /> Đơn hàng ({orders.length})
          </Btn>
          <Btn
            onClick={() => setTab("products")}
            variant={tab === "products" ? "primary" : "outline"}
            size="sm"
            color="#047857"
            className="shrink-0 text-xs py-1.5"
          >
            <BookOpen size={14} /> Kho sách ({activeProducts.length > 0 ? activeProducts.length : (currentShop?.bookCount ?? 0)})
          </Btn>
          <Btn
            onClick={() => setTab("feedbacks")}
            variant={tab === "feedbacks" ? "primary" : "outline"}
            size="sm"
            color="#047857"
            className="shrink-0 text-xs py-1.5"
          >
            <MessageSquare size={14} /> Đánh giá ({feedbacks.length > 0 ? feedbacks.length : (currentShop?.reviewCount ?? 0)})
          </Btn>
          <Btn
            onClick={() => setTab("chat")}
            variant={tab === "chat" ? "primary" : "outline"}
            size="sm"
            color="#047857"
            className="shrink-0 relative text-xs py-1.5"
          >
            <MessageSquare size={14} /> Hộp thư tư vấn
            {totalUnreadChats > 0 && (
              <span className="ml-1.5 px-1.5 py-0.2 rounded-full bg-red-500 text-white text-[10px] font-bold animate-pulse">
                {totalUnreadChats}
              </span>
            )}
          </Btn>
        </div>
      </div>

      {/* Stats Summary */}
      {tab !== "chat" && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Doanh thu thực nhận"
          value={fmt(revenue)}
          sub="Đã giao thành công"
          icon={<DollarSign size={22} />}
          color="#047857"
        />
        <StatCard
          label="Tổng đơn tiếp nhận"
          value={String(orders.length)}
          sub="Tất cả thời gian"
          icon={<ShoppingBag size={22} />}
          color="#1d4ed8"
        />
        <StatCard
          label="Đơn chờ xác nhận"
          value={String(pendingCount)}
          sub="Cần xử lý ngay"
          icon={<Clock size={22} />}
          color="#b45309"
        />
        <StatCard
          label="Tổng đầu sách"
          value={String(activeProducts.length > 0 ? activeProducts.length : (currentShop?.bookCount ?? 0))}
          sub="Đang kinh doanh"
          icon={<BookOpen size={22} />}
          color="#6d28d9"
        />
      </div>
      )}

      {/* TAB 1: ORDERS */}
      {tab === "orders" && (
        <Card className="overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-bold text-slate-800 text-base">
              Danh sách đơn hàng cần xử lý
            </h2>
            <Badge
              label={`${pendingCount} đơn chờ xử lý`}
              color="#b45309"
              bg="#fef3c7"
            />
          </div>

          <div className="divide-y divide-slate-100">
            {orders.length === 0 ? (
              <p className="text-center text-slate-400 py-12 text-sm">
                Chưa có đơn hàng nào.
              </p>
            ) : (
              orders.map((order) => {
                const s = orderStatusInfo(order.orderStatus);
                return (
                  <div
                    key={order.id}
                    className="p-6 hover:bg-slate-50/60 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-xs font-bold text-slate-400">
                            #{order.id}
                          </span>
                          <span className="text-xs text-slate-500">
                            {order.createdAt}
                          </span>
                        </div>
                        <p className="font-bold text-slate-800 text-base">
                          {order.customerName}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {order.shippingAddress} • SĐT: {order.customerPhone}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <Badge label={s.label} color={s.color} bg={s.bg} />
                        <span className="font-extrabold text-slate-800 text-base">
                          {fmt(order.totalAmount)}
                        </span>
                      </div>
                    </div>

                    <div className="bg-slate-50 rounded-xl p-3.5 mb-4 text-xs text-slate-600 space-y-1.5">
                      {order.items.map((i, idx) => (
                        <div key={idx} className="flex justify-between">
                          <span>
                            {i.book.title} × <strong>{i.quantity}</strong>
                          </span>
                          <span>{fmt(i.unitPrice * i.quantity)}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
                      <span className="text-xs text-slate-400">
                        Thanh toán:{" "}
                        <strong className="text-slate-600">
                          {order.paymentMethod === "ONLINE"
                            ? "Trực tuyến (VNPAY/MoMo)"
                            : "Khi nhận hàng (COD)"}
                        </strong>
                      </span>

                      <div className="flex items-center gap-2">
                        {order.orderStatus === "PENDING" && (
                          <>
                            <Btn
                              size="sm"
                              color="#047857"
                              onClick={() => handleUpdateStatus(order.id, "PROCESSING")}
                            >
                              <Check size={14} /> Xác nhận đóng gói
                            </Btn>
                            <Btn
                              size="sm"
                              variant="outline"
                              color="#dc2626"
                              onClick={() => handleUpdateStatus(order.id, "CANCELLED")}
                            >
                              <X size={14} /> Từ chối
                            </Btn>
                          </>
                        )}

                        {order.orderStatus === "PROCESSING" && (
                          <Btn
                            size="sm"
                            color="#1d4ed8"
                            onClick={() => handleUpdateStatus(order.id, "SHIPPED")}
                          >
                            <Truck size={14} /> Bàn giao shipper GHN
                          </Btn>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>
      )}

      {/* TAB 2: PRODUCTS */}
      {tab === "products" && (
        <Card className="overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-bold text-slate-800 text-base">
                Kho sách của cửa hàng ({filteredProducts.length} tựa sách)
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <input
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                placeholder="Tìm tựa sách, tác giả..."
                className="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 focus:outline-none focus:border-emerald-500"
              />
              <Btn size="sm" color="#047857" onClick={handleOpenAddModal}>
                <Plus size={14} /> Thêm sách mới
              </Btn>
            </div>
          </div>

          {/* Status Filter Bar */}
          <div className="px-6 py-2.5 bg-slate-50/70 border-b border-slate-100 flex items-center gap-2 overflow-x-auto">
            <span className="text-xs font-semibold text-slate-500 mr-1">Bộ lọc:</span>
            <button
              onClick={() => setProductStatusFilter("ACTIVE")}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${productStatusFilter === "ACTIVE"
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                }`}
            >
              Đang kinh doanh ({activeProducts.length})
            </button>
            <button
              onClick={() => setProductStatusFilter("OUT_OF_STOCK")}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${productStatusFilter === "OUT_OF_STOCK"
                ? "bg-amber-600 text-white shadow-xs"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                }`}
            >
              Hết hàng ({outOfStockProducts.length})
            </button>
            <button
              onClick={() => setProductStatusFilter("HIDDEN")}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${productStatusFilter === "HIDDEN"
                ? "bg-slate-700 text-white shadow-xs"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                }`}
            >
              Đã ẩn ({hiddenProducts.length})
            </button>
            <button
              onClick={() => setProductStatusFilter("ALL")}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${productStatusFilter === "ALL"
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                }`}
            >
              Tất cả ({products.length})
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {tabLoading && products.length === 0 ? (
              <div className="text-center py-16 px-4">
                <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-xs text-slate-500 font-medium">Đang tải kho sách của gian hàng...</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-16 px-4">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3 shadow-xs">
                  <BookOpen size={26} />
                </div>
                <h3 className="font-bold text-slate-800 text-sm mb-1">
                  {productSearch
                    ? "Không tìm thấy sách phù hợp"
                    : productStatusFilter === "HIDDEN"
                      ? "Không có cuốn sách nào bị ẩn"
                      : productStatusFilter === "OUT_OF_STOCK"
                        ? "Không có sách nào hết hàng"
                        : "Gian hàng chưa có đầu sách nào trong kho"}
                </h3>
                <p className="text-slate-500 text-xs max-w-sm mx-auto mb-4">
                  {productSearch
                    ? "Vui lòng thử tìm kiếm với từ khóa khác hoặc xóa bộ lọc."
                    : productStatusFilter === "ACTIVE"
                      ? "Đăng bán sản phẩm sách đầu tiên để tiếp cận độc giả trên sàn BookVerse."
                      : "Các đầu sách phù hợp sẽ hiển thị tại đây khi có thay đổi."}
                </p>
                {!productSearch && productStatusFilter === "ACTIVE" && (
                  <Btn size="sm" color="#047857" onClick={handleOpenAddModal} className="mx-auto">
                    <Plus size={14} /> Thêm sách mới ngay
                  </Btn>
                )}
              </div>
            ) : (
              filteredProducts.map((book) => (
                <div
                  key={book.id}
                  className="p-5 flex items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-16 shrink-0 rounded-lg overflow-hidden border border-slate-200 relative">
                      <BookCover book={book} size="sm" />
                      {book.status === "HIDDEN" && (
                        <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center text-white text-[9px] font-bold">
                          ĐÃ ẨN
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-slate-800 text-sm">
                          {book.title}
                        </p>
                        {book.status === "HIDDEN" && (
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-slate-200 text-slate-700">
                            Đã ẩn khỏi sàn
                          </span>
                        )}
                        {book.status === "OUT_OF_STOCK" && (
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-100 text-amber-800">
                            Hết hàng
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Tác giả: {book.author} • NXB: {book.publisher}
                      </p>
                      <div className="flex items-center gap-3 mt-1.5 text-xs">
                        <span className="font-bold text-emerald-700">
                          {fmt(book.price)}
                        </span>
                        <span className="text-slate-400">•</span>
                        <span className="text-slate-600">
                          Tồn kho: <strong>{book.stock} cuốn</strong>
                        </span>
                        <span className="text-slate-400">•</span>
                        <span className="text-amber-600 font-semibold">
                          ⭐ {book.rating} ({book.reviewCount} đánh giá)
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {book.status === "HIDDEN" ? (
                      <button
                        onClick={() => handleUnhideProduct(book)}
                        className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors flex items-center gap-1.5 cursor-pointer border border-emerald-200 shadow-2xs"
                        title="Mở bán lại sách này"
                      >
                        <CheckCircle size={14} /> Mở bán lại
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => handleOpenEditModal(book)}
                          className="p-2 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                          title="Sửa thông tin"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(book.id || (book as any).bookId)}
                          className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                          title="Ẩn sách"
                        >
                          <Trash2 size={16} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      )}

      {/* TAB 3: FEEDBACKS */}
      {tab === "feedbacks" && (
        <Card className="overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="font-bold text-slate-800 text-base">
              Đánh giá từ khách hàng & Phản hồi của shop
            </h2>
          </div>

          <div className="divide-y divide-slate-100 p-6 space-y-4">
            {tabLoading && feedbacks.length === 0 ? (
              <div className="text-center py-12 px-4">
                <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-xs text-slate-500 font-medium">Đang tải danh sách đánh giá...</p>
              </div>
            ) : feedbacks.length === 0 ? (
              <p className="text-center text-slate-400 py-8">
                Chưa có đánh giá nào từ khách hàng.
              </p>
            ) : (
              feedbacks.map((f) => (
                <div
                  key={f.orderId}
                  className="p-4 bg-slate-50 rounded-2xl border border-slate-200"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-xs text-slate-800">
                      {f.feedback.customer || f.feedback.customerName} • Đơn #{f.orderId}
                    </span>
                    <span className="text-xs text-amber-600 font-bold">
                      ⭐ {f.feedback.rating}/5
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 mb-3">"{f.feedback.content}"</p>

                  {f.feedback.shopReply ? (
                    <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                      <div className="flex items-center justify-between text-[11px] text-emerald-800 font-semibold mb-1">
                        <span>Shop đã trả lời:</span>
                        <span className="text-slate-400 font-normal">
                          {f.feedback.shopRepliedAt}
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 italic">
                        "{f.feedback.shopReply}"
                      </p>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 mt-2">
                      <input
                        value={replyTextMap[f.orderId] || ""}
                        onChange={(e) =>
                          setReplyTextMap({
                            ...replyTextMap,
                            [f.orderId]: e.target.value,
                          })
                        }
                        placeholder="Nhập câu trả lời cảm ơn hoặc hỗ trợ khách hàng..."
                        className="flex-1 text-xs border border-slate-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:border-emerald-500"
                      />
                      <Btn
                        size="sm"
                        color="#047857"
                        disabled={submittingReply === f.orderId}
                        onClick={() => handleSendReply(f.orderId)}
                      >
                        <Send size={13} /> Trả lời
                      </Btn>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </Card>
      )}

      {/* TAB 4: REAL-TIME CHAT / HỘP THƯ TƯ VẤN (CHUẨN SHOPEE SELLER WORKSPACE 3 CỘT NÂNG CAO CÓ THỂ KÉO CHUỘT ĐIỀU CHỈNH ĐỘ RỘNG) */}
      {tab === "chat" && (
        <div
          ref={chatContainerRef}
          className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-row flex-1 min-h-0 animate-in fade-in relative"
        >
          {/* ========================================================================= */}
          {/* CỘT 1: DANH SÁCH HỘI THOẠI KHÁCH HÀNG (INBOX LIST)                       */}
          {/* ========================================================================= */}
          <div
            style={{ width: isDesktop ? `${col1Width}px` : "100%" }}
            className={`
              shrink-0 border-r border-slate-200 flex flex-col bg-slate-50/70 h-full overflow-hidden
              ${isDesktop ? "flex" : mobileChatView === "list" ? "w-full flex" : "hidden"}
            `}
          >
            {/* Header Cột 1 */}
            <div className="p-3.5 border-b border-slate-200 bg-white">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                    <MessageSquare size={15} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-xs sm:text-sm">
                      Hộp thư tư vấn
                    </h3>
                    <p className="text-[10px] text-slate-400">
                      {chatThreads.length} khách hàng
                    </p>
                  </div>
                </div>
                <span className="text-[10px] text-emerald-600 flex items-center gap-1 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                  {isRealTimeChatConnected ? (
                    <>
                      <Wifi size={10} className="text-emerald-500" /> Trực tuyến
                    </>
                  ) : (
                    <>
                      <WifiOff size={10} className="text-slate-400" /> Chờ kết nối
                    </>
                  )}
                </span>
              </div>

              {/* Ô tìm kiếm */}
              <div className="relative mb-2">
                <Search
                  size={13}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  value={threadSearch}
                  onChange={(e) => setThreadSearch(e.target.value)}
                  placeholder="Tìm khách hàng hoặc nội dung..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Tabs lọc hội thoại 4 chế độ chuẩn Shopee Seller */}
              <div className="grid grid-cols-4 gap-1 bg-slate-100 p-1 rounded-xl text-[10px] font-semibold text-center">
                <button
                  type="button"
                  onClick={() => setChatFilter("all")}
                  className={`py-1 rounded-lg transition-all cursor-pointer ${
                    chatFilter === "all"
                      ? "bg-white text-slate-800 shadow-2xs font-bold"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  Tất cả
                </button>
                <button
                  type="button"
                  onClick={() => setChatFilter("unread")}
                  className={`py-1 rounded-lg transition-all cursor-pointer relative ${
                    chatFilter === "unread"
                      ? "bg-white text-slate-800 shadow-2xs font-bold"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  Chưa đọc
                  {totalUnreadChats > 0 && (
                    <span className="ml-1 px-1 py-0.2 bg-red-500 text-white rounded-full text-[8px]">
                      {totalUnreadChats}
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setChatFilter("needs_reply")}
                  className={`py-1 rounded-lg transition-all cursor-pointer relative ${
                    chatFilter === "needs_reply"
                      ? "bg-white text-amber-800 shadow-2xs font-bold"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  Chờ trả lời
                  {needsReplyCount > 0 && (
                    <span className="ml-1 px-1 py-0.2 bg-amber-500 text-white rounded-full text-[8px]">
                      {needsReplyCount}
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setChatFilter("has_order")}
                  className={`py-1 rounded-lg transition-all cursor-pointer ${
                    chatFilter === "has_order"
                      ? "bg-white text-slate-800 shadow-2xs font-bold"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  Có đơn
                </button>
              </div>
            </div>

            {/* Danh sách các cuộc chat - Cuộn độc lập */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
              {tabLoading && chatThreads.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  Đang đồng bộ tin nhắn...
                </div>
              ) : filteredChatThreads.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  Không tìm thấy cuộc trò chuyện nào.
                </div>
              ) : (
                filteredChatThreads.map((t) => {
                  const isSelected = selectedThread?.chatId === t.chatId;
                  const displayName = t.userName?.trim() || "Khách hàng";
                  const displayTime = formatChatTime(t.updatedAt);
                  const hasOrder = orders.some(
                    (o) =>
                      (o.customerName && o.customerName.toLowerCase().trim() === displayName.toLowerCase().trim()) ||
                      (o.customerId && String(o.customerId) === String(t.userId))
                  );
                  const isLastMsgFromShop = t.lastSenderId === String(shopId);

                  return (
                    <button
                      key={t.chatId}
                      onClick={() => handleSelectThread(t)}
                      className={`w-full p-3.5 text-left flex items-start gap-3 transition-colors cursor-pointer relative ${
                        isSelected
                          ? "bg-emerald-50/90 border-l-4 border-emerald-600"
                          : "hover:bg-slate-100/70 bg-white"
                      }`}
                    >
                      {/* Avatar Khách (ảnh Google hoặc chữ cái đầu) */}
                      <div className="relative shrink-0">
                        {t.userAvatar ? (
                          <img
                            src={t.userAvatar}
                            alt={displayName}
                            className="w-10 h-10 rounded-full object-cover border border-slate-200 shadow-2xs"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-2xs uppercase">
                            {displayName.charAt(0) || "K"}
                          </div>
                        )}
                        {/* Active online dot */}
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1 gap-1">
                          <div className="flex items-center gap-1.5 min-w-0 flex-1">
                            <p className="font-bold text-slate-800 text-xs truncate">
                              {displayName}
                            </p>
                            {hasOrder && (
                              <span className="text-[9px] bg-amber-50 text-amber-700 px-1.5 py-0.2 rounded-sm border border-amber-200 font-semibold shrink-0">
                                Đơn hàng
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                            {displayTime}
                          </span>
                        </div>

                        <div className="flex items-center justify-between gap-1">
                          <p className={`text-[11px] truncate leading-relaxed flex items-center gap-1 flex-1 ${
                            isSelected ? "text-slate-700 font-medium" : "text-slate-500"
                          }`}>
                            {isLastMsgFromShop && (
                              <CheckCheck size={12} className="text-emerald-600 shrink-0 inline" />
                            )}
                            <span className="truncate">{t.lastMessage || "Khách bắt đầu cuộc trò chuyện"}</span>
                          </p>
                          {t.needsReply && (
                            <span className="text-[8px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded-full font-bold border border-amber-200 shrink-0">
                              Chờ trả lời
                            </span>
                          )}
                        </div>
                      </div>

                      {t.unreadCount > 0 && (
                        <span className="w-4 h-4 rounded-full bg-red-500 text-white text-[9px] flex items-center justify-center font-bold shrink-0 shadow-2xs">
                          {t.unreadCount}
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* THANH KÉO CHUỘT RESIZER 1 (DESKTOP): ĐIỀU CHỈNH ĐỘ RỘNG CỘT 1            */}
          {/* ========================================================================= */}
          {isDesktop && (
            <div
              onMouseDown={(e) => {
                e.preventDefault();
                setIsDraggingCol1(true);
              }}
              className={`hidden lg:flex items-center justify-center w-1.5 hover:w-2.5 hover:bg-emerald-500 active:bg-emerald-600 cursor-col-resize select-none shrink-0 transition-all z-20 group relative ${
                isDraggingCol1 ? "bg-emerald-500 w-2.5 shadow-xs" : "bg-slate-200/80 hover:shadow-xs"
              }`}
              title="Kéo chuột sang trái/phải để điều chỉnh độ rộng danh sách khách hàng"
            >
              <div className="w-0.5 h-7 bg-slate-400 group-hover:bg-white rounded-full transition-colors" />
            </div>
          )}

          {/* ========================================================================= */}
          {/* CỘT 2: KHUNG CHAT CHÍNH (ACTIVE CHAT CANVAS - FLEX-1)                     */}
          {/* ========================================================================= */}
          <div
            className={`
              flex-1 flex flex-col bg-white min-w-0 border-r border-slate-200 h-full overflow-hidden
              ${isDesktop ? "flex" : mobileChatView === "chat" ? "w-full flex" : "hidden"}
            `}
          >
            {selectedThread ? (
              <>
                {/* Header Cột 2 */}
                <div className="px-3 sm:px-5 py-2.5 sm:py-3 border-b border-slate-200 bg-white flex items-center justify-between shadow-2xs gap-2 shrink-0">
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    {/* Nút Back quay lại Danh sách hội thoại trên Mobile / Tablet */}
                    {!isDesktop && (
                      <button
                        type="button"
                        onClick={() => setMobileChatView("list")}
                        className="p-1.5 -ml-1 text-slate-600 hover:text-emerald-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer flex items-center gap-1 shrink-0"
                        title="Quay lại danh sách hội thoại"
                      >
                        <ArrowLeft size={18} />
                        {totalUnreadChats > 0 && (
                          <span className="w-4 h-4 rounded-full bg-red-500 text-white text-[9px] flex items-center justify-center font-bold">
                            {totalUnreadChats}
                          </span>
                        )}
                      </button>
                    )}

                    <div className="relative shrink-0">
                      {selectedThread.userAvatar ? (
                        <img
                          src={selectedThread.userAvatar}
                          alt={selectedThread.userName}
                          className="w-8 sm:w-9 h-8 sm:h-9 rounded-full object-cover border border-slate-200 shadow-2xs"
                        />
                      ) : (
                        <div className="w-8 sm:w-9 h-8 sm:h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-2xs uppercase">
                          {(selectedThread.userName?.trim() || "K").charAt(0) || "K"}
                        </div>
                      )}
                      <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 border border-white" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <h4 className="font-bold text-slate-800 text-xs sm:text-sm truncate">
                          {selectedThread.userName?.trim() || "Khách hàng"}
                        </h4>
                        <span className="text-[9px] sm:text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.2 rounded-full font-medium border border-blue-100 shrink-0">
                          Khách hàng
                        </span>
                      </div>
                      <p className="text-[9px] sm:text-[10px] text-emerald-600 flex items-center gap-1 font-medium mt-0.5 truncate">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                        Đang kết nối trực tiếp
                      </p>
                    </div>
                  </div>

                  {/* Nút Toggle Sidebar Hồ sơ & Đơn hàng (Cột 3) */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        if (isDesktop) {
                          setShowCustomerSidebar(!showCustomerSidebar);
                        } else {
                          setMobileProfileOpen(true);
                        }
                      }}
                      className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs ${
                        (isDesktop ? showCustomerSidebar : mobileProfileOpen)
                          ? "bg-emerald-600 text-white hover:bg-emerald-700"
                          : "bg-slate-100 text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 border border-slate-200"
                      }`}
                      title={
                        isDesktop
                          ? showCustomerSidebar
                            ? "Thu gọn bảng hồ sơ & đơn hàng"
                            : "Mở bảng hồ sơ & đơn hàng của khách"
                          : "Mở xem hồ sơ & đơn hàng của khách"
                      }
                    >
                      <Info size={14} />
                      <span className="hidden sm:inline">
                        {isDesktop
                          ? showCustomerSidebar
                            ? "Đang mở hồ sơ"
                            : "Xem hồ sơ & đơn"
                          : "Xem hồ sơ & đơn"}
                      </span>
                      <span className="sm:hidden">Hồ sơ</span>
                    </button>
                  </div>
                </div>

                {/* Dải thông báo cảnh báo bảo mật giao dịch chuẩn Shopee */}
                <div className="px-4 py-1.5 bg-amber-50/70 border-b border-amber-100 flex items-center gap-2 text-[10px] text-amber-800">
                  <ShieldAlert size={12} className="text-amber-600 shrink-0" />
                  <span className="truncate">
                    BookVerse khuyến cáo không giao dịch, chuyển khoản hoặc chia sẻ số điện thoại cá nhân ngoài sàn để đảm bảo quyền lợi bảo vệ đơn hàng.
                  </span>
                </div>

                {/* Banner Ghim Sản phẩm Khách đang quan tâm (Pinned Product Context) */}
                {relatedBook && (
                  <div className="px-4 py-2 bg-blue-50/80 border-b border-blue-100 flex items-center justify-between gap-3 animate-in fade-in">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-11 shrink-0 rounded-md overflow-hidden border border-blue-200 shadow-2xs bg-white">
                        <BookCover book={relatedBook} size="sm" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[9px] font-bold text-blue-700 uppercase tracking-wider block">
                          Sách khách đang quan tâm
                        </span>
                        <p className="font-bold text-slate-800 text-xs truncate max-w-xs sm:max-w-md">
                          {relatedBook.title}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs font-extrabold text-blue-700">
                            {fmt(relatedBook.price)}
                          </span>
                          <span className="text-[10px] text-emerald-700 bg-emerald-100/70 px-1.5 py-0.2 rounded-sm font-semibold border border-emerald-200">
                            Tồn kho: {relatedBook.stock} cuốn
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleSendProductCard(relatedBook)}
                        className="px-2 py-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-600 hover:text-white transition-all shadow-2xs cursor-pointer flex items-center gap-1"
                        title="Gửi thẻ sách này vào cuộc trò chuyện"
                      >
                        <Share2 size={11} /> Gửi thẻ sách
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setShopReplyInput(
                            `Dạ cuốn "${relatedBook.title}" bên shop hiện đang có sẵn hàng chính hãng, giá ${fmt(relatedBook.price)}, tồn kho còn ${relatedBook.stock} cuốn bạn nhé!`
                          )
                        }
                        className="px-2 py-1 text-[10px] font-semibold text-blue-700 bg-white border border-blue-200 rounded-lg hover:bg-blue-600 hover:text-white transition-all shadow-2xs cursor-pointer flex items-center gap-1"
                      >
                        <Sparkles size={11} /> Gửi text
                      </button>
                    </div>
                  </div>
                )}

                {/* Vùng luồng tin nhắn (Message Thread - Cuộn độc lập & Render Rich Message Types) */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 bg-slate-50/60">
                  <div className="text-center my-1">
                    <span className="px-3 py-1 bg-slate-200/70 rounded-full text-[10px] font-semibold text-slate-500">
                      Bắt đầu cuộc tư vấn trực tiếp với {selectedThread.userName}
                    </span>
                  </div>

                  {cleanAndDeduplicateMessages(threadMessages).map((m, idx) => {
                    const isShop = !m.isFromCustomer;
                    const product = parseProductFromMessage(m);
                    return (
                      <div
                        key={m.id || idx}
                        className={`flex items-end gap-2 ${isShop ? "justify-end" : "justify-start"}`}
                      >
                        {/* Avatar Khách hàng bên trái */}
                        {!isShop && (
                          <div className="shrink-0 mb-1">
                            {selectedThread.userAvatar ? (
                              <img
                                src={selectedThread.userAvatar}
                                alt={selectedThread.userName}
                                className="w-7 h-7 rounded-full object-cover border border-slate-200 shadow-2xs"
                              />
                            ) : (
                              <div className="w-7 h-7 rounded-full bg-slate-300 text-slate-700 flex items-center justify-center font-bold text-[10px] shadow-2xs">
                                {(selectedThread.userName?.trim() || "K").charAt(0) || "K"}
                              </div>
                            )}
                          </div>
                        )}

                        <div className={`flex flex-col ${isShop ? "items-end" : "items-start"} max-w-[75%]`}>
                          {/* 1. Tin nhắn dạng Thẻ Sản Phẩm (Product Card) */}
                          {product ? (
                            <div className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-xs w-72 sm:w-80 text-left hover:shadow-md transition-shadow">
                              <div className="flex items-start gap-3 mb-2.5">
                                {/* Bìa sách chuẩn tỉ lệ 3:4 kích thước 80x112px */}
                                <div className="w-20 h-28 rounded-lg bg-slate-100 overflow-hidden border border-slate-200/80 shrink-0 flex items-center justify-center relative shadow-xs">
                                  {product.imageUrl ? (
                                    <img
                                      src={product.imageUrl}
                                      alt={product.title}
                                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                                    />
                                  ) : (
                                    <div className="w-full h-full bg-linear-to-br from-amber-700 to-amber-900 flex flex-col items-center justify-center p-1.5 text-center text-white">
                                      <BookOpen size={20} className="mb-1 text-amber-200" />
                                      <span className="text-[9px] font-bold line-clamp-2 leading-tight">
                                        {product.title}
                                      </span>
                                    </div>
                                  )}
                                </div>

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
                                      className="font-bold text-xs text-slate-800 line-clamp-2 mt-1 leading-snug"
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

                              <p className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-xl border border-slate-100 leading-relaxed">
                                {cleanProductText(m.text) || `Shop xin gửi bạn thông tin cuốn sách "${product.title}"`}
                              </p>
                            </div>
                          ) : m.messageType === "order_card" && m.orderData ? (
                            /* 2. Tin nhắn dạng Thẻ Đơn Hàng (Order Card) */
                            <div className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-sm w-64 text-left">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-extrabold text-xs text-slate-800 font-mono">
                                  #{formatShortOrderId(m.orderData.orderId)}
                                </span>
                                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                                  {m.orderData.orderStatus}
                                </span>
                              </div>
                              <div className="text-xs space-y-1 py-1.5 border-y border-slate-100 text-slate-600">
                                <p>• Số lượng: {m.orderData.itemCount} sản phẩm</p>
                                <p className="font-bold text-emerald-700">
                                  Tổng tiền: {fmt(m.orderData.totalAmount)}
                                </p>
                              </div>
                              <p className="text-[10px] text-slate-400 mt-1.5 text-center">
                                Đơn hàng đang được Shop xử lý
                              </p>
                            </div>
                          ) : parseVoucherFromMessage(m) ? (
                            /* 3. Tin nhắn dạng Thẻ Voucher Vé Hoàng Kim (Voucher Ticket Card) */
                            <VoucherTicket
                              voucher={parseVoucherFromMessage(m)!}
                              isShop={isShop}
                            />
                          ) : m.imageUrl ? (
                            /* 4. Tin nhắn dạng Hình Ảnh Chụp Thật (Image Attachment - Ảnh thuần) */
                            <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-white p-1 max-w-[240px]">
                              <img
                                src={m.imageUrl}
                                alt="Ảnh thực tế sách"
                                onClick={() => setPreviewModalImage(m.imageUrl || null)}
                                className="w-full h-auto max-h-60 rounded-xl object-cover cursor-pointer hover:opacity-90 transition-opacity"
                              />
                              {m.text && m.text.trim() !== "" && m.text !== "Shop gửi bạn ảnh chụp thực tế của sách" && (
                                <p className="text-xs text-slate-700 px-2 py-1 leading-relaxed">{m.text}</p>
                              )}
                            </div>
                          ) : (
                            /* 5. Tin nhắn văn bản truyền thống */
                            <div
                              className={`rounded-2xl px-4 py-2.5 text-xs sm:text-sm shadow-2xs leading-relaxed whitespace-pre-wrap ${
                                isShop
                                  ? "bg-emerald-600 text-white rounded-tr-xs"
                                  : "bg-white text-slate-800 border border-slate-200/80 rounded-tl-xs"
                              }`}
                            >
                              <p>{m.text}</p>
                            </div>
                          )}

                          <span className="text-[10px] text-slate-400 mt-1 px-1 font-mono">
                            {formatChatTime(m.createdAt) || m.createdAt}
                          </span>
                        </div>

                        {/* Avatar Shop bên phải */}
                        {isShop && (
                          <div className="w-7 h-7 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-[10px] shrink-0 mb-1 shadow-2xs">
                            S
                          </div>
                        )}
                      </div>
                    );
                  })}
                  <div ref={chatMessagesEndRef} />
                </div>

                {/* Thanh Câu trả lời mẫu nhanh (Quick Reply Chips) */}
                <div className="px-3.5 py-1.5 bg-white border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto whitespace-nowrap scrollbar-none">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1 mr-1">
                    <Sparkles size={11} className="text-amber-500" /> Mẫu:
                  </span>
                  {QUICK_REPLIES.map((chip, cIdx) => (
                    <button
                      key={cIdx}
                      type="button"
                      onClick={() => setShopReplyInput(chip.text)}
                      className="px-2.5 py-0.5 rounded-full bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 text-[11px] text-slate-600 font-medium transition-all shrink-0 cursor-pointer border border-slate-200 shadow-2xs"
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>

                {/* Thanh nhập tin nhắn chuyên dụng (Rich Input Bar) */}
                <form
                  onSubmit={handleSendShopReply}
                  className="p-3 bg-white border-t border-slate-200 flex items-center gap-2"
                >
                  {/* Nút gửi ảnh chụp thực tế */}
                  <input
                    type="file"
                    ref={chatFileInputRef}
                    onChange={handleUploadChatImage}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    type="button"
                    disabled={isUploadingChatImage || isSendingShopReply}
                    onClick={() => chatFileInputRef.current?.click()}
                    className="p-2 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl transition-all cursor-pointer shrink-0 border border-slate-200"
                    title="Đính kèm ảnh chụp thực tế của sách"
                  >
                    {isUploadingChatImage ? (
                      <Loader2 size={16} className="animate-spin text-emerald-600" />
                    ) : (
                      <ImageIcon size={16} />
                    )}
                  </button>

                  {/* Nút chọn gửi thẻ sách */}
                  <button
                    type="button"
                    onClick={handleOpenProductPicker}
                    className="p-2 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded-xl transition-all cursor-pointer shrink-0 border border-slate-200"
                    title="Chọn và gửi thẻ sách cho khách"
                  >
                    <BookOpen size={16} />
                  </button>

                  <input
                    value={shopReplyInput}
                    disabled={isSendingShopReply}
                    onChange={(e) => setShopReplyInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendShopReply(e);
                      }
                    }}
                    placeholder={
                      isSendingShopReply
                        ? "Đang gửi câu trả lời..."
                        : `Nhắn tin trả lời ${selectedThread.userName} (Nhấn Enter để gửi)... `
                    }
                    className="flex-1 text-xs sm:text-sm px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 bg-slate-50 disabled:opacity-60 transition-all"
                  />
                  <Btn
                    type="submit"
                    disabled={!shopReplyInput.trim() || isSendingShopReply}
                    color="#047857"
                    size="md"
                    className="cursor-pointer shrink-0 shadow-sm"
                  >
                    {isSendingShopReply ? (
                      <Loader2 size={15} className="animate-spin" />
                    ) : (
                      <Send size={15} />
                    )} Gửi tin
                  </Btn>
                </form>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
                <MessageSquare size={44} className="text-slate-300 mb-3" />
                <p className="text-sm font-semibold text-slate-600">
                  Chưa chọn cuộc trò chuyện
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Chọn một khách hàng từ danh sách bên trái để bắt đầu trả lời tư vấn.
                </p>
              </div>
            )}
          </div>

          {/* ========================================================================= */}
          {/* THANH KÉO CHUỘT RESIZER 2 (DESKTOP): ĐIỀU CHỈNH ĐỘ RỘNG CỘT 3            */}
          {/* ========================================================================= */}
          {isDesktop && showCustomerSidebar && selectedThread && (
            <div
              onMouseDown={(e) => {
                e.preventDefault();
                setIsDraggingCol3(true);
              }}
              className={`hidden lg:flex items-center justify-center w-1.5 hover:w-2.5 hover:bg-emerald-500 active:bg-emerald-600 cursor-col-resize select-none shrink-0 transition-all z-20 group relative ${
                isDraggingCol3 ? "bg-emerald-500 w-2.5 shadow-xs" : "bg-slate-200/80 hover:shadow-xs"
              }`}
              title="Kéo chuột sang trái/phải để điều chỉnh độ rộng hồ sơ khách hàng"
            >
              <div className="w-0.5 h-7 bg-slate-400 group-hover:bg-white rounded-full transition-colors" />
            </div>
          )}

          {/* ========================================================================= */}
          {/* CỘT 3 TRÊN DESKTOP: CỘT SIDEBAR HỒ SƠ & ĐƠN HÀNG KÈM KÉO RESIZER          */}
          {/* ========================================================================= */}
          {isDesktop && showCustomerSidebar && selectedThread && (
            <div
              style={{ width: `${col3Width}px` }}
              className="shrink-0 bg-slate-50/50 flex flex-col h-full overflow-hidden border-l border-slate-200 animate-in slide-in-from-right duration-150"
            >
              {renderCustomerProfileContent(() => setShowCustomerSidebar(false))}
            </div>
          )}

          {/* ========================================================================= */}
          {/* CỘT 3 TRÊN MOBILE / TABLET: SLIDE-OVER DRAWER VỚI BACKDROP MỜ             */}
          {/* ========================================================================= */}
          {!isDesktop && mobileProfileOpen && selectedThread && (
            <div
              className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex justify-end animate-in fade-in duration-150 lg:hidden"
              onClick={() => setMobileProfileOpen(false)}
            >
              <div
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-sm sm:max-w-md bg-white h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200"
              >
                {renderCustomerProfileContent(() => setMobileProfileOpen(false))}
              </div>
            </div>
          )}

          {/* Modal phóng to ảnh chụp thực tế của sách */}
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

          {/* Modal chọn sách để gửi thẻ sản phẩm */}
          {showProductPickerModal && (
            <div
              onClick={() => setShowProductPickerModal(false)}
              className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in"
            >
              <div
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-3xl p-5 max-w-lg w-full shadow-2xl border border-slate-200 max-h-[80vh] flex flex-col animate-in zoom-in-95 duration-150"
              >
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                    <BookOpen size={16} className="text-emerald-600" />
                    Chọn sách trong kho để gửi thẻ tư vấn
                  </h4>
                  <button
                    type="button"
                    onClick={() => setShowProductPickerModal(false)}
                    className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="p-3 border-b border-slate-100 bg-slate-50">
                  <div className="relative">
                    <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      value={productPickerSearch}
                      onChange={(e) => setProductPickerSearch(e.target.value)}
                      placeholder="Tìm sách theo tên hoặc tác giả..."
                      className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto py-3 px-2 space-y-2 divide-y divide-slate-50">
                  {isLoadingPickerProducts ? (
                    <div className="text-center py-8 text-xs text-slate-400">
                      <Loader2 size={20} className="animate-spin text-emerald-600 mx-auto mb-2" />
                      Đang tải kho sách của shop...
                    </div>
                  ) : products.length === 0 ? (
                    <p className="text-center text-xs text-slate-400 py-6">
                      Kho sách chưa có sản phẩm nào để gửi.
                    </p>
                  ) : (
                    products
                      .filter((b) =>
                        productPickerSearch
                          ? (b.title || "").toLowerCase().includes(productPickerSearch.toLowerCase()) ||
                            (b.author || "").toLowerCase().includes(productPickerSearch.toLowerCase())
                          : true
                      )
                      .map((b) => (
                      <div
                        key={b.id}
                        className="pt-2 flex items-center justify-between gap-3 hover:bg-slate-50 p-2 rounded-xl transition-colors"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-9 h-12 rounded bg-slate-100 border border-slate-200 shrink-0 overflow-hidden flex items-center justify-center">
                            {b.imageUrl ? (
                              <img src={b.imageUrl} alt={b.title} className="w-full h-full object-cover" />
                            ) : (
                              <BookOpen size={16} className="text-slate-400" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <h5 className="font-bold text-xs text-slate-800 truncate">
                              {b.title}
                            </h5>
                            <p className="text-xs font-extrabold text-blue-700 mt-0.5">
                              {fmt(b.price)}
                            </p>
                            <span className="text-[10px] text-slate-400">
                              Tồn kho: {b.stock} cuốn
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleSendProductCard(b)}
                          className="px-3 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-colors shrink-0 shadow-2xs cursor-pointer flex items-center gap-1"
                        >
                          <Send size={12} /> Gửi thẻ
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add / Edit Product Modal */}
      <Modal
        isOpen={showProductModal}
        onClose={() => setShowProductModal(false)}
        title={editingBookId ? "Chỉnh sửa thông tin sách" : "Thêm tựa sách mới vào cửa hàng"}
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSaveProduct} className="space-y-4">
          {formError && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-rose-700 animate-in fade-in zoom-in-95 duration-150">
              <AlertCircle size={18} className="shrink-0 mt-0.5 text-rose-600" />
              <div className="text-xs font-medium leading-relaxed">
                <p className="font-semibold text-rose-800">Không thể lưu thông tin sách</p>
                <p className="mt-0.5">{formError}</p>
              </div>
            </div>
          )}

          {/* Multi-Image Upload & Gallery Area */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-600">
                Hình ảnh sản phẩm sách ({bookImages.length} ảnh)
              </label>
              {bookImages.length > 0 && (
                <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                  <CheckCircle size={12} /> Đã lưu trên Cloudinary
                </span>
              )}
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".jpg,.jpeg,.png,.webp,.gif"
              multiple
              className="hidden"
            />

            {/* Gallery Grid */}
            {bookImages.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                {bookImages.map((img, index) => (
                  <div
                    key={index}
                    className={`relative rounded-xl overflow-hidden border transition-all group bg-slate-50 ${img.isCover
                      ? "border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs"
                      : "border-slate-200 hover:border-slate-300"
                      }`}
                  >
                    <div className="aspect-[3/4] w-full bg-slate-100 relative">
                      <img
                        src={img.url}
                        alt={`Ảnh sách ${index + 1}`}
                        className="w-full h-full object-cover"
                      />

                      {/* Badge Cover or Preview Index */}
                      <div className="absolute top-1.5 left-1.5">
                        {img.isCover ? (
                          <span className="px-1.5 py-0.5 rounded-md bg-emerald-600 text-white text-[10px] font-bold flex items-center gap-1 shadow-xs">
                            <Star size={10} className="fill-current" /> Bìa chính
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded-md bg-slate-800/80 text-white text-[10px] font-medium backdrop-blur-xs">
                            Trang #{index}
                          </span>
                        )}
                      </div>

                      {/* Action buttons overlay */}
                      <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 p-2">
                        {!img.isCover && (
                          <button
                            type="button"
                            onClick={() => handleSetCoverImage(index)}
                            disabled={isUploadingImage || isSubmitting}
                            className="w-full px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                          >
                            <Star size={11} /> Đặt làm bìa
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(index)}
                          disabled={isUploadingImage || isSubmitting}
                          className="w-full px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                        >
                          <Trash2 size={11} /> Xóa ảnh
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Upload Action Box */}
            <div
              onClick={() => !isUploadingImage && !isSubmitting && fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all ${isUploadingImage || isSubmitting
                ? "bg-slate-50 border-slate-300 cursor-not-allowed"
                : "border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/30"
                }`}
            >
              {isUploadingImage ? (
                <div className="flex flex-col items-center justify-center py-2">
                  <Loader2 size={24} className="text-emerald-600 animate-spin mb-1.5" />
                  <p className="text-xs font-medium text-emerald-700">
                    Đang tải danh sách ảnh lên Cloudinary...
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Vui lòng chờ trong giây lát</p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-2">
                  <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-1.5 shadow-xs">
                    <Upload size={18} />
                  </div>
                  <p className="text-xs font-semibold text-slate-700">
                    {bookImages.length > 0
                      ? "+ Chọn thêm hình ảnh khác (Đọc thử / Góc chụp)"
                      : "Nhấn để chọn và tải lên nhiều hình ảnh sách"}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Hỗ trợ chọn nhiều file cùng lúc: JPG, PNG, WEBP, GIF (Tối đa 10MB/ảnh)
                  </p>
                </div>
              )}
            </div>

            {uploadError && (
              <p className="text-xs text-rose-600 mt-1.5 flex items-center gap-1">
                <X size={13} /> {uploadError}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Thể loại sách *
            </label>
            <select
              required
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full text-xs sm:text-sm border border-slate-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-emerald-500 bg-slate-50 font-medium text-slate-800"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Tựa đề sách *
            </label>
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nhập tên sách..."
              className="w-full text-xs sm:text-sm border border-slate-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-emerald-500 bg-slate-50"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Tác giả *
              </label>
              <input
                required
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="Tên tác giả..."
                className="w-full text-xs sm:text-sm border border-slate-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-emerald-500 bg-slate-50"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Mã ISBN
              </label>
              <input
                value={isbn}
                onChange={(e) => setIsbn(e.target.value)}
                placeholder="978-604-..."
                className="w-full text-xs sm:text-sm border border-slate-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-emerald-500 bg-slate-50"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Nhà xuất bản
              </label>
              <input
                value={publisher}
                onChange={(e) => setPublisher(e.target.value)}
                placeholder="NXB Trẻ..."
                className="w-full text-xs sm:text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500 bg-slate-50"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Năm XB *
              </label>
              <input
                type="number"
                min="1000"
                max={new Date().getFullYear() + 1}
                value={publishedYear}
                onChange={(e) => setPublishedYear(e.target.value)}
                placeholder={String(new Date().getFullYear())}
                className="w-full text-xs sm:text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500 bg-slate-50 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Giá bán (VNĐ) *
              </label>
              <input
                type="number"
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full text-xs sm:text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500 bg-slate-50"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Tồn kho *
              </label>
              <input
                type="number"
                required
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                className="w-full text-xs sm:text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500 bg-slate-50"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Màu dự phòng bìa sách (Fallback Gradient)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={color1}
                onChange={(e) => setColor1(e.target.value)}
                className="w-10 h-10 rounded-lg cursor-pointer border border-slate-200 p-0.5"
              />
              <input
                type="color"
                value={color2}
                onChange={(e) => setColor2(e.target.value)}
                className="w-10 h-10 rounded-lg cursor-pointer border border-slate-200 p-0.5"
              />
              <span className="text-xs text-slate-400">
                Hiển thị khi ảnh bìa chưa có hoặc tải chậm
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Mô tả nội dung sách
            </label>
            <textarea
              rows={3}
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Giới thiệu tóm tắt tác phẩm..."
              className="w-full text-xs sm:text-sm border border-slate-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-emerald-500 bg-slate-50 resize-none"
            />
          </div>

          <Btn
            type="submit"
            color="#047857"
            size="md"
            className="w-full mt-2"
            disabled={isUploadingImage || isSubmitting}
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 size={16} className="animate-spin" /> Đang lưu thông tin...
              </span>
            ) : editingBookId ? (
              "Lưu thay đổi sách"
            ) : (
              "Thêm sách vào gian hàng"
            )}
          </Btn>
        </form>
      </Modal>
    </div>
  );
};
