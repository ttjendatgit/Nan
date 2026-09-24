"use client";

/**
 * The ambient background layers around HeroSection's fan area -- solid base color, grid texture,
 * focal light, left ambient accent, top/bottom fades -- extracted into one place (H4-polish) so
 * HeroSection.tsx and the dev-only /dev/silk-fan preview can never drift apart on what "the real
 * hero background" looks like. The dev page's whole point is tuning HeroSilkStage's config against
 * the *actual* background it will sit on, so the two need to render identical DOM/styles here.
 *
 * Deliberately excludes two elements that stay in HeroSection.tsx itself, gated on HERO_VARIANT:
 *  - The "Architectural blue field" panel -- built specifically for the old three.js-only fan
 *    (HeroCanvas); hidden for "silk" (see HeroSection.tsx), so it isn't part of this shared,
 *    variant-independent background.
 *  - The "Left-side text protection" gradient -- specific to protecting the text column's own
 *    legibility (and further gated on the mobile layout variant from H4), not a general ambient
 *    background; the dev page has no text column to protect.
 *
 * Render this inside a `position:relative` element whose own background-color is
 * HERO_BACKGROUND_COLOR (see HeroSection.tsx's <section> and the dev page's <main>).
 */

export const HERO_BACKGROUND_COLOR = "#0F1320";

export default function HeroSectionBackground() {
  return (
    <>
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

      {/* ── Single restrained focal light: separates the fan silhouette from the panel/canvas
          behind it. Tight radius, low opacity -- a hint of depth, not a spotlight. Not named in
          H4-polish's list of old-3D-fan-only decorations to hide, and not exclusively tied to the
          old fan by its own color/position the way the blue field panel is, so it's kept for both
          variants -- flagged here in case that reading turns out to be wrong. ── */}
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

      {/* ── Top + bottom gradient fades -- colors must stay in sync with HERO_BACKGROUND_COLOR
          above; Tailwind's arbitrary-value classes can't reference a JS constant directly. ── */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-[#0F1320] to-transparent"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-52 bg-gradient-to-t from-[#0F1320]/85 to-transparent"
      />
    </>
  );
}
