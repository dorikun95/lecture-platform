import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "error" | "info";
  className?: string;
}

export function Badge({
  children,
  variant = "default",
  className,
}: BadgeProps) {
  const variants = {
    default: "bg-neutral-50 text-neutral-500 ring-neutral-100",
    success: "bg-emerald-50 text-emerald-600 ring-emerald-100",
    warning: "bg-amber-50 text-amber-600 ring-amber-100",
    error: "bg-red-50 text-red-600 ring-red-100",
    info: "bg-indigo-50 text-indigo-600 ring-indigo-100",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium ring-1 ring-inset",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
