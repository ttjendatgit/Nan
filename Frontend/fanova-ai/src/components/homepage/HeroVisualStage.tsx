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
      {/* Stage ambient: HeroSection's architectural blue panel already sits
          behind this stage, so this is just a small, tight separation glow --
          not a second layer of ambient lighting. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 h-[55%] w-[55%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#192B88]/12 blur-[64px]"
      />

      <HeroCanvas />
    </div>
  );
}
