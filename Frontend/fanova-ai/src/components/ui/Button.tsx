import Link from "next/link";
import { cn } from "@/lib/utils";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from "react";
import type { Tone } from "./tone";

type ButtonVariant = "primary" | "secondary" | "ghost";

/**
 * Without `tone` the button keeps its original (pre-redesign) styles, so existing callers are
 * unchanged until their section is migrated. With `tone` it uses the R1 tokens and the button
 * rules in docs/redesign/DECISIONS.md; toned buttons come only as primary or secondary.
 */
type StyleProps =
  | { tone?: undefined; variant?: ButtonVariant }
  | { tone: Tone; variant?: "primary" | "secondary" };

/**
 * With `href` it renders as a single Next.js <Link> carrying the same classes, so a navigation CTA
 * is one focusable link instead of a <button> nested inside an <a> (invalid HTML, two tab stops).
 */
type ButtonAsLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & { href: string };
type ButtonAsButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined };

type ButtonProps = StyleProps & (ButtonAsButtonProps | ButtonAsLinkProps);

const legacyVariants: Record<ButtonVariant, string> = {
  primary:
    "bg-[#192B88] text-[#FFFFFF] hover:bg-[#0F1320] shadow-lg shadow-[rgba(25,43,136,0.22)] font-semibold",
  secondary:
    "bg-transparent text-[#192B88] border border-[rgba(15,19,32,0.20)] hover:border-[#192B88] hover:bg-[#192B88]/[0.06]",
  ghost:
    "bg-transparent text-[#0F1320] hover:bg-[#192B88]/[0.08] hover:text-[#192B88]",
};

const legacyFocus =
  "focus:outline-none focus:ring-2 focus:ring-[#192B88]/40 focus:ring-offset-2 focus:ring-offset-[#F1F0EA]";

// No bamboo/gold buttons, no gradient, no glow. Indigo: paper button with ink text, or an
// on-indigo outline. Paper: navy button with light text, or a navy outline.
const tonedVariants: Record<Tone, Record<"primary" | "secondary", string>> = {
  indigo: {
    primary: "bg-paper text-ink font-semibold hover:bg-paper-raised",
    secondary: "border border-on-indigo bg-transparent text-on-indigo hover:bg-on-indigo/10",
  },
  paper: {
    primary: "bg-navy text-on-indigo font-semibold hover:bg-navy/90",
    secondary: "border border-navy bg-transparent text-navy hover:bg-navy/5",
  },
};

const tonedFocus: Record<Tone, string> = {
  indigo: "focus-visible:ring-on-indigo focus-visible:ring-offset-indigo",
  paper: "focus-visible:ring-navy focus-visible:ring-offset-paper",
};

export default function Button({
  children,
  className,
  variant = "primary",
  tone,
  ...props
}: ButtonProps) {
  const toneClasses = tone
    ? cn(
        tonedVariants[tone][variant as "primary" | "secondary"],
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        tonedFocus[tone],
      )
    : cn(legacyVariants[variant], legacyFocus);

  const classes = cn(
    "inline-flex items-center justify-center rounded-full px-6 py-3 text-sm transition-all duration-300",
    toneClasses,
    className
  );

  if (props.href !== undefined) {
    const { href, ...anchorProps } = props as ButtonAsLinkProps;
    return (
      <Link href={href} className={classes} {...anchorProps}>
        {children}
      </Link>
    );
  }

  return (
    <button className={classes} {...(props as ButtonAsButtonProps)}>
      {children}
    </button>
  );
}
