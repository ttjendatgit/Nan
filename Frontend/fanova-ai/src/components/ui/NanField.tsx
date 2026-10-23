"use client";

// R10 signature geometry: "architecture derived from a fan". One reusable field of fan ribs and leaf
// arcs radiating from a pivot, drawn as 1px hairlines, oversized and cropped by its section. Ribs
// alternate in strength like the mountain / valley folds of a fan leaf.
//
// Placement uses CSS custom properties on the element (so sections can set them responsively with
// Tailwind arbitrary properties): --nf-x / --nf-y (pivot, relative to the positioned parent),
// --nf-r (radius), --nf-rot (extra rotation). Props give the defaults.
//
// Motion is optional and almost subliminal: `drift` turns the field a few degrees around its pivot
// as the page scrolls past (a motion value; no React state, no rAF loop), only after hydration and
// never under prefers-reduced-motion. `shown` lets a section bring the field in with its own moment.
//
// R10.1 additions (object, not decoration):
//   ribWidth   physical ribs (bamboo sticks, px) instead of hairlines
//   separate   degrees the ribs fan apart from each other as the page scrolls past: the hero fan
//              "leaving part of itself behind". Reduced motion rests at the separated state.
//   axis       the fold axis: a dashed line through the pivot along the sector's centre
//   marks      print registration marks (circle + cross) at given angle / radius points

import { useEffect, useRef, type CSSProperties } from "react";
import { motion, useMotionValue, useReducedMotion, useScroll, useTransform, type MotionValue } from "motion/react";
import { cn } from "@/lib/utils";
import { useHydrated } from "@/lib/useHydrated";
import { EASE_NAN, INSTANT } from "@/lib/motionTokens";

type FieldTone = "indigo" | "paper" | "navy";

interface NanFieldProps {
  /** Pivot, e.g. "75%" / "-34vh". Overridable per breakpoint with [--nf-x:...] / [--nf-y:...]. */
  x?: string;
  y?: string;
  /** Radius of the outermost arc, e.g. "min(115vh, 1050px)". Overridable with [--nf-r:...]. */
  radius?: string;
  /** Sector in degrees, 0 = straight up, clockwise. */
  from: number;
  to: number;
  /** Number of ribs (0 = arcs only). */
  ribs?: number;
  /** Arc radii as fractions of `radius`. */
  arcs?: number[];
  /** Where ribs start, as a fraction of `radius` (the fan's head, left open at the pivot). */
  inner?: number;
  /** Draw the spine (the sector's centre line) a step stronger. */
  spine?: boolean;
  tone?: FieldTone;
  /** Overall opacity of the field (it is decorative: keep it well under the text). */
  opacity?: number;
  /** Degrees the field turns as the page scrolls past it (0 = static). */
  drift?: number;
  /** When given, the field fades in when it turns true (otherwise it is always shown). */
  shown?: boolean;
  /** R10.1: rib stroke width in px (physical bamboo ribs). Default 1 (hairline). */
  ribWidth?: number;
  /** R10.1: degrees the ribs fan apart over the scroll pass. 0 = fixed. */
  separate?: number;
  /** R10.1: dashed fold axis through the pivot. */
  axis?: boolean;
  /** R10.1: registration marks at (angle deg, radius fraction). */
  marks?: { a: number; r: number }[];
  className?: string;
  style?: CSSProperties;
}

const TONE: Record<FieldTone, string> = {
  indigo: "text-bamboo",
  paper: "text-ink",
  navy: "text-on-indigo",
};

const rad = (deg: number) => (deg * Math.PI) / 180;
const pt = (deg: number, r: number) => [Math.sin(rad(deg)) * r, -Math.cos(rad(deg)) * r] as const;
const f = (n: number) => n.toFixed(4);

/** One rib; with `spread` it turns around the pivot by `k * spread` degrees. The endpoints are
 *  computed from the motion value (Motion would rotate an SVG element around its own box, not the
 *  pivot), so the ribs always meet at the pivot and never cross. */
function Rib({ a, inner, width, strong, spread, k }: { a: number; inner: number; width: number; strong: boolean; spread: MotionValue<number>; k: number }) {
  const x1 = useTransform(spread, (s) => f(pt(a + k * s, inner)[0]));
  const y1 = useTransform(spread, (s) => f(pt(a + k * s, inner)[1]));
  const x2 = useTransform(spread, (s) => f(pt(a + k * s, 1)[0]));
  const y2 = useTransform(spread, (s) => f(pt(a + k * s, 1)[1]));
  return (
    <motion.line
      x1={x1}
      y1={y1}
      x2={x2}
      y2={y2}
      strokeOpacity={strong ? 1 : 0.5}
      strokeWidth={width}
      strokeLinecap={width > 1 ? "round" : undefined}
      vectorEffect="non-scaling-stroke"
    />
  );
}

export default function NanField({
  x = "50%",
  y = "50%",
  radius = "60vmax",
  from,
  to,
  ribs = 14,
  arcs = [0.42, 0.72, 1],
  inner = 0.1,
  spine = false,
  tone = "indigo",
  opacity = 0.14,
  drift = 0,
  shown,
  ribWidth = 1,
  separate = 0,
  axis = false,
  marks,
  className,
  style,
}: NanFieldProps) {
  const reduce = Boolean(useReducedMotion());
  const hydrated = useHydrated();
  const ref = useRef<HTMLDivElement>(null);

  // Scroll-linked motion: 0 on the server and during hydration, switched on afterwards unless the
  // reader asked for less motion (then the separation rests at its final state).
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const enabled = useMotionValue(0);
  const settled = useMotionValue(0);
  useEffect(() => {
    enabled.set(hydrated && !reduce ? 1 : 0);
    settled.set(hydrated && reduce ? 1 : 0);
  }, [enabled, settled, hydrated, reduce]);
  const rotate = useTransform(() => (drift === 0 ? 0 : enabled.get() * drift * (scrollYProgress.get() - 0.5) * 2));
  // Separation grows over the first two thirds of the pass, then holds.
  const spread = useTransform(() =>
    separate === 0 ? 0 : separate * Math.max(enabled.get() * Math.min(1, scrollYProgress.get() * 1.5), settled.get()),
  );

  const span = to - from;
  const ribAngles = ribs > 1 ? Array.from({ length: ribs }, (_, i) => from + (span * i) / (ribs - 1)) : ribs === 1 ? [from + span / 2] : [];
  const mid = (ribAngles.length - 1) / 2 || 1;
  const large = Math.abs(span) > 180 ? 1 : 0;

  return (
    <div
      ref={ref}
      aria-hidden="true"
      data-motif
      className={cn("pointer-events-none absolute", TONE[tone], className)}
      style={
        {
          // Props are fallbacks, so classes like md:[--nf-x:75%] can override them per breakpoint.
          left: `var(--nf-x, ${x})`,
          top: `var(--nf-y, ${y})`,
          width: `calc(var(--nf-r, ${radius}) * 2)`,
          height: `calc(var(--nf-r, ${radius}) * 2)`,
          transform: "translate(-50%, -50%) rotate(var(--nf-rot, 0deg))",
          ...style,
        } as CSSProperties
      }
    >
      <motion.div
        className="h-full w-full"
        style={{ rotate }}
        initial={shown === undefined ? false : { opacity: 0 }}
        animate={shown === undefined ? undefined : { opacity: shown ? 1 : 0 }}
        transition={reduce ? INSTANT : { duration: 1.1, ease: EASE_NAN }}
      >
        <svg viewBox="-1 -1 2 2" className="h-full w-full overflow-visible" style={{ opacity }} fill="none" stroke="currentColor">
          {ribAngles.map((a, i) => (
            <Rib key={`r${i}`} a={a} inner={inner} width={ribWidth} strong={i % 2 === 0} spread={spread} k={(i - mid) / mid} />
          ))}
          {arcs.map((r, i) => {
            const [sx, sy] = pt(from, r);
            const [ex, ey] = pt(to, r);
            return (
              <path
                key={`a${i}`}
                d={`M ${f(sx)} ${f(sy)} A ${f(r)} ${f(r)} 0 ${large} 1 ${f(ex)} ${f(ey)}`}
                strokeOpacity={i === arcs.length - 1 ? 1 : 0.7}
                strokeWidth={1}
                vectorEffect="non-scaling-stroke"
              />
            );
          })}
          {spine && (() => {
            const [x1, y1] = pt(from + span / 2, inner);
            const [x2, y2] = pt(from + span / 2, 1);
            return <line x1={f(x1)} y1={f(y1)} x2={f(x2)} y2={f(y2)} strokeWidth={1.5} vectorEffect="non-scaling-stroke" />;
          })()}
          {axis && (() => {
            const [x1, y1] = pt(from + span / 2, 1.04);
            const [x2, y2] = pt(from + span / 2 + 180, 0.2);
            return <line x1={f(x1)} y1={f(y1)} x2={f(x2)} y2={f(y2)} strokeWidth={1} strokeDasharray="6 5" vectorEffect="non-scaling-stroke" />;
          })()}
          {marks?.map((m, i) => {
            const [cx, cy] = pt(m.a, m.r);
            const s = 0.034;
            return (
              <g key={`m${i}`} strokeWidth={1} vectorEffect="non-scaling-stroke">
                <circle cx={f(cx)} cy={f(cy)} r={f(s * 0.55)} vectorEffect="non-scaling-stroke" />
                <line x1={f(cx - s)} y1={f(cy)} x2={f(cx + s)} y2={f(cy)} vectorEffect="non-scaling-stroke" />
                <line x1={f(cx)} y1={f(cy - s)} x2={f(cx)} y2={f(cy + s)} vectorEffect="non-scaling-stroke" />
              </g>
            );
          })}
        </svg>
      </motion.div>
    </div>
  );
}
