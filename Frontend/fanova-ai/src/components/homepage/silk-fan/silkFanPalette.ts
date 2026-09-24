/**
 * Every literal color and font-family value used by the silk-fan hero port -- buildSilk,
 * bambooRib, lightRib, renderSilk, and the hero init block in reference/nan-landing.js (lines
 * 148-356). Copied verbatim; H1 does not change any color.
 *
 * Named by role, not consolidated into a smaller shared set: several distinct roles in the
 * original happen to reuse the same hex value (the rays/inner-arc/rim gold line and the rib
 * gem-deco gold are both #C9A84C; the pivot circle's stroke and a gold-foil stop are both
 * #8C6D23). Kept as separate named exports per role anyway, so a future change to one role's
 * color can never silently also change an unrelated one that just happened to match today.
 */

// ─── Rays + gold accent lines (buildSilk) ──────────────────────────────────
// Same value used for: the rays group's stroke, the rays' own outer arc stroke, the inner-edge
// arc (F.inner), and the outer rim (F.rim) -- genuinely the same "thin gold line" role reused
// across those four strokes in the original, not a coincidence.
export const goldLineStroke = "#C9A84C";

// ─── Silk fabric gradient (#nanSilk) ───────────────────────────────────────
// Stop offsets are partly dynamic (the first stop's offset is o.r1/(o.r2+20), computed from the
// fan's own radii) -- only the fixed colors live here; SilkFan.tsx reconstructs the full
// {offset, color} stop list the same way buildSilk did.
export const silkStops: readonly string[] = ["#142A56", "#1C3A73", "#234686", "#1A356E"];

// ─── Moving sheen band (#nanSheen) ──────────────────────────────────────────
export const sheenColor = "#F2F6FF";

// ─── Fine weave pattern (#nanWeave) ─────────────────────────────────────────
export const weaveStroke = "#FFFFFF";

// ─── Gold foil ink + one-time shine on the fan's text (#nanSilkFoil / #nanSilkShine) ───────
export const goldFoilStops: readonly string[] = ["#8C6D23", "#EBD38E", "#B8953C", "#F5E6AE", "#9C7C2E"];
export const silkShineColor = "#FFFFFF";
export const fontStack = "Cinzel, Georgia, serif";

// ─── Bamboo slat faces (#nanBamboo / #nanBambooG) ───────────────────────────
export const bambooFace = {
  inner: { edge: "#D9BF8E", mid: "#F2E6C8" }, // #nanBamboo -- inner slats
  guard: { edge: "#D2B47E", mid: "#EBDAB2" }, // #nanBambooG -- guard ribs
} as const;

// ─── Ambient occlusion under the fabric / near the rivet (#nanRibAO) ───────
export const ribAoColor = "#1E1204";

// ─── Per-fold shade/light gradients (h.gd / h.gl in buildSilk) ─────────────
export const foldShadeColor = "#020822";
export const foldLightColor = "#EEF3FF";

// ─── Rib ridge/crease strokes (buildSilk's `edges` group) ──────────────────
export const ridgeStroke = "rgba(5,10,40,.26)";
export const creaseStroke = "#DCE6FF";

// ─── Center pivot (buildSilk, drawn over the fabric) ────────────────────────
export const pivotFill = "#C9A84C";
export const pivotFillStroke = "#8C6D23";
export const pivotRingStroke = "#F3E3A8";
export const pivotCenterFill = "#081243";

// ─── Bamboo rib shading (bambooRib) ─────────────────────────────────────────
export const ribShadowFill = "rgba(20,14,4,.18)";
export const ribSlatStroke = "#B89868";
export const ribShadeColor = "#2A1A05";
export const ribHighlightColor = "#FFF6E0";
export const ribInlayColor = "#E3C66E";

// ─── Rib gem decoration (bambooRib's `deco` param -- front guard only) ─────
export const gemFill = "#C9A84C";
export const gemStroke = "#8C6D23";
export const gemHighlightFill = "#F7EBC0";
