import { cn } from "@/lib/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className, ...props }: InputProps) {
  return (
    <div>
      {label && (
        <label className="block text-[13px] font-medium text-neutral-600 mb-1.5">
          {label}
        </label>
      )}
      <input
        className={cn(
          "w-full px-3.5 py-2 border border-neutral-200 rounded-lg text-sm text-neutral-800 placeholder:text-neutral-300 focus:ring-2 focus:ring-neutral-100 focus:border-neutral-400 outline-none transition-all duration-200",
          error && "border-red-400 focus:ring-red-50 focus:border-red-400",
          className
        )}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function Textarea({ label, error, className, ...props }: TextareaProps) {
  return (
    <div>
      {label && (
        <label className="block text-[13px] font-medium text-neutral-600 mb-1.5">
          {label}
        </label>
      )}
      <textarea
        className={cn(
          "w-full px-3.5 py-2 border border-neutral-200 rounded-lg text-sm text-neutral-800 placeholder:text-neutral-300 focus:ring-2 focus:ring-neutral-100 focus:border-neutral-400 outline-none transition-all duration-200 resize-y",
          error && "border-red-400 focus:ring-red-50 focus:border-red-400",
          className
        )}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}
