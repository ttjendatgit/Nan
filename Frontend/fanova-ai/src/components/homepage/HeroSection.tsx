"use client";

// CMS: all text content and image slots are sourced from heroConfig.
// Future: when heroConfig.backgroundImage.src or backgroundVideo.src is
// non-empty (set by admin upload), render the asset as a background layer
// alongside or instead of HeroCanvas.

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRef, useEffect, useState } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import Button from "@/components/ui/Button";
import { hasSeenIntro } from "@/hooks/useIntroComplete";
import { heroConfig } from "@/data/homepageData";

/* ─── HeroVisualStage is WebGL-only; skip SSR ─── */
const HeroVisualStage = dynamic(() => import("./HeroVisualStage"), {
  ssr: false,
  loading: () => null,
});

export default function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const [animReady, setAnimReady] = useState(false);

  // Split headline into words for per-word GSAP animation
  const words = heroConfig.headline.split(" ");

  /* ── Wait for Fan Intro to finish before revealing text ── */
  useEffect(() => {
    if (hasSeenIntro()) {
      setAnimReady(true);
      return;
    }
    const id = setInterval(() => {
      if (hasSeenIntro()) {
        setAnimReady(true);
        clearInterval(id);
      }
    }, 80);
    return () => clearInterval(id);
  }, []);

  /* ── Smooth text parallax driven by mouse (rAF + lerp) ── */
  useEffect(() => {
    if (typeof window === "undefined") return;
    let frameId: number;
    let mx = 0, my = 0, cx = 0, cy = 0;

    const onMove = (e: MouseEvent) => {
      mx = (e.clientX / window.innerWidth - 0.5) * 2;
      my = (e.clientY / window.innerHeight - 0.5) * 2;
    };

    const tick = () => {
      cx += (mx - cx) * 0.055;
      cy += (my - cy) * 0.055;
      if (textRef.current) {
        const rx = Math.round(cx * -4);
        const ry = Math.round(cy * -3);
        textRef.current.style.transform = `translate(${rx}px, ${ry}px)`;
      }
      frameId = requestAnimationFrame(tick);
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    frameId = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(frameId);
    };
  }, []);

  /* ── GSAP text reveal ── */
  useGSAP(
    () => {
      if (!animReady) return;

      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduced) {
        gsap.set("[data-ha]", { opacity: 1, y: 0 });
        return;
      }

      gsap.fromTo(
        "[data-ha='badge']",
        { opacity: 0, y: 12 },
        { opacity: 1, y: 0, duration: 0.65, ease: "power2.out", delay: 0.1, clearProps: "transform" }
      );

      gsap.fromTo(
        "[data-ha='word']",
        { opacity: 0, y: 24 },
        { opacity: 1, y: 0, duration: 0.82, ease: "power3.out", stagger: 0.068, delay: 0.35, clearProps: "transform" }
      );

      gsap.fromTo(
        "[data-ha='sub']",
        { opacity: 0, y: 14 },
        { opacity: 1, y: 0, duration: 0.65, ease: "power2.out", delay: 1.0, clearProps: "transform" }
      );

      gsap.fromTo(
        "[data-ha='cta']",
        { opacity: 0, y: 12 },
        { opacity: 1, y: 0, duration: 0.55, ease: "power2.out", stagger: 0.1, delay: 1.3, clearProps: "transform" }
      );

      gsap.fromTo(
        "[data-ha='proof']",
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.5, ease: "power2.out", stagger: 0.07, delay: 1.55, clearProps: "transform" }
      );

      gsap.fromTo(
        "[data-ha='visual']",
        { opacity: 0, scale: 0.96 },
        { opacity: 1, scale: 1, duration: 0.9, ease: "power2.out", delay: 0.5, clearProps: "transform" }
      );
    },
    { scope: containerRef, dependencies: [animReady] }
  );

  return (
    <section
      ref={containerRef}
      className="relative min-h-screen overflow-hidden"
      style={{
        background: "radial-gradient(ellipse at 65% 42%, #0D2A55 0%, #0A1B38 42%, #081426 68%)",
      }}
    >
      {/*
        CMS: hero background image layer.
        Future: when heroConfig.backgroundImage.src is non-empty, render:
          <img
            src={heroConfig.backgroundImage.src}
            alt={heroConfig.backgroundImage.alt}
            className="absolute inset-0 h-full w-full object-cover opacity-40"
            style={{ objectPosition: `${heroConfig.backgroundImage.focalPoint?.x * 100}% ${heroConfig.backgroundImage.focalPoint?.y * 100}%` }}
          />
        CMS: hero background video layer.
        Future: when heroConfig.backgroundVideo.src is non-empty, render:
          <video
            src={heroConfig.backgroundVideo.src}
            poster={heroConfig.posterImage.src}
            autoPlay muted loop playsInline
            className="absolute inset-0 h-full w-full object-cover opacity-30"
          />
      */}

      {/* ── Subtle grid texture: masked to fan-side only ── */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.28) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.28) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          WebkitMaskImage:
            "linear-gradient(to right, transparent 0%, transparent 38%, rgba(255,255,255,0.50) 62%, rgba(255,255,255,0.85) 100%)",
          maskImage:
            "linear-gradient(to right, transparent 0%, transparent 38%, rgba(255,255,255,0.50) 62%, rgba(255,255,255,0.85) 100%)",
        }}
      />

      {/* ── Royal blue radial glow from right (behind the fan) ── */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-0 top-0 h-[80%] w-[60%] opacity-70"
        style={{
          background:
            "radial-gradient(ellipse at 75% 26%, rgba(17,79,153,0.70) 0%, rgba(8,51,125,0.32) 50%, transparent 72%)",
        }}
      />

      {/* ── Focused royal blue halo ── */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-[8%] top-[18%] h-[62%] w-[44%]"
        style={{
          background:
            "radial-gradient(ellipse at 50% 44%, rgba(8,51,125,0.42) 0%, rgba(17,79,153,0.18) 38%, transparent 62%)",
        }}
      />

      {/* ── Soft fan center glow ── */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-[4%] top-[12%] h-[70%] w-[52%]"
        style={{
          background:
            "radial-gradient(ellipse at 58% 54%, rgba(74,116,167,0.26) 0%, rgba(8,51,125,0.12) 50%, transparent 70%)",
        }}
      />

      {/* ── Left ambient accent ── */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-0 top-1/4 h-[50%] w-[42%] opacity-25"
        style={{
          background:
            "radial-gradient(ellipse at 8% 50%, rgba(74,116,167,0.28) 0%, transparent 62%)",
        }}
      />

      {/* ── Top + bottom gradient fades ── */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-[#081426] to-transparent"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-52 bg-gradient-to-t from-[#081426]/85 to-transparent"
      />

      {/* ── Left-side text protection ── */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-0 z-[2] w-[62%]"
        style={{
          background:
            "linear-gradient(to right, #081426 0%, rgba(8,20,38,0.97) 22%, rgba(8,20,38,0.80) 48%, rgba(8,20,38,0.16) 78%, transparent 100%)",
        }}
      />

      {/* ── Mobile-only: visual stage as a dim background layer ── */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 opacity-[0.20] md:hidden"
      >
        <HeroVisualStage />
      </div>

      {/* ── Main layout ── */}
      <div className="relative z-10 mx-auto flex min-h-screen max-w-7xl items-center px-6 pt-28 lg:px-12">

        {/* Left — text content */}
        <div
          ref={textRef}
          className="w-full py-16 md:w-[50%] lg:w-[48%]"
        >
          <div className="max-w-[480px]">

            {/* Badge — CMS: heroConfig.badge */}
            <div
              data-ha="badge"
              style={{ opacity: 0 }}
              className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/7 px-4 py-2 backdrop-blur-sm"
            >
              <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#ECCA3E]" />
              <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/75">
                {heroConfig.badge}
              </span>
            </div>

            {/* Headline — CMS: heroConfig.headline */}
            <h1 className="font-serif text-[2.375rem] font-semibold leading-[1.14] tracking-tight text-[#FFFFFF] md:text-[3.125rem] lg:text-[3.75rem] xl:text-[4.25rem]">
              {words.map((word, i) => (
                <span
                  key={i}
                  className="inline-block overflow-hidden align-bottom"
                  style={{ marginRight: i < words.length - 1 ? "0.26em" : undefined }}
                >
                  <span data-ha="word" style={{ display: "inline-block", opacity: 0 }}>
                    {word}
                  </span>
                </span>
              ))}
            </h1>

            {/* Subheadline — CMS: heroConfig.subheadline */}
            <p
              data-ha="sub"
              style={{ opacity: 0 }}
              className="mt-6 max-w-[22rem] text-[0.9375rem] leading-[1.75] text-[rgba(232,242,252,0.65)] lg:mt-7"
            >
              {heroConfig.subheadline}
            </p>

            {/* CTA buttons — CMS: heroConfig.primaryCta / secondaryCta */}
            <div className="mt-10 flex flex-wrap gap-4">
              <span data-ha="cta" style={{ opacity: 0 }}>
                <a href="#quote">
                  <Button className="bg-[#FFFFFF] text-[#08337D] hover:bg-[#DCEAF7] shadow-[0_4px_22px_rgba(0,0,0,0.22),0_2px_8px_rgba(8,51,125,0.14)] ring-1 ring-inset ring-[rgba(8,51,125,0.10)] hover:shadow-[0_6px_28px_rgba(0,0,0,0.18),0_2px_12px_rgba(8,51,125,0.18)]">
                    {heroConfig.primaryCta}
                  </Button>
                </a>
              </span>
              <span data-ha="cta" style={{ opacity: 0 }}>
                <Link href="/products">
                  <Button
                    variant="secondary"
                    className="border-white/22 text-white/80 hover:border-white/52 hover:text-white hover:bg-white/10"
                  >
                    {heroConfig.secondaryCta}
                  </Button>
                </Link>
              </span>
            </div>

            {/* Proof bar — CMS: heroConfig.proofPoints */}
            <div className="mt-10 flex flex-wrap items-center gap-x-5 gap-y-2.5">
              {heroConfig.proofPoints.map((point, i) => (
                <div
                  key={point}
                  data-ha="proof"
                  style={{ opacity: 0 }}
                  className="flex items-center gap-2"
                >
                  <span className="font-mono text-[9px] font-bold text-[#ECCA3E]">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="text-[11px] leading-none text-[rgba(232,242,252,0.46)]">
                    / {point}
                  </span>
                </div>
              ))}
            </div>


          </div>
        </div>

        {/* Right — Visual stage (desktop only); future slot for 3D fan model */}
        <div
          data-ha="visual"
          aria-hidden="true"
          style={{ opacity: 0 }}
          className="hidden h-[88vh] w-[50%] md:block lg:w-[52%]"
        >
          <HeroVisualStage />
        </div>

      </div>
    </section>
  );
}
