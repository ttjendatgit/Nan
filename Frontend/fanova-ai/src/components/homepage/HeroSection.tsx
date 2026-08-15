"use client";

// CMS: all text content and image slots are sourced from heroConfig.
// Future: when heroConfig.backgroundImage.src or backgroundVideo.src is
// non-empty (set by admin upload), render the asset as a background layer
// alongside or instead of HeroCanvas.

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRef, useEffect } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);
import Button from "@/components/ui/Button";
import { heroConfig } from "@/data/homepageData";

/* ─── HeroVisualStage is WebGL-only; skip SSR ─── */
const HeroVisualStage = dynamic(() => import("./HeroVisualStage"), {
  ssr: false,
  loading: () => null,
});

export default function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);

  // Split headline into words for per-word GSAP animation
  const words = heroConfig.headline.split(" ");

  /* ── Smooth text parallax driven by mouse (rAF + lerp) ── */
  useEffect(() => {
    if (typeof window === "undefined") return;
    // Skip mouse parallax entirely when the user prefers reduced motion
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
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

  /* ── GSAP text reveal ──
     Runs once on mount -- NOT gated on FanIntro, sessionStorage, or any
     completion signal from another component. Every element it targets is
     already visible by default in the markup (no inline opacity:0), so this
     is pure progressive enhancement: if GSAP fails to load, this effect never
     runs, or `prefers-reduced-motion` short-circuits it, the Hero is still
     fully visible from the first paint. When it does run, `fromTo` briefly
     sets the "from" state before animating back to the element's natural
     (visible) state -- there is nothing for a failed/interrupted intro
     elsewhere on the page to strand, because this component owns its own
     visibility. FanIntro (if it plays) is a fully opaque full-screen overlay
     on top of this, so this animation running underneath it is invisible
     until the overlay itself dissolves -- no coordination between the two
     is required. ── */
  useGSAP(
    () => {
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduced) return;

      gsap.fromTo(
        "[data-ha='badge']",
        { opacity: 0, y: 12 },
        { opacity: 1, y: 0, duration: 0.65, ease: "power2.out", delay: 0.05, clearProps: "transform" }
      );

      gsap.fromTo(
        "[data-ha='word']",
        { opacity: 0, y: 24 },
        { opacity: 1, y: 0, duration: 0.82, ease: "power3.out", stagger: 0.068, delay: 0.15, clearProps: "transform" }
      );

      gsap.fromTo(
        "[data-ha='sub']",
        { opacity: 0, y: 14 },
        { opacity: 1, y: 0, duration: 0.65, ease: "power2.out", delay: 0.45, clearProps: "transform" }
      );

      gsap.fromTo(
        "[data-ha='cta']",
        { opacity: 0, y: 12 },
        { opacity: 1, y: 0, duration: 0.55, ease: "power2.out", stagger: 0.1, delay: 0.6, clearProps: "transform" }
      );

      gsap.fromTo(
        "[data-ha='proof']",
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.5, ease: "power2.out", stagger: 0.07, delay: 0.8, clearProps: "transform" }
      );

      gsap.fromTo(
        "[data-ha='visual']",
        { opacity: 0, scale: 0.96 },
        { opacity: 1, scale: 1, duration: 0.9, ease: "power2.out", delay: 0.1, clearProps: "transform" }
      );
    },
    { scope: containerRef, dependencies: [] }
  );

  /* ── Hero scroll-out depth: visual stage and text gently recede as user
     scrolls past the hero into the brand narrative.
     Runs once on mount (dependencies: []). The load-in animation sets all
     elements to their visible state first; these scrubbed ScrollTriggers then
     ease them out as the hero exits the viewport. ── */
  useGSAP(
    () => {
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduced || !containerRef.current) return;

      const visual = containerRef.current.querySelector<HTMLElement>("[data-ha='visual']");

      // Visual stage: fades and scales back very subtly.
      // fromTo with an explicit from-state (opacity:1, scale:1) ensures that
      // when the user scrolls back to the top, the scrub reverses to opacity:1
      // rather than to the JSX-initial opacity:0 that gsap.to() would capture.
      // immediateRender:false prevents this tween from overwriting the from-state
      // onto the element before the load-in animation has set opacity to 1.
      if (visual) {
        gsap.fromTo(
          visual,
          { opacity: 1, scale: 1 },
          {
            opacity: 0.58,
            scale: 0.97,
            ease: "none",
            immediateRender: false,
            scrollTrigger: {
              trigger: containerRef.current,
              start: "center top",
              end: "bottom top",
              scrub: 0.8,
              invalidateOnRefresh: true,
            },
          }
        );
      }

      // Text container: drifts up slightly and dims — the copy "lifts away"
      // as the user crosses into the brand manifesto below.
      // Same fromTo + immediateRender:false pattern for consistency and safety.
      if (textRef.current) {
        gsap.fromTo(
          textRef.current,
          { opacity: 1, y: 0 },
          {
            opacity: 0.75,
            y: -12,
            ease: "none",
            immediateRender: false,
            scrollTrigger: {
              trigger: containerRef.current,
              start: "center top",
              end: "bottom top",
              scrub: 0.8,
              invalidateOnRefresh: true,
            },
          }
        );
      }
    },
    { scope: containerRef, dependencies: [] }
  );

  return (
    <section
      ref={containerRef}
      className="relative min-h-screen overflow-hidden"
      style={{ background: "#0F1320" }}
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

      {/* ── Architectural blue field: a cropped plane that frames the fan,
          not a dark-half/blue-half split. Small, bleeds off the right edge
          so its full geometry is never fully on-screen -- reads as cropped
          editorial framing rather than a graphic wedge. Sits behind the
          headline/fan/CTA in visual weight. ── */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-[-5%] top-[22%] hidden h-[54%] w-[28%] lg:block"
        style={{
          background: "#192B88",
          clipPath: "polygon(14% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 11%)",
          WebkitMaskImage:
            "linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.90) 16%, rgba(0,0,0,0.90) 84%, transparent 100%)",
          maskImage:
            "linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.90) 16%, rgba(0,0,0,0.90) 84%, transparent 100%)",
        }}
      />

      {/* ── Single restrained focal light: separates the fan silhouette from
          the panel/canvas behind it. Tight radius, low opacity -- a hint of
          depth, not a spotlight. ── */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-[12%] top-[24%] hidden h-[38%] w-[28%] md:block"
        style={{
          background:
            "radial-gradient(ellipse at 55% 48%, rgba(25,43,136,0.30) 0%, transparent 62%)",
        }}
      />

      {/* ── Left ambient accent: warm material touch ── */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-0 top-1/4 h-[50%] w-[42%] opacity-[0.12]"
        style={{
          background:
            "radial-gradient(ellipse at 8% 50%, rgba(182,161,123,0.35) 0%, transparent 62%)",
        }}
      />

      {/* ── Top + bottom gradient fades ── */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-[#0F1320] to-transparent"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-52 bg-gradient-to-t from-[#0F1320]/85 to-transparent"
      />

      {/* ── Left-side text protection ── */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-0 z-[2] w-[62%]"
        style={{
          background:
            "linear-gradient(to right, #0F1320 0%, rgba(15,19,32,0.97) 22%, rgba(15,19,32,0.80) 48%, rgba(15,19,32,0.16) 78%, transparent 100%)",
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
              className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/7 px-4 py-2"
            >
              <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#B6A17B]" />
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
                  <span data-ha="word" style={{ display: "inline-block" }}>
                    {word}
                  </span>
                </span>
              ))}
            </h1>

            {/* Subheadline — CMS: heroConfig.subheadline */}
            <p
              data-ha="sub"
              className="mt-6 max-w-[22rem] text-[0.9375rem] leading-[1.75] text-[rgba(241,240,234,0.65)] lg:mt-7"
            >
              {heroConfig.subheadline}
            </p>

            {/* CTA buttons — CMS: heroConfig.primaryCta / secondaryCta */}
            <div className="mt-10 flex flex-wrap gap-4">
              <span data-ha="cta">
                <a href="#quote">
                  <Button className="bg-[#F1F0EA] text-[#0F1320] hover:bg-white shadow-[0_4px_22px_rgba(0,0,0,0.28),0_2px_8px_rgba(0,0,0,0.16)] ring-1 ring-inset ring-[rgba(15,19,32,0.10)] hover:shadow-[0_6px_28px_rgba(0,0,0,0.22),0_2px_12px_rgba(0,0,0,0.18)]">
                    {heroConfig.primaryCta}
                  </Button>
                </a>
              </span>
              <span data-ha="cta">
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
                  className="flex items-center gap-2"
                >
                  <span className="font-mono text-[9px] font-bold text-[#B6A17B]">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="text-[11px] leading-none text-[rgba(241,240,234,0.46)]">
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
          className="hidden h-[88vh] w-[50%] md:block lg:w-[52%]"
        >
          <HeroVisualStage />
        </div>

      </div>
    </section>
  );
}
