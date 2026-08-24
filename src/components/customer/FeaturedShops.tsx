import React from "react";
import { ChevronRight, BookOpen, Shield, Sparkles, Award } from "lucide-react";

interface FeaturedShop {
  id: number;
  name: string;
  bookCount: string;
  rating: number;
  iconBg: string;
  iconColor: string;
  icon: React.ReactNode;
}

const FEATURED_SHOPS: FeaturedShop[] = [
  {
    id: 1,
    name: "Nhã Nam Books",
    bookCount: "1.4k cuốn sách",
    rating: 4.9,
    iconBg: "bg-amber-600",
    iconColor: "text-white",
    icon: <BookOpen size={16} />,
  },
  {
    id: 2,
    name: "NXB Kim Đồng",
    bookCount: "2.1k cuốn sách",
    rating: 4.8,
    iconBg: "bg-rose-700",
    iconColor: "text-white",
    icon: <Award size={16} />,
  },
  {
    id: 3,
    name: "Omega Plus",
    bookCount: "820 cuốn sách",
    rating: 4.9,
    iconBg: "bg-orange-600",
    iconColor: "text-white",
    icon: <Shield size={16} />,
  },
  {
    id: 4,
    name: "Trí Việt Book",
    bookCount: "1.2k cuốn sách",
    rating: 4.7,
    iconBg: "bg-amber-700",
    iconColor: "text-white",
    icon: <Sparkles size={16} />,
  },
];

interface FeaturedShopsProps {
  onSelectShop?: (shopName: string) => void;
}

export const FeaturedShops: React.FC<FeaturedShopsProps> = ({ onSelectShop }) => {
  return (
    <section className="mt-12 mb-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800 tracking-tight font-serif">
          Gian hàng nổi bật
        </h2>
        <p className="text-slate-500 text-xs sm:text-sm mt-1">
          Đối tác phân phối sách chính hãng uy tín chất lượng nhất trên hệ thống BookVerse
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {FEATURED_SHOPS.map((shop) => (
          <button
            key={shop.id}
            type="button"
            onClick={() => onSelectShop && onSelectShop(shop.name)}
            className="bg-white rounded-2xl border border-slate-200/80 p-4 flex items-center justify-between hover:shadow-md hover:border-slate-300 transition-all text-left group cursor-pointer"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div
                className={`w-11 h-11 rounded-full ${shop.iconBg} ${shop.iconColor} flex items-center justify-center shrink-0 shadow-xs`}
              >
                {shop.icon}
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-slate-800 text-sm truncate group-hover:text-blue-600 transition-colors">
                  {shop.name}
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1.5 whitespace-nowrap">
                  <span>{shop.bookCount}</span>
                  <span className="text-slate-300">•</span>
                  <span className="text-amber-500 font-semibold flex items-center gap-0.5">
                    ★ {shop.rating}
                  </span>
                </p>
              </div>
            </div>

            <ChevronRight
              size={18}
              className="text-slate-400 group-hover:text-slate-700 group-hover:translate-x-0.5 transition-all shrink-0 ml-2"
            />
          </button>
        ))}
      </div>
    </section>
  );
};
