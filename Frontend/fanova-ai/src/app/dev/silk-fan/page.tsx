"use client";

import { useState } from "react";
import { notFound } from "next/navigation";
import { HeroSilkStage } from "@/components/homepage/silk-fan";
import { DEFAULT_STAGE_CONFIG, type StageConfig } from "@/components/homepage/silk-fan/stageConfig";
import HeroSectionBackground, { HERO_BACKGROUND_COLOR } from "@/components/homepage/HeroSectionBackground";
import TuningPanel from "./TuningPanel";

/**
 * H1-H4 dev-only preview for the ported hero silk fan and its surrounding three.js space -- not
 * part of the real site, not linked from anywhere in the app. Not reachable in production --
 * process.env.NODE_ENV is inlined at build time even for a Client Component, and notFound() works
 * the same way here as it would in a Server Component.
 *
 * H4-polish: uses the exact same background (HeroSectionBackground + HERO_BACKGROUND_COLOR) as
 * the real HeroSection, instead of a plain navy placeholder -- the point of this page is tuning
 * HeroSilkStage's config against the background it will actually sit on, so the two must match.
 *
 * Holds the StageConfig as plain client state so TuningPanel (dev-only, imported only from this
 * directory) can live-edit it; every real caller of HeroSilkStage omits the `config` prop entirely
 * and gets DEFAULT_STAGE_CONFIG.
 */
export default function SilkFanDevPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  const [config, setConfig] = useState<StageConfig>(DEFAULT_STAGE_CONFIG);

  return (
    <main
      className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden"
      style={{ background: HERO_BACKGROUND_COLOR }}
    >
      <HeroSectionBackground />
      <HeroSilkStage className="relative z-10 h-[80vh] w-[min(90vw,900px)]" config={config} />
      <TuningPanel config={config} onChange={setConfig} onReset={() => setConfig(DEFAULT_STAGE_CONFIG)} />
    </main>
  );
}
