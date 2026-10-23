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
import NanField from "@/components/ui/NanField";
import { useHydrated } from "@/lib/useHydrated";
import { FanObject, useFanState, type FanStateTarget } from "./ProblemSolutionFan";
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

// ── R10.1: until the A2 photographs exist, the frames are the page's fan being rebuilt ──
// The same object as the Problem/Solution fan, one physical state per frame: the skeleton of
// ribs, the plain material leaf, the artwork, the print aligned on the ribs, the folds, the
// finished fan. Index -1 = before step 01 (nearly shut skeleton).
const STAGES: FanStateTarget[] = [
  { open: 0.6, sweep: 0, leaf: 0, bare: 1, pleat: 1 }, // F1 · the skeleton: ribs only
  { open: 0.6, sweep: 0, leaf: 1, bare: 0, pleat: 0.2 }, // F2 · the material leaf, plain and soft
  { open: 0.6, sweep: 1, leaf: 1, bare: 0, pleat: 0.2 }, // F3 · the artwork goes on
  { open: 0.82, sweep: 1, leaf: 1, bare: 0, pleat: 0.55 }, // F4a · printed leaf aligned on the ribs
  { open: 0.9, sweep: 1, leaf: 1, bare: 0, pleat: 1 }, // F4b · folded
  { open: 1, sweep: 1, leaf: 1, bare: 0, pleat: 1 }, // F5 · finished
];
// R10.2: the object waits as a readable half-open skeleton (was nearly shut, which read as a stick)
const BEFORE: FanStateTarget = { open: 0.4, sweep: 0, leaf: 0, bare: 1, pleat: 1 };
const stageState = (stage: number) => (stage < 0 ? BEFORE : STAGES[Math.min(stage, STAGES.length - 1)]);
/** True while the A2 production photographs are still missing. */
const VECTOR_FRAMES = FRAMES.every((f) => !f.asset.src);

/**
 * The fan at one production stage. Moves between stages on --ease-nan-state. R10.2 `object`: the
 * whole fan standing on the section's own canvas (no paper box, no ring), the hero of the Process;
 * otherwise the cropped fan in a paper box (reduced-motion contact sheet).
 */
function StageFan({
  stage,
  reduce,
  className,
  style,
  object,
  halo,
}: {
  stage: number;
  reduce: boolean;
  className?: string;
  style?: CSSProperties;
  object?: boolean;
  /** R10.3: the faint halo of short ribs and arcs around the pivot (main stage only). */
  halo?: boolean;
}) {
  const fan = useFanState(stageState(stage), reduce, 0.85);
  return (
    <div aria-hidden="true" className={`overflow-hidden ${object ? "" : "bg-paper-deep"} ${className ?? ""}`} style={style}>
      {halo && (
        <NanField
          x="50%"
          y="90%"
          radius="56%"
          from={-80}
          to={80}
          ribs={21}
          arcs={[0.86, 1]}
          inner={0.8}
          opacity={0.14}
          style={{ height: "auto", aspectRatio: "1" }}
        />
      )}
      {object ? <FanObject {...fan} x="50%" y="90%" width="96%" /> : <FanObject {...fan} x="58%" y="92%" width="150%" />}
    </div>
  );
}

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
  /** R10.1: this frame's production stage (index in FRAMES); without a photo, the fan stands in. */
  stage?: number;
}

/** One frame with its own entrance. Start states are fixed, so server and client render the same. */
export function FrameLayer({ asset, kind, shown, reduce, className, style, sizes, stage }: FrameLayerProps) {
  // `shown` can be true from the first client render under reduced motion; until hydration the
  // fan's state ignores that, so its SVG matches the server HTML.
  const hydrated = useHydrated();
  if (!asset.src && stage !== undefined) {
    // Not reached yet: the fan waits at the previous stage; reached: it moves to this one.
    const reached = hydrated ? shown : shown && !reduce;
    return <StageFan stage={reached ? stage : stage - 1} reduce={reduce} className={className} style={style} />;
  }
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
 * The Process visual: all six frames stacked in one box, each covering the one before (or, until
 * the A2 photographs exist, the one fan rebuilt stage by stage, standing on the indigo). Under
 * reduced motion it rests on the finished fan, with the six stages as a contact sheet below, so
 * nothing depends on watching the transitions. Positioning (sticky) belongs to the caller.
 */
export function ProcessFrameStack({ activeFrame, reduce }: ProcessFrameStackProps) {
  // Reduced motion rests on the finished fan, but only after hydration (server HTML = story state).
  const hydrated = useHydrated();
  return (
    <div className="w-full">
      {VECTOR_FRAMES ? (
        <StageFan
          stage={hydrated && reduce ? STAGES.length - 1 : activeFrame}
          reduce={reduce}
          object
          halo
          className="relative aspect-[4/3] w-full"
        />
      ) : (
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
      )}
      {/* Contact sheet, reduced motion only (pure CSS media query: no hydration difference). With
          the vector frames it is the reconstruction itself, stage by stage. */}
      <div className="mt-3 hidden grid-cols-6 gap-2 motion-reduce:grid">
        {FRAMES.map((frame, i) =>
          VECTOR_FRAMES ? (
            <StageFan key={frame.asset.id} stage={i} reduce object className="relative aspect-[4/3] w-full" />
          ) : (
            <AssetSlot key={frame.asset.id} asset={{ ...frame.asset, alt: "" }} tone="paper" sizes="80px" />
          ),
        )}
      </div>
    </div>
  );
}
