import React from "react";

interface BadgeProps {
  label: string;
  color: string;
  bg: string;
  icon?: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ label, color, bg, icon, className = "" }) => {
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
