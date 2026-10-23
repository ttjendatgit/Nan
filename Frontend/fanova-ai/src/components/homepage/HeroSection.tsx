"use client";

// R11.1 "Typographic collision" (chosen over a type-architecture gate and an annotated editorial
// object after rendering all three with the existing 3D fan at 1440 × 900; DECISIONS §24).
//
// The headline and the 3D fan (SilkFan, via HeroVisualStage) occupy the same space as two designed
// objects. The headline is set at full scale, behind the fan; where a letter passes behind the fan
// it continues as a hairline outline drawn OVER it (.hero-outline). Neither object is cut: the fan
// is completely visible, every letter is still drawn.
//
//   · 1024+: two lines, "Di sản trong" from the left edge, "từng nếp quạt." to the right edge,
//     the fan tilted −9° across both; the note above line 1, the actions on the lower-left edge.
//   · phones / tablets: their own composition, three lines ("Di sản" left, "trong từng" right,
//     "nếp quạt." left); "trong từng" crosses the fan's arc, "nếp quạt." its leaf, above the
//     gold ribs; the note and actions on the lower-left edge.
//
// The fan is placed by its pivot and sized by its visible width (globals .hero-collide); never
// cropped. Motion: type rises in once with CSS (.hero-rise); the fan settles in once (opacity,
// scale 0.97 → 1, 14px); on scroll it sinks at most 16px and turns 1° around its pivot. Nothing
// loops, no pointer following. Reduced motion: the final frame at once.

import dynamic from "next/dynamic";
import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Button from "@/components/ui/Button";
import QuoteRequestModal from "@/components/quote/QuoteRequestModal";
import { heroConfig } from "@/data/homepageData";
import { heroFan } from "@/data/homepageAssets";
import HeroSectionBackground, { HERO_BACKGROUND_COLOR } from "./HeroSectionBackground";

gsap.registerPlugin(ScrollTrigger);

/* ─── HeroVisualStage (the 3D fan) is WebGL-only; skip SSR ─── */
const HeroVisualStage = dynamic(() => import("./HeroVisualStage"), {
  ssr: false,
  loading: () => null,
});

/** heroFan.extent for the CSS (globals .hero-collide). */
const { width: fw, above: fa, below: fb } = heroFan.extent;
const FAN_GEOMETRY = { "--fw": fw, "--fa": fa, "--fb": fb } as CSSProperties;

const noopSubscribe = () => () => {};
/** false on the server and the first client render, true once mounted (the fan is client-only). */
function useMounted(): boolean {
  return useSyncExternalStore(noopSubscribe, () => true, () => false);
}

/** The 3D fan, placed by its pivot. The inner box is what GSAP moves, around the same pivot. */
function HeroFan({ mounted }: { mounted: boolean }) {
  const px = `${heroFan.pivot.x * 100}%`;
  const py = `${heroFan.pivot.y * 100}%`;
  return (
    <div
      aria-hidden="true"
      data-hero-fan
      className="hero-fan pointer-events-none absolute z-10"
      style={{ "--px": px, "--py": py, aspectRatio: heroFan.ratio } as CSSProperties}
    >
      <div data-ha="visual" className="relative h-full w-full" style={{ transformOrigin: `${px} ${py}` }}>
        {mounted && <HeroVisualStage rays={false} />}
      </div>
    </div>
  );
}

const LINE = "absolute block whitespace-nowrap leading-[0.8]";
/** Desktop line size: 214 px in the 1440 × 900 frame, bounded by the frame's height. */
const DESK = "text-[min(14.9vw,23.8svh,14rem)]";
/** Phone / tablet line size. */
const PORT = "text-[min(21vw,9rem)] md:text-[min(17vw,8rem)]";

/**
 * The headline's lines, placed. Rendered twice: solid (in the h1, behind the fan) and as the
 * outline layer (aria-hidden, over the fan). Both arrangements are in the DOM; one is hidden per
 * breakpoint (display: none, so assistive tech reads the visible one only).
 */
function Lines() {
  const [d1, d2] = heroConfig.headlineLines;
  const [p1, p2, p3] = heroConfig.headlineParts;
  return (
    <>
      <span className="hidden lg:contents">
        <span className={`${LINE} ${DESK} left-[3.3vw] top-[22%]`}>{d1}</span>{" "}
        <span className={`${LINE} ${DESK} right-[3vw] top-[50.2%]`}>{d2}</span>
      </span>
      <span className="contents lg:hidden">
        <span className={`${LINE} ${PORT} left-[5vw] top-[27%] md:top-[21%]`}>{p1}</span>{" "}
        <span className={`${LINE} ${PORT} right-[4vw] top-[43%] md:top-[39%]`}>{p2}</span>{" "}
        <span className={`${LINE} ${PORT} left-[5vw] top-[54%] md:top-[52%]`}>{p3}</span>
      </span>
    </>
  );
}

export default function HeroSection() {
  const containerRef = useRef<HTMLElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const mounted = useMounted();
  const [quoteOpen, setQuoteOpen] = useState(false);

  /* ── BrandStatement's rib (lg-only) drops at --hero-hinge-x: here, the clear gap between the
        action rail and the fan's pivot, below the fan, so it never crosses the type or the fan. ── */
  useEffect(() => {
    const rail = railRef.current;
    const fan = containerRef.current?.querySelector<HTMLElement>("[data-hero-fan]");
    if (!rail || !fan) return;
    const root = document.documentElement;
    const measure = () => {
      const pivotX = parseFloat(getComputedStyle(fan).left) + (containerRef.current?.getBoundingClientRect().left ?? 0);
      root.style.setProperty("--hero-hinge-x", `${(rail.getBoundingClientRect().right + pivotX) / 2}px`);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(rail);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => {
      ro.disconnect();
      root.style.removeProperty("--hero-hinge-x");
    };
  }, []);

  /* ── Fan entrance + scroll settling (the fan only exists once mounted) ── */
  useGSAP(
    () => {
      if (!mounted || !containerRef.current) return;
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduced) return;
      const visual = containerRef.current.querySelector<HTMLElement>("[data-ha='visual']");
      if (!visual) return;
      gsap.fromTo(
        visual,
        { opacity: 0, scale: 0.97, y: 14 },
        { opacity: 1, scale: 1, y: 0, duration: 1.2, ease: "power3.out", delay: 0.2, clearProps: "opacity" },
      );
      gsap.fromTo(
        visual,
        { y: 0, rotation: 0 },
        {
          y: 16,
          rotation: 1,
          ease: "none",
          immediateRender: false,
          scrollTrigger: { trigger: containerRef.current, start: "top top", end: "bottom top", scrub: 0.8, invalidateOnRefresh: true },
        },
      );
    },
    { scope: containerRef, dependencies: [mounted], revertOnUpdate: true },
  );

  return (
    <>
      <section
        ref={containerRef}
        className="hero-collide relative isolate h-[max(100svh,40rem)] overflow-hidden md:h-[max(100svh,48rem)] lg:h-[clamp(720px,100svh,940px)]"
        style={{ background: HERO_BACKGROUND_COLOR, ...FAN_GEOMETRY }}
      >
        <HeroSectionBackground />

        {/* Solid headline, behind the fan */}
        <h1 className="hero-rise absolute inset-0 z-0 font-serif font-medium tracking-tight text-on-indigo">
          <Lines />
        </h1>

        <HeroFan mounted={mounted} />

        {/* The same lines as a hairline outline over the fan (decorative duplicate) */}
        <div aria-hidden="true" className="hero-rise hero-outline pointer-events-none absolute inset-0 z-20 font-serif font-medium tracking-tight">
          <Lines />
        </div>

        {/* The note: small, above line 1 on desktop; above the actions on tall phones/tablets. */}
        <p
          className="hero-rise absolute bottom-[calc(5svh+7.25rem)] left-[5vw] z-30 hidden max-w-[19rem] text-[0.875rem] leading-6 text-on-indigo-muted md:bottom-[calc(5svh+4.75rem)] [@media(min-height:760px)]:block lg:bottom-auto lg:left-[3.9vw] lg:top-[14.7%] lg:block"
          style={{ "--rise-delay": "0.3s" } as CSSProperties}
        >
          {heroConfig.statement}
        </p>

        {/* The actions: the lower-left edge */}
        <div
          ref={railRef}
          data-hero-ctas
          className="hero-rise absolute bottom-[5svh] left-[5vw] z-30 flex flex-wrap gap-3 max-md:right-[5vw] lg:bottom-[5.3%] lg:left-[3.9vw]"
          style={{ "--rise-delay": "0.45s" } as CSSProperties}
        >
          {/* One control each: the primary opens the quote form (like every "Gửi yêu cầu báo giá"
              on the page), the secondary is a single link to the catalogue. */}
          <Button type="button" tone="indigo" onClick={() => setQuoteOpen(true)}>
            {heroConfig.primaryCta}
          </Button>
          <Button href="/products" tone="indigo" variant="secondary">
            {heroConfig.secondaryCta}
          </Button>
        </div>
      </section>

      {/* Outside the section: it clips overflow and hosts GSAP transforms; the modal is fixed */}
      <QuoteRequestModal open={quoteOpen} onClose={() => setQuoteOpen(false)} />
    </>
  );
}
