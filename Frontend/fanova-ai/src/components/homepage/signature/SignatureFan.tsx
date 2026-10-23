"use client";

// The Nan fan as the R20 Hero's object. SilkFan is a procedural SVG (14 shaded folds, bamboo slats,
// gilt trim and a foil word clipped per fold), not a 3D model; this wrapper stages it.
//
// The wrapper box is the fan's *visible* extent, not SilkFan's padded viewBox, so layouts can place
// the object by what the eye sees. Sizes come from one CSS variable, --fw (SilkFan's box width):
//   visible box   0.76 × 0.45 --fw        pivot (rivet)  0.38 --fw, 0.395 --fw from its top-left
// The fan is tilted by --tilt about its rivet. The cast shadow is a soft half-disc behind it (a
// static blurred layer: cheap, unlike a filter on an SVG that redraws every frame).
// A designer-made render or 3D asset can replace <SilkFan> here without touching any layout.

import { type CSSProperties } from "react";
import SilkFan from "../silk-fan/SilkFan";
import { useMounted } from "../hero-r18/FanObject";
import "./fan.css";

export default function SignatureFan({
  word,
  foldRef,
  reprinted,
  className = "",
  style,
}: {
  word: string;
  foldRef: { current: number };
  reprinted: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  const mounted = useMounted();
  return (
    <div aria-hidden="true" className={`sgf ${className}`} style={style}>
      <div className="sgf-shadow" />
      <div className="sgf-tilt">
        {mounted && (
          <SilkFan
            className="sgf-svg"
            rays={false}
            text={word}
            foldRef={foldRef}
            ambient
            openDelayMs={reprinted ? 60 : 450}
            openMs={reprinted ? 1500 : 2600}
          />
        )}
      </div>
      <span className="sgf-pivot" data-fan-pivot />
    </div>
  );
}
