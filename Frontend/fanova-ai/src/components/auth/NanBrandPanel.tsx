"use client";

import { motion, useReducedMotion } from "motion/react";

/**
 * Nan fan visual — decorative SVG for the auth scene.
 * Rendered as a standalone component that floats over the shared dark background.
 * No separate panel background — the AuthScene provides the dark atmosphere.
 */
export default function NanBrandPanel() {
  const shouldReduce = useReducedMotion();

  return (
    <div className="relative flex flex-col items-center justify-center select-none">

      {/* Blue atmospheric halo behind fan — more visible now */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: [
            /* Wide top glow — lights up ribs from behind */
            "radial-gradient(ellipse 90% 70% at 50% 58%, rgba(17,79,153,0.42) 0%, transparent 68%)",
            /* Concentrated pivot glow */
            "radial-gradient(ellipse 60% 45% at 50% 92%, rgba(8,51,125,0.50) 0%, transparent 100%)",
            /* Gold warmth at pivot */
            "radial-gradient(ellipse 32% 16% at 50% 100%, rgba(236,202,62,0.10) 0%, transparent 100%)",
          ].join(", "),
        }}
      />

      {/* Brand wordmark — above the fan */}
      <div className="relative z-10 mb-4 flex flex-col items-center gap-2 text-center">
        {/* Gold rule above Nan */}
        <div className="h-px w-12 bg-gradient-to-r from-transparent via-[#ECCA3E]/70 to-transparent" />
        <span
          className="mt-3 leading-none tracking-wide text-[#EAF3FC]"
          style={{
            fontFamily: "var(--font-eb-garamond), Georgia, serif",
            fontSize: "clamp(52px, 6vw, 72px)",
            fontWeight: 600,
          }}
        >
          Nan
        </span>
        <span
          className="font-mono uppercase text-[#5580A8]"
          style={{ fontSize: "7px", letterSpacing: "0.46em" }}
        >
          Custom Fan Design
        </span>
        <p
          className="text-[#7A9FC0] mt-1"
          style={{ fontSize: "12px", lineHeight: 1.6, maxWidth: "16ch" }}
        >
          Di sản trong từng nếp quạt
        </p>
        {/* Gold rule below tagline */}
        <div className="mt-1 h-px w-8" style={{ background: "rgba(236,202,62,0.30)" }} />
      </div>

      {/* ── Fan SVG ───────────────────────────────────────────────────────────
          Pivot at (200, 390). 15 ribs, span ±42° from vertical (up).
          Radius = 260. 7 concentric arcs. Graduated rib weights.
          Glow layers: blue atmospheric + warm gold at pivot.
          Ribs brighter and more legible than before.
      ──────────────────────────────────────────────────────────────────────── */}
      <motion.svg
        viewBox="0 0 400 400"
        fill="none"
        aria-hidden="true"
        className="relative z-10 w-full max-w-[420px]"
        initial={shouldReduce ? false : { opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
      >
        <defs>
          {/* Rib gradient — noticeably more visible */}
          <linearGradient id="ribGrad" gradientUnits="userSpaceOnUse" x1="200" y1="390" x2="200" y2="80">
            <stop offset="0%"   stopColor="#DCEAF7" stopOpacity="0.00" />
            <stop offset="20%"  stopColor="#DCEAF7" stopOpacity="0.16" />
            <stop offset="60%"  stopColor="#DCEAF7" stopOpacity="0.38" />
            <stop offset="100%" stopColor="#E8F2FC" stopOpacity="0.62" />
          </linearGradient>

          {/* Center ribs — most luminous */}
          <linearGradient id="ribCenter" gradientUnits="userSpaceOnUse" x1="200" y1="390" x2="200" y2="80">
            <stop offset="0%"   stopColor="#DCEAF7" stopOpacity="0.00" />
            <stop offset="20%"  stopColor="#AECDE8" stopOpacity="0.18" />
            <stop offset="60%"  stopColor="#DCEAF7" stopOpacity="0.48" />
            <stop offset="100%" stopColor="#E8F2FC" stopOpacity="0.78" />
          </linearGradient>

          {/* Panel fill gradient — slightly more presence */}
          <linearGradient id="panelGrad" gradientUnits="userSpaceOnUse" x1="200" y1="390" x2="200" y2="80">
            <stop offset="0%"   stopColor="#DCEAF7" stopOpacity="0.000" />
            <stop offset="100%" stopColor="#DCEAF7" stopOpacity="0.072" />
          </linearGradient>

          {/* Pivot atmospheric glow — richer blue */}
          <radialGradient id="pivAtmos" cx="50%" cy="97.5%" r="45%">
            <stop offset="0%"   stopColor="#2468D8" stopOpacity="0.55" />
            <stop offset="45%"  stopColor="#1E4FA0" stopOpacity="0.20" />
            <stop offset="100%" stopColor="#1E4FA0" stopOpacity="0" />
          </radialGradient>

          {/* Wide fan ambient */}
          <radialGradient id="fanAmb" cx="50%" cy="72%" r="58%">
            <stop offset="0%"   stopColor="#1840A0" stopOpacity="0.30" />
            <stop offset="100%" stopColor="#183880" stopOpacity="0" />
          </radialGradient>

          {/* Gold glow at pivot — slightly warmer */}
          <radialGradient id="goldGlow" cx="50%" cy="97.5%" r="14%">
            <stop offset="0%"   stopColor="#ECCA3E" stopOpacity="0.48" />
            <stop offset="55%"  stopColor="#ECCA3E" stopOpacity="0.10" />
            <stop offset="100%" stopColor="#ECCA3E" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Wide ambient */}
        <ellipse cx="200" cy="290" rx="220" ry="160" fill="url(#fanAmb)" />
        {/* Pivot blue glow */}
        <ellipse cx="200" cy="390" rx="190" ry="110" fill="url(#pivAtmos)" />
        {/* Gold warmth */}
        <ellipse cx="200" cy="390" rx="70" ry="48" fill="url(#goldGlow)" />

        {/*
          15 ribs from pivot (200,390), r=260, spanning 48° to 132° from x-axis.
          step = (132-48)/14 = 6°
          θ: 48,54,60,66,72,78,84,90,96,102,108,114,120,126,132

          Tips (rounded): 
          48°:  x=200+260·cos48°=200+174=374, y=390-260·sin48°=390-193=197  → (374,197)
          54°:  x=200+260·cos54°=200+153=353, y=390-260·sin54°=390-210=180  → (353,180)
          60°:  x=200+260·cos60°=200+130=330, y=390-260·sin60°=390-225=165  → (330,165)
          66°:  x=200+260·cos66°=200+106=306, y=390-260·sin66°=390-237=153  → (306,153)
          72°:  x=200+260·cos72°=200+80=280,  y=390-260·sin72°=390-247=143  → (280,143)
          78°:  x=200+260·cos78°=200+54=254,  y=390-260·sin78°=390-254=136  → (254,136)
          84°:  x=200+260·cos84°=200+27=227,  y=390-260·sin84°=390-258=132  → (227,132)
          90°:  x=200,                          y=390-260=130                → (200,130)
          96°:  x=200-27=173,                  y=132                        → (173,132)
          102°: x=200-54=146,                  y=136                        → (146,136)
          108°: x=200-80=120,                  y=143                        → (120,143)
          114°: x=200-106=94,                  y=153                        → (94,153)
          120°: x=200-130=70,                  y=165                        → (70,165)
          126°: x=200-153=47,                  y=180                        → (47,180)
          132°: x=200-174=26,                  y=197                        → (26,197)
        */}

        {/* ── Panel fills (alternating segments for paper-fold effect) ── */}
        <path d="M200,390 L374,197 A260,260 0 0,0 353,180 Z" fill="url(#panelGrad)" />
        <path d="M200,390 L330,165 A260,260 0 0,0 306,153 Z" fill="url(#panelGrad)" />
        <path d="M200,390 L280,143 A260,260 0 0,0 254,136 Z" fill="url(#panelGrad)" />
        <path d="M200,390 L227,132 A260,260 0 0,0 200,130 Z" fill="url(#panelGrad)" opacity="1.1" />
        <path d="M200,390 L173,132 A260,260 0 0,0 146,136 Z" fill="url(#panelGrad)" />
        <path d="M200,390 L120,143 A260,260 0 0,0 94,153  Z" fill="url(#panelGrad)" />
        <path d="M200,390 L70,165  A260,260 0 0,0 47,180  Z" fill="url(#panelGrad)" />

        {/* ── 15 Ribs — graduated weight, center thickest ── */}
        <line x1="200" y1="390" x2="374" y2="197" stroke="url(#ribGrad)"   strokeWidth="0.65" strokeLinecap="round" />
        <line x1="200" y1="390" x2="353" y2="180" stroke="url(#ribGrad)"   strokeWidth="0.78" strokeLinecap="round" />
        <line x1="200" y1="390" x2="330" y2="165" stroke="url(#ribGrad)"   strokeWidth="0.90" strokeLinecap="round" />
        <line x1="200" y1="390" x2="306" y2="153" stroke="url(#ribGrad)"   strokeWidth="1.00" strokeLinecap="round" />
        <line x1="200" y1="390" x2="280" y2="143" stroke="url(#ribCenter)" strokeWidth="1.08" strokeLinecap="round" />
        <line x1="200" y1="390" x2="254" y2="136" stroke="url(#ribCenter)" strokeWidth="1.14" strokeLinecap="round" />
        <line x1="200" y1="390" x2="227" y2="132" stroke="url(#ribCenter)" strokeWidth="1.18" strokeLinecap="round" />
        {/* Center — thickest */}
        <line x1="200" y1="390" x2="200" y2="130" stroke="url(#ribCenter)" strokeWidth="1.25" strokeLinecap="round" />
        {/* Mirror */}
        <line x1="200" y1="390" x2="173" y2="132" stroke="url(#ribCenter)" strokeWidth="1.18" strokeLinecap="round" />
        <line x1="200" y1="390" x2="146" y2="136" stroke="url(#ribCenter)" strokeWidth="1.14" strokeLinecap="round" />
        <line x1="200" y1="390" x2="120" y2="143" stroke="url(#ribCenter)" strokeWidth="1.08" strokeLinecap="round" />
        <line x1="200" y1="390" x2="94"  y2="153" stroke="url(#ribGrad)"   strokeWidth="1.00" strokeLinecap="round" />
        <line x1="200" y1="390" x2="70"  y2="165" stroke="url(#ribGrad)"   strokeWidth="0.90" strokeLinecap="round" />
        <line x1="200" y1="390" x2="47"  y2="180" stroke="url(#ribGrad)"   strokeWidth="0.78" strokeLinecap="round" />
        <line x1="200" y1="390" x2="26"  y2="197" stroke="url(#ribGrad)"   strokeWidth="0.65" strokeLinecap="round" />

        {/* ── 7 Concentric arcs — outer prominent, inner fades gracefully ── */}
        {/* r=260 outer — most visible, anchors the fan shape */}
        <path d="M26,197  A260,260 0 0,1 374,197" stroke="#DCEAF7" strokeWidth="1.10" strokeOpacity="0.36" fill="none" />
        {/* r=210 */}
        <path d="M51,226  A210,210 0 0,1 349,226" stroke="#DCEAF7" strokeWidth="0.82" strokeOpacity="0.27" fill="none" />
        {/* r=165 */}
        <path d="M73,254  A165,165 0 0,1 327,254" stroke="#DCEAF7" strokeWidth="0.65" strokeOpacity="0.21" fill="none" />
        {/* r=125 */}
        <path d="M93,279  A125,125 0 0,1 307,279" stroke="#DCEAF7" strokeWidth="0.52" strokeOpacity="0.16" fill="none" />
        {/* r=88 */}
        <path d="M111,302 A88,88   0 0,1 289,302" stroke="#DCEAF7" strokeWidth="0.42" strokeOpacity="0.12" fill="none" />
        {/* r=55 */}
        <path d="M127,326 A55,55   0 0,1 273,326" stroke="#DCEAF7" strokeWidth="0.34" strokeOpacity="0.09" fill="none" />
        {/* r=28 innermost */}
        <path d="M145,363 A28,28   0 0,1 255,363" stroke="#DCEAF7" strokeWidth="0.26" strokeOpacity="0.06" fill="none" />

        {/* ── Gold pivot hardware — layered ── */}
        {/* Outer halo */}
        <circle cx="200" cy="390" r="20" fill="none" stroke="#ECCA3E" strokeWidth="0.22" strokeOpacity="0.12" />
        <circle cx="200" cy="390" r="13" fill="none" stroke="#ECCA3E" strokeWidth="0.28" strokeOpacity="0.18" />
        {/* Main ring */}
        <circle cx="200" cy="390" r="8"  fill="none" stroke="#ECCA3E" strokeWidth="0.95" strokeOpacity="0.60" />
        {/* Inner ring detail */}
        <circle cx="200" cy="390" r="5.5" fill="none" stroke="#ECCA3E" strokeWidth="0.32" strokeOpacity="0.28" />
        {/* Pearl disc */}
        <circle cx="200" cy="390" r="3.2" fill="#E8F2FC" fillOpacity="0.45" />
        {/* Gold center dot */}
        <circle cx="200" cy="390" r="1.4" fill="#ECCA3E" fillOpacity="0.82" />
        {/* Crosshair — subtle engineering detail */}
        <line x1="200" y1="383" x2="200" y2="397" stroke="#ECCA3E" strokeWidth="0.22" strokeOpacity="0.16" />
        <line x1="193" y1="390" x2="207" y2="390" stroke="#ECCA3E" strokeWidth="0.22" strokeOpacity="0.16" />
      </motion.svg>
    </div>
  );
}
