import React, { useState, useEffect, useRef } from "react";
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
} from "lucide-react";
import { Order, Book, Category, OrderStatus, OrderFeedback, ChatMessage } from "../../types";
import { shopService } from "../../services/shopService";
import { bookService } from "../../services/bookService";
import { chatService, ChatThread } from "../../services/chatService";
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
  const shopId = user?.shopId || 1;
  const shopName = user?.shopName || "Nhà sách Phương Nam";

  const [tab, setTab] = useState<"orders" | "products" | "feedbacks" | "revenue" | "chat">("orders");
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Book[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [feedbacks, setFeedbacks] = useState<{ orderId: number; feedback: OrderFeedback }[]>([]);
  const [loading, setLoading] = useState(true);

  // Search in shop products
  const [productSearch, setProductSearch] = useState("");

  // Add & Edit Product Modal State
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingBookId, setEditingBookId] = useState<string | number | null>(null);
  const [categoryId, setCategoryId] = useState<string | number>("");
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [publisher, setPublisher] = useState("NXB Trẻ");
  const [price, setPrice] = useState("95000");
  const [stock, setStock] = useState("50");
  const [desc, setDesc] = useState("");
  const [isbn, setIsbn] = useState("");
  const [color1, setColor1] = useState("#1d4ed8");
  const [color2, setColor2] = useState("#3b82f6");
  const [imageUrl, setImageUrl] = useState("");
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

  // ==========================================
  // REAL-TIME CHAT & MESSAGING STATE (SHOP)
  // ==========================================
  const [chatThreads, setChatThreads] = useState<ChatThread[]>([]);
  const [selectedThread, setSelectedThread] = useState<ChatThread | null>(null);
  const [threadMessages, setThreadMessages] = useState<ChatMessage[]>([]);
  const [shopReplyInput, setShopReplyInput] = useState("");
  const [isRealTimeChatConnected, setIsRealTimeChatConnected] = useState(false);
  const [threadSearch, setThreadSearch] = useState("");
  const chatMessagesEndRef = useRef<HTMLDivElement>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [ordersData, productsData, feedbacksData, threadsData, categoriesData] = await Promise.all([
        shopService.getShopOrders(shopId),
        shopService.getShopProducts(shopId),
        shopService.getShopFeedbacks(shopId),
        chatService.getShopConversations(shopId),
        bookService.getCategories(),
      ]);
      setOrders(ordersData);
      setProducts(productsData);
      setFeedbacks(feedbacksData);
      setChatThreads(threadsData);
      setCategories(categoriesData);
      if (categoriesData.length > 0 && !categoryId) {
        setCategoryId(categoriesData[0].id);
      }
      if (threadsData.length > 0 && !selectedThread) {
        setSelectedThread(threadsData[0]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [shopId]);

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
        isFromCustomer: incomingMsg.senderId !== String(shopId),
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
  }, [shopId, selectedThread?.chatId]);

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

  const handleSelectThread = (t: ChatThread) => {
    if (selectedThread?.chatId) {
      signalRService.leaveChatRoom(selectedThread.chatId);
    }
    setSelectedThread(t);
  };

  const handleSendShopReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopReplyInput.trim() || !selectedThread) return;

    const textToSend = shopReplyInput.trim();
    setShopReplyInput("");

    try {
      const res = await chatService.sendMessage({
        chatId: selectedThread.chatId,
        senderId: shopId,
        receiverId: selectedThread.userId,
        shopId,
        text: textToSend,
        isFromCustomer: false,
        senderName: shopName,
      });

      setThreadMessages((prev) => [...prev, res.message]);

      setChatThreads((prev) =>
        prev.map((t) =>
          t.chatId === selectedThread.chatId
            ? { ...t, lastMessage: textToSend, updatedAt: "Vừa xong" }
            : t
        )
      );
    } catch (err) {
      console.warn("Error sending shop reply:", err);
    }
  };

  const totalUnreadChats = chatThreads.reduce((s, t) => s + (t.unreadCount || 0), 0);

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
    setPrice("95000");
    setStock("50");
    setDesc("");
    setIsbn("");
    setCategoryId(categories[0]?.id || "11111111-0000-0000-0000-000000000001");
    setColor1("#1d4ed8");
    setColor2("#3b82f6");
    setImageUrl("");
    setUploadError(null);
    setFormError(null);
    setShowProductModal(true);
  };

  const handleOpenEditModal = (book: Book) => {
    setEditingBookId(book.id);
    setTitle(book.title);
    setAuthor(book.author);
    setPublisher(book.publisher);
    setPrice(String(book.price));
    setStock(String(book.stock));
    setDesc(book.description);
    setIsbn(book.isbn || "");
    setCategoryId(book.categoryId || categories[0]?.id || "11111111-0000-0000-0000-000000000001");
    setColor1(book.coverColor);
    setColor2(book.coverColor2);
    setImageUrl(book.imageUrl || "");
    setUploadError(null);
    setFormError(null);
    setShowProductModal(true);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    setUploadError(null);
    try {
      const res = await uploadService.uploadImage(file, "bookverse/books");
      setImageUrl(res.url);
    } catch (err: any) {
      setUploadError(err.message || "Tải ảnh lên thất bại. Vui lòng thử lại.");
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemoveImage = () => {
    setImageUrl("");
    setUploadError(null);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !author.trim()) {
      setFormError("Vui lòng điền đầy đủ Tựa đề sách và Tác giả.");
      return;
    }

    const selectedCategoryGuid = categoryId || categories[0]?.id || "11111111-0000-0000-0000-000000000001";

    setIsSubmitting(true);
    setFormError(null);

    try {
      if (editingBookId) {
        const updated = await shopService.updateProduct(editingBookId, {
          title,
          author,
          publisher,
          price: Number(price) || 0,
          stock: Number(stock) || 0,
          categoryId: selectedCategoryGuid,
          description: desc,
          isbn,
          coverColor: color1,
          coverColor2: color2,
          imageUrl: imageUrl.trim() || undefined,
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
          price: Number(price) || 0,
          stock: Number(stock) || 0,
          rating: 5.0,
          reviewCount: 0,
          description: desc || "Tác phẩm mới cập nhật tại nhà sách.",
          coverColor: color1,
          coverColor2: color2,
          imageUrl: imageUrl.trim() || undefined,
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
      await shopService.deleteProduct(id);
      setProducts((prev) => prev.filter((b) => b.id !== id));
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

  const filteredProducts = products.filter((p) =>
    productSearch
      ? p.title.toLowerCase().includes(productSearch.toLowerCase()) ||
        p.author.toLowerCase().includes(productSearch.toLowerCase())
      : true
  );

  const filteredChatThreads = chatThreads.filter((t) =>
    threadSearch
      ? t.userName.toLowerCase().includes(threadSearch.toLowerCase()) ||
        (t.lastMessage && t.lastMessage.toLowerCase().includes(threadSearch.toLowerCase()))
      : true
  );

  const revenue = orders
    .filter((o) => o.orderStatus === "DELIVERED")
    .reduce((s, o) => s + o.totalAmount, 0);
  const pendingCount = orders.filter((o) => o.orderStatus === "PENDING").length;

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">
              {shopName}
            </h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
              Đối tác xác thực
            </span>
          </div>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
            Cổng quản trị nhà cung cấp sách BookVerse
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Btn
            onClick={() => setTab("orders")}
            variant={tab === "orders" ? "primary" : "outline"}
            size="sm"
            color="#047857"
          >
            <Package size={14} /> Đơn hàng ({orders.length})
          </Btn>
          <Btn
            onClick={() => setTab("products")}
            variant={tab === "products" ? "primary" : "outline"}
            size="sm"
            color="#047857"
          >
            <BookOpen size={14} /> Kho sách ({products.length})
          </Btn>
          <Btn
            onClick={() => setTab("feedbacks")}
            variant={tab === "feedbacks" ? "primary" : "outline"}
            size="sm"
            color="#047857"
          >
            <MessageSquare size={14} /> Đánh giá ({feedbacks.length})
          </Btn>
          <Btn
            onClick={() => setTab("chat")}
            variant={tab === "chat" ? "primary" : "outline"}
            size="sm"
            color="#047857"
            className="relative"
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
          value={String(products.length)}
          sub="Đang kinh doanh"
          icon={<BookOpen size={22} />}
          color="#6d28d9"
        />
      </div>

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
                Kho sách của cửa hàng ({products.length} tựa sách)
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

          <div className="divide-y divide-slate-100">
            {filteredProducts.length === 0 ? (
              <p className="text-center text-slate-400 py-12 text-sm">
                Không tìm thấy sách nào trong kho.
              </p>
            ) : (
              filteredProducts.map((book) => (
                <div
                  key={book.id}
                  className="p-5 flex items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-16 shrink-0 rounded-lg overflow-hidden border border-slate-200">
                      <BookCover book={book} size="sm" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 text-sm">
                        {book.title}
                      </p>
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
                    <button
                      onClick={() => handleOpenEditModal(book)}
                      className="p-2 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                      title="Sửa thông tin"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(Number(book.id))}
                      className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                      title="Ẩn sách"
                    >
                      <Trash2 size={16} />
                    </button>
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
            {feedbacks.length === 0 ? (
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

      {/* TAB 4: REAL-TIME CHAT / HỘP THƯ TƯ VẤN */}
      {tab === "chat" && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col md:flex-row h-[600px] animate-in fade-in">
          {/* Left Column: Conversation Threads */}
          <div className="w-full md:w-80 border-r border-slate-200 flex flex-col bg-slate-50/50">
            <div className="p-4 border-b border-slate-200 bg-white">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                  <MessageSquare size={16} className="text-emerald-600" />
                  Hộp thư tư vấn ({chatThreads.length})
                </h3>
                <span className="text-[10px] text-emerald-600 flex items-center gap-1 font-medium bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                  {isRealTimeChatConnected ? (
                    <>
                      <Wifi size={10} /> Real-time
                    </>
                  ) : (
                    <>
                      <WifiOff size={10} /> Chờ kết nối
                    </>
                  )}
                </span>
              </div>
              <div className="relative">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  value={threadSearch}
                  onChange={(e) => setThreadSearch(e.target.value)}
                  placeholder="Tìm khách hàng hoặc tin nhắn..."
                  className="w-full pl-8 pr-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
              {filteredChatThreads.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  Chưa có cuộc trò chuyện nào từ khách hàng.
                </div>
              ) : (
                filteredChatThreads.map((t) => {
                  const isSelected = selectedThread?.chatId === t.chatId;
                  return (
                    <button
                      key={t.chatId}
                      onClick={() => handleSelectThread(t)}
                      className={`w-full p-4 text-left flex items-start gap-3 transition-colors cursor-pointer ${
                        isSelected
                          ? "bg-emerald-50/80 border-l-4 border-emerald-600"
                          : "hover:bg-slate-100/60 bg-white"
                      }`}
                    >
                      <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                        <UserIcon size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <p className="font-bold text-slate-800 text-xs truncate">
                            {t.userName}
                          </p>
                          <span className="text-[10px] text-slate-400 shrink-0">
                            {t.updatedAt}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 truncate leading-relaxed">
                          {t.lastMessage || "Khách hàng bắt đầu cuộc trò chuyện"}
                        </p>
                      </div>
                      {t.unreadCount > 0 && (
                        <span className="w-4 h-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold shrink-0">
                          {t.unreadCount}
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Active Conversation Chat Window */}
          <div className="flex-1 flex flex-col bg-white">
            {selectedThread ? (
              <>
                {/* Chat Header */}
                <div className="px-6 py-3.5 border-b border-slate-200 bg-white flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shadow-2xs">
                      <UserIcon size={16} />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">
                        {selectedThread.userName}
                      </h4>
                      <p className="text-[10px] text-emerald-600 flex items-center gap-1 font-medium mt-0.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        Đang kết nối trực tiếp
                      </p>
                    </div>
                  </div>
                </div>

                {/* Message Thread */}
                <div className="flex-1 overflow-y-auto p-6 space-y-3 bg-slate-50/50">
                  <div className="text-center my-2">
                    <span className="px-3 py-1 bg-slate-200/60 rounded-full text-[10px] font-semibold text-slate-500">
                      Hội thoại tư vấn sách với {selectedThread.userName}
                    </span>
                  </div>

                  {threadMessages.map((m) => {
                    // isFromCustomer === true nghĩa là tin từ Khách hàng (bên trái)
                    // isFromCustomer === false nghĩa là tin từ Shop (bên phải)
                    const isShop = !m.isFromCustomer;
                    return (
                      <div
                        key={m.id}
                        className={`flex flex-col ${isShop ? "items-end" : "items-start"}`}
                      >
                        <div
                          className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-xs sm:text-sm shadow-xs ${
                            isShop
                              ? "bg-[#047857] text-white rounded-br-none"
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
                  <div ref={chatMessagesEndRef} />
                </div>

                {/* Reply Input Bar */}
                <form
                  onSubmit={handleSendShopReply}
                  className="p-4 bg-white border-t border-slate-200 flex items-center gap-3"
                >
                  <input
                    value={shopReplyInput}
                    onChange={(e) => setShopReplyInput(e.target.value)}
                    placeholder={`Nhập tin nhắn trả lời ${selectedThread.userName}...`}
                    className="flex-1 text-xs sm:text-sm px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 bg-slate-50"
                  />
                  <Btn
                    type="submit"
                    disabled={!shopReplyInput.trim()}
                    color="#047857"
                    size="md"
                    className="cursor-pointer"
                  >
                    <Send size={15} /> Gửi tin
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

          {/* Image Upload Area */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 flex items-center justify-between">
              <span>Hình ảnh bìa sách (Cloudinary CDN)</span>
              {imageUrl && (
                <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                  <CheckCircle size={12} /> Đã tải lên Cloud
                </span>
              )}
            </label>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".jpg,.jpeg,.png,.webp,.gif"
              className="hidden"
            />

            {imageUrl ? (
              <div className="relative p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center gap-4 group">
                <div className="w-16 h-22 shrink-0 rounded-lg overflow-hidden border border-slate-200 shadow-xs bg-white relative">
                  <img
                    src={imageUrl}
                    alt="Preview bìa sách"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-800 truncate">
                    Ảnh bìa đã chọn
                  </p>
                  <p className="text-[11px] text-slate-400 truncate mt-0.5" title={imageUrl}>
                    {imageUrl}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploadingImage || isSubmitting}
                      className="px-2.5 py-1 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
                    >
                      Đổi ảnh khác
                    </button>
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      disabled={isUploadingImage || isSubmitting}
                      className="px-2.5 py-1 text-xs font-medium text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <Trash2 size={12} /> Xóa ảnh
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div
                onClick={() => !isUploadingImage && !isSubmitting && fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all ${
                  isUploadingImage || isSubmitting
                    ? "bg-slate-50 border-slate-300 cursor-not-allowed"
                    : "border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/30"
                }`}
              >
                {isUploadingImage ? (
                  <div className="flex flex-col items-center justify-center py-2">
                    <Loader2 size={24} className="text-emerald-600 animate-spin mb-1.5" />
                    <p className="text-xs font-medium text-emerald-700">
                      Đang tải ảnh lên Cloudinary...
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Vui lòng chờ trong giây lát</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-2">
                    <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-1.5 shadow-xs">
                      <Upload size={18} />
                    </div>
                    <p className="text-xs font-semibold text-slate-700">
                      Nhấn để tải lên ảnh bìa sách
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Hỗ trợ JPG, PNG, WEBP, GIF (Tối đa 10MB)
                    </p>
                  </div>
                )}
              </div>
            )}

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

          <div className="grid grid-cols-3 gap-3">
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
