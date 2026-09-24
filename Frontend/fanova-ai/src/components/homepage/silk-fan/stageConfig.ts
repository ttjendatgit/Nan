/**
 * Every tunable number for the three.js space that surrounds SilkFan (particle counts, sizes,
 * speeds, opacities, glow position) gathered in one place, per the task's own requirement. No
 * color lives here -- colors come from silkFanPalette.ts, read by HeroSilkStage/GoldDust/Glow at
 * call time, so a future palette change (e.g. to the real Nan color system) propagates here too.
 *
 * StageConfig/DEFAULT_STAGE_CONFIG/mergeStageConfig exist so HeroSilkStage can accept a runtime
 * `config?: Partial<StageConfig>` override (see the dev-only TuningPanel) without every caller
 * having to supply a complete config.
 */

import { LIGHT } from "./silkFanMath";

export type BlendingMode = "additive" | "normal";

export interface DustLayerConfig {
  count: number;
  /** Used on small screens / pointer:coarse instead of `count`. */
  countReduced: number;
  sizeRange: [number, number];
  opacityRange: [number, number];
  /** Spawn range along this layer's own camera-facing depth axis -- affects per-particle spawn
   * position, so changing it rebuilds the geometry (see GoldDust.tsx). */
  depthRange: [number, number];
  /** Base upward drift speed, world units/second. */
  speed: number;
  /** Horizontal/vertical spawn + wrap extent -- also rebuild-triggering, same reason as depthRange. */
  spreadX: [number, number];
  spreadY: [number, number];
  swayAmplitude: number;
  swayFrequency: number;
  blending: BlendingMode;
}

export interface GlowLayerConfig {
  offsetX: number;
  offsetY: number;
  z: number;
  radius: number;
  intensity: number;
  blending: BlendingMode;
}

export interface ParallaxConfig {
  /** Max CSS rotateY of the fan's wrapper, in degrees, at pointer.x = ±1. The dominant axis --
   * left/right pointer movement is what should read as "the fan turning". */
  fanMaxTiltYDeg: number;
  /** Max CSS rotateX of the fan's wrapper, in degrees, at pointer.y = ±1. Deliberately smaller than
   * fanMaxTiltYDeg -- a secondary, subtler axis. */
  fanMaxTiltXDeg: number;
  /** CSS perspective (px) on the fan's tilt wrapper. */
  perspectivePx: number;
  /** World units the back canvas's camera shifts at pointer = ±1 -- small: the far layer barely
   * moves. */
  backCameraShift: number;
  /** World units the front canvas's camera shifts at pointer = ±1 -- large: the near layer slides
   * noticeably more than the back layer for the same pointer movement, which is what actually reads
   * as depth. */
  frontCameraShift: number;
  /** usePointerField's smoothing rate (see usePointerField.ts). */
  damping: number;
  /** usePointerField's pointer:coarse idle-sway amplitude. */
  idleAmplitude: number;
  /** usePointerField's pointer:coarse idle-sway period, in seconds. */
  idlePeriodSec: number;
  /** H3-polish: 1 (default) keeps H3's original "viewer moves" model -- camera shifts +x means the
   * viewer stepped to the right, and CSS rotateY(+) makes the fan's right edge recede accordingly,
   * matching that same viewer-side move. -1 flips *only* the fan's CSS tilt (rotateY and rotateX)
   * to the opposite, arguably equally valid "fan turns toward the cursor" model instead, without
   * touching the camera shift or SilkFan's own tiltRef-driven 2D rotation -- those keep the
   * original's untouched sign. See HeroSilkStage.tsx for where this is applied. */
  fanTiltDirection: 1 | -1;
}

export interface StageConfig {
  back: DustLayerConfig;
  front: DustLayerConfig;
  glow: GlowLayerConfig;
  parallax: ParallaxConfig;
  /** H3-polish: width of the soft mask-image fade at each of the two canvas wrappers' four edges,
   * as a percent of that wrapper's own width/height. Never applied to the SilkFan layer. */
  edgeFadePercent: number;
  /** H5: "nan" (default) resolves to NAN_PALETTE (derived from Nan's brand tokens); "original"
   * resolves to ORIGINAL_PALETTE (Lộc's hand-picked colors, unchanged). Read by both SilkFan (its
   * own SVG colors) and this component (the dust/glow gold tint), so both stay in sync -- see
   * silkFanPalette.ts. */
  palette: "original" | "nan";
}

// Shared by both canvas layers (back + front) so a later parallax pass (H3) has a single source
// of truth for camera parameters instead of two configs that could drift apart.
export const cameraConfig = {
  position: [0, 0, 8] as [number, number, number],
  fov: 50,
  near: 0.1,
  far: 40,
};

// The back layer's spawn/wrap extent covers the whole stage.
const backSpreadX: [number, number] = [-6, 6];
const backSpreadY: [number, number] = [-5, 5];

// The front layer's default spawn/wrap extent is deliberately narrow and centered -- roughly where
// the fan's own fabric sits on screen -- rather than sharing the back layer's full-width spread.
// H2's bug report: with the front layer's (few, large) particles scattered across the *whole* box,
// almost none of them ever actually crossed the fan's face, which is the one detail meant to read
// as depth. A centered band means a couple of them almost always are.
const frontSpreadX: [number, number] = [-2.6, 2.6];
const frontSpreadY: [number, number] = [-2.5, 1.8];

const GLOW_OFFSET_SCALE = 3.2;

// H2.5: every "H2 default" below was raised because the space was nearly invisible in practice --
// see each field's own comment for the old -> new numbers.
export const DEFAULT_STAGE_CONFIG: StageConfig = {
  // Behind the fan (see HeroSilkStage: this canvas is the lowest DOM layer) -- dense, small, slow.
  back: {
    count: 500,
    countReduced: 250, // small screens / pointer:coarse -- roughly half
    // H2 -> H2.5: opacity 0.15/0.5 -> 0.4/0.9 (~2.7x / ~1.8x -- the max is capped well under 1.0
    // rather than scaled a full 2-3x, since opacity can't exceed 1). Size 0.05/0.14 -> 0.08/0.21
    // (~1.5x both ends).
    sizeRange: [0.08, 0.21],
    opacityRange: [0.4, 0.9],
    depthRange: [-9, -2], // far side of this layer's own camera
    speed: 0.12, // world units / second, upward drift
    spreadX: backSpreadX,
    spreadY: backSpreadY,
    swayAmplitude: 0.12,
    swayFrequency: 0.25,
    blending: "additive",
  },
  // In front of the fan (highest DOM layer, pointer-events:none) -- sparse, big, faint, slower.
  // "Bigger and softer" is approximated with larger size + lower-than-back opacity (no
  // postprocessing/depth-of-field is allowed here), not literal optical blur.
  front: {
    // H2 -> H2.5: 22 -> 30 particles. Size 0.3/0.6 -> 0.45/0.85 (bigger). Opacity 0.05/0.16 ->
    // 0.08/0.28 (still fainter than the back layer, but no longer barely-there). Spawn region
    // narrowed to frontSpreadX/Y above instead of sharing the back layer's full-width spread.
    count: 30,
    countReduced: 15,
    sizeRange: [0.45, 0.85],
    opacityRange: [0.08, 0.28],
    depthRange: [2, 5], // near side of this layer's own camera
    speed: 0.05,
    spreadX: frontSpreadX,
    spreadY: frontSpreadY,
    swayAmplitude: 0.18,
    swayFrequency: 0.18,
    blending: "additive",
  },
  // Glow: a soft radial plane rendered inside the BACK canvas (so plain CSS stacking already puts
  // it behind the SVG fan -- see HeroSilkStage; there is no real 3D compositing between the SVG and
  // either canvas). Its center is offset toward the upper-left, matching the fan's own light
  // direction (silkFanMath's LIGHT = normalize([-0.45,-0.55,0.7]), i.e. "light from the upper-left"
  // per this task's own framing) so the space's ambient glow and the lighting already modeled on
  // the silk tell the same visual story instead of two independent, potentially contradictory
  // light sources.
  //
  // Sign mapping: LIGHT[0] (x) is already negative (left) and is used as-is. LIGHT[1] is negative
  // in the fan's own SVG/y-down 2D convention; this stage's Three.js world is Y-up, so it is sign-
  // flipped here to land as a positive (upward) offset instead of a downward one.
  glow: {
    offsetX: LIGHT[0] * GLOW_OFFSET_SCALE,
    offsetY: -LIGHT[1] * GLOW_OFFSET_SCALE,
    z: -8.5, // the farthest-back object in the back canvas's scene
    radius: 9,
    // H2 -> H2.5: 0.22 -> 0.5 -- too faint to read as a light source before. Kept well under 1 so
    // the fan, not the glow, stays the visual center.
    intensity: 0.2,
    blending: "additive",
  },
  // H3: one pointer field (usePointerField.ts) drives the fan's CSS 3D tilt, SilkFan's own
  // internal tilt, and both canvases' camera shift together. See HeroSilkStage.tsx's own comments
  // for the sign convention chosen for each of those three effects.
  parallax: {
    fanMaxTiltYDeg: 10,
    fanMaxTiltXDeg: 5,
    perspectivePx: 1200,
    backCameraShift: 0.4,
    frontCameraShift: 1.6,
    damping: 6,
    idleAmplitude: 0.35,
    idlePeriodSec: 9,
    // H4: made official for the real homepage -- "the fan turns toward the cursor" read better
    // than H3's original "viewer moves" default once compared on the actual Hero layout.
    fanTiltDirection: -1,
  },
  // H3-polish: both canvas wrappers fade to transparent at their own edges instead of cutting
  // particles off with a hard rectangle.
  edgeFadePercent: 12,
  // H5: "nan" is the official shipped default -- see silkFanPalette.ts. "original" (Lộc's colors)
  // stays fully available via this same field, for the TuningPanel comparison toggle.
  palette: "nan",
};

// Fills in any field HeroSilkStage's `config` prop doesn't override with DEFAULT_STAGE_CONFIG's
// value. A shallow merge per section is enough -- every DustLayerConfig/GlowLayerConfig field is a
// primitive or a fixed-length tuple treated as a single value, never a nested object of its own.
export function mergeStageConfig(overrides?: Partial<StageConfig>): StageConfig {
  return {
    back: { ...DEFAULT_STAGE_CONFIG.back, ...overrides?.back },
    front: { ...DEFAULT_STAGE_CONFIG.front, ...overrides?.front },
    glow: { ...DEFAULT_STAGE_CONFIG.glow, ...overrides?.glow },
    parallax: { ...DEFAULT_STAGE_CONFIG.parallax, ...overrides?.parallax },
    edgeFadePercent: overrides?.edgeFadePercent ?? DEFAULT_STAGE_CONFIG.edgeFadePercent,
    palette: overrides?.palette ?? DEFAULT_STAGE_CONFIG.palette,
  };
}

// How long the whole space takes to fade in once SilkFan's onOpened fires, and with what easing --
// identical to the rays' own fade (SilkFan.tsx), so the space "switches on" in lockstep with the
// fan's own light instead of on its own independent timeline.
export const appearanceFadeMs = 2400;
export const appearanceFadeEasing = "ease";
