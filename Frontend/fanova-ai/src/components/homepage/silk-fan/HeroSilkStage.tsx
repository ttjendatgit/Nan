"use client";

/**
 * Wraps SilkFan with the three.js space around it: two overlapping <Canvas> layers (dust behind,
 * dust + nothing else in front, both transparent) with the SilkFan SVG sandwiched between them via
 * plain CSS stacking -- there is no real 3D compositing between the SVG and either canvas, the
 * depth illusion comes entirely from that DOM layering (see the task's own framing: "kẹp quạt giữa
 * hai lớp canvas"). H2 has no pointer interaction or parallax -- both are H3.
 */

import { Component, useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { Canvas } from "@react-three/fiber";
import SilkFan from "./SilkFan";
import GoldDust from "./GoldDust";
import Glow from "./Glow";
import { appearanceFadeEasing, appearanceFadeMs, cameraConfig, dustConfig, glowConfig } from "./stageConfig";
import * as palette from "./silkFanPalette";

export interface HeroSilkStageProps {
  text?: string;
  className?: string;
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

const CANVAS_GL = { antialias: true, alpha: true, powerPreference: "high-performance" as const };

export default function HeroSilkStage({ text, className }: HeroSilkStageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);
  const [opened, setOpened] = useState(false);

  const reduceMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const coarsePointer = useMediaQuery("(pointer: coarse)");
  const smallScreen = useMediaQuery("(max-width: 767px)");
  const reducedParticles = coarsePointer || smallScreen;

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver((entries) => {
      setVisible(entries[0].isIntersecting);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const frameloop: "always" | "never" = visible ? "always" : "never";

  // Both layers fade in together, in lockstep with the fan's own rays (see SilkFan.tsx's H1-fix) --
  // same 2.4s ease, triggered by the same onOpened callback. Under reduced motion there is no fade
  // at all: the space is simply visible at its target opacity from the first frame.
  const spaceOpacity = reduceMotion || opened ? 1 : 0;
  const spaceTransition = reduceMotion ? "none" : `opacity ${appearanceFadeMs}ms ${appearanceFadeEasing}`;

  const backCount = reducedParticles ? dustConfig.back.countReduced : dustConfig.back.count;
  const frontCount = reducedParticles ? dustConfig.front.countReduced : dustConfig.front.count;

  return (
    <div ref={containerRef} className={`relative ${className ?? ""}`}>
      {/* Layer 1: dust + glow, behind the fan */}
      <div
        aria-hidden="true"
        className="absolute inset-0 z-0"
        style={{ opacity: spaceOpacity, transition: spaceTransition }}
      >
        <SpaceErrorBoundary>
          <Canvas
            camera={cameraConfig}
            style={{ background: "transparent" }}
            gl={CANVAS_GL}
            dpr={[1, 1.5]}
            frameloop={frameloop}
            onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}
          >
            <Glow
              color={palette.goldLineStroke}
              offsetX={glowConfig.offsetX}
              offsetY={glowConfig.offsetY}
              z={glowConfig.z}
              radius={glowConfig.radius}
              intensity={glowConfig.intensity}
            />
            <GoldDust
              count={backCount}
              sizeRange={dustConfig.back.sizeRange}
              opacityRange={dustConfig.back.opacityRange}
              depthRange={dustConfig.back.depthRange}
              speed={dustConfig.back.speed}
              spreadX={dustConfig.back.spreadX}
              spreadY={dustConfig.back.spreadY}
              swayAmplitude={dustConfig.back.swayAmplitude}
              swayFrequency={dustConfig.back.swayFrequency}
              color={palette.goldLineStroke}
              motionEnabled={!reduceMotion}
            />
          </Canvas>
        </SpaceErrorBoundary>
      </div>

      {/* Layer 2: the fan itself */}
      <div className="absolute inset-0 z-10">
        <SilkFan text={text} onOpened={() => setOpened(true)} className="h-full w-full" />
      </div>

      {/* Layer 3: sparse, larger, fainter dust, in front of the fan */}
      <div
        aria-hidden="true"
        className="absolute inset-0 z-20 pointer-events-none"
        style={{ opacity: spaceOpacity, transition: spaceTransition }}
      >
        <SpaceErrorBoundary>
          <Canvas
            camera={cameraConfig}
            style={{ background: "transparent" }}
            gl={CANVAS_GL}
            dpr={[1, 1.5]}
            frameloop={frameloop}
            onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}
          >
            <GoldDust
              count={frontCount}
              sizeRange={dustConfig.front.sizeRange}
              opacityRange={dustConfig.front.opacityRange}
              depthRange={dustConfig.front.depthRange}
              speed={dustConfig.front.speed}
              spreadX={dustConfig.front.spreadX}
              spreadY={dustConfig.front.spreadY}
              swayAmplitude={dustConfig.front.swayAmplitude}
              swayFrequency={dustConfig.front.swayFrequency}
              color={palette.goldLineStroke}
              motionEnabled={!reduceMotion}
            />
          </Canvas>
        </SpaceErrorBoundary>
      </div>
    </div>
  );
}
