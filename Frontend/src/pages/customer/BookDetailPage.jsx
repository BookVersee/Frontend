import React, { useState, useEffect } from "react";
import { ArrowLeft, Star, ShoppingCart, Check, Plus, Minus, Store } from "lucide-react";
import { BookCover } from "../../components/common/BookCover";
import { Btn } from "../../components/common/Btn";
import { Card } from "../../components/common/Card";
import { fmt } from "../../utils/format";
import { bookService } from "../../services/bookService";
import { orderService } from "../../services/orderService";
import { useCart } from "../../contexts/CartContext";

export const BookDetailPage = ({
  book,
  onBack,
}) => {
  const [categories, setCategories] = useState([]);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [reviews, setReviews] = useState([]);
  const { addToCart } = useCart();

  useEffect(() => {
    bookService.getCategories().then(setCategories);
    orderService.getOrders().then((orders) => {
      const revs = orders
        .filter((o) => o.feedback)
        .map((o) => ({
          rating: o.feedback.rating,
          content: o.feedback.content,
          customer: o.feedback.customer || o.customerName,
        }))
        .slice(0, 4);
      setReviews(revs);
    });
  }, [book?.id]);

  const handleAdd = () => {
    addToCart(book, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  const categoryName = categories.find((c) => c.id === book?.categoryId)?.name || "Sách";

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 mb-8 transition-colors font-medium cursor-pointer"
      >
        <ArrowLeft size={16} /> Quay lại trang chủ
      </button>

      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm flex flex-col md:flex-row gap-8">
        <div className="shrink-0 flex justify-center md:justify-start">
          <BookCover book={book} size="lg" />
        </div>

        <div className="flex-1 flex flex-col justify-between">
          <div>
            <span className="inline-block text-xs font-bold text-blue-600 uppercase tracking-wider bg-blue-50 px-3 py-1 rounded-full mb-2">
              {categoryName}
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-2 leading-tight">
              {book?.title}
            </h1>
            <p className="text-slate-600 text-sm font-medium mb-1">
              Tác giả: <span className="text-slate-800 font-semibold">{book?.author}</span>
            </p>
            <p className="text-slate-400 text-xs mb-4">
              Nhà xuất bản: {book?.publisher}
            </p>

            <div className="flex items-center gap-3 mb-5">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    size={16}
                    fill={s <= Math.round(book?.rating || 5) ? "#f59e0b" : "none"}
                    stroke={s <= Math.round(book?.rating || 5) ? "none" : "#cbd5e1"}
                  />
                ))}
              </div>
              <span className="text-sm font-bold text-slate-800">
                {book?.rating}
              </span>
              <span className="text-slate-400 text-xs">
                ({book?.reviewCount} lượt đánh giá)
              </span>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 mb-5">
              <p className="text-xs text-slate-400 mb-1">Giá bán niêm yết</p>
              <p className="text-3xl font-extrabold text-blue-600 tracking-tight">
                {fmt(book?.price || 0)}
              </p>
            </div>

            <div className="space-y-2 mb-5 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <Store size={14} className="text-slate-400" />
                <span>Cung cấp bởi: <strong className="text-slate-800">{book?.shopName}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>
                  Tình trạng:{" "}
                  <strong className={book?.stock > 0 ? "text-emerald-600" : "text-red-500"}>
                    {book?.stock > 0 ? `Còn hàng (${book?.stock} cuốn)` : "Hết hàng"}
                  </strong>
                </span>
              </div>
            </div>

            <p className="text-sm text-slate-600 leading-relaxed mb-6">
              {book?.description}
            </p>
          </div>

          {book?.status !== "OUT_OF_STOCK" && (
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
                  onClick={() => setQty((q) => Math.min(book?.stock || 10, q + 1))}
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

      {/* Reviews Section */}
      {reviews.length > 0 && (
        <div className="mt-10">
          <h2 className="text-xl font-bold text-slate-800 mb-4">
            Đánh giá từ khách hàng đã mua
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {reviews.map((r, i) => (
              <Card key={i} className="p-5">
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
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
