import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import type { Tone } from "./tone";

interface SectionProps extends HTMLAttributes<HTMLElement> {
  tone: Tone;
  /** Classes for the inner max-width container (the outer <section> takes `className`). */
  innerClassName?: string;
}

const toneClasses: Record<Tone, string> = {
  indigo: "bg-indigo text-on-indigo",
  paper: "bg-paper text-ink",
};

/**
 * Public page section: background and default text color from the tone, the standard section
 * padding, and the shared max-w-7xl container. Deliberately nothing else -- no animation, no grid
 * or decoration, no column layout; those belong to the section that uses it.
 */
export default function Section({ tone, className, innerClassName, children, ...props }: SectionProps) {
  return (
    <section className={cn("relative px-6 py-20 md:py-28", toneClasses[tone], className)} {...props}>
      <div className={cn("relative mx-auto max-w-7xl", innerClassName)}>{children}</div>
    </section>
  );
}
