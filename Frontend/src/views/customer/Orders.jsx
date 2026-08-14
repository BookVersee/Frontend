import React, { useState, useEffect } from 'react';
import { useApp } from '../../context';
import {
  getOrders,
  getBookById,
  cancelOrder,
  addFeedback,
  addReturnRequest,
  getReturnRequests,
  addDispute,
} from '../../store';
import BookCover from '../../components/BookCover';

function fmt(n) {
  return (n || 0).toLocaleString('vi-VN') + 'đ';
}

function fmtDate(s) {
  if (!s) return '';
  return new Date(s).toLocaleDateString('vi-VN');
}

const STATUS_MAP = {
  PENDING: { label: 'Chờ xác nhận', color: '#d97706', bg: '#fef3c7' },
  PAID: { label: 'Đã thanh toán', color: '#1a3d24', bg: '#dcfce7' },
  PROCESSING: { label: 'Đang xử lý', color: '#2563eb', bg: '#dbeafe' },
  SHIPPING: { label: 'Chờ vận chuyển', color: '#7c3aed', bg: '#ede9fe' },
  DELIVERING: { label: 'Đang giao hàng', color: '#0891b2', bg: '#cffafe' },
  DELIVERED: { label: 'Đã giao thành công', color: '#166534', bg: '#dcfce7' },
  CANCELLED: { label: 'Đã hủy', color: '#991b1b', bg: '#fee2e2' },
};

export default function CustomerOrders() {
  const { currentUser, navigate, refresh, refreshKey } = useApp();
  const [orders, setOrders] = useState([]);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [feedbackModal, setFeedbackModal] = useState(null);
  const [returnModal, setReturnModal] = useState(null);
  const [disputeModal, setDisputeModal] = useState(null);
  const [returnRequests, setReturnRequests] = useState([]);
  const [fb, setFb] = useState({ rating: 5, content: '' });
  const [ret, setRet] = useState({ reason_type: 'DAMAGED', detailed_reason: '' });
  const [disp, setDisp] = useState({ issue_type: '', description: '' });
  const [books, setBooks] = useState({});

  useEffect(() => {
    if (!currentUser) return;
    const ords = getOrders(currentUser.user_id);
    setOrders(ords);
    const bks = {};
    ords.flatMap((o) => o.details).forEach((d) => {
      const b = getBookById(d.book_id);
      if (b) bks[d.book_id] = b;
    });
    setBooks(bks);
    if (selectedOrder) {
      const updated = ords.find((o) => o.order_id === selectedOrder.order_id);
      if (updated) setSelectedOrder(updated);
      setReturnRequests(getReturnRequests(selectedOrder.order_id));
    }
  }, [currentUser, refreshKey]);

  if (!currentUser) return null;

  const filtered =
    filterStatus === 'ALL' ? orders : orders.filter((o) => o.order_status === filterStatus);

  const statuses = ['ALL', 'PENDING', 'PROCESSING', 'DELIVERING', 'DELIVERED', 'CANCELLED'];

  const handleCancel = (orderId) => {
    if (!confirm('Bạn có chắc muốn hủy đơn hàng này?')) return;
    cancelOrder(orderId);
    refresh();
  };

  const handleFeedbackSubmit = () => {
    if (!feedbackModal || !fb.content.trim()) return;
    const book = books[feedbackModal.bookId];
    if (!book) return;
    addFeedback({
      shop_id: book.shop_id,
      order_detail_id: feedbackModal.detailId,
      book_id: feedbackModal.bookId,
      user_id: currentUser.user_id,
      rating: fb.rating,
      content: fb.content,
    });
    setFeedbackModal(null);
    setFb({ rating: 5, content: '' });
    refresh();
  };

  const handleReturnSubmit = () => {
    if (!returnModal || !ret.detailed_reason.trim()) return;
    addReturnRequest({
      order_detail_id: returnModal.detailId,
      order_id: returnModal.orderId,
      reason_type: ret.reason_type,
      detailed_reason: ret.detailed_reason,
      refund_amount: returnModal.price,
    });
    setReturnModal(null);
    setRet({ reason_type: 'DAMAGED', detailed_reason: '' });
    refresh();
  };

  const handleDisputeSubmit = () => {
    if (!disputeModal || !disp.issue_type.trim()) return;
    addDispute({
      order_id: disputeModal.order_id,
      user_id: currentUser.user_id,
      issue_type: disp.issue_type,
      description: disp.description,
    });
    setDisputeModal(null);
    setDisp({ issue_type: '', description: '' });
    alert('Khiếu nại của bạn đã được gửi tới Quản trị viên BookVerse để xử lý.');
  };

  return (
    <div className="bg-[#faf6f1] min-h-screen text-[#1c1612]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <span className="text-[11px] font-bold text-[#7a6a5a] uppercase tracking-widest block">
              QUẢN LÝ MUA SẮM
            </span>
            <h1 className="font-serif font-extrabold text-3xl sm:text-4xl text-[#1c1612]">
              Đơn hàng của tôi
            </h1>
          </div>
          <span className="text-xs font-bold text-[#1a3d24] bg-[#1a3d24]/10 px-3.5 py-1.5 rounded-full">
            {orders.length} đơn hàng đã đặt
          </span>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none mb-8">
          {statuses.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setFilterStatus(s)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                filterStatus === s
                  ? 'bg-[#1a3d24] text-white shadow-xs'
                  : 'bg-white border border-[#ddd0be] text-[#7a6a5a] hover:bg-[#f3ede4]'
              }`}
            >
              {s === 'ALL' ? 'Tất cả đơn' : STATUS_MAP[s]?.label || s}
            </button>
          ))}
        </div>

        {/* Orders List */}
        {filtered.length === 0 ? (
          <div className="bg-white rounded-3xl border border-[#ddd0be] p-12 text-center shadow-xs">
            <div className="text-4xl mb-3">📦</div>
            <h3 className="font-serif font-bold text-lg text-[#1c1612]">Không tìm thấy đơn hàng nào</h3>
            <p className="text-xs text-[#7a6a5a] mt-1">Các đơn hàng bạn đặt sẽ được lưu trữ và cập nhật trạng thái tại đây.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((order) => {
              const sm = STATUS_MAP[order.order_status] || {
                label: order.order_status,
                color: '#1c1612',
                bg: '#f3ede4',
              };
              return (
                <div
                  key={order.order_id}
                  className="bg-white rounded-2xl border border-[#ddd0be] overflow-hidden shadow-xs hover:border-[#1a3d24]/30 transition-all p-5 sm:p-6"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#ddd0be]">
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-sm text-[#1c1612]">
                        Đơn #{order.order_id}
                      </span>
                      <span
                        className="text-[11px] font-bold px-2.5 py-0.5 rounded-full"
                        style={{ color: sm.color, backgroundColor: sm.bg }}
                      >
                        {sm.label}
                      </span>
                    </div>
                    <span className="text-xs text-[#7a6a5a] font-medium">
                      Đặt ngày {fmtDate(order.created_at)}
                    </span>
                  </div>

                  {/* Items Preview */}
                  <div className="py-4 flex flex-wrap gap-3 items-center">
                    {order.details.map((det) => {
                      const b = books[det.book_id];
                      if (!b) return null;
                      return (
                        <div
                          key={det.order_detail_id}
                          className="flex items-center gap-2.5 bg-[#f3ede4] p-2 rounded-xl pr-4"
                        >
                          <BookCover
                            color={b.cover_color}
                            title={b.title}
                            author={b.author}
                            size="xs"
                          />
                          <div className="min-w-0">
                            <p className="font-serif font-bold text-xs text-[#1c1612] truncate max-w-[160px]">
                              {b.title}
                            </p>
                            <span className="text-[10px] text-[#7a6a5a]">
                              ×{det.quantity} • {fmt(det.price)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Footer Bar */}
                  <div className="pt-4 border-t border-[#ddd0be] flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <span className="text-xs text-[#7a6a5a] block">
                        Hình thức: {order.payment_method === 'COD' ? 'Tiền mặt (COD)' : 'Chuyển khoản'}
                      </span>
                      <span className="font-serif font-extrabold text-lg text-[#1a3d24]">
                        Tổng tiền: {fmt(order.total_amount)}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedOrder(order);
                          setReturnRequests(getReturnRequests(order.order_id));
                        }}
                        className="px-4 py-2 rounded-xl border border-[#1a3d24] text-[#1a3d24] hover:bg-[#1a3d24] hover:text-white font-bold text-xs transition-all cursor-pointer"
                      >
                        Xem chi tiết đơn
                      </button>

                      {order.order_status === 'PENDING' && (
                        <button
                          type="button"
                          onClick={() => handleCancel(order.order_id)}
                          className="px-4 py-2 rounded-xl border border-red-300 text-red-600 hover:bg-red-50 font-bold text-xs transition-all cursor-pointer"
                        >
                          Hủy đơn
                        </button>
                      )}

                      {order.order_status === 'DELIVERED' && (
                        <button
                          type="button"
                          onClick={() => setDisputeModal(order)}
                          className="px-4 py-2 rounded-xl border border-[#ddd0be] text-[#7a6a5a] hover:text-[#1c1612] font-bold text-xs transition-all cursor-pointer"
                        >
                          Khiếu nại
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Order Detail Modal ── */}
        {selectedOrder && (
          <div
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
            onClick={() => setSelectedOrder(null)}
          >
            <div
              className="bg-white rounded-3xl border border-[#ddd0be] max-w-lg w-full max-h-[85vh] overflow-y-auto p-6 sm:p-8 shadow-2xl space-y-5"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#ddd0be]">
                <div>
                  <h3 className="font-serif font-bold text-xl text-[#1c1612]">
                    Chi tiết đơn #{selectedOrder.order_id}
                  </h3>
                  <span className="text-xs text-[#7a6a5a]">
                    Ngày tạo: {fmtDate(selectedOrder.created_at)}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="text-lg font-bold text-[#7a6a5a] hover:text-[#1c1612] cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="bg-[#f3ede4] p-4 rounded-2xl space-y-1.5 text-xs text-[#5a4a3a]">
                <p>
                  <strong>Địa chỉ giao:</strong> {selectedOrder.shipping_address}
                </p>
                <p>
                  <strong>Ghi chú:</strong> {selectedOrder.note || 'Không có'}
                </p>
                <p>
                  <strong>Thanh toán:</strong> {selectedOrder.payment_method} ({selectedOrder.payment_status})
                </p>
              </div>

              {/* Items Breakdown */}
              <div className="space-y-3">
                <h4 className="font-serif font-bold text-sm text-[#1c1612]">Danh sách sản phẩm:</h4>
                {selectedOrder.details.map((det) => {
                  const b = books[det.book_id];
                  if (!b) return null;
                  const hasReturned = returnRequests.some((r) => r.order_detail_id === det.order_detail_id);
                  return (
                    <div
                      key={det.order_detail_id}
                      className="flex items-center justify-between gap-3 p-3 bg-[#faf6f1] rounded-xl border border-[#ddd0be]"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <BookCover
                          color={b.cover_color}
                          title={b.title}
                          author={b.author}
                          size="xs"
                        />
                        <div className="min-w-0">
                          <p className="font-serif font-bold text-xs text-[#1c1612] truncate max-w-[150px]">
                            {b.title}
                          </p>
                          <span className="text-[11px] text-[#7a6a5a]">
                            ×{det.quantity} • {fmt(det.price)}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-1.5 items-end">
                        {selectedOrder.order_status === 'DELIVERED' && (
                          <button
                            type="button"
                            onClick={() =>
                              setFeedbackModal({
                                detailId: det.order_detail_id,
                                bookId: det.book_id,
                              })
                            }
                            className="bg-[#c8843a] hover:bg-[#b07330] text-white px-3 py-1 rounded-lg text-[10px] font-bold cursor-pointer"
                          >
                            Đánh giá
                          </button>
                        )}
                        {selectedOrder.order_status === 'DELIVERED' && !hasReturned && (
                          <button
                            type="button"
                            onClick={() =>
                              setReturnModal({
                                detailId: det.order_detail_id,
                                orderId: selectedOrder.order_id,
                                price: det.price,
                              })
                            }
                            className="border border-red-400 text-red-600 hover:bg-red-50 px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer"
                          >
                            Trả hàng
                          </button>
                        )}
                        {hasReturned && (
                          <span className="text-[10px] text-amber-700 font-bold">
                            Đã gửi yêu cầu đổi trả
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── Feedback Modal ── */}
        {feedbackModal && (
          <div
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
            onClick={() => setFeedbackModal(null)}
          >
            <div
              className="bg-white rounded-3xl border border-[#ddd0be] max-w-md w-full p-6 sm:p-8 shadow-2xl space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="font-serif font-bold text-xl text-[#1c1612]">
                Viết đánh giá sách
              </h3>

              <div>
                <label className="block text-xs font-bold text-[#5a4a3a] mb-1">
                  Mức độ hài lòng
                </label>
                <div className="flex gap-2 text-2xl">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setFb((f) => ({ ...f, rating: s }))}
                      className={`cursor-pointer ${s <= fb.rating ? 'text-amber-500' : 'text-slate-300'}`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#5a4a3a] mb-1">
                  Cảm nhận của bạn về sách & dịch vụ đóng gói
                </label>
                <textarea
                  rows={4}
                  required
                  value={fb.content}
                  onChange={(e) => setFb((f) => ({ ...f, content: e.target.value }))}
                  placeholder="Sách in rõ nét, giấy thơm, giao nhanh..."
                  className="w-full p-3 bg-[#f3ede4] border border-[#ddd0be] rounded-xl text-xs sm:text-sm focus:outline-none focus:border-[#1a3d24] resize-none"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleFeedbackSubmit}
                  disabled={!fb.content.trim()}
                  className="flex-1 bg-[#1a3d24] hover:bg-[#14301c] text-white py-3 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer disabled:opacity-50"
                >
                  Gửi đánh giá
                </button>
                <button
                  type="button"
                  onClick={() => setFeedbackModal(null)}
                  className="px-4 py-3 bg-[#f3ede4] rounded-xl text-xs font-bold text-[#7a6a5a] cursor-pointer"
                >
                  Hủy
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Return Request Modal ── */}
        {returnModal && (
          <div
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
            onClick={() => setReturnModal(null)}
          >
            <div
              className="bg-white rounded-3xl border border-[#ddd0be] max-w-md w-full p-6 sm:p-8 shadow-2xl space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="font-serif font-bold text-xl text-[#1c1612]">
                Yêu cầu trả hàng & Hoàn tiền
              </h3>

              <div>
                <label className="block text-xs font-bold text-[#5a4a3a] mb-1">
                  Lý do đổi trả
                </label>
                <select
                  value={ret.reason_type}
                  onChange={(e) => setRet((r) => ({ ...r, reason_type: e.target.value }))}
                  className="w-full p-2.5 bg-[#f3ede4] border border-[#ddd0be] rounded-xl text-xs focus:outline-none"
                >
                  <option value="DAMAGED">Sách bị rách, gãy bìa, in nhòe</option>
                  <option value="WRONG_ITEM">Giao sai tựa sách</option>
                  <option value="DEFECTIVE">Thiếu trang, lỗi in ấn</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#5a4a3a] mb-1">
                  Mô tả chi tiết tình trạng
                </label>
                <textarea
                  rows={4}
                  required
                  value={ret.detailed_reason}
                  onChange={(e) => setRet((r) => ({ ...r, detailed_reason: e.target.value }))}
                  placeholder="Mô tả cụ thể lỗi phát sinh để shop xử lý đổi hàng hoặc hoàn tiền..."
                  className="w-full p-3 bg-[#f3ede4] border border-[#ddd0be] rounded-xl text-xs sm:text-sm focus:outline-none focus:border-[#1a3d24] resize-none"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleReturnSubmit}
                  disabled={!ret.detailed_reason.trim()}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer disabled:opacity-50"
                >
                  Gửi yêu cầu hoàn
                </button>
                <button
                  type="button"
                  onClick={() => setReturnModal(null)}
                  className="px-4 py-3 bg-[#f3ede4] rounded-xl text-xs font-bold text-[#7a6a5a] cursor-pointer"
                >
                  Hủy
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Dispute Modal ── */}
        {disputeModal && (
          <div
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
            onClick={() => setDisputeModal(null)}
          >
            <div
              className="bg-white rounded-3xl border border-[#ddd0be] max-w-md w-full p-6 sm:p-8 shadow-2xl space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="font-serif font-bold text-xl text-[#1c1612]">
                Khiếu nại đơn hàng #{disputeModal.order_id}
              </h3>

              <div>
                <label className="block text-xs font-bold text-[#5a4a3a] mb-1">
                  Vấn đề cần giải quyết
                </label>
                <input
                  type="text"
                  required
                  value={disp.issue_type}
                  onChange={(e) => setDisp((d) => ({ ...d, issue_type: e.target.value }))}
                  placeholder="Giao hàng chậm, thái độ phục vụ, hoàn tiền..."
                  className="w-full p-2.5 bg-[#f3ede4] border border-[#ddd0be] rounded-xl text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#5a4a3a] mb-1">
                  Mô tả chi tiết tranh chấp
                </label>
                <textarea
                  rows={4}
                  required
                  value={disp.description}
                  onChange={(e) => setDisp((d) => ({ ...d, description: e.target.value }))}
                  placeholder="Trình bày cụ thể diễn biến sự việc để Admin phân xử..."
                  className="w-full p-3 bg-[#f3ede4] border border-[#ddd0be] rounded-xl text-xs sm:text-sm focus:outline-none focus:border-[#1a3d24] resize-none"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleDisputeSubmit}
                  disabled={!disp.issue_type.trim()}
                  className="flex-1 bg-[#1a3d24] hover:bg-[#14301c] text-white py-3 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer disabled:opacity-50"
                >
                  Gửi khiếu nại tới Admin
                </button>
                <button
                  type="button"
                  onClick={() => setDisputeModal(null)}
                  className="px-4 py-3 bg-[#f3ede4] rounded-xl text-xs font-bold text-[#7a6a5a] cursor-pointer"
                >
                  Hủy
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
