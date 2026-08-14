import React from 'react';

export default function StarRating({ rating = 5.0, count, size = 12, className = '' }) {
  const rounded = Math.round(rating);

  return (
    <div className={`inline-flex items-center gap-1 ${className}`}>
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <svg
            key={i}
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill={i <= rounded ? '#f59e0b' : '#d6c9b8'}
            stroke="none"
          >
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        ))}
      </div>
      <span className="font-bold text-xs text-[#1c1612] ml-0.5">{rating}</span>
      {count !== undefined && (
        <span className="text-[11px] text-[#7a6a5a]">({count.toLocaleString('vi-VN')})</span>
      )}
    </div>
  );
}
