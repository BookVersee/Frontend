import React, { useState, useEffect, useRef } from "react";
import { Store, MapPin, Phone, Star, ArrowLeft, MessageSquare, BookOpen, ShieldCheck } from "lucide-react";
import { Shop, Book } from "../../types";
import { bookService } from "../../services/bookService";
import { BookCover } from "../../components/common/BookCover";
import { Btn } from "../../components/common/Btn";
import { Card } from "../../components/common/Card";
import { fmt } from "../../utils/format";
import { ChatDrawer } from "../../components/chat/ChatDrawer";

interface ShopProfilePageProps {
  shopId: number | string;
  onBack: () => void;
  onSelectBook: (book: Book) => void;
}

export const ShopProfilePage: React.FC<ShopProfilePageProps> = ({
  shopId,
  onBack,
  onSelectBook,
}) => {
  const [shop, setShop] = useState<Shop | null>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [chatOpen, setChatOpen] = useState(false);
  const loadedShopIdRef = useRef<string | number | null>(null);

  useEffect(() => {
    // Chống gọi lặp API nếu cùng một shopId đã nạp
    if (loadedShopIdRef.current === shopId) return;
    loadedShopIdRef.current = shopId;

    setLoading(true);
    Promise.all([
      bookService.getShopProfile(shopId),
      bookService.getBooksByShop(shopId),
    ])
      .then(([sData, bData]) => {
        setShop(sData);
        setBooks(bData);
      })
      .finally(() => setLoading(false));
  }, [shopId]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-12 text-center text-slate-400">
        Đang tải thông tin gian hàng...
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-12 text-center">
        <p className="text-slate-500 mb-4">Không tìm thấy gian hàng này.</p>
        <Btn onClick={onBack} color="#1d4ed8">Quay lại</Btn>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 mb-6 transition-colors font-medium cursor-pointer"
      >
        <ArrowLeft size={16} /> Quay lại
      </button>

      {/* Shop Banner / Header */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold text-2xl shadow-md shrink-0">
              <Store size={32} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">
                  {shop.name}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold flex items-center gap-1">
                  <ShieldCheck size={12} /> Đối tác chính hãng
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-2">
                <span className="flex items-center gap-1">
                  <MapPin size={13} className="text-slate-400" /> {shop.address}
                </span>
                <span className="flex items-center gap-1">
                  <Phone size={13} className="text-slate-400" /> {shop.phone}
                </span>
                <span className="flex items-center gap-1 text-amber-600 font-semibold">
                  <Star size={13} fill="#f59e0b" stroke="none" /> {shop.rating} ({shop.reviewCount} đánh giá)
                </span>
              </div>
              {shop.description && (
                <p className="text-xs text-slate-600 mt-2.5 max-w-2xl leading-relaxed">
                  {shop.description}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Btn
              onClick={() => setChatOpen(true)}
              color="#1d4ed8"
              size="md"
              className="cursor-pointer"
            >
              <MessageSquare size={16} /> Nhắn tin tư vấn
            </Btn>
          </div>
        </div>
      </div>

      {/* Shop Catalog */}
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <BookOpen size={20} className="text-blue-600" />
          Sách đang mở bán ({books.length} đầu sách)
        </h2>
      </div>

      {books.length === 0 ? (
        <Card className="p-12 text-center text-slate-400">
          Gian hàng hiện đang cập nhật thêm sách mới.
        </Card>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {books.map((book) => (
            <button
              key={book.id}
              onClick={() => onSelectBook(book)}
              className="bg-white rounded-2xl border border-slate-200 p-3 text-left hover:shadow-md hover:border-blue-300 transition-all group flex flex-col justify-between cursor-pointer"
            >
              <div>
                <BookCover book={book} size="md" />
                <div className="mt-3">
                  <p className="font-semibold text-slate-800 text-sm leading-snug line-clamp-2 mt-0.5 group-hover:text-blue-600 transition-colors">
                    {book.title}
                  </p>
                  <p className="text-slate-500 text-xs mt-0.5 truncate">
                    {book.author}
                  </p>
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="font-bold text-blue-600 text-sm sm:text-base">
                  {fmt(book.price)}
                </span>
                <div className="flex items-center gap-1">
                  <Star size={11} fill="#f59e0b" stroke="none" />
                  <span className="text-xs font-semibold text-slate-700">{book.rating}</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Chat Drawer */}
      {chatOpen && (
        <ChatDrawer
          isOpen={chatOpen}
          onClose={() => setChatOpen(false)}
          shopId={shop.id}
          shopName={shop.name}
          onSelectBook={onSelectBook}
        />
      )}
    </div>
  );
};
