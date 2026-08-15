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
      "bg-[#192B88] text-[#FFFFFF] hover:bg-[#0F1320] shadow-lg shadow-[rgba(25,43,136,0.22)] font-semibold",
    secondary:
      "bg-transparent text-[#192B88] border border-[rgba(15,19,32,0.20)] hover:border-[#192B88] hover:bg-[#192B88]/[0.06]",
    ghost:
      "bg-transparent text-[#0F1320] hover:bg-[#192B88]/[0.08] hover:text-[#192B88]",
  };

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-full px-6 py-3 text-sm transition-all duration-300",
        "focus:outline-none focus:ring-2 focus:ring-[#192B88]/40 focus:ring-offset-2 focus:ring-offset-[#F1F0EA]",
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
