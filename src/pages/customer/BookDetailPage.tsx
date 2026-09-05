import React, { useState, useEffect, useRef } from "react";
import {
  ArrowLeft,
  Star,
  ShoppingCart,
  Check,
  Plus,
  Minus,
  Store,
  MessageSquare,
  CornerDownRight,
  Flag,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  X,
  BookOpen,
} from "lucide-react";
import { Book, Category, OrderFeedback } from "../../types";
import { BookCover } from "../../components/common/BookCover";
import { Btn } from "../../components/common/Btn";
import { Card } from "../../components/common/Card";
import { fmt } from "../../utils/format";
import { bookService } from "../../services/bookService";
import { feedbackService } from "../../services/feedbackService";
import { useCart } from "../../contexts/CartContext";
import { ChatDrawer } from "../../components/chat/ChatDrawer";

interface BookDetailPageProps {
  book: Book;
  onBack: () => void;
  onSelectShop?: (shopId: number | string) => void;
}

export const BookDetailPage: React.FC<BookDetailPageProps> = ({
  book,
  onBack,
  onSelectShop,
}) => {
  const [currentBook, setCurrentBook] = useState<Book>(book);
  const [categories, setCategories] = useState<Category[]>([]);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [reviews, setReviews] = useState<OrderFeedback[]>([]);
  const [chatOpen, setChatOpen] = useState(false);
  const [reportedIds, setReportedIds] = useState<(string | number)[]>([]);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const { addToCart } = useCart();
  const loadedBookIdRef = useRef<string | number | null>(null);

  useEffect(() => {
    // Chống gọi lặp API nếu cùng một cuốn sách
    if (loadedBookIdRef.current === book.id) return;
    loadedBookIdRef.current = book.id;

    bookService.getCategories().then(setCategories);
    
    // 1. Tải thông tin chi tiết đầy đủ của sách (kèm danh sách ảnh)
    bookService.getBookById(book.id).then((detailed) => {
      if (detailed) {
        setCurrentBook(detailed);
      }
    });

    // 2. Tải đánh giá thực tế của sách từ API Database (Không gọi getOrders)
    feedbackService.getBookFeedbacks(book.id).then((feedbacks) => {
      setReviews(feedbacks);
    });
  }, [book.id]);

  const handleAdd = () => {
    addToCart(currentBook, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  const handleReport = async (responseId: string | number) => {
    await feedbackService.reportResponse(responseId, "Phản hồi có nội dung không phù hợp");
    setReportedIds((prev) => [...prev, responseId]);
  };

  const categoryName = categories.find((c) => c.id === currentBook.categoryId)?.name || "Sách";

  // Tổng hợp danh sách tất cả các ảnh của sách (Bìa chính + Các trang đọc thử / Góc chụp)
  const imageList = (currentBook.images && currentBook.images.length > 0)
    ? currentBook.images
    : currentBook.imageUrl
    ? [{ imageUrl: currentBook.imageUrl, isCover: true, displayOrder: 0 }]
    : [];

  const activeImage = imageList[activeImageIndex] || imageList[0];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 mb-6 transition-colors font-medium cursor-pointer"
      >
        <ArrowLeft size={16} /> Quay lại
      </button>

      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm flex flex-col md:flex-row gap-8">
        {/* Left Column: Interactive Multi-Image Gallery */}
        <div className="shrink-0 flex flex-col items-center md:items-start w-full md:w-80">
          {imageList.length > 0 ? (
            <div className="w-full flex flex-col items-center">
              {/* Main Large Image Box */}
              <div className="relative group w-full max-w-[280px] aspect-[3/4] rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 shadow-md flex items-center justify-center">
                <img
                  src={activeImage.imageUrl}
                  alt={currentBook.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />

                {/* Badge Tag */}
                <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                  {activeImage.isCover || activeImageIndex === 0 ? (
                    <span className="px-2.5 py-1 rounded-full bg-emerald-600 text-white text-[11px] font-bold shadow-xs flex items-center gap-1">
                      <Star size={11} className="fill-current" /> Bìa chính
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-full bg-slate-900/80 text-white text-[11px] font-semibold backdrop-blur-xs shadow-xs flex items-center gap-1">
                      <BookOpen size={11} /> Trang đọc thử #{activeImageIndex}
                    </span>
                  )}
                </div>

                {/* Counter Pill */}
                <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full bg-black/60 text-white text-[10px] font-mono backdrop-blur-xs">
                  {activeImageIndex + 1}/{imageList.length}
                </div>

                {/* Full-screen Zoom Click Overlay */}
                <button
                  type="button"
                  onClick={() => setPreviewModalOpen(true)}
                  className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white gap-2 font-medium text-xs cursor-pointer"
                >
                  <Maximize2 size={18} /> Phóng to xem trang đọc thử
                </button>
              </div>

              {/* Thumbnail Gallery Strip */}
              {imageList.length > 1 && (
                <div className="mt-3.5 w-full max-w-[280px]">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                    <span>Thư viện ảnh ({imageList.length})</span>
                    <span className="text-[10px] text-blue-600 font-normal lowercase">Click để đổi ảnh</span>
                  </p>
                  <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-thin">
                    {imageList.map((img, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setActiveImageIndex(idx)}
                        className={`relative shrink-0 w-14 h-18 rounded-xl overflow-hidden border-2 transition-all cursor-pointer bg-slate-100 ${
                          activeImageIndex === idx
                            ? "border-blue-600 ring-2 ring-blue-500/20 shadow-xs scale-105"
                            : "border-slate-200 hover:border-slate-400 opacity-70 hover:opacity-100"
                        }`}
                      >
                        <img
                          src={img.imageUrl}
                          alt={`Thumbnail ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[9px] text-center font-medium py-0.5 leading-none">
                          {idx === 0 ? "Bìa" : `#${idx}`}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="w-full max-w-[280px]">
              <BookCover book={currentBook} size="lg" />
            </div>
          )}
        </div>

        {/* Right Column: Book Details & Actions */}
        <div className="flex-1 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold text-blue-600 uppercase tracking-wider bg-blue-50 px-3 py-1 rounded-full">
                {categoryName}
              </span>
              {currentBook.isbn && (
                <span className="text-xs font-mono text-slate-400">
                  ISBN: {currentBook.isbn}
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-2 leading-tight">
              {currentBook.title}
            </h1>
            <p className="text-slate-600 text-sm font-medium mb-1">
              Tác giả: <span className="text-slate-800 font-semibold">{currentBook.author}</span>
            </p>
            <p className="text-slate-400 text-xs mb-4">
              Nhà xuất bản: {currentBook.publisher} • Năm XB: {currentBook.publishedYear || "Mới nhất"}
            </p>

            <div className="flex items-center gap-3 mb-5">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    size={16}
                    fill={s <= Math.round(currentBook.rating) ? "#f59e0b" : "none"}
                    stroke={s <= Math.round(currentBook.rating) ? "none" : "#cbd5e1"}
                  />
                ))}
              </div>
              <span className="text-sm font-bold text-slate-800">
                {currentBook.rating}
              </span>
              <span className="text-slate-400 text-xs">
                ({currentBook.reviewCount} lượt đánh giá)
              </span>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 mb-5">
              <p className="text-xs text-slate-400 mb-1">Giá bán niêm yết</p>
              <p className="text-3xl font-extrabold text-blue-600 tracking-tight">
                {fmt(currentBook.price)}
              </p>
            </div>

            <div className="space-y-2 mb-5 text-xs text-slate-600">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Store size={14} className="text-slate-400" />
                  <span>
                    Cung cấp bởi:{" "}
                    <button
                      onClick={() => onSelectShop && onSelectShop(currentBook.shopId)}
                      className="text-slate-800 font-bold hover:text-blue-600 underline cursor-pointer"
                    >
                      {currentBook.shopName}
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
                  <strong className={currentBook.stock > 0 ? "text-emerald-600" : "text-red-500"}>
                    {currentBook.stock > 0 ? `Còn hàng (${currentBook.stock} cuốn)` : "Hết hàng"}
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

      {/* Chat Drawer - Chỉ render khi người dùng thực sự bấm Chat với Shop */}
      {chatOpen && (
        <ChatDrawer
          isOpen={chatOpen}
          onClose={() => setChatOpen(false)}
          shopId={currentBook.shopId}
          shopName={currentBook.shopName}
          book={currentBook}
          onSelectBook={(newBook) => {
            setCurrentBook(newBook);
            setChatOpen(false);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        />
      )}

      {/* Full-Screen Image Zoom Modal */}
      {previewModalOpen && activeImage && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-in fade-in duration-200">
          {/* Header Controls */}
          <div className="w-full max-w-4xl flex items-center justify-between text-white mb-3 px-2">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm sm:text-base text-slate-100">
                {currentBook.title}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                ({activeImageIndex + 1}/{imageList.length} ảnh)
              </span>
            </div>
            <button
              onClick={() => setPreviewModalOpen(false)}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          {/* Large Image Preview with Navigation */}
          <div className="relative max-w-3xl max-h-[75vh] flex items-center justify-center">
            {imageList.length > 1 && (
              <button
                onClick={() =>
                  setActiveImageIndex((prev) =>
                    prev > 0 ? prev - 1 : imageList.length - 1
                  )
                }
                className="absolute -left-12 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer hidden sm:flex items-center justify-center"
              >
                <ChevronLeft size={24} />
              </button>
            )}

            <img
              src={activeImage.imageUrl}
              alt="Ảnh phóng to"
              className="max-w-full max-h-[75vh] object-contain rounded-2xl shadow-2xl border border-white/10"
            />

            {imageList.length > 1 && (
              <button
                onClick={() =>
                  setActiveImageIndex((prev) =>
                    prev < imageList.length - 1 ? prev + 1 : 0
                  )
                }
                className="absolute -right-12 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer hidden sm:flex items-center justify-center"
              >
                <ChevronRight size={24} />
              </button>
            )}
          </div>

          {/* Bottom Thumbnails Strip in Zoom Modal */}
          {imageList.length > 1 && (
            <div className="mt-4 flex items-center gap-2 overflow-x-auto max-w-xl p-2 bg-black/40 rounded-2xl border border-white/10 scrollbar-thin">
              {imageList.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`relative w-12 h-16 rounded-lg overflow-hidden border transition-all cursor-pointer ${
                    activeImageIndex === idx
                      ? "border-emerald-400 ring-2 ring-emerald-400/40 scale-105"
                      : "border-white/20 opacity-50 hover:opacity-100"
                  }`}
                >
                  <img
                    src={img.imageUrl}
                    alt={`Thumb ${idx}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
