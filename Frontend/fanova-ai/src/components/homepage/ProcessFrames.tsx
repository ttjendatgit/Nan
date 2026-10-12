"use client";

// R6 SM02 "Một thiết kế đi qua xưởng": the frames of one design moving through production. Each
// frame enters with the gesture of its stage, never a crossfade:
//   F1 place · F2 artwork opens from the template's centre · F3 the proof slides in from the left ·
//   F4a the printed sheet comes down from the top · F4b eight fold strips close in from the middle ·
//   F5 the finished fan opens from its pivot (the same fan mask as the FinalCTA).
// Frames are stacked in a sticky frame from 1024px; below that each step carries its own frames.
// Scrolling back runs the same gesture in reverse. Assets: processFrames (A2) in homepageAssets.ts.

import type { CSSProperties } from "react";
import { motion } from "motion/react";
import AssetSlot from "@/components/ui/AssetSlot";
import type { AssetDef } from "@/data/homepageAssets";
import { processFrames } from "@/data/homepageAssets";
import {
  CLIP_FROM,
  CLIP_OPEN,
  DUR_SIGNATURE,
  DUR_WIPE,
  EASE_NAN,
  EASE_NAN_STATE,
  FAN_OPEN_DEG,
  INSTANT,
  PLEAT_FINE,
} from "@/lib/motionTokens";

export type FrameKind = "place" | "center" | "slide" | "top" | "pleat" | "fan";

/** The six frames in production order, with the gesture each one enters with. */
export const FRAMES: { asset: AssetDef; kind: FrameKind }[] = [
  { asset: processFrames.F1, kind: "place" },
  { asset: processFrames.F2, kind: "center" },
  { asset: processFrames.F3, kind: "slide" },
  { asset: processFrames.F4a, kind: "top" },
  { asset: processFrames.F4b, kind: "pleat" },
  { asset: processFrames.F5, kind: "fan" },
];

/** Which frames belong to which step: step 04 (Sản xuất) shows the print, then the fold. */
export const STEP_FRAMES = [[0], [1], [2], [3, 4], [5]];

const FOLD_STRIPS = 8;
const foldPleat = (k: number) => Math.floor(Math.abs(k - (FOLD_STRIPS - 1) / 2));

interface FrameLayerProps {
  asset: AssetDef;
  kind: FrameKind;
  /** Frame reached (or reduced motion): at its final state. Otherwise at its start state. */
  shown: boolean;
  reduce: boolean;
  className?: string;
  style?: CSSProperties;
  sizes?: string;
}

/** One frame with its own entrance. Start states are fixed, so server and client render the same. */
export function FrameLayer({ asset, kind, shown, reduce, className, style, sizes }: FrameLayerProps) {
  const slot = <AssetSlot asset={asset} tone="paper" fill sizes={sizes} />;

  if (kind === "pleat") {
    // The same image cut into eight vertical strips; each strip opens around its own centre, from
    // the middle strips outwards, so the flat sheet reads as gathering into folds.
    return (
      <div className={className} style={style}>
        {Array.from({ length: FOLD_STRIPS }, (_, k) => (
          <motion.div
            key={k}
            className="absolute inset-y-0 overflow-hidden"
            style={{ left: `${(k * 100) / FOLD_STRIPS}%`, width: `${100 / FOLD_STRIPS}%`, originX: 0.5 }}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: shown ? 1 : 0 }}
            transition={reduce ? INSTANT : { duration: 0.48, delay: foldPleat(k) * PLEAT_FINE, ease: EASE_NAN_STATE }}
          >
            <div className="absolute inset-y-0" style={{ left: `${-k * 100}%`, width: `${FOLD_STRIPS * 100}%` }}>
              {slot}
            </div>
          </motion.div>
        ))}
      </div>
    );
  }

  if (kind === "fan") {
    return (
      <motion.div
        className={`fan-mask ${className ?? ""}`}
        style={style}
        initial={{ "--fan-open": "0deg" }}
        animate={{ "--fan-open": shown ? `${FAN_OPEN_DEG}deg` : "0deg" }}
        transition={reduce ? INSTANT : { duration: DUR_SIGNATURE, ease: EASE_NAN }}
      >
        {slot}
      </motion.div>
    );
  }

  const states = {
    place: { from: { opacity: 0, y: 24 }, to: { opacity: 1, y: 0 }, duration: DUR_WIPE, ease: EASE_NAN },
    center: { from: { clipPath: CLIP_FROM.center }, to: { clipPath: CLIP_OPEN }, duration: DUR_WIPE, ease: EASE_NAN_STATE },
    slide: { from: { clipPath: CLIP_FROM.left, x: -16 }, to: { clipPath: CLIP_OPEN, x: 0 }, duration: 0.6, ease: EASE_NAN_STATE },
    top: { from: { clipPath: CLIP_FROM.top }, to: { clipPath: CLIP_OPEN }, duration: 0.7, ease: EASE_NAN_STATE },
  }[kind];

  return (
    <motion.div
      className={className}
      style={style}
      initial={states.from}
      animate={shown ? states.to : states.from}
      transition={reduce ? INSTANT : { duration: states.duration, ease: states.ease }}
    >
      {slot}
    </motion.div>
  );
}

interface ProcessFrameStackProps {
  /** Highest frame reached (-1 = none yet). */
  activeFrame: number;
  reduce: boolean;
}

/**
 * The sticky frame (1024px and up): all six frames stacked in one 4:5 box, each covering the one
 * before. Under reduced motion it rests on the finished fan, with the six stages as a contact
 * sheet below, so nothing depends on watching the transitions.
 */
export function ProcessFrameStack({ activeFrame, reduce }: ProcessFrameStackProps) {
  return (
    // Sits just under the fixed navbar (Navbar publishes --nav-height); capped at 62vh tall so the
    // step list stays longer than the frame and the frame really holds while the steps pass.
    <div className="sticky top-[calc(var(--nav-height,112px)+4vh)] ml-auto w-full max-w-[calc(62vh*0.8)]">
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-paper-deep ring-1 ring-line-on-indigo">
        {FRAMES.map((frame, i) => (
          <FrameLayer
            key={frame.asset.id}
            asset={frame.asset}
            kind={frame.kind}
            shown={reduce || activeFrame >= i}
            reduce={reduce}
            className="absolute inset-0"
            style={{ zIndex: i + 1 }}
            sizes="(min-width: 1024px) 40vw, 1px"
          />
        ))}
      </div>
      {/* Contact sheet, reduced motion only (pure CSS media query: no hydration difference) */}
      <div className="mt-3 hidden grid-cols-6 gap-2 motion-reduce:grid">
        {FRAMES.map((frame) => (
          <AssetSlot key={frame.asset.id} asset={{ ...frame.asset, alt: "" }} tone="paper" sizes="80px" />
        ))}
      </div>
    </div>
  );
}
