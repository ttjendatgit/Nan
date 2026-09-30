import { cn } from "@/lib/utils";
import type { Tone } from "./tone";

interface RuleProps {
  tone?: Tone;
  className?: string;
}

const toneClasses: Record<Tone, string> = {
  indigo: "border-line-on-indigo",
  paper: "border-line-on-paper",
};

/**
 * Hairline divider between blocks of content. Decorative only: the line tokens are well under the
 * 3:1 that WCAG requires for control borders, so never use this (or its tokens) to outline a
 * button, input or card.
 */
export default function Rule({ tone = "indigo", className }: RuleProps) {
  return <hr className={cn("border-0 border-t", toneClasses[tone], className)} />;
}
