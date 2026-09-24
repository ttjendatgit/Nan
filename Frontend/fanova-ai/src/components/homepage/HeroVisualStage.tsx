"use client";

import dynamic from "next/dynamic";
import { HERO_VARIANT } from "./heroVariant";

const HeroCanvas = dynamic(() => import("./HeroCanvas"), {
  ssr: false,
  loading: () => null,
});

const HeroSilkStage = dynamic(() => import("./silk-fan/HeroSilkStage"), {
  ssr: false,
  loading: () => null,
});

export default function HeroVisualStage() {
  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* H4-polish: this ambient glow was sized/positioned specifically to sit behind the old
          three.js-only fan (HeroCanvas) -- HeroSilkStage already has its own H2 Glow layer, tuned
          to its own fan's LIGHT vector, so this one is redundant (and slightly off) for "silk". Kept
          for "legacy" unchanged. */}
      {HERO_VARIANT === "legacy" && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-1/2 h-[55%] w-[55%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#192B88]/12 blur-[64px]"
        />
      )}

      {HERO_VARIANT === "silk" ? <HeroSilkStage className="h-full w-full" /> : <HeroCanvas />}
    </div>
  );
}
