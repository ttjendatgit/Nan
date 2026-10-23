"use client";

// The Nan fan as a single object (used by HeroAtelier and the R18 rollback HeroImprint) (SilkFan alone: no three.js glow or dust layers, so no extra
// WebGL contexts). Placed by its pivot and sized by its box width W (visible fan = 0.747 W); the
// SVG viewBox puts the pivot at (50%, 87.3%) of the box. `fold` (0 open … 1 folded) and `text`
// (the printed word) are the two behaviours the Hero uses.

import { useSyncExternalStore, type CSSProperties } from "react";
import SilkFan from "../silk-fan/SilkFan";

export const PIVOT_Y = ((575 - 9) / 648.235) * 100;

const noopSubscribe = () => () => {};
export function useMounted(): boolean {
  return useSyncExternalStore(noopSubscribe, () => true, () => false);
}

export default function FanObject({
  className = "",
  style,
  text,
  foldRef,
}: {
  className?: string;
  style?: CSSProperties;
  text?: string;
  foldRef?: { current: number };
}) {
  const mounted = useMounted();
  return (
    <div
      aria-hidden="true"
      data-hero-fan
      className={`pointer-events-none absolute ${className}`}
      style={{ aspectRatio: "1132 / 648.235", transform: `translate(-50%, -${PIVOT_Y}%)`, ...style }}
    >
      {mounted && <SilkFan className="h-full w-full" rays={false} text={text} foldRef={foldRef} />}
      <div data-fan-bbox className="absolute" style={{ left: "12.65%", width: "74.7%", top: "20.1%", height: "76.1%" }} />
    </div>
  );
}
