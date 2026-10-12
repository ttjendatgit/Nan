import Image from "next/image";
import { cn } from "@/lib/utils";
import type { AssetDef } from "@/data/homepageAssets";
import type { Tone } from "./tone";

interface AssetSlotProps {
  asset: AssetDef;
  tone?: Tone;
  /** Fill the parent (absolute inset-0) instead of sizing itself by the asset's aspect ratio. */
  fill?: boolean;
  /** Placeholder label runs vertically (tall, narrow slots such as the material strips). */
  vertical?: boolean;
  /** next/image `sizes`. */
  sizes?: string;
  className?: string;
}

const placeholderTone: Record<Tone, string> = {
  indigo: "border-on-indigo-muted/40 bg-indigo-raised text-on-indigo-muted",
  paper: "border-ink-muted/30 bg-paper-deep text-ink-muted",
};

/**
 * The box a homepage asset lives in. With a `src` it renders the image (cover for photographs,
 * contain for cut-outs); without one it renders a labelled R6.2 placeholder in exactly the same
 * box, so crop, layering and animation are built against the final geometry. The placeholder is
 * visibly a placeholder (dashed edge, asset code) and must never ship.
 */
export default function AssetSlot({ asset, tone = "indigo", fill, vertical, sizes = "50vw", className }: AssetSlotProps) {
  const box = cn(fill ? "absolute inset-0" : "relative w-full", "overflow-hidden", className);
  const style = fill ? undefined : { aspectRatio: asset.ratio };

  if (asset.src) {
    return (
      <div className={box} style={style}>
        <Image
          src={asset.src}
          alt={asset.alt}
          fill
          sizes={sizes}
          className={asset.cutout ? "object-contain" : "object-cover"}
        />
      </div>
    );
  }

  return (
    <div
      role={asset.alt ? "img" : undefined}
      aria-label={asset.alt || undefined}
      aria-hidden={asset.alt ? undefined : true}
      className={cn(box, "flex items-center justify-center border border-dashed", placeholderTone[tone])}
      style={style}
      data-placeholder={asset.id}
    >
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none select-none px-2 text-center text-[11px] leading-snug",
          vertical && "[writing-mode:vertical-rl] rotate-180",
        )}
      >
        <span className="block font-semibold tracking-wide">[{asset.id} PLACEHOLDER]</span>
        <span className="block">{asset.subject}</span>
        <span className="block opacity-80">{asset.ratio.replace(" / ", ":")}</span>
      </span>
    </div>
  );
}
