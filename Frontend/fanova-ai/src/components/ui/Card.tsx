import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import type { Tone } from "./tone";

interface CardProps extends HTMLAttributes<HTMLElement> {
  /** The tone of the section the card sits on. */
  tone: Tone;
  as?: "div" | "article" | "li";
}

const toneClasses: Record<Tone, string> = {
  indigo: "border-line-on-indigo bg-indigo-raised",
  paper: "border-line-on-paper bg-paper-raised",
};

/**
 * Raised surface for a card or panel: the raised background of its tone with a hairline edge and
 * the site's rounded-lg radius. No shadow, blur or gradient. No padding either, so image cards can
 * run their media edge to edge; pass padding through `className`.
 */
export default function Card({ tone, as: Tag = "div", className, children, ...props }: CardProps) {
  return (
    <Tag className={cn("rounded-lg border", toneClasses[tone], className)} {...props}>
      {children}
    </Tag>
  );
}
