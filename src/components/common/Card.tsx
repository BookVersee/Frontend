import React from "react";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({ children, className = "", onClick }) => {
  return (
    <div
      onClick={onClick}
      className={`bg-card rounded-2xl border border-slate-200 shadow-sm ${className}`}
    >
      {children}
    </div>
  );
};

