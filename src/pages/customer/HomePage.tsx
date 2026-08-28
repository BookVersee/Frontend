import React, { useState, useEffect, useMemo } from "react";
import { Search, ShoppingCart, Star, BookOpen, Store } from "lucide-react";
import { Book, Category } from "../../types";
import { bookService } from "../../services/bookService";
import { BookCover } from "../../components/common/BookCover";
import { fmt } from "../../utils/format";
import { useCart } from "../../contexts/CartContext";
import { FeaturedShops } from "../../components/customer/FeaturedShops";

interface HomePageProps {
  onSelectBook: (book: Book) => void;
  onGoToCart: () => void;
  onSelectShop?: (shopId: number) => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  onSelectBook,
  onGoToCart,
  onSelectShop,
}) => {
  const [books, setBooks] = useState<Book[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCatId, setSelectedCatId] = useState(0);
  const [loading, setLoading] = useState(true);
  const { cartCount } = useCart();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [catsData, booksData] = await Promise.all([
          bookService.getCategories(),
          bookService.getBooks(),
        ]);
        setCategories(catsData);
        setBooks(booksData);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredBooks = useMemo(() => {
    return books.filter(
      (b) =>
        b.status !== "HIDDEN" &&
        (selectedCatId === 0 || b.categoryId === selectedCatId) &&
        (search === "" ||
          b.title.toLowerCase().includes(search.toLowerCase()) ||
          b.author.toLowerCase().includes(search.toLowerCase()) ||
          b.shopName.toLowerCase().includes(search.toLowerCase()) ||
          (b.isbn && b.isbn.includes(search)))
    );
  }, [books, search, selectedCatId]);

  const handleSelectFeaturedShop = (shopName: string) => {
    setSearch(shopName);
  };

  return (
    <div>
      {/* Search Header Bar */}
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-slate-200 px-6 py-3">
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          <div className="flex-1 relative">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm sách, tác giả, nhà xuất bản, tên shop, mã ISBN..."
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 bg-slate-50 transition-colors"
            />
          </div>
          <button
            onClick={onGoToCart}
            className="relative p-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-all shadow-sm flex items-center justify-center cursor-pointer"
          >
            <ShoppingCart size={18} />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center font-bold">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-5xl mx-auto px-6 py-6">
        {/* Banner */}
        <div
          className="rounded-3xl mb-8 p-8 sm:p-10 text-[#fdf9f5] shadow-lg relative overflow-hidden"
          style={{
            background:
              "linear-gradient(135deg, #3d2b1a 0%, #2a1b0e 100%)",
            border: "1px solid #ddd0be",
          }}
        >
          <div className="relative z-10 max-w-xl">
            <span className="inline-block px-3 py-1 rounded-full bg-[#7c4a2d]/40 text-[#c8843a] text-xs font-bold uppercase tracking-wider mb-3 backdrop-blur-sm">
              Sàn Sách Trực Tuyến Đa Cửa Hàng
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold mb-3 tracking-tight font-serif text-[#fdf9f5]">
              Khám phá thế giới tri thức
            </h1>
            <p className="text-[#b5a898] text-sm sm:text-base leading-relaxed">
              Hàng ngàn đầu sách chính hãng từ các nhà phát hành uy tín nhất Việt
              Nam: Phương Nam, Fahasa, Tiki Sách và nhiều đối tác khác.
            </p>
          </div>
          <div className="absolute -right-10 -bottom-10 w-64 h-64 rounded-full bg-white/5 blur-2xl" />
        </div>

        {/* Categories Bar */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-thin">
          <button
            onClick={() => setSelectedCatId(0)}
            className="px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer"
            style={
              selectedCatId === 0
                ? { backgroundColor: "#7c4a2d", color: "#fdf9f5", boxShadow: "0 2px 8px rgba(124, 74, 45, 0.25)", border: "1px solid #7c4a2d" }
                : { backgroundColor: "#f3ede4", color: "#3d2b1a", border: "1px solid #ddd0be" }
            }
          >
            Tất cả danh mục
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCatId(c.id)}
              className="px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer"
              style={
                selectedCatId === c.id
                  ? { backgroundColor: "#7c4a2d", color: "#fdf9f5", boxShadow: "0 2px 8px rgba(124, 74, 45, 0.25)", border: "1px solid #7c4a2d" }
                  : { backgroundColor: "#f3ede4", color: "#3d2b1a", border: "1px solid #ddd0be" }
              }
            >
              {c.name}
            </button>
          ))}
        </div>

        {/* Books Grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <div
                key={n}
                className="bg-white rounded-2xl border border-slate-200 p-3 h-72 animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredBooks.map((book) => (
              <div
                key={book.id}
                className="bg-white rounded-2xl border border-slate-200 p-3 hover:shadow-md hover:border-blue-300 transition-all group flex flex-col justify-between"
              >
                <div
                  onClick={() => onSelectBook(book)}
                  className="cursor-pointer"
                >
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

                <div className="mt-3 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-1.5">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onSelectShop) onSelectShop(book.shopId);
                      }}
                      className="text-[11px] font-medium text-slate-500 hover:text-blue-600 truncate flex items-center gap-1 cursor-pointer"
                    >
                      <Store size={11} className="text-slate-400" />
                      {book.shopName}
                    </button>
                    <div className="flex items-center gap-1 shrink-0">
                      <Star size={11} fill="#f59e0b" stroke="none" />
                      <span className="text-xs font-semibold text-slate-700">
                        {book.rating}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-blue-600 text-sm sm:text-base">
                      {fmt(book.price)}
                    </span>
                    {book.status === "OUT_OF_STOCK" && (
                      <span className="text-[11px] font-semibold text-red-500 bg-red-50 px-2 py-0.5 rounded-full">
                        Hết hàng
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && filteredBooks.length === 0 && (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 p-8">
            <BookOpen size={48} className="mx-auto mb-3 text-slate-300" />
            <h3 className="font-bold text-slate-700 text-base">
              Không tìm thấy sách phù hợp
            </h3>
            <p className="text-sm text-slate-400 mt-1">
              Vui lòng thử tìm với từ khóa hoặc danh mục khác.
            </p>
          </div>
        )}

        {/* Featured Stores Section */}
        <FeaturedShops onSelectShop={handleSelectFeaturedShop} />
      </div>
    </div>
  );
};
