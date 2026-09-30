import { Fragment } from "react";
import { cn } from "@/lib/utils";
import type { Tone } from "./tone";

interface MetaLineProps {
  /** At most 3 items: DECISIONS.md allows no more than 2 "·" per line. */
  items: string[];
  tone?: Tone;
  className?: string;
}

const MAX_ITEMS = 3;

const toneClasses: Record<Tone, string> = {
  indigo: "text-on-indigo-muted",
  paper: "text-ink-muted",
};

/**
 * Replaces bordered chips/badges with a plain line of words joined by "·", e.g.
 * "Wedding · Resort · Brand Campaign". No background, border, pill or mono.
 */
export default function MetaLine({ items, tone = "indigo", className }: MetaLineProps) {
  if (process.env.NODE_ENV !== "production" && items.length > MAX_ITEMS) {
    console.warn(
      `MetaLine: ${items.length} items given, at most ${MAX_ITEMS} allowed (max 2 "·" per line, docs/redesign/DECISIONS.md).`,
    );
  }

  return (
    <p className={cn("font-serif text-base italic", toneClasses[tone], className)}>
      {items.map((item, i) => (
        <Fragment key={`${item}-${i}`}>
          {i > 0 && <span aria-hidden="true"> · </span>}
          <span>{item}</span>
        </Fragment>
      ))}
    </p>
  );
}
