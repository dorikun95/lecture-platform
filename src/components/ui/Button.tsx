"use client";

import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  loading,
  className,
  disabled,
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center gap-1.5 font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer";

  const variants = {
    primary:
      "bg-neutral-900 hover:bg-neutral-800 text-white focus:ring-neutral-300 shadow-sm",
    secondary:
      "bg-white border border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50 text-neutral-600 focus:ring-neutral-200",
    ghost:
      "hover:bg-neutral-50 text-neutral-500 hover:text-neutral-700 focus:ring-neutral-200",
    danger:
      "bg-red-500 hover:bg-red-600 text-white focus:ring-red-300 shadow-sm",
  };

  const sizes = {
    sm: "text-xs px-2.5 py-1.5",
    md: "text-sm px-4 py-2",
    lg: "text-sm px-5 py-2.5",
  };

  return (
    <button
      className={cn(base, variants[variant], sizes[size], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
      {children}
    </button>
  );
}
