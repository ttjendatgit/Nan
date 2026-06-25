"use client";

import dynamic from "next/dynamic";

// Future slot: replace HeroCanvas with Hero3DFan using /public/models/nan-fan.glb
// when a production-ready GLB model is available.
const HeroCanvas = dynamic(() => import("./HeroCanvas"), {
  ssr: false,
  loading: () => null,
});

export default function HeroVisualStage() {
  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* Stage ambient: single circular glow behind the fan — rounded-full + heavy blur
          prevents any rectangular edge artifact. HeroSection's own gradient layers
          already provide the dark navy background; this adds one soft centred halo. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 h-[80%] w-[80%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#08337D]/20 blur-[72px]"
      />

      <HeroCanvas />
    </div>
  );
}
