import type { CSSProperties, HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { Tone } from "./tone";

interface SectionProps extends HTMLAttributes<HTMLElement> {
  tone: Tone;
  /** Classes for the inner max-width container (the outer <section> takes `className`). */
  innerClassName?: string;
  /**
   * R10 material atmosphere: a paper-fibre texture over the section's canvas (globals.css
   * .nan-material). "quiet" for reading sections, "tactile" for the Material section.
   */
  material?: "quiet" | "tactile";
  /**
   * R10.3: the light the section sits in (globals .nan-atmos): a soft radial light centred on the
   * section's focal object at (x, y), and a side-only vignette. Pass {} for the default position.
   */
  atmosphere?: { x?: string; y?: string };
  /**
   * Decorative layer behind the content (e.g. NanField). Clipped horizontally (never a horizontal
   * scrollbar) but may extend upward into the section above.
   */
  backdrop?: ReactNode;
  /**
   * R10.2/R10.3: a dark-to-dark tonal ease from the section above (e.g. the Hero's --nan-dark into
   * indigo). Cream and navy never blend (that reads as grey fog): those edges stay clean.
   */
  seam?: string;
}

const toneClasses: Record<Tone, string> = {
  indigo: "bg-indigo text-on-indigo",
  paper: "bg-paper text-ink",
};

/**
 * Public page section: background and default text color from the tone, the standard section
 * padding, and the shared max-w-7xl container. Optional atmosphere (texture, light, seam,
 * backdrop); no animation, grid or column layout of its own -- those belong to the section.
 */
export default function Section({
  tone,
  className,
  innerClassName,
  material,
  atmosphere,
  backdrop,
  seam,
  children,
  ...props
}: SectionProps) {
  return (
    <section
      className={cn(
        "relative px-6 py-20 md:py-28",
        toneClasses[tone],
        material && `nan-material nan-material-${tone} nan-material-${material}`,
        className,
      )}
      {...props}
    >
      {atmosphere && (
        <div
          aria-hidden="true"
          className={`nan-atmos nan-atmos-${tone}`}
          style={{ "--gx": atmosphere.x, "--gy": atmosphere.y } as CSSProperties}
        />
      )}
      {seam && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-40"
          style={{ background: `linear-gradient(${seam}, transparent)` }}
        />
      )}
      {backdrop && (
        <div aria-hidden="true" data-backdrop className="pointer-events-none absolute inset-0 overflow-x-clip">
          {backdrop}
        </div>
      )}
      <div className={cn("relative mx-auto max-w-7xl", innerClassName)}>{children}</div>
    </section>
  );
}
