/**
 * Two palettes, same shape: ORIGINAL_PALETTE (Lộc's original hand-picked colors, port of
 * reference/nan-landing.js verbatim, kept and never deleted) and NAN_PALETTE (H5: every color
 * re-derived from Nan's own brand tokens). SilkFan.tsx and HeroSilkStage.tsx pick one via
 * StageConfig.palette ("original" | "nan").
 *
 * NAN_PALETTE derivation rule (per the H5 task): every gold color (gilt text, sheen band, gold
 * trim, rays, goldLineStroke, the gold rib inlay/gem decoration) is re-expressed in the hue and
 * saturation of #B6A17B (globals.css's --nan-material), keeping each original color's own
 * lightness -- so the metallic-sheen *shape* (which stops are darker/lighter) survives, only the
 * actual hue/chroma changes. Every silk/fabric color (the fabric gradient, sheen, fold shade/
 * light, ridge/crease strokes, the pivot's center fill) is re-expressed in the hue and saturation
 * of #192B88 (--nan-blue), again keeping each original's own lightness, so the fold-shadow effect
 * reads with the same contrast as before, just recolored. Two colors are already pure white
 * (weaveStroke, silkShineColor) -- white has no hue/saturation to redirect, so they're identical
 * in both palettes. Bamboo/rib colors (bambooFace, ribAoColor, ribShadowFill, ribSlatStroke,
 * ribShadeColor, ribHighlightColor) are explicitly UNCHANGED in NAN_PALETTE -- natural material,
 * not a brand color, per the task's own instruction.
 */

import { Cinzel } from "next/font/google";

// Only used by ORIGINAL_PALETTE, and only when someone actually switches to it (the TuningPanel
// comparison toggle, or a future caller passing palette:"original") -- preload:false per the task,
// since it's not on the default rendering path.
const cinzel = Cinzel({ subsets: ["latin"], weight: ["400"], preload: false });

export interface SilkFanPalette {
  // ─── Rays + gold accent lines (buildSilk) ──────────────────────────────────
  goldLineStroke: string;
  // ─── Silk fabric gradient (#nanSilk) ───────────────────────────────────────
  silkStops: readonly string[];
  // ─── Moving sheen band (#nanSheen) ──────────────────────────────────────────
  sheenColor: string;
  // ─── Fine weave pattern (#nanWeave) ─────────────────────────────────────────
  weaveStroke: string;
  // ─── Gold foil ink + one-time shine on the fan's text (#nanSilkFoil / #nanSilkShine) ───────
  goldFoilStops: readonly string[];
  silkShineColor: string;
  fontStack: string;
  // ─── Bamboo slat faces (#nanBamboo / #nanBambooG) -- unchanged across palettes ─────────────
  bambooFace: {
    inner: { edge: string; mid: string };
    guard: { edge: string; mid: string };
  };
  // ─── Ambient occlusion under the fabric / near the rivet (#nanRibAO) -- unchanged ─────────
  ribAoColor: string;
  // ─── Per-fold shade/light gradients (h.gd / h.gl in buildSilk) ─────────────
  foldShadeColor: string;
  foldLightColor: string;
  // ─── Rib ridge/crease strokes (buildSilk's `edges` group) ──────────────────
  ridgeStroke: string;
  creaseStroke: string;
  // ─── Center pivot (buildSilk, drawn over the fabric) ────────────────────────
  pivotFill: string;
  pivotFillStroke: string;
  pivotRingStroke: string;
  pivotCenterFill: string;
  // ─── Bamboo rib shading (bambooRib) -- unchanged ────────────────────────────
  ribShadowFill: string;
  ribSlatStroke: string;
  ribShadeColor: string;
  ribHighlightColor: string;
  // ─── Rib inlay hairline (Art Deco gold trim) ───────────────────────────────
  ribInlayColor: string;
  // ─── Rib gem decoration (bambooRib's `deco` param -- front guard only) ─────
  gemFill: string;
  gemStroke: string;
  gemHighlightFill: string;
}

// Bamboo/rib colors -- identical in both palettes (natural material, not a brand color).
const BAMBOO_FACE = {
  inner: { edge: "#D9BF8E", mid: "#F2E6C8" },
  guard: { edge: "#D2B47E", mid: "#EBDAB2" },
} as const;
const RIB_AO_COLOR = "#1E1204";
const RIB_SHADOW_FILL = "rgba(20,14,4,.18)";
const RIB_SLAT_STROKE = "#B89868";
const RIB_SHADE_COLOR = "#2A1A05";
const RIB_HIGHLIGHT_COLOR = "#FFF6E0";

export const ORIGINAL_PALETTE: SilkFanPalette = {
  goldLineStroke: "#C9A84C",
  silkStops: ["#142A56", "#1C3A73", "#234686", "#1A356E"],
  sheenColor: "#F2F6FF",
  weaveStroke: "#FFFFFF",
  goldFoilStops: ["#8C6D23", "#EBD38E", "#B8953C", "#F5E6AE", "#9C7C2E"],
  silkShineColor: "#FFFFFF",
  fontStack: `${cinzel.style.fontFamily}, Georgia, serif`,
  bambooFace: BAMBOO_FACE,
  ribAoColor: RIB_AO_COLOR,
  foldShadeColor: "#020822",
  foldLightColor: "#EEF3FF",
  ridgeStroke: "rgba(5,10,40,.26)",
  creaseStroke: "#DCE6FF",
  pivotFill: "#C9A84C",
  pivotFillStroke: "#8C6D23",
  pivotRingStroke: "#F3E3A8",
  pivotCenterFill: "#081243",
  ribShadowFill: RIB_SHADOW_FILL,
  ribSlatStroke: RIB_SLAT_STROKE,
  ribShadeColor: RIB_SHADE_COLOR,
  ribHighlightColor: RIB_HIGHLIGHT_COLOR,
  ribInlayColor: "#E3C66E",
  gemFill: "#C9A84C",
  gemStroke: "#8C6D23",
  gemHighlightFill: "#F7EBC0",
};

// H5: every value below was computed by converting the ORIGINAL_PALETTE color to HSL, replacing
// its hue+saturation with #B6A17B's (gold group) or #192B88's (silk group), and converting back --
// see this file's header comment and the H5 report's old->new table for the full derivation.
export const NAN_PALETTE: SilkFanPalette = {
  goldLineStroke: "#AC9469",
  silkStops: ["#101C5A", "#162679", "#1A2D8F", "#152473"],
  sheenColor: "#F4F5FD",
  weaveStroke: "#FFFFFF",
  goldFoilStops: ["#715F3E", "#D0C2A9", "#9D8457", "#DFD5C4", "#826D48"],
  silkShineColor: "#FFFFFF",
  fontStack: "var(--font-eb-garamond), Georgia, serif",
  bambooFace: BAMBOO_FACE,
  ribAoColor: RIB_AO_COLOR,
  foldShadeColor: "#060A1E",
  foldLightColor: "#F1F3FC",
  ridgeStroke: "rgba(7,12,38,.26)",
  creaseStroke: "#E1E5FA",
  pivotFill: "#AC9469",
  pivotFillStroke: "#715F3E",
  pivotRingStroke: "#DCD2BF",
  pivotCenterFill: "#0C143F",
  ribShadowFill: RIB_SHADOW_FILL,
  ribSlatStroke: RIB_SLAT_STROKE,
  ribShadeColor: RIB_SHADE_COLOR,
  ribHighlightColor: RIB_HIGHLIGHT_COLOR,
  ribInlayColor: "#C1B090",
  gemFill: "#AC9469",
  gemStroke: "#715F3E",
  gemHighlightFill: "#E6DED1",
};
