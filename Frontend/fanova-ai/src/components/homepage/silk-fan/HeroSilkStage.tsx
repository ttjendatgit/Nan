"use client";

/**
 * Wraps SilkFan with the three.js space around it: two overlapping <Canvas> layers (dust behind,
 * dust + nothing else in front, both transparent) with the SilkFan SVG sandwiched between them via
 * plain CSS stacking -- there is no real 3D compositing between the SVG and either canvas, the
 * depth illusion comes entirely from that DOM layering (see the task's own framing: "kẹp quạt giữa
 * hai lớp canvas").
 *
 * H3: a single usePointerField ref drives three things every frame, with no React state or prop
 * involved anywhere in the path (see usePointerField.ts's own header for why):
 *   1. The fan wrapper's CSS `transform` (rotateX/rotateY), written directly to the DOM node.
 *   2. SilkFan's own internal tilt, via the new `tiltRef` prop (same ref, read inside SilkFan's
 *      existing render loop).
 *   3. Each canvas's camera position, via a small `useFrame`-based child component rendered inside
 *      each <Canvas> (PointerCameraRig below).
 *
 * Sign convention (the task explicitly leaves this as a judgment call to make and document): pointer
 * field x is positive to the right, y is positive downward (native viewport convention). Every
 * x-driven effect below -- the fan's rotateY, SilkFan's own tiltRef-driven rotation (inherited
 * unchanged from the original page's own `target` formula), and both cameras' x-shift -- uses the
 * *same* sign of pointer.x, differing only in magnitude (front camera shifts much more than back).
 * That's what keeps "the fan's tilt direction" and "the dust's slide direction" from ever
 * contradicting each other, and what makes the front layer visibly outrun the back layer -- the
 * single depth cue this task is about. Y-driven effects (rotateX, camera.position.y) are sign-
 * flipped where they cross from the DOM's y-down screen space into three.js's y-up world space,
 * same reasoning already used for stageConfig.ts's glowConfig.offsetY.
 */

import {
  Component,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type ReactNode,
  type RefObject,
} from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import SilkFan from "./SilkFan";
import GoldDust from "./GoldDust";
import Glow from "./Glow";
import { appearanceFadeEasing, appearanceFadeMs, cameraConfig, mergeStageConfig, type StageConfig } from "./stageConfig";
import { usePointerField, type PointerFieldValue } from "./usePointerField";
import { NAN_PALETTE, ORIGINAL_PALETTE } from "./silkFanPalette";

export interface HeroSilkStageProps {
  text?: string;
  className?: string;
  /** Overrides individual fields of DEFAULT_STAGE_CONFIG -- see stageConfig.ts. Only used by the
   * dev-only TuningPanel today; every real caller can omit it and get the defaults. */
  config?: Partial<StageConfig>;
}

// Reads a media query as external browser state via useSyncExternalStore, rather than reading it
// once and pushing the result into state from inside a useEffect (which is exactly the "setState
// synchronously within an effect" pattern this project's lint config flags). As a side benefit this
// also tracks live changes (e.g. the OS-level reduced-motion setting, or resizing across the mobile
// breakpoint) instead of only the value at mount.
function subscribeToMediaQuery(query: string, onChange: () => void): () => void {
  const mql = window.matchMedia(query);
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
}
function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => subscribeToMediaQuery(query, onChange),
    () => window.matchMedia(query).matches,
    () => false,
  );
}

// Same minimal pattern as HeroCanvas.tsx's own (unexported) CanvasErrorBoundary: if anything in a
// WebGL layer throws (unsupported WebGL, a driver/context failure), that layer just renders
// nothing. SilkFan lives outside both boundaries entirely, so a space failure can never take the
// fan down with it.
class SpaceErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

// One per canvas (see HeroSilkStage's header comment for the sign convention). `shift` is the only
// thing that differs between the two instances -- small for the back canvas, large for the front
// one -- which is the whole mechanism behind "the near layer slides more than the far layer".
function PointerCameraRig({ pointerRef, shift }: { pointerRef: RefObject<PointerFieldValue>; shift: number }) {
  useFrame(({ camera }) => {
    const pointer = pointerRef.current;
    camera.position.x = pointer.x * shift;
    camera.position.y = -pointer.y * shift;
    camera.lookAt(0, 0, 0);
  });
  return null;
}

const CANVAS_GL = { antialias: true, alpha: true, powerPreference: "high-performance" as const };

// H5: proactively skip the whole atmosphere (both canvases never mount, SilkFan alone still
// renders) on connections/devices too weak to comfortably afford two extra WebGL contexts and
// particle render loops -- a check SpaceErrorBoundary alone can't make, since it only catches a
// context that *fails*, not one that "succeeds" on hardware unable to render it smoothly.
//
// Three checks, in cheapest-first order:
//   1. saveData / deviceMemory  (synchronous, no context created)
//   2. WebGL probe              (creates + immediately releases a test context)
// The WebGL probe is intentionally deferred to the first moment the canvases are allowed to mount
// (onOpened fires, or reduceMotion is true) -- not at component mount -- so no context is ever
// created before the fan finishes its own opening animation. The result is cached in the
// atmosphereEnabled state (null until probed) and never re-computed on re-renders or palette
// switches.
function canUseAtmosphere(): boolean {
  // Guard: must be client-side (its only caller is a useEffect, which already ensures this, but keep the check inside
  // the function so it is safe to call from anywhere without SSR risk).
  if (typeof window === "undefined" || typeof navigator === "undefined") return false;

  // navigator.connection and navigator.deviceMemory are non-standard (Chromium-only) and absent
  // from lib.dom.d.ts -- narrowed locally rather than widening the global Navigator type.
  const nav = navigator as Navigator & {
    connection?: { saveData?: boolean };
    deviceMemory?: number;
  };
  // Cheap checks first -- return false without touching a canvas element at all.
  if (nav.connection?.saveData === true) return false;
  if (typeof nav.deviceMemory === "number" && nav.deviceMemory <= 2) return false;

  // WebGL probe: create, test, and immediately release a test context. Must probe "webgl2" --
  // not "webgl" -- because Three.js ≥ r163 calls getContext("webgl2") exclusively (see
  // WebGLRenderer.js line 389 in three@0.184.0: `const contextName = 'webgl2'`). A device that
  // supports WebGL 1 but not WebGL 2 would pass a webgl probe and then fail at renderer creation.
  // WEBGL_lose_context is the standard mechanism for explicit release so this probe context never
  // itself consumes one of the browser's limited concurrent WebGL context slots. The extension is
  // optional (not all drivers expose it); the optional-chain ?.loseContext() handles absence
  // correctly -- the context is still eventually GC'd by the browser; we just can't release it
  // eagerly in that case.
  try {
    const testCanvas = document.createElement("canvas");
    const gl = testCanvas.getContext("webgl2");
    if (!gl) return false;
    gl.getExtension("WEBGL_lose_context")?.loseContext();
  } catch {
    return false;
  }

  return true;
}

// H3-polish: fades each of the two canvas wrappers' four edges to transparent instead of cutting
// particles off with a hard rectangle at the container's border. Two linear-gradient mask layers
// (one horizontal, one vertical) combined with mask-composite: intersect -- a pixel is only opaque
// where *both* gradients are opaque, which is exactly the region away from all four edges. Never
// applied to the SilkFan layer (see the JSX below -- only the two canvas wrapper divs get this).
function edgeFadeMaskStyle(fadePercent: number): CSSProperties {
  const fade = `${fadePercent}%`;
  const horizontal = `linear-gradient(to right, transparent, black ${fade}, black calc(100% - ${fade}), transparent)`;
  const vertical = `linear-gradient(to bottom, transparent, black ${fade}, black calc(100% - ${fade}), transparent)`;
  const maskImage = `${horizontal}, ${vertical}`;
  return {
    maskImage,
    WebkitMaskImage: maskImage,
    maskComposite: "intersect",
    WebkitMaskComposite: "source-in",
  } as CSSProperties;
}

export default function HeroSilkStage({ text, className, config }: HeroSilkStageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const fanTiltRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);
  const [opened, setOpened] = useState(false);

  // H5 (timing fix): atmosphereEnabled is determined lazily, but only at the first moment the
  // canvases are allowed to mount (onOpened fires, or reduceMotion allows static mount) -- not at
  // component mount. This guarantees canUseAtmosphere()'s WebGL probe never runs before the fan
  // finishes its own opening animation. null = "probe not yet run"; true/false = result cached.
  const [atmosphereEnabled, setAtmosphereEnabled] = useState<boolean | null>(null);

  const reduceMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const coarsePointer = useMediaQuery("(pointer: coarse)");
  const smallScreen = useMediaQuery("(max-width: 767px)");
  const reducedParticles = coarsePointer || smallScreen;

  // H5 (timing fix): run canUseAtmosphere() exactly once, at the first moment a canvas mount is
  // allowed. The mount is allowed when (opened || reduceMotion) -- same condition as
  // shouldMountCanvases below. Before that moment: atmosphereEnabled === null ("probe not yet run"),
  // and shouldMountCanvases is always false, so no canvas renders. After the probe: state holds the
  // boolean and the one re-render that follows evaluates shouldMountCanvases with the real result.
  useEffect(() => {
    if (atmosphereEnabled !== null) return; // already checked, never re-run
    if (!opened && !reduceMotion) return;   // not yet allowed to mount
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAtmosphereEnabled(canUseAtmosphere());
  }, [opened, reduceMotion, atmosphereEnabled]);

  const stage = mergeStageConfig(config);
  const activePalette = stage.palette === "original" ? ORIGINAL_PALETTE : NAN_PALETTE;

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver((entries) => {
      setVisible(entries[0].isIntersecting);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Already gated correctly (verified for H3-polish): passed straight into both <Canvas>
  // components' `frameloop` prop below, which is R3F's own documented mechanism for halting its
  // internal render loop entirely -- no per-useFrame-subscriber gating needed for GoldDust, Glow,
  // or PointerCameraRig.
  const frameloop: "always" | "never" = visible ? "always" : "never";

  // The one shared pointer source (see this file's header comment). `active` reuses the same
  // IntersectionObserver-derived `visible` state above instead of usePointerField creating a
  // second observer. Already gated correctly (verified for H3-polish): usePointerField's own effect
  // depends on `active` and returns early without scheduling a frame when it's false.
  const pointerRef = usePointerField({
    damping: stage.parallax.damping,
    idleAmplitude: stage.parallax.idleAmplitude,
    idlePeriodSec: stage.parallax.idlePeriodSec,
    active: visible,
    reduceMotion,
    coarsePointer,
  });

  // SilkFan reads this every frame through its own tiltRef prop (see SilkFan.tsx) -- same unit as
  // the original page's own `target` variable (`x_normalized * 2.5`).
  const tiltRef = useRef(0);

  // The one DOM-side rAF loop that turns the shared pointer field into a) SilkFan's tiltRef and b)
  // the fan wrapper's CSS 3D transform. Both canvases' camera shift is handled separately, inside
  // PointerCameraRig's own useFrame -- there's no single place that could update all three at once
  // without either React state (forbidden by this task) or reaching across into another render
  // tree's imperative internals.
  //
  // Already gated correctly on `visible` (verified for H3-polish, see the report): the effect
  // depends on `visible`, so when it flips to false, cleanup cancels the pending rAF and the new
  // effect run returns immediately without scheduling another one -- no code change was needed here.
  //
  // fanTiltDirection (H3-polish) is multiplied into rotateY/rotateX only -- camera dịch +x nghĩa là
  // người xem ở bên phải (moving the camera +x means the viewer stepped right); CSS rotateY(+)
  // makes the fan's right edge recede, matching that same viewer-side move. The switch exists to
  // pick between that "viewer moves" model (fanTiltDirection: 1) and the equally valid "fan turns
  // toward the cursor" model (-1) instead. tiltRef is deliberately left out of this multiplication --
  // it drives SilkFan's own original 2D rotation, unchanged from the original page's own formula.
  useEffect(() => {
    if (reduceMotion) {
      tiltRef.current = 0;
      if (fanTiltRef.current) fanTiltRef.current.style.transform = "";
      return;
    }
    if (!visible) return;

    let rafId: number;
    function loop() {
      const pointer = pointerRef.current;
      tiltRef.current = pointer.x * 2.5;
      const rotateY = pointer.x * stage.parallax.fanMaxTiltYDeg * stage.parallax.fanTiltDirection;
      const rotateX = -pointer.y * stage.parallax.fanMaxTiltXDeg * stage.parallax.fanTiltDirection;
      if (fanTiltRef.current) {
        fanTiltRef.current.style.transform = `rotateX(${rotateX.toFixed(3)}deg) rotateY(${rotateY.toFixed(3)}deg)`;
      }
      rafId = requestAnimationFrame(loop);
    }
    rafId = requestAnimationFrame(loop);

    return () => cancelAnimationFrame(rafId);
  }, [
    reduceMotion,
    visible,
    pointerRef,
    stage.parallax.fanMaxTiltYDeg,
    stage.parallax.fanMaxTiltXDeg,
    stage.parallax.fanTiltDirection,
  ]);

  // Both layers fade in together, in lockstep with the fan's own rays (see SilkFan.tsx's H1-fix) --
  // same 2.4s ease, triggered by the same onOpened callback. Under reduced motion there is no fade
  // at all: the space is simply visible at its target opacity from the first frame.
  const spaceOpacity = reduceMotion || opened ? 1 : 0;
  const spaceTransition = reduceMotion ? "none" : `opacity ${appearanceFadeMs}ms ${appearanceFadeEasing}`;

  const backCount = reducedParticles ? stage.back.countReduced : stage.back.count;
  const frontCount = reducedParticles ? stage.front.countReduced : stage.front.count;

  // H5: neither <Canvas> mounts (no WebGL context created at all) until SilkFan's own opening
  // animation finishes and calls onOpened -- previously both mounted immediately on page load,
  // competing with the fan's own opening tween for the main thread. Once mounted, the existing
  // 2.4s CSS opacity fade (spaceOpacity/spaceTransition above) still runs exactly as before -- the
  // wrapper divs are always in the DOM, so their own opacity transition animates normally even
  // though a Canvas is being inserted into them in the same commit.
  //
  // Required check (H5's own "bắt buộc kiểm"): does onOpened fire under prefers-reduced-motion?
  // Yes -- SilkFan.tsx's reduced-motion branch calls `done()` synchronously in its mount effect,
  // and done() calls onOpenedRef.current?.() unconditionally (not gated on `!reduce`), so `opened`
  // here does flip to true almost immediately even under reduced motion. `reduceMotion` is included
  // in the condition below anyway, as an explicit, defensive second path -- both because it's
  // exactly the literal fallback the task describes ("canvas phải mount ngay ở trạng thái tĩnh
  // trong nhánh reduced-motion") and as a safeguard against a future change to SilkFan.tsx
  // accidentally breaking that onOpened call without anyone noticing it also silently stalls the
  // atmosphere forever.
  // Canvas mounts iff:
  //   1. The atmosphere probe has run AND returned true (atmosphereEnabled === true).
  //   2. The fan has opened OR reduced-motion allows static mount.
  // Before the probe runs (atmosphereEnabled === null), this is always false -- no canvas, no
  // WebGL context.
  const shouldMountCanvases = atmosphereEnabled === true && (opened || reduceMotion);

  return (
    <div ref={containerRef} className={`relative ${className ?? ""}`}>
      {/* Layer 1: dust + glow, behind the fan */}
      <div
        aria-hidden="true"
        className="absolute inset-0 z-0"
        style={{ opacity: spaceOpacity, transition: spaceTransition, ...edgeFadeMaskStyle(stage.edgeFadePercent) }}
      >
        {shouldMountCanvases && (
          <SpaceErrorBoundary>
            <Canvas
              camera={cameraConfig}
              style={{ background: "transparent" }}
              gl={CANVAS_GL}
              dpr={[1, 1.5]}
              frameloop={frameloop}
              onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}
            >
              <PointerCameraRig pointerRef={pointerRef} shift={stage.parallax.backCameraShift} />
              <Glow
                color={activePalette.goldLineStroke}
                offsetX={stage.glow.offsetX}
                offsetY={stage.glow.offsetY}
                z={stage.glow.z}
                radius={stage.glow.radius}
                intensity={stage.glow.intensity}
                blending={stage.glow.blending}
              />
              <GoldDust
                count={backCount}
                sizeRange={stage.back.sizeRange}
                opacityRange={stage.back.opacityRange}
                depthRange={stage.back.depthRange}
                speed={stage.back.speed}
                spreadX={stage.back.spreadX}
                spreadY={stage.back.spreadY}
                swayAmplitude={stage.back.swayAmplitude}
                swayFrequency={stage.back.swayFrequency}
                blending={stage.back.blending}
                color={activePalette.goldLineStroke}
                motionEnabled={!reduceMotion}
              />
            </Canvas>
          </SpaceErrorBoundary>
        )}
      </div>

      {/* Layer 2: the fan itself, in a perspective wrapper for the CSS 3D tilt */}
      <div className="absolute inset-0 z-10" style={{ perspective: `${stage.parallax.perspectivePx}px` }}>
        <div ref={fanTiltRef} className="h-full w-full" style={{ transformStyle: "preserve-3d" }}>
          <SilkFan
            text={text}
            tiltRef={tiltRef}
            onOpened={() => setOpened(true)}
            className="h-full w-full"
            palette={stage.palette}
          />
        </div>
      </div>

      {/* Layer 3: sparse, larger, fainter dust, in front of the fan */}
      <div
        aria-hidden="true"
        className="absolute inset-0 z-20 pointer-events-none"
        style={{ opacity: spaceOpacity, transition: spaceTransition, ...edgeFadeMaskStyle(stage.edgeFadePercent) }}
      >
        {shouldMountCanvases && (
          <SpaceErrorBoundary>
            <Canvas
              camera={cameraConfig}
              style={{ background: "transparent" }}
              gl={CANVAS_GL}
              dpr={[1, 1.5]}
              frameloop={frameloop}
              onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}
            >
              <PointerCameraRig pointerRef={pointerRef} shift={stage.parallax.frontCameraShift} />
              <GoldDust
                count={frontCount}
                sizeRange={stage.front.sizeRange}
                opacityRange={stage.front.opacityRange}
                depthRange={stage.front.depthRange}
                speed={stage.front.speed}
                spreadX={stage.front.spreadX}
                spreadY={stage.front.spreadY}
                swayAmplitude={stage.front.swayAmplitude}
                swayFrequency={stage.front.swayFrequency}
                blending={stage.front.blending}
                color={activePalette.goldLineStroke}
                motionEnabled={!reduceMotion}
              />
            </Canvas>
          </SpaceErrorBoundary>
        )}
      </div>
    </div>
  );
}
