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
  Eye,
  CheckCircle,
} from "lucide-react";
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

export const ShopDashboardPage = () => {
  const { user } = useAuth();
  const shopId = user?.shopId || 1;
  const shopName = user?.shopName || "Nhà sách Phương Nam";

  const [page, setPage] = useState("orders");
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Add product modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newAuthor, setNewAuthor] = useState("");
  const [newPublisher, setNewPublisher] = useState("NXB Trẻ");
  const [newPrice, setNewPrice] = useState("95000");
  const [newStock, setNewStock] = useState("50");
  const [newDesc, setNewDesc] = useState("");
  const [newColor1, setNewColor1] = useState("#1d4ed8");
  const [newColor2, setNewColor2] = useState("#3b82f6");

  const loadData = async () => {
    setLoading(true);
    try {
      const [ordersData, productsData] = await Promise.all([
        shopService.getShopOrders(shopId),
        shopService.getShopProducts(shopId),
      ]);
      setOrders(ordersData);
      setProducts(productsData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [shopId]);

  const handleUpdateStatus = async (orderId, nextStatus) => {
    await shopService.updateOrderStatus(orderId, nextStatus);
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, orderStatus: nextStatus } : o))
    );
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!newTitle || !newAuthor) return;

    const created = await shopService.addProduct({
      shopId,
      shopName,
      categoryId: 1,
      title: newTitle,
      author: newAuthor,
      publisher: newPublisher,
      price: Number(newPrice) || 50000,
      stock: Number(newStock) || 10,
      rating: 5.0,
      reviewCount: 0,
      description: newDesc || "Tác phẩm mới cập nhật tại nhà sách.",
      coverColor: newColor1,
      coverColor2: newColor2,
      status: "ACTIVE",
    });

    setProducts((prev) => [created, ...prev]);
    setShowAddModal(false);
    setNewTitle("");
    setNewAuthor("");
  };

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

        <div className="flex items-center gap-2">
          <Btn
            onClick={() => setPage("orders")}
            variant={page === "orders" ? "primary" : "outline"}
            size="sm"
            color="#047857"
          >
            <Package size={14} /> Quản lý Đơn hàng ({orders.length})
          </Btn>
          <Btn
            onClick={() => setPage("products")}
            variant={page === "products" ? "primary" : "outline"}
            size="sm"
            color="#047857"
          >
            <BookOpen size={14} /> Kho sách ({products.length})
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
      {page === "orders" && (
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
                            ?.map((i) => `${i.book.title} (×${i.quantity})`)
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
      {page === "products" && (
        <Card className="overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-bold text-slate-800 text-base">
              Danh mục sách của cửa hàng
            </h2>
            <Btn
              size="sm"
              color="#047857"
              onClick={() => setShowAddModal(true)}
            >
              <Plus size={14} /> Đăng bán sách mới
            </Btn>
          </div>

          <div className="divide-y divide-slate-100">
            {products.map((book) => (
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
                    {book.author} • NXB: {book.publisher}
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

                <button className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors">
                  <Eye size={16} />
                </button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Add Product Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Thêm tựa sách mới vào cửa hàng"
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleAddProduct} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Tựa đề sách *
            </label>
            <input
              required
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
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
                value={newAuthor}
                onChange={(e) => setNewAuthor(e.target.value)}
                placeholder="Tên tác giả..."
                className="w-full text-xs sm:text-sm border border-slate-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-emerald-500 bg-slate-50"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Nhà xuất bản
              </label>
              <input
                value={newPublisher}
                onChange={(e) => setNewPublisher(e.target.value)}
                placeholder="NXB Trẻ, Kim Đồng..."
                className="w-full text-xs sm:text-sm border border-slate-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-emerald-500 bg-slate-50"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Giá bán (VNĐ) *
              </label>
              <input
                type="number"
                required
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                className="w-full text-xs sm:text-sm border border-slate-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-emerald-500 bg-slate-50"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Số lượng tồn kho *
              </label>
              <input
                type="number"
                required
                value={newStock}
                onChange={(e) => setNewStock(e.target.value)}
                className="w-full text-xs sm:text-sm border border-slate-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-emerald-500 bg-slate-50"
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
                value={newColor1}
                onChange={(e) => setNewColor1(e.target.value)}
                className="w-10 h-10 rounded-lg cursor-pointer border border-slate-200 p-0.5"
              />
              <input
                type="color"
                value={newColor2}
                onChange={(e) => setNewColor2(e.target.value)}
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
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="Giới thiệu tóm tắt tác phẩm..."
              className="w-full text-xs sm:text-sm border border-slate-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-emerald-500 bg-slate-50 resize-none"
            />
          </div>

          <Btn type="submit" color="#047857" size="md" className="w-full mt-2">
            <Plus size={16} /> Thêm sách vào gian hàng
          </Btn>
        </form>
      </Modal>
    </div>
  );
};
