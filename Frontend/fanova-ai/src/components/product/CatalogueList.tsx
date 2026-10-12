"use client";

// R9B/R9C B2B catalogue: the product lines (/products) and the products in a line (?categoryId) as
// editorial rows, not cards and not a gallery. Each row is a 2-column composition at md+ (sides
// alternating, the image about half the row for a line and a little less for a product), a single
// column below md in the order number + name, image, description, facts, CTA. Information comes
// first: name, description, commercial facts and CTA are always visible; the image supports them.
//
// R9C: the text block is top-aligned with the image (it used to be centred on it, which pushed the
// name ~170px down the row), so name, facts and CTA sit together at the top of the composition.
// Every product row exposes the same three facts as a definition list (price, customisation, MOQ),
// so products in a line can be compared slot by slot.
//
// Motion is short and never makes the reader wait: when a row enters the viewport the image
// settles (opacity 0.6 -> 1, scale 0.97 -> 1, 12px), the text rises in 80ms behind it, the bamboo
// hairline draws. All within ~0.5s. Hover / keyboard focus: image 1.03, name 4px, arrow 4px,
// hairline 1.5x. Reduced motion: the same start state on the server and the client, `animate` lands
// every layer on its final state with INSTANT; no hover transform.

import { useId } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import ProductFacts from "@/components/product/ProductFacts";
import IndexMarker from "@/components/ui/IndexMarker";
import { cn } from "@/lib/utils";
import { DUR_WIPE, EASE_NAN, INSTANT } from "@/lib/motionTokens";
import type { ProductFact } from "@/lib/productFacts";

/** What the image slot draws: the catalog image today, an A1 asset when one exists. */
export interface CatalogueMedia {
  src?: string;
  alt: string;
  /** Aspect ratio of the asset. Omit and the row's frame ratio is used. */
  ratio?: string;
  /** Transparent cut-out (A1): still contained, never cropped. */
  cutout?: boolean;
}


export interface CatalogueItem {
  id: string;
  href: string;
  name: string;
  description?: string;
  /** Product rows: the same facts, in the same order, on every row of a list. */
  facts?: ProductFact[];
  /** Line rows: one short line of real data (e.g. "2 sản phẩm"). `null` = still loading; the slot
   *  keeps its height so the row doesn't shift when it arrives. */
  summary?: string | null;
  media: CatalogueMedia;
}

type Density = "category" | "product";

interface CatalogueListProps {
  items: CatalogueItem[];
  /** "category": larger rows for the product lines. "product": tighter rows to scan a line. */
  density: Density;
  ctaLabel: string;
  /** next/image priority for the first image (the page's LCP candidate). */
  priorityFirst?: boolean;
  /** Hairline above the first row. Off when the header above already ends on one. */
  ruleTop?: boolean;
}

// ─── Layout ──────────────────────────────────────────────────────────────────
// Two mirrored compositions; `density` sets column widths, frame, type scale and spacing.

const LAYOUT: Record<
  Density,
  { frame: string; text: [string, string]; image: [string, string]; bleed: [string, string]; name: string; pad: string }
> = {
  category: {
    frame: "3 / 2",
    // [image right, image left]
    text: ["md:col-start-1 md:col-span-5", "md:col-start-8 md:col-span-5"],
    image: ["md:col-start-7 md:col-span-6", "md:col-start-1 md:col-span-6"],
    // One gutter past the container on the image's outer side, at every width.
    bleed: ["-mr-6", "-ml-6"],
    name: "text-4xl md:text-[2.5rem] lg:text-5xl xl:text-[3.5rem]",
    pad: "py-10 md:py-12",
  },
  product: {
    frame: "4 / 3",
    // lg+: a centred pair (text 5 cols against image 5 cols) so short product copy never sits far
    // from its image; md: the wider split.
    text: [
      "md:col-start-1 md:col-span-6 lg:col-start-2 lg:col-span-5",
      "md:col-start-7 md:col-span-6 lg:col-start-7 lg:col-span-5",
    ],
    image: [
      "md:col-start-8 md:col-span-5 lg:col-start-7 lg:col-span-5",
      "md:col-start-1 md:col-span-5 lg:col-start-2 lg:col-span-5",
    ],
    // Bleeds into the page gutter below lg only; the lg+ pair stays inside the container.
    bleed: ["-mr-6 lg:mr-0", "-ml-6 lg:ml-0"],
    name: "text-3xl lg:text-4xl",
    pad: "py-8 md:py-10",
  },
};

/** md+: header and body stack from the top of the image (third row takes the remaining height). */
const ROW_GRID = "grid grid-cols-1 md:grid-cols-12 md:grid-rows-[auto_auto_1fr] md:gap-x-8 lg:gap-x-12";

function rowVariants(reduce: boolean) {
  const t = (base: object) => (reduce ? INSTANT : base);
  return {
    image: {
      hidden: { opacity: 0.6, scale: 0.97, y: 12 },
      shown: { opacity: 1, scale: 1, y: 0, transition: t({ duration: 0.5, ease: EASE_NAN }) },
    },
    text: {
      hidden: { opacity: 0, y: 10 },
      shown: { opacity: 1, y: 0, transition: t({ duration: 0.45, delay: 0.08, ease: EASE_NAN }) },
    },
    rule: {
      hidden: { scaleX: 0 },
      shown: { scaleX: 1, transition: t({ duration: DUR_WIPE, delay: 0.12, ease: EASE_NAN }) },
    },
  };
}

// ─── List ────────────────────────────────────────────────────────────────────

export default function CatalogueList({ items, density, ctaLabel, priorityFirst, ruleTop = true }: CatalogueListProps) {
  return (
    <ol className={cn("overflow-x-clip", ruleTop && "border-t border-line-on-indigo")}>
      {items.map((item, index) => (
        <CatalogueRow
          key={item.id}
          item={item}
          index={index}
          density={density}
          ctaLabel={ctaLabel}
          priority={priorityFirst && index === 0}
        />
      ))}
    </ol>
  );
}

function CatalogueRow({
  item,
  index,
  density,
  ctaLabel,
  priority,
}: {
  item: CatalogueItem;
  index: number;
  density: Density;
  ctaLabel: string;
  priority?: boolean;
}) {
  const reduce = Boolean(useReducedMotion());
  const titleId = useId();
  const descId = useId();
  const v = rowVariants(reduce);
  const layout = LAYOUT[density];
  const side = index % 2; // 0: image right, 1: image left
  const imageRight = side === 0;
  const number = String(index + 1).padStart(2, "0");

  return (
    <motion.li
      initial="hidden"
      whileInView="shown"
      animate={reduce ? "shown" : undefined}
      viewport={{ once: true, amount: 0.25 }}
      className={cn("border-b border-line-on-indigo", layout.pad)}
    >
      {/* R9E: the row is not one invisible link. The CTA is the row's link (one tab stop); the image
          is a mouse shortcut to the same page (out of the tab order and the accessibility tree). The
          row's hover states follow those two links only (group-has), never plain text. */}
      <div className={cn("group", ROW_GRID)}>
        {/* ── Header: number + hairline, name ── */}
        <motion.div variants={v.text} className={cn("md:row-start-1 md:pt-1", layout.text[side])}>
          <div className="flex items-center gap-4">
            <IndexMarker number={number} size="sm" />
            <motion.span aria-hidden="true" variants={v.rule} className="block h-px w-10 origin-left">
              <span className="block h-px w-full origin-left bg-bamboo transition-[scale] duration-(--dur-state) ease-(--ease-nan-ui) group-has-[a:hover]:scale-x-150 group-has-[a:focus-visible]:scale-x-150 motion-reduce:transition-none" />
            </motion.span>
          </div>
          <h2
            id={titleId}
            className={cn("mt-3 font-serif font-medium leading-[1.1] tracking-tight text-on-indigo", layout.name)}
          >
            <span className="inline-block transition-[translate] duration-(--dur-state) ease-(--ease-nan-ui) group-has-[a:hover]:translate-x-1 group-has-[a:focus-visible]:translate-x-1 motion-reduce:transition-none">
              {item.name}
            </span>
          </h2>
        </motion.div>

        {/* ── Image: entry layer > hover layer > media. Bleeds one gutter towards its outer side. ── */}
        <div className={cn("mt-6 md:row-span-3 md:row-start-1 md:mt-0", layout.image[side], layout.bleed[side])}>
          <motion.div variants={v.image}>
            <Link href={item.href} tabIndex={-1} aria-hidden="true" className="block">
            <div className="transition-[scale] duration-500 ease-(--ease-nan-ui) group-has-[a:hover]:scale-[1.03] group-has-[a:focus-visible]:scale-[1.03] motion-reduce:transition-none motion-reduce:group-has-[a:hover]:scale-100 motion-reduce:group-has-[a:focus-visible]:scale-100">
              <CatalogueImage
                media={item.media}
                ratio={item.media.ratio ?? layout.frame}
                // Below md the image bleeds to the viewport edge on its own side; at md+ it sits
                // against the text so the two read as one unit.
                anchor={imageRight ? "md:object-left-top" : "md:object-right-top"}
                priority={priority}
                sizes={density === "category" ? "(min-width: 768px) 50vw, 100vw" : "(min-width: 768px) 42vw, 100vw"}
              />
            </div>
            </Link>
          </motion.div>
        </div>

        {/* ── Body: description, facts / summary, CTA ── */}
        <motion.div variants={v.text} className={cn("mt-6 md:row-start-2 md:mt-4", layout.text[side])}>
          {item.description && (
            <p id={descId} className="max-w-[44ch] text-[0.9375rem] leading-7 text-on-indigo-muted">
              {item.description}
            </p>
          )}

          {item.summary !== undefined && (
            <p className="mt-2 min-h-6 text-sm font-medium text-on-indigo">{item.summary ?? ""}</p>
          )}

          {item.facts && item.facts.length > 0 && <ProductFacts facts={item.facts} layout="strip" className="mt-4" />}

          <Link
            href={item.href}
            className="mt-5 inline-flex min-h-11 items-center gap-2.5 text-sm font-semibold text-on-indigo outline-offset-4 outline-on-indigo focus-visible:outline-1"
          >
            <span className="relative py-1">
              {ctaLabel}
              <span className="sr-only"> {item.name}</span>
              <span aria-hidden="true" className="absolute inset-x-0 -bottom-px h-px bg-bamboo/40" />
              <span
                aria-hidden="true"
                className="absolute inset-x-0 -bottom-px h-px origin-left scale-x-0 bg-bamboo transition-[scale] duration-(--dur-state) ease-(--ease-nan-ui) group-has-[a:hover]:scale-x-100 group-has-[a:focus-visible]:scale-x-100 motion-reduce:transition-none"
              />
            </span>
            <ArrowRight
              size={15}
              strokeWidth={1.5}
              aria-hidden="true"
              className="text-bamboo transition-[translate] duration-(--dur-state) ease-(--ease-nan-ui) group-has-[a:hover]:translate-x-1 group-has-[a:focus-visible]:translate-x-1 motion-reduce:transition-none motion-reduce:group-has-[a:hover]:translate-x-0 motion-reduce:group-has-[a:focus-visible]:translate-x-0"
            />
          </Link>
        </motion.div>
      </div>
    </motion.li>
  );
}

// ─── Image ───────────────────────────────────────────────────────────────────

/**
 * The image in a frame of the row's ratio. Contained, never cropped (photos keep their edge,
 * A1 cut-outs float); no background or border on the frame. Without an image a quiet Nan fan
 * line drawing holds the space so the row keeps its shape.
 */
function CatalogueImage({
  media,
  ratio,
  anchor,
  priority,
  sizes,
}: {
  media: CatalogueMedia;
  ratio: string;
  anchor: string;
  priority?: boolean;
  sizes: string;
}) {
  if (!media.src) {
    return (
      <div aria-hidden="true" className="relative flex w-full items-center justify-center" style={{ aspectRatio: ratio }}>
        <NanFanMark />
      </div>
    );
  }
  return (
    <div className="relative w-full" style={{ aspectRatio: ratio }}>
      <Image src={media.src} alt={media.alt} fill priority={priority} sizes={sizes} className={cn("object-contain", anchor)} />
    </div>
  );
}

/** Fallback when the catalog has no image yet: a line fan from the pivot, in brand tokens. */
export function NanFanMark() {
  return (
    <svg viewBox="0 0 80 80" fill="none" className="h-1/2 w-auto text-on-indigo-muted/40">
      {[
        [12, 28],
        [23, 13],
        [40, 10],
        [57, 13],
        [68, 28],
      ].map(([x, y]) => (
        <line key={`${x}-${y}`} x1="40" y1="70" x2={x} y2={y} stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" />
      ))}
      <path d="M12,28 A32,32 0 0,1 68,28" stroke="currentColor" strokeWidth="0.8" />
      <circle cx="40" cy="70" r="2.5" className="stroke-bamboo" strokeWidth="0.8" />
    </svg>
  );
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

/** Loading state in the list's own shape, no cards. */
export function CatalogueSkeleton({ density, rows = 2, ruleTop = true }: { density: Density; rows?: number; ruleTop?: boolean }) {
  const layout = LAYOUT[density];
  return (
    <div aria-hidden="true" className={cn("animate-pulse motion-reduce:animate-none", ruleTop && "border-t border-line-on-indigo")}>
      {Array.from({ length: rows }).map((_, i) => {
        const side = i % 2;
        return (
          <div key={i} className={cn("border-b border-line-on-indigo", ROW_GRID, layout.pad)}>
            <div className={cn("flex flex-col gap-4 md:row-start-1 md:pt-1", layout.text[side])}>
              <div className="h-4 w-16 bg-indigo-raised" />
              <div className="h-10 w-3/5 bg-indigo-raised" />
            </div>
            <div className={cn("mt-6 md:row-span-3 md:row-start-1 md:mt-0", layout.image[side])}>
              <div className="w-full bg-indigo-raised/70" style={{ aspectRatio: layout.frame }} />
            </div>
            <div className={cn("mt-6 flex flex-col gap-3 md:row-start-2 md:mt-4", layout.text[side])}>
              <div className="h-3 w-4/5 bg-indigo-raised" />
              <div className="h-3 w-2/5 bg-indigo-raised" />
            </div>
          </div>
        );
      })}
    </div>
  );
}
