"use client";

// Dev-only Hero lab. ?v=r203 (default) renders the Hero mounted on the homepage (HeroSignature,
// R20.3); ?v=r202 R20.2 (HeroSignatureR202); ?v=b3d the homepage Hero with the 3D fan;
// ?v=r201 R20.1 (HeroSignatureR201); ?v=r20 R20 (HeroSignatureR20); ?v=b the R20 exploration that lost to it
// (HeroGallery); ?v=r19 and ?v=r18 older Heroes, kept as rollbacks (HeroAtelier, HeroImprint); ?v=fold holds the fan at four fold values to check
// the fold path; ?v=fold3d holds the 3D fan at five opening values; ?v=cmp sets the two R20.2
// candidates side by side at one size on one ground (A: the R20 SVG fan, B: the 3D fan). Each Hero renders with the real header and the Brand section
// below it, so the hand-off can be judged. Not linked, 404 in production.

import { notFound, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef } from "react";
import Navbar from "@/components/common/Navbar";
import BrandStatementSection from "@/components/homepage/BrandStatementSection";
import HeroAtelier from "@/components/homepage/atelier/HeroAtelier";
import HeroImprint from "@/components/homepage/HeroImprint";
import HeroSignature from "@/components/homepage/signature/HeroSignature";
import HeroGallery from "@/components/homepage/signature/HeroGallery";
import HeroSignatureR20 from "@/components/homepage/signature/HeroSignatureR20";
import HeroSignatureR201 from "@/components/homepage/signature/HeroSignatureR201";
import HeroSignatureR202 from "@/components/homepage/signature/HeroSignatureR202";
import FanObject from "@/components/homepage/hero-r18/FanObject";
import SignatureFan from "@/components/homepage/signature/SignatureFan";
import { cssFontStack } from "@/components/homepage/signature/FanStage";
import { NAN_PALETTE } from "@/components/homepage/silk-fan/silkFanPalette";
import "@/components/homepage/signature/signature.css";

const HeroB3d = () => <HeroSignature engine="gl" />;
const HEROES = { r203: HeroSignature, r202: HeroSignatureR202, b3d: HeroB3d, r201: HeroSignatureR201, r20: HeroSignatureR20, b: HeroGallery, r19: HeroAtelier, r18: HeroImprint } as const;

function FoldStrip() {
  return (
    <section className="relative h-[60vh] bg-[#0f1320]">
      {[0, 0.35, 0.7, 1].map((f, k) => (
        <FanObject key={f} foldRef={{ current: f }} style={{ left: `${12.5 + k * 25}vw`, top: "80%", width: "28vw" }} />
      ))}
    </section>
  );
}

function Fold3D({ t, w = 360, h = 300, r = 120, word = "AN KHANG" }: { t: number; w?: number; h?: number; r?: number; word?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    let scene: import("@/components/homepage/signature/fan3d/FanScene").FanScene | null = null;
    let live = true;
    import("@/components/homepage/signature/fan3d/FanScene").then(async ({ FanScene }) => {
      if (!live || !ref.current) return;
      scene = new FanScene(ref.current, { reduced: false, coarse: false, fontFamily: cssFontStack(NAN_PALETTE.fontStack), foldRef: { current: 0 }, onLost: () => {} });
      scene.setLayout(w, h, w * 0.42, h * 0.78, r);
      await scene.setWord(word, false);
      scene.pose(t);
    });
    return () => {
      live = false;
      scene?.dispose();
    };
  }, [t, w, h, r, word]);
  return <canvas ref={ref} style={{ width: w, height: h }} />;
}

function Lab() {
  const v = useSearchParams().get("v") ?? "r203";
  if (v === "fold") return <FoldStrip />;
  if (v === "cmp")
    return (
      <section className="sig flex items-start gap-0" style={{ minHeight: 0, height: 560 }}>
        <div aria-hidden="true" className="sig-room" />
        <div className="relative z-10" style={{ width: 760, height: 560 }}>
          <SignatureFan
            word="NAN"
            foldRef={{ current: 0 }}
            reprinted={false}
            style={{ "--fw": `${300 / 0.38}px`, "--tilt": "0deg", position: "absolute", left: 319 - 300, top: 437 - 0.395 * (300 / 0.38) } as React.CSSProperties}
          />
        </div>
        <div className="relative z-10">
          <Fold3D t={1} w={760} h={560} r={300} word="NAN" />
        </div>
      </section>
    );
  if (v === "fold3d")
    return (
      <section className="flex flex-wrap bg-[#0f1330] p-8">
        {[0, 0.25, 0.5, 0.75, 1].map((t) => (
          <Fold3D key={t} t={t} />
        ))}
      </section>
    );
  const Hero = HEROES[v as keyof typeof HEROES] ?? HeroSignature;
  return (
    <main>
      <Navbar />
      <Hero />
      <BrandStatementSection />
    </main>
  );
}

export default function HeroLabPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <Suspense>
      <Lab />
    </Suspense>
  );
}
