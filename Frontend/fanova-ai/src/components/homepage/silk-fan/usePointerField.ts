/**
 * H3: one smoothed pointer-position source shared by every layer of HeroSilkStage (the fan's CSS
 * 3D tilt, SilkFan's own internal tilt via its new tiltRef prop, and both canvases' camera shift)
 * instead of each layer tracking pointermove on its own.
 *
 * Returns a stable ref, never React state or a prop that changes every frame: pointer position can
 * change up to 60x/second, and pushing that through state/props would mean the same number of
 * re-renders for no benefit -- the same reasoning SilkFan.tsx's own render loop is already built
 * on. Callers (HeroSilkStage, and the per-canvas camera components it renders) read `.current`
 * inside their own useFrame/rAF loop.
 */

import { useEffect, useRef, type RefObject } from "react";

export interface PointerFieldValue {
  /** Normalized to the viewport, roughly [-1, 1]: -1 at the left/top edge, 1 at the right/bottom. */
  x: number;
  y: number;
}

export interface UsePointerFieldOptions {
  /** Exponential smoothing rate, per second: current += (target-current)*(1-exp(-dt*damping)). */
  damping: number;
  /** pointer:coarse: amplitude of the automatic idle sway on x (same rough unit as x/y). */
  mobileIdleAmplitude: number;
  /** pointer:coarse: period of the automatic idle sway, in seconds. */
  idlePeriodSec: number;
  /** pointer:coarse (H6): y target = easeOutCubic(min(1, progress / scrollTiltPeakAt)) × this,
   * where progress is scrollTargetRef's scroll-out progress (0..1). */
  scrollInfluence: number;
  /** pointer:coarse (H6-tune): scroll progress at which y reaches its full value; held there from
   * this point until the element has scrolled out. */
  scrollTiltPeakAt: number;
  /** pointer:coarse (H6): the element whose scroll-out progress drives y -- 0 at its initial
   * position (page scrolled to the top), 1 exactly when its bottom edge leaves the viewport's top
   * edge. HeroSilkStage passes its own container, i.e. the fan block itself. */
  scrollTargetRef: RefObject<HTMLElement | null>;
  /** Whether the loop should run right now -- HeroSilkStage passes its own IntersectionObserver-
   * derived visibility here instead of this hook creating a second observer. */
  active: boolean;
  reduceMotion: boolean;
  coarsePointer: boolean;
}

export function usePointerField({
  damping,
  mobileIdleAmplitude,
  idlePeriodSec,
  scrollInfluence,
  scrollTiltPeakAt,
  scrollTargetRef,
  active,
  reduceMotion,
  coarsePointer,
}: UsePointerFieldOptions): RefObject<PointerFieldValue> {
  const valueRef = useRef<PointerFieldValue>({ x: 0, y: 0 });

  useEffect(() => {
    if (reduceMotion) {
      // Always (0, 0), no loop at all -- per the task's explicit instruction.
      valueRef.current.x = 0;
      valueRef.current.y = 0;
      return;
    }
    if (!active) return;

    const target: PointerFieldValue = { x: 0, y: 0 };
    let pointerMoveHandler: ((e: PointerEvent) => void) | null = null;

    if (!coarsePointer) {
      pointerMoveHandler = (e: PointerEvent) => {
        target.x = (e.clientX / window.innerWidth) * 2 - 1;
        target.y = (e.clientY / window.innerHeight) * 2 - 1;
      };
      window.addEventListener("pointermove", pointerMoveHandler, { passive: true });
    }

    // Pointer leaving the window drifts the target back to center, same smoothing as everything
    // else -- not a snap.
    function resetTarget() {
      target.x = 0;
      target.y = 0;
    }
    document.addEventListener("pointerleave", resetTarget);
    window.addEventListener("blur", resetTarget);

    // H6: on pointer:coarse, y follows how far the scroll target has scrolled out of view. A passive
    // scroll/resize listener only writes the new target -- the smoothing toward it happens in the
    // existing rAF loop below, not in a loop of its own.
    let scrollProgress = 0;
    let scrollHandler: (() => void) | null = null;
    if (coarsePointer) {
      scrollHandler = () => {
        const el = scrollTargetRef.current;
        if (!el) return;
        // The element's bottom edge in document coordinates is how far the page must scroll for
        // that edge to reach the viewport's top -- progress is the fraction of that already scrolled.
        const docBottom = el.getBoundingClientRect().bottom + window.scrollY;
        scrollProgress = docBottom > 0 ? Math.min(1, Math.max(0, window.scrollY / docBottom)) : 1;
      };
      scrollHandler();
      window.addEventListener("scroll", scrollHandler, { passive: true });
      window.addEventListener("resize", scrollHandler, { passive: true });
    }

    let rafId: number;
    let lastTs: number | null = null;

    function loop(ts: number) {
      // Clamped so a long background-tab pause (no rAF ticks) doesn't produce one huge smoothing
      // jump on the next visible frame -- still real elapsed time, not a frame count.
      const dtSec = lastTs === null ? 0 : Math.min(0.1, (ts - lastTs) / 1000);
      lastTs = ts;

      if (coarsePointer) {
        // No real pointer to follow: x keeps a slow, gentle auto-sway so the space still "breathes";
        // y is driven by scroll (see scrollHandler above) -- the fan leans back and the cameras
        // shift as the hero scrolls away, and return as it scrolls back.
        const t = ts / 1000;
        const period = Math.max(0.001, idlePeriodSec);
        target.x = Math.sin((t * Math.PI * 2) / period) * mobileIdleAmplitude;
        // H6-tune: eased and front-loaded -- full tilt is reached at scrollTiltPeakAt, not only as the
        // fan is already leaving the screen.
        const peakT = Math.min(1, scrollProgress / Math.max(0.001, scrollTiltPeakAt));
        target.y = (1 - Math.pow(1 - peakT, 3)) * scrollInfluence;
      }

      const alpha = 1 - Math.exp(-dtSec * damping);
      valueRef.current.x += (target.x - valueRef.current.x) * alpha;
      valueRef.current.y += (target.y - valueRef.current.y) * alpha;

      rafId = requestAnimationFrame(loop);
    }
    rafId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafId);
      if (pointerMoveHandler) window.removeEventListener("pointermove", pointerMoveHandler);
      document.removeEventListener("pointerleave", resetTarget);
      window.removeEventListener("blur", resetTarget);
      if (scrollHandler) {
        window.removeEventListener("scroll", scrollHandler);
        window.removeEventListener("resize", scrollHandler);
      }
    };
  }, [damping, mobileIdleAmplitude, idlePeriodSec, scrollInfluence, scrollTiltPeakAt, scrollTargetRef, active, reduceMotion, coarsePointer]);

  return valueRef;
}
