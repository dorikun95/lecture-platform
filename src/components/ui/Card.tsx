import { cn } from "@/lib/utils";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export function Card({ children, className, hover }: CardProps) {
  return (
    <div
      className={cn(
        "bg-white border border-neutral-100 rounded-xl p-5",
        hover &&
          "hover:border-neutral-200 hover:shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-all duration-200",
        className
      )}
    >
      {children}
    </div>
  );
}
