"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import FanSVG, {
  RIBS,
  cx,
  cy,
  getRibAngle,
  CENTER_ANGLE_DEG,
} from "./FanSVG";

export default function FanIntro({ onComplete }: { onComplete: () => void }) {
  // ─── DOM refs ────────────────────────────────────────────────────────────
  const overlayRef   = useRef<HTMLDivElement>(null);
  const wrapperRef   = useRef<HTMLDivElement>(null);
  const fanRef       = useRef<HTMLDivElement>(null);
  const brandClipRef = useRef<HTMLDivElement>(null);  // overflow:hidden mask
  const brandTextRef = useRef<HTMLSpanElement>(null); // text that slides up
  const taglineClipRef = useRef<HTMLDivElement>(null);
  const taglineTextRef = useRef<HTMLSpanElement>(null);

  // ─── SVG inner refs ──────────────────────────────────────────────────────
  const svgRef        = useRef<SVGSVGElement>(null);
  const ribGroupsRef  = useRef<(SVGGElement | null)[]>([]);
  const paperGroupRef = useRef<SVGGElement>(null);
  const lightSweepRef = useRef<SVGGElement>(null);
  const pivotRef      = useRef<SVGGElement>(null);
  const atmosphereRef = useRef<SVGGElement>(null);

  const tlRef = useRef<gsap.core.Timeline | null>(null);

  function finish() {
    try { sessionStorage.setItem("nha-phong-intro-seen", "1"); } catch { /**/ }
    onComplete();
  }

  function handleSkip() {
    tlRef.current?.kill();
    if (overlayRef.current) {
      gsap.to(overlayRef.current, { opacity: 0, duration: 0.3, ease: "power2.in", onComplete: finish });
    } else {
      finish();
    }
  }

  useGSAP(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      finish();
      return;
    }

    const ribs = ribGroupsRef.current.filter(Boolean) as SVGGElement[];

    if (
      !overlayRef.current  ||
      !wrapperRef.current  ||
      !fanRef.current      ||
      !brandClipRef.current   ||
      !brandTextRef.current   ||
      !taglineClipRef.current ||
      !taglineTextRef.current ||
      !paperGroupRef.current  ||
      !lightSweepRef.current  ||
      !pivotRef.current       ||
      !atmosphereRef.current  ||
      ribs.length === 0
    ) return;

    // ── Initial states ────────────────────────────────────────────────────
    gsap.set(wrapperRef.current, { opacity: 0, scale: 0.88, transformOrigin: "50% 72%" });
    gsap.set(paperGroupRef.current, { opacity: 0 });
    gsap.set(lightSweepRef.current, { opacity: 0, x: 0 });
    gsap.set(pivotRef.current, { opacity: 0, scale: 0.4, transformOrigin: `${cx}px ${cy}px` });
    gsap.set(atmosphereRef.current, { opacity: 0 });
    gsap.set(brandTextRef.current, { opacity: 0, y: 26 });
    gsap.set(taglineTextRef.current, { opacity: 0, y: 12 });

    // Collapse all ribs to the center angle so they open physically
    ribs.forEach((el, i) => {
      const delta = getRibAngle(i) - CENTER_ANGLE_DEG;
      gsap.set(el, { opacity: 0, rotation: -delta, svgOrigin: `${cx} ${cy}` });
    });

    // ── Timeline ─────────────────────────────────────────────────────────
    const tl = gsap.timeline({ onComplete: finish });
    tlRef.current = tl;

    // 0.0–0.4s  dark overlay + atmosphere light settles in
    tl.to(atmosphereRef.current, { opacity: 1, duration: 0.45, ease: "power1.out" }, 0.0);

    // 0.3–0.55s  fan wrapper emerges at scale
    tl.to(wrapperRef.current, { opacity: 1, scale: 1, duration: 0.55, ease: "power2.out" }, 0.28);

    // 0.4–1.7s  ribs bloom open from center outward
    //           each rib animates 0.85s with a slight organic overshoot
    tl.to(ribs, {
      opacity: 1,
      rotation: 0,
      svgOrigin: `${cx} ${cy}`,
      duration: 0.85,
      stagger: { from: "center", each: 0.068 },
      ease: "back.out(1.12)",
    }, 0.42);

    // 1.05–1.85s  paper fills in (slight delay so ribs lead)
    tl.to(paperGroupRef.current, { opacity: 1, duration: 0.80, ease: "power1.out" }, 1.05);

    // 1.6–1.85s  pivot jewel pops in
    tl.to(pivotRef.current, {
      opacity: 1, scale: 1, duration: 0.35, ease: "back.out(1.8)",
      transformOrigin: `${cx}px ${cy}px`,
    }, 1.60);

    // 1.7–2.12s  cinematic light sweep across paper
    tl.to(lightSweepRef.current, { opacity: 1, x: 190, duration: 0.20, ease: "power1.in" }, 1.70);
    tl.to(lightSweepRef.current, { opacity: 0, x: 460, duration: 0.22, ease: "power1.out" }, 1.90);

    // 2.0–2.75s  brand "Nan" slides up into view
    tl.to(brandTextRef.current, { opacity: 1, y: 0, duration: 0.75, ease: "power3.out" }, 2.00);

    // 2.45–3.1s  tagline fades up
    tl.to(taglineTextRef.current, { opacity: 1, y: 0, duration: 0.65, ease: "power2.out" }, 2.45);

    // 3.1–4.3s  HOLD — full composition breathes on screen

    // 4.3–5.05s  text exits gently upward
    tl.to(brandTextRef.current,   { opacity: 0, y: -10, duration: 0.72, ease: "power2.in" }, 4.28);
    tl.to(taglineTextRef.current, { opacity: 0, y: -6,  duration: 0.60, ease: "power2.in" }, 4.30);

    // 4.5–5.28s  fan scales down and fades (like it folds away)
    tl.to(fanRef.current, {
      scale: 0.90, opacity: 0, duration: 0.78, ease: "power2.in",
      transformOrigin: "50% 80%",
    }, 4.50);

    tl.to(atmosphereRef.current, { opacity: 0, duration: 0.5, ease: "power1.in" }, 4.60);

    // 5.28–6.0s  overlay dissolves revealing homepage
    tl.to(overlayRef.current, { opacity: 0, duration: 0.72, ease: "power2.inOut" }, 5.28);

  }, { scope: overlayRef, dependencies: [] });

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{ background: "#081426" }}
    >
      {/* Skip button — elegant, bottom-right, readable but unobtrusive */}
      <button
        onClick={handleSkip}
        className="absolute bottom-8 right-9 z-10 text-[0.68rem] font-light tracking-[0.24em] uppercase transition-opacity duration-300"
        style={{
          color: "#DCEAF7",
          opacity: 0.68,
          padding: "0.35rem 0.6rem",
          border: "1px solid rgba(220, 234, 247, 0.20)",
          borderRadius: "2px",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.72")}
        aria-label="Bỏ qua phần giới thiệu"
      >
        Bỏ qua
      </button>

      {/* Subtle vignette */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 80% at 50% 48%, transparent 35%, #081426 100%)",
        }}
      />

      {/* Main content */}
      <div
        ref={wrapperRef}
        className="relative flex flex-col items-center select-none"
        style={{ opacity: 0, gap: "1.4rem" }}
      >
        {/* Fan SVG wrapper — exit animation target */}
        <div ref={fanRef}>
          <FanSVG
            containerRef={svgRef}
            ribGroupsRef={ribGroupsRef}
            paperGroupRef={paperGroupRef as React.RefObject<SVGGElement | null>}
            lightSweepRef={lightSweepRef as React.RefObject<SVGGElement | null>}
            pivotRef={pivotRef as React.RefObject<SVGGElement | null>}
            atmosphereRef={atmosphereRef as React.RefObject<SVGGElement | null>}
          />
        </div>

        {/* Brand name — overflow:hidden creates the sliding mask */}
        <div ref={brandClipRef} style={{ overflow: "hidden", lineHeight: 1 }}>
          <span
            ref={brandTextRef}
            style={{
              display: "block",
              fontFamily: "var(--font-eb-garamond), Georgia, serif",
              fontSize: "clamp(2.2rem, 5vw, 2.9rem)",
              fontWeight: 500,
              letterSpacing: "0.16em",
              color: "#F5EFE4",
              opacity: 0,
            }}
          >
            Nan
          </span>
        </div>

        {/* Thin divider line below brand (decorative) */}
        <div
          style={{
            width: "2.4rem",
            height: "1px",
            background: "linear-gradient(90deg, transparent, #C4A870, transparent)",
            marginTop: "-0.7rem",
            opacity: 0.6,
          }}
        />

        {/* Tagline — same slide-up mask */}
        <div ref={taglineClipRef} style={{ overflow: "hidden", lineHeight: 1, marginTop: "-0.2rem" }}>
          <span
            ref={taglineTextRef}
            style={{
              display: "block",
              fontFamily: "var(--font-geist-sans), sans-serif",
              fontSize: "0.62rem",
              fontWeight: 300,
              letterSpacing: "0.28em",
              textTransform: "uppercase",
              color: "#DCEAF7",
              opacity: 0,
            }}
          >
            Di sản trong từng nếp quạt.
          </span>
        </div>
      </div>
    </div>
  );
}
