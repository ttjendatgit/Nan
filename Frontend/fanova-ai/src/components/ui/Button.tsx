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
      "bg-[#C6E2FF] text-[#0D131F] hover:bg-[#9ECBFB] shadow-lg shadow-black/30 font-semibold",
    secondary:
      "bg-transparent text-[#C6E2FF] border border-[#2F3542] hover:border-[#539AD3] hover:bg-[#151C28]",
    ghost:
      "bg-transparent text-[#C3C7CD] hover:bg-[#151C28] hover:text-[#FBFBFF]",
  };

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-full px-6 py-3 text-sm transition-all duration-300",
        "focus:outline-none focus:ring-2 focus:ring-[#539AD3] focus:ring-offset-2 focus:ring-offset-[#0D131F]",
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
