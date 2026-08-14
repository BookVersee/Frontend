import React, { useState, useEffect } from 'react';
import { useApp } from '../../context';
import {
  getShopByUserId,
  getBooks,
  getOrders,
  getFeedbacksByShop,
  getCategories,
  addBook,
  updateBook,
  deleteBook,
  updateOrderStatus,
  addResponse,
  getRevenue,
  getReturnRequests,
  updateReturnStatus,
  updateShop,
} from '../../store';
import BookCover from '../../components/BookCover';
import StarRating from '../../components/StarRating';

function fmt(n) {
  return (n || 0).toLocaleString('vi-VN') + 'đ';
}

const COLORS = [
  '#1a3d24',
  '#d9531e',
  '#1a2942',
  '#4a235a',
  '#1e3d59',
  '#2b580c',
  '#8b0000',
  '#8c502b',
  '#34495e',
  '#7b1113',
];

const ORDER_STATUS_MAP = {
  PENDING: { label: 'Chờ xác nhận', color: '#d97706', next: 'PROCESSING', nextLabel: 'Xác nhận đóng gói' },
  PROCESSING: { label: 'Đang xử lý', color: '#2563eb', next: 'SHIPPING', nextLabel: 'Bàn giao vận chuyển' },
  SHIPPING: { label: 'Chờ giao', color: '#7c3aed', next: 'DELIVERING', nextLabel: 'Đi giao hàng' },
  DELIVERING: { label: 'Đang giao', color: '#0891b2', next: 'DELIVERED', nextLabel: 'Xác nhận đã giao' },
  DELIVERED: { label: 'Đã giao thành công', color: '#166534', next: null },
  CANCELLED: { label: 'Đã hủy', color: '#991b1b', next: null },
};

const emptyBook = {
  title: '',
  isbn: '',
  author: '',
  publisher: 'NXB Tổng Hợp',
  price: 89000,
  stock_quantity: 50,
  description: '',
  cover_color: '#1a3d24',
  cover_subtitle: 'NEW EDITION',
  published_year: new Date().getFullYear(),
  status: 'ACTIVE',
  category_id: 1,
};

export default function ShopDashboard({ tab }) {
  const { currentUser, page, refresh, refreshKey } = useApp();
  const activeTab = page.replace('shop-', '') || tab || 'books';

  const [shop, setShop] = useState(null);
  const [books, setBooks] = useState([]);
  const [orders, setOrders] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [cats, setCats] = useState([]);
  const [revenue, setRevenue] = useState({ byMonth: {}, total: 0 });
  const [returnRequests, setReturnRequests] = useState([]);

  // Modals
  const [showBookModal, setShowBookModal] = useState(false);
  const [editBook, setEditBook] = useState(emptyBook);
  const [editBookId, setEditBookId] = useState(null);
  const [replyFbId, setReplyFbId] = useState(null);
  const [replyContent, setReplyContent] = useState('');
  const [shopForm, setShopForm] = useState({ shop_name: '', address: '', description: '' });

  useEffect(() => {
    if (!currentUser) return;
    const s = getShopByUserId(currentUser.user_id);
    setShop(s);
    if (s) {
      setBooks(getBooks(s.shop_id));
      setOrders(getOrders(undefined, s.shop_id));
      setFeedbacks(getFeedbacksByShop(s.shop_id));
      setRevenue(getRevenue(s.shop_id));
      setReturnRequests(getReturnRequests());
      setShopForm({ shop_name: s.shop_name, address: s.address, description: s.description || '' });
    }
    setCats(getCategories());
  }, [currentUser, refreshKey, page]);

  if (!currentUser || !shop) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center text-[#7a6a5a]">
        <h2 className="font-serif font-bold text-xl text-[#1c1612] mb-2">Gian hàng chưa được kích hoạt</h2>
        <p className="text-xs">Tài khoản shop của bạn đang chờ Admin duyệt hoặc chưa thiết lập gian hàng.</p>
      </div>
    );
  }

  const openAddBook = () => {
    setEditBook({ ...emptyBook, category_id: cats[0]?.category_id || 1 });
    setEditBookId(null);
    setShowBookModal(true);
  };

  const openEditBook = (b) => {
    setEditBook({
      title: b.title,
      isbn: b.isbn,
      author: b.author,
      publisher: b.publisher,
      price: b.price,
      stock_quantity: b.stock_quantity,
      description: b.description,
      cover_color: b.cover_color,
      cover_subtitle: b.cover_subtitle || '',
      published_year: b.published_year,
      status: b.status,
      category_id: b.category_id,
    });
    setEditBookId(b.book_id);
    setShowBookModal(true);
  };

  const handleSaveBook = (e) => {
    e.preventDefault();
    if (!editBook.title.trim() || !editBook.author.trim()) return;
    if (editBookId) {
      updateBook(editBookId, editBook);
    } else {
      addBook({ ...editBook, shop_id: shop.shop_id, shop_name: shop.shop_name });
    }
    setShowBookModal(false);
    refresh();
  };

  const handleDeleteBook = (id) => {
    if (!confirm('Bạn có chắc muốn ẩn cuốn sách này khỏi gian hàng?')) return;
    deleteBook(id);
    refresh();
  };

  const handleOrderStatus = (orderId, nextStatus) => {
    updateOrderStatus(orderId, nextStatus);
    refresh();
  };

  const handleReplySubmit = (fbId) => {
    if (!replyContent.trim()) return;
    addResponse(fbId, shop.shop_id, replyContent);
    setReplyFbId(null);
    setReplyContent('');
    refresh();
  };

  const handleReturnAction = (reqId, status) => {
    updateReturnStatus(reqId, status);
    refresh();
  };

  const handleShopSettings = (e) => {
    e.preventDefault();
    updateShop(shop.shop_id, shopForm);
    alert('Đã lưu thông tin gian hàng!');
    refresh();
  };

  const pendingOrders = orders.filter((o) => o.order_status === 'PENDING').length;
  const deliveredOrders = orders.filter((o) => o.order_status === 'DELIVERED').length;

  const inp =
    'w-full p-2.5 bg-[#f3ede4] border border-[#ddd0be] rounded-xl text-xs sm:text-sm text-[#1c1612] focus:outline-none focus:border-[#1a3d24]';

  return (
    <div className="bg-[#faf6f1] min-h-screen text-[#1c1612]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <span className="text-[11px] font-bold text-[#7a6a5a] uppercase tracking-widest block">
              KÊNH QUẢN LÝ NHÀ BÁN HÀNG
            </span>
            <h1 className="font-serif font-extrabold text-3xl text-[#1c1612]">
              {shop.shop_name}
            </h1>
          </div>
          <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3.5 py-1.5 rounded-full">
            ● Gian hàng đang hoạt động
          </span>
        </div>

        {/* 4 Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Tổng số sách', value: `${books.length} cuốn`, color: '#1a3d24' },
            { label: 'Đơn chờ xử lý', value: `${pendingOrders} đơn`, color: '#d97706' },
            { label: 'Đã giao thành công', value: `${deliveredOrders} đơn`, color: '#166534' },
            { label: 'Doanh thu thực nhận', value: fmt(revenue.total), color: '#7c4a2d' },
          ].map((s) => (
            <div
              key={s.label}
              className="bg-white rounded-2xl border border-[#ddd0be] p-5 shadow-xs"
            >
              <span className="text-[11px] font-bold text-[#7a6a5a] uppercase tracking-wider block mb-1">
                {s.label}
              </span>
              <span className="font-serif font-black text-2xl" style={{ color: s.color }}>
                {s.value}
              </span>
            </div>
          ))}
        </div>

        {/* ── TAB: BOOKS ── */}
        {activeTab === 'books' && (
          <div className="bg-white rounded-3xl border border-[#ddd0be] p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#ddd0be]">
              <h2 className="font-serif font-bold text-xl text-[#1c1612]">
                Kho sách của cửa hàng ({books.length})
              </h2>
              <button
                type="button"
                onClick={openAddBook}
                className="bg-[#1a3d24] hover:bg-[#14301c] text-white px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-xs"
              >
                + Đăng bán sách mới
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-[#ddd0be] bg-[#f3ede4] text-[#5a4a3a] font-bold uppercase text-[10px]">
                    <th className="p-3">Bìa & Tựa đề</th>
                    <th className="p-3">Tác giả</th>
                    <th className="p-3">Giá bán</th>
                    <th className="p-3">Tồn kho</th>
                    <th className="p-3">Trạng thái</th>
                    <th className="p-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ddd0be]">
                  {books.map((b) => (
                    <tr key={b.book_id} className="hover:bg-[#faf6f1] transition-colors">
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <BookCover
                            color={b.cover_color}
                            title={b.title}
                            author={b.author}
                            size="xs"
                          />
                          <span className="font-serif font-bold text-xs sm:text-sm text-[#1c1612] line-clamp-1">
                            {b.title}
                          </span>
                        </div>
                      </td>
                      <td className="p-3 text-[#5a4a3a] italic">{b.author}</td>
                      <td className="p-3 font-serif font-bold text-[#1a3d24]">{fmt(b.price)}</td>
                      <td className="p-3 font-bold">{b.stock_quantity} cuốn</td>
                      <td className="p-3">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            b.status === 'ACTIVE'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {b.status}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openEditBook(b)}
                            className="px-2.5 py-1 rounded bg-[#f3ede4] hover:bg-[#e8ddd0] font-bold text-xs text-[#1c1612] cursor-pointer"
                          >
                            Sửa
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteBook(b.book_id)}
                            className="px-2.5 py-1 rounded bg-red-50 hover:bg-red-100 font-bold text-xs text-red-600 cursor-pointer"
                          >
                            Ẩn
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── TAB: ORDERS ── */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl border border-[#ddd0be] p-6 shadow-sm">
              <h2 className="font-serif font-bold text-xl text-[#1c1612] mb-6 pb-3 border-b border-[#ddd0be]">
                Đơn hàng tiếp nhận ({orders.length})
              </h2>

              {orders.length === 0 ? (
                <p className="text-center text-xs text-[#7a6a5a] py-8">Chưa có đơn hàng nào.</p>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => {
                    const sm = ORDER_STATUS_MAP[order.order_status] || {
                      label: order.order_status,
                      color: '#1c1612',
                    };
                    return (
                      <div
                        key={order.order_id}
                        className="bg-[#faf6f1] rounded-2xl border border-[#ddd0be] p-5 flex flex-col md:flex-row md:items-center justify-between gap-4"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-sm text-[#1c1612]">
                              Đơn #{order.order_id}
                            </span>
                            <span
                              className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                              style={{ color: sm.color, backgroundColor: `${sm.color}15` }}
                            >
                              {sm.label}
                            </span>
                            <span className="text-[11px] text-[#7a6a5a]">
                              {new Date(order.created_at).toLocaleDateString('vi-VN')}
                            </span>
                          </div>
                          <p className="text-xs text-[#5a4a3a]">
                            📍 <strong>Giao tới:</strong> {order.shipping_address}
                          </p>
                          <p className="text-xs text-[#5a4a3a]">
                            Sản phẩm:{' '}
                            <span className="font-bold text-[#1c1612]">
                              {order.details.map((d) => `Sách #${d.book_id} (×${d.quantity})`).join(', ')}
                            </span>
                          </p>
                          <span className="font-serif font-bold text-sm text-[#1a3d24]">
                            Doanh thu đơn: {fmt(order.total_amount)} ({order.payment_method})
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          {order.order_status === 'PENDING' && (
                            <button
                              type="button"
                              onClick={() => handleOrderStatus(order.order_id, 'CANCELLED')}
                              className="px-3.5 py-1.5 rounded-xl border border-red-300 text-red-600 hover:bg-red-50 text-xs font-bold cursor-pointer"
                            >
                              Từ chối
                            </button>
                          )}
                          {sm.next && (
                            <button
                              type="button"
                              onClick={() => handleOrderStatus(order.order_id, sm.next)}
                              className="px-4 py-2 rounded-xl bg-[#1a3d24] hover:bg-[#14301c] text-white text-xs font-bold uppercase tracking-wider cursor-pointer shadow-xs"
                            >
                              {sm.nextLabel} →
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Return Requests */}
            {returnRequests.length > 0 && (
              <div className="bg-white rounded-3xl border border-[#ddd0be] p-6 shadow-sm">
                <h3 className="font-serif font-bold text-lg text-[#1c1612] mb-4">
                  Yêu cầu đổi trả từ khách hàng ({returnRequests.filter((r) => r.status === 'PENDING').length})
                </h3>
                <div className="space-y-3">
                  {returnRequests
                    .filter((r) => r.status === 'PENDING')
                    .map((req) => (
                      <div
                        key={req.return_request_id}
                        className="p-4 bg-[#fef3c7]/60 border border-amber-300 rounded-2xl flex items-center justify-between gap-4"
                      >
                        <div>
                          <p className="font-bold text-xs text-amber-900">
                            Yêu cầu #{req.return_request_id} (Đơn #{req.order_id}) • Lý do: {req.reason_type}
                          </p>
                          <p className="text-xs text-[#5a4a3a] mt-0.5">"{req.detailed_reason}"</p>
                          <span className="text-[10px] text-[#7a6a5a]">
                            Hoàn tiền: <strong>{fmt(req.refund_amount)}</strong>
                          </span>
                        </div>

                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleReturnAction(req.return_request_id, 'APPROVED')}
                            className="bg-emerald-700 hover:bg-emerald-800 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer"
                          >
                            Đồng ý hoàn
                          </button>
                          <button
                            type="button"
                            onClick={() => handleReturnAction(req.return_request_id, 'REJECTED')}
                            className="border border-red-400 text-red-600 hover:bg-red-50 px-3.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer"
                          >
                            Từ chối
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── TAB: FEEDBACKS ── */}
        {activeTab === 'feedbacks' && (
          <div className="bg-white rounded-3xl border border-[#ddd0be] p-6 shadow-sm">
            <h2 className="font-serif font-bold text-xl text-[#1c1612] mb-6 pb-3 border-b border-[#ddd0be]">
              Đánh giá từ người mua ({feedbacks.length})
            </h2>

            {feedbacks.length === 0 ? (
              <p className="text-center text-xs text-[#7a6a5a] py-8">Chưa có đánh giá nào.</p>
            ) : (
              <div className="space-y-4">
                {feedbacks.map((fb) => (
                  <div
                    key={fb.feedback_id}
                    className="p-5 bg-[#faf6f1] rounded-2xl border border-[#ddd0be]"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <StarRating rating={fb.rating} size={11} />
                      <span className="text-[10px] text-[#7a6a5a]">
                        {new Date(fb.created_at).toLocaleDateString('vi-VN')}
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm text-[#1c1612] leading-relaxed mb-3">
                      "{fb.content}"
                    </p>

                    {/* Responses */}
                    {fb.responses &&
                      fb.responses.map((r) => (
                        <div
                          key={r.response_id}
                          className="bg-[#f3ede4] p-3 rounded-xl border-l-4 border-[#1a3d24] text-xs text-[#3d2b1a] mb-2"
                        >
                          <strong className="text-[#1a3d24] block text-[10px] uppercase">
                            Phản hồi của shop:
                          </strong>
                          <p>{r.content}</p>
                        </div>
                      ))}

                    {(!fb.responses || fb.responses.length === 0) && (
                      <div>
                        {replyFbId === fb.feedback_id ? (
                          <div className="mt-3 space-y-2">
                            <textarea
                              rows={2}
                              value={replyContent}
                              onChange={(e) => setReplyContent(e.target.value)}
                              placeholder="Nhập lời cảm ơn hoặc giải đáp thắc mắc..."
                              className="w-full p-2.5 bg-white border border-[#ddd0be] rounded-xl text-xs focus:outline-none focus:border-[#1a3d24]"
                            />
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => handleReplySubmit(fb.feedback_id)}
                                className="bg-[#1a3d24] hover:bg-[#14301c] text-white px-4 py-1.5 rounded-lg text-xs font-bold cursor-pointer"
                              >
                                Gửi phản hồi
                              </button>
                              <button
                                type="button"
                                onClick={() => setReplyFbId(null)}
                                className="px-3 py-1.5 text-xs text-[#7a6a5a] cursor-pointer"
                              >
                                Hủy
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setReplyFbId(fb.feedback_id);
                              setReplyContent('');
                            }}
                            className="text-xs font-bold text-[#1a3d24] hover:underline cursor-pointer"
                          >
                            + Viết phản hồi cho khách
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── TAB: REVENUE ── */}
        {activeTab === 'revenue' && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl border border-[#ddd0be] p-8 shadow-sm">
              <span className="text-xs font-bold text-[#7a6a5a] uppercase tracking-widest block mb-1">
                TỔNG DOANH THU ĐƠN HOÀN TẤT
              </span>
              <span className="font-serif font-black text-4xl text-[#1a3d24] block mb-6">
                {fmt(revenue.total)}
              </span>

              <h3 className="font-serif font-bold text-base text-[#1c1612] mb-4">
                Phân bổ theo tháng:
              </h3>
              {Object.keys(revenue.byMonth).length === 0 ? (
                <p className="text-xs text-[#7a6a5a]">Chưa phát sinh doanh thu từ đơn hoàn tất.</p>
              ) : (
                <div className="space-y-3">
                  {Object.entries(revenue.byMonth).map(([month, amount]) => {
                    const max = Math.max(...Object.values(revenue.byMonth));
                    const pct = max > 0 ? (amount / max) * 100 : 0;
                    return (
                      <div key={month} className="bg-[#faf6f1] p-4 rounded-xl border border-[#ddd0be]">
                        <div className="flex justify-between text-xs font-bold mb-2">
                          <span>Tháng {month}</span>
                          <span className="text-[#1a3d24]">{fmt(amount)}</span>
                        </div>
                        <div className="h-2.5 bg-[#ddd0be] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#1a3d24] rounded-full transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── TAB: SETTINGS ── */}
        {activeTab === 'settings' && (
          <div className="bg-white rounded-3xl border border-[#ddd0be] p-6 sm:p-10 shadow-sm max-w-2xl">
            <h2 className="font-serif font-bold text-xl text-[#1c1612] mb-6 pb-3 border-b border-[#ddd0be]">
              Cài đặt thông tin gian hàng
            </h2>

            <form onSubmit={handleShopSettings} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#5a4a3a] mb-1">
                  Tên gian hàng
                </label>
                <input
                  type="text"
                  required
                  value={shopForm.shop_name}
                  onChange={(e) => setShopForm((s) => ({ ...s, shop_name: e.target.value }))}
                  className={inp}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#5a4a3a] mb-1">
                  Địa chỉ kho / Trụ sở
                </label>
                <input
                  type="text"
                  required
                  value={shopForm.address}
                  onChange={(e) => setShopForm((s) => ({ ...s, address: e.target.value }))}
                  className={inp}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#5a4a3a] mb-1">
                  Mô tả gian hàng
                </label>
                <textarea
                  rows={4}
                  value={shopForm.description}
                  onChange={(e) => setShopForm((s) => ({ ...s, description: e.target.value }))}
                  className={`${inp} resize-none`}
                />
              </div>

              <button
                type="submit"
                className="bg-[#1a3d24] hover:bg-[#14301c] text-white py-3 px-8 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-sm cursor-pointer"
              >
                Lưu cài đặt
              </button>
            </form>
          </div>
        )}

        {/* ── Book Modal (Add / Edit) ── */}
        {showBookModal && (
          <div
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
            onClick={() => setShowBookModal(false)}
          >
            <div
              className="bg-white rounded-3xl border border-[#ddd0be] max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#ddd0be]">
                <h3 className="font-serif font-bold text-xl text-[#1c1612]">
                  {editBookId ? 'Sửa thông tin sách' : 'Đăng bán sách mới'}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowBookModal(false)}
                  className="text-lg font-bold text-[#7a6a5a] hover:text-[#1c1612] cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveBook} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#5a4a3a] mb-1">Tên sách *</label>
                  <input
                    type="text"
                    required
                    value={editBook.title}
                    onChange={(e) => setEditBook((b) => ({ ...b, title: e.target.value }))}
                    className={inp}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#5a4a3a] mb-1">Tác giả *</label>
                    <input
                      type="text"
                      required
                      value={editBook.author}
                      onChange={(e) => setEditBook((b) => ({ ...b, author: e.target.value }))}
                      className={inp}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#5a4a3a] mb-1">Nhà xuất bản</label>
                    <input
                      type="text"
                      value={editBook.publisher}
                      onChange={(e) => setEditBook((b) => ({ ...b, publisher: e.target.value }))}
                      className={inp}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#5a4a3a] mb-1">Giá bán (đ) *</label>
                    <input
                      type="number"
                      required
                      value={editBook.price}
                      onChange={(e) => setEditBook((b) => ({ ...b, price: Number(e.target.value) }))}
                      className={inp}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#5a4a3a] mb-1">Tồn kho *</label>
                    <input
                      type="number"
                      required
                      value={editBook.stock_quantity}
                      onChange={(e) =>
                        setEditBook((b) => ({ ...b, stock_quantity: Number(e.target.value) }))
                      }
                      className={inp}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#5a4a3a] mb-1">Năm XB</label>
                    <input
                      type="number"
                      value={editBook.published_year}
                      onChange={(e) =>
                        setEditBook((b) => ({ ...b, published_year: Number(e.target.value) }))
                      }
                      className={inp}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#5a4a3a] mb-1">Mã ISBN</label>
                    <input
                      type="text"
                      value={editBook.isbn}
                      onChange={(e) => setEditBook((b) => ({ ...b, isbn: e.target.value }))}
                      className={inp}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#5a4a3a] mb-1">Danh mục</label>
                    <select
                      value={editBook.category_id}
                      onChange={(e) =>
                        setEditBook((b) => ({ ...b, category_id: Number(e.target.value) }))
                      }
                      className={inp}
                    >
                      {cats.map((c) => (
                        <option key={c.category_id} value={c.category_id}>
                          {c.category_name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Color Selector */}
                <div>
                  <label className="block text-xs font-bold text-[#5a4a3a] mb-1.5">
                    Màu bìa sách 3D
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setEditBook((b) => ({ ...b, cover_color: c }))}
                        className={`w-7 h-7 rounded-lg border-2 transition-all cursor-pointer ${
                          editBook.cover_color === c ? 'border-[#1c1612] scale-110' : 'border-transparent'
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#5a4a3a] mb-1">Mô tả sách</label>
                  <textarea
                    rows={3}
                    value={editBook.description}
                    onChange={(e) => setEditBook((b) => ({ ...b, description: e.target.value }))}
                    className={`${inp} resize-none`}
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    className="flex-1 bg-[#1a3d24] hover:bg-[#14301c] text-white py-3 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer shadow-sm"
                  >
                    {editBookId ? 'Lưu thay đổi' : 'Đăng bán sách'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowBookModal(false)}
                    className="px-4 py-3 bg-[#f3ede4] rounded-xl text-xs font-bold text-[#7a6a5a] cursor-pointer"
                  >
                    Hủy
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
