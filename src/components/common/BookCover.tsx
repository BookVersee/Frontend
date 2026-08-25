import React from "react";
import { Book } from "../../types";

interface BookCoverProps {
  book: Book;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const DIMS = {
  sm: { w: 90, h: 130 },
  md: { w: 130, h: 185 },
  lg: { w: 175, h: 250 },
};

const FONT_SIZES = {
  sm: 9,
  md: 11,
  lg: 13,
};

export const BookCover: React.FC<BookCoverProps> = ({
  book,
  size = "md",
  className = "",
}) => {
  const { w, h } = DIMS[size];
  const fs = FONT_SIZES[size];
  
  // Use coverColor if defined, otherwise default to a book-like brown/blue theme color
  const color = book.coverColor || "#3d2b1a";

  return (
    <div
      className={`shrink-0 relative overflow-hidden transition-transform group-hover:scale-[1.02] ${className}`}
      style={{
        width: w,
        height: h,
        backgroundColor: color,
        borderRadius: 4,
        boxShadow: "3px 4px 12px rgba(0,0,0,0.25), inset -2px 0 8px rgba(0,0,0,0.15)",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(135deg, rgba(255,255,255,0.12) 0%, transparent 50%, rgba(0,0,0,0.22) 100%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 8,
          right: 8,
          bottom: 12,
          top: 12,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        <div style={{ width: "60%", height: 2, backgroundColor: "rgba(255,255,255,0.4)", borderRadius: 1 }} />
        <div>
          <div
            style={{
              fontSize: fs,
              fontFamily: "Playfair Display, serif",
              color: "rgba(255,255,255,0.95)",
              fontWeight: 700,
              lineHeight: 1.3,
              marginBottom: 4,
            }}
            className="line-clamp-3"
          >
            {book.title}
          </div>
          <div
            style={{
              fontSize: fs - 1,
              color: "rgba(255,255,255,0.65)",
              letterSpacing: "0.05em",
              textTransform: "uppercase",
              fontFamily: "Outfit, sans-serif",
            }}
            className="truncate"
          >
            {book.author}
          </div>
        </div>
      </div>
      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 5, background: "rgba(0,0,0,0.2)" }} />
    </div>
  );
};

