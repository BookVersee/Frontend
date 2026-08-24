import React from "react";
import { Book } from "../../types";

interface BookCoverProps {
  book: Book;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const BookCover: React.FC<BookCoverProps> = ({
  book,
  size = "md",
  className = "",
}) => {
  const dims = {
    sm: "w-14 h-20",
    md: "w-full aspect-[3/4] min-h-[160px]",
    lg: "w-48 sm:w-56 aspect-[3/4.2]",
  };

  return (
    <div
      className={`${dims[size]} rounded-xl flex flex-col justify-end p-3 shrink-0 shadow-sm relative overflow-hidden transition-transform group-hover:scale-[1.02] ${className}`}
      style={{
        background: `linear-gradient(135deg, ${book.coverColor || "#1e3a5f"} 0%, ${
          book.coverColor2 || "#2563eb"
        } 100%)`,
      }}
    >
      <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-white/20 blur-[1px]" />
      <div className="relative z-10">
        <p className="text-white text-xs font-bold leading-tight line-clamp-3 drop-shadow-sm">
          {book.title}
        </p>
        <p className="text-white/80 text-[11px] mt-1 truncate">
          {book.author}
        </p>
      </div>
    </div>
  );
};
