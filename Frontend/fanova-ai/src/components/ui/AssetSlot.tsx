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

const emptyTone: Record<Tone, string> = {
  indigo: "bg-indigo-raised text-on-indigo-muted",
  paper: "bg-paper-deep text-ink-muted",
};

/**
 * The box a homepage asset lives in. With a `src` it renders the image (cover for photographs,
 * contain for cut-outs). R10.2: without one it renders a quiet brand surface in exactly the same
 * box (tone fill and a small Nan wordmark), never a labelled or dashed placeholder, so a missing
 * image can never surface debug text. `data-placeholder` stays on the box for QA scripts.
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
      aria-hidden="true"
      className={cn(box, "flex items-center justify-center", emptyTone[tone])}
      style={style}
      data-placeholder={asset.id}
    >
      {!vertical && (
        <span aria-hidden="true" className="pointer-events-none select-none font-serif text-lg italic">
          Nan
        </span>
      )}
    </div>
  );
}
