import { cn } from "@/lib/utils";
import type { Tone } from "./tone";

interface IndexMarkerProps {
  /** Already formatted, e.g. "01". */
  number: string;
  tone?: Tone;
  size?: "sm" | "lg";
  className?: string;
}

const toneClasses: Record<Tone, string> = {
  indigo: "text-bamboo",
  paper: "text-navy",
};

const sizeClasses = {
  sm: "text-lg",
  lg: "text-[1.75rem] md:text-[2rem]",
};

/**
 * Sequence number for a real ordered sequence: the Process steps and the product option groups
 * only (DECISIONS.md). EB Garamond with lining, tabular figures so "01"–"05" line up; no "Step"
 * word, no uppercase, no mono.
 */
export default function IndexMarker({ number, tone = "indigo", size = "lg", className }: IndexMarkerProps) {
  return (
    <span
      className={cn(
        "font-serif font-medium leading-none lining-nums tabular-nums",
        sizeClasses[size],
        toneClasses[tone],
        className,
      )}
    >
      {number}
    </span>
  );
}
