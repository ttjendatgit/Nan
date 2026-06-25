"use client";

// Nan narrative motif — the fan thread.
// A single 1px vertical line on the left margin that draws as the user
// scrolls through the brand journey (BrandStatement → FinalCTA).
// Represents the craft path of the fan unfolding across the story.
//
// Architecture: GSAP-only leaf. Never mixed with motion/react elements.
// Reduced motion: entire component returns null.
// Mobile: hidden below lg breakpoint (no left margin space on narrow screens).

import { useRef, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function HomepageNarrativeMotif() {
  const lineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || !lineRef.current) return;

    // Use the narrative wrapper (BrandStatement → FinalCTA) as the scroll range.
    const narrativeEl = document.getElementById("homepage-narrative");
    if (!narrativeEl) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        lineRef.current,
        { scaleY: 0, transformOrigin: "top center" },
        {
          scaleY: 1,
          ease: "none",
          scrollTrigger: {
            trigger: narrativeEl,
            start: "top 60%",   // thread begins drawing when narrative enters view
            end: "bottom 40%",  // thread fully drawn near the end of the journey
            scrub: 1.2,
          },
        }
      );
    });

    return () => ctx.revert();
  }, []);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed left-3 top-0 z-[2] h-screen hidden lg:block"
    >
      <div
        ref={lineRef}
        className="h-full w-px"
        style={{
          // Subtle gradient: transparent at edges, quiet ice-blue in the middle.
          // More visible on dark navy sections (BrandStatement, Solution, FinalCTA),
          // less visible on light sections (Problem, ProductType, Process) —
          // this natural contrast behavior reinforces the problem→solution shift.
          background:
            "linear-gradient(to bottom, transparent 0%, rgba(220,234,247,0.08) 12%, rgba(220,234,247,0.13) 42%, rgba(220,234,247,0.10) 70%, rgba(220,234,247,0.05) 90%, transparent 100%)",
        }}
      />
    </div>
  );
}
