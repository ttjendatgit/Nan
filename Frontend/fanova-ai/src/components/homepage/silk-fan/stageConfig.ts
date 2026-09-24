/**
 * Every tunable number for the three.js space that surrounds SilkFan (particle counts, sizes,
 * speeds, opacities, glow position) gathered in one place, per the task's own requirement. No
 * color lives here -- colors come from silkFanPalette.ts, read by HeroSilkStage/GoldDust/Glow at
 * call time, so a future palette change (e.g. to the real Nan color system) propagates here too.
 */

import { LIGHT } from "./silkFanMath";

// Shared by both canvas layers (back + front) so a later parallax pass (H3) has a single source
// of truth for camera parameters instead of two configs that could drift apart.
export const cameraConfig = {
  position: [0, 0, 8] as [number, number, number],
  fov: 50,
  near: 0.1,
  far: 40,
};

// Horizontal/vertical spawn + wrap extent shared by both dust layers, so particles from either
// canvas cover the same stage area regardless of which layer (back/front) they belong to.
const spreadX: [number, number] = [-6, 6];
const spreadY: [number, number] = [-5, 5];

export const dustConfig = {
  // Behind the fan (see HeroSilkStage: this canvas is the lowest DOM layer) -- dense, small, slow.
  back: {
    count: 500,
    countReduced: 250, // small screens / pointer:coarse -- roughly half
    sizeRange: [0.05, 0.14] as [number, number],
    opacityRange: [0.15, 0.5] as [number, number],
    depthRange: [-9, -2] as [number, number], // far side of this layer's own camera
    speed: 0.12, // world units / second, upward drift
    spreadX,
    spreadY,
    swayAmplitude: 0.12,
    swayFrequency: 0.25,
  },
  // In front of the fan (highest DOM layer, pointer-events:none) -- sparse, big, faint, slower.
  // "Bigger and blurrier" is approximated with larger size + lower opacity (no postprocessing/
  // depth-of-field is allowed for H2), not literal optical blur.
  front: {
    count: 22,
    countReduced: 11,
    sizeRange: [0.3, 0.6] as [number, number],
    opacityRange: [0.05, 0.16] as [number, number],
    depthRange: [2, 5] as [number, number], // near side of this layer's own camera
    speed: 0.05,
    spreadX,
    spreadY,
    swayAmplitude: 0.18,
    swayFrequency: 0.18,
  },
};

// Glow: a soft radial plane rendered inside the BACK canvas (so plain CSS stacking already puts
// it behind the SVG fan -- see HeroSilkStage; there is no real 3D compositing between the SVG and
// either canvas). Its center is offset toward the upper-left, matching the fan's own light
// direction (silkFanMath's LIGHT = normalize([-0.45,-0.55,0.7]), i.e. "light from the upper-left"
// per this task's own framing) so the space's ambient glow and the lighting already modeled on the
// silk tell the same visual story instead of two independent, potentially contradictory light
// sources.
//
// Sign mapping: LIGHT[0] (x) is already negative (left) and is used as-is. LIGHT[1] is negative in
// the fan's own SVG/y-down 2D convention; this stage's Three.js world is Y-up, so it is sign-
// flipped here to land as a positive (upward) offset instead of a downward one.
const GLOW_OFFSET_SCALE = 3.2;
export const glowConfig = {
  offsetX: LIGHT[0] * GLOW_OFFSET_SCALE,
  offsetY: -LIGHT[1] * GLOW_OFFSET_SCALE,
  z: -8.5, // the farthest-back object in the back canvas's scene
  radius: 9,
  intensity: 0.22, // kept low -- the fan stays the visual center, not the glow
};

// How long the whole space takes to fade in once SilkFan's onOpened fires, and with what easing --
// identical to the rays' own fade (SilkFan.tsx), so the space "switches on" in lockstep with the
// fan's own light instead of on its own independent timeline.
export const appearanceFadeMs = 2400;
export const appearanceFadeEasing = "ease";
