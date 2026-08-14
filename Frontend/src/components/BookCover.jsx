import React from 'react';

const DIMS = {
  xs: { w: '70px', h: '100px', fs: '9px', subFs: '7px' },
  sm: { w: '110px', h: '160px', fs: '11px', subFs: '8px' },
  md: { w: '100%', h: '260px', fs: '14px', subFs: '10px' },
  lg: { w: '240px', h: '340px', fs: '18px', subFs: '11px' },
};

export default function BookCover({
  color = '#1a3d24',
  title = '',
  author = '',
  subtitle = '',
  textColor,
  size = 'md',
  className = '',
}) {
  const dim = DIMS[size] || DIMS.md;
  const isLight = color === '#f4f4f2' || color === '#ffffff';
  const mainTextColor = textColor || (isLight ? '#1c1612' : '#ffffff');
  const subTextColor = isLight ? '#7a6a5a' : 'rgba(255, 255, 255, 0.75)';

  return (
    <div
      className={`relative rounded-md flex-shrink-0 select-none overflow-hidden transition-all duration-300 group-hover:scale-[1.02] ${className}`}
      style={{
        width: dim.w,
        height: dim.h,
        backgroundColor: color,
        boxShadow:
          '0 12px 24px -6px rgba(0, 0, 0, 0.25), 0 4px 8px -2px rgba(0, 0, 0, 0.15), inset -2px 0 6px rgba(0,0,0,0.2)',
      }}
    >
      {/* 3D Book Spine Overlay on left */}
      <div
        className="absolute left-0 top-0 bottom-0 w-[8px] z-20 pointer-events-none"
        style={{
          background:
            'linear-gradient(to right, rgba(0,0,0,0.3) 0%, rgba(255,255,255,0.2) 40%, rgba(0,0,0,0.15) 100%)',
        }}
      />

      {/* Book Cover Subtle Texture / Lighting */}
      <div
        className="absolute inset-0 z-10 pointer-events-none"
        style={{
          background:
            'radial-gradient(circle at 75% 25%, rgba(255,255,255,0.12) 0%, transparent 60%), linear-gradient(180deg, transparent 40%, rgba(0,0,0,0.25) 100%)',
        }}
      />

      {/* Book Content */}
      <div className="relative z-10 h-full p-3.5 sm:p-4 flex flex-col justify-between pl-4">
        {/* Top Header / Subtitle */}
        <div>
          {subtitle && (
            <p
              className="font-sans font-bold tracking-widest uppercase leading-none opacity-80"
              style={{ fontSize: dim.subFs, color: subTextColor }}
            >
              {subtitle}
            </p>
          )}
          <div
            className="w-8 h-[2px] mt-2 rounded-full opacity-60"
            style={{ backgroundColor: subTextColor }}
          />
        </div>

        {/* Center / Bottom Title & Author */}
        <div>
          <h3
            className="font-serif font-bold leading-snug line-clamp-3 mb-1.5 drop-shadow-xs"
            style={{ fontSize: dim.fs, color: mainTextColor }}
          >
            {title}
          </h3>
          <p
            className="font-sans font-medium line-clamp-1 italic"
            style={{ fontSize: dim.subFs, color: subTextColor }}
          >
            {author}
          </p>
        </div>
      </div>
    </div>
  );
}
