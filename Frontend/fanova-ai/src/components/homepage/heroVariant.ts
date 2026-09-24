/**
 * Shared between HeroVisualStage.tsx (decides which visual stage component to mount) and
 * HeroSection.tsx (decides whether to render the "Architectural blue field" panel, a decoration
 * built specifically for the old three.js-only fan). Deliberately its own tiny, dependency-free
 * file: HeroSection.tsx needs this flag via a normal static import (so its render logic can branch
 * on it), and statically importing HeroVisualStage.tsx itself for that would drag its
 * `dynamic(() => import("./HeroCanvas"))` / `dynamic(() => import("./silk-fan/HeroSilkStage"))`
 * module graph into bundles that don't need it, defeating the point of those being ssr:false
 * dynamic imports in the first place.
 */

// "silk": the ported SVG fan + its three.js dust/glow space (HeroSilkStage). "legacy": the original
// three.js-only fan (HeroCanvas), kept as a rollback path, not deleted.
export const HERO_VARIANT: "silk" | "legacy" = "silk";
