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
  /** pointer:coarse fallback: amplitude of the automatic idle sway (same rough unit as x/y). */
  idleAmplitude: number;
  /** pointer:coarse fallback: period of the automatic idle sway, in seconds. */
  idlePeriodSec: number;
  /** Whether the loop should run right now -- HeroSilkStage passes its own IntersectionObserver-
   * derived visibility here instead of this hook creating a second observer. */
  active: boolean;
  reduceMotion: boolean;
  coarsePointer: boolean;
}

export function usePointerField({
  damping,
  idleAmplitude,
  idlePeriodSec,
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

    let rafId: number;
    let lastTs: number | null = null;

    function loop(ts: number) {
      // Clamped so a long background-tab pause (no rAF ticks) doesn't produce one huge smoothing
      // jump on the next visible frame -- still real elapsed time, not a frame count.
      const dtSec = lastTs === null ? 0 : Math.min(0.1, (ts - lastTs) / 1000);
      lastTs = ts;

      if (coarsePointer) {
        // No real pointer to follow -- a slow, gentle auto-sway so the space still "breathes"
        // instead of sitting perfectly static. Y uses a slightly different period/phase/amplitude
        // than X so the two don't trace a perfectly repeating diagonal line.
        const t = ts / 1000;
        const period = Math.max(0.001, idlePeriodSec);
        target.x = Math.sin((t * Math.PI * 2) / period) * idleAmplitude;
        target.y = Math.sin((t * Math.PI * 2) / (period * 1.3) + 1.1) * idleAmplitude * 0.5;
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
    };
  }, [damping, idleAmplitude, idlePeriodSec, active, reduceMotion, coarsePointer]);

  return valueRef;
}
