"use client";

// R7a: the fan that carries the Problem → Solution story. One progress value (0..1, from the
// section's scroll) drives everything: the fan turns from nearly closed and plain ("quà tặng đại
// trà") into open, with a custom artwork sweeping across its leaf from the problem side (left) to
// the solution side (right). Layers share one coordinate system (viewBox 400×230, pivot at
// PIVOT): paper pleats, fold lines, sticks + guards, the artwork (clipped to the leaf and to the
// sweep), the rivet. With `src` the vector is replaced by a real cut-out (A1, same framing: pivot
// at the bottom centre) opened through the shared fan mask, so the choreography stays the same.
// Decorative: always aria-hidden; the story is fully told by the text around it.

import type { CSSProperties } from "react";
import { motion, useTransform, type MotionValue } from "motion/react";

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

/** The whole leaf outline (for clipping the artwork). */
function leaf(open: number) {
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

/** Bare sticks from the pivot to the leaf, and the two guards along the leaf's outer edges. */
function sticks(open: number) {
  return ribAngles(open)
    .map((x) => `M${pt(6, x)}L${pt(R_IN, x)}`)
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
  /** Optional real cut-out (A1, pivot at bottom centre). Replaces the vector, same choreography. */
  src?: string;
  className?: string;
  style?: CSSProperties;
}

export default function ProblemSolutionFan({ open, sweep, src, className, style }: ProblemSolutionFanProps) {
  const evenD = useTransform(open, (o) => pleats(o, 0));
  const oddD = useTransform(open, (o) => pleats(o, 1));
  const leafD = useTransform(open, leaf);
  const foldD = useTransform(open, folds);
  const stickD = useTransform(open, sticks);
  const guardD = useTransform(open, guards);
  const sweepD = useTransform([open, sweep], ([o, s]) => sweepSector(o as number, s as number));
  const maskAngle = useTransform(open, (o) => `${halfAngle(o)}deg`);

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

  return (
    <svg aria-hidden="true" viewBox={`0 0 ${W} ${H}`} className={className} style={style} focusable="false">
      <defs>
        <clipPath id="ps-fan-leaf">
          <motion.path d={leafD} />
        </clipPath>
        <clipPath id="ps-fan-sweep">
          <motion.path d={sweepD} />
        </clipPath>
      </defs>

      {/* Sticks below the leaf */}
      <motion.path d={stickD} stroke={BAMBOO} strokeWidth={3} strokeLinecap="round" fill="none" />

      {/* The leaf: plain paper, folded */}
      <motion.path d={evenD} fill={PAPER} />
      <motion.path d={oddD} fill={PAPER_DEEP} />

      {/* The custom artwork, painted on the leaf, revealed by the sweep (problem side → solution side) */}
      <g clipPath="url(#ps-fan-leaf)">
        <g clipPath="url(#ps-fan-sweep)">
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

      {/* Folds, guards, rivet */}
      <motion.path d={foldD} stroke={LINE_ON_PAPER} strokeWidth={0.8} fill="none" />
      <motion.path d={guardD} stroke={BAMBOO} strokeWidth={4} strokeLinecap="round" fill="none" />
      <circle cx={PIVOT.x} cy={PIVOT.y} r="5" fill={BAMBOO_DEEP} />
      <circle cx={PIVOT.x} cy={PIVOT.y} r="1.8" fill={PAPER} />
    </svg>
  );
}

/** The fan's own box ratio, for its wrapper. */
export const FAN_RATIO = `${W} / ${H}`;
/** Where the pivot sits in the box (transform-origin for scale/rotate around the rivet). */
export const FAN_PIVOT_ORIGIN = { x: PIVOT.x / W, y: PIVOT.y / H };
