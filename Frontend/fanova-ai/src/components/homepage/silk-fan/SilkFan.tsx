"use client";

/**
 * React port of the hero silk fan from reference/nan-landing.js (the IIFE's `buildSilk`,
 * `bambooRib`, `lightRib`, `renderSilk`, and the hero init block starting at "// hero fan", line
 * 319 onward). H1 scope only: no three.js, this is the fan object alone, with identical geometry,
 * color, and motion. See src/types/contentSchemaNotes.md-style reasoning notes in the PR/task
 * report for the full audit of what was ported vs. dropped.
 *
 * Rendering approach matches the original exactly, per the task's own emphasis: React renders
 * nothing but `<svg ref={svgRef}>`. Every node inside it is built with `document.createElementNS`
 * inside a `useEffect`, and the animation frame loop mutates attributes on those nodes directly --
 * none of the few hundred per-frame attribute writes become React state or JSX. Turning any of
 * that into state would mean ~60 re-renders/sec for no benefit.
 *
 * Five things are deliberately different from the original script, all required to make a
 * page-scoped IIFE work as a reusable, unmountable React component:
 *   1. Every id under <defs> gets a unique prefix from useId() (sanitized -- useId()'s raw value
 *      contains ":" characters, which are invalid inside a url(#...) reference) so multiple
 *      SilkFan instances on one page never collide.
 *   2. `window.__nanSilkShine` becomes a local array inside the effect.
 *   3. Full cleanup on unmount: every pending rAF id, both setTimeouts (450ms open-delay, 700ms
 *      shine-delay), the IntersectionObserver, the pointermove listener (when added), and every
 *      child node of the <svg> itself.
 *   4. Because of (1) and (3), mount -> cleanup -> mount (React StrictMode's dev-only double
 *      invoke) produces no duplicate <defs> content and no two loops running at once -- the
 *      second mount starts from a fully emptied <svg> and gets a fresh id prefix's worth of
 *      internal state (a fresh `ribCounter`, a fresh `shineAnimations` array, etc.).
 *   5. The <svg> carries `aria-hidden="true" focusable="false"` -- the lettering on the fan is
 *      decorative, not real page content.
 */

import { useEffect, useId, useRef } from "react";
import {
  arc,
  F2,
  HALF,
  LIGHT,
  openAngles,
  openGroup,
  PP,
  smooth,
  type RibAngle,
} from "./silkFanMath";
import { NAN_PALETTE, ORIGINAL_PALETTE } from "./silkFanPalette";

const SVG_NS = "http://www.w3.org/2000/svg";
const XLINK_NS = "http://www.w3.org/1999/xlink";

export interface SilkFanProps {
  /** Replaces the original's `data-text` attribute. Read once, at build time -- rebuilding the
   * whole fan on every keystroke of a live text prop isn't something the original supported
   * either (it read `data-text` once, at script load). */
  text?: string;
  className?: string;
  /** H5: "nan" (default) uses NAN_PALETTE, derived from Nan's own brand tokens; "original" uses
   * ORIGINAL_PALETTE, Lộc's hand-picked colors from reference/nan-landing.js, unchanged. Read once
   * per build -- see the effect's dependency array below -- since every color is baked into
   * gradient stops at construction time; changing it rebuilds the whole fan, same as `text`. */
  palette?: "original" | "nan";
  /** Same unit as the original's own `target` variable: `((clientX / innerWidth) - 0.5) * 5`.
   * When provided, no internal `pointermove` listener is added -- that decision is made once, at
   * mount, based on whether this prop is defined at that moment; it isn't re-evaluated if a
   * caller starts passing a value later without remounting the component. Read through a ref
   * inside the animation loop (see below), so changing the *value* frame to frame never restarts
   * the effect or rebuilds the SVG. */
  tiltTarget?: number;
  /** H3: a shared mutable ref updated ~60x/second by HeroSilkStage's own pointer-field loop
   * (usePointerField), already in the same unit as `target` (`x_normalized * 2.5`, where the
   * original used `((clientX/innerWidth)-0.5)*5`). When provided, takes priority over both
   * tiltTarget and the internal pointermove listener -- see isControlledTilt below -- so one
   * shared, already-smoothed pointer source can drive the fan's tilt, the CSS 3D layer tilt, and
   * both canvases' camera shift together, instead of the fan smoothing its own separate copy. */
  tiltRef?: { current: number };
  /** Called at the exact point the original called `addAll('opened')` inside `done()` -- that
   * call added an 'opened' CSS class to every `.nan-s` element on the page, a page-level
   * integration this standalone component has no equivalent for. Read through a ref, same reason
   * as tiltTarget. */
  onOpened?: () => void;
}

// ─── Small typed handles over the raw SVG nodes ────────────────────────────
// The original attaches ad-hoc properties directly onto <g> DOM nodes (g._sh, g._hi, g._inlay,
// g._gemHi, g._shadow) and reads them back the same way in lightRib/renderSilk. Kept as the same
// pattern here (an intersection type over SVGGElement), rather than restructured into separate
// parallel arrays, to stay as close as possible to "keep the original's approach" -- the whole
// point of this port's rendering strategy in the first place.
type RibNode = SVGGElement & {
  _sh: SVGStopElement[];
  _hi: SVGStopElement[];
  _inlay: SVGLineElement;
  _gemHi?: SVGPathElement[];
};

interface HalfFace {
  cpp: SVGPathElement;
  base: SVGPathElement;
  tr: SVGGElement;
  gd: SVGLinearGradientElement;
  gl: SVGLinearGradientElement;
  sd: SVGStopElement[];
  sl: SVGStopElement[];
  shade: SVGPathElement;
  light: SVGPathElement;
  sh: SVGPathElement;
}

interface SilkFanConfig {
  cx: number;
  cy: number;
  r1: number;
  r2: number;
  half: number;
  n: number;
  slat: number;
  tail: number;
  deco: number;
  text: { value: string; size: number; spacing: number };
}

interface SilkFanBuild {
  o: SilkFanConfig;
  S: number;
  rays: SVGGElement;
  fanG: SVGGElement;
  sheen: SVGLinearGradientElement;
  ribs: (RibNode | undefined)[];
  halves: HalfFace[];
  ridges: (SVGPathElement | undefined)[];
  creases: SVGPathElement[];
  guards: RibNode[];
  inner: SVGPathElement;
  rim: SVGPathElement;
}

export default function SilkFan({
  text = "NAN",
  className,
  tiltTarget,
  tiltRef,
  onOpened,
  palette = "nan",
}: SilkFanProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const activePalette = palette === "original" ? ORIGINAL_PALETTE : NAN_PALETTE;

  // Sanitized per the task's requirement: useId()'s raw value (e.g. ":r0:") contains characters
  // that are invalid inside a url(#...) reference or a bare id attribute.
  const rawId = useId();
  const idPrefix = rawId.replace(/[^a-zA-Z0-9_-]/g, "");

  const tiltTargetRef = useRef(tiltTarget);
  const onOpenedRef = useRef(onOpened);
  useEffect(() => {
    tiltTargetRef.current = tiltTarget;
  }, [tiltTarget]);
  useEffect(() => {
    onOpenedRef.current = onOpened;
  }, [onOpened]);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    // A fresh binding, not just narrowing `svg` in place: TypeScript's control-flow narrowing of
    // a closed-over `SVGSVGElement | null` doesn't reliably persist inside the nested function
    // declarations below (buildSilk, idleSilk, the cleanup closure) -- a new const initialized
    // from the already-narrowed `svg` keeps the non-null type permanently, since a const's own
    // inferred type never needs re-checking the way a captured outer variable's does.
    const svgEl: SVGSVGElement = svg;

    const uid = (raw: string) => idPrefix + raw;

    function el<K extends keyof SVGElementTagNameMap>(
      tag: K,
      attrs: Record<string, string | number>,
      parent?: Node,
    ): SVGElementTagNameMap[K] {
      const e = document.createElementNS(SVG_NS, tag) as SVGElementTagNameMap[K];
      for (const k in attrs) e.setAttribute(k, String(attrs[k]));
      if (parent) parent.appendChild(e);
      return e;
    }

    // ─── bambooRib -- flat bamboo slat with live lighting (ported from lines 221-246) ─────────
    let ribCounter = 0;
    function slatPath(tail: number, rEnd: number, w0: number, w1: number, flat?: boolean): string {
      const h0 = w0 / 2, h1 = w1 / 2;
      const top = flat ? ` L${h1} ${-rEnd}` : ` A${h1} ${h1} 0 0 1 ${h1} ${-rEnd}`;
      return `M${-h0} ${tail} L${-h1} ${-rEnd}${top} L${h0} ${tail} A${h0} ${h0} 0 0 1 ${-h0} ${tail} Z`;
    }
    function bambooRib(
      parent: SVGGElement,
      o: SilkFanConfig,
      rEnd: number,
      w0: number,
      w1: number,
      gradId: string,
      deco?: number[] | null,
      flat?: boolean,
      front?: boolean,
    ): RibNode {
      const g = el("g", {}, parent) as RibNode;
      const id = uid("nanrb" + ribCounter++);
      const d = slatPath(o.tail, rEnd, w0, w1, flat);
      el("path", { d, fill: "rgba(20,14,4,.18)", transform: front ? "translate(3 2.6)" : "translate(1.2 1)" }, g);
      el("path", { d, fill: `url(#${gradId})`, stroke: activePalette.ribSlatStroke, "stroke-width": ".5" }, g);
      const gs = el("linearGradient", { id: id + "s", gradientUnits: "userSpaceOnUse", x1: -w1 / 2, y1: 0, x2: w1 / 2, y2: 0 }, defs);
      const gh = el("linearGradient", { id: id + "h", gradientUnits: "userSpaceOnUse", x1: -w1 / 2, y1: 0, x2: w1 / 2, y2: 0 }, defs);
      g._sh = ["0", ".25", ".75", "1"].map((offset) => el("stop", { offset, "stop-color": activePalette.ribShadeColor, "stop-opacity": "0" }, gs));
      g._hi = ["0", ".3", ".7", "1"].map((offset) => el("stop", { offset, "stop-color": activePalette.ribHighlightColor, "stop-opacity": "0" }, gh));
      el("path", { d, fill: `url(#${id}s)` }, g);
      el("path", { d, fill: `url(#${id}h)` }, g);
      if (!front) el("path", { d, fill: "url(#" + uid("nanRibAO") + ")" }, g);
      g._inlay = el("line", { x1: 0, y1: o.tail - 3, x2: 0, y2: -(rEnd - 5), stroke: activePalette.ribInlayColor, "stroke-width": ".7", opacity: ".8" }, g);
      if (deco) {
        g._gemHi = [];
        deco.forEach((r) => {
          const dd = (w0 + (w1 - w0) * ((r + o.tail) / (rEnd + o.tail))) * 0.28;
          const gd = `M0 ${-r - dd * 1.6} L${dd} ${-r} L0 ${-r + dd * 1.6} L${-dd} ${-r} Z`;
          el("path", { d: gd, fill: activePalette.gemFill, stroke: activePalette.gemStroke, "stroke-width": ".4" }, g);
          g._gemHi!.push(el("path", { d: gd, fill: activePalette.gemHighlightFill, opacity: "0" }, g));
        });
      }
      return g;
    }

    // ─── lightRib -- per-rib lighting from a fixed light direction (ported from lines 247-261) ─
    function lightRib(g: RibNode | undefined, theta: number): void {
      if (!g || !g._hi) return;
      const th = (theta * Math.PI) / 180, ct = Math.cos(th), st = Math.sin(th);
      const side = ct * LIGHT[0] + st * LIGHT[1];
      const tl = 0.17;
      const N: [number, number, number] = [-Math.sin(tl) * ct, -Math.sin(tl) * st, Math.cos(tl)];
      const nl = Math.max(0, N[0] * LIGHT[0] + N[1] * LIGHT[1] + N[2] * LIGHT[2]);
      const spec = Math.pow(Math.max(0, N[0] * HALF[0] + N[1] * HALF[1] + N[2] * HALF[2]), 14);
      const base = Math.max(0, Math.min(0.3, (0.95 - (0.45 + 0.6 * nl)) * 0.6));
      const l = Math.max(0, -side), r = Math.max(0, side);
      g._hi[0].setAttribute("stop-opacity", (0.42 * l).toFixed(3));
      g._hi[3].setAttribute("stop-opacity", (0.42 * r).toFixed(3));
      g._sh[0].setAttribute("stop-opacity", (0.3 * r).toFixed(3));
      g._sh[3].setAttribute("stop-opacity", (0.3 * l).toFixed(3));
      g._sh[1].setAttribute("stop-opacity", base.toFixed(3));
      g._sh[2].setAttribute("stop-opacity", base.toFixed(3));
      g._inlay.setAttribute("opacity", (0.5 + 0.45 * spec).toFixed(3));
      if (g._gemHi) g._gemHi.forEach((p) => p.setAttribute("opacity", (spec * 0.9).toFixed(3)));
    }

    // ─── buildSilk -- constructs the whole fan's static DOM (ported from lines 148-219) ────────
    const defs = el("defs", {}, svgEl);
    // `window.__nanSilkShine` in the original -- the one-time shine <animate> elements buildSilk
    // creates, triggered later by done()'s 700ms timeout. A local array instead of a global,
    // declared here (not inside buildSilk) so both buildSilk (which populates it) and done()
    // (which reads it, defined further down) close over the exact same array.
    const shineAnimations: SVGAnimateElement[] = [];
    function buildSilk(o: SilkFanConfig): SilkFanBuild {
      const S = (2 * o.half) / o.n;
      const root = el("g", { transform: `translate(${o.cx} ${o.cy})` }, svgEl);
      const rays = el("g", { class: "rays", stroke: activePalette.goldLineStroke, "stroke-width": "1" }, root);
      for (let k = 0; k <= 36; k++) {
        const a = ((-90 + k * 5) * Math.PI) / 180;
        const q0 = o.r2 + 30, q1 = o.r2 + (k % 2 ? 78 : 128);
        el("line", {
          x1: (q0 * Math.sin(a)).toFixed(1), y1: (-q0 * Math.cos(a)).toFixed(1),
          x2: (q1 * Math.sin(a)).toFixed(1), y2: (-q1 * Math.cos(a)).toFixed(1),
          opacity: k % 2 ? ".35" : ".6",
        }, rays);
      }
      el("path", { d: arc(o.r2 + 22, -o.half - 6, o.half + 6), fill: "none", stroke: activePalette.goldLineStroke, "stroke-width": "1", opacity: ".5" }, rays);
      const fanG = el("g", {}, root);

      // silk: opaque sapphire, a touch deeper at the inner edge
      const kk = (o.r1 / (o.r2 + 20)).toFixed(3);
      const sg = el("radialGradient", { id: uid("nanSilk"), gradientUnits: "userSpaceOnUse", cx: 0, cy: 0, r: o.r2 + 20 }, defs);
      ([[kk, activePalette.silkStops[0]], [".6", activePalette.silkStops[1]], [".88", activePalette.silkStops[2]], ["1", activePalette.silkStops[3]]] as const)
        .forEach(([offset, color]) => el("stop", { offset, "stop-color": color }, sg));
      // moving sheen band
      const sheen = el("linearGradient", { id: uid("nanSheen"), gradientUnits: "userSpaceOnUse", x1: -1100, y1: 0, x2: -800, y2: 0, gradientTransform: "rotate(-28)" }, defs);
      ([["0", "0"], [".5", ".8"], ["1", "0"]] as const).forEach(([offset, op]) =>
        el("stop", { offset, "stop-color": activePalette.sheenColor, "stop-opacity": op }, sheen));
      // fine weave
      const pat = el("pattern", { id: uid("nanWeave"), patternUnits: "userSpaceOnUse", width: 4, height: 4 }, defs);
      el("path", { d: "M0 4 L4 0", stroke: activePalette.weaveStroke, "stroke-width": ".5", opacity: ".5" }, pat);
      // gold foil ink + one-time shine
      const foil = el("linearGradient", { id: uid("nanSilkFoil"), gradientUnits: "userSpaceOnUse", x1: -220, y1: -380, x2: 220, y2: -250 }, defs);
      (["0", ".28", ".5", ".72", "1"] as const).forEach((offset, i) =>
        el("stop", { offset, "stop-color": activePalette.goldFoilStops[i] }, foil));
      const shine = el("linearGradient", { id: uid("nanSilkShine"), gradientUnits: "userSpaceOnUse", x1: -760, y1: 0, x2: -500, y2: 0 }, defs);
      ([["0", "0"], [".5", ".85"], ["1", "0"]] as const).forEach(([offset, op]) =>
        el("stop", { offset, "stop-color": activePalette.silkShineColor, "stop-opacity": op }, shine));
      ([["x1", -760, 420], ["x2", -500, 680]] as const).forEach(([attributeName, from, to]) => {
        shineAnimations.push(el("animate", {
          attributeName, from, to, dur: "2.2s", calcMode: "spline", keyTimes: "0;1", keySplines: ".45 0 .25 1", begin: "indefinite", fill: "freeze",
        }, shine));
      });

      // the word, laid out flat as if the fan were fully open; each fold shows its own slice
      const R = (o.r1 + o.r2) / 2 + 4;
      el("path", { id: uid("nanSilkArc"), d: arc(R, -50, 50), fill: "none" }, defs);
      const flat = el("g", { id: uid("nanSilkText") }, defs);
      (["url(#" + uid("nanSilkFoil") + ")", "url(#" + uid("nanSilkShine") + ")"]).forEach((fill) => {
        const tx = el("text", {
          fill, "font-family": activePalette.fontStack, "font-weight": "400",
          "font-size": o.text.size, "letter-spacing": o.text.spacing,
          "text-anchor": "middle", "dominant-baseline": "middle",
        }, flat);
        const tp = el("textPath", { href: "#" + uid("nanSilkArc"), startOffset: "50%" }, tx);
        tp.setAttributeNS(XLINK_NS, "xlink:href", "#" + uid("nanSilkArc"));
        tp.textContent = o.text.value;
      });

      // natural bamboo: flat face, a touch darker toward the edges
      ([[uid("nanBamboo"), activePalette.bambooFace.inner], [uid("nanBambooG"), activePalette.bambooFace.guard]] as const)
        .forEach(([id, face]) => {
          const lg = el("linearGradient", { id, gradientUnits: "userSpaceOnUse", x1: -o.slat / 2, y1: 0, x2: o.slat / 2, y2: 0 }, defs);
          ([["0", face.edge], [".18", face.mid], [".7", face.mid], ["1", face.edge]] as const)
            .forEach(([offset, color]) => el("stop", { offset, "stop-color": color }, lg));
        });
      const ao = el("linearGradient", { id: uid("nanRibAO"), gradientUnits: "userSpaceOnUse", x1: 0, y1: o.tail, x2: 0, y2: -(o.r1 + 14) }, defs);
      const tot = o.tail + o.r1 + 14;
      ([[0, 0.28], [(o.tail + 45) / tot, 0], [(o.tail + o.r1 - 40) / tot, 0], [1, 0.42]] as const)
        .forEach(([offset, opacity]) => el("stop", { offset: offset.toFixed(3), "stop-color": activePalette.ribAoColor, "stop-opacity": opacity }, ao));

      const F: SilkFanBuild = { o, S, rays, fanG, sheen, ribs: [], halves: [], ridges: [], creases: [], guards: [], inner: undefined as unknown as SVGPathElement, rim: undefined as unknown as SVGPathElement };
      F.guards[1] = bambooRib(fanG, o, o.r2, o.slat * 0.3, o.slat * 0.78, uid("nanBambooG"), null, true); // back guard, behind the fabric
      // inner slats: flat and wide, overlapping near the rivet; they end just under the fabric
      for (let j = o.n - 1; j >= 1; j--) F.ribs[j] = bambooRib(fanG, o, o.r1 + 14, o.slat * 0.24, o.slat * 0.62, uid("nanBamboo"));
      for (let p = 0; p < o.n; p++) {
        for (let s = 0; s < 2; s++) {
          const id = uid("nanhc" + p + "_" + s);
          const cp = el("clipPath", { id, clipPathUnits: "userSpaceOnUse" }, defs);
          const cpp = el("path", {}, cp);
          const g2 = el("g", {}, fanG);
          const base = el("path", { fill: `url(#${uid("nanSilk")})` }, g2);
          el("path", { fill: `url(#${uid("nanWeave")})`, opacity: ".06", "clip-path": `url(#${id})`, d: "M-700 -700H700V200H-700Z" }, g2);
          const tw = el("g", { "clip-path": `url(#${id})` }, g2);
          const tr = el("g", {}, tw);
          const u = el("use", { href: "#" + uid("nanSilkText") }, tr);
          u.setAttributeNS(XLINK_NS, "xlink:href", "#" + uid("nanSilkText"));
          const gd = el("linearGradient", { id: "hd" + id, gradientUnits: "userSpaceOnUse" }, defs);
          const gl = el("linearGradient", { id: "hl" + id, gradientUnits: "userSpaceOnUse" }, defs);
          const sd = ["0", ".5", "1"].map((offset) => el("stop", { offset, "stop-color": activePalette.foldShadeColor, "stop-opacity": "0" }, gd));
          const sl = ["0", ".5", "1"].map((offset) => el("stop", { offset, "stop-color": activePalette.foldLightColor, "stop-opacity": "0" }, gl));
          const shade = el("path", { fill: `url(#hd${id})` }, g2);
          const light = el("path", { fill: `url(#hl${id})` }, g2);
          const sh = el("path", { fill: `url(#${uid("nanSheen")})` }, g2);
          F.halves.push({ cpp, base, tr, gd, gl, sd, sl, shade, light, sh });
        }
      }
      const edges = el("g", { fill: "none", "stroke-linecap": "round" }, fanG);
      for (let j = 1; j < o.n; j++) F.ridges[j] = el("path", { stroke: activePalette.ridgeStroke, "stroke-width": "3.4" }, edges);
      for (let p = 0; p < o.n; p++) F.creases[p] = el("path", { stroke: activePalette.creaseStroke, "stroke-width": "2.4" }, edges);
      F.inner = el("path", { stroke: activePalette.goldLineStroke, "stroke-width": o.deco * 0.9, opacity: ".75" }, edges);
      F.rim = el("path", { stroke: activePalette.goldLineStroke, "stroke-width": o.deco * 1.6, "stroke-linejoin": "round" }, edges);
      F.guards[0] = bambooRib(fanG, o, o.r2, o.slat * 0.3, o.slat * 0.78, uid("nanBambooG"), [48, 95, 190, 260, 330, 400], true, true); // front guard, over the fabric
      el("circle", { r: 10, fill: activePalette.pivotFill, stroke: activePalette.pivotFillStroke, "stroke-width": ".8" }, fanG);
      el("circle", { r: 6.5, fill: "none", stroke: activePalette.pivotRingStroke, "stroke-width": ".8", opacity: ".8" }, fanG);
      el("circle", { r: 3.2, fill: activePalette.pivotCenterFill }, fanG);

      return F;
    }

    // ─── renderSilk -- per-frame geometry + lighting (ported from lines 268-317) ───────────────
    function renderSilk(F: SilkFanBuild, ang: number[], g: { rot: number; dy: number; sc: number; sheenX: number }): void {
      const o = F.o, S = F.S, r1 = o.r1, r2 = o.r2;
      let rimD = "", inD = "";
      F.fanG.setAttribute("transform", `translate(0 ${g.dy.toFixed(2)}) rotate(${g.rot.toFixed(3)}) scale(${g.sc.toFixed(4)})`);
      for (let j = 1; j < o.n; j++) if (F.ribs[j]) F.ribs[j]!.setAttribute("transform", `rotate(${ang[j].toFixed(3)})`);
      F.guards[0].setAttribute("transform", `rotate(${ang[0].toFixed(3)})`);
      F.guards[1].setAttribute("transform", `rotate(${ang[o.n].toFixed(3)})`);
      for (let jl = 1; jl < o.n; jl++) lightRib(F.ribs[jl], ang[jl] + g.rot);
      lightRib(F.guards[0], ang[0] + g.rot);
      lightRib(F.guards[1], ang[o.n] + g.rot);
      const rm = (r1 + r2) / 2;
      for (let p = 0; p < o.n; p++) {
        const a0 = ang[p], a1 = ang[p + 1], c = (a0 + a1) / 2, span = Math.max(a1 - a0, 0.001);
        const cp = Math.max(0.06, Math.min(0.9, (span / S) * 0.9)), sp = Math.sqrt(1 - cp * cp);
        const bump = r2 * 0.03 * (0.35 + sp * 0.65), bow = span * (p % 2 ? 0.07 : -0.07);
        const ov = p > 0 ? Math.min(S * 0.22, (1 - cp) * S * 0.3) : 0, a0e = a0 - ov;
        const A0o = PP(r2, a0e), Co = PP(r2 + bump, c), A1o = PP(r2, a1), A0i = PP(r1, a0e), Ci = PP(r1 + bump * 0.3, c), A1i = PP(r1, a1);
        const qA = PP(r2 + bump * 0.95, (a0e + c) / 2), qB = PP(r2 + bump * 0.95, (c + a1) / 2), qC = PP(rm + bump * 0.6, c + bow);
        const qIA = PP(r1 + bump * 0.25, (a0e + c) / 2), qIB = PP(r1 + bump * 0.25, (c + a1) / 2);
        const dA = `M${F2(A0i)}L${F2(A0o)}Q${F2(qA)} ${F2(Co)}Q${F2(qC)} ${F2(Ci)}Q${F2(qIA)} ${F2(A0i)}Z`;
        const dB = `M${F2(Ci)}Q${F2(qC)} ${F2(Co)}Q${F2(qB)} ${F2(A1o)}L${F2(A1i)}Q${F2(qIB)} ${F2(Ci)}Z`;
        rimD += `M${F2(A0o)}Q${F2(qA)} ${F2(Co)}Q${F2(qB)} ${F2(A1o)}`;
        inD += `M${F2(A0i)}Q${F2(qIA)} ${F2(Ci)}Q${F2(qIB)} ${F2(A1i)}`;
        const th = ((c + g.rot) * Math.PI) / 180, ct = Math.cos(th), st = Math.sin(th);
        const L: number[] = [], SP: number[] = [];
        for (let s = 0; s < 2; s++) {
          const sg = s ? 1 : -1;
          const N: [number, number, number] = [sg * sp * ct, sg * sp * st, cp];
          L[s] = 0.36 + 0.78 * Math.max(0, N[0] * LIGHT[0] + N[1] * LIGHT[1] + N[2] * LIGHT[2]);
          SP[s] = Math.pow(Math.max(0, N[0] * HALF[0] + N[1] * HALF[1] + N[2] * HALF[2]), 20);
        }
        const lumC = (L[0] + L[1]) / 2, spC = Math.max(SP[0], SP[1]);
        const darkC = Math.max(0, Math.min(0.35, (1 - lumC) * 0.6)), lightC = Math.min(0.32, 0.04 + spC * 0.32 + Math.max(0, lumC - 0.95) * 0.5);
        const darkV = Math.min(0.55, 0.1 + sp * 0.42);
        for (let s = 0; s < 2; s++) {
          const h = F.halves[p * 2 + s], d = s ? dB : dA;
          h.base.setAttribute("d", d); h.cpp.setAttribute("d", d); h.shade.setAttribute("d", d); h.light.setAttribute("d", d); h.sh.setAttribute("d", d);
          const darkF = Math.max(0, Math.min(0.5, (1.02 - L[s]) * 0.8)), lightF = Math.min(0.18, SP[s] * 0.16 + Math.max(0, L[s] - 0.95) * 0.4);
          const V = PP(rm, s ? a1 : a0e), Cm = PP(rm + bump * 0.5, c);
          [h.gd, h.gl].forEach((gr) => {
            gr.setAttribute("x1", V[0].toFixed(1)); gr.setAttribute("y1", V[1].toFixed(1));
            gr.setAttribute("x2", Cm[0].toFixed(1)); gr.setAttribute("y2", Cm[1].toFixed(1));
          });
          h.sd[0].setAttribute("stop-opacity", darkV.toFixed(3)); h.sd[1].setAttribute("stop-opacity", darkF.toFixed(3)); h.sd[2].setAttribute("stop-opacity", darkC.toFixed(3));
          h.sl[0].setAttribute("stop-opacity", "0"); h.sl[1].setAttribute("stop-opacity", lightF.toFixed(3)); h.sl[2].setAttribute("stop-opacity", lightC.toFixed(3));
          h.sh.setAttribute("opacity", Math.min(0.5, 0.08 + SP[s] * 0.42).toFixed(3));
          const flat0 = -o.half + p * S;
          h.tr.setAttribute("transform", `rotate(${(s ? a1 - (flat0 + S) : a0 - flat0).toFixed(3)})`);
        }
        F.creases[p].setAttribute("d", `M${F2(Ci)}Q${F2(qC)} ${F2(Co)}`);
        F.creases[p].setAttribute("opacity", (0.05 + spC * 0.22).toFixed(3));
        if (p > 0 && F.ribs[p]) F.ridges[p]!.setAttribute("d", `M${F2(PP(r1, a0))}L${F2(PP(r2, a0))}`);
      }
      F.rim.setAttribute("d", rimD);
      F.inner.setAttribute("d", inD);
      F.sheen.setAttribute("x1", (g.sheenX - 280).toFixed(1));
      F.sheen.setAttribute("x2", (g.sheenX + 280).toFixed(1));
    }

    // ─── Hero fan init (ported from lines 319-356) ─────────────────────────────────────────────
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const SF = buildSilk({
      cx: 500, cy: 575, r1: 145, r2: 430, half: 78, n: 14, slat: 22, tail: 58, deco: 1,
      text: { value: text || "NAN", size: 130, spacing: 30 },
    });

    // .rays fade-in, ported from reference/nan-landing.css: `.rays,.fan-text{opacity:0;
    // transition:opacity 1.8s ease}` plus the later, same-specificity `.rays{transition-duration:
    // 2.4s}` override that wins by source order -- net rule for .rays alone is `opacity 2.4s ease`,
    // no delay. The original flips this by adding an `.opened` class to the page; this component has
    // no page-level class to hook, so the same opacity flip is applied directly via inline style,
    // right where done() below calls onOpenedRef.current?.() -- the exact point the original added
    // 'opened'. Under prefers-reduced-motion the rays are simply visible from the start with no
    // transition (the task's explicit instruction, not a literal port of the CSS's own reduced-
    // motion rule, which would instead collapse the transition to `.01s`).
    if (reduce) {
      SF.rays.style.opacity = "1";
    } else {
      SF.rays.style.opacity = "0";
      SF.rays.style.transition = "opacity 2.4s ease";
    }

    const NR = SF.o.n;
    const RIBS: RibAngle[] = [];
    for (let jj = 0; jj <= NR; jj++) RIBS.push({ open: -78 + jj * SF.S, k: jj / NR });

    let rafId: number | null = null;
    let idleRafId: number | null = null;
    let openTimeoutId: number | null = null;
    let shineTimeoutId: number | null = null;
    let observer: IntersectionObserver | null = null;
    let pointerMoveHandler: ((e: PointerEvent) => void) | null = null;

    // Controlled once, at mount: if a tiltTarget or tiltRef was supplied when this effect started,
    // the internal pointermove listener is never added at all, and the loop below reads the live
    // value through tiltRef or tiltTargetRef every frame instead.
    const hasTiltRef = tiltRef !== undefined;
    const isControlledTilt = hasTiltRef || tiltTarget !== undefined;
    let internalTilt = 0;

    function done(): void {
      SF.rays.style.opacity = "1";
      onOpenedRef.current?.();
      if (!reduce) {
        shineTimeoutId = window.setTimeout(() => {
          shineAnimations.forEach((a) => a.beginElement?.());
        }, 700);
      }
    }

    function idleSilk(): void {
      let t0: number | null = null;
      let tilt = 0;
      let run = true;
      const TAU = Math.PI * 2;

      if (!isControlledTilt) {
        pointerMoveHandler = (e: PointerEvent) => {
          internalTilt = (e.clientX / window.innerWidth - 0.5) * 5;
        };
        window.addEventListener("pointermove", pointerMoveHandler, { passive: true });
      }

      if ("IntersectionObserver" in window) {
        observer = new IntersectionObserver((entries) => {
          const visible = entries[0].isIntersecting;
          if (visible && !run) {
            run = true;
            idleRafId = requestAnimationFrame(loop);
          }
          run = visible;
        });
        observer.observe(svgEl);
      }

      function loop(ts: number): void {
        if (!run) return;
        if (t0 === null) t0 = ts;
        const s = (ts - t0) / 1000;
        const amp = Math.min(1, s / 2.5);
        const sway = amp * (1.1 * Math.sin((TAU * s) / 6.4) + 0.35 * Math.sin((TAU * s) / 2.7 + 1.3));
        const bob = amp * 2.4 * Math.sin((TAU * s) / 6.4 + 0.8);
        const target = hasTiltRef ? tiltRef!.current : isControlledTilt ? tiltTargetRef.current ?? 0 : internalTilt;
        tilt += (target - tilt) * 0.02;
        const breath = 1 + amp * 0.012 * Math.sin((TAU * s) / 3.3 + 0.4);
        const base = s < 2.6 ? -1100 + 960 * smooth(s / 2.6) : -140;
        const ang = RIBS.map((r) => r.open * breath);
        renderSilk(SF, ang, {
          rot: sway + tilt,
          dy: bob,
          sc: 1,
          sheenX: base + amp * (75 * Math.sin((TAU * s) / 10) + 18 * Math.sin((TAU * s) / 3.7 + 0.6)),
        });
        idleRafId = requestAnimationFrame(loop);
      }
      idleRafId = requestAnimationFrame(loop);
    }

    if (reduce) {
      renderSilk(SF, RIBS.map((r) => r.open), { rot: 0, dy: 0, sc: 1, sheenX: -140 });
      done();
    } else {
      renderSilk(SF, openAngles(0, RIBS), openGroup(0));
      const DUR = 2600;
      let start: number | null = null;
      function frame(ts: number): void {
        if (start === null) start = ts;
        const p = Math.min(1, (ts - start) / DUR);
        renderSilk(SF, openAngles(p, RIBS), openGroup(p));
        if (p < 1) {
          rafId = requestAnimationFrame(frame);
        } else {
          done();
          idleSilk();
        }
      }
      openTimeoutId = window.setTimeout(() => {
        rafId = requestAnimationFrame(frame);
      }, 450);
    }

    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      if (idleRafId !== null) cancelAnimationFrame(idleRafId);
      if (openTimeoutId !== null) window.clearTimeout(openTimeoutId);
      if (shineTimeoutId !== null) window.clearTimeout(shineTimeoutId);
      observer?.disconnect();
      if (pointerMoveHandler) window.removeEventListener("pointermove", pointerMoveHandler);
      while (svgEl.firstChild) svgEl.removeChild(svgEl.firstChild);
    };
    // tiltTarget/onOpened are deliberately read through refs (tiltTargetRef/onOpenedRef) inside the
    // loop instead, per the task's own requirement that changing their value must not restart this
    // effect/rebuild the SVG.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idPrefix, text, palette]);

  return (
    <svg
      ref={svgRef}
      className={className}
      viewBox="-66 9 1132 648.235"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
      focusable="false"
    />
  );
}
