/**
 * JS mirror of the motion tokens in globals.css (--ease-nan, --ease-nan-ui, --ease-nan-state,
 * --dur-reveal, --dur-ui, --dur-state, --dur-signature, --dur-wipe). Motion and GSAP take numbers, not CSS custom properties,
 * so these are the values to import in components; keep both lists in sync.
 */

/** Content revealing as it enters the viewport. */
export const EASE_NAN = [0.16, 1, 0.3, 1] as const;
/** Hover, press, accordion, other direct UI response. */
export const EASE_NAN_UI = [0.23, 1, 0.32, 1] as const;
/** An in-place state change (e.g. the active Process step). */
export const EASE_NAN_STATE = [0.65, 0, 0.35, 1] as const;

/** Seconds. --dur-reveal is 700ms, 560ms below 768px. */
export const DUR_REVEAL = 0.7;
export const DUR_REVEAL_MOBILE = 0.56;
export const DUR_UI = 0.18;
export const DUR_STATE = 0.32;
/** R6: the three signature openings (BrandStatement image, Material deck, the fan masks). */
export const DUR_SIGNATURE = 0.9;
/** R6: clip / wipe reveals (Process frames, UseCase images, the Problem/Solution spread). */
export const DUR_WIPE = 0.52;

/** R6 "pleat rhythm": one fixed interval between repeated elements, like the folds of a fan.
 *  PLEAT for large elements (rows, sample strips), PLEAT_FINE for the 8 fold strips of Process F4b. */
export const PLEAT = 0.06;
export const PLEAT_FINE = 0.04;

/** Same breakpoint as the --dur-reveal override in globals.css. */
export const MOBILE_QUERY = "(max-width: 767px)";

/**
 * Transition for prefers-reduced-motion: the element lands on its final state at once, with no
 * duration and no delay. MotionConfig reducedMotion="user" already skips transform animations, but
 * not opacity or height, so reveals and the FAQ accordion pass this explicitly.
 */
export const INSTANT = { duration: 0, delay: 0 } as const;

/**
 * R6 clip-path start states: where a wipe opens from. Every one ends at CLIP_OPEN. Written with the
 * same four units (inset with %) so Motion can interpolate between any two of them.
 */
export const CLIP_OPEN = "inset(0% 0% 0% 0%)";
export const CLIP_FROM = {
  /** Opens from the left edge towards the right. */
  left: "inset(0% 100% 0% 0%)",
  /** Opens from the right edge towards the left. */
  right: "inset(0% 0% 0% 100%)",
  /** Opens from the top edge downwards. */
  top: "inset(0% 0% 100% 0%)",
  /** Opens from the bottom edge upwards. */
  bottom: "inset(100% 0% 0% 0%)",
  /** Opens from the centre point outwards. */
  center: "inset(50% 50% 50% 50%)",
} as const;

/**
 * A clip-path that hides an element completely also makes the browser report it as not
 * intersecting, so `whileInView` must never sit on the element being clipped. Put
 * `initial="hidden" whileInView="shown"` on an unclipped wrapper and give the clipped child
 * `variants={wipeVariants(CLIP_FROM.x)}`; Motion passes the state down.
 */
export function wipeVariants(from: string) {
  return { hidden: { clipPath: from }, shown: { clipPath: CLIP_OPEN } };
}

/** Fully open angle of the fan mask (.fan-mask in globals.css), each side of the vertical. */
export const FAN_OPEN_DEG = 80;
