import React, { useState, useEffect } from "react";
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
} from "lucide-react";
import { Order, Book, OrderStatus, OrderFeedback } from "../../types";
import { shopService } from "../../services/shopService";
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

  const [tab, setTab] = useState<"orders" | "products" | "feedbacks" | "revenue">("orders");
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Book[]>([]);
  const [feedbacks, setFeedbacks] = useState<{ orderId: number; feedback: OrderFeedback }[]>([]);
  const [loading, setLoading] = useState(true);

  // Search in shop products
  const [productSearch, setProductSearch] = useState("");

  // Add & Edit Product Modal State
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingBookId, setEditingBookId] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [publisher, setPublisher] = useState("NXB Trẻ");
  const [price, setPrice] = useState("95000");
  const [stock, setStock] = useState("50");
  const [desc, setDesc] = useState("");
  const [isbn, setIsbn] = useState("");
  const [color1, setColor1] = useState("#1d4ed8");
  const [color2, setColor2] = useState("#3b82f6");

  // Reply Feedback State
  const [replyTextMap, setReplyTextMap] = useState<Record<number, string>>({});
  const [submittingReply, setSubmittingReply] = useState<number | null>(null);

  // Revenue filter period
  const [revenuePeriod, setRevenuePeriod] = useState<"day" | "month" | "year">("month");

  const loadData = async () => {
    setLoading(true);
    try {
      const [ordersData, productsData, feedbacksData] = await Promise.all([
        shopService.getShopOrders(shopId),
        shopService.getShopProducts(shopId),
        shopService.getShopFeedbacks(shopId),
      ]);
      setOrders(ordersData);
      setProducts(productsData);
      setFeedbacks(feedbacksData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [shopId]);

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
    setColor1("#1d4ed8");
    setColor2("#3b82f6");
    setShowProductModal(true);
  };

  const handleOpenEditModal = (book: Book) => {
    setEditingBookId(book.id);
    setTitle(book.title);
    setAuthor(book.author);
    setPublisher(book.publisher);
    setPrice(String(book.price));
    setStock(String(book.stock));
    setDesc(book.description || "");
    setIsbn(book.isbn || "");
    setColor1(book.coverColor || "#1d4ed8");
    setColor2(book.coverColor2 || "#3b82f6");
    setShowProductModal(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !author) return;

    if (editingBookId) {
      const updated = await shopService.updateProduct(editingBookId, {
        title,
        author,
        publisher,
        price: Number(price) || 50000,
        stock: Number(stock) || 10,
        description: desc,
        isbn,
        coverColor: color1,
        coverColor2: color2,
      });
      setProducts((prev) => prev.map((b) => (b.id === editingBookId ? updated : b)));
    } else {
      const created = await shopService.addProduct({
        shopId,
        shopName,
        categoryId: 1,
        title,
        author,
        publisher,
        price: Number(price) || 50000,
        stock: Number(stock) || 10,
        rating: 5.0,
        reviewCount: 0,
        description: desc || "Tác phẩm mới cập nhật tại nhà sách.",
        coverColor: color1,
        coverColor2: color2,
        status: "ACTIVE",
        isbn,
      });
      setProducts((prev) => [created, ...prev]);
    }

    setShowProductModal(false);
  };

  const handleDeleteProduct = async (id: number) => {
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

      {/* Orders Management Tab */}
      {tab === "orders" && (
        <Card className="overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-bold text-slate-800 text-base">
              Danh sách đơn đặt hàng của shop
            </h2>
            <span className="text-xs text-slate-400 font-medium">
              Cập nhật trực tiếp
            </span>
          </div>

          {loading ? (
            <div className="p-8 text-center text-slate-400 animate-pulse">
              Đang tải danh sách đơn hàng...
            </div>
          ) : orders.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              Chưa có đơn hàng nào cho cửa hàng này.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {orders.map((order) => {
                const si = orderStatusInfo(order.orderStatus);
                return (
                  <div
                    key={order.id}
                    className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-xs font-mono font-bold text-slate-500">
                          #{order.id}
                        </span>
                        <Badge
                          label={si.label}
                          color={si.color}
                          bg={si.bg}
                          icon={si.icon}
                        />
                        <span className="text-xs text-slate-400 font-mono">
                          {order.createdAt}
                        </span>
                      </div>

                      <p className="text-sm font-semibold text-slate-800">
                        Khách: {order.customerName} • SĐT: {order.customerPhone}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        Sách đặt:{" "}
                        <span className="text-slate-700">
                          {order.items
                            .map((i) => `${i.book.title} (×${i.quantity})`)
                            .join(", ")}
                        </span>
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Địa chỉ giao: {order.shippingAddress}
                      </p>
                      <p className="text-sm font-bold text-blue-600 mt-2">
                        Tổng thu: {fmt(order.totalAmount + order.shippingFee)} •{" "}
                        <span className="text-xs font-normal text-slate-500">
                          Hình thức: {order.paymentMethod}
                        </span>
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      {order.orderStatus === "PENDING" && (
                        <>
                          <Btn
                            size="sm"
                            color="#047857"
                            onClick={() =>
                              handleUpdateStatus(order.id, "PROCESSING")
                            }
                          >
                            <Check size={14} /> Xác nhận đóng gói
                          </Btn>
                          <Btn
                            variant="danger"
                            size="sm"
                            onClick={() =>
                              handleUpdateStatus(order.id, "CANCELLED")
                            }
                          >
                            <X size={14} /> Từ chối
                          </Btn>
                        </>
                      )}

                      {order.orderStatus === "PROCESSING" && (
                        <Btn
                          size="sm"
                          color="#6d28d9"
                          onClick={() => handleUpdateStatus(order.id, "SHIPPED")}
                        >
                          <Truck size={14} /> Bàn giao shipper GHN
                        </Btn>
                      )}

                      {order.orderStatus === "SHIPPED" && (
                        <Badge
                          label="Đang giao hàng"
                          color="#6d28d9"
                          bg="#ede9fe"
                          icon={<Truck size={12} />}
                        />
                      )}

                      {order.orderStatus === "DELIVERED" && (
                        <Badge
                          label="Hoàn tất & Đã thanh toán"
                          color="#047857"
                          bg="#d1fae5"
                          icon={<CheckCircle size={12} />}
                        />
                      )}

                      {order.orderStatus === "CANCELLED" && (
                        <Badge label="Đã hủy" color="#b91c1c" bg="#fee2e2" />
                      )}

                      {order.orderStatus === "RETURNED" && (
                        <Badge label="Đã hoàn hàng" color="#92400e" bg="#fef3c7" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}

      {/* Products Management Tab */}
      {tab === "products" && (
        <Card className="overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-1 max-w-sm">
              <input
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                placeholder="Tìm sách trong kho..."
                className="w-full text-xs sm:text-sm border border-slate-200 rounded-xl px-3 py-1.5 bg-slate-50 focus:outline-none"
              />
            </div>
            <Btn
              size="sm"
              color="#047857"
              onClick={handleOpenAddModal}
            >
              <Plus size={14} /> Đăng bán sách mới
            </Btn>
          </div>

          <div className="divide-y divide-slate-100">
            {filteredProducts.map((book) => (
              <div
                key={book.id}
                className="p-4 flex items-center gap-4 hover:bg-slate-50/70 transition-colors"
              >
                <div className="w-12 shrink-0">
                  <BookCover book={book} size="sm" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-800 truncate">
                    {book.title}
                  </p>
                  <p className="text-xs text-slate-500">
                    {book.author} • NXB: {book.publisher} {book.isbn && `• ISBN: ${book.isbn}`}
                  </p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-sm font-bold text-blue-600">
                      {fmt(book.price)}
                    </span>
                    <span className="text-xs text-slate-400">
                      Tồn kho:{" "}
                      <strong className="text-slate-700">{book.stock} cuốn</strong>
                    </span>
                    <span className="text-xs text-amber-600 font-medium">
                      ⭐ {book.rating} ({book.reviewCount} đánh giá)
                    </span>
                  </div>
                </div>

                <Badge
                  label={book.status === "ACTIVE" ? "Đang bán" : "Hết hàng"}
                  color={book.status === "ACTIVE" ? "#047857" : "#b91c1c"}
                  bg={book.status === "ACTIVE" ? "#d1fae5" : "#fee2e2"}
                />

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEditModal(book)}
                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors cursor-pointer"
                    title="Chỉnh sửa sách"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => handleDeleteProduct(book.id)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                    title="Ẩn sách khỏi gian hàng"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Feedbacks Management Tab */}
      {tab === "feedbacks" && (
        <Card className="overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="font-bold text-slate-800 text-base">
              Đánh giá từ khách hàng & Phản hồi của shop
            </h2>
          </div>

          <div className="divide-y divide-slate-100 p-6 space-y-4">
            {feedbacks.length === 0 ? (
              <p className="text-center text-slate-400 py-8">Chưa có đánh giá nào từ khách hàng.</p>
            ) : (
              feedbacks.map((f) => (
                <div key={f.orderId} className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
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
                        <span className="text-slate-400 font-normal">{f.feedback.shopRepliedAt}</span>
                      </div>
                      <p className="text-xs text-slate-700 italic">"{f.feedback.shopReply}"</p>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 mt-2">
                      <input
                        value={replyTextMap[f.orderId] || ""}
                        onChange={(e) =>
                          setReplyTextMap({ ...replyTextMap, [f.orderId]: e.target.value })
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

      {/* Add / Edit Product Modal */}
      <Modal
        isOpen={showProductModal}
        onClose={() => setShowProductModal(false)}
        title={editingBookId ? "Chỉnh sửa thông tin sách" : "Thêm tựa sách mới vào cửa hàng"}
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSaveProduct} className="space-y-4">
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
              Màu gradient bìa sách (Demo Cover)
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
                Chọn 2 dải màu cho bìa sách
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

          <Btn type="submit" color="#047857" size="md" className="w-full mt-2">
            {editingBookId ? "Lưu thay đổi sách" : "Thêm sách vào gian hàng"}
          </Btn>
        </form>
      </Modal>
    </div>
  );
};
