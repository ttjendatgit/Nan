"use client";

// Nan narrative motif — "Nếp Quạt" (The Fold-Line)
//
// A single golden fan-rib SVG arc that draws itself as the user scrolls
// through the brand journey (BrandStatement → FinalCTA).
// The path is a subtle quadratic bezier: starts at top, curves outward ~12px
// toward the content at mid-scroll, returns at the bottom — like one fold of a
// traditional Vietnamese fan rib seen from the side.
//
// A soft amber glow travels vertically with the reader through the dark sections,
// creating atmosphere without acting as a bright UI element.
//
// Architecture rules:
//  · GSAP-only leaf. Never mixed with motion/react elements.
//  · useGSAP + gsap.matchMedia for cleanup and responsive/reduced-motion handling.
//  · SVG stroke-dashoffset animation — no DrawSVG plugin required.
//  · Hidden below lg breakpoint (no left margin on narrow screens).

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// Fan-rib arc path — quadratic bezier in a 56×1000 viewBox.
// M 22 0            start: center of SVG at top
// Q 46 500          control: 24px right of center at y=500 (viewport mid)
// 22 1000           end: back to center at bottom
// Actual maximum x-deviation at t=0.5:
//   x(0.5) = 0.25×22 + 0.5×46 + 0.25×22 = 5.5 + 23 + 5.5 = 34
//   deviation = 34 - 22 = 12px — right at the brief's 12–15px target.
const ARC_PATH = "M 22 0 Q 46 500 22 1000";

export default function HomepageNarrativeMotif() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const arcRef    = useRef<SVGPathElement>(null);
  const glowRef   = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const narrativeEl = document.getElementById("homepage-narrative");
      if (!narrativeEl || !arcRef.current || !glowRef.current) return;

      const mm = gsap.matchMedia();

      // ── Desktop + standard motion ─────────────────────────────────────────
      mm.add(
        "(prefers-reduced-motion: no-preference) and (min-width: 1024px)",
        () => {
          // ── Arc: stroke-dashoffset reveal ──────────────────────────────────
          // getTotalLength() is safe here — the SVG is rendered and visible
          // (we're inside the (min-width: 1024px) branch = lg:block is active).
          const pathLength = arcRef.current!.getTotalLength();
          gsap.set(arcRef.current, {
            strokeDasharray: pathLength,
            strokeDashoffset: pathLength,
          });

          gsap.to(arcRef.current, {
            strokeDashoffset: 0,
            ease: "none",
            scrollTrigger: {
              trigger: narrativeEl,
              start: "top 60%",    // arc begins when BrandStatement enters view
              end: "bottom 42%",   // arc completes near FinalCTA end
              scrub: 1.2,
              invalidateOnRefresh: true,
            },
          });

          // ── Ambient glow: travels with the reader through dark sections ────
          // Using a function value for `y` so ScrollTrigger.refresh() on resize
          // recalculates correctly (invalidateOnRefresh handles this).
          gsap.fromTo(
            glowRef.current,
            { y: window.innerHeight * 0.04 },
            {
              y: () => window.innerHeight * 0.80,
              ease: "none",
              scrollTrigger: {
                trigger: narrativeEl,
                start: "top 75%",
                end: "bottom 30%",
                scrub: 1.8,
                invalidateOnRefresh: true,
              },
            }
          );
        }
      );

      // ── Reduced motion: static, no arc draw, no glow travel ──────────────
      mm.add("(prefers-reduced-motion: reduce)", () => {
        gsap.set(arcRef.current, { opacity: 0 });
        gsap.set(glowRef.current, { opacity: 0 });
      });

      return () => mm.revert();
    },
    { scope: wrapperRef }
  );

  return (
    <div
      ref={wrapperRef}
      aria-hidden="true"
      className="pointer-events-none fixed left-0 top-0 z-[1] h-screen w-14 hidden lg:block"
    >
      {/* Fan-rib arc: a single stroked SVG path */}
      <svg
        width="56"
        height="100%"
        viewBox="0 0 56 1000"
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full overflow-visible"
        aria-hidden="true"
      >
        <path
          ref={arcRef}
          d={ARC_PATH}
          fill="none"
          stroke="rgba(236,202,62,0.14)"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>

      {/* Ambient gold glow: travels vertically with the reader.
          Visible on dark navy sections; near-invisible on light sections.
          Blur-[28px] creates soft spread without a crisp orb edge. */}
      <div
        ref={glowRef}
        aria-hidden="true"
        className="pointer-events-none absolute"
        style={{
          left: "-8px",
          top: 0,
          width: "72px",
          height: "72px",
          borderRadius: "50%",
          background:
            "radial-gradient(circle at center, rgba(236,202,62,0.09) 0%, rgba(236,202,62,0.04) 50%, transparent 72%)",
          filter: "blur(18px)",
        }}
      />
    </div>
  );
}
