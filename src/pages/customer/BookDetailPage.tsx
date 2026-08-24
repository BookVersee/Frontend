import React, { useState, useEffect } from "react";
import { ArrowLeft, Star, ShoppingCart, Check, Plus, Minus, Store, MessageSquare, CornerDownRight, Flag } from "lucide-react";
import { Book, Category, OrderFeedback } from "../../types";
import { BookCover } from "../../components/common/BookCover";
import { Btn } from "../../components/common/Btn";
import { Card } from "../../components/common/Card";
import { fmt } from "../../utils/format";
import { bookService } from "../../services/bookService";
import { orderService } from "../../services/orderService";
import { useCart } from "../../contexts/CartContext";
import { ChatDrawer } from "../../components/chat/ChatDrawer";

interface BookDetailPageProps {
  book: Book;
  onBack: () => void;
  onSelectShop?: (shopId: number) => void;
}

export const BookDetailPage: React.FC<BookDetailPageProps> = ({
  book,
  onBack,
  onSelectShop,
}) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [reviews, setReviews] = useState<OrderFeedback[]>([]);
  const [chatOpen, setChatOpen] = useState(false);
  const [reportedIds, setReportedIds] = useState<number[]>([]);
  const { addToCart } = useCart();

  useEffect(() => {
    bookService.getCategories().then(setCategories);
    orderService.getOrders().then((orders) => {
      const revs: OrderFeedback[] = orders
        .filter((o) => o.feedback)
        .map((o) => ({
          id: o.id,
          orderId: o.id,
          rating: o.feedback!.rating,
          content: o.feedback!.content,
          customer: o.feedback!.customer || o.customerName,
          customerName: o.feedback!.customer || o.customerName,
          createdAt: o.feedback!.createdAt,
          type: "SHOP",
          shopReply: o.feedback!.shopReply,
          shopRepliedAt: o.feedback!.shopRepliedAt,
          isReported: o.feedback!.isReported,
        }))
        .slice(0, 4);
      setReviews(revs);
    });
  }, [book.id]);

  const handleAdd = () => {
    addToCart(book, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  const handleReport = async (orderId: number) => {
    await orderService.reportFeedback(orderId, "Phản hồi có nội dung không phù hợp");
    setReportedIds((prev) => [...prev, orderId]);
  };

  const categoryName = categories.find((c) => c.id === book.categoryId)?.name || "Sách";

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 mb-8 transition-colors font-medium cursor-pointer"
      >
        <ArrowLeft size={16} /> Quay lại
      </button>

      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm flex flex-col md:flex-row gap-8">
        <div className="shrink-0 flex justify-center md:justify-start">
          <BookCover book={book} size="lg" />
        </div>

        <div className="flex-1 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold text-blue-600 uppercase tracking-wider bg-blue-50 px-3 py-1 rounded-full">
                {categoryName}
              </span>
              {book.isbn && (
                <span className="text-xs font-mono text-slate-400">
                  ISBN: {book.isbn}
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-2 leading-tight">
              {book.title}
            </h1>
            <p className="text-slate-600 text-sm font-medium mb-1">
              Tác giả: <span className="text-slate-800 font-semibold">{book.author}</span>
            </p>
            <p className="text-slate-400 text-xs mb-4">
              Nhà xuất bản: {book.publisher}
            </p>

            <div className="flex items-center gap-3 mb-5">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    size={16}
                    fill={s <= Math.round(book.rating) ? "#f59e0b" : "none"}
                    stroke={s <= Math.round(book.rating) ? "none" : "#cbd5e1"}
                  />
                ))}
              </div>
              <span className="text-sm font-bold text-slate-800">
                {book.rating}
              </span>
              <span className="text-slate-400 text-xs">
                ({book.reviewCount} lượt đánh giá)
              </span>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 mb-5">
              <p className="text-xs text-slate-400 mb-1">Giá bán niêm yết</p>
              <p className="text-3xl font-extrabold text-blue-600 tracking-tight">
                {fmt(book.price)}
              </p>
            </div>

            <div className="space-y-2 mb-5 text-xs text-slate-600">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Store size={14} className="text-slate-400" />
                  <span>
                    Cung cấp bởi:{" "}
                    <button
                      onClick={() => onSelectShop && onSelectShop(book.shopId)}
                      className="text-slate-800 font-bold hover:text-blue-600 underline cursor-pointer"
                    >
                      {book.shopName}
                    </button>
                  </span>
                </div>
                <button
                  onClick={() => setChatOpen(true)}
                  className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <MessageSquare size={13} /> Chat với Shop
                </button>
              </div>

              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>
                  Tình trạng:{" "}
                  <strong className={book.stock > 0 ? "text-emerald-600" : "text-red-500"}>
                    {book.stock > 0 ? `Còn hàng (${book.stock} cuốn)` : "Hết hàng"}
                  </strong>
                </span>
              </div>
            </div>

            <p className="text-sm text-slate-600 leading-relaxed mb-6">
              {book.description}
            </p>
          </div>

          {book.status !== "OUT_OF_STOCK" && (
            <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center gap-4">
              <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50 overflow-hidden">
                <button
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="p-2.5 hover:bg-slate-200 transition-colors text-slate-600"
                >
                  <Minus size={14} />
                </button>
                <span className="w-10 text-center text-sm font-bold text-slate-800">
                  {qty}
                </span>
                <button
                  onClick={() => setQty((q) => Math.min(book.stock, q + 1))}
                  className="p-2.5 hover:bg-slate-200 transition-colors text-slate-600"
                >
                  <Plus size={14} />
                </button>
              </div>

              <Btn
                onClick={handleAdd}
                size="lg"
                color="#1d4ed8"
                className="flex-1 min-w-[200px]"
              >
                {added ? (
                  <>
                    <Check size={18} /> Đã thêm vào giỏ!
                  </>
                ) : (
                  <>
                    <ShoppingCart size={18} /> Thêm vào giỏ hàng
                  </>
                )}
              </Btn>
            </div>
          )}
        </div>
      </div>

      {/* Reviews & Feedback Response Section */}
      {reviews.length > 0 && (
        <div className="mt-10">
          <h2 className="text-xl font-bold text-slate-800 mb-4">
            Đánh giá & Phản hồi từ Khách hàng
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {reviews.map((r, i) => (
              <Card key={i} className="p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-bold">
                        {r.customer ? r.customer[0] : "K"}
                      </div>
                      <span className="font-semibold text-sm text-slate-800">
                        {r.customer}
                      </span>
                    </div>
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          size={12}
                          fill={s <= r.rating ? "#f59e0b" : "none"}
                          stroke={s <= r.rating ? "none" : "#d1d5db"}
                        />
                      ))}
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    "{r.content}"
                  </p>

                  {/* Shop Response */}
                  {r.shopReply && (
                    <div className="mt-3 p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-bold text-emerald-800 flex items-center gap-1">
                          <CornerDownRight size={12} /> Phản hồi từ {book.shopName}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {r.shopRepliedAt}
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 italic">
                        "{r.shopReply}"
                      </p>
                    </div>
                  )}
                </div>

                {r.shopReply && (
                  <div className="mt-3 pt-2 border-t border-slate-100 text-right">
                    {reportedIds.includes(r.id || i) ? (
                      <span className="text-[11px] text-amber-600 font-semibold">
                        ✓ Đã báo cáo vi phạm lên Admin
                      </span>
                    ) : (
                      <button
                        onClick={() => handleReport(r.id || i)}
                        className="text-[11px] text-slate-400 hover:text-red-500 inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Flag size={11} /> Báo cáo phản hồi
                      </button>
                    )}
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Chat Drawer */}
      <ChatDrawer
        isOpen={chatOpen}
        onClose={() => setChatOpen(false)}
        shopId={book.shopId}
        shopName={book.shopName}
      />
    </div>
  );
};
