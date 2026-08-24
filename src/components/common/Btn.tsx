import React from "react";

interface BtnProps {
  children: React.ReactNode;
  variant?: "primary" | "outline" | "ghost" | "danger";
  onClick?: () => void;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
  color?: string;
  className?: string;
  type?: "button" | "submit" | "reset";
}

export const Btn: React.FC<BtnProps> = ({
  children,
  variant = "primary",
  onClick,
  disabled = false,
  size = "md",
  color,
  className = "",
  type = "button",
}) => {
  const base =
    "inline-flex items-center justify-center gap-1.5 font-medium rounded-xl transition-all cursor-pointer select-none active:scale-[0.98]";
  
  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-5 py-2.5 text-base",
  };

  const variants: Record<string, string> = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow",
    outline: "border border-slate-200 text-slate-700 bg-white hover:bg-slate-50",
    ghost: "text-slate-600 hover:bg-slate-100",
    danger: "bg-red-50 text-red-600 border border-red-200 hover:bg-red-100",
  };

  const dynamicStyle =
    color && variant === "primary"
      ? { backgroundColor: color, borderColor: color }
      : undefined;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${sizes[size]} ${variants[variant]} ${
        disabled ? "opacity-40 cursor-not-allowed pointer-events-none" : ""
      } ${className}`}
      style={dynamicStyle}
    >
      {children}
    </button>
  );
};
