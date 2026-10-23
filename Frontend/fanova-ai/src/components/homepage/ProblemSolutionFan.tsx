"use client";

// R7a: the fan that carries the Problem → Solution story. One progress value (0..1, from the
// section's scroll) drives everything: the fan turns from nearly closed and plain ("quà tặng đại
// trà") into open, with a custom artwork sweeping across its leaf from the problem side (left) to
// the solution side (right). Layers share one coordinate system (viewBox 400×230, pivot at
// PIVOT): paper pleats, fold lines, sticks + guards, the artwork (clipped to the leaf and to the
// sweep), the rivet. With `src` the vector is replaced by a real cut-out (A1, same framing: pivot
// at the bottom centre) opened through the shared fan mask, so the choreography stays the same.
// Decorative: always aria-hidden; the story is fully told by the text around it.
//
// R10.1: this same fan is the page's protagonist object, so it also has physical states used by
// other sections (defaults keep the Problem/Solution fan exactly as before):
//   leaf   0..1  the paper leaf present (0 = skeleton: sticks and guards only)
//   bare   0..1  sticks run on through the leaf (exposed bamboo)
//   pleat  0..1  fold contrast between pleats (0 = a soft, flat plane: fabric)
//   outline      drawn as a contour only (no fills): the object seen in context
//   hairline     strokes keep their pixel width at any scale (for super-scale, cropped use)

import { useEffect, useId, type CSSProperties } from "react";
import { animate, motion, useMotionValue, useTransform, type MotionValue } from "motion/react";
import { EASE_NAN_STATE } from "@/lib/motionTokens";

const W = 400;
const H = 230;
const PIVOT = { x: 200, y: 212 };
const R_OUT = 192; // leaf outer edge
const R_IN = 74; // leaf inner edge; below it the bare sticks show
const RIBS = 15; // sticks, so 14 pleats
const HALF_CLOSED = 3; // degrees each side of the vertical, nearly shut
const HALF_OPEN = 74; // fully open

/** Brand colours as literal values for SVG fills (mirror of the --color-* tokens in globals.css). */
const PAPER = "#f4efe6"; // --color-paper
const PAPER_DEEP = "#ece3d3"; // --color-paper-deep
const LINE_ON_PAPER = "#d6cbb6"; // --color-line-on-paper
const BAMBOO = "#b6a17b"; // --color-bamboo
const BAMBOO_DEEP = "#735f3e"; // --color-bamboo-deep
const NAVY = "#192b88"; // --color-navy

const rad = (deg: number) => (deg * Math.PI) / 180;
/** Point at radius r, angle a (degrees from the vertical, clockwise), around the pivot. */
const pt = (r: number, a: number) =>
  `${(PIVOT.x + r * Math.sin(rad(a))).toFixed(2)} ${(PIVOT.y - r * Math.cos(rad(a))).toFixed(2)}`;

/** Half-angle of the fan for an openness 0..1. */
const halfAngle = (open: number) => HALF_CLOSED + (HALF_OPEN - HALF_CLOSED) * open;
const ribAngles = (open: number) => {
  const half = halfAngle(open);
  return Array.from({ length: RIBS }, (_, i) => -half + (i * 2 * half) / (RIBS - 1));
};

/** Pleats alternate between two paper tones, which is what reads as folds. */
function pleats(open: number, parity: 0 | 1) {
  const a = ribAngles(open);
  let d = "";
  for (let k = parity; k < RIBS - 1; k += 2) {
    d += `M${pt(R_IN, a[k])}L${pt(R_OUT, a[k])}L${pt(R_OUT, a[k + 1])}L${pt(R_IN, a[k + 1])}Z`;
  }
  return d;
}

/** The whole leaf outline (for clipping the artwork, and as the contour in `outline`). */
function leafOutline(open: number) {
  const a = ribAngles(open);
  let d = `M${pt(R_IN, a[0])}`;
  for (const x of a) d += `L${pt(R_OUT, x)}`;
  for (let i = a.length - 1; i >= 0; i--) d += `L${pt(R_IN, a[i])}`;
  return d + "Z";
}

/** Fold lines over the leaf. */
function folds(open: number) {
  return ribAngles(open)
    .slice(1, -1)
    .map((x) => `M${pt(R_IN, x)}L${pt(R_OUT, x)}`)
    .join("");
}

/** Bare sticks from the pivot to the leaf (or, `bare` 0..1, on through the leaf towards its outer
 *  edge: the exposed-bamboo state), and the two guards along the leaf's outer edges. */
function sticks(open: number, bare = 0) {
  const end = R_IN + (R_OUT - R_IN) * bare;
  return ribAngles(open)
    .map((x) => `M${pt(6, x)}L${pt(end, x)}`)
    .join("");
}
function guards(open: number) {
  const a = ribAngles(open);
  return `M${pt(4, a[0])}L${pt(R_OUT + 2, a[0])}M${pt(4, a[RIBS - 1])}L${pt(R_OUT + 2, a[RIBS - 1])}`;
}

/** The sweep: a sector from the left guard to angle `left + span * sweep`, beyond the leaf. */
function sweepSector(open: number, sweep: number) {
  const half = halfAngle(open) + 2;
  const from = -half;
  const to = from + 2 * half * sweep;
  if (sweep <= 0) return `M${PIVOT.x} ${PIVOT.y}Z`;
  const r = R_OUT + 20;
  return `M${PIVOT.x} ${PIVOT.y}L${pt(r, from)}A${r} ${r} 0 ${to - from > 180 ? 1 : 0} 1 ${pt(r, to)}Z`;
}

interface ProblemSolutionFanProps {
  /** Fan openness, 0 (nearly shut) .. 1 (open). */
  open: MotionValue<number>;
  /** How far the custom artwork has swept across the leaf, 0 (plain) .. 1 (fully designed). */
  sweep: MotionValue<number>;
  /** R10.1 physical states (see the header). Omitted = the Problem/Solution defaults. */
  leaf?: MotionValue<number>;
  bare?: MotionValue<number>;
  pleat?: MotionValue<number>;
  outline?: boolean;
  hairline?: boolean;
  /** Stroke colour for `outline` (defaults to bamboo). */
  outlineColor?: string;
  /** Optional real cut-out (A1, pivot at bottom centre). Replaces the vector, same choreography. */
  src?: string;
  className?: string;
  style?: CSSProperties;
}

export default function ProblemSolutionFan({
  open,
  sweep,
  leaf,
  bare,
  pleat,
  outline = false,
  hairline = false,
  outlineColor = BAMBOO,
  src,
  className,
  style,
}: ProblemSolutionFanProps) {
  // Unique clip ids: several fans can now share a page.
  const uid = `fan${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const one = useMotionValue(1);
  const zero = useMotionValue(0);
  const leafMv = leaf ?? one;
  const bareMv = bare ?? zero;
  const pleatMv = pleat ?? one;

  const evenD = useTransform(open, (o) => pleats(o, 0));
  const oddD = useTransform(open, (o) => pleats(o, 1));
  const leafD = useTransform(open, leafOutline);
  const foldD = useTransform(open, folds);
  const stickD = useTransform([open, bareMv], ([o, b]) => sticks(o as number, b as number));
  const guardD = useTransform(open, guards);
  const sweepD = useTransform([open, sweep], ([o, s]) => sweepSector(o as number, s as number));
  const maskAngle = useTransform(open, (o) => `${halfAngle(o)}deg`);
  const pleatOpacity = useTransform(pleatMv, (p) => p);
  const foldOpacity = useTransform(pleatMv, (p) => 0.35 + 0.65 * p);

  if (src) {
    return (
      <motion.div
        aria-hidden="true"
        className={`fan-mask ${className ?? ""}`}
        style={{ ...style, aspectRatio: `${W} / ${H}`, "--fan-pivot": "50% 92%", "--fan-open": maskAngle } as CSSProperties}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- a decorative cut-out under a CSS mask */}
        <img src={src} alt="" className="h-full w-full object-contain" />
      </motion.div>
    );
  }

  // Stroke widths in viewBox units, or (hairline) in screen pixels at any scale.
  const vfx = hairline ? ("non-scaling-stroke" as const) : undefined;
  const sw = (units: number, px: number) => (hairline ? px : units);

  if (outline) {
    return (
      <svg aria-hidden="true" viewBox={`0 0 ${W} ${H}`} className={className} style={style} focusable="false" fill="none" stroke={outlineColor}>
        <motion.path d={stickD} strokeWidth={sw(1, 1)} vectorEffect={vfx} strokeOpacity={0.7} />
        <motion.path d={leafD} strokeWidth={sw(1, 1)} vectorEffect={vfx} />
        <motion.path d={foldD} strokeWidth={sw(0.6, 1)} vectorEffect={vfx} strokeOpacity={0.45} />
        <motion.path d={guardD} strokeWidth={sw(2, 1.5)} vectorEffect={vfx} strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" viewBox={`0 0 ${W} ${H}`} className={className} style={style} focusable="false">
      <defs>
        <clipPath id={`${uid}-leaf`}>
          <motion.path d={leafD} />
        </clipPath>
        <clipPath id={`${uid}-sweep`}>
          <motion.path d={sweepD} />
        </clipPath>
      </defs>

      {/* Sticks below the leaf (or through it, when bare) */}
      <motion.path d={stickD} stroke={BAMBOO} strokeWidth={sw(3, 3)} vectorEffect={vfx} strokeLinecap="round" fill="none" />

      {/* The leaf: paper, folded (pleat contrast) or soft (fabric); absent in the skeleton */}
      <motion.g style={{ opacity: leafMv }}>
        <motion.path d={evenD} fill={PAPER} />
        <motion.path d={oddD} fill={PAPER} />
        <motion.path d={oddD} fill={PAPER_DEEP} style={{ opacity: pleatOpacity }} />

        {/* The custom artwork, painted on the leaf, revealed by the sweep (problem side → solution side) */}
        <g clipPath={`url(#${uid}-leaf)`}>
          <g clipPath={`url(#${uid}-sweep)`}>
            <rect x="0" y="0" width={W} height={H} fill={PAPER} />
            {/* Placeholder motif until A1/A2 exist: a brand disc, water lines, a seal. Navy on paper
                (DECISIONS.md §1), bamboo-deep only as a fine line or small mark. */}
            <circle cx="268" cy="92" r="24" fill={NAVY} />
            <path d="M44 150 Q 104 112 160 138 T 268 124 T 362 146" fill="none" stroke={NAVY} strokeWidth="2.4" />
            <path d="M58 168 Q 120 136 178 158 T 286 146 T 352 164" fill="none" stroke={NAVY} strokeWidth="1.2" />
            <path d="M96 98 Q 132 64 170 86" fill="none" stroke={BAMBOO_DEEP} strokeWidth="1" />
            <rect x="120" y="112" width="11" height="11" fill={BAMBOO_DEEP} />
          </g>
        </g>

        {/* Folds over the leaf (fainter on a soft fabric plane) */}
        <motion.path d={foldD} stroke={LINE_ON_PAPER} strokeWidth={sw(0.8, 1)} vectorEffect={vfx} fill="none" style={{ opacity: foldOpacity }} />
      </motion.g>

      {/* Guards and rivet */}
      <motion.path d={guardD} stroke={BAMBOO} strokeWidth={sw(4, 4)} vectorEffect={vfx} strokeLinecap="round" fill="none" />
      <circle cx={PIVOT.x} cy={PIVOT.y} r="5" fill={BAMBOO_DEEP} />
      <circle cx={PIVOT.x} cy={PIVOT.y} r="1.8" fill={PAPER} />
    </svg>
  );
}

/** The fan's own box ratio, for its wrapper. */
export const FAN_RATIO = `${W} / ${H}`;
/** Where the pivot sits in the box (transform-origin for scale/rotate around the rivet). */
export const FAN_PIVOT_ORIGIN = { x: PIVOT.x / W, y: PIVOT.y / H };

// ─── R10.1: the object placed in a section ───────────────────────────────────

/** A physical state of the fan; every field 0..1. */
export interface FanStateTarget {
  open: number;
  sweep: number;
  leaf?: number;
  bare?: number;
  pleat?: number;
}

/**
 * Motion values for a fan that moves between physical states. Each change of `target` animates
 * there on the shared tokens (`duration` seconds, --ease-nan-state); under reduced motion, and on
 * the first render, values are simply set, so the server HTML is the target state.
 */
export function useFanState(target: FanStateTarget, reduce: boolean, duration = 0.9) {
  const open = useMotionValue(target.open);
  const sweep = useMotionValue(target.sweep);
  const leaf = useMotionValue(target.leaf ?? 1);
  const bare = useMotionValue(target.bare ?? 0);
  const pleat = useMotionValue(target.pleat ?? 1);
  const key = `${target.open}|${target.sweep}|${target.leaf ?? 1}|${target.bare ?? 0}|${target.pleat ?? 1}`;

  useEffect(() => {
    const pairs: [MotionValue<number>, number][] = [
      [open, target.open],
      [sweep, target.sweep],
      [leaf, target.leaf ?? 1],
      [bare, target.bare ?? 0],
      [pleat, target.pleat ?? 1],
    ];
    if (reduce) {
      pairs.forEach(([mv, v]) => mv.set(v));
      return;
    }
    const controls = pairs.map(([mv, v]) => animate(mv, v, { duration, ease: EASE_NAN_STATE }));
    return () => controls.forEach((c) => c.stop());
    // `key` stands for the target's values; the motion values themselves are stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, reduce, duration]);

  return { open, sweep, leaf, bare, pleat };
}

/**
 * The fan placed by its pivot: `x` / `y` are where the rivet sits in the positioned parent (any
 * CSS length, including off-screen values), `width` the fan's width (super-scale is fine: the
 * section clips it), `rotate` turns it around the rivet. Decorative.
 */
export function FanObject({
  x,
  y,
  width,
  rotate = 0,
  className,
  ...fan
}: Omit<ProblemSolutionFanProps, "style"> & { x: string; y: string; width: string; rotate?: number }) {
  const ox = `${FAN_PIVOT_ORIGIN.x * 100}%`;
  const oy = `${FAN_PIVOT_ORIGIN.y * 100}%`;
  return (
    <div
      aria-hidden="true"
      data-motif
      className={`pointer-events-none absolute ${className ?? ""}`}
      style={{
        left: x,
        top: y,
        width,
        aspectRatio: FAN_RATIO,
        transform: `translate(-${ox}, -${oy}) rotate(${rotate}deg)`,
        transformOrigin: `${ox} ${oy}`,
      }}
    >
      <ProblemSolutionFan {...fan} className="h-full w-full overflow-visible" />
    </div>
  );
}
