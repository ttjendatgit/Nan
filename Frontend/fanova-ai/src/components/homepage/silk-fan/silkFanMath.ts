/**
 * Pure functions ported from reference/nan-landing.js -- geometry helpers (arc, F2, PP), motion
 * easing (smooth, soft2), the fixed light direction (LIGHT, HALF), and the two per-frame angle/
 * group-transform functions the hero's open animation and idle loop both call (openAngles,
 * openGroup). Every numeric constant is copied verbatim from the original; none of it is
 * recalculated or "simplified" here.
 *
 * openAngles/openGroup take their inputs as parameters instead of closing over the original's
 * module-level `RIBS` array, so this file has no external state and no React dependency at all --
 * SilkFan.tsx builds `RIBS`-equivalent data itself (from the fan's own `n`/`S`, known only after
 * buildSilk runs) and passes it in each call, once per animation frame, exactly as the original's
 * frame loop called `openAngles(p)`/`RIBS.map(...)`.
 */

/** Ported verbatim from `arc(r,a0,a1)` (nan-landing.js line 21-24). */
export function arc(r: number, a0: number, a1: number): string {
  function p(a: number): string {
    const rad = (a * Math.PI) / 180;
    return `${(r * Math.sin(rad)).toFixed(2)} ${(-r * Math.cos(rad)).toFixed(2)}`;
  }
  return `M${p(a0)} A${r} ${r} 0 0 1 ${p(a1)}`;
}

/** Ported verbatim from `smooth(x)` (line 146). */
export function smooth(x: number): number {
  const clamped = Math.max(0, Math.min(1, x));
  return clamped * clamped * (3 - 2 * clamped);
}

/** Ported verbatim from `soft2(x,c1)` (line 145). */
export function soft2(x: number, c1: number): number {
  const s = x * x * (3 - 2 * x);
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(s - 1, 3) + c1 * Math.pow(s - 1, 2);
}

/** Ported verbatim from `F2(q)` (line 264) -- formats a [x,y] pair for an SVG path `d` string. */
export function F2(q: readonly [number, number]): string {
  return `${q[0].toFixed(2)} ${q[1].toFixed(2)}`;
}

/** Ported verbatim from `PP(r,a)` (line 265) -- polar to cartesian, degrees in. */
export function PP(r: number, a: number): [number, number] {
  const rad = (a * Math.PI) / 180;
  return [r * Math.sin(rad), -r * Math.cos(rad)];
}

function normalize3(v: readonly [number, number, number]): [number, number, number] {
  const m = Math.hypot(v[0], v[1], v[2]);
  return [v[0] / m, v[1] / m, v[2] / m];
}

/** Ported verbatim from the LIGHT IIFE (line 262): a fixed, normalized light direction. */
export const LIGHT: readonly [number, number, number] = normalize3([-0.45, -0.55, 0.7]);

/** Ported verbatim from the HALF IIFE (line 263): the half-vector used for the specular term. */
export const HALF: readonly [number, number, number] = normalize3([LIGHT[0], LIGHT[1], LIGHT[2] + 1]);

/** One rib's closed/open angle pair, as built from `RIBS.push({open:-78+jj*SF.S,k:jj/NR})`
 * (line 322) -- `k` is this rib's position from 0 (innermost, pivot side) to 1 (outermost). */
export interface RibAngle {
  open: number;
  k: number;
}

/**
 * Ported from `openAngles(t)` (line 323-328). Takes `ribs` as a parameter instead of reading the
 * original's module-level `RIBS` -- the only actual external read in the original function.
 * -78/78 are NOT parameterized: in the original they're literal numbers, not a reference to
 * `o.half` (even though `o.half` is also 78 for this specific hero config) -- kept exactly as
 * literals here too, per "keep every geometry constant exactly as it is."
 */
export function openAngles(t: number, ribs: readonly RibAngle[]): number[] {
  const out: number[] = [];
  let prev = -1e9;
  ribs.forEach((r) => {
    const lag = 0.24 * Math.pow(1 - r.k, 1.3);
    const l = Math.max(0, Math.min(1, (t - lag) / (1 - lag)));
    const e = t >= 1 ? 1 : soft2(l, 0.45);
    let a = -78 + (r.open + 78) * e;
    a = Math.max(a, prev + 0.02);
    prev = a;
    out.push(a);
  });
  return out;
}

/** The group-level transform openGroup(t) produces each frame -- rotation, vertical drift, scale,
 * and the sheen band's base x position. */
export interface OpenGroupState {
  rot: number;
  dy: number;
  sc: number;
  sheenX: number;
}

/** Ported verbatim from `openGroup(t)` (line 329-330). No external reads in the original either,
 * kept as a pure function of `t` here for the same reason openAngles is. */
export function openGroup(t: number): OpenGroupState {
  const g = Math.min(1, t / 0.9);
  const up = smooth(t / 0.7);
  return {
    rot: 78 * (1 - (g >= 1 ? 1 : soft2(g, 0.32))),
    dy: 16 * (1 - up),
    sc: 0.95 + 0.05 * up,
    sheenX: -1100,
  };
}
