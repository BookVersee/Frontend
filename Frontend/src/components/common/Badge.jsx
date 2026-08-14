import React from "react";

export const Badge = ({ label, color, bg, icon, className = "" }) => {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}
      style={{ color, backgroundColor: bg }}
    >
      {icon}
      {label}
    </span>
  );
};
