import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

export default function Button({
  children,
  className,
  variant = "primary",
  ...props
}: ButtonProps) {
  const variants: Record<ButtonVariant, string> = {
    primary:
      "bg-[#08337D] text-[#FFFFFF] hover:bg-[#114F99] shadow-lg shadow-[rgba(8,51,125,0.22)] font-semibold",
    secondary:
      "bg-transparent text-[#08337D] border border-[rgba(8,51,125,0.22)] hover:border-[#08337D] hover:bg-[#DCEAF7]",
    ghost:
      "bg-transparent text-[#081426] hover:bg-[#DCEAF7] hover:text-[#08337D]",
  };

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-full px-6 py-3 text-sm transition-all duration-300",
        "focus:outline-none focus:ring-2 focus:ring-[#4A74A7]/50 focus:ring-offset-2 focus:ring-offset-[#FFFFFF]",
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
